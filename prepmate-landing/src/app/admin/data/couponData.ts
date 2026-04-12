// ─── Coupon Management Data Layer ───────────────────────────────────────────
// Models, enums, mock data, and helpers for the coupon management system.

export type CouponStatus = 'active' | 'inactive' | 'scheduled' | 'expired';
export type DiscountType = 'percentage' | 'fixed' | 'free_access';
export type CouponVariant = 'standard' | 'referral' | 'bulk' | 'conditional' | 'tier';
export type TargetAudience = 'all' | 'new_users' | 'specific_users' | 'role_based';
export type UserTier = 'basic' | 'premium' | 'enterprise';

export interface EligibilityRules {
  targetAudience: TargetAudience;
  specificUsers?: string[];       // user IDs or emails
  userRoles?: string[];           // 'basic', 'premium', 'enterprise'
  minimumCondition?: 'purchase' | 'submission' | 'upgrade' | 'none';
  minimumValue?: number;
  triggerEvent?: 'signup' | 'inactivity' | 'milestone' | 'manual';
}

export interface Restrictions {
  stackable: boolean;             // can stack with other coupons?
  excludedUserIds?: string[];
  countries?: string[];
  devices?: ('desktop' | 'mobile' | 'tablet')[];
  timeWindow?: { start: string; end: string };  // HH:mm format
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  status: CouponStatus;
  discountType: DiscountType;
  value: number;                  // % or ₹ amount
  maxDiscountCap?: number;        // only for percentage type
  usageLimit: number;             // 0 = unlimited
  perUserLimit: number;           // per-user cap
  oneTimeUse: boolean;
  usedCount: number;
  uniqueUsers: number;
  startDate: string;              // ISO date string
  endDate: string;
  scheduledActivation?: string;
  eligibility: EligibilityRules;
  restrictions: Restrictions;
  variant: CouponVariant;
  referralUserId?: string;        // for referral coupons
  tier?: UserTier;                // for tier-based coupons
  prefix?: string;                // for bulk generated
  createdAt: string;
  createdBy: string;
  tags?: string[];
}

