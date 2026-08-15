import { createHash, randomBytes, randomInt } from 'node:crypto';
import { compare, hash } from 'bcrypt';
import type { Types } from 'mongoose';
import * as pendingSignupRepo from '../repositories/pendingSignup.js';
import * as userRepo from '../repositories/user.js';
import type { AuthResult, PublicUser } from '../types/user.js';
import type { UploadableFile } from '../types/message.js';
import { AppError } from '../utils/AppError.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { isDisposableEmail } from '../utils/disposableEmail.js';
import { getClientBaseUrl, isMailConfigured, sendMail } from '../utils/mail.js';
import { generateToken } from '../utils/token.js';
import { isProd } from '../config/env.js';
import type {
  ForgotPasswordInput,
  ResetPasswordInput,
  SignInInput,
  SignUpCompleteInput,
  SignUpResendInput,
  SignUpStartInput,
  SignUpVerifyInput,
} from '../validators/auth.js';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const PENDING_TTL_MS = 30 * 60 * 1000;
const OTP_TTL_MS = 10 * 60 * 1000;
const SIGNUP_TOKEN_TTL_MS = 30 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute between resends

const toPublicUser = (user: {
  _id: Types.ObjectId;
  name: string;
  username: string;
  email?: string;
  avatar: { url: string };
  bio?: string;
}): PublicUser & Record<string, unknown> => ({
  _id: user._id,
  name: user.name,
  username: user.username,
  email: user.email,
  avatar: user.avatar.url,
  bio: user.bio,
});

const sha256 = (value: string): string =>
  createHash('sha256').update(value).digest('hex');

const assertMailReady = (): void => {
  if (isProd && !isMailConfigured()) {
    throw new AppError(
      503,
      'Email delivery is not configured. Cannot verify signup.'
    );
  }
};

const assertAcceptableEmail = (email: string): void => {
  if (isDisposableEmail(email)) {
    throw new AppError(
      400,
      'Temporary or disposable emails are not allowed. Use a real inbox.'
    );
  }
};

const issueOtp = (): { otp: string; otpHash: string; otpExpiresAt: Date } => {
  const otp = String(randomInt(100000, 1000000));
  return {
    otp,
    otpHash: sha256(otp),
    otpExpiresAt: new Date(Date.now() + OTP_TTL_MS),
  };
};

const sendSignupOtpMail = async (email: string, otp: string): Promise<void> => {
  await sendMail({
    to: email,
    subject: 'Your Whisper Wave verification code',
    text: `Your verification code is ${otp}. It expires in 10 minutes.\n\nIf you didn’t start signup, ignore this email.`,
    html: `
      <p>Your Whisper Wave verification code:</p>
      <p style="font-size:24px;letter-spacing:4px;font-weight:700">${otp}</p>
      <p>It expires in 10 minutes. If you didn’t start signup, ignore this email.</p>
    `,
  });
};

export const startSignUp = async (
  input: SignUpStartInput
): Promise<{ message: string; email: string }> => {
  assertMailReady();

  const email = input.email.toLowerCase().trim();
  assertAcceptableEmail(email);

  const existing = await userRepo.findByEmail(email);
  if (existing) {
    throw new AppError(409, 'Email already in use');
  }

  const passwordHash = await hash(input.password, 10);
  const { otp, otpHash, otpExpiresAt } = issueOtp();
  const expiresAt = new Date(Date.now() + PENDING_TTL_MS);

  await pendingSignupRepo.upsertByEmail({
    email,
    passwordHash,
    otpHash,
    otpExpiresAt,
    expiresAt,
  });

  await sendSignupOtpMail(email, otp);

  return {
    email,
    message: 'We sent a verification code to your email.',
  };
};

export const resendSignUpOtp = async (
  input: SignUpResendInput
): Promise<{ message: string }> => {
  assertMailReady();

  const email = input.email.toLowerCase().trim();
  const pending = await pendingSignupRepo.findByEmail(email);
  if (!pending || pending.expiresAt.getTime() < Date.now()) {
    throw new AppError(400, 'Start signup again — this session expired.');
  }

  if (pending.emailVerifiedAt) {
    throw new AppError(400, 'Email already verified. Continue to finish signup.');
  }

  if (
    pending.lastResendAt &&
    Date.now() - pending.lastResendAt.getTime() < RESEND_COOLDOWN_MS
  ) {
    const wait = Math.ceil(
      (RESEND_COOLDOWN_MS - (Date.now() - pending.lastResendAt.getTime())) / 1000
    );
    throw new AppError(429, `Please wait ${wait}s before requesting another code.`);
  }

  const { otp, otpHash, otpExpiresAt } = issueOtp();
  await pendingSignupRepo.updateByEmail(email, {
    otpHash,
    otpExpiresAt,
    otpAttempts: 0,
    lastResendAt: new Date(),
  });

  await sendSignupOtpMail(email, otp);

  return { message: 'A new verification code is on its way.' };
};

