import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Ban, CheckCircle2, Eye, RefreshCw } from "lucide-react";

import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { cn } from "../../../lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../ui/alert-dialog";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Input } from "../../ui/input";
import { ScrollArea } from "../../ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { useAdminConsole } from "../AdminConsoleContext";
import AdminSectionHeader from "../components/AdminSectionHeader";
import { adminConsoleApi } from "../services/adminConsoleApi";
import { AdminUserRecord } from "../types";
import { formatDateTime, getErrorMessage } from "../utils";

const userStatusClass: Record<AdminUserRecord["status"], string> = {
  active: "bg-emerald-50 border-emerald-200 text-emerald-700",
  suspended: "bg-rose-50 border-rose-200 text-rose-700",
  pending: "bg-amber-50 border-amber-200 text-amber-700",
};

const AdminUsersPage: React.FC = () => {
  const { runWithNotice } = useAdminConsole();

  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const debouncedUserSearch = useDebouncedValue(userSearch.trim(), 300);

  const [detailsUser, setDetailsUser] = useState<AdminUserRecord | null>(null);
  const [suspensionTarget, setSuspensionTarget] = useState<AdminUserRecord | null>(null);

  const refreshUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    setLocalError(null);

    try {
      const response = await adminConsoleApi.getUsers({
        search: debouncedUserSearch,
        role: userRoleFilter,
        status: userStatusFilter,
        limit: 80,
      });

      setUsers(response);
    } catch (error) {
      setLocalError(getErrorMessage(error));
    } finally {
      setIsLoadingUsers(false);
    }
  }, [debouncedUserSearch, userRoleFilter, userStatusFilter]);

  useEffect(() => {
    void refreshUsers();
  }, [refreshUsers]);

  const handleRoleChange = async (userId: string, role: string) => {
    await runWithNotice(
      async () => {
        await adminConsoleApi.updateUserRole(userId, role);
        await refreshUsers();
      },
      "User role updated",
      { refreshCore: true }
    );
  };

  const handleActivateUser = async (entry: AdminUserRecord) => {
    await runWithNotice(
      async () => {
        await adminConsoleApi.updateUserStatus(entry.id, "active");
        await refreshUsers();
      },
      `${entry.name} is now active`,
      { refreshCore: true }
    );
  };

  const handleSuspendConfirmed = async () => {
    if (!suspensionTarget) {
      return;
    }

    const target = suspensionTarget;
    setSuspensionTarget(null);

    await runWithNotice(
      async () => {
        await adminConsoleApi.updateUserStatus(target.id, "suspended");
        await refreshUsers();
      },
      `${target.name} has been suspended`,
      { refreshCore: true }
    );
  };

  const summary = useMemo(() => {
    const active = users.filter((item) => item.status === "active").length;
    const suspended = users.filter((item) => item.status === "suspended").length;

    return { active, suspended };
  }, [users]);

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 bg-white">
        <CardContent className="p-4">
          <AdminSectionHeader
            title="Users and Roles"
            description="Manage account status, role assignments, and profile-level details from one queue."
            actionLabel="Refresh"
            onAction={() => {
              void refreshUsers();
            }}
            actionDisabled={isLoadingUsers}
          />
          <div className="mt-4 grid gap-2 md:grid-cols-3">
            <Input
              placeholder="Search by name, username, email"
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
              className="border-slate-200"
            />
            <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
              <SelectTrigger className="border-slate-200">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="support">Support</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={userStatusFilter} onValueChange={setUserStatusFilter}>
              <SelectTrigger className="border-slate-200">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="rounded-md bg-slate-100 px-2 py-1">Loaded users: {users.length}</span>
            <span className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-700">Active: {summary.active}</span>
            <span className="rounded-md bg-rose-50 px-2 py-1 text-rose-700">Suspended: {summary.suspended}</span>
          </div>
          {localError ? (
            <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {localError}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">User Queue</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[560px]">
            {isLoadingUsers ? (
              <div className="flex items-center justify-center py-10 text-sm text-slate-500">
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Loading users...
              </div>
            ) : users.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-slate-500">
                No users matched your filters.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {users.map((entry) => (
                  <div key={entry.id} className="px-4 py-3">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {entry.name}{" "}
                          <span className="text-slate-500">@{entry.username || "unknown"}</span>
                        </p>
                        <p className="text-xs text-slate-500">{entry.email}</p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          Joined: {formatDateTime(entry.joinDate)} | Last login: {formatDateTime(entry.lastLogin)}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={cn("border", userStatusClass[entry.status])}>{entry.status}</Badge>
                        <Select
                          value={entry.role}
                          onValueChange={(value) => {
                            void handleRoleChange(entry.id, value);
                          }}
                        >
                          <SelectTrigger className="h-8 w-[140px] border-slate-200 bg-white text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="teacher">Teacher</SelectItem>
                            <SelectItem value="hr">HR</SelectItem>
                            <SelectItem value="support">Support</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-300"
                          onClick={() => setDetailsUser(entry)}
                        >
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          Details
                        </Button>

                        {entry.status === "suspended" ? (
                          <Button
                            size="sm"
                            onClick={() => {
                              void handleActivateUser(entry);
                            }}
                          >
                            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                            Activate
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-rose-200 text-rose-700 hover:bg-rose-50"
                            onClick={() => setSuspensionTarget(entry)}
                          >
                            <Ban className="mr-1.5 h-3.5 w-3.5" />
                            Suspend
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={Boolean(detailsUser)} onOpenChange={(open) => !open && setDetailsUser(null)}>
        <DialogContent className="max-w-xl" open={Boolean(detailsUser)} onOpenChange={(open) => !open && setDetailsUser(null)}>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Inspect profile, role, subscription, and account state before taking action.
            </DialogDescription>
          </DialogHeader>
          {detailsUser ? (
            <div className="space-y-3 text-sm">
              <p><span className="font-semibold text-slate-700">Name:</span> {detailsUser.name}</p>
              <p><span className="font-semibold text-slate-700">Username:</span> @{detailsUser.username || "-"}</p>
              <p><span className="font-semibold text-slate-700">Email:</span> {detailsUser.email}</p>
              <p><span className="font-semibold text-slate-700">Role:</span> {detailsUser.role}</p>
              <p><span className="font-semibold text-slate-700">Status:</span> {detailsUser.status}</p>
              <p><span className="font-semibold text-slate-700">Subscription:</span> {detailsUser.subscription || "free"}</p>
              <p><span className="font-semibold text-slate-700">Google linked:</span> {detailsUser.googleLinked ? "Yes" : "No"}</p>
              <p><span className="font-semibold text-slate-700">Permissions:</span> {(detailsUser.permissions || []).join(", ") || "-"}</p>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(suspensionTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setSuspensionTarget(null);
          }
        }}
      >
        <AlertDialogContent
          open={Boolean(suspensionTarget)}
          onOpenChange={(open) => {
            if (!open) {
              setSuspensionTarget(null);
            }
          }}
          className="max-w-md"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend User Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This user will lose active access until an admin re-activates the account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSuspensionTarget(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleSuspendConfirmed()}>
              Suspend User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsersPage;
