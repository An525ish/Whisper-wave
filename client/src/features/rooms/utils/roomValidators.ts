import { z } from 'zod';
import { ROOM_LIMITS } from '../constants';

const RESERVED_ALIASES = ['wave', 'whisper', 'system', 'admin', 'moderator', 'host'];

/** Pre-join persona form. Mirrors the server's alias/color contract. */
export const roomAliasSchema = z.object({
  alias: z
    .string()
    .trim()
    .min(1, 'Pick a display name')
    .max(ROOM_LIMITS.ALIAS_MAX, `Display names are ${ROOM_LIMITS.ALIAS_MAX} characters at most`)
    .refine((a) => !RESERVED_ALIASES.includes(a.toLowerCase()), 'That name is reserved'),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Pick a color')
    .optional(),
});

/** Room creation form. Slug uniqueness is enforced server-side (409). */
export const createRoomSchema = z.object({
  title: z.string().trim().min(1, 'Give it a title').max(ROOM_LIMITS.TITLE_MAX),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Pick a URL name')
    .max(ROOM_LIMITS.SLUG_MAX)
    .regex(/^[a-z0-9-]+$/, 'Letters, numbers and dashes only')
    .refine((s) => s !== 'new', 'That name is reserved'),
  description: z.string().trim().min(1, 'Say what it is about').max(ROOM_LIMITS.DESCRIPTION_MAX),
  visibility: z.enum(['public', 'private']),
  // Objects, not bare strings: this RHF version's path types exclude
  // primitive-element arrays from `useFieldArray`. Mapped to string[] on submit.
  rules: z
    .array(
      z.object({
        value: z.string().trim().min(1, 'Rules can’t be blank').max(ROOM_LIMITS.RULE_MAX),
      })
    )
    .min(1, 'At least one rule')
    .max(ROOM_LIMITS.CREATE_RULES_MAX, 'Six rules at most'),
  accept: z.literal(true, {
    error: 'Reads the room — accept the rules to create it',
  }),
});

/** Host edit form — rules as one-per-line text, mapped to string[] on submit. */
export const editRoomFormSchema = z.object({
  title: z.string().trim().min(1, 'Give it a title').max(ROOM_LIMITS.TITLE_MAX),
  description: z.string().trim().min(1, 'Say what it is about').max(ROOM_LIMITS.DESCRIPTION_MAX),
  rulesText: z
    .string()
    .trim()
    .min(1, 'At least one rule')
    .refine(
      (text) => {
        const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
        return lines.length >= 1 && lines.length <= ROOM_LIMITS.EDIT_RULES_MAX;
      },
      'One to ten rules, one per line'
    ),
});

export const editRoomRules = (rulesText: string): string[] =>
  rulesText.split('\n').map((l) => l.trim()).filter(Boolean);
