// Shared user data types and mock data for both the quick panel and full profile page

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string;
  lastActive: string;
  posts: number;
  followers: number;
  following: number;
  reports: number;
  codingSolved: number;
  bio?: string;
  location?: string;
  phone?: string;
  restriction?: { type: string; remaining: string; reason: string };
}

export interface ReportAgainst {
  id: string;
  reporter: string;
  reporterEmail: string;
  reason: string;
  contentType: 'post' | 'comment' | 'problem' | 'profile';
  contentPreview: string;
  contentTitle?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
  status: 'pending' | 'resolved';
  moderationAction?: string;
  moderatedBy?: string;
  moderatedAt?: string;
}

export interface ReportMade {
  id: string;
  target: string;
  reason: string;
  timestamp: string;
  outcome: 'valid' | 'invalid' | 'pending';
}

export interface UserContent {
  id: string;
  title: string;
  type: 'post' | 'comment' | 'problem';
  status: 'published' | 'flagged' | 'removed' | 'draft';
  views: number;
  likes: number;
  comments: number;
  flags: number;
  date: string;
  preview?: string;
}

export interface LoginSession {
  id: string;
  ip: string;
  location: string;
  device: string;
  browser: string;
  os: string;
  timestamp: string;
  suspicious: boolean;
  current: boolean;
}

export interface ActivityEvent {
  id: string;
  action: string;
  details?: string;
  type: 'post' | 'code' | 'comment' | 'profile' | 'follow' | 'login' | 'report' | 'submission';
  timestamp: string;
  relatedId?: string;
}

export interface StatusEvent {
  id: string;
  type: 'ban' | 'unban' | 'suspend' | 'unsuspend' | 'warn' | 'restrict' | 'account_created';
  reason: string;
  appliedBy: string;
  timestamp: string;
  duration?: string;
  relatedContent?: string;
  active: boolean;
}

export interface SocialConnection {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  status: string;
  since: string;
}

export interface ModerationInsight {
  riskLevel: 'low' | 'medium' | 'high';
  reasons: string[];
  reportAccuracy: number;
  totalReportsAgainst: number;
  totalReportsMade: number;
  pendingReports: number;
  validReports: number;
  invalidReports: number;
  suspiciousLogins: number;
  flaggedContent: number;
}

// ---- Mock Users ----
export const mockUsers: UserData[] = [
  { id: '1', name: 'John Doe', email: 'john.doe@email.com', role: 'user', status: 'active', joinedAt: 'Jan 15, 2024', lastActive: '2 hours ago', posts: 42, followers: 128, following: 56, reports: 0, codingSolved: 87, bio: 'Full-stack developer with 5 years of experience. Passionate about algorithms and system design.', location: 'San Francisco, CA' },
  { id: '2', name: 'Jane Smith', email: 'jane.smith@email.com', role: 'premium', status: 'active', joinedAt: 'Feb 20, 2024', lastActive: '5 minutes ago', posts: 156, followers: 342, following: 89, reports: 2, codingSolved: 142, bio: 'Senior software engineer at FAANG. Open source contributor.', location: 'New York, NY' },
  { id: '3', name: 'Bob Wilson', email: 'bob.wilson@email.com', role: 'user', status: 'banned', joinedAt: 'Mar 10, 2024', lastActive: '3 days ago', posts: 12, followers: 23, following: 15, reports: 8, codingSolved: 15, bio: 'Learning to code.', location: 'Los Angeles, CA' },
  { id: '4', name: 'Alice Brown', email: 'alice.brown@email.com', role: 'premium', status: 'suspended', joinedAt: 'Apr 5, 2024', lastActive: '1 week ago', posts: 78, followers: 210, following: 43, reports: 3, codingSolved: 56, bio: 'Data scientist and ML enthusiast.', location: 'Seattle, WA' },
  { id: '5', name: 'Mike Johnson', email: 'mike.johnson@email.com', role: 'user', status: 'active', joinedAt: 'May 12, 2024', lastActive: '1 hour ago', posts: 34, followers: 67, following: 29, reports: 0, codingSolved: 112, restriction: { type: 'posting', remaining: '18h left', reason: 'Spam posting' }, bio: 'Backend developer. Love distributed systems.', location: 'Austin, TX' },
  { id: '6', name: 'Sara Lee', email: 'sara.lee@email.com', role: 'user', status: 'active', joinedAt: 'Jun 8, 2024', lastActive: '30 minutes ago', posts: 23, followers: 45, following: 18, reports: 1, codingSolved: 34, bio: 'Frontend developer and UI/UX enthusiast.', location: 'Chicago, IL' },
];

