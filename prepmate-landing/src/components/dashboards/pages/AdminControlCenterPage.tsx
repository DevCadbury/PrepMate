import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Ban,
  CheckCircle2,
  FileCode,
  Flag,
  LifeBuoy,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";

import { apiClient } from "../../../lib/apiClient";
import { cn } from "../../../lib/utils";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Input } from "../../ui/input";
import { ScrollArea } from "../../ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface AdminOverview {
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

interface AdminUserRecord {
  id: string;
  name: string;
  username?: string;
  email: string;
  role: "student" | "teacher" | "hr" | "admin" | "support";
  status: "active" | "suspended" | "pending";
  profilePicture?: string;
  joinDate?: string;
  lastLogin?: string;
}

interface SupportTicketRecord {
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

interface ModerationPost {
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

interface ChatReportItem {
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

interface CodingProposal {
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

interface Notice {
  type: "success" | "error" | "info";
  message: string;
}

const formatDateTime = (value?: string) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString();
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
};

const userStatusClass: Record<AdminUserRecord["status"], string> = {
  active: "bg-emerald-50 border-emerald-200 text-emerald-700",
  suspended: "bg-rose-50 border-rose-200 text-rose-700",
  pending: "bg-amber-50 border-amber-200 text-amber-700",
};

const ticketStatusClass: Record<SupportTicketRecord["status"], string> = {
  open: "bg-sky-50 border-sky-200 text-sky-700",
  in_progress: "bg-amber-50 border-amber-200 text-amber-700",
  resolved: "bg-emerald-50 border-emerald-200 text-emerald-700",
  closed: "bg-slate-50 border-slate-200 text-slate-700",
};

const proposalStatusClass: Record<CodingProposal["approvalStatus"], string> = {
  pending: "bg-amber-50 border-amber-200 text-amber-700",
  approved: "bg-emerald-50 border-emerald-200 text-emerald-700",
  rejected: "bg-rose-50 border-rose-200 text-rose-700",
};

const reportStatusClass: Record<ChatReportItem["status"], string> = {
  open: "bg-amber-50 border-amber-200 text-amber-700",
  resolved: "bg-emerald-50 border-emerald-200 text-emerald-700",
  dismissed: "bg-slate-50 border-slate-200 text-slate-700",
  blocked: "bg-rose-50 border-rose-200 text-rose-700",
};

const AdminControlCenterPage: React.FC<{ user: any }> = ({ user }) => {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [tickets, setTickets] = useState<SupportTicketRecord[]>([]);
  const [posts, setPosts] = useState<ModerationPost[]>([]);
  const [chatReports, setChatReports] = useState<ChatReportItem[]>([]);
  const [codingQueue, setCodingQueue] = useState<CodingProposal[]>([]);

  const [isLoadingOverview, setIsLoadingOverview] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingSupport, setIsLoadingSupport] = useState(false);
  const [isLoadingModeration, setIsLoadingModeration] = useState(false);
  const [isLoadingCodingQueue, setIsLoadingCodingQueue] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userStatusFilter, setUserStatusFilter] = useState("all");

  const [supportStatusFilter, setSupportStatusFilter] = useState("open");
  const [postStatusFilter, setPostStatusFilter] = useState("all");
  const [chatReportStatusFilter, setChatReportStatusFilter] = useState("open");
  const [proposalStatusFilter, setProposalStatusFilter] = useState("pending");

  const isAdminUser = String(user?.role || "").toLowerCase() === "admin";

  const refreshOverview = useCallback(async () => {
    setIsLoadingOverview(true);
    try {
      const response = await apiClient.get<ApiResponse<AdminOverview>>("/admin/overview");
      setOverview(response.data);
    } catch (error) {
      setNotice({
        type: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setIsLoadingOverview(false);
    }
  }, []);

  const refreshUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const params = new URLSearchParams();
      if (userSearch.trim()) params.set("search", userSearch.trim());
      if (userRoleFilter !== "all") params.set("role", userRoleFilter);
      if (userStatusFilter !== "all") params.set("status", userStatusFilter);

      const response = await apiClient.get<
        ApiResponse<{ users: AdminUserRecord[] }>
      >(`/admin/users${params.toString() ? `?${params.toString()}` : ""}`);
      setUsers(response.data.users || []);
    } catch (error) {
      setNotice({ type: "error", message: getErrorMessage(error) });
    } finally {
      setIsLoadingUsers(false);
    }
  }, [userRoleFilter, userSearch, userStatusFilter]);

