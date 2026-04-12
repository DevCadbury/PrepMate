import { X, ExternalLink, Shield, User, FileText, Flag, Settings, Activity, Lock, Code, Cpu, ArrowRight, AlertTriangle, Monitor, Globe, Smartphone } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Separator } from '../../../components/ui/separator';
import type { LogEntry, LogCategory } from '../../data/logsData';

const categoryLabels: Record<LogCategory, string> = {
  auth: 'Authentication',
  user: 'User Management',
  content: 'Content',
  report: 'Reports',
  admin: 'Administration',
  settings: 'Settings',
  coding: 'Coding Platform',
  system: 'System',
};

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

function DeviceIcon({ device }: { device?: string }) {
  if (!device) return <Monitor className="size-3.5" />;
  if (device.toLowerCase().includes('mobile')) return <Smartphone className="size-3.5" />;
  return <Monitor className="size-3.5" />;
}

interface LogDetailPanelProps {
  log: LogEntry | null;
  onClose: () => void;
}

export function LogDetailPanel({ log, onClose }: LogDetailPanelProps) {
  if (!log) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div className="space-y-2">
          <Activity className="mx-auto size-10 text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground">Select a log entry to inspect details</p>
        </div>
      </div>
    );
  }

  const Icon = categoryIcons[log.category] || Activity;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground" />
          <span className="text-sm">{categoryLabels[log.category]}</span>
        </div>
        <Button variant="ghost" size="icon" className="size-7" onClick={onClose}>
          <X className="size-3.5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          {/* Action summary */}
          <div className="rounded-lg bg-muted/40 border border-border p-3 space-y-3">
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-xs text-white ${log.actor.color}`}>
                {log.actor.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm">{log.actor.name}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {log.actor.type}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{log.actor.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm pl-0.5">
              <span className="text-foreground">{log.action}</span>
              <ArrowRight className="size-3.5 text-muted-foreground" />
              <span className="text-foreground/80">{log.target.label}</span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed pl-0.5">{log.details}</p>
          </div>

          {/* Timestamps */}
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Timestamp</p>
            <div className="flex items-center justify-between">
              <span className="text-sm">{log.relativeTime}</span>
              <span className="text-xs text-muted-foreground">
                {log.timestamp.toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          <Separator />

          {/* Reason */}
          {log.metadata?.reason && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Reason</p>
              <div className="rounded-md bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 px-3 py-2">
                <p className="text-xs text-red-700 dark:text-red-400">{log.metadata.reason}</p>
              </div>
            </div>
          )}

          {/* Before → After changes */}
          {(log.metadata?.before || log.metadata?.after) && (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Changes</p>
              <div className="grid grid-cols-2 gap-2">
                {log.metadata.before && (
                  <div className="rounded-md bg-red-50/60 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10 p-2.5 space-y-1">
                    <p className="text-[10px] text-red-500 dark:text-red-400 mb-1.5">Before</p>
                    {Object.entries(log.metadata.before).map(([k, v]) => (
                      <div key={k}>
                        <p className="text-[10px] text-muted-foreground capitalize">{k.replace(/_/g, ' ')}</p>
                        <p className="text-xs font-mono break-all">{v}</p>
                      </div>
                    ))}
                  </div>
                )}
                {log.metadata.after && (
                  <div className="rounded-md bg-emerald-50/60 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 p-2.5 space-y-1">
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mb-1.5">After</p>
                    {Object.entries(log.metadata.after).map(([k, v]) => (
                      <div key={k}>
                        <p className="text-[10px] text-muted-foreground capitalize">{k.replace(/_/g, ' ')}</p>
                        <p className="text-xs font-mono break-all">{v}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Coding metadata */}
          {log.metadata?.language && (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Submission Details</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md bg-muted/50 border border-border px-2.5 py-2 space-y-0.5">
                  <p className="text-[10px] text-muted-foreground">Language</p>
                  <p className="text-xs">{log.metadata.language}</p>
                </div>
                <div className="rounded-md bg-muted/50 border border-border px-2.5 py-2 space-y-0.5">
                  <p className="text-[10px] text-muted-foreground">Result</p>
                  <p className={`text-xs capitalize ${
                    log.metadata.result === 'accepted' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                  }`}>
                    {log.metadata.result?.replace(/_/g, ' ')}
                  </p>
                </div>
                {log.metadata.runtime && (
                  <div className="rounded-md bg-muted/50 border border-border px-2.5 py-2 space-y-0.5">
                    <p className="text-[10px] text-muted-foreground">Runtime</p>
                    <p className="text-xs font-mono">{log.metadata.runtime}</p>
                  </div>
                )}
                {log.metadata.memory && (
                  <div className="rounded-md bg-muted/50 border border-border px-2.5 py-2 space-y-0.5">
                    <p className="text-[10px] text-muted-foreground">Memory</p>
                    <p className="text-xs font-mono">{log.metadata.memory}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Auth / IP metadata */}
          {(log.metadata?.ip || log.metadata?.device) && (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Device & Network</p>
              <div className="rounded-md border border-border p-3 space-y-2.5">
                {log.metadata.ip && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Globe className="size-3.5" />
                      IP Address
                    </div>
                    <span className="text-xs font-mono">{log.metadata.ip}</span>
                  </div>
                )}
                {log.metadata.device && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <DeviceIcon device={log.metadata.device} />
                      Device
                    </div>
                    <span className="text-xs">{log.metadata.device}</span>
                  </div>
                )}
                {log.metadata.browser && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Activity className="size-3.5" />
                      Browser
                    </div>
                    <span className="text-xs">{log.metadata.browser}</span>
                  </div>
                )}
                {log.metadata.os && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Cpu className="size-3.5" />
                      OS
                    </div>
                    <span className="text-xs">{log.metadata.os}</span>
                  </div>
                )}
              </div>

              {log.metadata.suspiciousScore && log.metadata.suspiciousScore > 50 && (
                <div className="flex items-center gap-2 rounded-md bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 px-3 py-2">
                  <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Suspicious activity score: <span className="font-medium">{log.metadata.suspiciousScore}/100</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Related entities */}
          {log.metadata?.relatedEntities && log.metadata.relatedEntities.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Related Entities</p>
              <div className="space-y-1.5">
                {log.metadata.relatedEntities.map((entity) => (
                  <div key={entity.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{entity.type}</Badge>
                      <span className="text-xs">{entity.label}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="size-6">
                      <ExternalLink className="size-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Affected count */}
          {log.metadata?.affectedCount && (
            <div className="flex items-center justify-between rounded-md bg-muted/40 border border-border px-3 py-2">
              <span className="text-xs text-muted-foreground">Affected users</span>
              <span className="text-xs">{log.metadata.affectedCount}</span>
            </div>
          )}

          {/* Linked entity link */}
          {log.target.href && (
            <Button variant="outline" size="sm" className="w-full gap-1.5" asChild>
              <a href={log.target.href}>
                <ExternalLink className="size-3.5" />
                View {log.target.type === 'user' ? 'User Profile' : log.target.type === 'problem' ? 'Problem' : 'Entity'}
              </a>
            </Button>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