export function getUserById(id: string): UserData | undefined {
  return mockUsers.find(u => u.id === id);
}

// ---- Mock Report Data by User ----
export function getReportsAgainst(userId: string): ReportAgainst[] {
  const user = getUserById(userId);
  if (!user || user.reports === 0) return [];
  return [
    { id: 'ra-1', reporter: 'Mike Johnson', reporterEmail: 'mike@email.com', reason: 'Harassment', contentType: 'post', contentPreview: 'This post contains inappropriate language and targeted harassment towards other community members. The user has been warned before about this behavior.', contentTitle: 'Offensive post about algorithms', timestamp: '2 days ago', severity: 'high', status: 'pending' },
    { id: 'ra-2', reporter: 'Sara Lee', reporterEmail: 'sara@email.com', reason: 'Spam', contentType: 'comment', contentPreview: 'Check out this amazing offer at example-spam.com for free coding courses and certifications...', timestamp: '1 week ago', severity: 'medium', status: 'resolved', moderationAction: 'Content removed', moderatedBy: 'Admin User', moderatedAt: '5 days ago' },
    { id: 'ra-3', reporter: 'Alice Brown', reporterEmail: 'alice@email.com', reason: 'Inappropriate language', contentType: 'post', contentPreview: 'This post contains profanity and derogatory language directed at specific community members.', contentTitle: 'Offensive post about algorithms', timestamp: '2 weeks ago', severity: 'low', status: 'resolved', moderationAction: 'Warning sent', moderatedBy: 'John Moderator', moderatedAt: '10 days ago' },
    ...(user.reports > 3 ? [
      { id: 'ra-4', reporter: 'John Doe', reporterEmail: 'john@email.com', reason: 'Impersonation', contentType: 'profile' as const, contentPreview: 'User is pretending to be a well-known tech influencer and using their photos.', timestamp: '3 weeks ago', severity: 'high' as const, status: 'resolved' as const, moderationAction: 'Profile reset', moderatedBy: 'Admin User', moderatedAt: '2 weeks ago' },
      { id: 'ra-5', reporter: 'Jane Smith', reporterEmail: 'jane@email.com', reason: 'Hate speech', contentType: 'comment' as const, contentPreview: 'Extremely offensive comment targeting a specific ethnic group.', timestamp: '1 month ago', severity: 'high' as const, status: 'resolved' as const, moderationAction: 'Content deleted + Warning', moderatedBy: 'Admin User', moderatedAt: '3 weeks ago' },
    ] : []),
  ].slice(0, user.reports);
}

export function getReportsMade(userId: string): ReportMade[] {
  return [
    { id: 'rm-1', target: 'Bob Wilson', reason: 'Harassment', timestamp: '3 days ago', outcome: 'valid' },
    { id: 'rm-2', target: 'Post #8923', reason: 'Spam', timestamp: '1 week ago', outcome: 'valid' },
    { id: 'rm-3', target: 'Alice Brown', reason: 'Impersonation', timestamp: '2 weeks ago', outcome: 'invalid' },
    { id: 'rm-4', target: 'Post #7654', reason: 'Inappropriate', timestamp: '3 weeks ago', outcome: 'valid' },
    { id: 'rm-5', target: 'Mike Johnson', reason: 'Harassment', timestamp: '1 month ago', outcome: 'invalid' },
  ];
}

// ---- Mock Content ----
export function getUserContent(userId: string): UserContent[] {
  return [
    { id: 'c-1', title: 'How to ace technical interviews', type: 'post', status: 'published', views: 234, likes: 45, comments: 12, flags: 0, date: '2 days ago', preview: 'Here are my top tips for acing technical interviews at FAANG companies...' },
    { id: 'c-2', title: 'My system design notes', type: 'post', status: 'published', views: 567, likes: 89, comments: 23, flags: 0, date: '5 days ago', preview: 'A comprehensive guide to system design interviews...' },
    { id: 'c-3', title: 'Re: Best sorting algorithms', type: 'comment', status: 'flagged', views: 0, likes: 2, comments: 0, flags: 3, date: '1 week ago', preview: 'I disagree with your analysis. QuickSort is clearly superior because...' },
    { id: 'c-4', title: 'Dynamic programming patterns', type: 'post', status: 'published', views: 1234, likes: 178, comments: 45, flags: 0, date: '2 weeks ago', preview: 'Understanding the core DP patterns will help you solve 90% of DP problems...' },
    { id: 'c-5', title: 'Binary Search template', type: 'post', status: 'published', views: 890, likes: 134, comments: 28, flags: 0, date: '3 weeks ago', preview: 'A universal binary search template that works for any problem...' },
    { id: 'c-6', title: 'Re: Graph traversal techniques', type: 'comment', status: 'published', views: 0, likes: 8, comments: 0, flags: 0, date: '1 month ago', preview: 'Great explanation! I would also add that for weighted graphs you should consider...' },
    { id: 'c-7', title: 'Sliding window cheat sheet', type: 'post', status: 'draft', views: 0, likes: 0, comments: 0, flags: 0, date: '1 month ago', preview: 'Draft notes on sliding window patterns...' },
  ];
}

