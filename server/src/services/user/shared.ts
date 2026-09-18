import type { LeanUser, PublicUser } from '../../types/user.js';

/** Strip sensitive/extra DB fields; expose avatar URL string for API responses. */
export const toPublicUser = (
  user: LeanUser,
): PublicUser & Record<string, unknown> => ({
  _id: user._id,
  name: user.name,
  username: user.username,
  email: user.email,
  avatar: user.avatar.url,
  bio: user.bio,
});
