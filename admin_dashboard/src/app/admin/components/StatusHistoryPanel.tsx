import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../components/ui/sheet';
import { Badge } from '../../components/ui/badge';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Shield, Ban, Clock, CheckCircle, AlertTriangle, FileText, ArrowRight } from 'lucide-react';

interface StatusEvent {
  id: string;
  type: 'ban' | 'unban' | 'suspend' | 'unsuspend' | 'warn' | 'restrict' | 'account_created';
  reason: string;
  appliedBy: string;
  timestamp: string;
  duration?: string;
  relatedContent?: string;
  active: boolean;
}

interface StatusHistoryPanelProps {
  open: boolean;
  onClose: () => void;
  userName: string;
  currentStatus: string;
  history: StatusEvent[];
}

const eventConfig: Record<string, { icon: typeof Ban; label: string; color: string; bg: string }> = {
  ban: { icon: Ban, label: 'Banned', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10 border-red-200 dark:border-red-800' },
  unban: { icon: CheckCircle, label: 'Unbanned', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-200 dark:border-emerald-800' },
  suspend: { icon: Clock, label: 'Suspended', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-200 dark:border-amber-800' },
  unsuspend: { icon: CheckCircle, label: 'Unsuspended', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-200 dark:border-emerald-800' },
  warn: { icon: AlertTriangle, label: 'Warning', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-200 dark:border-amber-800' },
  restrict: { icon: Shield, label: 'Restriction', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/10 border-violet-200 dark:border-violet-800' },
  account_created: { icon: CheckCircle, label: 'Account Created', color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-500/10 border-sky-200 dark:border-sky-800' },
};

const statusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
    case 'banned': return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
    case 'suspended': return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    default: return '';
  }
};

export default function StatusHistoryPanel({ open, onClose, userName, currentStatus, history }: StatusHistoryPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-hidden flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-base">Status History</SheetTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{userName}</p>
            </div>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs ${statusColor(currentStatus)}`}>
              {currentStatus}
            </span>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6">
            {/* Timeline */}
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border" />

              <div className="space-y-0">
                {history.map((event, index) => {
                  const config = eventConfig[event.type] || eventConfig.warn;
                  const Icon = config.icon;

                  return (
                    <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
                      {/* Timeline dot */}
                      <div className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border ${config.bg} ${event.active ? 'ring-2 ring-primary/20' : ''}`}>
                        <Icon className={`size-3.5 ${config.color}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1.5 pt-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm ${config.color}`}>{config.label}</span>
                            {event.active && (
                              <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-1.5 py-0 text-[10px]">
                                active
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground shrink-0">{event.timestamp}</span>
                        </div>

                        <p className="text-xs text-muted-foreground">{event.reason}</p>

                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Shield className="size-3" />
                            {event.appliedBy}
                          </span>
                          {event.duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="size-3" />
                              {event.duration}
                            </span>
                          )}
                        </div>

                        {event.relatedContent && (
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1">
                            <FileText className="size-3" />
                            <span>Related: {event.relatedContent}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
