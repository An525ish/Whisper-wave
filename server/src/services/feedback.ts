import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { sendMail } from '../utils/mail.js';
import type { SubmitFeedbackBody } from '../validators/feedback.js';

const SUBJECT: Record<SubmitFeedbackBody['kind'], string> = {
  app: 'App suggestion',
  feedback: 'Feedback',
  problem: 'Problem report',
};

/** Hard ceiling across all visitors: a botnet of many IPs still cannot flood the inbox. */
const DAILY_CAP = 50;
let dayStart = Date.now();
let sentToday = 0;
const takeDailySlot = (): boolean => {
  if (Date.now() - dayStart > 24 * 60 * 60 * 1000) {
    dayStart = Date.now();
    sentToday = 0;
  }
  return ++sentToday <= DAILY_CAP;
};

/** One line, no control characters: user text never reaches an email header with a newline in it. */
const oneLine = (s: string) => s.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim();

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Emails the maker. Nothing is stored; the message exists only in the inbox. */
export const submitFeedback = async (body: SubmitFeedbackBody): Promise<void> => {
  // Bots fill the hidden field. Pretend it worked so they learn nothing.
  if (body.website) return;
  if (!takeDailySlot()) throw new AppError(429, 'Feedback is paused for today. Please try again tomorrow.');

  const rows: [string, string][] = [];
  if (body.title) rows.push(['App idea', body.title]);
  if (body.rating) rows.push(['Rating', `${body.rating}/5`]);
  if (body.type) rows.push(['Type', body.type]);
  if (body.area) rows.push([body.kind === 'problem' ? 'Where' : 'About', body.area]);
  if (body.expected) rows.push(['Expected', body.expected]);
  rows.push(['Reply to', body.reply || 'not given']);

  const text = `${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\n${body.message}`;
  const html = `${rows.map(([k, v]) => `<p><b>${esc(k)}:</b> ${esc(v)}</p>`).join('')}<p style="white-space:pre-wrap">${esc(body.message)}</p>`;

  await sendMail({
    to: env.FEEDBACK_TO || env.SMTP_USER,
    subject: `[Whisper Wave] ${SUBJECT[body.kind]}${body.title ? `: ${oneLine(body.title)}` : ''}`,
    text,
    html,
  });
};
