import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env, isProd } from '../config/env.js';
import { logger } from './logger.js';

type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export const isMailConfigured = (): boolean =>
  Boolean(env.SMTP_HOST) && Boolean(env.SMTP_USER) && Boolean(env.SMTP_PASS);

export const getClientBaseUrl = (): string =>
  env.CLIENT_URL || 'http://localhost:5173';

let _transporter: Transporter | null = null;

const getTransporter = (): Transporter => {
  if (_transporter) return _transporter;
  _transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
  return _transporter;
};

export const sendMail = async (input: SendMailInput): Promise<void> => {
  if (!isMailConfigured()) {
    logger.info(
      { to: input.to, subject: input.subject, text: input.text },
      '[mail] SMTP not configured — message logged (set SMTP_HOST/USER/PASS to send)'
    );
    return;
  }

  const transporter = getTransporter();
  await transporter.sendMail({
    from: env.SMTP_FROM || env.SMTP_USER,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });

  if (!isProd) {
    logger.debug({ to: input.to, subject: input.subject }, '[mail] sent');
  }
};
