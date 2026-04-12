import { useEffect, useMemo, useState } from 'react';
import {
  Search, Download, SlidersHorizontal, X, ChevronDown, Activity,
  FileText, PanelRightOpen, PanelRightClose
} from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { toast } from 'sonner';
import {
  type LogEntry,
  type LogCategory,
  adminLogs as fallbackAdminLogs,
  userLogs as fallbackUserLogs,
} from '../data/logsData';
import { LogCard } from '../components/logs/LogCard';
import { LogDetailPanel } from '../components/logs/LogDetailPanel';
import { LogInsightsPanel } from '../components/logs/LogInsightsPanel';
import { fetchRecentLogEntries } from '../lib/backendAdapters';

function groupByDate(logs: LogEntry[]): Array<{ label: string; entries: LogEntry[] }> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const groups: Record<string, LogEntry[]> = {
    Today: [],
    Yesterday: [],
    'Earlier this week': [],
    Older: [],
  };

  for (const log of logs) {
    const d = new Date(log.timestamp.getFullYear(), log.timestamp.getMonth(), log.timestamp.getDate());
    if (d.getTime() === today.getTime()) groups['Today'].push(log);
    else if (d.getTime() === yesterday.getTime()) groups['Yesterday'].push(log);
    else if (d >= weekAgo) groups['Earlier this week'].push(log);
    else groups['Older'].push(log);
  }

  return Object.entries(groups)
    .filter(([, entries]) => entries.length > 0)
    .map(([label, entries]) => ({ label, entries }));
}

function exportLogs(logs: LogEntry[], format: 'csv' | 'json') {
  if (format === 'json') {
    const data = logs.map((log) => ({
      id: log.id,
      actor: log.actor.name,
      email: log.actor.email,
      action: log.action,
      target: log.target.label,
      category: log.category,
      timestamp: log.timestamp.toISOString(),
      details: log.details,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${Date.now()}.json`;
    a.click();
    return;
  }

  const headers = 'id,actor,email,action,target,category,timestamp,details';
  const rows = logs.map((log) =>
    [
      log.id,
      log.actor.name,
      log.actor.email,
      log.action,
      log.target.label,
      log.category,
      log.timestamp.toISOString(),
      `"${log.details.replace(/"/g, '""')}"`,
    ].join(',')
  );
  const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `logs-${Date.now()}.csv`;
  a.click();
}

const ALL_CATEGORIES: LogCategory[] = ['auth', 'user', 'content', 'report', 'admin', 'settings', 'coding', 'system'];

