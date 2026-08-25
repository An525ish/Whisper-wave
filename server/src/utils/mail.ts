import { OAuth2Client } from 'google-auth-library';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env, isProd } from '../config/env.js';
import { toBase64Url } from './helper.js';
import { logger } from './logger.js';

type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

const isGmailApiConfigured = (): boolean =>
  Boolean(env.GOOGLE_CLIENT_ID) &&
  Boolean(env.GMAIL_CLIENT_SECRET) &&
  Boolean(env.GMAIL_REFRESH_TOKEN) &&
  Boolean(env.SMTP_USER);

export const isMailConfigured = (): boolean =>
  isGmailApiConfigured() ||
  (Boolean(env.SMTP_HOST) && Boolean(env.SMTP_USER) && Boolean(env.SMTP_PASS));

let _gmailClient: OAuth2Client | null = null;
let _smtpTransporter: Transporter | null = null;

const getGmailClient = (): OAuth2Client => {
  if (_gmailClient) return _gmailClient;
  const client = new OAuth2Client(
    env.GOOGLE_CLIENT_ID,
    env.GMAIL_CLIENT_SECRET
  );
  client.setCredentials({ refresh_token: env.GMAIL_REFRESH_TOKEN });
  _gmailClient = client;
  return client;
};

const getSmtpTransporter = (): Transporter => {
  if (_smtpTransporter) return _smtpTransporter;
  _smtpTransporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
  return _smtpTransporter;
};

const buildRawMime = (
  from: string,
  { to, subject, text, html }: SendMailInput
): string => {
  const boundary = `ww_${Date.now()}`;
  return [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    text,
    `--${boundary}`,
    'Content-Type: text/html; charset=utf-8',
    '',
    html,
    `--${boundary}--`,
  ].join('\r\n');
};

const sendViaGmailApi = async (
  from: string,
  input: SendMailInput
): Promise<void> => {
  const client = getGmailClient();
  const { token } = await client.getAccessToken();
  if (!token) {
    throw new Error('Failed to obtain Gmail access token from refresh token');
  }

  const res = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: toBase64Url(buildRawMime(from, input)) }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gmail API send failed (${res.status}): ${body}`);
  }
};

const sendViaSmtp = async (
  from: string,
  input: SendMailInput
): Promise<void> => {
  const transporter = getSmtpTransporter();
  await transporter.sendMail({
    from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
};

export const sendMail = async (input: SendMailInput): Promise<void> => {
  if (!isMailConfigured()) {
    logger.info(
      { to: input.to, subject: input.subject, text: input.text },
      '[mail] not configured — message logged (set GMAIL_REFRESH_TOKEN or SMTP_HOST/USER/PASS)'
    );
    return;
  }

  const from = env.SMTP_FROM || env.SMTP_USER;
  const viaGmailApi = isGmailApiConfigured();

  if (viaGmailApi) {
    await sendViaGmailApi(from, input);
  } else {
    await sendViaSmtp(from, input);
  }

  if (!isProd) {
    logger.debug(
      { to: input.to, subject: input.subject, via: viaGmailApi ? 'gmail-api' : 'smtp' },
      '[mail] sent'
    );
  }
};
