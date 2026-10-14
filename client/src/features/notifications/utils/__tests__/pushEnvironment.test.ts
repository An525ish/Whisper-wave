import { describe, expect, it } from 'vitest';
import { derivePushUiState } from '../pushEnvironment';
import type { PushSnapshot } from '../../types';

const base: PushSnapshot = {
  supported: true,
  permission: 'default',
  iosNeedsInstall: false,
  hasToken: false,
};

describe('derivePushUiState', () => {
  it('hides when the server has push disabled', () => {
    expect(derivePushUiState(false, base)).toBe('hidden');
  });

  it('asks iOS tab users to install, other unsupported browsers get a hint', () => {
    expect(derivePushUiState(true, { ...base, supported: false, iosNeedsInstall: true })).toBe('install');
    expect(derivePushUiState(true, { ...base, supported: false })).toBe('unsupported');
  });

  it('disables when permission is denied', () => {
    expect(derivePushUiState(true, { ...base, permission: 'denied', hasToken: true })).toBe('denied');
  });

  it('is on only when granted and a token is stored', () => {
    expect(derivePushUiState(true, { ...base, permission: 'granted' })).toBe('off');
    expect(derivePushUiState(true, { ...base, permission: 'granted', hasToken: true })).toBe('on');
    expect(derivePushUiState(true, base)).toBe('off');
  });
});
