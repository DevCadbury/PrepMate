import { ApiError, apiClient } from "../../lib/apiClient";

export interface FollowRequestUser {
  _id: string;
  name: string;
  username: string;
  profilePicture?: string;
}

export interface FollowRequestAction {
  _id: string;
  requester?: FollowRequestUser;
  actionBy?: FollowRequestUser;
  action: "accepted" | "rejected" | "blocked";
  source: "single" | "bulk";
  createdAt: string;
}

export interface FollowRequestBundle {
  followRequests: FollowRequestUser[];
  historyActions: FollowRequestAction[];
  blockedUsers: FollowRequestUser[];
}

const FOLLOW_REQUESTS_CACHE_TTL_MS = 8000;

let followRequestsCache: {
  expiresAt: number;
  data: FollowRequestBundle;
} | null = null;

const toList = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const readErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

export const followRequestsApi = {
  clearCache() {
    followRequestsCache = null;
  },

  async fetchBundle(options?: { force?: boolean }): Promise<FollowRequestBundle> {
    const force = options?.force === true;
    if (!force && followRequestsCache && followRequestsCache.expiresAt > Date.now()) {
      return followRequestsCache.data;
    }

    const [requestsResult, historyResult, blockedResult] = await Promise.allSettled([
      apiClient.get<any>("/users/follow-requests"),
      apiClient.get<any>("/users/follow-requests/history?limit=40"),
      apiClient.get<any>("/users/blocked"),
    ]);

    if (requestsResult.status === "rejected") {
      throw new Error(readErrorMessage(requestsResult.reason, "Failed to fetch follow requests"));
    }

    const requestsPayload = requestsResult.value;
    const historyPayload = historyResult.status === "fulfilled" ? historyResult.value : {};
    const blockedPayload = blockedResult.status === "fulfilled" ? blockedResult.value : {};

    const blockedFromRequests = toList<FollowRequestUser>(requestsPayload?.data?.blockedUsers);
    const blockedUsers =
      blockedResult.status === "fulfilled"
        ? toList<FollowRequestUser>(blockedPayload?.data?.blockedUsers)
        : blockedFromRequests;

    const bundle: FollowRequestBundle = {
      followRequests: toList<FollowRequestUser>(requestsPayload?.data?.followRequests),
      historyActions: toList<FollowRequestAction>(historyPayload?.data?.actions),
      blockedUsers,
    };

    followRequestsCache = {
      expiresAt: Date.now() + FOLLOW_REQUESTS_CACHE_TTL_MS,
      data: bundle,
    };

    return bundle;
  },

  async actOnRequest(requesterId: string, action: "accept" | "reject") {
    const endpoint =
      action === "accept"
        ? `/users/accept-follow-request/${requesterId}`
        : `/users/reject-follow-request/${requesterId}`;

    const payload = await apiClient.post<any>(endpoint);
    this.clearCache();
    return payload;
  },

  async bulkAction(action: "accept" | "reject", userIds: string[]) {
    const payload = await apiClient.post<any>("/users/follow-requests/bulk", {
      action,
      userIds,
    });
    this.clearCache();
    return payload;
  },

  async blockUser(userId: string) {
    const payload = await apiClient.post<any>(`/users/block/${userId}`);
    this.clearCache();
    return payload;
  },

  async unblockUser(userId: string) {
    const payload = await apiClient.post<any>(`/users/unblock/${userId}`);
    this.clearCache();
    return payload;
  },
};
