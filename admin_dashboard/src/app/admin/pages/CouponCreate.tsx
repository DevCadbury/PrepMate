import { useState } from 'react';
import type { ReactNode, ElementType } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Info,
  Plus,
  X,
  Percent,
  DollarSign,
  Gift,
  Users,
  UserCheck,
  Shield,
  Globe,
  Clock,
  Smartphone,
  Monitor,
  Tablet,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { Switch } from '../../components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/tooltip';
import { toast } from 'sonner';
import {
  DiscountType,
  CouponStatus,
  CouponVariant,
  TargetAudience,
  generateCouponCode,
} from '../data/couponData';
import { cn } from '../../lib/utils';

// ─── Section wrapper ───────────────────────────────────────────────────────

interface SectionProps {
  title: string;
  description: string;
  children: ReactNode;
  badge?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

function FormSection({ title, description, children, badge, collapsible = false, defaultOpen = true }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        className={cn(
          'w-full flex items-center justify-between px-5 py-4 text-left',
          collapsible && 'cursor-pointer hover:bg-muted/30 transition-colors'
        )}
        onClick={() => collapsible && setOpen((p) => !p)}
      >
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm text-foreground">{title}</h3>
            {badge && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {badge}
              </span>
            )}
          </div>
          <p className="text-[12px] text-muted-foreground mt-0.5">{description}</p>
        </div>
        {collapsible && (
          <span className="text-muted-foreground shrink-0 ml-4">
            {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </span>
        )}
      </button>
      {(!collapsible || open) && (
        <>
          <Separator />
          <div className="px-5 py-5">{children}</div>
        </>
      )}
    </div>
  );
}

