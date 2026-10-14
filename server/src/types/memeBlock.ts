import type { Document } from 'mongoose';

/** Content source — only 'jokeapi' today; the field keeps multi-source honest. */
export type MemeBlockSource = 'jokeapi';

export type MemeReportReason = 'offensive' | 'sexual' | 'hateful' | 'broken' | 'other';

export type MemeBlockFields = {
  externalId: number;
  source: MemeBlockSource;
  /** Accepted (deduped) reports so far. Reset when an admin un-blocks. */
  reports: number;
  blocked: boolean;
  /** Most recent report reason, or the admin's note. */
  reason?: string;
  updatedAt: Date;
};

export type IMemeBlock = MemeBlockFields & Document;

/** Admin-facing row of the blocklist (`GET /api/admin/memes/blocklist`). */
export type MemeBlockItem = {
  id: number;
  reports: number;
  blocked: boolean;
  reason?: string;
  updatedAt: string;
};

/** `POST /api/memes/report` body (validated by `memeReportSchema`). */
export type MemeReportBody = {
  externalId: number;
  source: MemeBlockSource;
  reason: MemeReportReason;
};

export type MemeReportResult = {
  /** False when this reporter already reported this joke inside the dedupe window. */
  counted: boolean;
  blocked: boolean;
};
