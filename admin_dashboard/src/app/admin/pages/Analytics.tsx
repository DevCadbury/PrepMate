import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Users, Clock, MessageSquare, Code, TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const stats = [
  { title: 'Daily Active Users', value: '8,234', change: '+8.2%', icon: Users },
  { title: 'Avg Session Time', value: '24m', change: '+12.5%', icon: Clock },
  { title: 'Total Posts', value: '45,678', change: '+15.3%', icon: MessageSquare },
  { title: 'Problems Solved', value: '12,890', change: '+22.1%', icon: Code },
];

const userGrowthData = [
  { month: 'Jan', users: 8200, active: 5400 },
  { month: 'Feb', users: 9100, active: 6200 },
  { month: 'Mar', users: 10300, active: 7100 },
  { month: 'Apr', users: 11800, active: 8000 },
  { month: 'May', users: 12543, active: 8234 },
];

const engagementData = [
  { day: 'Mon', posts: 420, comments: 680, likes: 1240 },
  { day: 'Tue', posts: 480, comments: 720, likes: 1380 },
  { day: 'Wed', posts: 520, comments: 780, likes: 1520 },
  { day: 'Thu', posts: 490, comments: 740, likes: 1420 },
  { day: 'Fri', posts: 560, comments: 820, likes: 1680 },
  { day: 'Sat', posts: 380, comments: 520, likes: 980 },
  { day: 'Sun', posts: 320, comments: 460, likes: 820 },
];

const codingStatsData = [
  { difficulty: 'Easy', solved: 5234, attempted: 7890 },
  { difficulty: 'Medium', solved: 4567, attempted: 8234 },
  { difficulty: 'Hard', solved: 3089, attempted: 6543 },
];

const interviewData = [
  { week: 'Week 1', completed: 45, scheduled: 67 },
  { week: 'Week 2', completed: 52, scheduled: 72 },
  { week: 'Week 3', completed: 58, scheduled: 78 },
  { week: 'Week 4', completed: 64, scheduled: 85 },
];

const revenueData = [
  { month: 'Jan', revenue: 42300 },
  { month: 'Feb', revenue: 44800 },
  { month: 'Mar', revenue: 46200 },
  { month: 'Apr', revenue: 47900 },
  { month: 'May', revenue: 48293 },
];

const chartTooltipStyle = {
  backgroundColor: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  fontSize: '12px',
  padding: '8px 12px',
};

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl tracking-tight">Analytics</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Platform metrics and insights
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
                  <TrendingUp className="size-3 text-green-500" />
                  <span className="text-green-500">{stat.change}</span>
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
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                />
                <Legend />
                <Area
                  key="users-area"
                  type="monotone"
                  dataKey="users"
                  stackId="1"
                  stroke="var(--chart-1)"
                  fill="var(--chart-1)"
                  fillOpacity={0.6}
                />
                <Area
                  key="active-area"
                  type="monotone"
                  dataKey="active"
                  stackId="2"
                  stroke="var(--chart-2)"
                  fill="var(--chart-2)"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                />
                <Legend />
                <Line key="posts-line" type="monotone" dataKey="posts" stroke="var(--chart-1)" strokeWidth={2} />
                <Line key="comments-line" type="monotone" dataKey="comments" stroke="var(--chart-2)" strokeWidth={2} />
                <Line key="likes-line" type="monotone" dataKey="likes" stroke="var(--chart-3)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Coding Problems</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={codingStatsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="difficulty" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                />
                <Legend />
                <Bar key="attempted-bar" dataKey="attempted" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                <Bar key="solved-bar" dataKey="solved" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interview Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={interviewData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="week" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                />
                <Legend />
                <Bar key="scheduled-bar" dataKey="scheduled" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                <Bar key="completed-bar" dataKey="completed" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" stroke="var(--color-muted-foreground)" />
              <YAxis stroke="var(--color-muted-foreground)" />
              <Tooltip
                contentStyle={chartTooltipStyle}
                formatter={(value: number) => `$${value.toLocaleString()}`}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--chart-1)"
                fill="var(--chart-1)"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}