export interface CouponUsage {
  id: string;
  couponId: string;
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

// ─── Mock Coupons ────────────────────────────────────────────────────────────

export const mockCoupons: Coupon[] = [
  {
    id: 'c1',
    code: 'PREP20',
    description: 'General 20% discount for all users during Q2 campaign',
    status: 'active',
    discountType: 'percentage',
    value: 20,
    maxDiscountCap: 500,
    usageLimit: 1000,
    perUserLimit: 1,
    oneTimeUse: true,
    usedCount: 742,
    uniqueUsers: 742,
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-06-30T23:59:59Z',
    eligibility: { targetAudience: 'all' },
    restrictions: { stackable: false, countries: ['IN', 'US', 'GB'] },
    variant: 'standard',
    createdAt: '2025-12-28T10:00:00Z',
    createdBy: 'Admin User',
    tags: ['campaign', 'q2'],
  },
  {
    id: 'c2',
    code: 'WELCOME50',
    description: '₹500 flat off for new users on first premium upgrade',
    status: 'active',
    discountType: 'fixed',
    value: 500,
    usageLimit: 0,
    perUserLimit: 1,
    oneTimeUse: true,
    usedCount: 1284,
    uniqueUsers: 1284,
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
    eligibility: {
      targetAudience: 'new_users',
      minimumCondition: 'upgrade',
      triggerEvent: 'signup',
    },
    restrictions: { stackable: false },
    variant: 'conditional',
    createdAt: '2025-12-15T09:00:00Z',
    createdBy: 'Admin User',
    tags: ['onboarding', 'welcome'],
  },
  {
    id: 'c3',
    code: 'PREMIUM30',
    description: '30% off for premium users renewing annual plan',
    status: 'active',
    discountType: 'percentage',
    value: 30,
    maxDiscountCap: 1500,
    usageLimit: 500,
    perUserLimit: 1,
    oneTimeUse: true,
    usedCount: 189,
    uniqueUsers: 189,
    startDate: '2026-03-01T00:00:00Z',
    endDate: '2026-05-31T23:59:59Z',
    eligibility: {
      targetAudience: 'role_based',
      userRoles: ['premium'],
      minimumCondition: 'upgrade',
    },
    restrictions: { stackable: true, devices: ['desktop'] },
    variant: 'tier',
    tier: 'premium',
    createdAt: '2026-02-20T08:00:00Z',
    createdBy: 'Admin User',
    tags: ['retention', 'premium'],
  },
  {
    id: 'c4',
    code: 'REF_JOHN_XK7',
    description: 'Referral coupon generated for John Doe',
    status: 'active',
    discountType: 'fixed',
    value: 250,
    usageLimit: 10,
    perUserLimit: 1,
    oneTimeUse: true,
    usedCount: 3,
    uniqueUsers: 3,
    startDate: '2026-02-01T00:00:00Z',
    endDate: '2026-07-31T23:59:59Z',
    eligibility: { targetAudience: 'new_users' },
    restrictions: { stackable: false },
    variant: 'referral',
    referralUserId: 'u1',
    createdAt: '2026-01-28T11:30:00Z',
    createdBy: 'System',
    tags: ['referral'],
  },
  {
    id: 'c5',
    code: 'FREECODING',
    description: 'Unlock 7 days of premium coding access — no payment',
    status: 'active',
    discountType: 'free_access',
    value: 7,
    usageLimit: 200,
    perUserLimit: 1,
    oneTimeUse: true,
    usedCount: 156,
    uniqueUsers: 156,
    startDate: '2026-01-15T00:00:00Z',
    endDate: '2026-04-30T23:59:59Z',
    eligibility: {
      targetAudience: 'new_users',
      triggerEvent: 'signup',
    },
    restrictions: { stackable: false, devices: ['desktop', 'mobile'] },
    variant: 'standard',
    createdAt: '2026-01-10T07:00:00Z',
    createdBy: 'Admin User',
    tags: ['trial', 'free-access'],
  },
  {
    id: 'c6',
    code: 'WINBACK40',
    description: '40% off for users inactive for 60+ days',
    status: 'scheduled',
    discountType: 'percentage',
    value: 40,
    maxDiscountCap: 2000,
    usageLimit: 300,
    perUserLimit: 1,
    oneTimeUse: true,
    usedCount: 0,
    uniqueUsers: 0,
    startDate: '2026-05-01T00:00:00Z',
    endDate: '2026-07-31T23:59:59Z',
    scheduledActivation: '2026-05-01T08:00:00Z',
    eligibility: {
      targetAudience: 'all',
      triggerEvent: 'inactivity',
    },
    restrictions: { stackable: false },
    variant: 'conditional',
    createdAt: '2026-04-01T09:00:00Z',
    createdBy: 'Admin User',
    tags: ['win-back', 'retention'],
  },
  {
    id: 'c7',
    code: 'SUMMER25',
    description: 'Summer sale — 25% off on all plans',
    status: 'inactive',
    discountType: 'percentage',
    value: 25,
    maxDiscountCap: 1200,
    usageLimit: 2000,
    perUserLimit: 1,
    oneTimeUse: true,
    usedCount: 312,
    uniqueUsers: 312,
    startDate: '2025-06-01T00:00:00Z',
    endDate: '2025-08-31T23:59:59Z',
    eligibility: { targetAudience: 'all' },
    restrictions: { stackable: false, countries: ['IN'] },
    variant: 'standard',
    createdAt: '2025-05-20T09:00:00Z',
    createdBy: 'Admin User',
    tags: ['seasonal', 'sale'],
  },
  {
    id: 'c8',
    code: 'MILESTONE100',
    description: 'Reward coupon for solving 100 problems — free month',
    status: 'active',
    discountType: 'free_access',
    value: 30,
    usageLimit: 0,
    perUserLimit: 1,
    oneTimeUse: true,
    usedCount: 89,
    uniqueUsers: 89,
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
    eligibility: {
      targetAudience: 'all',
      triggerEvent: 'milestone',
      minimumCondition: 'submission',
      minimumValue: 100,
    },
    restrictions: { stackable: true },
    variant: 'conditional',
    createdAt: '2025-12-01T08:00:00Z',
    createdBy: 'System',
    tags: ['milestone', 'gamification'],
  },
  {
    id: 'c9',
    code: 'ENTERPRISE15',
    description: '15% off for enterprise accounts — annual only',
    status: 'active',
    discountType: 'percentage',
    value: 15,
    maxDiscountCap: 5000,
    usageLimit: 50,
    perUserLimit: 2,
    oneTimeUse: false,
    usedCount: 12,
    uniqueUsers: 10,
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
    eligibility: {
      targetAudience: 'role_based',
      userRoles: ['enterprise'],
    },
    restrictions: { stackable: false },
    variant: 'tier',
    tier: 'enterprise',
    createdAt: '2025-12-20T10:00:00Z',
    createdBy: 'Admin User',
    tags: ['enterprise', 'b2b'],
  },
  {
    id: 'c10',
    code: 'FLASHSALE70',
    description: '70% off — 24-hour flash sale (expired)',
    status: 'expired',
    discountType: 'percentage',
    value: 70,
    maxDiscountCap: 3000,
    usageLimit: 100,
    perUserLimit: 1,
    oneTimeUse: true,
    usedCount: 100,
    uniqueUsers: 98,
    startDate: '2026-03-10T10:00:00Z',
    endDate: '2026-03-11T10:00:00Z',
    eligibility: { targetAudience: 'all' },
    restrictions: { stackable: false, timeWindow: { start: '10:00', end: '22:00' } },
    variant: 'standard',
    createdAt: '2026-03-09T08:00:00Z',
    createdBy: 'Admin User',
    tags: ['flash', 'sale'],
  },
];

// ─── Mock Usage Logs ─────────────────────────────────────────────────────────

export const mockUsageLogs: CouponUsage[] = [
  { id: 'u1', couponId: 'c1', userId: 'usr1', userName: 'Priya Mehta', userEmail: 'priya@email.com', userRole: 'premium', timestamp: '2026-04-10T14:32:00Z', discountApplied: 240, context: 'Annual plan upgrade', orderId: 'ORD-8821', suspicious: false, device: 'desktop', country: 'IN', ipAddress: '103.21.44.0' },
  { id: 'u2', couponId: 'c1', userId: 'usr2', userName: 'Arjun Singh', userEmail: 'arjun@email.com', userRole: 'basic', timestamp: '2026-04-10T11:18:00Z', discountApplied: 198, context: 'Monthly plan upgrade', orderId: 'ORD-8819', suspicious: false, device: 'mobile', country: 'IN', ipAddress: '59.91.22.1' },
  { id: 'u3', couponId: 'c1', userId: 'usr3', userName: 'Sara Lee', userEmail: 'sara@email.com', userRole: 'basic', timestamp: '2026-04-09T09:45:00Z', discountApplied: 500, context: 'Annual plan upgrade', orderId: 'ORD-8810', suspicious: false, device: 'desktop', country: 'US', ipAddress: '72.21.198.66' },
  { id: 'u4', couponId: 'c1', userId: 'usr4', userName: 'Viktor Petrov', userEmail: 'viktor@email.com', userRole: 'basic', timestamp: '2026-04-08T22:03:00Z', discountApplied: 500, context: 'Annual plan upgrade', orderId: 'ORD-8791', suspicious: true, flagReason: 'Multiple accounts from same IP (3 uses in 2 hours)', device: 'desktop', country: 'RU', ipAddress: '5.8.37.1' },
  { id: 'u5', couponId: 'c1', userId: 'usr5', userName: 'Kenji Tanaka', userEmail: 'kenji@email.com', userRole: 'premium', timestamp: '2026-04-08T17:22:00Z', discountApplied: 320, context: 'Monthly plan upgrade', orderId: 'ORD-8782', suspicious: false, device: 'tablet', country: 'JP', ipAddress: '203.0.113.22' },
  { id: 'u6', couponId: 'c2', userId: 'usr6', userName: 'Aisha Noor', userEmail: 'aisha@email.com', userRole: 'basic', timestamp: '2026-04-10T16:12:00Z', discountApplied: 500, context: 'First premium upgrade — new user', orderId: 'ORD-8823', suspicious: false, device: 'mobile', country: 'IN', ipAddress: '49.36.81.2' },
  { id: 'u7', couponId: 'c2', userId: 'usr7', userName: 'Lucas Müller', userEmail: 'lucas@email.com', userRole: 'basic', timestamp: '2026-04-09T13:41:00Z', discountApplied: 500, context: 'First premium upgrade — new user', orderId: 'ORD-8815', suspicious: false, device: 'desktop', country: 'DE', ipAddress: '193.0.14.129' },
  { id: 'u8', couponId: 'c3', userId: 'usr8', userName: 'Jane Smith', userEmail: 'jane@email.com', userRole: 'premium', timestamp: '2026-04-10T10:30:00Z', discountApplied: 900, context: 'Annual premium plan renewal', orderId: 'ORD-8818', suspicious: false, device: 'desktop', country: 'IN', ipAddress: '103.21.48.9' },
  { id: 'u9', couponId: 'c4', userId: 'usr9', userName: 'Mike Johnson', userEmail: 'mike@email.com', userRole: 'basic', timestamp: '2026-04-07T08:55:00Z', discountApplied: 250, context: 'Referral signup — monthly plan', orderId: 'ORD-8775', suspicious: false, device: 'mobile', country: 'US', ipAddress: '8.8.8.8' },
  { id: 'u10', couponId: 'c1', userId: 'usr10', userName: 'Elena Popescu', userEmail: 'elena@email.com', userRole: 'basic', timestamp: '2026-04-07T19:08:00Z', discountApplied: 400, context: 'Annual plan upgrade', orderId: 'ORD-8779', suspicious: true, flagReason: 'Repeated failed redemption attempts before success (5 tries)', device: 'desktop', country: 'RO', ipAddress: '89.122.41.0' },
  { id: 'u11', couponId: 'c5', userId: 'usr11', userName: 'Rahul Gupta', userEmail: 'rahul@email.com', userRole: 'basic', timestamp: '2026-04-06T12:18:00Z', discountApplied: 0, context: 'Free 7-day access unlock on signup', suspicious: false, device: 'mobile', country: 'IN', ipAddress: '103.22.50.1' },
  { id: 'u12', couponId: 'c8', userId: 'usr12', userName: 'Alice Brown', userEmail: 'alice@email.com', userRole: 'premium', timestamp: '2026-04-05T15:44:00Z', discountApplied: 0, context: 'Milestone: 100 problems solved — 30-day access', suspicious: false, device: 'desktop', country: 'IN', ipAddress: '103.21.44.22' },
];

// ─── Usage Trend Data (per coupon) ───────────────────────────────────────────

export const getUsageTrendData = (couponId: string): UsageTrend[] => {
  const base: Record<string, number[]> = {
    c1: [12, 28, 45, 67, 89, 102, 118, 132, 148, 162, 178, 189, 204, 221],
    c2: [34, 67, 112, 145, 189, 234, 278, 312, 356, 389, 423, 456, 489, 512],
    c3: [0, 5, 18, 34, 52, 78, 99, 120, 145, 158, 170, 181, 186, 189],
    c10: [0, 12, 34, 56, 78, 92, 100, 100, 100, 100, 100, 100, 100, 100],
  };

  const values = base[couponId] ?? Array.from({ length: 14 }, (_, i) => Math.floor(Math.random() * 20 + i * 3));

  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date('2026-03-29');
    d.setDate(d.getDate() + i);
    return { date: d.toISOString().split('T')[0], uses: values[i] ?? 0 };
  });
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
    case 'active': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    case 'inactive': return 'text-slate-500 bg-slate-50 border-slate-200';
    case 'scheduled': return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'expired': return 'text-red-500 bg-red-50 border-red-200';
    default: return 'text-slate-500 bg-slate-50 border-slate-200';
  }
};

export const getVariantColor = (variant: CouponVariant): string => {
  switch (variant) {
    case 'referral': return 'text-purple-600 bg-purple-50 border-purple-200';
    case 'bulk': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'conditional': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'tier': return 'text-indigo-600 bg-indigo-50 border-indigo-200';
    default: return 'text-slate-600 bg-slate-50 border-slate-200';
  }
};

export const generateCouponCode = (prefix?: string): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const suffix = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return prefix ? `${prefix.toUpperCase()}_${suffix}` : suffix;
};