  const refreshSupportTickets = useCallback(async () => {
    setIsLoadingSupport(true);
    try {
      const params = new URLSearchParams();
      if (supportStatusFilter !== "all") {
        params.set("status", supportStatusFilter);
      }

      const response = await apiClient.get<
        ApiResponse<{ tickets: SupportTicketRecord[] }>
      >(`/support/tickets${params.toString() ? `?${params.toString()}` : ""}`);
      setTickets(response.data.tickets || []);
    } catch (error) {
      setNotice({ type: "error", message: getErrorMessage(error) });
    } finally {
      setIsLoadingSupport(false);
    }
  }, [supportStatusFilter]);

  const refreshModeration = useCallback(async () => {
    setIsLoadingModeration(true);
    try {
      const postParams = new URLSearchParams();
      postParams.set("reportedOnly", "true");
      if (postStatusFilter !== "all") {
        postParams.set("status", postStatusFilter);
      }

      const chatParams = new URLSearchParams();
      if (chatReportStatusFilter !== "all") {
        chatParams.set("status", chatReportStatusFilter);
      }

      const [postsResponse, chatReportsResponse] = await Promise.all([
        apiClient.get<ApiResponse<{ posts: ModerationPost[] }>>(
          `/admin/social/posts?${postParams.toString()}`
        ),
        apiClient.get<ApiResponse<{ reports: ChatReportItem[] }>>(
          `/admin/chat/reports${chatParams.toString() ? `?${chatParams.toString()}` : ""}`
        ),
      ]);

      setPosts(postsResponse.data.posts || []);
      setChatReports(chatReportsResponse.data.reports || []);
    } catch (error) {
      setNotice({ type: "error", message: getErrorMessage(error) });
    } finally {
      setIsLoadingModeration(false);
    }
  }, [chatReportStatusFilter, postStatusFilter]);

  const refreshCodingQueue = useCallback(async () => {
    setIsLoadingCodingQueue(true);
    try {
      const params = new URLSearchParams();
      if (proposalStatusFilter !== "all") {
        params.set("status", proposalStatusFilter);
      }

      const response = await apiClient.get<
        ApiResponse<{ proposals: CodingProposal[] }>
      >(
        `/coding/admin/problem-submissions${
          params.toString() ? `?${params.toString()}` : ""
        }`
      );

      setCodingQueue(response.data.proposals || []);
    } catch (error) {
      setNotice({ type: "error", message: getErrorMessage(error) });
    } finally {
      setIsLoadingCodingQueue(false);
    }
  }, [proposalStatusFilter]);

  useEffect(() => {
    if (!isAdminUser) {
      return;
    }

    void refreshOverview();
  }, [isAdminUser, refreshOverview]);

