export type LogCategory =
  | 'auth'
  | 'user'
  | 'content'
  | 'report'
  | 'admin'
  | 'settings'
  | 'coding'
  | 'system';
export type LogActorType = 'admin' | 'user' | 'system';
export type LogActionType = 'destructive' | 'warning' | 'info' | 'success' | 'muted';

export interface LogActor {
  name: string;
  email: string;
  type: LogActorType;
  initials: string;
  color: string;
}

export interface LogTarget {
  label: string;
  type: 'user' | 'content' | 'report' | 'system' | 'problem' | 'admin' | 'role' | 'coupon';
  id?: string;
  href?: string;
}

export interface LogMetadata {
  ip?: string;
  device?: string;
  browser?: string;
  os?: string;
  reason?: string;
  language?: string;
  result?: 'accepted' | 'wrong_answer' | 'time_limit_exceeded' | 'runtime_error' | 'compile_error';
  runtime?: string;
  memory?: string;
  before?: Record<string, string>;
  after?: Record<string, string>;
  relatedEntities?: Array<{ label: string; type: string; id: string }>;
  duration?: string;
  affectedCount?: number;
  suspiciousScore?: number;
}

export interface LogEntry {
  id: string;
  actor: LogActor;
  action: string;
  actionType: LogActionType;
  target: LogTarget;
  timestamp: Date;
  relativeTime: string;
  category: LogCategory;
  details: string;
  metadata?: LogMetadata;
}

export function getLogInsights(logs: LogEntry[]) {
  const actionCounts: Record<string, number> = {};
  const actorCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  const suspiciousEntries: LogEntry[] = [];

  for (const log of logs) {
    actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    actorCounts[log.actor.name] = (actorCounts[log.actor.name] || 0) + 1;
    categoryCounts[log.category] = (categoryCounts[log.category] || 0) + 1;
    if (log.actionType === 'destructive' || (log.metadata?.suspiciousScore && log.metadata.suspiciousScore > 50)) {
      suspiciousEntries.push(log);
    }
  }

  const topActions = Object.entries(actionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topActors = Object.entries(actorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return { topActions, topActors, categoryCounts, suspiciousEntries };
}
