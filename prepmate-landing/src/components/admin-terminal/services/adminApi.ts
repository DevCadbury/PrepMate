import { apiClient } from '../../../lib/apiClient';
import type {
  AdminUser, UserProfileCard, AnalyticsData, ContentPost,
  ChatReport, SystemHealth, SupportTicket, CodingProblem,
  AIUsageData, Pagination, InsightsData, AdminMeData, AdminPermissionCatalogEntry,
} from '../types';

// ─── Dashboard ───────────────────────────────────────────────────────────────

export const fetchDashboard = async () => {
  const res = await apiClient.fetch('/admin/dashboard');
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const fetchAdminMe = async (): Promise<AdminMeData> => {
  const res = await apiClient.fetch('/admin/me');
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const fetchPermissionCatalog = async (): Promise<{
  permissions: AdminPermissionCatalogEntry[];
  grouped: Record<string, AdminPermissionCatalogEntry[]>;
  roleDefaults: Record<string, string[]>;
}> => {
  const res = await apiClient.fetch('/admin/permissions/catalog');
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const fetchOverview = async () => {
  const res = await apiClient.fetch('/admin/overview');
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data as {
    users: { total: number; active: number; admins: number; support: number };
    social: { totalPosts: number; hiddenPosts: number; reportedPosts: number; openChatReports: number };
    support: { totalTickets: number; openTickets: number };
    coding: { pendingSubmissions: number };
  };
};

export const fetchInsights = async (): Promise<InsightsData> => {
  const res = await apiClient.fetch('/admin/insights');
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

// ─── Analytics ───────────────────────────────────────────────────────────────

export const fetchAnalytics = async (): Promise<AnalyticsData> => {
  const res = await apiClient.fetch('/admin/analytics/overview');
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

// ─── System Health ────────────────────────────────────────────────────────────

export const fetchSystemHealth = async (): Promise<SystemHealth> => {
  const res = await apiClient.fetch('/admin/system/health');
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

// ─── Users ───────────────────────────────────────────────────────────────────

export const fetchUsers = async (params: {
  page?: number; limit?: number; search?: string; role?: string; status?: string;
}): Promise<{ users: AdminUser[]; pagination: Pagination }> => {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.search) query.set('search', params.search);
  if (params.role) query.set('role', params.role);
  if (params.status) query.set('status', params.status);

  const res = await apiClient.fetch(`/admin/users?${query.toString()}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const fetchUserProfile = async (userId: string): Promise<UserProfileCard> => {
  const res = await apiClient.fetch(`/admin/users/${userId}/profile`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const updateUserStatus = async (userId: string, status: 'active' | 'suspended') => {
  const res = await apiClient.fetch(`/admin/users/${userId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const suspendUser = async (userId: string, reason?: string, duration?: number) => {
  const res = await apiClient.fetch(`/admin/users/${userId}/suspend-detailed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason, duration }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const activateUser = async (userId: string) => {
  const res = await apiClient.fetch(`/admin/users/${userId}/activate`, { method: 'POST' });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const deleteUser = async (userId: string) => {
  const res = await apiClient.fetch(`/admin/users/${userId}/delete`, { method: 'POST' });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const updateUserRole = async (userId: string, role: string) => {
  const res = await apiClient.fetch(`/admin/users/${userId}/role`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const updateUserRestrictions = async (userId: string, restrictions: Record<string, boolean>) => {
  const res = await apiClient.fetch(`/admin/users/${userId}/restrictions`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(restrictions),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const updateUserPermissions = async (userId: string, permissions: string[]) => {
  const res = await apiClient.fetch(`/admin/users/${userId}/permissions`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ permissions }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const fetchUserCustomPermissions = async (userId: string): Promise<{
  user: { id: string; name: string; email: string; role: string; adminRole: string | null };
  customPermissions: string[];
  effectiveAdminPermissions: string[];
}> => {
  const res = await apiClient.fetch(`/admin/users/${userId}/custom-permissions`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const updateCustomPermissions = async (userId: string, permissions: string[]) => {
  const res = await apiClient.fetch(`/admin/users/${userId}/custom-permissions`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ permissions }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const updateAccountPermissions = async (userId: string, payload: {
  privacy?: Record<string, any>;
  notifications?: Record<string, any>;
  account?: Record<string, any>;
}) => {
  const res = await apiClient.fetch(`/admin/users/${userId}/account-permissions`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const resetUserPassword = async (userId: string) => {
  const res = await apiClient.fetch(`/admin/users/${userId}/reset-password`, { method: 'POST' });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data as { resetToken: string; resetUrl: string; expiresIn: string };
};

export const updateAdminRole = async (userId: string, adminRole: string) => {
  const res = await apiClient.fetch(`/admin/users/${userId}/admin-role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminRole }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

// ─── Content Moderation ──────────────────────────────────────────────────────

export const fetchPosts = async (params: {
  page?: number; limit?: number; reportedOnly?: boolean; status?: string; search?: string;
}): Promise<{ posts: ContentPost[]; pagination: Pagination }> => {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.reportedOnly) query.set('reportedOnly', 'true');
  if (params.status) query.set('status', params.status);
  if (params.search) query.set('search', params.search);

  const res = await apiClient.fetch(`/admin/social/posts?${query.toString()}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const moderatePost = async (postId: string, status: string, resolutionNote?: string) => {
  const res = await apiClient.fetch(`/admin/social/posts/${postId}/moderate`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, resolutionNote }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const fetchChatReports = async (params: {
  page?: number; limit?: number; status?: string;
}): Promise<{ reports: ChatReport[]; pagination: Pagination }> => {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.status) query.set('status', params.status);

  const res = await apiClient.fetch(`/admin/chat/reports?${query.toString()}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const reviewChatReport = async (messageId: string, decision: string, note?: string) => {
  const res = await apiClient.fetch(`/admin/chat/reports/${messageId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision, note }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

// ─── Activity Logs ───────────────────────────────────────────────────────────

export const fetchActivityLogs = async (lines = 200): Promise<string[]> => {
  const res = await apiClient.fetch(`/admin/logs/recent?lines=${lines}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data.lines;
};

// ─── AI Module ───────────────────────────────────────────────────────────────

export const fetchAIUsage = async (): Promise<AIUsageData> => {
  const res = await apiClient.fetch('/admin/ai/usage');
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

// ─── Coding Management ──────────────────────────────────────────────────────

export const fetchCodingProblems = async (params: {
  page?: number; limit?: number; status?: string; search?: string;
}): Promise<{ problems: CodingProblem[]; pagination: Pagination }> => {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.status) query.set('status', params.status);
  if (params.search) query.set('search', params.search);

  const res = await apiClient.fetch(`/admin/coding/problems?${query.toString()}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const updateCodingProblem = async (problemId: string, updates: Record<string, any>) => {
  const res = await apiClient.fetch(`/admin/coding/problems/${problemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const deleteCodingProblem = async (problemId: string) => {
  const res = await apiClient.fetch(`/admin/coding/problems/${problemId}`, { method: 'DELETE' });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

// ─── Support Tickets ─────────────────────────────────────────────────────────

export const fetchSupportTickets = async (params: {
  page?: number; limit?: number; status?: string; category?: string; search?: string;
}): Promise<{ tickets: SupportTicket[]; pagination: Pagination }> => {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.status) query.set('status', params.status);
  if (params.category) query.set('category', params.category);
  if (params.search) query.set('search', params.search);

  const res = await apiClient.fetch(`/support/tickets?${query.toString()}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const updateSupportTicket = async (ticketId: string, updates: {
  status?: string; priority?: string; adminNotes?: string; assignedTo?: string | null;
}) => {
  const res = await apiClient.fetch(`/support/tickets/${ticketId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};
