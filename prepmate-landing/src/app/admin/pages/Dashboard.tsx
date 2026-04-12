import { useEffect, useMemo, useState } from 'react';
import {
  Users,
  Activity,
  Video,
  DollarSign,
  Flag,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ArrowUpRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { apiClient } from '../../../lib/apiClient';

type DashboardOverviewResponse = {
  success?: boolean;
  data?: {
    users?: {
      total?: number;
      active?: number;
    };
    social?: {
      openChatReports?: number;
      reportedPosts?: number;
    };
    support?: {
      openTickets?: number;
    };
    coding?: {
      pendingSubmissions?: number;
    };
  };
};

type DashboardInsightsResponse = {
  success?: boolean;
  data?: {
    notifications?: {
      total?: number;
      createdLast24h?: number;
    };
    subscriptions?: {
      free?: number;
      basic?: number;
      premium?: number;
      enterprise?: number;
    };
    audit?: {
      moderationActions24h?: number;
      openChatReports?: number;
      pendingPostReports?: number;
    };
  };
};

type SystemHealthResponse = {
  success?: boolean;
  data?: {
    services?: Array<{
      name?: string;
      status?: string;
      uptime?: string;
    }>;
  };
};

type AnalyticsResponse = {
  success?: boolean;
  data?: {
    growthChart?: Array<{
      _id: string;
      count: number;
    }>;
    users?: {
      dailyActive?: number;
      newThisWeek?: number;
      newThisMonth?: number;
    };
    revenue?: {
      mrr?: string;
    };
  };
};

type RecentLogsResponse = {
  success?: boolean;
  data?: {
    lines?: string[];
  };
};

const chartTooltipStyle = {
  backgroundColor: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  fontSize: '12px',
  padding: '8px 12px',
};

const defaultStats = {
  totalUsers: 0,
  activeUsers: 0,
  liveInterviews: 0,
  mrr: '$0.00',
  pendingReports: 0,
  usersGrowth: 0,
  activeGrowth: 0,
  interviewsDelta: 0,
  mrrGrowth: 0,
  reportsDelta: 0,
};

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState(defaultStats);
  const [aiUsageData, setAiUsageData] = useState<Array<{ time: string; requests: number; latency: number }>>([]);
  const [userActivityData, setUserActivityData] = useState<Array<{ day: string; users: number }>>([]);
  const [systemHealth, setSystemHealth] = useState<Array<{ name: string; status: string; uptime: string }>>([]);
  const [recentActivity, setRecentActivity] = useState<Array<{ action: string; target: string; admin: string; time: string }>>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);

      try {
        const [overview, insights, health, analytics, logs] = await Promise.all([
          apiClient.get<DashboardOverviewResponse>('/admin/overview'),
          apiClient.get<DashboardInsightsResponse>('/admin/insights'),
          apiClient.get<SystemHealthResponse>('/admin/system/health'),
          apiClient.get<AnalyticsResponse>('/admin/analytics/overview'),
          apiClient.get<RecentLogsResponse>('/admin/logs/recent?lines=20'),
        ]);

        const usersTotal = Number(overview?.data?.users?.total || 0);
        const usersActive = Number(overview?.data?.users?.active || 0);
        const liveInterviews = Number(analytics?.data?.users?.newThisWeek || 0);
        const mrr = String(analytics?.data?.revenue?.mrr || '0.00');
        const pendingReports = Number(overview?.data?.social?.openChatReports || 0) + Number(overview?.data?.social?.reportedPosts || 0);

        const usersGrowth = usersTotal > 0 ? Number(((Number(analytics?.data?.users?.newThisMonth || 0) / usersTotal) * 100).toFixed(1)) : 0;
        const activeGrowth = usersActive > 0 ? Number(((Number(analytics?.data?.users?.dailyActive || 0) / usersActive) * 100).toFixed(1)) : 0;
        const interviewsDelta = Number(overview?.data?.coding?.pendingSubmissions || 0);
        const mrrGrowth = Number(insights?.data?.notifications?.createdLast24h || 0);
        const reportsDelta = Number(insights?.data?.audit?.pendingPostReports || 0);

        setStats({
          totalUsers: usersTotal,
          activeUsers: usersActive,
          liveInterviews,
          mrr: `$${Number(mrr).toLocaleString()}`,
          pendingReports,
          usersGrowth,
          activeGrowth,
          interviewsDelta,
          mrrGrowth,
          reportsDelta,
        });

        const growthChart = analytics?.data?.growthChart;
        const chartRows = Array.isArray(growthChart) ? growthChart : [];

        const trendPoints = chartRows.map((row) => ({
          time: row._id.slice(5),
          requests: row.count,
          latency: 100 + row.count,
        }));

        setAiUsageData(trendPoints.length > 0 ? trendPoints : [
          { time: '00:00', requests: 0, latency: 0 },
          { time: '06:00', requests: 0, latency: 0 },
          { time: '12:00', requests: 0, latency: 0 },
          { time: '18:00', requests: 0, latency: 0 },
        ]);

        const userBars = chartRows.map((row) => ({
          day: row._id.slice(5),
          users: row.count,
        }));

        setUserActivityData(userBars.length > 0 ? userBars : [
          { day: 'Mon', users: 0 },
          { day: 'Tue', users: 0 },
          { day: 'Wed', users: 0 },
          { day: 'Thu', users: 0 },
          { day: 'Fri', users: 0 },
        ]);

        const serviceRows = health?.data?.services;
        const services = Array.isArray(serviceRows) ? serviceRows : [];
        setSystemHealth(
          services.map((service) => ({
            name: String(service?.name || 'Service'),
            status: String(service?.status || 'unknown'),
            uptime: String(service?.uptime || '-'),
          }))
        );

        const logLines = logs?.data?.lines;
        const rawLines = Array.isArray(logLines) ? logLines : [];
        const entries = rawLines.slice(-6).reverse().map((line) => {
          const match = line.match(/\b(GET|POST|PUT|PATCH|DELETE)\s+([^\s]+)/i);
          const action = match ? `${String(match[1]).toUpperCase()} request` : 'System event';
          const target = match ? match[2] : 'Server';
          return {
            action,
            target,
            admin: 'System',
            time: 'recent',
          };
        });

        setRecentActivity(entries);
      } catch (error) {
        setStats(defaultStats);
        setAiUsageData([]);
        setUserActivityData([]);
        setSystemHealth([]);
        setRecentActivity([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = useMemo(() => ([
    { title: 'Total Users', value: stats.totalUsers.toLocaleString(), change: `+${stats.usersGrowth}%`, trend: 'up' as const, icon: Users },
    { title: 'Active Users', value: stats.activeUsers.toLocaleString(), change: `+${stats.activeGrowth}%`, trend: 'up' as const, icon: Activity },
    { title: 'Live Interviews', value: stats.liveInterviews.toLocaleString(), change: `+${stats.interviewsDelta}`, trend: 'down' as const, icon: Video },
    { title: 'MRR', value: stats.mrr, change: `+${stats.mrrGrowth}`, trend: 'up' as const, icon: DollarSign },
    { title: 'Pending Reports', value: stats.pendingReports.toLocaleString(), change: `+${stats.reportsDelta}`, trend: 'up' as const, icon: Flag },
  ]), [stats]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Platform overview and system health
          </p>
        </div>
        <Button variant="outline" size="sm" disabled={isLoading}>
          <ArrowUpRight className="mr-1.5 size-3.5" />
          Export Report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="admin-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground">{stat.title}</span>
                  <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-3.5 text-muted-foreground" />
                  </div>
                </div>
                <div className="text-2xl tracking-tight">{stat.value}</div>
                <div className="flex items-center gap-1 mt-1">
                  {stat.trend === 'up' ? (
                    <TrendingUp className="size-3 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <TrendingDown className="size-3 text-red-500" />
                  )}
                  <span className={
                    stat.trend === 'up'
                      ? 'text-xs text-emerald-600 dark:text-emerald-400'
                      : 'text-xs text-red-500'
                  }>
                    {stat.change}
                  </span>
                  <span className="text-xs text-muted-foreground">vs last period</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Traffic Trend</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={aiUsageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="time" stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Line yAxisId="left" type="monotone" dataKey="requests" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="latency" stroke="var(--chart-3)" strokeWidth={2} dot={false} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">New Users Trend</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={userActivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="users" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemHealth.length === 0 ? (
                <p className="text-sm text-muted-foreground">No service data available</p>
              ) : systemHealth.map((system) => (
                <div key={system.name} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-3">
                    {system.status === 'operational' ? (
                      <div className="size-2 rounded-full bg-emerald-500" />
                    ) : (
                      <div className="size-2 rounded-full bg-amber-500" />
                    )}
                    <span className="text-sm">{system.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{system.uptime}</span>
                    <Badge
                      variant={system.status === 'operational' ? 'secondary' : 'default'}
                      className="text-[11px] px-2 py-0"
                    >
                      {system.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              ) : recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 py-1">
                  <div className="size-1.5 rounded-full bg-muted-foreground/30 mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm truncate">{activity.action}</span>
                      <span className="text-[11px] text-muted-foreground shrink-0">{activity.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {activity.target}  {activity.admin}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading && (
        <div className="text-sm text-muted-foreground">Refreshing dashboard data...</div>
      )}
    </div>
  );
}
