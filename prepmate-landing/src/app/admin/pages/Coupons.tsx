import { useState, useMemo } from 'react';
import type { ElementType } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  MoreHorizontal,
  Copy,
  Trash2,
  Edit,
  Power,
  PowerOff,
  ChevronRight,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3,
  Tag,
  Users,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Separator } from '../../components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/tooltip';
import { toast } from 'sonner';
import {
  Coupon,
  CouponStatus,
  CouponVariant,
  mockCoupons,
  mockUsageLogs,
  formatDiscountValue,
  getUsagePercent,
  isNearLimit,
  getCouponStatusColor,
  getVariantColor,
  generateCouponCode,
} from '../data/couponData';
import CouponDetailsDrawer from '../components/coupons/CouponDetailsDrawer';
import { cn } from '../../lib/utils';

const StatCard = ({
  label,
  value,
  icon: Icon,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  icon: ElementType;
  sub?: string;
  accent?: string;
}) => (
  <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
    <div className={cn('size-9 rounded-lg flex items-center justify-center shrink-0', accent ?? 'bg-primary/10')}>
      <Icon className={cn('size-4', accent ? 'text-white' : 'text-primary')} />
    </div>
    <div>
      <p className="text-[12px] text-muted-foreground">{label}</p>
      <p className="text-xl text-foreground mt-0.5">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  </div>
);

const statusOptions: { value: CouponStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'expired', label: 'Expired' },
];

const variantOptions: { value: CouponVariant | 'all'; label: string }[] = [
  { value: 'all', label: 'All types' },
  { value: 'standard', label: 'Standard' },
  { value: 'referral', label: 'Referral' },
  { value: 'conditional', label: 'Conditional' },
  { value: 'tier', label: 'Tier-based' },
  { value: 'bulk', label: 'Bulk' },
];

