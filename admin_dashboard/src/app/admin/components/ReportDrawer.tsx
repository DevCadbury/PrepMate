import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../components/ui/sheet';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Separator } from '../../components/ui/separator';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
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
import MediaAttachment, { AttachedFile } from './MediaAttachment';
import { toast } from 'sonner';
import {
  Flag,
  CheckCircle,
  X,
  Ban,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  FileText,
  MessageCircle,
  Image,
  User,
  Shield,
  Paperclip,
} from 'lucide-react';

interface ReportDetail {
  id: string;
  contentType: 'post' | 'comment' | 'problem' | 'profile';
  contentPreview: string;
  contentTitle?: string;
  reason: string;
  reportedBy: { name: string; email: string };
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
  status: 'pending' | 'resolved';
  moderationAction?: string;
  moderatedBy?: string;
  moderatedAt?: string;
  attachments?: { name: string; url: string }[];
  duplicateCount?: number;
}

interface ReportDrawerProps {
  open: boolean;
  onClose: () => void;
  userName: string;
  userEmail: string;
  reports: ReportDetail[];
  onResolve?: (reportId: string, action: string, reason: string) => void;
}

const contentTypeIcon = {
  post: FileText,
  comment: MessageCircle,
  problem: FileText,
  profile: User,
};

const severityStyles = (s: string) => {
  switch (s) {
    case 'high': return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
    case 'medium': return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    case 'low': return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    default: return '';
  }
};

