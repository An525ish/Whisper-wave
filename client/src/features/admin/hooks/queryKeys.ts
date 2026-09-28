export const adminQueryKeys = {
  me: ['adminMe'] as const,
  stats: ['adminStats'] as const,
  // list factories
  users: (q: string, signupMethod = 'all') => ['adminUsers', 'list', q, signupMethod] as const,
  userDetail: (id: string) => ['adminUsers', 'detail', id] as const,
  messages: (status: string, q: string, senderId = '') => ['adminMessages', 'list', status, q, senderId] as const,
  groups: (q: string, memberId = '') => ['adminGroups', 'list', q, memberId] as const,
  attachments: (q: string, senderId = '', kind = 'all') => ['adminAttachments', 'list', q, senderId, kind] as const,
  activityPresence: ['adminActivity', 'presence'] as const,
  activityEvents: (type: string) => ['adminActivity', 'events', type] as const,
  impersonationLogs: ['adminImpersonationLogs'] as const,
  // prefix invalidation helpers (matches all variants under each root)
  usersPrefix: ['adminUsers'] as const,
  messagesPrefix: ['adminMessages'] as const,
  groupsPrefix: ['adminGroups'] as const,
  attachmentsPrefix: ['adminAttachments'] as const,
};
