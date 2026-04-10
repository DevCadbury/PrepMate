import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Bot,
  FileCode2,
  Flag,
  LifeBuoy,
  RefreshCw,
  Users,
  UserRoundCheck,
} from "lucide-react";

import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Skeleton } from "../../ui/skeleton";
import { useAdminConsole } from "../AdminConsoleContext";
import AdminSectionHeader from "../components/AdminSectionHeader";

const AdminOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { overview, insights, isLoadingCore, refreshCore } = useAdminConsole();

  const topStats = useMemo(
    () => [
      {
        label: "Total Users",
        value: overview?.users.total || 0,
        helper: `${overview?.users.active || 0} active`,
        icon: Users,
      },
      {
        label: "Open Support Tickets",
        value: overview?.support.openTickets || 0,
        helper: `${overview?.support.totalTickets || 0} total`,
        icon: LifeBuoy,
      },
      {
        label: "Open Chat Reports",
        value: overview?.social.openChatReports || 0,
        helper: `${overview?.social.reportedPosts || 0} reported posts`,
        icon: Flag,
      },
      {
        label: "Pending Coding Submissions",
        value: overview?.coding.pendingSubmissions || 0,
        helper: `${overview?.social.hiddenPosts || 0} hidden posts`,
        icon: FileCode2,
      },
    ],
    [overview]
  );

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-sky-50 p-6 shadow-sm">
        <AdminSectionHeader
          title="Operations Overview"
          description="Unified control surface for user governance, moderation, coding approvals, and operational health."
          actionLabel="Refresh Now"
          onAction={() => {
            void refreshCore();
          }}
          actionDisabled={isLoadingCore}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge className="border-sky-200 bg-sky-100 text-sky-700">
            Role-based access
          </Badge>
          <Badge className="border-emerald-200 bg-emerald-100 text-emerald-700">
            API-backed live metrics
          </Badge>
          <Badge className="border-amber-200 bg-amber-100 text-amber-700">
            Moderation + approval workflows
          </Badge>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {topStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-slate-200 bg-white">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {stat.label}
                  </p>
                  {isLoadingCore ? (
                    <Skeleton className="mt-2 h-7 w-20" />
                  ) : (
                    <p className="mt-1 text-2xl font-semibold text-slate-900">{stat.value}</p>
                  )}
                  <p className="text-xs text-slate-500">{stat.helper}</p>
                </div>
                <Icon className="h-6 w-6 text-slate-600" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-base">Follow Oversight</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <p>Pending incoming requests: {insights?.follow.pendingIncomingRequests || 0}</p>
            <p>Users with pending requests: {insights?.follow.usersWithIncomingRequests || 0}</p>
            <p>Follow actions in last 7 days: {insights?.follow.actionsLast7d || 0}</p>
            <Button
              variant="outline"
              className="mt-1 border-slate-300 bg-white"
              onClick={() => navigate("/admin-console/users")}
            >
              Open User Oversight
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-base">Notification Monitoring</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <p className="inline-flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Unread notifications: {insights?.notifications.unread || 0}
            </p>
            <p>System notifications: {insights?.notifications.system || 0}</p>
            <p>Created in last 24h: {insights?.notifications.createdLast24h || 0}</p>
            <Button
              variant="outline"
              className="mt-1 border-slate-300 bg-white"
              onClick={() => {
                void refreshCore();
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Recheck Notification Health
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-base">AI & Subscription Signals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <p className="inline-flex items-center gap-2">
              <Bot className="h-4 w-4" />
              AI key configured users: {insights?.ai.configuredUsers || 0}
            </p>
            <p>AI key valid users: {insights?.ai.validUsers || 0}</p>
            <p className="inline-flex items-center gap-2">
              <UserRoundCheck className="h-4 w-4" />
              Premium + enterprise users: {(insights?.subscriptions.premium || 0) + (insights?.subscriptions.enterprise || 0)}
            </p>
            <Button
              variant="outline"
              className="mt-1 border-slate-300 bg-white"
              onClick={() => navigate("/admin-console/logs")}
            >
              Review Audit Trail
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <Button className="justify-start" onClick={() => navigate("/admin-console/users")}>
            Users and Roles
          </Button>
          <Button className="justify-start" onClick={() => navigate("/admin-console/moderation")}>
            Moderation Queue
          </Button>
          <Button className="justify-start" onClick={() => navigate("/admin-console/support")}>
            Support Queue
          </Button>
          <Button className="justify-start" onClick={() => navigate("/admin-console/coding")}>
            Coding Approvals
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOverviewPage;
