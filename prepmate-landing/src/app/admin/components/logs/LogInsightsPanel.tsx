import { TrendingUp, AlertTriangle, Users, BarChart2 } from 'lucide-react';
import type { LogEntry } from '../../data/logsData';
import { getLogInsights } from '../../data/logsData';

interface LogInsightsPanelProps {
  logs: LogEntry[];
  logType: 'admin' | 'user';
}

export function LogInsightsPanel({ logs, logType }: LogInsightsPanelProps) {
  const { topActions, topActors, categoryCounts, suspiciousEntries } = getLogInsights(logs);
  const totalLogs = logs.length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="rounded-lg border border-border bg-card p-3 space-y-3">
        <div className="flex items-center gap-2">
          <BarChart2 className="size-3.5 text-muted-foreground" />
          <span className="text-xs">Activity Summary</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md bg-muted/40 p-2 text-center">
            <p className="text-lg tabular-nums">{totalLogs}</p>
            <p className="text-[10px] text-muted-foreground">Total Events</p>
          </div>
          <div className="rounded-md bg-muted/40 p-2 text-center">
            <p className={`text-lg tabular-nums ${suspiciousEntries.length > 0 ? 'text-amber-600 dark:text-amber-400' : ''}`}>
              {suspiciousEntries.length}
            </p>
            <p className="text-[10px] text-muted-foreground">Risk Events</p>
          </div>
        </div>
      </div>

      {/* Top actions */}
      <div className="rounded-lg border border-border bg-card p-3 space-y-2.5">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-3.5 text-muted-foreground" />
          <span className="text-xs">Top Actions</span>
        </div>
        <div className="space-y-1.5">
          {topActions.map(([action, count]) => {
            const pct = Math.round((count / totalLogs) * 100);
            return (
              <div key={action} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground truncate max-w-[140px]">{action}</span>
                  <span className="text-[11px] tabular-nums">{count}</span>
                </div>
                <div className="h-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/60 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top actors */}
      <div className="rounded-lg border border-border bg-card p-3 space-y-2.5">
        <div className="flex items-center gap-2">
          <Users className="size-3.5 text-muted-foreground" />
          <span className="text-xs">Most Active {logType === 'admin' ? 'Admins' : 'Users'}</span>
        </div>
        <div className="space-y-2">
          {topActors.map(([name, count], idx) => (
            <div key={name} className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground/60 w-3 tabular-nums">{idx + 1}.</span>
              <span className="flex-1 text-xs truncate">{name}</span>
              <span className="text-[11px] tabular-nums text-muted-foreground">{count} actions</span>
            </div>
          ))}
        </div>
      </div>

      {/* Categories breakdown */}
      <div className="rounded-lg border border-border bg-card p-3 space-y-2.5">
        <div className="flex items-center gap-2">
          <BarChart2 className="size-3.5 text-muted-foreground" />
          <span className="text-xs">By Category</span>
        </div>
        <div className="space-y-1.5">
          {Object.entries(categoryCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, count]) => {
              const pct = Math.round((count / totalLogs) * 100);
              return (
                <div key={cat} className="flex items-center gap-2">
                  <span className="w-14 text-[10px] text-muted-foreground capitalize truncate">{cat}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-sky-500/50 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] tabular-nums text-muted-foreground w-4">{count}</span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Risk events */}
      {suspiciousEntries.length > 0 && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-3.5 text-amber-500" />
            <span className="text-xs text-amber-700 dark:text-amber-400">Risk Events</span>
          </div>
          <div className="space-y-1.5">
            {suspiciousEntries.slice(0, 3).map((log) => (
              <div key={log.id} className="rounded-md bg-amber-100/50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/10 px-2 py-1.5">
                <p className="text-[11px] text-amber-800 dark:text-amber-300 line-clamp-1">
                  {log.actor.name} — {log.action}
                </p>
                <p className="text-[10px] text-amber-600/80 dark:text-amber-400/70">{log.relativeTime}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
