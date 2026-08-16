export const adminQueryKeys = {
  me: ['adminMe'] as const,
  stats: ['adminStats'] as const,
  users: (q: string) => ['adminUsers', 'list', q] as const,
  userDetail: (id: string) => ['adminUsers', 'detail', id] as const,
  messages: (status: string, q: string, senderId = '') => ['adminMessages', 'list', status, q, senderId] as const,
  groups: (q: string, memberId = '') => ['adminGroups', 'list', q, memberId] as const,
  attachments: (q: string, senderId = '', kind = 'all') => ['adminAttachments', 'list', q, senderId, kind] as const,
  activityPresence: ['adminActivity', 'presence'] as const,
  activityEvents: (type: string) => ['adminActivity', 'events', type] as const,
};
