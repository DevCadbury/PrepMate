import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Badge } from "../../ui/badge";
import { Skeleton } from "../../ui/skeleton";
import { useToast } from "../../ui/toast";
import {
  Ban,
  Check,
  Clock3,
  RefreshCcw,
  Shield,
  UserRoundCheck,
  UserRoundX,
  Users,
  X,
} from "lucide-react";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import {
  followRequestsApi,
  FollowRequestAction,
  FollowRequestUser,
} from "../../../services/api/followRequestsApi";

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSeconds < 60) return "Just now";
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  if (diffSeconds < 2592000) return `${Math.floor(diffSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

const FOLLOW_REQUESTS_MIN_REFETCH_MS = 1000;

const FollowRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [requests, setRequests] = useState<FollowRequestUser[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<FollowRequestUser[]>([]);
  const [historyActions, setHistoryActions] = useState<FollowRequestAction[]>([]);

  const [query, setQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const debouncedQuery = useDebouncedValue(query, 180);

  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const showErrorRef = useRef(showError);
  const fetchInFlightRef = useRef(false);
  const lastFetchAtRef = useRef(0);

  useEffect(() => {
    showErrorRef.current = showError;
  }, [showError]);

  const fetchFollowRequestData = useCallback(async ({
    silent = false,
    force = false,
  }: {
    silent?: boolean;
    force?: boolean;
  } = {}) => {
    const now = Date.now();
    if (fetchInFlightRef.current) {
      return;
    }

    if (!force && now - lastFetchAtRef.current < FOLLOW_REQUESTS_MIN_REFETCH_MS) {
      return;
    }

    fetchInFlightRef.current = true;
    lastFetchAtRef.current = now;

    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
      setHistoryLoading(true);
    }

    try {
      const bundle = await followRequestsApi.fetchBundle({ force });

      setRequests(bundle.followRequests);
      setHistoryActions(bundle.historyActions);
      setBlockedUsers(bundle.blockedUsers);
    } catch (err: any) {
      showErrorRef.current(
        "Unable to load follow requests",
        err?.message || "Please try again."
      );
    } finally {
      setLoading(false);
      setHistoryLoading(false);
      setRefreshing(false);
      fetchInFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    void fetchFollowRequestData({ force: true });
  }, [fetchFollowRequestData]);

  const filteredRequests = useMemo(() => {
    const term = debouncedQuery.trim().toLowerCase();
    if (!term) return requests;
    return requests.filter(
      (request) =>
        request.name?.toLowerCase().includes(term) ||
        request.username?.toLowerCase().includes(term)
    );
  }, [debouncedQuery, requests]);

  const filteredHistory = useMemo(() => {
    const term = debouncedQuery.trim().toLowerCase();
    if (!term) return historyActions;

    return historyActions.filter((item) => {
      const requesterName = item.requester?.name?.toLowerCase() || "";
      const requesterUsername = item.requester?.username?.toLowerCase() || "";
      return requesterName.includes(term) || requesterUsername.includes(term);
    });
  }, [debouncedQuery, historyActions]);

  const toggleSelection = (userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    const allSelected =
      filteredRequests.length > 0 &&
      filteredRequests.every((request) => selectedUserIds.has(request._id));

    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        filteredRequests.forEach((request) => next.delete(request._id));
      } else {
        filteredRequests.forEach((request) => next.add(request._id));
      }
      return next;
    });
  };

  const removeRequestLocally = (requesterId: string) => {
    setRequests((prev) => prev.filter((request) => request._id !== requesterId));
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      next.delete(requesterId);
      return next;
    });
  };

  const handleSingleAction = async (requesterId: string, action: "accept" | "reject") => {
    setActionLoading(requesterId);
    try {
      await followRequestsApi.actOnRequest(requesterId, action);

      removeRequestLocally(requesterId);
      success(action === "accept" ? "Request accepted" : "Request rejected");
      void fetchFollowRequestData({
        silent: true,
        force: true,
      });
    } catch (err: any) {
      showError(
        `Failed to ${action} request`,
        err?.message || "Please try again."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkAction = async (action: "accept" | "reject") => {
    const userIds = Array.from(selectedUserIds);
    if (userIds.length === 0) {
      showError("No requests selected", "Select one or more requests first.");
      return;
    }

    setActionLoading("bulk");
    try {
      const payload = await followRequestsApi.bulkAction(action, userIds);

      const processedIds = Array.isArray(payload?.data?.userIds)
        ? payload.data.userIds
        : userIds;
      const skippedBlockedIds = Array.isArray(payload?.data?.skippedBlockedUserIds)
        ? payload.data.skippedBlockedUserIds
        : [];

      setRequests((prev) =>
        prev.filter((request) => !processedIds.includes(request._id))
      );
      setSelectedUserIds((prev) => {
        const next = new Set(prev);
        processedIds.forEach((id: string) => next.delete(id));
        skippedBlockedIds.forEach((id: string) => next.delete(id));
        return next;
      });

      if (skippedBlockedIds.length > 0) {
        success(
          action === "accept"
            ? `Accepted ${processedIds.length}, skipped ${skippedBlockedIds.length} blocked user(s)`
            : `Rejected ${processedIds.length}`
        );
      } else {
        success(
          action === "accept"
            ? `Accepted ${processedIds.length} request(s)`
            : `Rejected ${processedIds.length} request(s)`
        );
      }

      void fetchFollowRequestData({
        silent: true,
        force: true,
      });
    } catch (err: any) {
      showError(`Bulk ${action} failed`, err?.message || "Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleBlockRequester = async (requester: FollowRequestUser) => {
    setActionLoading(`block-${requester._id}`);
    try {
      await followRequestsApi.blockUser(requester._id);

      removeRequestLocally(requester._id);
      setBlockedUsers((prev) => {
        if (prev.some((user) => user._id === requester._id)) return prev;
        return [requester, ...prev];
      });
      success(`Blocked @${requester.username}`);
      void fetchFollowRequestData({
        silent: true,
        force: true,
      });
    } catch (err: any) {
      showError("Failed to block user", err?.message || "Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnblock = async (userToUnblock: FollowRequestUser) => {
    setActionLoading(`unblock-${userToUnblock._id}`);
    try {
      await followRequestsApi.unblockUser(userToUnblock._id);

      setBlockedUsers((prev) => prev.filter((user) => user._id !== userToUnblock._id));
      success(`Unblocked @${userToUnblock.username}`);
    } catch (err: any) {
      showError("Failed to unblock user", err?.message || "Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const actionBadge = (action: FollowRequestAction["action"]) => {
    if (action === "accepted") {
      return <Badge className="bg-emerald-100 text-emerald-700">Accepted</Badge>;
    }
    if (action === "rejected") {
      return <Badge className="bg-amber-100 text-amber-700">Rejected</Badge>;
    }
    return <Badge className="bg-red-100 text-red-700">Blocked</Badge>;
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Follow Requests</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Process incoming requests, review action logs, and manage your block list.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-blue-600 text-white">{requests.length} pending</Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              void fetchFollowRequestData({
                silent: true,
                force: true,
              })
            }
            disabled={refreshing}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            {refreshing ? "Refreshing" : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="space-y-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4.5 w-4.5" />
              Pending Requests
            </CardTitle>
            <div className="flex flex-col gap-2 md:flex-row">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name or username"
                className="md:max-w-sm"
              />
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={toggleSelectAllFiltered}>
                  {filteredRequests.length > 0 &&
                  filteredRequests.every((request) => selectedUserIds.has(request._id))
                    ? "Clear Selection"
                    : "Select Filtered"}
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={selectedUserIds.size === 0 || actionLoading === "bulk"}
                  onClick={() => void handleBulkAction("accept")}
                >
                  <Check className="mr-1.5 h-4 w-4" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={selectedUserIds.size === 0 || actionLoading === "bulk"}
                  onClick={() => void handleBulkAction("reject")}
                >
                  <X className="mr-1.5 h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={`request-skeleton-${index}`} className="flex items-center gap-3 rounded-lg border p-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                {requests.length === 0
                  ? "No pending follow requests right now."
                  : "No requests match your search."}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredRequests.map((request) => {
                  const busy =
                    actionLoading === request._id || actionLoading === `block-${request._id}`;
                  return (
                    <div
                      key={request._id}
                      className="flex flex-col gap-3 rounded-lg border p-3 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={selectedUserIds.has(request._id)}
                          onChange={() => toggleSelection(request._id)}
                        />
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={request.profilePicture} />
                          <AvatarFallback>
                            {request.name?.charAt(0)?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <button
                          type="button"
                          className="min-w-0 text-left"
                          onClick={() => navigate(`/profile/${request.username}`)}
                        >
                          <p className="truncate text-sm font-semibold text-foreground">{request.name}</p>
                          <p className="truncate text-xs text-muted-foreground">@{request.username}</p>
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          disabled={busy || actionLoading === "bulk"}
                          onClick={() => void handleSingleAction(request._id, "accept")}
                        >
                          <UserRoundCheck className="mr-1.5 h-4 w-4" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={busy || actionLoading === "bulk"}
                          onClick={() => void handleSingleAction(request._id, "reject")}
                        >
                          <UserRoundX className="mr-1.5 h-4 w-4" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy || actionLoading === "bulk"}
                          onClick={() => void handleBlockRequester(request)}
                        >
                          <Ban className="mr-1.5 h-4 w-4" />
                          Block
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock3 className="h-4.5 w-4.5" />
                Action History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={`history-skeleton-${index}`} className="space-y-2 rounded-lg border p-3">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  ))}
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No history yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-[360px] overflow-auto pr-1">
                  {filteredHistory.map((item) => (
                    <div key={item._id} className="rounded-lg border p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-foreground truncate">
                          {item.requester?.name || "Unknown user"}
                        </p>
                        {actionBadge(item.action)}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        @{item.requester?.username || "unknown"} • {item.source}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatTimeAgo(item.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4.5 w-4.5" />
                Blocked Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              {blockedUsers.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Your block list is empty.
                </div>
              ) : (
                <div className="space-y-2">
                  {blockedUsers.map((blockedUser) => (
                    <div key={blockedUser._id} className="flex items-center justify-between gap-2 rounded-lg border p-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={blockedUser.profilePicture} />
                          <AvatarFallback>
                            {blockedUser.name?.charAt(0)?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{blockedUser.name}</p>
                          <p className="truncate text-xs text-muted-foreground">@{blockedUser.username}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actionLoading === `unblock-${blockedUser._id}`}
                        onClick={() => void handleUnblock(blockedUser)}
                      >
                        Unblock
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FollowRequestsPage;
