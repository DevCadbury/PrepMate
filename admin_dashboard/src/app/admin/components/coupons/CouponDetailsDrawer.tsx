import { useNavigate } from 'react-router';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../../../components/ui/sheet';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Separator } from '../../../components/ui/separator';
import { Progress } from '../../../components/ui/progress';
import {
  ExternalLink,
  Copy,
  Calendar,
  Users,
  Percent,
  DollarSign,
  Gift,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Ban,
  Globe,
  Smartphone,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Coupon,
  CouponUsage,
  formatDiscountValue,
  getUsagePercent,
  isNearLimit,
  getCouponStatusColor,
  getVariantColor,
} from '../../data/couponData';
import { cn } from '../../../lib/utils';

interface CouponDetailsDrawerProps {
  coupon: Coupon | null;
  usageLogs: CouponUsage[];
  open: boolean;
  onClose: () => void;
  onEdit: (coupon: Coupon) => void;
  onToggleStatus: (coupon: Coupon) => void;
  onDelete: (coupon: Coupon) => void;
}

const DiscountIcon = ({ type }: { type: string }) => {
  if (type === 'percentage') return <Percent className="size-4" />;
  if (type === 'fixed') return <DollarSign className="size-4" />;
  return <Gift className="size-4" />;
};

export default function CouponDetailsDrawer({
  coupon,
  usageLogs,
  open,
  onClose,
  onEdit,
  onToggleStatus,
  onDelete,
}: CouponDetailsDrawerProps) {
  const navigate = useNavigate();

  if (!coupon) return null;

  const recentLogs = usageLogs.filter((l) => l.couponId === coupon.id).slice(0, 5);
  const suspiciousCount = usageLogs.filter((l) => l.couponId === coupon.id && l.suspicious).length;
  const usagePercent = getUsagePercent(coupon);
  const nearLimit = isNearLimit(coupon);

  const copyCode = () => {
    navigator.clipboard.writeText(coupon.code);
    toast.success(`Copied "${coupon.code}" to clipboard`);
  };

  const audienceLabel: Record<string, string> = {
    all: 'All users',
    new_users: 'New users only',
    specific_users: 'Specific users',
    role_based: 'Role-based',
  };

  const triggerLabel: Record<string, string> = {
    signup: 'After signup',
    inactivity: 'After inactivity',
    milestone: 'After milestone',
    manual: 'Manual',
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[440px] sm:w-[480px] flex flex-col gap-0 p-0 overflow-hidden">
        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <SheetTitle className="text-base font-mono tracking-wider">{coupon.code}</SheetTitle>
                <button
                  onClick={copyCode}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Copy className="size-3.5" />
                </button>
              </div>
              <SheetDescription className="text-[13px] leading-relaxed line-clamp-2">
                {coupon.description}
              </SheetDescription>
            </div>
            <div className="flex flex-col gap-1.5 items-end shrink-0">
              <span className={cn('text-xs px-2 py-0.5 rounded-full border', getCouponStatusColor(coupon.status))}>
                {coupon.status.charAt(0).toUpperCase() + coupon.status.slice(1)}
              </span>
              <span className={cn('text-xs px-2 py-0.5 rounded-full border', getVariantColor(coupon.variant))}>
                {coupon.variant.charAt(0).toUpperCase() + coupon.variant.slice(1)}
              </span>
            </div>
          </div>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Discount & Usage Overview */}
          <div className="px-6 py-4 border-b border-border">
            <div className="grid grid-cols-2 gap-3">
              {/* Discount */}
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-primary/5 border border-primary/15">
                <div className="size-8 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <DiscountIcon type={coupon.discountType} />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Discount</p>
                  <p className="text-sm text-foreground">{formatDiscountValue(coupon)}</p>
                </div>
              </div>
              {/* Unique users */}
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-muted border border-border">
                <div className="size-8 rounded-md bg-background flex items-center justify-center text-muted-foreground shrink-0">
                  <Users className="size-4" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Unique users</p>
                  <p className="text-sm text-foreground">{coupon.uniqueUsers.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Cap info */}
            {coupon.discountType === 'percentage' && coupon.maxDiscountCap && (
              <p className="text-[12px] text-muted-foreground mt-2 flex items-center gap-1">
                <Shield className="size-3" />
                Max discount cap: ₹{coupon.maxDiscountCap.toLocaleString()}
              </p>
            )}
          </div>

          {/* Redemption Progress */}
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[13px] text-muted-foreground">Redemptions</p>
              {nearLimit && (
                <span className="flex items-center gap-1 text-[11px] text-amber-600">
                  <AlertTriangle className="size-3" /> Nearing limit
                </span>
              )}
              {coupon.usageLimit === 0 && (
                <span className="text-[11px] text-muted-foreground">Unlimited</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Progress
                  value={coupon.usageLimit === 0 ? 0 : usagePercent}
                  className="h-2"
                />
              </div>
              <p className="text-[13px] text-foreground shrink-0">
                {coupon.usedCount.toLocaleString()}
                {coupon.usageLimit > 0 && ` / ${coupon.usageLimit.toLocaleString()}`}
              </p>
            </div>
            <div className="flex gap-4 mt-2">
              <p className="text-[11px] text-muted-foreground">
                Per-user limit: <span className="text-foreground">{coupon.perUserLimit}×</span>
              </p>
              {coupon.oneTimeUse && (
                <p className="text-[11px] text-muted-foreground">One-time use only</p>
              )}
            </div>
          </div>

          {/* Validity */}
          <div className="px-6 py-4 border-b border-border">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2.5">Validity</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[13px]">
                <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                <span className="text-muted-foreground">Start:</span>
                <span className="text-foreground">{new Date(coupon.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2 text-[13px]">
                <Clock className="size-3.5 text-amber-500 shrink-0" />
                <span className="text-muted-foreground">Expires:</span>
                <span className="text-foreground">{new Date(coupon.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              {coupon.scheduledActivation && (
                <div className="flex items-center gap-2 text-[13px]">
                  <Calendar className="size-3.5 text-blue-500 shrink-0" />
                  <span className="text-muted-foreground">Auto-activates:</span>
                  <span className="text-foreground">{new Date(coupon.scheduledActivation).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                </div>
              )}
            </div>
          </div>

          {/* Eligibility */}
          <div className="px-6 py-4 border-b border-border">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2.5">Eligibility</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[13px]">
                <Users className="size-3.5 text-muted-foreground shrink-0" />
                <span className="text-foreground">{audienceLabel[coupon.eligibility.targetAudience]}</span>
              </div>
              {coupon.eligibility.triggerEvent && coupon.eligibility.triggerEvent !== 'manual' && (
                <div className="flex items-center gap-2 text-[13px]">
                  <CheckCircle2 className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="text-foreground">{triggerLabel[coupon.eligibility.triggerEvent]}</span>
                </div>
              )}
              {coupon.eligibility.userRoles && coupon.eligibility.userRoles.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {coupon.eligibility.userRoles.map((r) => (
                    <Badge key={r} variant="outline" className="text-[11px] h-5">{r}</Badge>
                  ))}
                </div>
              )}
              {coupon.eligibility.minimumCondition && coupon.eligibility.minimumCondition !== 'none' && (
                <div className="flex items-center gap-2 text-[13px]">
                  <Shield className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Min condition:</span>
                  <span className="text-foreground capitalize">{coupon.eligibility.minimumCondition}</span>
                  {coupon.eligibility.minimumValue && (
                    <span className="text-muted-foreground">({coupon.eligibility.minimumValue}+)</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Restrictions */}
          {(coupon.restrictions.countries?.length || coupon.restrictions.devices?.length || !coupon.restrictions.stackable) && (
            <div className="px-6 py-4 border-b border-border">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2.5">Restrictions</p>
              <div className="space-y-1.5">
                {!coupon.restrictions.stackable && (
                  <div className="flex items-center gap-2 text-[13px]">
                    <Ban className="size-3.5 text-red-400 shrink-0" />
                    <span className="text-foreground">Cannot stack with other coupons</span>
                  </div>
                )}
                {coupon.restrictions.countries && coupon.restrictions.countries.length > 0 && (
                  <div className="flex items-center gap-2 text-[13px]">
                    <Globe className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="text-foreground">{coupon.restrictions.countries.join(', ')}</span>
                  </div>
                )}
                {coupon.restrictions.devices && coupon.restrictions.devices.length > 0 && (
                  <div className="flex items-center gap-2 text-[13px]">
                    <Smartphone className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="text-foreground capitalize">{coupon.restrictions.devices.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fraud Alert */}
          {suspiciousCount > 0 && (
            <div className="px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200">
                <AlertTriangle className="size-4 text-red-500 shrink-0" />
                <div>
                  <p className="text-[13px] text-red-700">
                    {suspiciousCount} suspicious redemption{suspiciousCount > 1 ? 's' : ''} flagged
                  </p>
                  <p className="text-[11px] text-red-500 mt-0.5">View usage logs for details</p>
                </div>
              </div>
            </div>
          )}

          {/* Recent Usage */}
          {recentLogs.length > 0 && (
            <div className="px-6 py-4">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3">Recent redemptions</p>
              <div className="space-y-2.5">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-[10px] text-primary">{log.userName.charAt(0)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] text-foreground truncate">{log.userName}</p>
                        <p className="text-[11px] text-muted-foreground">{new Date(log.timestamp).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {log.suspicious && <AlertTriangle className="size-3 text-amber-500" />}
                      {log.discountApplied > 0 && (
                        <span className="text-[12px] text-foreground">₹{log.discountApplied}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-border bg-muted/30 shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-[13px]"
              onClick={() => { navigate(`/admin/coupons/${coupon.id}`); onClose(); }}
            >
              <ExternalLink className="size-3.5 mr-1.5" />
              Full Details
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-[13px]"
              onClick={() => { onEdit(coupon); onClose(); }}
            >
              Edit
            </Button>
            <Button
              variant={coupon.status === 'active' ? 'destructive' : 'default'}
              size="sm"
              className="flex-1 text-[13px]"
              onClick={() => { onToggleStatus(coupon); onClose(); }}
            >
              {coupon.status === 'active' ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