export default function ActivityLogsPage() {
  const [activeTab, setActiveTab] = useState<'admin' | 'user'>('admin');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [actorFilter, setActorFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [showInsights, setShowInsights] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [apiLogs, setApiLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const logs = await fetchRecentLogEntries(300);
        setApiLogs(logs);
      } catch {
        setApiLogs([]);
      }
    };

    loadLogs();
  }, []);

  const currentLogs = useMemo(() => {
    if (apiLogs.length > 0) {
      return activeTab === 'admin'
        ? apiLogs.filter((log) => log.category !== 'auth')
        : apiLogs.filter((log) => log.category === 'auth' || log.category === 'user');
    }

    return activeTab === 'admin' ? fallbackAdminLogs : fallbackUserLogs;
  }, [activeTab, apiLogs]);

  const filteredLogs = useMemo(() => {
    return currentLogs.filter((log) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        log.action.toLowerCase().includes(q) ||
        log.target.label.toLowerCase().includes(q) ||
        log.actor.name.toLowerCase().includes(q) ||
        log.actor.email.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q);
      const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
      const matchesActor = actorFilter === 'all' || log.actor.email === actorFilter;
      return matchesSearch && matchesCategory && matchesActor;
    });
  }, [currentLogs, searchQuery, categoryFilter, actorFilter]);

  const grouped = useMemo(() => groupByDate(filteredLogs), [filteredLogs]);
  const uniqueActors = useMemo(() => [...new Set(currentLogs.map((log) => log.actor.email))], [currentLogs]);
  const activeFilters = [categoryFilter !== 'all', actorFilter !== 'all'].filter(Boolean).length;

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'admin' | 'user');
    setCategoryFilter('all');
    setActorFilter('all');
    setSearchQuery('');
    setSelectedLog(null);
  };

  return (
    <div className="flex flex-col space-y-0 -m-6" style={{ height: 'calc(100vh - 56px)' }}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/80 backdrop-blur-sm">
        <div>
          <h1 className="text-xl tracking-tight">Activity Logs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Audit trail for admin actions and platform events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className={`gap-1.5 ${showInsights ? 'text-primary' : ''}`}
            onClick={() => setShowInsights(!showInsights)}
          >
            {showInsights ? <PanelRightClose className="size-4" /> : <PanelRightOpen className="size-4" />}
            Insights
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="size-3.5" />
                Export
                <ChevronDown className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  exportLogs(filteredLogs, 'csv');
                  toast.success(`Exported ${filteredLogs.length} logs as CSV`);
                }}
              >
                <FileText className="size-3.5 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  exportLogs(filteredLogs, 'json');
                  toast.success(`Exported ${filteredLogs.length} logs as JSON`);
                }}
              >
                <FileText className="size-3.5 mr-2" />
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="px-6 pt-4 border-b border-border space-y-3 bg-background">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <div className="flex items-center justify-between gap-4">
            <TabsList className="h-8">
              <TabsTrigger value="admin" className="text-xs px-3 h-6">
                Admin Logs
                <span className="ml-1.5 inline-flex size-4 items-center justify-center rounded-full bg-muted text-[10px] text-muted-foreground">
                  {activeTab === 'admin' ? currentLogs.length : (apiLogs.length > 0 ? apiLogs.filter((log) => log.category !== 'auth').length : fallbackAdminLogs.length)}
                </span>
              </TabsTrigger>
              <TabsTrigger value="user" className="text-xs px-3 h-6">
                User Logs
                <span className="ml-1.5 inline-flex size-4 items-center justify-center rounded-full bg-muted text-[10px] text-muted-foreground">
                  {activeTab === 'user' ? currentLogs.length : (apiLogs.length > 0 ? apiLogs.filter((log) => log.category === 'auth' || log.category === 'user').length : fallbackUserLogs.length)}
                </span>
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2 flex-1 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by actor, action, target..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
                {searchQuery && (
                  <button
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 shrink-0"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="size-3.5" />
                Filters
                {activeFilters > 0 && (
                  <span className="inline-flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                    {activeFilters}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="flex items-center gap-3 pb-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-7 w-[150px] text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {ALL_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={actorFilter} onValueChange={setActorFilter}>
                <SelectTrigger className="h-7 w-[220px] text-xs">
                  <SelectValue placeholder="Actor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actors</SelectItem>
                  {uniqueActors.map((email) => (
                    <SelectItem key={email} value={email} className="text-xs">{email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {activeFilters > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => { setCategoryFilter('all'); setActorFilter('all'); }}
                >
                  <X className="size-3 mr-1" />
                  Clear filters
                </Button>
              )}
            </div>
          )}

          <div className="flex items-center gap-1.5 pb-3 flex-wrap">
            {['all', ...ALL_CATEGORIES].map((cat) => {
              const count = cat === 'all'
                ? currentLogs.length
                : currentLogs.filter((log) => log.category === cat).length;
              if (count === 0) return null;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] transition-colors ${
                    categoryFilter === cat
                      ? 'border-primary/50 bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="capitalize">{cat === 'all' ? 'All' : cat}</span>
                  <span className="tabular-nums opacity-70">{count}</span>
                </button>
              );
            })}
          </div>

          <TabsContent value={activeTab} className="mt-0" />
        </Tabs>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="py-2">
            {grouped.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Activity className="size-10 text-muted-foreground/20 mb-3" />
                <p className="text-sm text-muted-foreground">No matching log entries</p>
                {(searchQuery || categoryFilter !== 'all' || actorFilter !== 'all') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-xs"
                    onClick={() => {
                      setSearchQuery('');
                      setCategoryFilter('all');
                      setActorFilter('all');
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              grouped.map((group) => (
                <div key={group.label}>
                  <div className="flex items-center gap-3 px-4 py-2 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
                    <span className="text-[11px] text-muted-foreground/70 uppercase tracking-wider shrink-0">
                      {group.label}
                    </span>
                    <div className="flex-1 h-px bg-border/50" />
                    <span className="text-[10px] text-muted-foreground/50 tabular-nums shrink-0">
                      {group.entries.length} {group.entries.length === 1 ? 'event' : 'events'}
                    </span>
                  </div>

                  {group.entries.map((log, idx) => (
                    <LogCard
                      key={log.id}
                      log={log}
                      isSelected={selectedLog?.id === log.id}
                      onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                      isLast={idx === group.entries.length - 1}
                    />
                  ))}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {selectedLog && (
          <div className="w-[360px] border-l border-border bg-card shrink-0 overflow-hidden">
            <LogDetailPanel log={selectedLog} onClose={() => setSelectedLog(null)} />
          </div>
        )}

        {showInsights && (
          <div className="w-[320px] border-l border-border bg-card shrink-0 overflow-hidden">
            <LogInsightsPanel logs={filteredLogs} logType={activeTab} />
          </div>
        )}
      </div>
    </div>
  );
}
