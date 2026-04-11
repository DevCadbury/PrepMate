export type LogCategory = 'auth' | 'user' | 'content' | 'report' | 'admin' | 'settings' | 'coding' | 'system';
export type LogActorType = 'admin' | 'user' | 'system';
export type LogActionType = 'destructive' | 'warning' | 'info' | 'success' | 'muted';

export interface LogActor {
  name: string;
  email: string;
  type: LogActorType;
  initials: string;
  color: string; // tailwind bg color for avatar
}

export interface LogTarget {
  label: string;
  type: 'user' | 'content' | 'report' | 'system' | 'problem' | 'admin' | 'role' | 'coupon';
  id?: string;
  href?: string;
}

export interface LogMetadata {
  ip?: string;
  device?: string;
  browser?: string;
  os?: string;
  reason?: string;
  language?: string;
  result?: 'accepted' | 'wrong_answer' | 'time_limit_exceeded' | 'runtime_error' | 'compile_error';
  runtime?: string;
  memory?: string;
  before?: Record<string, string>;
  after?: Record<string, string>;
  relatedEntities?: Array<{ label: string; type: string; id: string }>;
  duration?: string;
  affectedCount?: number;
  suspiciousScore?: number;
}

export interface LogEntry {
  id: string;
  actor: LogActor;
  action: string;
  actionType: LogActionType;
  target: LogTarget;
  timestamp: Date;
  relativeTime: string;
  category: LogCategory;
  details: string;
  metadata?: LogMetadata;
}

// ─── Admin Logs ────────────────────────────────────────────────────────────────

