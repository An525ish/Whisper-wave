/** Persist avatar load outcomes across virtual-list unmounts (scroll remounts reset React state). */
type AvatarImageState = 'loaded' | 'failed';

const avatarImageState = new Map<string, AvatarImageState>();

export const getAvatarImageState = (resolvedUrl: string): AvatarImageState | undefined =>
  avatarImageState.get(resolvedUrl);

export const markAvatarImageLoaded = (resolvedUrl: string): void => {
  avatarImageState.set(resolvedUrl, 'loaded');
};

export const markAvatarImageFailed = (resolvedUrl: string): void => {
  avatarImageState.set(resolvedUrl, 'failed');
};
