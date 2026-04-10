import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Activity,
  BarChart3,
  FileCode2,
  Flag,
  HelpCircle,
  LayoutDashboard,
  ListChecks,
  Menu,
  RefreshCw,
  ScrollText,
  ShieldCheck,
  Users,
} from "lucide-react";

import { useAuth } from "../../../contexts/AuthContext";
import { cn } from "../../../lib/utils";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../ui/sheet";
import { useAdminConsole } from "../AdminConsoleContext";
import AdminNoticeBanner from "./AdminNoticeBanner";

const navItems = [
  {
    to: "/admin-console/overview",
    label: "Overview",
    description: "Analytics, follow, AI and subscription insights",
    icon: LayoutDashboard,
  },
  {
    to: "/admin-console/users",
    label: "Users & Roles",
    description: "Role updates, account status and profiles",
    icon: Users,
  },
  {
    to: "/admin-console/moderation",
    label: "Moderation",
    description: "Social posts and chat report review",
    icon: Flag,
  },
  {
    to: "/admin-console/support",
    label: "Support",
    description: "Ticket triage and resolution state",
    icon: HelpCircle,
  },
  {
    to: "/admin-console/coding",
    label: "Coding Queue",
    description: "Approve or reject coding submissions",
    icon: FileCode2,
  },
  {
    to: "/admin-console/logs",
    label: "Logs & Audit",
    description: "Recent backend logs and operational trail",
    icon: ScrollText,
  },
];

const NavSection: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <div className="space-y-2">
    {navItems.map((item) => {
      const Icon = item.icon;
      return (
        <NavLink key={item.to} to={item.to}>
          {({ isActive }) => (
            <div
              className={cn(
                "group flex items-start gap-3 rounded-xl border px-3 py-3 transition",
                isActive
                  ? "border-sky-200 bg-sky-50"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              <Icon
                className={cn(
                  "mt-0.5 h-4 w-4",
                  isActive ? "text-sky-600" : "text-slate-600"
                )}
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                {!compact ? (
                  <p className="text-xs text-slate-500">{item.description}</p>
                ) : null}
              </div>
            </div>
          )}
        </NavLink>
      );
    })}
  </div>
);

const AdminConsoleLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { overview, insights, refreshCore, isLoadingCore, notice } = useAdminConsole();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-sky-100">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[90vw] max-w-sm border-slate-200 bg-slate-50">
                <SheetHeader>
                  <SheetTitle>Admin Console</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <NavSection compact />
                </div>
              </SheetContent>
            </Sheet>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-slate-900">Admin Console</h1>
                <Badge className="border-sky-200 bg-sky-100 text-sky-700">
                  <ShieldCheck className="mr-1 h-3 w-3" />
                  Role Protected
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Signed in as {user?.name || "Admin"} ({user?.email || "-"})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="hidden border-slate-300 bg-white sm:inline-flex"
              onClick={() => {
                void refreshCore();
              }}
              disabled={isLoadingCore}
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", isLoadingCore && "animate-spin")} />
              Refresh Metrics
            </Button>
            <Button
              variant="outline"
              className="border-slate-300 bg-white"
              onClick={() => navigate("/feed")}
            >
              Return to Social Dashboard
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1600px] gap-6 px-4 py-6 sm:px-6">
        <aside className="hidden w-80 shrink-0 space-y-4 lg:block">
          <NavSection />

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Quick Snapshot</h3>
            <div className="mt-3 space-y-2 text-xs text-slate-600">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="inline-flex items-center gap-1">
                  <BarChart3 className="h-3.5 w-3.5" /> Users
                </span>
                <span className="font-semibold text-slate-900">{overview?.users.total || 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="inline-flex items-center gap-1">
                  <ListChecks className="h-3.5 w-3.5" /> Pending coding
                </span>
                <span className="font-semibold text-slate-900">
                  {overview?.coding.pendingSubmissions || 0}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="inline-flex items-center gap-1">
                  <Activity className="h-3.5 w-3.5" /> Audit actions (24h)
                </span>
                <span className="font-semibold text-slate-900">
                  {insights?.audit.moderationActions24h || 0}
                </span>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 space-y-4">
          <AdminNoticeBanner notice={notice} />
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminConsoleLayout;
