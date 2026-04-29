import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../components/ui/tooltip';
import {
  AlertTriangle,
  Search,
  Download,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  CheckCircle2,
} from 'lucide-react';
import { CouponUsage } from '../../data/couponData';
import { cn } from '../../../lib/utils';
import { toast } from 'sonner';

interface UsageLogsTableProps {
  logs: CouponUsage[];
  showCouponId?: boolean;
  compact?: boolean;
}

const DeviceIcon = ({ device }: { device: string }) => {
  if (device === 'mobile') return <Smartphone className="size-3.5" />;
  if (device === 'tablet') return <Tablet className="size-3.5" />;
  return <Monitor className="size-3.5" />;
};

export default function UsageLogsTable({ logs, showCouponId = false, compact = false }: UsageLogsTableProps) {
  const [search, setSearch] = useState('');
  const [flagFilter, setFlagFilter] = useState<'all' | 'suspicious' | 'clean'>('all');
  const [dateFilter, setDateFilter] = useState('all');

  const filtered = useMemo(() => {
    let result = [...logs];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.userName.toLowerCase().includes(q) ||
          l.userEmail.toLowerCase().includes(q) ||
          l.context.toLowerCase().includes(q) ||
          l.country.toLowerCase().includes(q)
      );
    }

    if (flagFilter === 'suspicious') result = result.filter((l) => l.suspicious);
    if (flagFilter === 'clean') result = result.filter((l) => !l.suspicious);

    if (dateFilter !== 'all') {
      const now = new Date();
      const cutoff = new Date(now);
      if (dateFilter === '24h') cutoff.setDate(now.getDate() - 1);
      else if (dateFilter === '7d') cutoff.setDate(now.getDate() - 7);
      else if (dateFilter === '30d') cutoff.setDate(now.getDate() - 30);
      result = result.filter((l) => new Date(l.timestamp) >= cutoff);
    }

    return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [logs, search, flagFilter, dateFilter]);

  const exportLogs = () => {
    const header = 'User,Email,Role,Timestamp,Discount,Context,Suspicious,Country,Device\n';
    const rows = filtered
      .map((l) =>
        [l.userName, l.userEmail, l.userRole, l.timestamp, l.discountApplied, l.context, l.suspicious, l.country, l.device].join(',')
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'coupon-usage-logs.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Logs exported as CSV');
  };

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search user or context…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-[13px]"
          />
        </div>
        <Select value={flagFilter} onValueChange={(v) => setFlagFilter(v as typeof flagFilter)}>
          <SelectTrigger className="h-8 w-[130px] text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All flags</SelectItem>
            <SelectItem value="suspicious">Suspicious</SelectItem>
            <SelectItem value="clean">Clean</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="h-8 w-[120px] text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="24h">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="h-8 text-[13px] gap-1.5" onClick={exportLogs}>
          <Download className="size-3.5" /> Export CSV
        </Button>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-[12px] text-muted-foreground">
        <span>{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
        {filtered.filter((l) => l.suspicious).length > 0 && (
          <span className="flex items-center gap-1 text-amber-600">
            <AlertTriangle className="size-3" />
            {filtered.filter((l) => l.suspicious).length} suspicious
          </span>
        )}
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-[12px] w-[180px]">User</TableHead>
              {showCouponId && <TableHead className="text-[12px]">Coupon</TableHead>}
              <TableHead className="text-[12px]">Timestamp</TableHead>
              <TableHead className="text-[12px]">Context</TableHead>
              <TableHead className="text-[12px] text-right">Discount</TableHead>
              <TableHead className="text-[12px] w-[60px] text-center">Device</TableHead>
              <TableHead className="text-[12px] w-[60px] text-center">Country</TableHead>
              <TableHead className="text-[12px] w-[80px] text-center">Flag</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7 + (showCouponId ? 1 : 0)} className="text-center py-10 text-[13px] text-muted-foreground">
                  No redemption logs match your filters
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((log) => (
                <TableRow key={log.id} className={cn(log.suspicious && 'bg-red-50/50')}>
                  <TableCell className="py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-[10px] text-primary">{log.userName.charAt(0)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] text-foreground truncate">{log.userName}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{log.userEmail}</p>
                      </div>
                    </div>
                  </TableCell>
                  {showCouponId && (
                    <TableCell className="py-2.5">
                      <span className="text-[12px] font-mono text-muted-foreground">{log.couponId}</span>
                    </TableCell>
                  )}
                  <TableCell className="py-2.5">
                    <div>
                      <p className="text-[13px] text-foreground">
                        {new Date(log.timestamp).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(log.timestamp).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5">
                    <p className="text-[13px] text-foreground max-w-[200px] truncate" title={log.context}>
                      {log.context}
                    </p>
                    {log.orderId && (
                      <p className="text-[11px] text-muted-foreground font-mono">{log.orderId}</p>
                    )}
                  </TableCell>
                  <TableCell className="py-2.5 text-right">
                    <span className="text-[13px] text-foreground">
                      {log.discountApplied > 0 ? `₹${log.discountApplied}` : '—'}
                    </span>
                  </TableCell>
                  <TableCell className="py-2.5 text-center">
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-muted-foreground flex items-center justify-center">
                            <DeviceIcon device={log.device} />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <span className="text-xs capitalize">{log.device}</span>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="py-2.5 text-center">
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center justify-center gap-1 text-[12px] text-muted-foreground">
                            <Globe className="size-3" />
                            {log.country}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <span className="text-xs">{log.ipAddress}</span>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="py-2.5 text-center">
                    {log.suspicious ? (
                      <TooltipProvider delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full cursor-default">
                              <AlertTriangle className="size-3" /> Flagged
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[240px]">
                            <span className="text-xs">{log.flagReason}</span>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600">
                        <CheckCircle2 className="size-3" />
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