// ---- Mock Sessions ----
export function getLoginSessions(userId: string): LoginSession[] {
  return [
    { id: 'ls-1', ip: '192.168.1.45', location: 'San Francisco, CA', device: 'Desktop', browser: 'Chrome 122', os: 'Windows 11', timestamp: '2 hours ago', suspicious: false, current: true },
    { id: 'ls-2', ip: '192.168.1.45', location: 'San Francisco, CA', device: 'Desktop', browser: 'Chrome 122', os: 'Windows 11', timestamp: '1 day ago', suspicious: false, current: false },
    { id: 'ls-3', ip: '10.0.0.1', location: 'New York, NY', device: 'Mobile', browser: 'Safari 17', os: 'iOS 17', timestamp: '3 days ago', suspicious: false, current: false },
    { id: 'ls-4', ip: '203.45.67.89', location: 'Mumbai, India', device: 'Desktop', browser: 'Firefox 123', os: 'Ubuntu 22', timestamp: '5 days ago', suspicious: true, current: false },
    { id: 'ls-5', ip: '192.168.1.45', location: 'San Francisco, CA', device: 'Desktop', browser: 'Chrome 121', os: 'Windows 11', timestamp: '1 week ago', suspicious: false, current: false },
    { id: 'ls-6', ip: '45.67.89.12', location: 'London, UK', device: 'Tablet', browser: 'Chrome 122', os: 'iPadOS 17', timestamp: '2 weeks ago', suspicious: true, current: false },
  ];
}

// ---- Mock Activity ----
export function getActivity(userId: string): ActivityEvent[] {
  return [
    { id: 'a-1', action: 'Logged in from San Francisco, CA', type: 'login', timestamp: '2 hours ago' },
    { id: 'a-2', action: 'Posted a new article', details: 'How to ace technical interviews', type: 'post', timestamp: '3 hours ago', relatedId: 'c-1' },
    { id: 'a-3', action: 'Solved coding problem', details: 'Two Sum (#1) — Accepted', type: 'code', timestamp: '5 hours ago' },
    { id: 'a-4', action: 'Commented on post', details: 'Re: Best sorting algorithms', type: 'comment', timestamp: '1 day ago', relatedId: 'c-3' },
    { id: 'a-5', action: 'Updated profile bio', type: 'profile', timestamp: '2 days ago' },
    { id: 'a-6', action: 'Followed @johndoe', type: 'follow', timestamp: '3 days ago' },
    { id: 'a-7', action: 'Submitted solution for Binary Tree', details: 'Binary Tree Level Order Traversal — Accepted', type: 'submission', timestamp: '4 days ago' },
    { id: 'a-8', action: 'Reported user Bob Wilson', details: 'Reason: Harassment', type: 'report', timestamp: '5 days ago' },
    { id: 'a-9', action: 'Solved coding problem', details: 'Merge Intervals (#56) — Accepted', type: 'code', timestamp: '6 days ago' },
    { id: 'a-10', action: 'Logged in from New York, NY', type: 'login', timestamp: '1 week ago' },
    { id: 'a-11', action: 'Posted a new article', details: 'My system design notes', type: 'post', timestamp: '1 week ago', relatedId: 'c-2' },
    { id: 'a-12', action: 'Solved coding problem', details: 'Longest Substring Without Repeating Characters (#3) — Accepted', type: 'code', timestamp: '2 weeks ago' },
  ];
}

// ---- Mock Social ----
export function getFollowers(userId: string): SocialConnection[] {
  return [
    { id: 'f-1', name: 'Alice Brown', email: 'alice@email.com', role: 'premium', status: 'suspended', since: '3 months ago' },
    { id: 'f-2', name: 'Mike Johnson', email: 'mike@email.com', role: 'user', status: 'active', since: '2 months ago' },
    { id: 'f-3', name: 'Sara Lee', email: 'sara@email.com', role: 'user', status: 'active', since: '1 month ago' },
    { id: 'f-4', name: 'David Chen', email: 'david@email.com', role: 'premium', status: 'active', since: '3 weeks ago' },
    { id: 'f-5', name: 'Emily Parker', email: 'emily@email.com', role: 'user', status: 'active', since: '2 weeks ago' },
  ];
}

