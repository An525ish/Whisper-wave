import { randomBytes } from 'node:crypto';
import { hash } from 'bcrypt';
import * as pendingSignupRepo from '../../repositories/pendingSignup.js';
import * as userRepo from '../../repositories/user.js';
import type { AuthResult } from '../../types/user.js';
import type { UploadableFile } from '../../types/message.js';
import { AppError } from '../../utils/AppError.js';
import { sendMail } from '../../utils/mail.js';
import { resolveSignupAvatar } from '../../utils/avatar.js';
import {
  MAX_OTP_ATTEMPTS,
  PENDING_TTL_MS,
  RESEND_COOLDOWN_MS,
  SIGNUP_TOKEN_TTL_MS,
} from '../../constants/auth.js';
import type {
  SignUpCompleteInput,
  SignUpResendInput,
  SignUpStartInput,
  SignUpUpdateUsernameInput,
  SignUpVerifyInput,
} from '../../validators/auth.js';
import { normalizeEmail } from '../../utils/normalize.js';
import {
  assertAcceptableEmail,
  assertMailReady,
  issueAuthResult,
  issueOtp,
  sha256,
} from './shared.js';

const sendSignupOtpMail = async (email: string, otp: string): Promise<void> => {
  await sendMail({
    to: email,
    subject: 'Verification Code',
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

  const email = normalizeEmail(input.email);
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

  const email = normalizeEmail(input.email);
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
  const email = normalizeEmail(input.email);
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

export const updateSignupUsername = async (
  input: SignUpUpdateUsernameInput
): Promise<{ message: string }> => {
  const pending = await pendingSignupRepo.findBySignupTokenHash(
    sha256(input.signupToken)
  );

  if (!pending?.emailVerifiedAt) {
    throw new AppError(400, 'Signup session invalid or expired. Verify your email again.');
  }

  if (pending.username === input.username) {
    return { message: 'Username unchanged.' };
  }

  const taken = await userRepo.findByUsername(input.username);
  if (taken) {
    throw new AppError(409, 'Username already taken');
  }

  await pendingSignupRepo.updateByEmail(pending.email, { username: input.username });

  return { message: 'Username updated.' };
};

export const completeSignUp = async (
  input: SignUpCompleteInput,
  avatarFile?: UploadableFile
): Promise<AuthResult> => {
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

  const [userExist, emailExist, avatar] = await Promise.all([
    userRepo.findByUsername(pending.username),
    userRepo.findByEmail(email),
    resolveSignupAvatar(avatarFile),
  ]);

  if (userExist) {
    throw new AppError(409, 'Username already taken');
  }
  if (emailExist) {
    throw new AppError(409, 'Email already in use');
  }

  const user = await userRepo.create({
    name: input.name,
    username: pending.username,
    email,
    password: pending.passwordHash,
    avatar,
    bio: input.bio,
  });

  await pendingSignupRepo.deleteById(pending._id.toString());

  return issueAuthResult(user, 'Registered successfully');
};
