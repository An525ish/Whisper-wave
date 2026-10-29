import { api } from '@/shared/lib/api/client';
import type {
  CreateRoomPayload,
  CreateRoomResponse,
  MyRoomsResponse,
  RoomContentPayload,
  RoomInfoResponse,
  RoomInvite,
  RoomInviteTerms,
  RoomReportPayload,
  RoomsListResponse,
} from '../types';

/** Public lobby — guests and members alike. */
export const listRooms = () => api.get<RoomsListResponse>('/rooms');

/** Room info + rules for the pre-join sheet. Invite unlocks unlisted rooms. */
export const roomInfo = (slug: string, invite?: string) =>
  api.get<RoomInfoResponse>(`/rooms/${slug}`, invite ? { invite } : undefined);

/** Rooms I host, any visibility, plus private-room eligibility (members only). */
export const myRooms = () => api.get<MyRoomsResponse>('/rooms/mine');

/** Mint one invite link (hosts and mods). Token shown once. Private rooms need `maxUses`. */
export const createInvite = (slug: string, terms: RoomInviteTerms) =>
  api.post<{ success: boolean; data: { invite: { token: string; expiresAt: string } } }>(
    `/rooms/${slug}/invites`,
    terms
  );

export const listInvites = (slug: string) =>
  api.get<{ success: boolean; data: { invites: RoomInvite[] } }>(`/rooms/${slug}/invites`);

export const revokeInvite = (slug: string, id: string) =>
  api.delete<{ success: boolean }>(`/rooms/${slug}/invites/${id}`);

/** Report one room message. Names a message id, never a person. */
export const reportRoomMessage = (slug: string, payload: RoomReportPayload) =>
  api.post<{ success: boolean; data: { hidden: boolean } }>(`/rooms/${slug}/report`, payload);

/** Create a user room (members only). Unlisted until approved. */
export const createRoom = (payload: CreateRoomPayload) =>
  api.post<CreateRoomResponse>('/rooms', payload);

/** Host content edit — title, description, rules. */
export const updateRoom = (slug: string, payload: RoomContentPayload) =>
  api.patch<{ success: boolean }>(`/rooms/${slug}`, payload);

/** Host asks for lobby listing (unlisted rooms). */
export const requestListing = (slug: string) =>
  api.post<{ success: boolean; message: string }>(`/rooms/${slug}/request-listing`, {});

/** Host delete — ends live instances, removes the template. */
export const deleteRoom = (slug: string) => api.delete<{ success: boolean }>(`/rooms/${slug}`);

/** Slugs of closed rooms the member asked to be reminded about. */
export const listReminders = () =>
  api.get<{ success: boolean; data: { slugs: string[] } }>('/rooms/reminders');

/** One-shot push when the room next opens (members, push enabled). */
export const addReminder = (slug: string) => api.put<void>(`/rooms/${slug}/reminder`);

export const removeReminder = (slug: string) => api.delete<void>(`/rooms/${slug}/reminder`);
