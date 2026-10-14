import { beforeEach, describe, expect, it } from 'vitest';
import { clearPostAuthReturn, peekPostAuthReturn, stashPostAuthReturn } from '../postAuthReturn';

describe('post-auth return path', () => {
  beforeEach(() => sessionStorage.clear());

  it('peeks without spending, until cleared', () => {
    stashPostAuthReturn('/rooms/abc?invite=tok');
    expect(peekPostAuthReturn()).toBe('/rooms/abc?invite=tok');
    expect(peekPostAuthReturn()).toBe('/rooms/abc?invite=tok');
    clearPostAuthReturn();
    expect(peekPostAuthReturn()).toBeNull();
  });

  it('refuses off-site targets', () => {
    stashPostAuthReturn('//evil.example/x');
    stashPostAuthReturn('https://evil.example');
    expect(peekPostAuthReturn()).toBeNull();
  });
});
