import { describe, expect, it } from 'vitest';
import { buildInviteTerms, defaultInviteFields } from '../inviteLink';

describe('buildInviteTerms', () => {
  it('requires a use limit within 1–25 for private rooms', () => {
    expect(buildInviteTerms(true, '', '7')).toEqual({ error: 'Uses must be 1–25' });
    expect(buildInviteTerms(true, '26', '7')).toEqual({ error: 'Uses must be 1–25' });
    expect(buildInviteTerms(true, '10', '7')).toEqual({ terms: { maxUses: 10, ttlDays: 7 } });
  });

  it('caps validity at 30 days', () => {
    expect(buildInviteTerms(true, '5', '31')).toEqual({ error: 'Valid for 1–30 days' });
    expect(buildInviteTerms(false, '', '0')).toEqual({ error: 'Valid for 1–30 days' });
  });

  it('lets other rooms leave uses blank for unlimited', () => {
    expect(buildInviteTerms(false, '', '7')).toEqual({ terms: { maxUses: null, ttlDays: 7 } });
  });

  it('starts private forms on safe defaults', () => {
    expect(defaultInviteFields(true)).toEqual({ uses: '10', days: '7' });
    expect(defaultInviteFields(false)).toEqual({ uses: '', days: '7' });
  });
});
