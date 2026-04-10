export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface AdminOverview {
  users: {
    total: number;
    active: number;
    admins: number;
    support: number;
  };
  social: {
    totalPosts: number;
    hiddenPosts: number;
    reportedPosts: number;
    openChatReports: number;
  };
  support: {
    totalTickets: number;
    openTickets: number;
  };
  coding: {
    pendingSubmissions: number;
  };
}

export interface AdminInsights {
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
  subscriptions: {
    free: number;
    basic: number;
    premium: number;
    enterprise: number;
  };
  audit: {
    pendingPostReports: number;
    openChatReports: number;
    postModerationActions24h: number;
    chatModerationActions24h: number;
    moderationActions24h: number;
  };
}

export interface AdminUserRecord {
  id: string;
  name: string;
  username?: string;
  email: string;
  role: "student" | "teacher" | "hr" | "admin" | "support";
  status: "active" | "suspended" | "pending";
  profilePicture?: string;
  joinDate?: string;
  lastLogin?: string;
  subscription?: "free" | "basic" | "premium" | "enterprise";
  permissions?: string[];
  googleLinked?: boolean;
}

export interface SupportTicketRecord {
  id: string;
  subject: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  adminNotes?: string;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id: string;
    name?: string;
    username?: string;
    email?: string;
  };
}

export interface ModerationPost {
  id: string;
  type: string;
  status: "active" | "archived" | "deleted" | "hidden";
  contentPreview: string;
  reportsCount: number;
  pendingReportsCount: number;
  latestReportReason?: string;
  createdAt?: string;
  user?: {
    id: string;
    name?: string;
    username?: string;
  };
}

export interface ChatReportItem {
  messageId: string;
  roomId?: string | null;
  messagePreview: string;
  reportCount: number;
  lastReason?: string;
  lastReportedAt?: string;
  status: "open" | "resolved" | "dismissed" | "blocked";
  sender?: {
    id: string;
    name?: string;
    username?: string;
  };
}

export interface CodingProposal {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tags: string[];
  approvalStatus: "pending" | "approved" | "rejected";
  approvalNotes?: string;
  isPublished: boolean;
  submittedAt?: string;
  createdBy?: {
    id: string;
    name?: string;
    username?: string;
  };
}

export interface AdminLogResponse {
  lines: string[];
}

export interface Notice {
  type: "success" | "error" | "info";
  message: string;
}
