import { useNavigate } from 'react-router-dom';
import { cn } from '../../../lib/utils';
import {
  SupportTicket,
  TicketStatus,
  TicketPriority,
  availableTags,
  getUnreadCount,
} from '../../data/ticketData';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { Avatar, AvatarFallback } from '../../../components/ui/avatar';
import { Badge } from '../../../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { AlertCircle, Hash, MessageCircle, User } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../components/ui/tooltip';

interface TicketTableProps {
  tickets: SupportTicket[];
}

export function TicketTable({ tickets }: TicketTableProps) {
  const navigate = useNavigate();

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <MessageCircle className="size-10 text-muted-foreground/20 mb-3" />
        <p className="text-sm text-muted-foreground">No tickets match your filters</p>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[110px]">
              <div className="flex items-center gap-1.5">
                <Hash className="size-3 text-muted-foreground/60" />
                Ticket ID
              </div>
            </TableHead>
            <TableHead>User</TableHead>
            <TableHead className="max-w-[280px]">Subject</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Last Activity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => {
            const unread = getUnreadCount(ticket);
            const isLocked = ticket.status === 'resolved' || ticket.status === 'closed';

            return (
              <TableRow
                key={ticket.id}
                className={cn(
                  'cursor-pointer transition-colors',
                  unread > 0 && 'bg-primary/[0.02]'
                )}
                onClick={() => navigate(`/admin/help/${ticket.id}`)}
              >
                {/* Ticket ID */}
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {unread > 0 && (
                      <span className="size-1.5 rounded-full bg-primary shrink-0" />
                    )}
                    <span className={cn(
                      'text-xs font-mono',
                      unread > 0 ? 'text-primary' : 'text-muted-foreground'
                    )}>
                      {ticket.id}
                    </span>
                    {ticket.slaBreached && !isLocked && (
                      <Tooltip>
                        <TooltipTrigger>
                          <AlertCircle className="size-3 text-red-500 shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">SLA breached</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TableCell>

                {/* User */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="size-7 shrink-0">
                      <AvatarFallback className="text-[11px] bg-muted text-muted-foreground">
                        {ticket.userName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className={cn('text-sm truncate', unread > 0 && 'text-foreground')}>{ticket.userName}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{ticket.userEmail}</p>
                    </div>
                  </div>
                </TableCell>

                {/* Subject */}
                <TableCell className="max-w-[280px]">
                  <div className="space-y-1">
                    <p className={cn('text-sm truncate', unread > 0 && '')}>{ticket.subject}</p>
                    <div className="flex items-center gap-1 flex-wrap">
                      {ticket.tags.slice(0, 2).map((tag) => {
                        const cfg = availableTags.find((t) => t.value === tag);
                        return (
                          <span
                            key={tag}
                            className={cn(
                              'rounded-full border px-1.5 py-px text-[10px]',
                              cfg?.className ?? 'bg-muted text-muted-foreground border-border'
                            )}
                          >
                            {cfg?.label ?? tag}
                          </span>
                        );
                      })}
                      {ticket.tags.length > 2 && (
                        <span className="text-[10px] text-muted-foreground">+{ticket.tags.length - 2}</span>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Priority */}
                <TableCell>
                  <PriorityBadge priority={ticket.priority} size="sm" />
                </TableCell>

                {/* Status */}
                <TableCell>
                  <StatusBadge status={ticket.status} size="sm" />
                </TableCell>

                {/* Assigned To */}
                <TableCell>
                  {ticket.assignedTo ? (
                    <div className="flex items-center gap-1.5">
                      <Avatar className="size-5">
                        <AvatarFallback className="bg-primary/10 text-primary text-[9px]">
                          {ticket.assignedTo.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                        {ticket.assignedTo.split(' ')[0]}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground/50">Unassigned</span>
                  )}
                </TableCell>

                {/* Last Activity */}
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {unread > 0 && (
                      <Badge
                        variant="secondary"
                        className="h-4 px-1.5 text-[10px] rounded-full bg-primary/10 text-primary border-primary/20"
                      >
                        {unread} new
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">{ticket.lastActivity}</span>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TooltipProvider>
  );
}
