import { useState } from 'react';
import { Search, Filter, CheckCircle, X, AlertTriangle, User, FileText, Eye, Ban, Clock, MoreHorizontal } from 'lucide-react';
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
import MediaAttachment, { AttachedFile } from '../components/MediaAttachment';
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

interface Report {
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
}

const mockReports: Report[] = [
  { id: '1', reporter: 'John Doe', reporterEmail: 'john@email.com', target: 'Bob Wilson', targetType: 'user', reason: 'Harassment', description: 'User has been sending inappropriate messages repeatedly', status: 'pending', createdAt: '2 hours ago', severity: 'high' },
  { id: '2', reporter: 'Jane Smith', reporterEmail: 'jane@email.com', target: 'Inappropriate post', targetType: 'post', reason: 'Spam', description: 'Post contains spam links and promotional content', status: 'pending', createdAt: '5 hours ago', severity: 'medium' },
  { id: '3', reporter: 'Mike Johnson', reporterEmail: 'mike@email.com', target: 'Alice Brown', targetType: 'user', reason: 'Fake profile', description: 'Suspicious account activity, possible bot', status: 'approved', createdAt: '1 day ago', severity: 'low' },
  { id: '4', reporter: 'Sara Lee', reporterEmail: 'sara@email.com', target: 'Offensive comment', targetType: 'post', reason: 'Hate speech', description: 'Comment contains discriminatory language', status: 'pending', createdAt: '3 hours ago', severity: 'high' },
  { id: '5', reporter: 'Alice Brown', reporterEmail: 'alice@email.com', target: 'Mike Johnson', targetType: 'user', reason: 'Impersonation', description: 'User is impersonating another person', status: 'rejected', createdAt: '2 days ago', severity: 'medium' },
];

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

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>(mockReports);
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
  const [actionFiles, setActionFiles] = useState<AttachedFile[]>([]);

  const mockReportedContent = selectedReport ? {
    id: selectedReport.id,
    type: 'post' as const,
    title: 'Sample Post Title',
    content: 'This is the reported content that has been flagged by users. It contains information that may violate community guidelines.',
    author: {
      id: '1',
      name: selectedReport.target,
      email: 'author@email.com',
      role: 'user',
      status: 'active',
      joinedAt: 'Jan 15, 2024',
      lastActive: '2 hours ago',
      posts: 42,
      followers: 128,
      following: 56,
      reports: 3,
      codingSolved: 87,
    },
    createdAt: '2 days ago',
    views: 1234,
    likes: 45,
    comments: 12,
    shares: 8,
    reporters: [{
      id: '1',
      name: selectedReport.reporter,
      email: selectedReport.reporterEmail,
      reason: selectedReport.reason,
      timestamp: selectedReport.createdAt,
    }],
    severity: selectedReport.severity,
  } : null;

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.reporter.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.target.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || report.severity === severityFilter;
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const allSelected = filteredReports.length > 0 && filteredReports.every(r => selectedIds.has(r.id));

  const confirmAction = () => {
    if (!actionDialog.report) return;
    if (actionDialog.type === 'approve' || actionDialog.type === 'reject') {
      setReports(reports.map(r => r.id === actionDialog.report?.id
        ? { ...r, status: (actionDialog.type === 'approve' ? 'approved' : 'rejected') as const }
        : r
      ));
      toast.success(actionDialog.type === 'approve' ? 'Report approved — action taken' : 'Report dismissed');
    } else if (actionDialog.type === 'ban-user') {
      setReports(reports.map(r => r.id === actionDialog.report?.id ? { ...r, status: 'approved' as const } : r));
      toast.success(`User "${actionDialog.report.target}" banned`);
    } else if (actionDialog.type === 'suspend-user') {
      setReports(reports.map(r => r.id === actionDialog.report?.id ? { ...r, status: 'approved' as const } : r));
      toast.success(`User "${actionDialog.report.target}" suspended`);
    }
    setActionDialog({ type: null, report: null });
    setActionReason('');
    setActionFiles([]);
  };

  const handleBulkAction = (action: 'approve' | 'reject') => {
    setReports(reports.map(r => selectedIds.has(r.id)
      ? { ...r, status: (action === 'approve' ? 'approved' : 'rejected') as const }
      : r
    ));
    toast.success(`${selectedIds.size} report(s) ${action === 'approve' ? 'approved' : 'rejected'}`);
    setSelectedIds(new Set());
  };

  const pendingCount = reports.filter(r => r.status === 'pending').length;
  const highCount = reports.filter(r => r.severity === 'high' && r.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review and manage user reports
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
          <Button variant="outline" size="sm" onClick={() => handleBulkAction('approve')}>
            <CheckCircle className="mr-1.5 size-3.5" />
            Approve
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleBulkAction('reject')}>
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
                <Checkbox checked={allSelected} onCheckedChange={() => {
                  if (allSelected) setSelectedIds(new Set());
                  else setSelectedIds(new Set(filteredReports.map(r => r.id)));
                }} />
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
            {filteredReports.map((report) => (
              <TableRow key={report.id} className={`${selectedIds.has(report.id) ? 'bg-primary/[0.03]' : ''} ${report.severity === 'high' && report.status === 'pending' ? 'border-l-2 border-l-red-500' : ''}`}>
                <TableCell>
                  <Checkbox checked={selectedIds.has(report.id)} onCheckedChange={() => {
                    const next = new Set(selectedIds);
                    if (next.has(report.id)) next.delete(report.id); else next.add(report.id);
                    setSelectedIds(next);
                  }} />
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
                                Suspend Target
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setActionDialog({ type: 'ban-user', report })} className="text-red-600 dark:text-red-400">
                                <Ban className="mr-2 size-4" />
                                Ban Target
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ReportedContentViewer
        content={mockReportedContent}
        open={viewContentOpen}
        onClose={() => setViewContentOpen(false)}
        onApprove={() => {
          if (selectedReport) {
            setReports(reports.map(r => r.id === selectedReport.id ? { ...r, status: 'approved' as const } : r));
            toast.success('Content approved');
          }
          setViewContentOpen(false);
        }}
        onRemove={() => {
          if (selectedReport) {
            setReports(reports.map(r => r.id === selectedReport.id ? { ...r, status: 'approved' as const } : r));
            toast.success('Content removed');
          }
          setViewContentOpen(false);
        }}
        onWarnUser={() => { toast.success('Warning sent to user'); setViewContentOpen(false); }}
        onBanUser={() => { toast.success('User banned'); setViewContentOpen(false); }}
      />

      <AlertDialog
        open={actionDialog.type !== null}
        onOpenChange={() => { setActionDialog({ type: null, report: null }); setActionReason(''); setActionFiles([]); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog.type === 'approve' && 'Approve Report'}
              {actionDialog.type === 'reject' && 'Dismiss Report'}
              {actionDialog.type === 'ban-user' && 'Ban Reported User'}
              {actionDialog.type === 'suspend-user' && 'Suspend Reported User'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  {actionDialog.type === 'approve' && 'Approve this report and take action against the target?'}
                  {actionDialog.type === 'reject' && 'Dismiss this report? The reporter will be notified.'}
                  {actionDialog.type === 'ban-user' && `Ban "${actionDialog.report?.target}"? They will lose platform access.`}
                  {actionDialog.type === 'suspend-user' && `Suspend "${actionDialog.report?.target}"? Their access will be restricted.`}
                </p>
                {(actionDialog.type === 'ban-user' || actionDialog.type === 'suspend-user') && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Reason</Label>
                    <Textarea value={actionReason} onChange={(e) => setActionReason(e.target.value)} placeholder="Provide reason..." rows={2} className="resize-none" />
                  </div>
                )}
                {(actionDialog.type === 'ban-user' || actionDialog.type === 'suspend-user') && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Attach evidence (optional)</Label>
                    <MediaAttachment files={actionFiles} onChange={setActionFiles} maxFiles={3} compact />
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              className={actionDialog.type === 'ban-user' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}