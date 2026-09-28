/** Persist avatar load outcomes across virtual-list unmounts (scroll remounts reset React state). */
type AvatarImageState = 'loaded' | 'failed';

// Bounded cache: a long session can touch many distinct avatar URLs, so cap the
// map and evict the oldest entry (insertion order) once the limit is reached.
const MAX_ENTRIES = 500;
const avatarImageState = new Map<string, AvatarImageState>();

const setState = (resolvedUrl: string, state: AvatarImageState): void => {
  // Re-insert to refresh insertion order (most-recently-used stays newest).
  avatarImageState.delete(resolvedUrl);
  avatarImageState.set(resolvedUrl, state);
  if (avatarImageState.size > MAX_ENTRIES) {
    const oldest = avatarImageState.keys().next().value;
    if (oldest !== undefined) avatarImageState.delete(oldest);
  }
};

export const getAvatarImageState = (resolvedUrl: string): AvatarImageState | undefined =>
  avatarImageState.get(resolvedUrl);

export const markAvatarImageLoaded = (resolvedUrl: string): void => {
  setState(resolvedUrl, 'loaded');
};

export const markAvatarImageFailed = (resolvedUrl: string): void => {
  setState(resolvedUrl, 'failed');
};