  useEffect(() => {
    if (!isAdminUser) {
      return;
    }

    const timer = window.setTimeout(() => {
      void refreshUsers();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [isAdminUser, refreshUsers]);

  useEffect(() => {
    if (!isAdminUser) {
      return;
    }

    void refreshSupportTickets();
  }, [isAdminUser, refreshSupportTickets]);

  useEffect(() => {
    if (!isAdminUser) {
      return;
    }

    void refreshModeration();
  }, [isAdminUser, refreshModeration]);

  useEffect(() => {
    if (!isAdminUser) {
      return;
    }

    void refreshCodingQueue();
  }, [isAdminUser, refreshCodingQueue]);

  const adminStats = useMemo(
    () => [
      {
        key: "users",
        label: "Total Users",
        value: overview?.users.total || 0,
        helper: `${overview?.users.active || 0} active`,
        icon: Users,
      },
      {
        key: "support",
        label: "Open Tickets",
        value: overview?.support.openTickets || 0,
        helper: `${overview?.support.totalTickets || 0} total`,
        icon: LifeBuoy,
      },
      {
        key: "reports",
        label: "Open Chat Reports",
        value: overview?.social.openChatReports || 0,
        helper: `${overview?.social.reportedPosts || 0} reported posts`,
        icon: MessageSquare,
      },
      {
        key: "coding",
        label: "Pending Coding Queue",
        value: overview?.coding.pendingSubmissions || 0,
        helper: `${overview?.social.hiddenPosts || 0} hidden posts`,
        icon: FileCode,
      },
    ],
    [overview]
  );

  const withAction = async (action: () => Promise<void>, successMessage: string) => {
    try {
      setNotice(null);
      await action();
      setNotice({ type: "success", message: successMessage });
      await Promise.all([
        refreshOverview(),
        refreshUsers(),
        refreshSupportTickets(),
        refreshModeration(),
        refreshCodingQueue(),
      ]);
    } catch (error) {
      setNotice({ type: "error", message: getErrorMessage(error) });
    }
  };

  const handleRoleChange = async (userId: string, role: string) => {
    await withAction(
      async () => {
        await apiClient.put(`/admin/users/${userId}/role`, { role });
      },
      "User role updated"
    );
  };

  const handleStatusChange = async (userId: string, status: "active" | "suspended") => {
    await withAction(
      async () => {
        await apiClient.patch(`/admin/users/${userId}/status`, { status });
      },
      "User status updated"
    );
  };

  const handleTicketStatusChange = async (
    ticketId: string,
    status: SupportTicketRecord["status"]
  ) => {
    await withAction(
      async () => {
        await apiClient.patch(`/support/tickets/${ticketId}`, { status });
      },
      "Ticket status updated"
    );
  };

  const handleModeratePost = async (
    postId: string,
    status: "active" | "hidden" | "archived"
  ) => {
    const resolutionNote =
      window.prompt("Optional moderation note (visible in backend logs):", "") || "";

    await withAction(
      async () => {
        await apiClient.patch(`/admin/social/posts/${postId}/moderate`, {
          status,
          resolutionNote,
        });
      },
      "Post moderation updated"
    );
  };

  const handleReviewChatReport = async (
    messageId: string,
    decision: "resolved" | "dismissed" | "blocked"
  ) => {
    const note =
      window.prompt(
        "Add review note (optional):",
        decision === "blocked"
          ? "Blocked due to policy violation"
          : "Reviewed by admin"
      ) || "";

    await withAction(
      async () => {
        await apiClient.patch(`/admin/chat/reports/${messageId}`, {
          decision,
          note,
        });
      },
      "Chat report reviewed"
    );
  };

  const handleCodingApproval = async (
    proposalId: string,
    decision: "approve" | "reject"
  ) => {
    if (decision === "approve") {
      const notes = window.prompt("Optional approval note:", "") || "";
      await withAction(
        async () => {
          await apiClient.patch(
            `/coding/admin/problem-submissions/${proposalId}/approve`,
            { notes }
          );
        },
        "Coding problem approved and published"
      );
      return;
    }

    const reason =
      window.prompt(
        "Provide rejection reason for the contributor:",
        "Please refine constraints, test cases, and editorial clarity."
      ) || "Rejected by admin";

    await withAction(
      async () => {
        await apiClient.patch(
          `/coding/admin/problem-submissions/${proposalId}/reject`,
          {
            reason,
          }
        );
      },
      "Coding problem rejected"
    );
  };

  if (!isAdminUser) {
    return (
      <Card className="border-rose-200 bg-rose-50">
        <CardContent className="py-8 text-center text-sm text-rose-700">
          Admin access is required for this page.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-sky-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Admin Control Center
            </h1>
            <p className="max-w-2xl text-sm text-slate-600">
              Manage users, support tickets, social moderation, chat reports, and
              coding-question approvals from one role-protected console.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Badge className="border-sky-200 bg-sky-100 text-sky-700">
                <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                Server-Enforced Admin Access
              </Badge>
              <Badge className="border-amber-200 bg-amber-100 text-amber-700">
                <Flag className="mr-1.5 h-3.5 w-3.5" />
                Moderation Queue
              </Badge>
              <Badge className="border-emerald-200 bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                Approval Workflow
              </Badge>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => {
              void Promise.all([
                refreshOverview(),
                refreshUsers(),
                refreshSupportTickets(),
                refreshModeration(),
                refreshCodingQueue(),
              ]);
            }}
            className="border-slate-300 bg-white"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh All
          </Button>
        </div>
      </section>

      {notice ? (
        <div
          className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            notice.type === "success" &&
              "border-emerald-200 bg-emerald-50 text-emerald-700",
            notice.type === "error" && "border-rose-200 bg-rose-50 text-rose-700",
            notice.type === "info" && "border-sky-200 bg-sky-50 text-sky-700"
          )}
        >
          {notice.message}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {adminStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.key} className="border-slate-200">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">
                    {isLoadingOverview ? "..." : stat.value}
                  </p>
                  <p className="text-xs text-slate-500">{stat.helper}</p>
                </div>
                <Icon className="h-6 w-6 text-slate-600" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid h-10 w-full grid-cols-5 bg-slate-100 text-xs">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
          <TabsTrigger value="coding">Coding Queue</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">User Operations</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">
                Promote/demote roles, suspend abusive accounts, and keep admin/support
                staffing healthy.
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">Social & Chat Moderation</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">
                Review reported content quickly, hide harmful posts, and resolve chat
                reports with traceable moderation decisions.
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">Coding Governance</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">
                Community-submitted coding questions land in a pending queue and are
                published only after admin approval.
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">User Management</CardTitle>
              <div className="grid gap-2 md:grid-cols-3">
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
            </CardHeader>

            <CardContent className="p-0">
              <ScrollArea className="h-[430px]">
                {isLoadingUsers ? (
                  <div className="flex items-center justify-center py-10 text-sm text-slate-500">
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Loading users...
                  </div>
                ) : users.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-slate-500">
                    No users matched the current filters.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {users.map((entry) => (
                      <div key={entry.id} className="px-4 py-3">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {entry.name} <span className="text-slate-500">@{entry.username}</span>
                            </p>
                            <p className="text-xs text-slate-500">{entry.email}</p>
                            <p className="mt-1 text-[11px] text-slate-500">
                              Joined: {formatDateTime(entry.joinDate)} | Last login: {formatDateTime(entry.lastLogin)}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={cn("border", userStatusClass[entry.status])}>
                              {entry.status}
                            </Badge>
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
                            {entry.status === "suspended" ? (
                              <Button
                                size="sm"
                                onClick={() => {
                                  void handleStatusChange(entry.id, "active");
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
                                onClick={() => {
                                  void handleStatusChange(entry.id, "suspended");
                                }}
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
        </TabsContent>

        <TabsContent value="support" className="space-y-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Support Queue</CardTitle>
              <Select value={supportStatusFilter} onValueChange={setSupportStatusFilter}>
                <SelectTrigger className="w-full max-w-[220px] border-slate-200">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>

            <CardContent className="p-0">
              <ScrollArea className="h-[430px]">
                {isLoadingSupport ? (
                  <div className="flex items-center justify-center py-10 text-sm text-slate-500">
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Loading support tickets...
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-slate-500">
                    No support tickets found.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {tickets.map((ticket) => (
                      <div key={ticket.id} className="px-4 py-3">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {ticket.subject}
                            </p>
                            <p className="text-xs text-slate-500">
                              {ticket.user?.name || ticket.user?.username || "Unknown"} | {ticket.category}
                            </p>
                            <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                              {ticket.description}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-500">
                              Updated: {formatDateTime(ticket.updatedAt)}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={cn("border", ticketStatusClass[ticket.status])}>
                              {ticket.status}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="border-slate-200 bg-white text-slate-600"
                            >
                              {ticket.priority}
                            </Badge>
                            <Select
                              value={ticket.status}
                              onValueChange={(value) => {
                                void handleTicketStatusChange(
                                  ticket.id,
                                  value as SupportTicketRecord["status"]
                                );
                              }}
                            >
                              <SelectTrigger className="h-8 w-[150px] border-slate-200 bg-white text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moderation" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Reported Posts</CardTitle>
                <Select value={postStatusFilter} onValueChange={setPostStatusFilter}>
                  <SelectTrigger className="w-full max-w-[220px] border-slate-200">
                    <SelectValue placeholder="Post status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Post Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="hidden">Hidden</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>

              <CardContent className="p-0">
                <ScrollArea className="h-[430px]">
                  {isLoadingModeration ? (
                    <div className="flex items-center justify-center py-10 text-sm text-slate-500">
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Loading moderation feed...
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="px-4 py-10 text-center text-sm text-slate-500">
                      No reported posts in this filter.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {posts.map((post) => (
                        <div key={post.id} className="px-4 py-3">
                          <p className="text-sm font-semibold text-slate-900">
                            {post.user?.name || post.user?.username || "Unknown user"}
                          </p>
                          <p className="mt-1 text-xs text-slate-600 line-clamp-3">
                            {post.contentPreview || "(No content preview available)"}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="border-slate-200 bg-white text-slate-600">
                              {post.status}
                            </Badge>
                            <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                              {post.pendingReportsCount} pending reports
                            </Badge>
                          </div>
                          {post.latestReportReason ? (
                            <p className="mt-1 text-[11px] text-slate-500">
                              Latest reason: {post.latestReportReason}
                            </p>
                          ) : null}
                          <div className="mt-2 flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-slate-300"
                              onClick={() => {
                                void handleModeratePost(post.id, "active");
                              }}
                            >
                              Mark Safe
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-rose-200 text-rose-700 hover:bg-rose-50"
                              onClick={() => {
                                void handleModeratePost(post.id, "hidden");
                              }}
                            >
                              Hide Post
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Chat Reports</CardTitle>
                <Select
                  value={chatReportStatusFilter}
                  onValueChange={setChatReportStatusFilter}
                >
                  <SelectTrigger className="w-full max-w-[220px] border-slate-200">
                    <SelectValue placeholder="Report status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Report Statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="dismissed">Dismissed</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>

              <CardContent className="p-0">
                <ScrollArea className="h-[430px]">
                  {isLoadingModeration ? (
                    <div className="flex items-center justify-center py-10 text-sm text-slate-500">
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Loading chat reports...
                    </div>
                  ) : chatReports.length === 0 ? (
                    <div className="px-4 py-10 text-center text-sm text-slate-500">
                      No chat reports in this filter.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {chatReports.map((report) => (
                        <div key={report.messageId} className="px-4 py-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {report.sender?.name || report.sender?.username || "Unknown sender"}
                              </p>
                              <p className="text-xs text-slate-500">
                                Last reported: {formatDateTime(report.lastReportedAt)}
                              </p>
                            </div>
                            <Badge className={cn("border", reportStatusClass[report.status])}>
                              {report.status}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-slate-600 line-clamp-3">
                            {report.messagePreview}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            Reports: {report.reportCount} | Reason: {report.lastReason || "-"}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                void handleReviewChatReport(report.messageId, "resolved");
                              }}
                            >
                              Resolve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                void handleReviewChatReport(report.messageId, "dismissed");
                              }}
                            >
                              Dismiss
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-rose-200 text-rose-700 hover:bg-rose-50"
                              onClick={() => {
                                void handleReviewChatReport(report.messageId, "blocked");
                              }}
                            >
                              Block Message
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="coding" className="space-y-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Coding Question Approval Queue</CardTitle>
              <Select
                value={proposalStatusFilter}
                onValueChange={setProposalStatusFilter}
              >
                <SelectTrigger className="w-full max-w-[220px] border-slate-200">
                  <SelectValue placeholder="Queue filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Submissions</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>

            <CardContent className="p-0">
              <ScrollArea className="h-[430px]">
                {isLoadingCodingQueue ? (
                  <div className="flex items-center justify-center py-10 text-sm text-slate-500">
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Loading coding queue...
                  </div>
                ) : codingQueue.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-slate-500">
                    No coding problem submissions in this filter.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {codingQueue.map((proposal) => (
                      <div key={proposal.id} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {proposal.title}
                            </p>
                            <p className="text-xs text-slate-500">
                              {proposal.createdBy?.name || proposal.createdBy?.username || "Unknown"} | {proposal.difficulty} | {formatDateTime(proposal.submittedAt)}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {(proposal.tags || []).slice(0, 5).map((tag) => (
                                <Badge
                                  key={`${proposal.id}-${tag}`}
                                  variant="outline"
                                  className="border-slate-200 bg-white text-[10px] text-slate-600"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            {proposal.approvalNotes ? (
                              <p className="mt-2 text-xs text-slate-600">
                                Note: {proposal.approvalNotes}
                              </p>
                            ) : null}
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <Badge className={cn("border", proposalStatusClass[proposal.approvalStatus])}>
                              {proposal.approvalStatus}
                            </Badge>
                            <div className="flex flex-wrap justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  void handleCodingApproval(proposal.id, "approve");
                                }}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-rose-200 text-rose-700 hover:bg-rose-50"
                                onClick={() => {
                                  void handleCodingApproval(proposal.id, "reject");
                                }}
                              >
                                Reject
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminControlCenterPage;
