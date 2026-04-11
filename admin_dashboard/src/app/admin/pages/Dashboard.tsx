import {
  Users,
  Activity,
  Video,
  DollarSign,
  Flag,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
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

const stats = [
  { title: 'Total Users', value: '12,543', change: '+12.5%', trend: 'up' as const, icon: Users },
  { title: 'Active Users', value: '8,234', change: '+8.2%', trend: 'up' as const, icon: Activity },
  { title: 'Live Interviews', value: '156', change: '-3.1%', trend: 'down' as const, icon: Video },
  { title: 'MRR', value: '$48,293', change: '+18.7%', trend: 'up' as const, icon: DollarSign },
  { title: 'Pending Reports', value: '23', change: '+5', trend: 'up' as const, icon: Flag },
];

const aiUsageData = [
  { time: '00:00', requests: 420, latency: 145 },
  { time: '04:00', requests: 280, latency: 132 },
  { time: '08:00', requests: 680, latency: 158 },
  { time: '12:00', requests: 920, latency: 172 },
  { time: '16:00', requests: 1240, latency: 189 },
  { time: '20:00', requests: 780, latency: 156 },
];

const userActivityData = [
  { day: 'Mon', users: 4200 },
  { day: 'Tue', users: 4800 },
  { day: 'Wed', users: 5200 },
  { day: 'Thu', users: 4900 },
  { day: 'Fri', users: 5600 },
  { day: 'Sat', users: 3800 },
  { day: 'Sun', users: 3200 },
];

const systemHealth = [
  { name: 'API Server', status: 'operational', uptime: '99.99%' },
  { name: 'AI Engine', status: 'operational', uptime: '99.97%' },
  { name: 'Database', status: 'operational', uptime: '100%' },
  { name: 'CDN', status: 'degraded', uptime: '98.12%' },
];

const recentActivity = [
  { action: 'User banned', target: 'john.doe@email.com', admin: 'Admin', time: '2 min ago' },
  { action: 'Content removed', target: 'Post #12453', admin: 'Moderator', time: '15 min ago' },
  { action: 'Report resolved', target: 'Report #892', admin: 'Admin', time: '32 min ago' },
  { action: 'User created', target: 'jane.smith@email.com', admin: 'System', time: '1 hr ago' },
  { action: 'Problem added', target: 'Binary Search Tree', admin: 'Admin', time: '2 hr ago' },
  { action: 'Settings updated', target: 'API rate limit', admin: 'Admin', time: '3 hr ago' },
];

const chartTooltipStyle = {
  backgroundColor: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  fontSize: '12px',
  padding: '8px 12px',
};

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Platform overview and system health
          </p>
        </div>
        <Button variant="outline" size="sm">
          <ArrowUpRight className="mr-1.5 size-3.5" />
          Export Report
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => {
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
                  <span
                    className={
                      stat.trend === 'up'
                        ? 'text-xs text-emerald-600 dark:text-emerald-400'
                        : 'text-xs text-red-500'
                    }
                  >
                    {stat.change}
                  </span>
                  <span className="text-xs text-muted-foreground">vs last month</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">AI Usage & Latency</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={aiUsageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="time" stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Line
                  key="requests-line"
                  yAxisId="left"
                  type="monotone"
                  dataKey="requests"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
                <Line
                  key="latency-line"
                  yAxisId="right"
                  type="monotone"
                  dataKey="latency"
                  stroke="var(--chart-3)"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="4 4"
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">User Activity</CardTitle>
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

      {/* System Health + Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemHealth.map((system) => (
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
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 py-1">
                  <div className="size-1.5 rounded-full bg-muted-foreground/30 mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm truncate">{activity.action}</span>
                      <span className="text-[11px] text-muted-foreground shrink-0">{activity.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {activity.target} · {activity.admin}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}