// Coupon management types + helpers (no mock data)

export type CouponStatus = 'active' | 'inactive' | 'scheduled' | 'expired';
export type DiscountType = 'percentage' | 'fixed' | 'free_access';
export type CouponVariant = 'standard' | 'referral' | 'bulk' | 'conditional' | 'tier';
export type TargetAudience = 'all' | 'new_users' | 'specific_users' | 'role_based';
export type UserTier = 'basic' | 'premium' | 'enterprise';

export interface EligibilityRules {
  targetAudience: TargetAudience;
  specificUsers?: string[];
  userRoles?: string[];
  minimumCondition?: 'purchase' | 'submission' | 'upgrade' | 'none';
  minimumValue?: number;
  triggerEvent?: 'signup' | 'inactivity' | 'milestone' | 'manual';
}

export interface Restrictions {
  stackable: boolean;
  excludedUserIds?: string[];
  countries?: string[];
  devices?: ('desktop' | 'mobile' | 'tablet')[];
  timeWindow?: { start: string; end: string };
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  status: CouponStatus;
  discountType: DiscountType;
  value: number;
  maxDiscountCap?: number;
  usageLimit: number;
  perUserLimit: number;
  oneTimeUse: boolean;
  usedCount: number;
  uniqueUsers: number;
  startDate?: string;
  endDate?: string;
  scheduledActivation?: string;
  eligibility: EligibilityRules;
  restrictions: Restrictions;
  variant: CouponVariant;
  referralUserId?: string;
  tier?: UserTier;
  prefix?: string;
  createdAt: string;
  createdBy: string;
  tags?: string[];
}

export interface CouponUsage {
  id: string;
  couponId: string;
  couponCode?: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  timestamp: string;
  discountApplied: number;
  context: string;
  orderId?: string;
  suspicious: boolean;
  flagReason?: string;
  device: string;
  country: string;
  ipAddress: string;
}

export interface UsageTrend {
  date: string;
  uses: number;
}

export const buildUsageTrendFromLogs = (logs: CouponUsage[], days = 14): UsageTrend[] => {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  const counts = new Map<string, number>();
  logs.forEach((log) => {
    const d = new Date(log.timestamp);
    if (Number.isNaN(d.getTime())) return;
    if (d < start) return;
    const key = d.toISOString().split('T')[0];
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return Array.from({ length: days }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split('T')[0];
    return { date: key, uses: counts.get(key) || 0 };
  });
};

export const formatDiscountValue = (coupon: Coupon): string => {
  if (coupon.discountType === 'percentage') return `${coupon.value}% off`;
  if (coupon.discountType === 'fixed') return `₹${coupon.value} off`;
  return `${coupon.value}-day free access`;
};

export const getUsagePercent = (coupon: Coupon): number => {
  if (coupon.usageLimit === 0) return 0;
  return Math.round((coupon.usedCount / coupon.usageLimit) * 100);
};

export const isNearLimit = (coupon: Coupon): boolean => {
  if (coupon.usageLimit === 0) return false;
  return getUsagePercent(coupon) >= 80;
};

export const getCouponStatusColor = (status: CouponStatus): string => {
  switch (status) {
    case 'active':
      return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    case 'inactive':
      return 'text-slate-500 bg-slate-50 border-slate-200';
    case 'scheduled':
      return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'expired':
      return 'text-red-500 bg-red-50 border-red-200';
    default:
      return 'text-slate-500 bg-slate-50 border-slate-200';
  }
};

export const getVariantColor = (variant: CouponVariant): string => {
  switch (variant) {
    case 'referral':
      return 'text-purple-600 bg-purple-50 border-purple-200';
    case 'bulk':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'conditional':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'tier':
      return 'text-indigo-600 bg-indigo-50 border-indigo-200';
    default:
      return 'text-slate-600 bg-slate-50 border-slate-200';
  }
};

export const generateCouponCode = (prefix?: string): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const suffix = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return prefix ? `${prefix.toUpperCase()}_${suffix}` : suffix;
};
