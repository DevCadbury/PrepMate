import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Activity, AlertCircle, CheckCircle, TrendingUp, Zap, DollarSign } from 'lucide-react';
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const stats = [
  { title: 'Total Requests', value: '1.2M', change: '+15.3%', trend: 'up', icon: Activity },
  { title: 'Avg Latency', value: '156ms', change: '-8.2%', trend: 'down', icon: Zap },
  { title: 'Error Rate', value: '0.12%', change: '+0.03%', trend: 'up', icon: AlertCircle },
  { title: 'Monthly Cost', value: '$2,340', change: '+12.1%', trend: 'up', icon: DollarSign },
];

const usageData = [
  { time: '00:00', requests: 420 },
  { time: '04:00', requests: 280 },
  { time: '08:00', requests: 680 },
  { time: '12:00', requests: 920 },
  { time: '16:00', requests: 1240 },
  { time: '20:00', requests: 780 },
];

const latencyData = [
  { model: 'GPT-4', avg: 245, p95: 380 },
  { model: 'GPT-3.5', avg: 120, p95: 180 },
  { model: 'Claude', avg: 156, p95: 220 },
];

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)'];

const modelDistribution = [
  { name: 'GPT-4', value: 45 },
  { name: 'GPT-3.5', value: 30 },
  { name: 'Claude', value: 25 },
];

const topUsers = [
  { user: 'john.doe@email.com', requests: 12453, cost: '$234.50' },
  { user: 'jane.smith@email.com', requests: 9832, cost: '$189.20' },
  { user: 'bob.wilson@email.com', requests: 7621, cost: '$145.80' },
  { user: 'alice.brown@email.com', requests: 6543, cost: '$125.60' },
];

const recentErrors = [
  { error: 'Rate limit exceeded', user: 'john.doe@email.com', time: '5 min ago' },
  { error: 'Invalid API key', user: 'jane.smith@email.com', time: '15 min ago' },
  { error: 'Timeout', user: 'bob.wilson@email.com', time: '32 min ago' },
];

const chartTooltipStyle = {
  backgroundColor: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  fontSize: '12px',
  padding: '8px 12px',
};

export default function AIPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl tracking-tight">AI Management</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Monitor AI usage, performance, and costs
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">{stat.title}</CardTitle>
                <Icon className="size-4 text-[var(--color-muted-foreground)]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{stat.value}</div>
                <div className="flex items-center gap-1 text-xs text-[var(--color-muted-foreground)]">
                  <TrendingUp className={`size-3 ${stat.trend === 'down' ? 'text-emerald-500' : ''}`} />
                  <span>{stat.change}</span>
                  <span>from last month</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>AI Usage (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="time" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                />
                <Line
                  type="monotone"
                  dataKey="requests"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Model Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={modelDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {modelDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Latency by Model</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={latencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="model" stroke="var(--color-muted-foreground)" />
              <YAxis stroke="var(--color-muted-foreground)" />
              <Tooltip
                contentStyle={chartTooltipStyle}
              />
              <Bar key="avg-bar" dataKey="avg" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              <Bar key="p95-bar" dataKey="p95" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Users by Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topUsers.map((user, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-[var(--color-muted)] text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm">{user.user}</div>
                      <div className="text-xs text-[var(--color-muted-foreground)]">
                        {user.requests.toLocaleString()} requests
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">{user.cost}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentErrors.map((error, index) => (
                <div key={index} className="flex items-start gap-3">
                  <AlertCircle className="size-4 text-red-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{error.error}</span>
                      <span className="text-xs text-[var(--color-muted-foreground)]">
                        {error.time}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--color-muted-foreground)]">{error.user}</div>
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