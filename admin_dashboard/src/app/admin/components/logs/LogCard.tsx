import {
  Shield, User, FileText, Flag, Settings, Activity, Lock, Code, ChevronRight,
  AlertTriangle, Info, CheckCircle, Zap, Cpu
} from 'lucide-react';
import type { LogEntry, LogCategory, LogActionType } from '../../data/logsData';

// ─── Category icon map ────────────────────────────────────────────────────────

const categoryIcons: Record<LogCategory, React.ElementType> = {
  auth: Lock,
  user: User,
  content: FileText,
  report: Flag,
  admin: Shield,
  settings: Settings,
  coding: Code,
  system: Cpu,
};

const categoryColors: Record<LogCategory, string> = {
  auth: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20',
  user: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400 border-sky-100 dark:border-sky-500/20',
  content: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-100 dark:border-amber-500/20',
  report: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border-red-100 dark:border-red-500/20',
  admin: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400 border-violet-100 dark:border-violet-500/20',
  settings: 'bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400 border-slate-100 dark:border-slate-500/20',
  coding: 'bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400 border-teal-100 dark:border-teal-500/20',
  system: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20',
};

const actionTypeStyles: Record<LogActionType, { dot: string; badge: string }> = {
  destructive: {
    dot: 'bg-red-500',
    badge: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  },
  warning: {
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  },
  success: {
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  },
  info: {
    dot: 'bg-sky-500',
    badge: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
  },
  muted: {
    dot: 'bg-slate-400',
    badge: 'bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400',
  },
};

// ─── Action type icons ────────────────────────────────────────────────────────

function ActionIcon({ type }: { type: LogActionType }) {
  const size = 'size-3';
  switch (type) {
    case 'destructive': return <AlertTriangle className={`${size} text-red-500`} />;
    case 'warning': return <AlertTriangle className={`${size} text-amber-500`} />;
    case 'success': return <CheckCircle className={`${size} text-emerald-500`} />;
    case 'info': return <Info className={`${size} text-sky-500`} />;
    case 'muted': return <Activity className={`${size} text-slate-400`} />;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface LogCardProps {
  log: LogEntry;
  isSelected: boolean;
  onClick: () => void;
  isLast?: boolean;
}

export function LogCard({ log, isSelected, onClick, isLast }: LogCardProps) {
  const Icon = categoryIcons[log.category] || Activity;
  const catColor = categoryColors[log.category];
  const styles = actionTypeStyles[log.actionType];
  const isSuspicious = log.metadata?.suspiciousScore && log.metadata.suspiciousScore > 50;

  return (
    <div className="relative flex gap-4 px-4 py-3">
      {/* Timeline connector */}
      {!isLast && (
        <div className="absolute left-[28px] top-[48px] bottom-0 w-px bg-border/60" />
      )}

      {/* Category icon */}
      <div className="relative shrink-0 mt-0.5">
        <div className={`flex size-8 items-center justify-center rounded-lg border ${catColor}`}>
          <Icon className="size-3.5" />
        </div>
        {/* Severity dot */}
        <span className={`absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-background ${styles.dot}`} />
      </div>

      {/* Card content */}
      <button
        onClick={onClick}
        className={`flex-1 min-w-0 text-left rounded-lg border px-3 py-2.5 transition-all duration-150 group ${
          isSelected
            ? 'border-primary/40 bg-primary/5 shadow-sm'
            : 'border-border bg-card hover:border-border/80 hover:bg-muted/30'
        } ${isSuspicious ? 'ring-1 ring-amber-300/50 dark:ring-amber-500/30' : ''}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1">
            {/* Actor row */}
            <div className="flex items-center gap-2 min-w-0">
              <div className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] text-white ${log.actor.color}`}>
                {log.actor.initials.charAt(0)}
              </div>
              <span className="text-xs text-muted-foreground truncate">{log.actor.name}</span>
              {log.actor.type === 'system' && (
                <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                  <Zap className="size-2.5" /> auto
                </span>
              )}
            </div>

            {/* Action + Target */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs ${styles.badge}`}>
                <ActionIcon type={log.actionType} />
                {log.action}
              </span>
              <span className="text-xs text-muted-foreground">→</span>
              <span className="text-xs text-foreground/80 font-medium truncate">{log.target.label}</span>
            </div>

            {/* Details */}
            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-1">{log.details}</p>

            {/* Suspicious badge */}
            {isSuspicious && (
              <div className="flex items-center gap-1 mt-0.5">
                <AlertTriangle className="size-3 text-amber-500" />
                <span className="text-[10px] text-amber-600 dark:text-amber-400">
                  Risk score: {log.metadata!.suspiciousScore}
                </span>
              </div>
            )}
          </div>

          {/* Timestamp + arrow */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">{log.relativeTime}</span>
            <ChevronRight className={`size-3.5 transition-colors ${isSelected ? 'text-primary' : 'text-muted-foreground/40 group-hover:text-muted-foreground'}`} />
          </div>
        </div>
      </button>
    </div>
  );
}