export const adminLogs: LogEntry[] = [
  {
    id: 'a1',
    actor: { name: 'Alex Chen', email: 'alex.chen@prepmate.com', type: 'admin', initials: 'AC', color: 'bg-violet-500' },
    action: 'Banned user',
    actionType: 'destructive',
    target: { label: 'bob.wilson@email.com', type: 'user', id: 'u_042', href: '/admin/users/u_042' },
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    relativeTime: '5 min ago',
    category: 'user',
    details: 'Permanent ban issued for repeated harassment in community threads.',
    metadata: {
      reason: 'Harassment — Repeated offensive messages across 12 posts',
      relatedEntities: [
        { label: 'Report #892', type: 'report', id: 'r_892' },
        { label: 'Report #874', type: 'report', id: 'r_874' },
      ],
      affectedCount: 1,
    },
  },
  {
    id: 'a2',
    actor: { name: 'John Moderator', email: 'john.mod@prepmate.com', type: 'admin', initials: 'JM', color: 'bg-sky-500' },
    action: 'Removed content',
    actionType: 'destructive',
    target: { label: 'Post #12453', type: 'content', id: 'c_12453' },
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    relativeTime: '15 min ago',
    category: 'content',
    details: 'Spam post removed after 8 community reports.',
    metadata: {
      reason: 'Spam — Repeated promotional links',
      affectedCount: 8,
      relatedEntities: [{ label: 'Report #901', type: 'report', id: 'r_901' }],
    },
  },
  {
    id: 'a3',
    actor: { name: 'Alex Chen', email: 'alex.chen@prepmate.com', type: 'admin', initials: 'AC', color: 'bg-violet-500' },
    action: 'Created admin account',
    actionType: 'info',
    target: { label: 'jane.support@prepmate.com', type: 'admin', id: 'adm_014' },
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    relativeTime: '1 hour ago',
    category: 'admin',
    details: 'New Support Admin account created and onboarding email sent.',
    metadata: {
      before: { role: 'none' },
      after: { role: 'Support Admin', permissions: 'help_center, reports:read' },
    },
  },
  {
    id: 'a4',
    actor: { name: 'Jane Support', email: 'jane.support@prepmate.com', type: 'admin', initials: 'JS', color: 'bg-emerald-500' },
    action: 'Resolved report',
    actionType: 'success',
    target: { label: 'Report #892', type: 'report', id: 'r_892' },
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    relativeTime: '2 hours ago',
    category: 'report',
    details: 'Report resolved: User has been warned and post removed.',
    metadata: {
      before: { status: 'open' },
      after: { status: 'resolved', resolution: 'warned' },
    },
  },
  {
    id: 'a5',
    actor: { name: 'Alex Chen', email: 'alex.chen@prepmate.com', type: 'admin', initials: 'AC', color: 'bg-violet-500' },
    action: 'Updated platform settings',
    actionType: 'warning',
    target: { label: 'API Rate Limit', type: 'system' },
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
    relativeTime: '3 hours ago',
    category: 'settings',
    details: 'API rate limit increased to handle growing traffic.',
    metadata: {
      before: { rate_limit: '1000 req/hr', burst: '50' },
      after: { rate_limit: '1500 req/hr', burst: '100' },
    },
  },
  {
    id: 'a6',
    actor: { name: 'System', email: 'system@prepmate.com', type: 'system', initials: 'SY', color: 'bg-slate-500' },
    action: 'Deployed update',
    actionType: 'muted',
    target: { label: 'Platform v2.4.1', type: 'system' },
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    relativeTime: '5 hours ago',
    category: 'system',
    details: 'Automated CI/CD deployment completed successfully in 2m 34s.',
    metadata: {
      duration: '2m 34s',
      before: { version: 'v2.4.0' },
      after: { version: 'v2.4.1', changes: '12 commits, 3 bug fixes' },
    },
  },
  {
    id: 'a7',
    actor: { name: 'John Moderator', email: 'john.mod@prepmate.com', type: 'admin', initials: 'JM', color: 'bg-sky-500' },
    action: 'Suspended user',
    actionType: 'warning',
    target: { label: 'mike.johnson@email.com', type: 'user', id: 'u_118', href: '/admin/users/u_118' },
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    relativeTime: '6 hours ago',
    category: 'user',
    details: '7-day suspension applied for repeated spam posting.',
    metadata: {
      reason: 'Spam — 14 promotional posts in 2 hours',
      before: { status: 'active' },
      after: { status: 'suspended', until: '2026-04-18' },
    },
  },
  {
    id: 'a8',
    actor: { name: 'Alex Chen', email: 'alex.chen@prepmate.com', type: 'admin', initials: 'AC', color: 'bg-violet-500' },
    action: 'Published problem',
    actionType: 'success',
    target: { label: 'Binary Search Tree Validation', type: 'problem', id: 'p_007', href: '/admin/coding/p_007' },
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    relativeTime: '8 hours ago',
    category: 'coding',
    details: 'New hard-difficulty problem published to live platform.',
    metadata: {
      before: { status: 'draft' },
      after: { status: 'active', difficulty: 'hard', category: 'Trees' },
    },
  },
  {
    id: 'a9',
    actor: { name: 'Alex Chen', email: 'alex.chen@prepmate.com', type: 'admin', initials: 'AC', color: 'bg-violet-500' },
    action: 'Created coupon',
    actionType: 'info',
    target: { label: 'SUMMER25', type: 'coupon', id: 'cpn_055' },
    timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000),
    relativeTime: '10 hours ago',
    category: 'settings',
    details: 'Summer promotion coupon created — 25% off, 500 max uses.',
    metadata: {
      after: { code: 'SUMMER25', discount: '25%', type: 'percentage', max_uses: '500' },
    },
  },
  {
    id: 'a10',
    actor: { name: 'System', email: 'system@prepmate.com', type: 'system', initials: 'SY', color: 'bg-slate-500' },
    action: 'Auto-flagged content',
    actionType: 'warning',
    target: { label: 'Post #12489', type: 'content', id: 'c_12489' },
    timestamp: new Date(Date.now() - 14 * 60 * 60 * 1000),
    relativeTime: '14 hours ago',
    category: 'content',
    details: 'AI moderation flagged post for potential policy violation.',
    metadata: {
      reason: 'Potential doxxing — personal information detected',
      suspiciousScore: 87,
    },
  },
  {
    id: 'a11',
    actor: { name: 'Jane Support', email: 'jane.support@prepmate.com', type: 'admin', initials: 'JS', color: 'bg-emerald-500' },
    action: 'Closed ticket',
    actionType: 'success',
    target: { label: 'Ticket #TKT-0041', type: 'report', id: 'tkt_041' },
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    relativeTime: '1 day ago',
    category: 'report',
    details: 'Billing support ticket resolved after account credit applied.',
  },
  {
    id: 'a12',
    actor: { name: 'Alex Chen', email: 'alex.chen@prepmate.com', type: 'admin', initials: 'AC', color: 'bg-violet-500' },
    action: 'Modified role permissions',
    actionType: 'warning',
    target: { label: 'Moderator Role', type: 'role' },
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    relativeTime: '2 days ago',
    category: 'admin',
    details: 'Moderator role updated with extended content moderation permissions.',
    metadata: {
      before: { permissions: 'reports:read, content:flag' },
      after: { permissions: 'reports:read, reports:resolve, content:flag, content:remove' },
    },
  },
];

