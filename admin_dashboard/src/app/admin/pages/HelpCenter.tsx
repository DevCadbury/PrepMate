import { useState, useMemo } from 'react';
import { Search, Filter, AlertCircle, Clock, CheckCircle2, Inbox, ChevronDown } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Separator } from '../../components/ui/separator';
import { cn } from '../../lib/utils';
import {
  mockTickets,
  getTicketStats,
  TicketStatus,
  TicketPriority,
  supportAdmins,
} from '../data/ticketData';
import { TicketTable } from '../components/tickets/TicketTable';

const statCards = (stats: ReturnType<typeof getTicketStats>) => [
  {
    label: 'Open',
    value: stats.open,
    icon: Inbox,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
  },
  {
    label: 'In Progress',
    value: stats.inProgress,
    icon: Clock,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
  },
  {
    label: 'Waiting',
    value: stats.waitingForUser,
    icon: Clock,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-900/20',
  },
  {
    label: 'Resolved',
    value: stats.resolved,
    icon: CheckCircle2,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
  {
    label: 'SLA Breached',
    value: stats.slaBreached,
    icon: AlertCircle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
  },
  {
    label: 'Unassigned',
    value: stats.unassigned,
    icon: Filter,
    color: 'text-muted-foreground',
    bg: 'bg-muted',
  },
];

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');

  const stats = getTicketStats();
  const cards = statCards(stats);

  const filteredTickets = useMemo(() => {
    return mockTickets.filter((ticket) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        ticket.id.toLowerCase().includes(q) ||
        ticket.userEmail.toLowerCase().includes(q) ||
        ticket.userName.toLowerCase().includes(q) ||
        ticket.subject.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'all' || ticket.status === statusFilter;

      const matchesPriority =
        priorityFilter === 'all' || ticket.priority === priorityFilter;

      const matchesAssignee =
        assigneeFilter === 'all' ||
        (assigneeFilter === 'unassigned' ? !ticket.assignedToId : ticket.assignedToId === assigneeFilter);

      return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
    });
  }, [searchQuery, statusFilter, priorityFilter, assigneeFilter]);

  const hasActiveFilters =
    statusFilter !== 'all' || priorityFilter !== 'all' || assigneeFilter !== 'all' || searchQuery;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl tracking-tight">Help Center</h1>
          <p className="text-sm text-muted-foreground">
            Manage support tickets, user requests, and escalations
          </p>
        </div>
        <div className="flex items-center gap-2">
          {stats.unassigned > 0 && (
            <div className="flex items-center gap-1.5 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-1.5">
              <AlertCircle className="size-3.5 text-amber-600 dark:text-amber-400" />
              <span className="text-xs text-amber-700 dark:text-amber-400">
                {stats.unassigned} unassigned ticket{stats.unassigned > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-6 gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-lg border border-border bg-card p-3 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{card.label}</span>
                <div className={cn('flex size-6 items-center justify-center rounded-md', card.bg)}>
                  <Icon className={cn('size-3', card.color)} />
                </div>
              </div>
              <p className={cn('text-2xl tracking-tight', card.color)}>{card.value}</p>
            </div>
          );
        })}
      </div>

      <Separator />

      {/* Filters row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by ID, email, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[148px] h-9 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="waiting_for_user">Waiting</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[140px] h-9 text-sm">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignees</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {supportAdmins.map((admin) => (
              <SelectItem key={admin.id} value={admin.id}>
                {admin.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-xs text-muted-foreground"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setPriorityFilter('all');
              setAssigneeFilter('all');
            }}
          >
            Clear filters
          </Button>
        )}

        <div className="ml-auto text-xs text-muted-foreground">
          {filteredTickets.length} of {mockTickets.length} tickets
        </div>
      </div>

      {/* Ticket table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <TicketTable tickets={filteredTickets} />
      </div>
    </div>
  );
}
