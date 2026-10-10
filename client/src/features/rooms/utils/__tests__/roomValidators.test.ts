import { describe, expect, it } from 'vitest';
import { createRoomSchema, editRoomRules, roomAliasSchema } from '../roomValidators';

describe('room alias form', () => {
  it('accepts ordinary aliases and rejects reserved ones', () => {
    expect(roomAliasSchema.safeParse({ alias: 'NightOwl' }).success).toBe(true);
    expect(roomAliasSchema.safeParse({ alias: 'wave' }).success).toBe(false);
    expect(roomAliasSchema.safeParse({ alias: '' }).success).toBe(false);
    expect(roomAliasSchema.safeParse({ alias: 'x'.repeat(25) }).success).toBe(false);
  });
});

describe('room creation form', () => {
  const valid = {
    title: 'Midnight Coding',
    slug: 'midnight-coding-x7k2',
    description: 'Code together at night.',
    rules: [{ value: 'Be kind.' }],
    accept: true as const,
  };

  it('accepts a complete form', () => {
    expect(createRoomSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects bad slugs, missing rules and unaccepted terms', () => {
    expect(createRoomSchema.safeParse({ ...valid, slug: 'Bad Slug!' }).success).toBe(false);
    expect(createRoomSchema.safeParse({ ...valid, slug: 'new' }).success).toBe(false);
    expect(createRoomSchema.safeParse({ ...valid, rules: [] }).success).toBe(false);
    expect(
      createRoomSchema.safeParse({ ...valid, accept: false }).success
    ).toBe(false);
  });
});

describe('editRoomRules', () => {
  it('splits textarea lines, dropping blanks', () => {
    expect(editRoomRules('Be kind.\n\nNo links.\n  ')).toEqual(['Be kind.', 'No links.']);
  });
});