// ─── User Logs ─────────────────────────────────────────────────────────────────

export const userLogs: LogEntry[] = [
  {
    id: 'u1',
    actor: { name: 'John Doe', email: 'john.doe@email.com', type: 'user', initials: 'JD', color: 'bg-blue-500' },
    action: 'Logged in',
    actionType: 'info',
    target: { label: 'Web Application', type: 'system' },
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    relativeTime: '30 min ago',
    category: 'auth',
    details: 'Successful login from a recognized device.',
    metadata: {
      ip: '192.168.1.101',
      device: 'Desktop',
      browser: 'Chrome 124',
      os: 'Windows 11',
    },
  },
  {
    id: 'u2',
    actor: { name: 'John Doe', email: 'john.doe@email.com', type: 'user', initials: 'JD', color: 'bg-blue-500' },
    action: 'Submitted solution',
    actionType: 'success',
    target: { label: 'Two Sum', type: 'problem', id: 'p_001', href: '/admin/coding/p_001' },
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    relativeTime: '45 min ago',
    category: 'coding',
    details: 'Solution accepted on first attempt.',
    metadata: {
      language: 'Python',
      result: 'accepted',
      runtime: '48ms',
      memory: '16.4MB',
    },
  },
  {
    id: 'u3',
    actor: { name: 'Bob Wilson', email: 'bob.wilson@email.com', type: 'user', initials: 'BW', color: 'bg-orange-500' },
    action: 'Failed login attempt',
    actionType: 'destructive',
    target: { label: 'Web Application', type: 'system' },
    timestamp: new Date(Date.now() - 90 * 60 * 1000),
    relativeTime: '1.5 hours ago',
    category: 'auth',
    details: 'Incorrect password — 3rd consecutive failed attempt. Account temporarily locked.',
    metadata: {
      ip: '10.0.0.45',
      device: 'Mobile',
      browser: 'Safari 17',
      os: 'iOS 17.2',
      suspiciousScore: 72,
    },
  },
  {
    id: 'u4',
    actor: { name: 'Jane Smith', email: 'jane.smith@email.com', type: 'user', initials: 'JS', color: 'bg-pink-500' },
    action: 'Published post',
    actionType: 'info',
    target: { label: 'System Design: Database Sharding Guide', type: 'content', id: 'c_8812' },
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    relativeTime: '2 hours ago',
    category: 'content',
    details: 'New community post published — 1,240 words, 3 code blocks.',
  },
  {
    id: 'u5',
    actor: { name: 'Mike Johnson', email: 'mike.johnson@email.com', type: 'user', initials: 'MJ', color: 'bg-teal-500' },
    action: 'Solved problem',
    actionType: 'success',
    target: { label: 'Binary Tree Traversal', type: 'problem', id: 'p_002', href: '/admin/coding/p_002' },
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
    relativeTime: '3 hours ago',
    category: 'coding',
    details: 'Optimal solution — beats 94% runtime, 88% memory.',
    metadata: {
      language: 'JavaScript',
      result: 'accepted',
      runtime: '45ms',
      memory: '14.2MB',
    },
  },
  {
    id: 'u6',
    actor: { name: 'Alice Brown', email: 'alice.brown@email.com', type: 'user', initials: 'AB', color: 'bg-purple-500' },
    action: 'Reported user',
    actionType: 'warning',
    target: { label: 'bob.wilson@email.com', type: 'user', id: 'u_042', href: '/admin/users/u_042' },
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    relativeTime: '5 hours ago',
    category: 'report',
    details: 'Report submitted for account impersonation.',
    metadata: {
      reason: 'Impersonation — using similar username and profile photo',
    },
  },
  {
    id: 'u7',
    actor: { name: 'Jane Smith', email: 'jane.smith@email.com', type: 'user', initials: 'JS', color: 'bg-pink-500' },
    action: 'Updated profile',
    actionType: 'info',
    target: { label: 'Profile Settings', type: 'user' },
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    relativeTime: '6 hours ago',
    category: 'user',
    details: 'Profile bio and avatar updated.',
    metadata: {
      before: { bio: 'Software developer', avatar: 'default' },
      after: { bio: 'Senior SWE @ Meta | PrepMate contributor', avatar: 'custom_upload' },
    },
  },
  {
    id: 'u8',
    actor: { name: 'Bob Wilson', email: 'bob.wilson@email.com', type: 'user', initials: 'BW', color: 'bg-orange-500' },
    action: 'Failed login attempt',
    actionType: 'destructive',
    target: { label: 'Web Application', type: 'system' },
    timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000),
    relativeTime: '7 hours ago',
    category: 'auth',
    details: '1st failed login attempt.',
    metadata: {
      ip: '10.0.0.45',
      device: 'Mobile',
      browser: 'Safari 17',
      os: 'iOS 17.2',
    },
  },
  {
    id: 'u9',
    actor: { name: 'Mike Johnson', email: 'mike.johnson@email.com', type: 'user', initials: 'MJ', color: 'bg-teal-500' },
    action: 'Submitted solution',
    actionType: 'warning',
    target: { label: 'Dynamic Programming - Knapsack', type: 'problem', id: 'p_003', href: '/admin/coding/p_003' },
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    relativeTime: '8 hours ago',
    category: 'coding',
    details: 'Time limit exceeded on test case #7.',
    metadata: {
      language: 'Java',
      result: 'time_limit_exceeded',
      runtime: 'TLE',
    },
  },
  {
    id: 'u10',
    actor: { name: 'Sara Lee', email: 'sara.lee@email.com', type: 'user', initials: 'SL', color: 'bg-rose-500' },
    action: 'Requested account deletion',
    actionType: 'destructive',
    target: { label: 'Own account', type: 'user' },
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    relativeTime: '1 day ago',
    category: 'user',
    details: 'Account deletion requested — 30-day grace period started.',
    metadata: {
      before: { status: 'active' },
      after: { status: 'pending_deletion', deletion_date: '2026-05-11' },
    },
  },
  {
    id: 'u11',
    actor: { name: 'Alice Brown', email: 'alice.brown@email.com', type: 'user', initials: 'AB', color: 'bg-purple-500' },
    action: 'Submitted solution',
    actionType: 'success',
    target: { label: 'Two Sum', type: 'problem', id: 'p_001' },
    timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000),
    relativeTime: '1 day ago',
    category: 'coding',
    details: 'Clean O(n) hash map solution accepted.',
    metadata: {
      language: 'TypeScript',
      result: 'accepted',
      runtime: '52ms',
      memory: '15.8MB',
    },
  },
  {
    id: 'u12',
    actor: { name: 'John Doe', email: 'john.doe@email.com', type: 'user', initials: 'JD', color: 'bg-blue-500' },
    action: 'Logged in from new device',
    actionType: 'warning',
    target: { label: 'Web Application', type: 'system' },
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
    relativeTime: '2 days ago',
    category: 'auth',
    details: 'Login from unrecognized IP location — Seoul, South Korea.',
    metadata: {
      ip: '175.211.2.88',
      device: 'Desktop',
      browser: 'Chrome 124',
      os: 'macOS 14',
      suspiciousScore: 55,
    },
  },
];

// ─── Insights helpers ──────────────────────────────────────────────────────────

export function getLogInsights(logs: LogEntry[]) {
  const actionCounts: Record<string, number> = {};
  const actorCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  const suspiciousEntries: LogEntry[] = [];

  for (const log of logs) {
    actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    actorCounts[log.actor.name] = (actorCounts[log.actor.name] || 0) + 1;
    categoryCounts[log.category] = (categoryCounts[log.category] || 0) + 1;
    if (log.actionType === 'destructive' || (log.metadata?.suspiciousScore && log.metadata.suspiciousScore > 50)) {
      suspiciousEntries.push(log);
    }
  }

  const topActions = Object.entries(actionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topActors = Object.entries(actorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return { topActions, topActors, categoryCounts, suspiciousEntries };
}