export const verifySignUpOtp = async (
  input: SignUpVerifyInput
): Promise<{ message: string; signupToken: string }> => {
  const email = input.email.toLowerCase().trim();
  const pending = await pendingSignupRepo.findByEmail(email);

  if (!pending || pending.expiresAt.getTime() < Date.now()) {
    throw new AppError(400, 'Start signup again — this session expired.');
  }

  if (pending.otpAttempts >= MAX_OTP_ATTEMPTS) {
    throw new AppError(429, 'Too many attempts. Request a new code.');
  }

  if (pending.otpExpiresAt.getTime() < Date.now()) {
    throw new AppError(400, 'Code expired. Request a new one.');
  }

  const otpHash = sha256(input.otp);
  if (otpHash !== pending.otpHash) {
    await pendingSignupRepo.incrementOtpAttempts(email);
    throw new AppError(400, 'Incorrect verification code');
  }

  const usernameTaken = await userRepo.findByUsername(input.username);
  if (usernameTaken) {
    throw new AppError(409, 'Username already taken');
  }

  const signupToken = randomBytes(32).toString('hex');
  await pendingSignupRepo.updateByEmail(email, {
    username: input.username,
    emailVerifiedAt: new Date(),
    signupTokenHash: sha256(signupToken),
    signupTokenExpiresAt: new Date(Date.now() + SIGNUP_TOKEN_TTL_MS),
    otpAttempts: 0,
  });

  return {
    signupToken,
    message: 'Email verified. Finish your profile.',
  };
};

export const completeSignUp = async (
  input: SignUpCompleteInput,
  avatarFile?: UploadableFile
): Promise<AuthResult> => {
  if (!avatarFile) {
    throw new AppError(400, 'Please upload an avatar');
  }

  const pending = await pendingSignupRepo.findBySignupTokenHash(
    sha256(input.signupToken)
  );

  if (!pending?.username || !pending.emailVerifiedAt) {
    throw new AppError(
      400,
      'Signup session invalid or expired. Verify your email again.'
    );
  }

  const email = pending.email;
  assertAcceptableEmail(email);

  const [userExist, emailExist] = await Promise.all([
    userRepo.findByUsername(pending.username),
    userRepo.findByEmail(email),
  ]);

  if (userExist) {
    throw new AppError(409, 'Username already taken');
  }
  if (emailExist) {
    throw new AppError(409, 'Email already in use');
  }

  const uploadedAvatar = await uploadToCloudinary([avatarFile]);
  if (!uploadedAvatar.length) {
    throw new AppError(400, 'Failed to upload avatar');
  }

  const user = await userRepo.create({
    name: input.name,
    username: pending.username,
    email,
    password: pending.passwordHash,
    avatar: {
      publicId: uploadedAvatar[0].publicId,
      url: uploadedAvatar[0].url,
    },
    bio: input.bio,
  });

  await pendingSignupRepo.deleteById(pending._id.toString());

  return {
    token: generateToken(user._id.toString()),
    message: 'Registered successfully',
    user: toPublicUser(user),
  };
};

export const signIn = async (input: SignInInput): Promise<AuthResult> => {
  const user = await userRepo.findByUsernameWithPassword(input.username);
  if (!user) {
    throw new AppError(401, 'Invalid Credentials');
  }

  const isMatch = await compare(input.password, user.password);
  if (!isMatch) {
    throw new AppError(401, 'Invalid Credentials');
  }

  return {
    token: generateToken(user._id.toString()),
    message: `Welcome back, ${user.name}`,
    user: toPublicUser(user),
  };
};

export const forgotPassword = async (
  input: ForgotPasswordInput
): Promise<{ message: string }> => {
  const email = input.email.toLowerCase().trim();
  const message =
    'If an account exists for that email, we sent a reset link.';

  if (isDisposableEmail(email)) {
    return { message };
  }

  const user = await userRepo.findByEmail(email);
  if (!user?.email) {
    return { message };
  }

  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = sha256(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await userRepo.setPasswordReset(user._id.toString(), tokenHash, expiresAt);

  const resetUrl = `${getClientBaseUrl()}/auth/reset-password?token=${rawToken}`;

  await sendMail({
    to: user.email,
    subject: 'Reset your Whisper Wave password',
    text: `Reset your password (link expires in 1 hour):\n\n${resetUrl}\n\nIf you didn’t ask for this, you can ignore this email.`,
    html: `
      <p>Reset your Whisper Wave password. This link expires in 1 hour.</p>
      <p><a href="${resetUrl}">Choose a new password</a></p>
      <p>If you didn’t ask for this, you can ignore this email.</p>
    `,
  });

  return { message };
};

export const resetPassword = async (
  input: ResetPasswordInput
): Promise<{ message: string }> => {
  const tokenHash = sha256(input.token);
  const user = await userRepo.findByPasswordResetToken(tokenHash);

  if (!user) {
    throw new AppError(400, 'Reset link is invalid or has expired');
  }

  const hashedPassword = await hash(input.password, 10);
  await userRepo.updateById(user._id.toString(), { password: hashedPassword });
  await userRepo.clearPasswordReset(user._id.toString());

  return { message: 'Password updated. You can sign in now.' };
};
