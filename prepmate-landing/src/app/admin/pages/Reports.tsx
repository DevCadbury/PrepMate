import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, CheckCircle, X, AlertTriangle, User, FileText, Eye, Ban, Clock, MoreHorizontal } from 'lucide-react';
import ReportedContentViewer from '../components/ReportedContentViewer';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Checkbox } from '../../components/ui/checkbox';
import { Separator } from '../../components/ui/separator';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
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
import { toast } from 'sonner';
import { apiClient } from '../../../lib/apiClient';
import { mapBackendChatReportToReportsRow } from '../lib/backendAdapters';

type Report = {
  id: string;
  reporter: string;
  reporterEmail: string;
  target: string;
  targetType: 'user' | 'post';
  reason: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  severity: 'low' | 'medium' | 'high';
  _backendStatus: string;
};

type BackendChatReport = {
  messageId: string;
  roomId?: string | null;
  messagePreview?: string;
  sender?: { id: string; name?: string; username?: string } | null;
  receiver?: { id: string; name?: string; username?: string } | null;
  reportCount?: number;
  lastReason?: string;
  lastReportedAt?: string;
  status?: string;
  reviewedAt?: string;
};

type ListReportsResponse = {
  success?: boolean;
  data?: {
    reports?: BackendChatReport[];
  };
};

const severityStyles = (severity: string) => {
  switch (severity) {
    case 'high': return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
    case 'medium': return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    case 'low': return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    default: return '';
  }
};

const statusStyles = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    case 'approved': return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
    case 'rejected': return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    default: return '';
  }
};

