import { z } from 'zod';
import { MAX_DISPLAY_NAME_LENGTH, MAX_TAGS } from '../constants';
import type { JoinQueuePayload } from '../types';

const tagSchema = z
  .string()
  .trim()
  .min(1, 'Pick or type a vibe')
  .max(20, 'Keep it under 20 characters');

/**
 * The form's single source of truth, wired into react-hook-form via
 * `zodResolver`. Field-level rules and the submit guard are derived from this
 * rather than restated, so the rules live in one place.
 *
 * `gender` is nullable: not answering is expressed by having nothing selected
 * (tap the active option again to clear it), not by a separate "Skip" button.
 */
export const joinQueueFormSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, 'Pick an alias')
    .max(
      MAX_DISPLAY_NAME_LENGTH,
      `Keep it under ${MAX_DISPLAY_NAME_LENGTH} characters`
    ),
  vibeTags: z.array(tagSchema).max(MAX_TAGS, `Pick up to ${MAX_TAGS} vibes`),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).nullable(),
  // `refine` rather than `z.literal(true)`: the field is editable, so its
  // runtime type has to stay `boolean` — a literal would make the unchecked
  // state unrepresentable in the form's own types.
  ageConfirmed: z.boolean().refine((v) => v, {
    message: 'You must confirm you are 18 or older to enter',
  }),
});

export type JoinQueueFormValues = z.infer<typeof joinQueueFormSchema>;

/**
 * Narrow a form bag to the API payload. Two things change at the boundary:
 * the tags come from `TagPicker`'s local state, and "no answer" becomes the
 * wire value the server stores (tags are already normalised upstream).
 */
export const toJoinPayload = (values: JoinQueueFormValues): JoinQueuePayload => ({
  displayName: values.displayName.trim(),
  vibeTags: values.vibeTags,
  gender: values.gender ?? 'prefer_not_to_say',
  ageConfirmed: true,
});