export default function CouponsPage() {
  const navigate = useNavigate();

  const [coupons, setCoupons] = useState<Coupon[]>(mockCoupons);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CouponStatus | 'all'>('all');
  const [variantFilter, setVariantFilter] = useState<CouponVariant | 'all'>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'usedCount' | 'endDate'>('createdAt');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
  const [toggleTarget, setToggleTarget] = useState<Coupon | null>(null);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkPrefix, setBulkPrefix] = useState('PREP');
  const [bulkCount, setBulkCount] = useState(10);

  // ─── Derived stats ───────────────────────────────────────────────────────

  const totalActive = coupons.filter((c) => c.status === 'active').length;
  const totalScheduled = coupons.filter((c) => c.status === 'scheduled').length;
  const totalRedemptions = coupons.reduce((acc, c) => acc + c.usedCount, 0);
  const suspiciousCount = mockUsageLogs.filter((l) => l.suspicious).length;

  // ─── Filtered & sorted coupons ───────────────────────────────────────────

  const filtered = useMemo(() => {
    let result = [...coupons];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) => c.code.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') result = result.filter((c) => c.status === statusFilter);
    if (variantFilter !== 'all') result = result.filter((c) => c.variant === variantFilter);
    result.sort((a, b) => {
      if (sortBy === 'usedCount') return b.usedCount - a.usedCount;
      if (sortBy === 'endDate') return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return result;
  }, [coupons, search, statusFilter, variantFilter, sortBy]);

  // ─── Actions ─────────────────────────────────────────────────────────────

  const handleOpenDrawer = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setDrawerOpen(true);
  };

  const handleToggleStatus = (coupon: Coupon) => {
    const isActive = coupon.status === 'active';
    if (isActive) {
      setToggleTarget(coupon);
    } else {
      applyToggle(coupon);
    }
  };

  const applyToggle = (coupon: Coupon) => {
    setCoupons((prev) =>
      prev.map((c) =>
        c.id === coupon.id
          ? { ...c, status: c.status === 'active' ? 'inactive' : 'active' }
          : c
      )
    );
    const newStatus = coupon.status === 'active' ? 'inactive' : 'active';
    toast.success(`Coupon "${coupon.code}" ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
    setToggleTarget(null);
  };

  const handleDelete = (coupon: Coupon) => setDeleteTarget(coupon);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setCoupons((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    toast.success(`Coupon "${deleteTarget.code}" deleted`);
    setDeleteTarget(null);
  };

  const handleDuplicate = (coupon: Coupon) => {
    const code = generateCouponCode(coupon.code.split('_')[0]);
    const newCoupon: Coupon = {
      ...coupon,
      id: `c${Date.now()}`,
      code,
      status: 'inactive',
      usedCount: 0,
      uniqueUsers: 0,
      createdAt: new Date().toISOString(),
      description: `[Copy] ${coupon.description}`,
    };
    setCoupons((prev) => [newCoupon, ...prev]);
    toast.success(`Duplicated as "${code}"`);
  };

  const handleBulkGenerate = () => {
    const newCoupons: Coupon[] = Array.from({ length: bulkCount }, (_, i) => ({
      id: `c${Date.now()}_${i}`,
      code: generateCouponCode(bulkPrefix),
      description: `Bulk-generated coupon — ${bulkPrefix} batch`,
      status: 'inactive' as const,
      discountType: 'percentage' as const,
      value: 10,
      usageLimit: 1,
      perUserLimit: 1,
      oneTimeUse: true,
      usedCount: 0,
      uniqueUsers: 0,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      eligibility: { targetAudience: 'all' as const },
      restrictions: { stackable: false },
      variant: 'bulk' as const,
      prefix: bulkPrefix,
      createdAt: new Date().toISOString(),
      createdBy: 'Admin User',
    }));
    setCoupons((prev) => [...newCoupons, ...prev]);
    toast.success(`${bulkCount} coupons generated with prefix "${bulkPrefix}"`);
    setBulkDialogOpen(false);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-foreground">Coupon Management</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Create, configure, and track discount coupons across the platform
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="text-[13px] gap-1.5" onClick={() => setBulkDialogOpen(true)}>
            <Zap className="size-3.5" /> Bulk Generate
          </Button>
          <Button size="sm" className="text-[13px] gap-1.5" onClick={() => navigate('/admin/coupons/create')}>
            <Plus className="size-3.5" /> Create Coupon
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Coupons" value={coupons.length} icon={Tag} sub={`${totalActive} active`} />
        <StatCard label="Active / Scheduled" value={`${totalActive} / ${totalScheduled}`} icon={CheckCircle2} />
        <StatCard label="Total Redemptions" value={totalRedemptions.toLocaleString()} icon={TrendingUp} sub="All time" />
        <StatCard
          label="Suspicious Flags"
          value={suspiciousCount}
          icon={AlertTriangle}
          sub="Review usage logs"
          accent={suspiciousCount > 0 ? 'bg-amber-500' : undefined}
        />
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search code or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-[13px]"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="h-8 w-[130px] text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={variantFilter} onValueChange={(v) => setVariantFilter(v as typeof variantFilter)}>
          <SelectTrigger className="h-8 w-[140px] text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {variantOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="h-8 w-[140px] text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Newest first</SelectItem>
            <SelectItem value="usedCount">Most used</SelectItem>
            <SelectItem value="endDate">Expiring soon</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <span className="text-[12px] text-muted-foreground">{filtered.length} coupon{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-[12px] pl-4 w-[160px]">Code</TableHead>
              <TableHead className="text-[12px]">Type</TableHead>
              <TableHead className="text-[12px]">Discount</TableHead>
              <TableHead className="text-[12px]">Status</TableHead>
              <TableHead className="text-[12px]">Usage</TableHead>
              <TableHead className="text-[12px]">Validity</TableHead>
              <TableHead className="text-[12px]">Created</TableHead>
              <TableHead className="text-[12px] w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-14 text-[13px] text-muted-foreground">
                  No coupons match your filters
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((coupon) => {
                const pct = getUsagePercent(coupon);
                const near = isNearLimit(coupon);

                return (
                  <TableRow
                    key={coupon.id}
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => handleOpenDrawer(coupon)}
                  >
                    {/* Code */}
                    <TableCell className="pl-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[13px] text-foreground tracking-wide">{coupon.code}</span>
                        <button
                          className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(coupon.code);
                            toast.success('Copied!');
                          }}
                        >
                          <Copy className="size-3" />
                        </button>
                      </div>
                      {coupon.tags && coupon.tags.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {coupon.tags.slice(0, 2).map((t) => (
                            <span key={t} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0 rounded-full">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </TableCell>

                    {/* Type / Variant */}
                    <TableCell className="py-3">
                      <span className={cn('text-[11px] px-2 py-0.5 rounded-full border', getVariantColor(coupon.variant))}>
                        {coupon.variant.charAt(0).toUpperCase() + coupon.variant.slice(1)}
                      </span>
                    </TableCell>

                    {/* Discount */}
                    <TableCell className="py-3">
                      <span className="text-[13px] text-foreground">{formatDiscountValue(coupon)}</span>
                      {coupon.maxDiscountCap && (
                        <p className="text-[11px] text-muted-foreground">cap ₹{coupon.maxDiscountCap.toLocaleString()}</p>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell className="py-3">
                      <span className={cn('text-[11px] px-2 py-0.5 rounded-full border', getCouponStatusColor(coupon.status))}>
                        {coupon.status.charAt(0).toUpperCase() + coupon.status.slice(1)}
                      </span>
                    </TableCell>

                    {/* Usage */}
                    <TableCell className="py-3 min-w-[140px]">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[12px] text-foreground">
                            {coupon.usedCount.toLocaleString()}
                            {coupon.usageLimit > 0 && ` / ${coupon.usageLimit.toLocaleString()}`}
                          </span>
                          {coupon.usageLimit === 0 ? (
                            <span className="text-[10px] text-muted-foreground">unlimited</span>
                          ) : near ? (
                            <span className="flex items-center gap-0.5 text-[10px] text-amber-600">
                              <AlertTriangle className="size-2.5" /> {pct}%
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">{pct}%</span>
                          )}
                        </div>
                        {coupon.usageLimit > 0 && (
                          <Progress
                            value={pct}
                            className={cn('h-1.5', near && '[&>div]:bg-amber-500')}
                          />
                        )}
                      </div>
                    </TableCell>

                    {/* Validity */}
                    <TableCell className="py-3">
                      <p className="text-[12px] text-foreground">
                        {new Date(coupon.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                        <Clock className="size-2.5" />
                        {new Date(coupon.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </p>
                    </TableCell>

                    {/* Created */}
                    <TableCell className="py-3">
                      <p className="text-[12px] text-muted-foreground">
                        {new Date(coupon.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{coupon.createdBy}</p>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="py-3" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-7">
                            <MoreHorizontal className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => navigate(`/admin/coupons/${coupon.id}`)}>
                            <BarChart3 className="size-3.5 mr-2" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate('/admin/coupons/create')}>
                            <Edit className="size-3.5 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(coupon)}>
                            <Copy className="size-3.5 mr-2" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleToggleStatus(coupon)}>
                            {coupon.status === 'active' ? (
                              <><PowerOff className="size-3.5 mr-2" /> Deactivate</>
                            ) : (
                              <><Power className="size-3.5 mr-2" /> Activate</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDelete(coupon)}
                          >
                            <Trash2 className="size-3.5 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ─── Details Drawer ─────────────────────────────────────────────────── */}
      <CouponDetailsDrawer
        coupon={selectedCoupon}
        usageLogs={mockUsageLogs}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onEdit={() => navigate('/admin/coupons/create')}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDelete}
      />

      {/* ─── Deactivate confirm dialog ──────────────────────────────────────── */}
      <AlertDialog open={!!toggleTarget} onOpenChange={(o) => !o && setToggleTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate coupon?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-mono">{toggleTarget?.code}</span> will stop accepting new redemptions
              immediately. Existing redemptions are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => toggleTarget && applyToggle(toggleTarget)}>
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Delete confirm dialog ──────────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete coupon?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-mono">{deleteTarget?.code}</span> will be permanently removed.
              Usage history will be retained in the logs. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Delete coupon
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Bulk generate dialog ────────────────────────────────────────────── */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Bulk Generate Coupons</DialogTitle>
            <DialogDescription>
              Generate multiple unique coupon codes with a shared prefix.
              All codes are created as inactive — activate when ready.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-[13px] text-muted-foreground">Code prefix</label>
              <Input
                value={bulkPrefix}
                onChange={(e) => setBulkPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="e.g. PREP"
                className="font-mono text-[13px] h-8"
                maxLength={8}
              />
              <p className="text-[11px] text-muted-foreground">Codes will look like: {bulkPrefix || 'PREFIX'}_A1B2C3</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] text-muted-foreground">Number of coupons</label>
              <Input
                type="number"
                min={1}
                max={500}
                value={bulkCount}
                onChange={(e) => setBulkCount(Math.min(500, Math.max(1, parseInt(e.target.value) || 1)))}
                className="h-8 text-[13px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setBulkDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleBulkGenerate} disabled={!bulkPrefix}>
              Generate {bulkCount} codes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}