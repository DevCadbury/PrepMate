import { apiClient } from "../../../lib/apiClient";
import {
  AdminInsights,
  AdminLogResponse,
  AdminOverview,
  AdminUserRecord,
  ApiResponse,
  ChatReportItem,
  CodingProposal,
  ModerationPost,
  SupportTicketRecord,
} from "../types";

interface PaginationQuery {
  page?: number;
  limit?: number;
}

interface UserListQuery extends PaginationQuery {
  search?: string;
  role?: string;
  status?: string;
}

interface SupportQuery extends PaginationQuery {
  status?: string;
  category?: string;
  search?: string;
}

interface ModerationPostsQuery extends PaginationQuery {
  status?: string;
  reportedOnly?: boolean;
  search?: string;
}

interface ChatReportsQuery extends PaginationQuery {
  status?: string;
}

interface CodingQueueQuery extends PaginationQuery {
  status?: string;
}

const buildQueryString = (params: Record<string, unknown>) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === "all") {
      return;
    }

    query.set(key, String(value));
  });

  const text = query.toString();
  return text ? `?${text}` : "";
};

export const adminConsoleApi = {
  getOverview: async () => {
    const response = await apiClient.get<ApiResponse<AdminOverview>>("/admin/overview");
    return response.data;
  },

  getInsights: async () => {
    const response = await apiClient.get<ApiResponse<AdminInsights>>("/admin/insights");
    return response.data;
  },

  getUsers: async (query: UserListQuery) => {
    const queryString = buildQueryString(query as Record<string, unknown>);
    const response = await apiClient.get<ApiResponse<{ users: AdminUserRecord[] }>>(
      `/admin/users${queryString}`
    );
    return response.data.users || [];
  },

  updateUserRole: async (userId: string, role: string) => {
    await apiClient.put(`/admin/users/${userId}/role`, { role });
  },

  updateUserStatus: async (userId: string, status: "active" | "suspended") => {
    await apiClient.patch(`/admin/users/${userId}/status`, { status });
  },

  getSupportTickets: async (query: SupportQuery) => {
    const queryString = buildQueryString(query as Record<string, unknown>);
    const response = await apiClient.get<
      ApiResponse<{ tickets: SupportTicketRecord[] }>
    >(`/support/tickets${queryString}`);
    return response.data.tickets || [];
  },

  updateSupportTicket: async (
    ticketId: string,
    payload: {
      status?: SupportTicketRecord["status"];
      priority?: SupportTicketRecord["priority"];
      adminNotes?: string;
    }
  ) => {
    await apiClient.patch(`/support/tickets/${ticketId}`, payload);
  },

  getModerationPosts: async (query: ModerationPostsQuery) => {
    const queryString = buildQueryString(query as Record<string, unknown>);
    const response = await apiClient.get<ApiResponse<{ posts: ModerationPost[] }>>(
      `/admin/social/posts${queryString}`
    );
    return response.data.posts || [];
  },

  moderatePost: async (
    postId: string,
    payload: {
      status: "active" | "hidden" | "archived";
      resolutionNote?: string;
    }
  ) => {
    await apiClient.patch(`/admin/social/posts/${postId}/moderate`, payload);
  },

  getChatReports: async (query: ChatReportsQuery) => {
    const queryString = buildQueryString(query as Record<string, unknown>);
    const response = await apiClient.get<ApiResponse<{ reports: ChatReportItem[] }>>(
      `/admin/chat/reports${queryString}`
    );
    return response.data.reports || [];
  },

  reviewChatReport: async (
    messageId: string,
    payload: {
      decision: "resolved" | "dismissed" | "blocked";
      note?: string;
    }
  ) => {
    await apiClient.patch(`/admin/chat/reports/${messageId}`, payload);
  },

  getCodingQueue: async (query: CodingQueueQuery) => {
    const queryString = buildQueryString(query as Record<string, unknown>);
    const response = await apiClient.get<
      ApiResponse<{ proposals: CodingProposal[] }>
    >(`/coding/admin/problem-submissions${queryString}`);
    return response.data.proposals || [];
  },

  approveCodingSubmission: async (problemId: string, notes?: string) => {
    await apiClient.patch(`/coding/admin/problem-submissions/${problemId}/approve`, {
      notes,
    });
  },

  rejectCodingSubmission: async (problemId: string, reason: string) => {
    await apiClient.patch(`/coding/admin/problem-submissions/${problemId}/reject`, {
      reason,
    });
  },

  getRecentLogs: async (lineCount = 200) => {
    const queryString = buildQueryString({ lines: lineCount });
    const response = await apiClient.get<ApiResponse<AdminLogResponse>>(
      `/admin/logs/recent${queryString}`
    );
    return response.data.lines || [];
  },
};