export default function ReportDrawer({ open, onClose, userName, userEmail, reports, onResolve }: ReportDrawerProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionDialog, setActionDialog] = useState<{ report: ReportDetail | null; action: string }>({ report: null, action: '' });
  const [actionReason, setActionReason] = useState('');
  const [actionFiles, setActionFiles] = useState<AttachedFile[]>([]);

  const filtered = reports.filter(r => filter === 'all' || r.status === filter);
  const pendingCount = reports.filter(r => r.status === 'pending').length;
  const resolvedCount = reports.filter(r => r.status === 'resolved').length;

  const handleConfirmAction = () => {
    if (!actionDialog.report) return;
    onResolve?.(actionDialog.report.id, actionDialog.action, actionReason);
    toast.success(`Report ${actionDialog.action === 'dismiss' ? 'dismissed' : 'resolved — action taken'}`);
    setActionDialog({ report: null, action: '' });
    setActionReason('');
    setActionFiles([]);
  };

  // Group by content
  const grouped = new Map<string, ReportDetail[]>();
  filtered.forEach(r => {
    const key = r.contentTitle || r.contentPreview.substring(0, 40);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r);
  });

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-xl overflow-hidden flex flex-col p-0">
          <SheetHeader className="px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-base">Reports Against User</SheetTitle>
                <p className="text-xs text-muted-foreground mt-0.5">{userName} · {userEmail}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-[11px]">{reports.length} total</Badge>
                {pendingCount > 0 && (
                  <span className="inline-flex items-center rounded-full bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 px-2 py-0.5 text-[11px]">
                    {pendingCount} pending
                  </span>
                )}
              </div>
            </div>
          </SheetHeader>

          {/* Filter tabs */}
          <div className="flex gap-1 px-6 py-2 border-b border-border shrink-0">
            {(['all', 'pending', 'resolved'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                  filter === f
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === 'pending' && pendingCount > 0 && (
                  <span className="ml-1 text-[10px]">({pendingCount})</span>
                )}
              </button>
            ))}
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Flag className="size-8 text-muted-foreground/30" />
                  <p className="mt-3 text-sm text-muted-foreground">No {filter === 'all' ? '' : filter} reports</p>
                </div>
              ) : (
                [...grouped.entries()].map(([contentKey, groupReports]) => (
                  <div key={contentKey} className="space-y-2">
                    {groupReports.length > 1 && (
                      <div className="flex items-center gap-2 px-1">
                        <span className="text-[11px] text-muted-foreground">
                          {groupReports.length} reports for same content
                        </span>
                        <span className="inline-flex items-center rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-1.5 py-0 text-[10px]">
                          repeated
                        </span>
                      </div>
                    )}
                    {groupReports.map(report => {
                      const ContentIcon = contentTypeIcon[report.contentType];
                      const isExpanded = expandedId === report.id;

                      return (
                        <div
                          key={report.id}
                          className={`rounded-lg border transition-colors ${
                            report.severity === 'high' && report.status === 'pending'
                              ? 'border-red-200 dark:border-red-900'
                              : 'border-border'
                          }`}
                        >
                          {/* Header */}
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : report.id)}
                            className="w-full flex items-start gap-3 p-3 text-left hover:bg-muted/30 transition-colors rounded-lg"
                          >
                            <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                              report.status === 'pending'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            }`}>
                              {report.status === 'pending' ? <Flag className="size-4" /> : <CheckCircle className="size-4" />}
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  <span className={`inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] ${severityStyles(report.severity)}`}>
                                    {report.severity}
                                  </span>
                                  <span className="text-sm">{report.reason}</span>
                                </div>
                                {isExpanded ? <ChevronUp className="size-3.5 text-muted-foreground shrink-0" /> : <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                <ContentIcon className="size-3" />
                                <span>{report.contentType}</span>
                                <span>·</span>
                                <span>by {report.reportedBy.name}</span>
                                <span>·</span>
                                <span>{report.timestamp}</span>
                              </div>
                            </div>
                          </button>

                          {/* Expanded content */}
                          {isExpanded && (
                            <div className="border-t border-border px-3 pb-3 space-y-3">
                              {/* Content preview */}
                              <div className="mt-3 rounded-lg bg-muted/50 p-3">
                                {report.contentTitle && (
                                  <p className="text-xs mb-1">{report.contentTitle}</p>
                                )}
                                <p className="text-xs text-muted-foreground">{report.contentPreview}</p>
                              </div>

                              {/* Reporter info */}
                              <div className="flex items-center gap-2">
                                <Avatar className="size-6">
                                  <AvatarFallback className="text-[10px]">{report.reportedBy.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <span className="text-xs">{report.reportedBy.name}</span>
                                  <span className="text-[11px] text-muted-foreground ml-1.5">{report.reportedBy.email}</span>
                                </div>
                              </div>

                              {/* Attachments */}
                              {report.attachments && report.attachments.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <Paperclip className="size-3 text-muted-foreground" />
                                  <span className="text-[11px] text-muted-foreground">{report.attachments.length} attachment(s)</span>
                                </div>
                              )}

                              {/* Moderation result */}
                              {report.status === 'resolved' && report.moderationAction && (
                                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-2.5 space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <Shield className="size-3 text-emerald-600 dark:text-emerald-400" />
                                    <span className="text-[11px] text-emerald-800 dark:text-emerald-300">Action: {report.moderationAction}</span>
                                  </div>
                                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                                    by {report.moderatedBy} · {report.moderatedAt}
                                  </p>
                                </div>
                              )}

                              {/* Quick actions for pending */}
                              {report.status === 'pending' && (
                                <div className="flex items-center gap-2 pt-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs"
                                    onClick={() => setActionDialog({ report, action: 'dismiss' })}
                                  >
                                    <X className="size-3 mr-1" />
                                    Dismiss
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs"
                                    onClick={() => setActionDialog({ report, action: 'warn' })}
                                  >
                                    <AlertTriangle className="size-3 mr-1" />
                                    Warn
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs"
                                    onClick={() => setActionDialog({ report, action: 'suspend' })}
                                  >
                                    <Clock className="size-3 mr-1" />
                                    Suspend
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white"
                                    onClick={() => setActionDialog({ report, action: 'ban' })}
                                  >
                                    <Ban className="size-3 mr-1" />
                                    Ban
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Action confirmation */}
      <AlertDialog open={!!actionDialog.report} onOpenChange={() => { setActionDialog({ report: null, action: '' }); setActionReason(''); setActionFiles([]); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog.action === 'dismiss' && 'Dismiss Report'}
              {actionDialog.action === 'warn' && 'Warn User'}
              {actionDialog.action === 'suspend' && 'Suspend User'}
              {actionDialog.action === 'ban' && 'Ban User'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  {actionDialog.action === 'dismiss' && 'Dismiss this report as invalid? The reporter will be notified.'}
                  {actionDialog.action === 'warn' && `Send a warning to ${userName} regarding this report.`}
                  {actionDialog.action === 'suspend' && `Suspend ${userName} based on this report.`}
                  {actionDialog.action === 'ban' && `Ban ${userName} based on this report. This will revoke platform access.`}
                </p>
                <div className="space-y-1.5">
                  <Label className="text-xs">Reason / Notes</Label>
                  <Textarea
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder="Provide details..."
                    rows={2}
                    className="resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Attach evidence (optional)</Label>
                  <MediaAttachment files={actionFiles} onChange={setActionFiles} maxFiles={3} compact />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={actionDialog.action === 'ban' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
