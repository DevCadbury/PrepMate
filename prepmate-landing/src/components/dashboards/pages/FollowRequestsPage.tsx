import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Badge } from "../../ui/badge";
import { useToast } from "../../ui/toast";
import { Check, Users, X, RefreshCcw } from "lucide-react";

interface FollowRequestUser {
  _id: string;
  name: string;
  username: string;
  profilePicture?: string;
}

const FollowRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [requests, setRequests] = useState<FollowRequestUser[]>([]);
  const [query, setQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchFollowRequests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/users/follow-requests", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch follow requests");
      }

      const data = await response.json();
      setRequests(data?.data?.followRequests || []);
    } catch (err: any) {
      console.error("Error fetching follow requests:", err);
      showError("Unable to load follow requests", err?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchFollowRequests();
  }, [fetchFollowRequests]);

  const filteredRequests = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return requests;

    return requests.filter((request) => {
      return (
        request.name?.toLowerCase().includes(normalized) ||
        request.username?.toLowerCase().includes(normalized)
      );
    });
  }, [requests, query]);

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
    const allFilteredSelected =
      filteredRequests.length > 0 &&
      filteredRequests.every((request) => selectedUserIds.has(request._id));

    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredRequests.forEach((request) => next.delete(request._id));
      } else {
        filteredRequests.forEach((request) => next.add(request._id));
      }
      return next;
    });
  };

  const handleSingleAction = async (userId: string, action: "accept" | "reject") => {
    setActionLoading(userId);
    try {
      const response = await fetch(
        `http://localhost:5000/api/social/users/${userId}/${action}-follow-request`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.message || `Failed to ${action} follow request`);
      }

      setRequests((prev) => prev.filter((request) => request._id !== userId));
      setSelectedUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });

      success(
        action === "accept" ? "Follow request accepted" : "Follow request rejected"
      );
    } catch (err: any) {
      console.error(`Error trying to ${action} follow request:`, err);
      showError(
        `Failed to ${action} follow request`,
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
      const response = await fetch("http://localhost:5000/api/users/follow-requests/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ action, userIds }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.message || `Bulk ${action} failed`);
      }

      setRequests((prev) => prev.filter((request) => !selectedUserIds.has(request._id)));
      setSelectedUserIds(new Set());

      success(
        action === "accept"
          ? "Selected follow requests accepted"
          : "Selected follow requests rejected"
      );
    } catch (err: any) {
      console.error(`Error trying bulk ${action}:`, err);
      showError(`Bulk ${action} failed`, err?.message || "Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Follow Requests
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Review incoming follow requests and manage them in bulk.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-blue-600 text-white">{requests.length} pending</Badge>
          <Button variant="outline" onClick={fetchFollowRequests} disabled={loading}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <Input
            placeholder="Search by name or username..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="md:max-w-sm"
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={toggleSelectAllFiltered}>
              <Users className="h-4 w-4 mr-2" />
              {filteredRequests.length > 0 &&
              filteredRequests.every((request) => selectedUserIds.has(request._id))
                ? "Clear Filter Selection"
                : "Select Filtered"}
            </Button>
            <Button
              onClick={() => handleBulkAction("accept")}
              disabled={selectedUserIds.size === 0 || actionLoading === "bulk"}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 mr-2" />
              Accept Selected
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleBulkAction("reject")}
              disabled={selectedUserIds.size === 0 || actionLoading === "bulk"}
            >
              <X className="h-4 w-4 mr-2" />
              Reject Selected
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="py-10 text-center text-gray-500">Loading follow requests...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-10 text-center text-gray-500">
            {requests.length === 0 ? "No pending follow requests." : "No requests match your search."}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredRequests.map((request) => {
              const checked = selectedUserIds.has(request._id);
              const isBusy = actionLoading === request._id;

              return (
                <div
                  key={request._id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 dark:border-slate-700"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSelection(request._id)}
                      className="h-4 w-4"
                    />
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={request.profilePicture} />
                      <AvatarFallback>{request.name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      onClick={() => navigate(`/profile/${request.username}`)}
                      className="text-left min-w-0"
                    >
                      <p className="font-medium text-gray-900 dark:text-white truncate">{request.name}</p>
                      <p className="text-sm text-gray-500 truncate">@{request.username}</p>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleSingleAction(request._id, "accept")}
                      disabled={isBusy || actionLoading === "bulk"}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleSingleAction(request._id, "reject")}
                      disabled={isBusy || actionLoading === "bulk"}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowRequestsPage;
