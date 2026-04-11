export type AdminRole = 'superadmin' | 'moderator' | 'support_admin' | 'analytics_admin';

export type AdminTheme = 'white' | 'black' | 'colorful';

export type AdminPermission = string;

export type AdminAction =
  | 'ban' | 'delete' | 'suspend' | 'moderate'
  | 'view_analytics' | 'manage_admins' | 'manage_settings'
  | 'manage_coding' | 'manage_support' | 'reset_password';

export interface AdminUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  adminRole?: AdminRole | null;
  status: 'active' | 'suspended' | 'pending';
  joinDate: string;
  lastLogin: string;
  subscription: string;
  permissions: string[];
  googleLinked: boolean;
  profilePicture: string;
  restrictions?: UserRestrictions;
}

export interface UserRestrictions {
  canPost: boolean;
  canComment: boolean;
  canFollow: boolean;
  canLink: boolean;
}

export interface UserProfileCard {
  user: AdminUser & {
    profile?: {
      bio?: string;
      location?: string;
      company?: string;
      position?: string;
    };
    followers?: Array<{ _id: string; name: string; username: string; profilePicture: string }>;
    following?: Array<{ _id: string; name: string; username: string; profilePicture: string }>;
    metrics?: {
      totalPosts: number;
      totalComments: number;
      totalLikes: number;
      profileViews: number;
    };
    preferences?: {
      privacy?: Record<string, any>;
      notifications?: Record<string, any>;
      account?: Record<string, any>;
    };
  };
  posts: Array<{
    id: string;
    content: string;
    type: string;
    status: string;
    likesCount: number;
    commentsCount: number;
    reportsCount: number;
    createdAt: string;
  }>;
  reportsAgainst: number;
  pendingPostReports: number;
  codingActivity: {
    totalSubmissions: number;
    submissions: any[];
  };
  interviewCount: number;
  violations: any[];
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  suspendedUsers: number;
  totalRevenue: number;
  monthlyGrowth: number;
}

export interface AnalyticsData {
  users: {
    total: number;
    active: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
    dailyActive: number;
    monthlyActive: number;
    growthPercent: string | number;
  };
  engagement: {
    totalPosts: number;
    postsToday: number;
    totalComments: number;
    avgPostsPerUser: string | number;
  };
  interviews: {
    total: number;
    thisWeek: number;
  };
  coding: {
    totalSubmissions: number;
    submissionsThisWeek: number;
  };
  revenue: {
    mrr: string;
    paidUsers: number;
    subscriptions: Record<string, number>;
  };
  growthChart: Array<{ _id: string; count: number }>;
}

export interface ContentPost {
  id: string;
  type: string;
  status: string;
  contentPreview: string;
  tags: string[];
  reportsCount: number;
  pendingReportsCount: number;
  latestReportReason: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    username: string;
    profilePicture: string;
  } | null;
}

export interface ChatReport {
  messageId: string;
  roomId: string | null;
  messagePreview: string;
  sender: { id: string; name: string; username: string; profilePicture: string } | null;
  receiver: { id: string; name: string; username: string; profilePicture: string } | null;
  reportCount: number;
  lastReason: string;
  lastReportedAt: string;
  status: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface SystemHealthService {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  latency: string;
  uptime: string;
  details?: string;
}

export interface SystemHealth {
  services: SystemHealthService[];
  serverUptime: number;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
  };
  nodeVersion: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  adminNotes: string;
  user: {
    id: string;
    name: string;
    username: string;
    email: string;
    profilePicture: string;
  } | null;
  assignedTo: {
    id: string;
    name: string;
    username: string;
  } | null;
  attachments: Array<{ name: string; url: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface CodingProblem {
  id: string;
  title: string;
  difficulty: string;
  tags: string[];
  status: string;
  createdBy: { id: string; name: string; username: string } | null;
  createdAt: string;
}

export interface AIUsageData {
  configuredUsers: number;
  validApiKeys: number;
  totalAIInterviews: number;
  usage: {
    requestsToday: number;
    errorsToday: number;
    estimatedCost: string;
  };
}

export interface ActivityLog {
  action: string;
  actor: string;
  target: string;
  timestamp: string;
  details?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type AdminPage =
  | 'dashboard' | 'users' | 'content' | 'ai'
  | 'analytics' | 'coding' | 'settings' | 'help';

export interface InsightsData {
  follow: {
    pendingIncomingRequests: number;
    pendingOutgoingRequests: number;
    usersWithIncomingRequests: number;
    usersWithOutgoingRequests: number;
    actionsLast7d: number;
  };
  notifications: {
    total: number;
    unread: number;
    system: number;
    createdLast24h: number;
  };
  ai: {
    configuredUsers: number;
    validUsers: number;
  };
  subscriptions: Record<string, number>;
  audit: {
    pendingPostReports: number;
    openChatReports: number;
    postModerationActions24h: number;
    chatModerationActions24h: number;
    moderationActions24h: number;
  };
}

export interface AdminPermissionCatalogEntry {
  key: string;
  module: string;
  label: string;
  description: string;
}

export interface AdminMeData {
  user: AdminUser;
  adminRole: AdminRole;
  customPermissions: string[];
  effectivePermissions: string[];
  permissionCatalog: AdminPermissionCatalogEntry[];
  roleDefaults: Record<AdminRole, string[]>;
}
