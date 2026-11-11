import { beforeEach, describe, expect, it } from 'vitest';
import { useAdConsent } from '../hooks/useAdConsent';

describe('useAdConsent', () => {
  beforeEach(() => {
    localStorage.clear();
    useAdConsent.setState({ choice: null });
  });

  it('starts as not asked, which is not consent', () => {
    expect(useAdConsent.getState().choice).toBeNull();
  });

  it('remembers the answer on this device', () => {
    useAdConsent.getState().set('granted');
    expect(localStorage.getItem('ww-ad-consent')).toBe('granted');
    useAdConsent.getState().set(null);
    expect(localStorage.getItem('ww-ad-consent')).toBeNull();
  });
});
