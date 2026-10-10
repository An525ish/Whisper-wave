import { z } from 'zod';

const RESERVED_ALIASES = ['wave', 'whisper', 'system', 'admin', 'moderator', 'host'];

/** Pre-join persona form. Mirrors the server's alias/color contract. */
export const roomAliasSchema = z.object({
  alias: z
    .string()
    .trim()
    .min(1, 'Pick a display name')
    .max(24, 'Display names are 24 characters at most')
    .refine((a) => !RESERVED_ALIASES.includes(a.toLowerCase()), 'That name is reserved'),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Pick a color')
    .optional(),
});

export type RoomAliasForm = z.infer<typeof roomAliasSchema>;

/** Room creation form. Slug uniqueness is enforced server-side (409). */
export const createRoomSchema = z.object({
  title: z.string().trim().min(1, 'Give it a title').max(60),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Pick a URL name')
    .max(40)
    .regex(/^[a-z0-9-]+$/, 'Letters, numbers and dashes only')
    .refine((s) => s !== 'new', 'That name is reserved'),
  description: z.string().trim().min(1, 'Say what it is about').max(280),
  // Objects, not bare strings: this RHF version's path types exclude
  // primitive-element arrays from `useFieldArray`. Mapped to string[] on submit.
  rules: z
    .array(
      z.object({
        value: z.string().trim().min(1, 'Rules can’t be blank').max(140),
      })
    )
    .min(1, 'At least one rule')
    .max(6, 'Six rules at most'),
  accept: z.literal(true, {
    error: 'Reads the room — accept the rules to create it',
  }),
});

export type CreateRoomForm = z.infer<typeof createRoomSchema>;

/** Host edit form — rules as one-per-line text, mapped to string[] on submit. */
export const editRoomFormSchema = z.object({
  title: z.string().trim().min(1, 'Give it a title').max(60),
  description: z.string().trim().min(1, 'Say what it is about').max(280),
  rulesText: z
    .string()
    .trim()
    .min(1, 'At least one rule')
    .refine(
      (text) => {
        const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
        return lines.length >= 1 && lines.length <= 10;
      },
      'One to ten rules, one per line'
    ),
});

export type EditRoomForm = z.infer<typeof editRoomFormSchema>;

export const editRoomRules = (rulesText: string): string[] =>
  rulesText.split('\n').map((l) => l.trim()).filter(Boolean);
