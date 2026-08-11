export type Avatar = {
  publicId?: string;
  url?: string;
};

export type User = {
  _id: string;
  name: string;
  username: string;
  bio?: string;
  avatar?: Avatar;
};

export type ApiSuccess<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
  user?: User;
};

export type MessageNotification = {
  chatId: string;
  name?: string;
  avatar?: string;
  count: number;
  timestamp?: string | number;
};

export type RequestNotification = {
  id: string;
  [key: string]: unknown;
};

export type AdminStats = {
  users: number;
  groups: number;
  chats: number;
  onlineUsers: number;
  messages: number;
  newUsersSeries?: number[];
  messagesSeries?: number[];
  seriesLabels?: string[];
};
