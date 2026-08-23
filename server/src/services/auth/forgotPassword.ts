import { randomBytes } from 'node:crypto';
import * as userRepo from '../../repositories/user.js';
import { isAllowedEmail } from '../../utils/disposableEmail.js';
import { getClientBaseUrl, sendMail } from '../../utils/mail.js';
import { RESET_TOKEN_TTL_MS } from '../../constants/auth.js';
import type { ForgotPasswordInput } from '../../validators/auth.js';
import { normalizeEmail, sha256 } from './shared.js';

export const forgotPassword = async (
  input: ForgotPasswordInput
): Promise<{ message: string }> => {
  const email = normalizeEmail(input.email);
  const message = 'If an account exists for that email, we sent a reset link.';

  if (!isAllowedEmail(email)) return { message };

  const user = await userRepo.findByEmail(email);
  if (!user?.email) return { message };

  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = sha256(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await userRepo.setPasswordReset(user._id.toString(), tokenHash, expiresAt);

  const resetUrl = `${getClientBaseUrl()}/auth/reset-password?token=${rawToken}`;

  await sendMail({
    to: user.email,
    subject: 'Reset your Whisper Wave password',
    text: `Reset your password (link expires in 1 hour):\n\n${resetUrl}\n\nIf you didn't ask for this, you can ignore this email.`,
    html: `
      <p>Reset your Whisper Wave password. This link expires in 1 hour.</p>
      <p><a href="${resetUrl}">Choose a new password</a></p>
      <p>If you didn't ask for this, you can ignore this email.</p>
    `,
  });

  return { message };
};
