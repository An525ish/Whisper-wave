import type { RequestHandler } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import { addReminder, listReminderSlugs, removeReminder } from '../services/rooms/reminders.js';

/** PUT /api/rooms/:slug/reminder — notify me when this closed room opens (one-shot). */
export const putReminderController: RequestHandler = catchAsync(async (req, res) => {
  await addReminder(req.userId!, (req.params as { slug: string }).slug);
  res.status(204).end();
});

/** DELETE /api/rooms/:slug/reminder */
export const deleteReminderController: RequestHandler = catchAsync(async (req, res) => {
  await removeReminder(req.userId!, (req.params as { slug: string }).slug);
  res.status(204).end();
});

/** GET /api/rooms/reminders — slugs the caller is waiting on. */
export const listRemindersController: RequestHandler = catchAsync(async (req, res) => {
  res.status(200).json({ success: true, data: { slugs: await listReminderSlugs(req.userId!) } });
});