// ─── Field helpers ─────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  required,
  children,
  inline,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  inline?: boolean;
}) {
  return (
    <div className={cn('space-y-1.5', inline && 'flex items-center gap-3 space-y-0')}>
      <div className={cn('flex items-center gap-1.5', inline && 'shrink-0 w-40')}>
        <label className="text-[13px] text-muted-foreground">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </label>
        {hint && (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="size-3 text-muted-foreground/60 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[220px] text-xs">{hint}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

const discountTypes: { value: DiscountType; label: string; icon: ElementType; desc: string }[] = [
  { value: 'percentage', label: 'Percentage', icon: Percent, desc: 'e.g. 20% off' },
  { value: 'fixed', label: 'Fixed amount', icon: DollarSign, desc: 'e.g. ₹500 off' },
  { value: 'free_access', label: 'Free access', icon: Gift, desc: 'Days of access' },
];

const audienceOptions: { value: TargetAudience; label: string; desc: string; icon: ElementType }[] = [
  { value: 'all', label: 'All users', desc: 'Any registered user', icon: Users },
  { value: 'new_users', label: 'New users', desc: 'Joined within 7 days', icon: UserCheck },
  { value: 'specific_users', label: 'Specific users', desc: 'By user ID or email', icon: Shield },
  { value: 'role_based', label: 'By role', desc: 'Based on account tier', icon: Shield },
];

// ─── Main component ────────────────────────────────────────────────────────

interface FormState {
  // Basic
  code: string;
  description: string;
  status: CouponStatus;
  variant: CouponVariant;
  // Discount
  discountType: DiscountType;
  value: string;
  maxDiscountCap: string;
  // Usage
  usageLimit: string;
  perUserLimit: string;
  oneTimeUse: boolean;
  // Validity
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  scheduledActivation: boolean;
  // Eligibility
  targetAudience: TargetAudience;
  specificUsers: string;
  userRoles: string[];
  minimumCondition: string;
  minimumValue: string;
  triggerEvent: string;
  // Restrictions
  stackable: boolean;
  countries: string;
  devices: string[];
  timeWindowEnabled: boolean;
  timeWindowStart: string;
  timeWindowEnd: string;
  // Advanced
  prefix: string;
  tier: string;
  referralUser: string;
}

const initialForm: FormState = {
  code: '',
  description: '',
  status: 'active',
  variant: 'standard',
  discountType: 'percentage',
  value: '',
  maxDiscountCap: '',
  usageLimit: '',
  perUserLimit: '1',
  oneTimeUse: true,
  startDate: new Date().toISOString().split('T')[0],
  startTime: '00:00',
  endDate: '',
  endTime: '23:59',
  scheduledActivation: false,
  targetAudience: 'all',
  specificUsers: '',
  userRoles: [],
  minimumCondition: 'none',
  minimumValue: '',
  triggerEvent: 'manual',
  stackable: false,
  countries: '',
  devices: [],
  timeWindowEnabled: false,
  timeWindowStart: '09:00',
  timeWindowEnd: '23:00',
  prefix: '',
  tier: '',
  referralUser: '',
};

export default function CouponCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(initialForm);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof FormState, value: unknown) =>
    setForm((p) => ({ ...p, [key]: value }));

  const toggleRole = (role: string) =>
    set('userRoles', form.userRoles.includes(role)
      ? form.userRoles.filter((r) => r !== role)
      : [...form.userRoles, role]
    );

  const toggleDevice = (device: string) =>
    set('devices', form.devices.includes(device)
      ? form.devices.filter((d) => d !== device)
      : [...form.devices, device]
    );

  const autoGenerate = () => set('code', generateCouponCode(form.prefix || undefined));

  const validate = (): string | null => {
    if (!form.code.trim()) return 'Coupon code is required';
    if (!form.value) return 'Discount value is required';
    if (!form.endDate) return 'Expiry date is required';
    if (form.discountType === 'percentage' && (Number(form.value) < 1 || Number(form.value) > 100)) {
      return 'Percentage must be between 1 and 100';
    }
    return null;
  };

  const handleSubmit = async (asDraft = false) => {
    const err = validate();
    if (err) { toast.error(err); return; }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    toast.success(asDraft ? 'Draft saved' : `Coupon "${form.code}" created successfully`);
    navigate('/admin/coupons');
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="size-8" onClick={() => navigate('/admin/coupons')}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-foreground">Create Coupon</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Configure discount rules, eligibility, and restrictions
          </p>
        </div>
      </div>

      {/* ─── 1. Basic Details ─────────────────────────────────────────────── */}
      <FormSection title="Basic Details" description="Code identifier, purpose, and lifecycle status">
        <div className="space-y-4">
          {/* Code */}
          <Field label="Coupon code" required hint="Unique code users enter at checkout. Case-insensitive.">
            <div className="flex gap-2">
              <Input
                value={form.code}
                onChange={(e) => set('code', e.target.value.toUpperCase().replace(/\s/g, ''))}
                placeholder="e.g. PREP20"
                className="font-mono h-8 text-[13px] flex-1 tracking-wider"
                maxLength={24}
              />
              <Button type="button" variant="outline" size="sm" className="shrink-0 h-8 text-[13px] gap-1.5" onClick={autoGenerate}>
                <RefreshCw className="size-3" /> Generate
              </Button>
            </div>
            {form.prefix && (
              <p className="text-[11px] text-muted-foreground mt-1">Using prefix: <span className="font-mono">{form.prefix}</span></p>
            )}
          </Field>

          {/* Description */}
          <Field label="Internal description" hint="Visible only to admins. Explain the campaign purpose.">
            <Textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="e.g. Summer sale — 20% off for Q2 campaign targeting all users"
              className="text-[13px] min-h-[72px] resize-none"
            />
          </Field>

          {/* Status + Variant */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger className="h-8 text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Variant" hint="Referral = per-user. Conditional = trigger-based. Tier = role-restricted.">
              <Select value={form.variant} onValueChange={(v) => set('variant', v as CouponVariant)}>
                <SelectTrigger className="h-8 text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="conditional">Conditional</SelectItem>
                  <SelectItem value="tier">Tier-based</SelectItem>
                  <SelectItem value="bulk">Bulk</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </div>
      </FormSection>

      {/* ─── 2. Discount Configuration ───────────────────────────────────── */}
      <FormSection title="Discount Configuration" description="Define the value and type of discount this coupon applies">
        <div className="space-y-4">
          {/* Type selector */}
          <Field label="Discount type" required>
            <div className="grid grid-cols-3 gap-2">
              {discountTypes.map(({ value, label, icon: Icon, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set('discountType', value)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-all',
                    form.discountType === value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  )}
                >
                  <Icon className="size-4" />
                  <span className="text-[12px]">{label}</span>
                  <span className="text-[10px] opacity-70">{desc}</span>
                </button>
              ))}
            </div>
          </Field>

          {/* Value */}
          <div className="grid grid-cols-2 gap-3">
            <Field
              label={
                form.discountType === 'percentage' ? 'Discount (%)' :
                form.discountType === 'fixed' ? 'Amount (₹)' : 'Days of access'
              }
              required
            >
              <div className="relative">
                <Input
                  type="number"
                  min={1}
                  max={form.discountType === 'percentage' ? 100 : undefined}
                  value={form.value}
                  onChange={(e) => set('value', e.target.value)}
                  placeholder={form.discountType === 'percentage' ? '20' : form.discountType === 'fixed' ? '500' : '7'}
                  className="h-8 text-[13px] pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-muted-foreground">
                  {form.discountType === 'percentage' ? '%' : form.discountType === 'fixed' ? '₹' : 'd'}
                </span>
              </div>
            </Field>

            {form.discountType === 'percentage' && (
              <Field label="Max discount cap (₹)" hint="Caps the maximum discount for high-value plans">
                <Input
                  type="number"
                  min={1}
                  value={form.maxDiscountCap}
                  onChange={(e) => set('maxDiscountCap', e.target.value)}
                  placeholder="e.g. 1500"
                  className="h-8 text-[13px]"
                />
              </Field>
            )}
          </div>
        </div>
      </FormSection>

      {/* ─── 3. Usage Limits ─────────────────────────────────────────────── */}
      <FormSection title="Usage Limits" description="Control how many times this coupon can be redeemed">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Total redemption limit" hint="0 = unlimited. Set a cap to control campaign budget.">
              <Input
                type="number"
                min={0}
                value={form.usageLimit}
                onChange={(e) => set('usageLimit', e.target.value)}
                placeholder="e.g. 500 (0 = unlimited)"
                className="h-8 text-[13px]"
              />
            </Field>
            <Field label="Per-user limit" hint="Max times a single user can apply this coupon">
              <Input
                type="number"
                min={1}
                value={form.perUserLimit}
                onChange={(e) => set('perUserLimit', e.target.value)}
                placeholder="1"
                className="h-8 text-[13px]"
              />
            </Field>
          </div>

          {/* One-time toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
            <div>
              <p className="text-[13px] text-foreground">One-time use per user</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Prevents the same user from redeeming more than once
              </p>
            </div>
            <Switch
              checked={form.oneTimeUse}
              onCheckedChange={(v) => set('oneTimeUse', v)}
            />
          </div>
        </div>
      </FormSection>

      {/* ─── 4. Validity & Scheduling ────────────────────────────────────── */}
      <FormSection title="Validity & Scheduling" description="Set the active window and optional scheduled activation">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date" required>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => set('startDate', e.target.value)}
                className="h-8 text-[13px]"
              />
            </Field>
            <Field label="Start time">
              <Input
                type="time"
                value={form.startTime}
                onChange={(e) => set('startTime', e.target.value)}
                className="h-8 text-[13px]"
              />
            </Field>
            <Field label="Expiry date" required>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => set('endDate', e.target.value)}
                className="h-8 text-[13px]"
                min={form.startDate}
              />
            </Field>
            <Field label="Expiry time">
              <Input
                type="time"
                value={form.endTime}
                onChange={(e) => set('endTime', e.target.value)}
                className="h-8 text-[13px]"
              />
            </Field>
          </div>

          {/* Scheduled activation */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
            <div>
              <p className="text-[13px] text-foreground">Scheduled activation</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Auto-activate at start date even if status is set to inactive
              </p>
            </div>
            <Switch
              checked={form.scheduledActivation}
              onCheckedChange={(v) => set('scheduledActivation', v)}
            />
          </div>
        </div>
      </FormSection>

      {/* ─── 5. Eligibility Rules ────────────────────────────────────────── */}
      <FormSection
        title="Eligibility Rules"
        description="Control who can redeem this coupon and under what conditions"
        badge="Conditional logic"
        collapsible
      >
        <div className="space-y-4">
          {/* Target audience */}
          <Field label="Applicable to" required>
            <div className="grid grid-cols-2 gap-2">
              {audienceOptions.map(({ value, label, desc, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set('targetAudience', value)}
                  className={cn(
                    'flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all',
                    form.targetAudience === value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/30'
                  )}
                >
                  <Icon className={cn('size-3.5 shrink-0', form.targetAudience === value ? 'text-primary' : 'text-muted-foreground')} />
                  <div>
                    <p className={cn('text-[12px]', form.targetAudience === value ? 'text-primary' : 'text-foreground')}>{label}</p>
                    <p className="text-[10px] text-muted-foreground">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </Field>

          {/* Specific users input */}
          {form.targetAudience === 'specific_users' && (
            <Field label="User IDs / emails" hint="Comma-separated list of user emails or IDs">
              <Textarea
                value={form.specificUsers}
                onChange={(e) => set('specificUsers', e.target.value)}
                placeholder="user@email.com, another@email.com, usr_abc123…"
                className="text-[13px] min-h-[64px] resize-none font-mono text-xs"
              />
            </Field>
          )}

          {/* Role selector */}
          {form.targetAudience === 'role_based' && (
            <Field label="User roles">
              <div className="flex gap-2 flex-wrap">
                {['basic', 'premium', 'enterprise'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    className={cn(
                      'text-[12px] px-3 py-1 rounded-full border transition-all capitalize',
                      form.userRoles.includes(role)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:border-primary/40'
                    )}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </Field>
          )}

          {/* Min condition */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Minimum condition" hint="Require a prerequisite action before the coupon is valid">
              <Select value={form.minimumCondition} onValueChange={(v) => set('minimumCondition', v)}>
                <SelectTrigger className="h-8 text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="purchase">Minimum purchase</SelectItem>
                  <SelectItem value="submission">Problem submissions</SelectItem>
                  <SelectItem value="upgrade">Plan upgrade</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {form.minimumCondition !== 'none' && (
              <Field label="Minimum value">
                <Input
                  type="number"
                  min={1}
                  value={form.minimumValue}
                  onChange={(e) => set('minimumValue', e.target.value)}
                  placeholder={form.minimumCondition === 'submission' ? 'e.g. 100 problems' : 'e.g. ₹999'}
                  className="h-8 text-[13px]"
                />
              </Field>
            )}
          </div>

          {/* Trigger event */}
          <Field label="Trigger event" hint="Conditional coupons can be issued automatically on specific events">
            <Select value={form.triggerEvent} onValueChange={(v) => set('triggerEvent', v)}>
              <SelectTrigger className="h-8 text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual distribution</SelectItem>
                <SelectItem value="signup">After signup</SelectItem>
                <SelectItem value="inactivity">After 60-day inactivity</SelectItem>
                <SelectItem value="milestone">After coding milestone</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </FormSection>

      {/* ─── 6. Restrictions & Advanced ─────────────────────────────────── */}
      <FormSection
        title="Restrictions & Advanced"
        description="Prevent abuse and limit usage by geography, device, or time window"
        collapsible
        defaultOpen={false}
      >
        <div className="space-y-4">
          {/* Stackable toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
            <div>
              <p className="text-[13px] text-foreground">Allow stacking</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Users can combine this with other active coupons
              </p>
            </div>
            <Switch
              checked={form.stackable}
              onCheckedChange={(v) => set('stackable', v)}
            />
          </div>

          {/* Countries */}
          <Field label="Allowed countries (ISO codes)" hint="Leave empty to allow all countries. e.g. IN, US, GB">
            <Input
              value={form.countries}
              onChange={(e) => set('countries', e.target.value.toUpperCase())}
              placeholder="IN, US, GB, DE…"
              className="h-8 text-[13px] font-mono"
            />
          </Field>

          {/* Device filter */}
          <Field label="Allowed devices" hint="Restrict to specific device types">
            <div className="flex gap-2">
              {[
                { value: 'desktop', label: 'Desktop', icon: Monitor },
                { value: 'mobile', label: 'Mobile', icon: Smartphone },
                { value: 'tablet', label: 'Tablet', icon: Tablet },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleDevice(value)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] transition-all',
                    form.devices.includes(value)
                      ? 'bg-primary/10 border-primary/30 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/30'
                  )}
                >
                  <Icon className="size-3.5" /> {label}
                </button>
              ))}
              {form.devices.length > 0 && (
                <button
                  type="button"
                  onClick={() => set('devices', [])}
                  className="text-[11px] text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
            {form.devices.length === 0 && (
              <p className="text-[11px] text-muted-foreground mt-1">No restriction (all devices)</p>
            )}
          </Field>

          {/* Time window */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
              <div>
                <p className="text-[13px] text-foreground">Time-of-day restriction</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Limit redemption to specific hours (IST)
                </p>
              </div>
              <Switch
                checked={form.timeWindowEnabled}
                onCheckedChange={(v) => set('timeWindowEnabled', v)}
              />
            </div>
            {form.timeWindowEnabled && (
              <div className="grid grid-cols-2 gap-3 pl-1">
                <Field label="Window start">
                  <Input
                    type="time"
                    value={form.timeWindowStart}
                    onChange={(e) => set('timeWindowStart', e.target.value)}
                    className="h-8 text-[13px]"
                  />
                </Field>
                <Field label="Window end">
                  <Input
                    type="time"
                    value={form.timeWindowEnd}
                    onChange={(e) => set('timeWindowEnd', e.target.value)}
                    className="h-8 text-[13px]"
                  />
                </Field>
              </div>
            )}
          </div>

          {/* Code prefix (for bulk) */}
          {form.variant === 'bulk' && (
            <Field label="Bulk code prefix" hint="All generated codes will use this prefix">
              <Input
                value={form.prefix}
                onChange={(e) => set('prefix', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="e.g. BATCH24"
                className="h-8 text-[13px] font-mono"
                maxLength={8}
              />
            </Field>
          )}

          {/* Referral user */}
          {form.variant === 'referral' && (
            <Field label="Referral user ID" hint="This coupon is tied to a specific user's referral link">
              <Input
                value={form.referralUser}
                onChange={(e) => set('referralUser', e.target.value)}
                placeholder="User ID or email"
                className="h-8 text-[13px]"
              />
            </Field>
          )}

          {/* Tier */}
          {form.variant === 'tier' && (
            <Field label="Target tier" hint="Only users on this plan tier can redeem">
              <Select value={form.tier} onValueChange={(v) => set('tier', v)}>
                <SelectTrigger className="h-8 text-[13px]">
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}
        </div>
      </FormSection>

      {/* ─── Form footer ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pb-8">
        <Button
          variant="ghost"
          size="sm"
          className="text-[13px]"
          onClick={() => navigate('/admin/coupons')}
        >
          Cancel
        </Button>
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          className="text-[13px]"
          onClick={() => handleSubmit(true)}
          disabled={saving}
        >
          Save as draft
        </Button>
        <Button
          size="sm"
          className="text-[13px] gap-1.5 min-w-[140px]"
          onClick={() => handleSubmit(false)}
          disabled={saving}
        >
          {saving ? (
            <><RefreshCw className="size-3.5 animate-spin" /> Creating…</>
          ) : (
            <><CheckCircle2 className="size-3.5" /> Create Coupon</>
          )}
        </Button>
      </div>
    </div>
  );
}