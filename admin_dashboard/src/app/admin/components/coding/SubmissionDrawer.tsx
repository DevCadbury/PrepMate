import { X, CheckCircle, XCircle, Clock, MemoryStick, AlertTriangle, Terminal, TestTube } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Separator } from '../../../components/ui/separator';
import { Avatar, AvatarFallback } from '../../../components/ui/avatar';
import { CodeViewer } from './CodeViewer';
import type { UserSubmission, SubmissionStatus } from '../../data/codingData';

// ─── Status display ───────────────────────────────────────────────────────────

const statusConfig: Record<SubmissionStatus, {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}> = {
  accepted: {
    label: 'Accepted',
    icon: CheckCircle,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
  },
  wrong_answer: {
    label: 'Wrong Answer',
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20',
  },
  time_limit_exceeded: {
    label: 'Time Limit Exceeded',
    icon: Clock,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
  },
  runtime_error: {
    label: 'Runtime Error',
    icon: AlertTriangle,
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20',
  },
  compile_error: {
    label: 'Compile Error',
    icon: Terminal,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20',
  },
};

interface SubmissionDrawerProps {
  submission: UserSubmission | null;
  onClose: () => void;
}

export function SubmissionDrawer({ submission, onClose }: SubmissionDrawerProps) {
  if (!submission) return null;

  const config = statusConfig[submission.status];
  const StatusIcon = config.icon;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-[520px] flex-col border-l border-border bg-background shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarFallback className={`text-xs text-white ${submission.user.color}`}>
              {submission.user.initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm">{submission.user.name}</p>
            <p className="text-xs text-muted-foreground">{submission.user.email}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="size-8" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-5 space-y-5">
          {/* Status banner */}
          <div className={`flex items-center gap-3 rounded-lg border p-3 ${config.bg}`}>
            <StatusIcon className={`size-5 shrink-0 ${config.color}`} />
            <div>
              <p className={`text-sm ${config.color}`}>{config.label}</p>
              <p className="text-xs text-muted-foreground">{submission.submittedAt}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="size-3.5" />
                <span className="text-[10px] uppercase tracking-wider">Runtime</span>
              </div>
              <p className="text-sm font-mono">{submission.runtime}</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MemoryStick className="size-3.5" />
                <span className="text-[10px] uppercase tracking-wider">Memory</span>
              </div>
              <p className="text-sm font-mono">{submission.memory}</p>
            </div>
          </div>

          {/* Language */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Language</span>
            <Badge variant="outline" className="text-xs">{submission.language}</Badge>
          </div>

          {/* Test results */}
          {submission.passedTests !== undefined && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <TestTube className="size-3.5 text-muted-foreground" />
                  <span className="text-xs">Test Results</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        submission.passedTests === submission.totalTests
                          ? 'bg-emerald-500'
                          : submission.passedTests === 0
                          ? 'bg-red-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${((submission.passedTests || 0) / (submission.totalTests || 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground shrink-0">
                    {submission.passedTests} / {submission.totalTests} passed
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Error message */}
          {submission.errorMessage && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Terminal className="size-3.5 text-muted-foreground" />
                  <span className="text-xs">Error Output</span>
                </div>
                <div className="rounded-md bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-3">
                  <p className="text-xs font-mono text-red-700 dark:text-red-400 whitespace-pre-wrap break-all">
                    {submission.errorMessage}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Expected vs actual output */}
          {submission.output && (
            <>
              <Separator />
              <div className="space-y-2">
                <span className="text-xs">Actual Output</span>
                <div className="rounded-md bg-muted/50 border border-border p-2.5">
                  <p className="text-xs font-mono">{submission.output}</p>
                </div>
              </div>
            </>
          )}

          {/* Code */}
          <Separator />
          <div className="space-y-2">
            <span className="text-xs">Submitted Code</span>
            <CodeViewer code={submission.code} language={submission.language.toLowerCase()} maxHeight="320px" />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
