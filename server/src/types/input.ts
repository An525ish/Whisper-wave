import type { z } from 'zod';
import type {
  forgotPasswordSchema,
  googleSignInSchema,
  resetPasswordSchema,
  signInSchema,
  signUpCompleteSchema,
  signUpResendSchema,
  signUpStartSchema,
  signUpUpdateUsernameSchema,
  signUpVerifySchema,
  usernameCheckQuerySchema,
} from '../validators/auth.js';
import type { getChatDetailsQuerySchema } from '../validators/chat.js';
import type { pageQuerySchema } from '../validators/fields.js';
import type { linkPreviewQuerySchema } from '../validators/linkPreview.js';
import type {
  completeConnectionSchema,
  joinQueueSchema,
  submitReportSchema,
} from '../validators/match.js';
import type {
  getMessagesQuerySchema,
  jumpToDateQuerySchema,
  listActiveDatesQuerySchema,
  searchMessagesQuerySchema,
} from '../validators/message.js';
import type {
  getMyFriendsQuerySchema,
  searchUserQuerySchema,
  updateProfileSchema,
} from '../validators/request.js';
import type {
  socketNewMessageSchema,
  socketReactionSchema,
  socketTypingSchema,
} from '../validators/socket.js';
import type { commitAttachmentsSchema, signUploadSchema } from '../validators/upload.js';

// Validated (non-admin) request shapes. Schemas in validators/ stay the single
// source of truth; types are derived here so services/controllers never import
// validators/ for types. Admin shapes live in `adminInput.ts`.

// auth
export type GoogleSignInInput = z.infer<typeof googleSignInSchema>;
export type SignUpStartInput = z.infer<typeof signUpStartSchema>;
export type SignUpVerifyInput = z.infer<typeof signUpVerifySchema>;
export type SignUpResendInput = z.infer<typeof signUpResendSchema>;
export type SignUpUpdateUsernameInput = z.infer<typeof signUpUpdateUsernameSchema>;
export type SignUpCompleteInput = z.infer<typeof signUpCompleteSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UsernameCheckQuery = z.infer<typeof usernameCheckQuerySchema>;

// chat / shared fields / link preview
export type GetChatDetailsQuery = z.infer<typeof getChatDetailsQuerySchema>;
export type PageQuery = z.infer<typeof pageQuerySchema>;
export type LinkPreviewQuery = z.infer<typeof linkPreviewQuerySchema>;

// match
export type JoinQueueBody = z.infer<typeof joinQueueSchema>;
export type SubmitReportBody = z.infer<typeof submitReportSchema>;
export type CompleteConnectionBody = z.infer<typeof completeConnectionSchema>;

// message
export type GetMessagesQuery = z.infer<typeof getMessagesQuerySchema>;
export type SearchMessagesQuery = z.infer<typeof searchMessagesQuerySchema>;
export type JumpToDateQuery = z.infer<typeof jumpToDateQuerySchema>;
export type ListActiveDatesQuery = z.infer<typeof listActiveDatesQuerySchema>;

// request / user
export type SearchUserQuery = z.infer<typeof searchUserQuerySchema>;
export type GetMyFriendsQuery = z.infer<typeof getMyFriendsQuerySchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// socket
export type SocketNewMessagePayload = z.infer<typeof socketNewMessageSchema>;
export type SocketTypingPayload = z.infer<typeof socketTypingSchema>;
export type SocketReactionPayload = z.infer<typeof socketReactionSchema>;

// upload
export type SignUploadBody = z.infer<typeof signUploadSchema>;
export type CommitAttachmentsBody = z.infer<typeof commitAttachmentsSchema>;
