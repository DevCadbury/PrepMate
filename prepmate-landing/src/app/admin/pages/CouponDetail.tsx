import { useState } from 'react';
import type { ReactNode, ElementType } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Copy,
  Edit,
  Power,
  PowerOff,
  Trash2,
  BarChart3,
  ScrollText,
  LayoutDashboard,
  AlertTriangle,
  CheckCircle2,
  Users,
  Percent,
  DollarSign,
  Gift,
  Globe,
  Smartphone,
  Monitor,
  Ban,
  Shield,
  Clock,
  Calendar,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Tag,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Separator } from '../../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { toast } from 'sonner';
import {
  mockCoupons,
  mockUsageLogs,
  getUsageTrendData,
  formatDiscountValue,
  getUsagePercent,
  isNearLimit,
  getCouponStatusColor,
  getVariantColor,
  Coupon,
} from '../data/couponData';
import UsageLogsTable from '../components/coupons/UsageLogsTable';
import { cn } from '../../lib/utils';

// ─── Chart tooltip style ─────────────────────────────────────────────────────

const tooltipStyle = {
  backgroundColor: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  fontSize: '12px',
  padding: '8px 12px',
};

// ─── Small stat card ─────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  warning,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: ElementType;
  color?: string;
  warning?: boolean;
}) {
  return (
    <div className={cn('p-4 rounded-xl border bg-card', warning && 'border-amber-300 bg-amber-50/40')}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn('size-3.5', color ?? 'text-muted-foreground', warning && 'text-amber-600')} />
        <p className={cn('text-[12px]', warning ? 'text-amber-600' : 'text-muted-foreground')}>{label}</p>
      </div>
      <p className={cn('text-xl text-foreground', warning && 'text-amber-700')}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Info row ────────────────────────────────────────────────────────────────

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-2.5">
      <span className="text-[12px] text-muted-foreground w-36 shrink-0 pt-0.5">{label}</span>
      <div className="flex-1 text-[13px] text-foreground">{children}</div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CouponDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const coupon = mockCoupons.find((c) => c.id === id) ?? mockCoupons[0];
  const logs = mockUsageLogs.filter((l) => l.couponId === coupon.id);
  const trendData = getUsageTrendData(coupon.id);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [status, setStatus] = useState(coupon.status);

  const usagePercent = getUsagePercent({ ...coupon, status });
  const remaining = coupon.usageLimit > 0 ? coupon.usageLimit - coupon.usedCount : null;
  const suspiciousLogs = logs.filter((l) => l.suspicious);
  const uniqueCountries = [...new Set(logs.map((l) => l.country))];
  const deviceBreakdown = ['desktop', 'mobile', 'tablet'].map((d) => ({
    name: d.charAt(0).toUpperCase() + d.slice(1),
    value: logs.filter((l) => l.device === d).length,
  }));
  const roleBreakdown = ['basic', 'premium', 'enterprise'].map((r) => ({
    name: r.charAt(0).toUpperCase() + r.slice(1),
    value: logs.filter((l) => l.userRole === r).length,
  }));

  const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

  const handleToggle = () => {
    if (status === 'active') {
      setDeactivateOpen(true);
    } else {
      setStatus('active');
      toast.success(`Coupon "${coupon.code}" activated`);
    }
  };

  const confirmDeactivate = () => {
    setStatus('inactive');
    toast.success(`Coupon "${coupon.code}" deactivated`);
    setDeactivateOpen(false);
  };

  const handleDelete = () => {
    toast.success(`Coupon "${coupon.code}" deleted`);
    navigate('/admin/coupons');
  };

  const copyCode = () => {
    navigator.clipboard.writeText(coupon.code);
    toast.success('Code copied to clipboard');
  };

  // ─── Audience / trigger labels ─────────────────────────────────────────

  const audienceLabel: Record<string, string> = {
    all: 'All users',
    new_users: 'New users only (joined ≤ 7 days)',
    specific_users: `${coupon.eligibility.specificUsers?.length ?? 0} specific users`,
    role_based: `Roles: ${(coupon.eligibility.userRoles ?? []).join(', ')}`,
  };

  const triggerLabel: Record<string, string> = {
    signup: 'After signup',
    inactivity: 'After 60-day inactivity',
    milestone: 'After coding milestone',
    manual: 'Manual distribution',
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 max-w-5xl mx-auto">

      {/* ── Sticky header ────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 sticky top-0 z-10 bg-background/95 backdrop-blur py-3 -mx-6 px-6 border-b border-border -mt-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={() => navigate('/admin/coupons')}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-base text-foreground tracking-wider">{coupon.code}</span>
              <button onClick={copyCode} className="text-muted-foreground hover:text-foreground">
                <Copy className="size-3.5" />
              </button>
              <span className={cn('text-[11px] px-2 py-0.5 rounded-full border', getCouponStatusColor(status))}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
              <span className={cn('text-[11px] px-2 py-0.5 rounded-full border', getVariantColor(coupon.variant))}>
                {coupon.variant.charAt(0).toUpperCase() + coupon.variant.slice(1)}
              </span>
            </div>
            <p className="text-[12px] text-muted-foreground mt-0.5 max-w-[400px] truncate">{coupon.description}</p>
          </div>
        </div>

        {/* Header actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="h-8 text-[13px] gap-1.5" onClick={() => navigate('/admin/coupons/create')}>
            <Edit className="size-3.5" /> Edit
          </Button>
          <Button
            variant={status === 'active' ? 'outline' : 'default'}
            size="sm"
            className="h-8 text-[13px] gap-1.5"
            onClick={handleToggle}
          >
            {status === 'active'
              ? <><PowerOff className="size-3.5" /> Deactivate</>
              : <><Power className="size-3.5" /> Activate</>
            }
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-[13px] gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-3.5" /> Delete
          </Button>
        </div>
      </div>

      {/* ── Key stats row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total redemptions"
          value={coupon.usedCount.toLocaleString()}
          sub={coupon.usageLimit > 0 ? `of ${coupon.usageLimit.toLocaleString()} limit` : 'Unlimited'}
          icon={TrendingUp}
          color="text-primary"
        />
        <StatCard
          label="Unique users"
          value={coupon.uniqueUsers.toLocaleString()}
          icon={Users}
        />
        <StatCard
          label="Remaining"
          value={remaining !== null ? remaining.toLocaleString() : '∞'}
          sub={remaining !== null && remaining <= 50 ? 'Nearing limit!' : undefined}
          icon={remaining !== null && remaining <= 50 ? AlertTriangle : CheckCircle2}
          warning={remaining !== null && remaining <= 50}
        />
        <StatCard
          label="Suspicious flags"
          value={suspiciousLogs.length}
          sub={suspiciousLogs.length > 0 ? 'Review logs' : 'All clean'}
          icon={AlertTriangle}
          warning={suspiciousLogs.length > 0}
        />
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="overview">
        <TabsList className="bg-muted/50 h-9">
          <TabsTrigger value="overview" className="text-[13px] gap-1.5 h-7">
            <LayoutDashboard className="size-3.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="logs" className="text-[13px] gap-1.5 h-7">
            <ScrollText className="size-3.5" /> Usage Logs
            {suspiciousLogs.length > 0 && (
              <span className="ml-1 size-4 rounded-full bg-amber-100 text-amber-600 text-[10px] flex items-center justify-center">
                {suspiciousLogs.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-[13px] gap-1.5 h-7">
            <BarChart3 className="size-3.5" /> Analytics
          </TabsTrigger>
        </TabsList>

        {/* ── Overview ──────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="mt-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Left: config details */}
            <div className="lg:col-span-2 space-y-4">

              {/* Redemption progress */}
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm text-foreground">Redemption Progress</h3>
                  {isNearLimit({ ...coupon, status }) && (
                    <span className="flex items-center gap-1 text-[12px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="size-3" /> Nearing limit
                    </span>
                  )}
                </div>

                {coupon.usageLimit > 0 ? (
                  <div className="space-y-3">
                    <Progress value={usagePercent} className={cn('h-3', usagePercent >= 80 && '[&>div]:bg-amber-500')} />
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-muted-foreground">
                        <span className="text-foreground">{coupon.usedCount.toLocaleString()}</span> used
                      </span>
                      <span className="text-muted-foreground">
                        <span className="text-foreground">{remaining?.toLocaleString()}</span> remaining
                      </span>
                      <span className="text-muted-foreground">
                        <span className="text-foreground">{coupon.usageLimit.toLocaleString()}</span> total
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                    <CheckCircle2 className="size-4 text-emerald-500" />
                    Unlimited redemptions enabled — {coupon.usedCount.toLocaleString()} used so far
                  </div>
                )}

                <Separator className="my-4" />
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Per-user limit</p>
                    <p className="text-sm text-foreground">{coupon.perUserLimit}×</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">One-time use</p>
                    <p className="text-sm text-foreground">{coupon.oneTimeUse ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Unique users</p>
                    <p className="text-sm text-foreground">{coupon.uniqueUsers.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Discount & Validity */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-sm text-foreground mb-3">Configuration</h3>
                <div className="divide-y divide-border">
                  <InfoRow label="Discount">
                    <span>{formatDiscountValue(coupon)}</span>
                    {coupon.maxDiscountCap && (
                      <span className="text-muted-foreground ml-2">(capped at ₹{coupon.maxDiscountCap.toLocaleString()})</span>
                    )}
                  </InfoRow>
                  <InfoRow label="Discount type">
                    <span className="capitalize">{coupon.discountType.replace('_', ' ')}</span>
                  </InfoRow>
                  <InfoRow label="Start date">
                    {new Date(coupon.startDate).toLocaleString('en-IN', {
                      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </InfoRow>
                  <InfoRow label="Expiry date">
                    {new Date(coupon.endDate).toLocaleString('en-IN', {
                      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </InfoRow>
                  {coupon.scheduledActivation && (
                    <InfoRow label="Auto-activates">
                      {new Date(coupon.scheduledActivation).toLocaleString('en-IN', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </InfoRow>
                  )}
                  <InfoRow label="Created by">
                    {coupon.createdBy} · {new Date(coupon.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </InfoRow>
                  {coupon.tags && coupon.tags.length > 0 && (
                    <InfoRow label="Tags">
                      <div className="flex gap-1.5 flex-wrap">
                        {coupon.tags.map((t) => (
                          <span key={t} className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                            {t}
                          </span>
                        ))}
                      </div>
                    </InfoRow>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Eligibility + Restrictions sidebar */}
            <div className="space-y-4">
              {/* Eligibility */}
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-sm text-foreground mb-3">Eligibility</h3>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2">
                    <Users className="size-3.5 text-primary mt-0.5 shrink-0" />
                    <span className="text-[13px] text-foreground">{audienceLabel[coupon.eligibility.targetAudience]}</span>
                  </div>
                  {coupon.eligibility.triggerEvent && (
                    <div className="flex items-start gap-2">
                      <Calendar className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <span className="text-[13px] text-foreground">{triggerLabel[coupon.eligibility.triggerEvent]}</span>
                    </div>
                  )}
                  {coupon.eligibility.minimumCondition && coupon.eligibility.minimumCondition !== 'none' && (
                    <div className="flex items-start gap-2">
                      <Shield className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <span className="text-[13px] text-foreground capitalize">
                        Min condition: {coupon.eligibility.minimumCondition}
                        {coupon.eligibility.minimumValue && ` (${coupon.eligibility.minimumValue}+)`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Restrictions */}
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-sm text-foreground mb-3">Restrictions</h3>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2">
                    {coupon.restrictions.stackable ? (
                      <CheckCircle2 className="size-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    ) : (
                      <Ban className="size-3.5 text-red-400 mt-0.5 shrink-0" />
                    )}
                    <span className="text-[13px] text-foreground">
                      {coupon.restrictions.stackable ? 'Stackable with other coupons' : 'Cannot stack with other coupons'}
                    </span>
                  </div>
                  {coupon.restrictions.countries && coupon.restrictions.countries.length > 0 && (
                    <div className="flex items-start gap-2">
                      <Globe className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <span className="text-[13px] text-foreground">{coupon.restrictions.countries.join(', ')}</span>
                    </div>
                  )}
                  {coupon.restrictions.devices && coupon.restrictions.devices.length > 0 && (
                    <div className="flex items-start gap-2">
                      <Monitor className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <span className="text-[13px] text-foreground capitalize">{coupon.restrictions.devices.join(', ')}</span>
                    </div>
                  )}
                  {coupon.restrictions.timeWindow && (
                    <div className="flex items-start gap-2">
                      <Clock className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <span className="text-[13px] text-foreground">
                        {coupon.restrictions.timeWindow.start} – {coupon.restrictions.timeWindow.end}
                      </span>
                    </div>
                  )}
                  {!coupon.restrictions.countries?.length && !coupon.restrictions.devices?.length && !coupon.restrictions.timeWindow && (
                    <p className="text-[13px] text-muted-foreground">No geographic or device restrictions</p>
                  )}
                </div>
              </div>

              {/* Fraud alert */}
              {suspiciousLogs.length > 0 && (
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="size-4 text-amber-600" />
                    <span className="text-[13px] text-amber-700">Fraud signals detected</span>
                  </div>
                  <p className="text-[12px] text-amber-600 mb-3">
                    {suspiciousLogs.length} redemption{suspiciousLogs.length > 1 ? 's' : ''} flagged for suspicious activity.
                  </p>
                  <ul className="space-y-1">
                    {suspiciousLogs.slice(0, 2).map((log) => (
                      <li key={log.id} className="text-[11px] text-amber-700">
                        • {log.userName}: {log.flagReason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Countries used from */}
              {uniqueCountries.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="text-sm text-foreground mb-2.5">Countries</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {uniqueCountries.map((c) => (
                      <span key={c} className="text-[11px] font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── Usage Logs ────────────────────────────────────────────────── */}
        <TabsContent value="logs" className="mt-5">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm text-foreground">Usage Logs</h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  All redemptions for <span className="font-mono">{coupon.code}</span> · {logs.length} total
                </p>
              </div>
            </div>
            {logs.length > 0 ? (
              <UsageLogsTable logs={logs} />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <ScrollText className="size-10 text-muted-foreground/30 mb-3" />
                <p className="text-[13px] text-muted-foreground">No redemptions yet</p>
                <p className="text-[12px] text-muted-foreground/60 mt-1">
                  Usage logs will appear here when users redeem this coupon
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Analytics ─────────────────────────────────────────────────── */}
        <TabsContent value="analytics" className="mt-5 space-y-5">

          {/* Trend chart */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm text-foreground">Redemption Trend</h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">Cumulative daily usage over last 14 days</p>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <TrendingUp className="size-3.5 text-emerald-500" />
                {trendData[trendData.length - 1].uses - trendData[0].uses} new in 14 days
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="usageGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  tickFormatter={(v) => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <RechartsTooltip
                  contentStyle={tooltipStyle}
                  labelFormatter={(v) => new Date(v).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                />
                <Area
                  type="monotone"
                  dataKey="uses"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  fill="url(#usageGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: 'var(--chart-1)' }}
                  name="Redemptions"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Device + Role charts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Device breakdown */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm text-foreground mb-4">Device Breakdown</h3>
              {logs.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={deviceBreakdown.filter((d) => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {deviceBreakdown.filter((d) => d.value > 0).map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: '12px' }}
                    />
                    <RechartsTooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-[13px] text-muted-foreground">
                  No data yet
                </div>
              )}
            </div>

            {/* Role breakdown */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm text-foreground mb-4">User Tier Breakdown</h3>
              {logs.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={roleBreakdown} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <RechartsTooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="value" name="Redemptions" radius={[4, 4, 0, 0]}>
                      {roleBreakdown.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-[13px] text-muted-foreground">
                  No data yet
                </div>
              )}
            </div>
          </div>

          {/* Summary metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-[11px] text-muted-foreground mb-1">Total uses</p>
              <p className="text-xl text-foreground">{coupon.usedCount}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-[11px] text-muted-foreground mb-1">Unique users</p>
              <p className="text-xl text-foreground">{coupon.uniqueUsers}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-[11px] text-muted-foreground mb-1">Conversion rate</p>
              <p className="text-xl text-foreground">
                {coupon.usageLimit > 0
                  ? `${Math.round((coupon.usedCount / coupon.usageLimit) * 100)}%`
                  : 'N/A'}
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-[11px] text-muted-foreground mb-1">Remaining</p>
              <p className="text-xl text-foreground">
                {coupon.usageLimit > 0 ? (coupon.usageLimit - coupon.usedCount).toLocaleString() : '∞'}
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Dialogs ───────────────────────────────────────────────────────── */}

      <AlertDialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate coupon?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-mono">{coupon.code}</span> will stop accepting new redemptions
              immediately. Existing redemptions and logs are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeactivate}>Deactivate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete coupon?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-mono">{coupon.code}</span> will be permanently removed.
              Historical usage logs are preserved. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete coupon
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}