const decisionByAction: Record<string, 'resolved' | 'dismissed' | 'blocked'> = {
  approve: 'resolved',
  reject: 'dismissed',
  'ban-user': 'blocked',
  'suspend-user': 'resolved',
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [viewContentOpen, setViewContentOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionDialog, setActionDialog] = useState<{
    type: 'approve' | 'reject' | 'ban-user' | 'suspend-user' | null;
    report: Report | null;
  }>({ type: null, report: null });
  const [actionReason, setActionReason] = useState('');

  const fetchReports = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await apiClient.get<ListReportsResponse>('/admin/chat/reports?limit=200');
      const backendReports = response?.data?.reports;
      const rows = Array.isArray(backendReports) ? backendReports : [];
      const mapped = rows.map((report) => mapBackendChatReportToReportsRow(report as any));
      setReports(mapped as Report[]);
    } catch (error) {
      toast.error('Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesSearch =
        report.reporter.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
      const matchesSeverity = severityFilter === 'all' || report.severity === severityFilter;
      return matchesSearch && matchesStatus && matchesSeverity;
    });
  }, [reports, searchQuery, statusFilter, severityFilter]);

  const allSelected = filteredReports.length > 0 && filteredReports.every((report) => selectedIds.has(report.id));

  const applyDecision = async (reportId: string, action: 'approve' | 'reject' | 'ban-user' | 'suspend-user', note: string) => {
    const decision = decisionByAction[action];
    await apiClient.patch(`/admin/chat/reports/${reportId}`, {
      decision,
      note,
    });
  };

  const confirmAction = async () => {
    if (!actionDialog.report || !actionDialog.type) return;

    setIsSubmitting(true);

    try {
      await applyDecision(actionDialog.report.id, actionDialog.type, actionReason.trim());

      if (actionDialog.type === 'approve') toast.success('Report approved - action taken');
      if (actionDialog.type === 'reject') toast.success('Report dismissed');
      if (actionDialog.type === 'ban-user') toast.success(`Message blocked for "${actionDialog.report.target}"`);
      if (actionDialog.type === 'suspend-user') toast.success(`Report resolved for "${actionDialog.report.target}"`);

      setActionDialog({ type: null, report: null });
      setActionReason('');
      await fetchReports();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setIsSubmitting(true);

    try {
      await Promise.allSettled(ids.map((id) => applyDecision(id, action, 'Bulk review action')));
      toast.success(`${ids.length} report(s) ${action === 'approve' ? 'approved' : 'rejected'}`);
      setSelectedIds(new Set());
      await fetchReports();
    } catch (error: any) {
      toast.error(error?.message || 'Bulk action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingCount = reports.filter((report) => report.status === 'pending').length;
  const highCount = reports.filter((report) => report.severity === 'high' && report.status === 'pending').length;

  const reportedContent = selectedReport
    ? {
        id: selectedReport.id,
        type: 'comment' as const,
        title: 'Reported Chat Message',
        content: selectedReport.description,
        author: {
          id: 'author',
          name: selectedReport.target,
          email: selectedReport.reporterEmail,
          role: 'user',
          status: 'active',
          joinedAt: '-',
          lastActive: selectedReport.createdAt,
          posts: 0,
          followers: 0,
          following: 0,
          reports: 0,
          codingSolved: 0,
        },
        createdAt: selectedReport.createdAt,
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        reporters: [
          {
            id: selectedReport.id,
            name: selectedReport.reporter,
            email: selectedReport.reporterEmail,
            reason: selectedReport.reason,
            timestamp: selectedReport.createdAt,
          },
        ],
        severity: selectedReport.severity,
      }
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review and manage chat abuse reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          {highCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-3 py-1.5">
              <AlertTriangle className="size-3.5 text-red-600 dark:text-red-400" />
              <span className="text-xs text-red-700 dark:text-red-400">{highCount} high severity</span>
            </div>
          )}
          <Badge variant="outline" className="text-xs">{pendingCount} pending</Badge>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-4 py-2.5">
          <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>
          <Separator orientation="vertical" className="h-5" />
          <Button variant="outline" size="sm" onClick={() => handleBulkAction('approve')} disabled={isSubmitting}>
            <CheckCircle className="mr-1.5 size-3.5" />
            Approve
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleBulkAction('reject')} disabled={isSubmitting}>
            <X className="mr-1.5 size-3.5" />
            Reject
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>Clear</Button>
        </div>
      )}

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={() => {
                    if (allSelected) setSelectedIds(new Set());
                    else setSelectedIds(new Set(filteredReports.map((report) => report.id)));
                  }}
                />
              </TableHead>
              <TableHead>Reporter</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">Loading reports...</TableCell>
              </TableRow>
            ) : filteredReports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">No reports found</TableCell>
              </TableRow>
            ) : (
              filteredReports.map((report) => (
                <TableRow key={report.id} className={`${selectedIds.has(report.id) ? 'bg-primary/[0.03]' : ''} ${report.severity === 'high' && report.status === 'pending' ? 'border-l-2 border-l-red-500' : ''}`}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(report.id)}
                      onCheckedChange={() => {
                        const next = new Set(selectedIds);
                        if (next.has(report.id)) next.delete(report.id);
                        else next.add(report.id);
                        setSelectedIds(next);
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="size-7">
                        <AvatarFallback className="text-[10px]">{report.reporter.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm">{report.reporter}</div>
                        <div className="text-[11px] text-muted-foreground">{report.reporterEmail}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {report.targetType === 'user' ? (
                        <User className="size-3.5 text-muted-foreground" />
                      ) : (
                        <FileText className="size-3.5 text-muted-foreground" />
                      )}
                      <div>
                        <div className="text-sm">{report.target}</div>
                        <div className="text-[11px] text-muted-foreground">{report.targetType}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <div className="text-sm">{report.reason}</div>
                      <div className="text-[11px] text-muted-foreground line-clamp-1">{report.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${severityStyles(report.severity)}`}>
                      {report.severity}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${statusStyles(report.status)}`}>
                      {report.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{report.createdAt}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" className="size-8 p-0" onClick={() => { setSelectedReport(report); setViewContentOpen(true); }}>
                        <Eye className="size-4" />
                      </Button>
                      {report.status === 'pending' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setActionDialog({ type: 'approve', report })}>
                              <CheckCircle className="mr-2 size-4" />
                              Approve Report
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setActionDialog({ type: 'reject', report })}>
                              <X className="mr-2 size-4" />
                              Dismiss Report
                            </DropdownMenuItem>
                            {report.targetType === 'user' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setActionDialog({ type: 'suspend-user', report })}>
                                  <Clock className="mr-2 size-4" />
                                  Resolve and Warn
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setActionDialog({ type: 'ban-user', report })} className="text-red-600 dark:text-red-400">
                                  <Ban className="mr-2 size-4" />
                                  Block Message
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ReportedContentViewer
        content={reportedContent as any}
        open={viewContentOpen}
        onClose={() => setViewContentOpen(false)}
        onApprove={async () => {
          if (!selectedReport) return;
          try {
            await applyDecision(selectedReport.id, 'approve', 'Approved from report viewer');
            toast.success('Report approved');
            setViewContentOpen(false);
            await fetchReports();
          } catch (error) {
            toast.error('Failed to approve report');
          }
        }}
        onRemove={async () => {
          if (!selectedReport) return;
          try {
            await applyDecision(selectedReport.id, 'ban-user', 'Blocked from report viewer');
            toast.success('Message blocked');
            setViewContentOpen(false);
            await fetchReports();
          } catch (error) {
            toast.error('Failed to block message');
          }
        }}
        onWarnUser={() => {
          toast.success('Warning recorded');
          setViewContentOpen(false);
        }}
        onBanUser={async () => {
          if (!selectedReport) return;
          try {
            await applyDecision(selectedReport.id, 'ban-user', 'Blocked from report viewer');
            toast.success('Message blocked');
            setViewContentOpen(false);
            await fetchReports();
          } catch (error) {
            toast.error('Failed to block message');
          }
        }}
      />

      <AlertDialog
        open={actionDialog.type !== null}
        onOpenChange={() => {
          setActionDialog({ type: null, report: null });
          setActionReason('');
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog.type === 'approve' && 'Approve Report'}
              {actionDialog.type === 'reject' && 'Dismiss Report'}
              {actionDialog.type === 'ban-user' && 'Block Reported Message'}
              {actionDialog.type === 'suspend-user' && 'Resolve Report'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  {actionDialog.type === 'approve' && 'Approve this report and mark it resolved?'}
                  {actionDialog.type === 'reject' && 'Dismiss this report? The status will be marked as dismissed.'}
                  {actionDialog.type === 'ban-user' && `Block the reported message from "${actionDialog.report?.target}"?`}
                  {actionDialog.type === 'suspend-user' && `Resolve this report for "${actionDialog.report?.target}"?`}
                </p>
                {(actionDialog.type === 'ban-user' || actionDialog.type === 'suspend-user') && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Reason</Label>
                    <Textarea
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      placeholder="Provide reason..."
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              disabled={isSubmitting}
              className={actionDialog.type === 'ban-user' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
            >
              {isSubmitting ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