export function getFollowing(userId: string): SocialConnection[] {
  return [
    { id: 'fg-1', name: 'Bob Wilson', email: 'bob@email.com', role: 'user', status: 'banned', since: '4 months ago' },
    { id: 'fg-2', name: 'Jane Smith', email: 'jane@email.com', role: 'premium', status: 'active', since: '2 months ago' },
    { id: 'fg-3', name: 'Tom Harris', email: 'tom@email.com', role: 'user', status: 'active', since: '1 month ago' },
  ];
}

// ---- Mock Status History ----
export function getStatusHistory(userId: string): StatusEvent[] {
  const user = getUserById(userId);
  if (!user) return [];

  const events: StatusEvent[] = [
    { id: 'sh-1', type: 'account_created', reason: 'Account registered via email', appliedBy: 'System', timestamp: user.joinedAt, active: false },
  ];

  if (user.status === 'banned') {
    events.push({ id: 'sh-2', type: 'warn', reason: 'Inappropriate comments on multiple posts', appliedBy: 'John Moderator', timestamp: '2 weeks ago', active: false });
    events.push({ id: 'sh-3', type: 'ban', reason: 'Repeated harassment — 8 reports, continued violations after warning', appliedBy: 'Admin User', timestamp: '3 days ago', active: true });
  }
  if (user.status === 'suspended') {
    events.push({ id: 'sh-2', type: 'suspend', reason: 'Spam posting — 3 reports from different users', appliedBy: 'Admin User', timestamp: '1 week ago', duration: '14 days', active: true });
  }
  if (user.restriction) {
    events.push({ id: 'sh-r', type: 'restrict', reason: user.restriction.reason, appliedBy: 'Admin User', timestamp: '1 day ago', duration: user.restriction.remaining, active: true });
  }

  return events.reverse();
}

// ---- Moderation Insights ----
export function getModerationInsights(userId: string): ModerationInsight {
  const user = getUserById(userId);
  const reportsAgainst = getReportsAgainst(userId);
  const reportsMade = getReportsMade(userId);
  const sessions = getLoginSessions(userId);
  const content = getUserContent(userId);

  const validReports = reportsMade.filter(r => r.outcome === 'valid').length;
  const invalidReports = reportsMade.filter(r => r.outcome === 'invalid').length;
  const pendingReports = reportsAgainst.filter(r => r.status === 'pending').length;
  const accuracy = reportsMade.length > 0 ? Math.round((validReports / reportsMade.length) * 100) : 100;
  const suspiciousLogins = sessions.filter(s => s.suspicious).length;
  const flaggedContent = content.filter(c => c.status === 'flagged').length;

  const reasons: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' = 'low';

  if (reportsAgainst.length >= 5) {
    reasons.push(`${reportsAgainst.length} reports received`);
    riskLevel = 'high';
  } else if (reportsAgainst.length >= 2) {
    reasons.push(`${reportsAgainst.length} reports received`);
    if (riskLevel === 'low') riskLevel = 'medium';
  }

  if (reportsMade.length >= 5 && accuracy < 50) {
    reasons.push(`Low report accuracy (${accuracy}%)`);
    if (riskLevel !== 'high') riskLevel = 'medium';
  }

  if (suspiciousLogins > 0) {
    reasons.push(`${suspiciousLogins} suspicious login(s)`);
    if (riskLevel === 'low') riskLevel = 'medium';
  }

  if (flaggedContent > 0) {
    reasons.push(`${flaggedContent} flagged content item(s)`);
    if (riskLevel === 'low') riskLevel = 'medium';
  }

  if (user?.status === 'banned') {
    reasons.push('Account is banned');
    riskLevel = 'high';
  } else if (user?.status === 'suspended') {
    reasons.push('Account is suspended');
    if (riskLevel === 'low') riskLevel = 'medium';
  }

  if (reasons.length === 0) reasons.push('No concerns detected');

  return {
    riskLevel,
    reasons,
    reportAccuracy: accuracy,
    totalReportsAgainst: reportsAgainst.length,
    totalReportsMade: reportsMade.length,
    pendingReports,
    validReports,
    invalidReports,
    suspiciousLogins,
    flaggedContent,
  };
}
