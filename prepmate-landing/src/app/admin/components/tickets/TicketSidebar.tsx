import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLink,
  Clock,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  ArrowUpCircle,
  X,
  Plus,
  ChevronDown,
  User,
  Calendar,
  Timer,
  Hash,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import {
  SupportTicket,
  TicketStatus,
  TicketPriority,
  TicketTag,
  availableTags,
  supportAdmins,
  ticketStatusConfig,
  ticketPriorityConfig,
} from '../../data/ticketData';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { ActivityTimeline } from './ActivityTimeline';
import { Button } from '../../../components/ui/button';
import { Avatar, AvatarFallback } from '../../../components/ui/avatar';
import { Separator } from '../../../components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../components/ui/tooltip';

interface TicketSidebarProps {
  ticket: SupportTicket;
  onStatusChange: (status: TicketStatus) => void;
  onPriorityChange: (priority: TicketPriority) => void;
  onAssign: (adminId: string | undefined, adminName: string | undefined) => void;
  onTagAdd: (tag: TicketTag) => void;
  onTagRemove: (tag: TicketTag) => void;
  onResolve: () => void;
  onReopen: () => void;
  onClose: () => void;
  onEscalate: () => void;
  assigneeOptions?: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    ticketCount: number;
    initials: string;
  }>;
}

export function TicketSidebar({
  ticket,
  onStatusChange,
  onPriorityChange,
  onAssign,
  onTagAdd,
  onTagRemove,
  onResolve,
  onReopen,
  onClose,
  onEscalate,
  assigneeOptions,
}: TicketSidebarProps) {
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);

  const isResolved = ticket.status === 'resolved';
  const isClosed = ticket.status === 'closed';
  const isLocked = isResolved || isClosed;

  const availableTagsToAdd = availableTags.filter(
    (t) => !ticket.tags.includes(t.value)
  );

  const tagConfig = availableTags.reduce<Record<string, string>>((acc, t) => {
    acc[t.value] = t.className;
    return acc;
  }, {});

  const assignees = Array.isArray(assigneeOptions) && assigneeOptions.length > 0
    ? assigneeOptions
    : supportAdmins;

  const assignedAdmin = ticket.assignedToId
    ? assignees.find((a) => a.id === ticket.assignedToId)
    : null;

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-5">
        {/* Ticket ID + SLA */}
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Hash className="size-3.5 text-muted-foreground" />
              <span className="text-sm text-foreground tracking-tight">{ticket.id}</span>
            </div>
            <StatusBadge status={ticket.status} size="sm" />
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground block">Created</span>
              <span className="text-foreground">{ticket.createdAt}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Last activity</span>
              <span className="text-foreground">{ticket.lastActivity}</span>
            </div>
          </div>

          {/* SLA */}
          <div className={cn(
            'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs',
            ticket.slaBreached
              ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
          )}>
            {ticket.slaBreached ? (
              <AlertCircle className="size-3 shrink-0" />
            ) : (
              <Timer className="size-3 shrink-0" />
            )}
            <span>
              {ticket.slaBreached
                ? 'SLA Breached'
                : `SLA due: ${ticket.slaDue}`}
            </span>
          </div>

          {/* SLA metrics */}
          {(ticket.slaFirstResponse || ticket.slaResolution) && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              {ticket.slaFirstResponse && (
                <div className="rounded bg-muted px-2 py-1.5">
                  <span className="text-muted-foreground block text-[11px]">First response</span>
                  <span className="text-foreground">{ticket.slaFirstResponse}</span>
                </div>
              )}
              {ticket.slaResolution && (
                <div className="rounded bg-muted px-2 py-1.5">
                  <span className="text-muted-foreground block text-[11px]">Resolution</span>
                  <span className="text-foreground">{ticket.slaResolution}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User info */}
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70 mb-2">User</p>
          <div className="flex items-center gap-2.5">
            <Avatar className="size-8 shrink-0">
              <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                {ticket.userName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-sm truncate">{ticket.userName}</span>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        to={`/admin/users/${ticket.userId}`}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <ExternalLink className="size-3" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-xs">View profile</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="text-xs text-muted-foreground truncate block">{ticket.userEmail}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Status & Priority */}
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70">Ticket Details</p>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Status</span>
              <Select
                value={ticket.status}
                onValueChange={(v) => onStatusChange(v as TicketStatus)}
                disabled={isClosed}
              >
                <SelectTrigger className="h-7 w-auto gap-1.5 text-xs border-0 bg-transparent pr-1 hover:bg-muted rounded-md focus:ring-0">
                  <StatusBadge status={ticket.status} size="sm" />
                  <ChevronDown className="size-3 text-muted-foreground" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ticketStatusConfig) as TicketStatus[]).map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">
                      <StatusBadge status={s} size="sm" />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Priority</span>
              <Select
                value={ticket.priority}
                onValueChange={(v) => onPriorityChange(v as TicketPriority)}
                disabled={isLocked}
              >
                <SelectTrigger className="h-7 w-auto gap-1.5 text-xs border-0 bg-transparent pr-1 hover:bg-muted rounded-md focus:ring-0">
                  <PriorityBadge priority={ticket.priority} size="sm" />
                  <ChevronDown className="size-3 text-muted-foreground" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ticketPriorityConfig) as TicketPriority[]).map((p) => (
                    <SelectItem key={p} value={p} className="text-xs">
                      <PriorityBadge priority={p} size="sm" />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* Assignment */}
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70">Assigned To</p>
          {assignedAdmin ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Avatar className="size-6">
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                      {assignedAdmin.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={cn(
                      'absolute -bottom-0.5 -right-0.5 size-2 rounded-full border border-card',
                      assignedAdmin.isActive ? 'bg-emerald-500' : 'bg-muted-foreground'
                    )}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs truncate">{assignedAdmin.name}</p>
                  <p className="text-[11px] text-muted-foreground">{assignedAdmin.role}</p>
                </div>
              </div>
              {!isLocked && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground px-2">
                      Reassign
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem onClick={() => onAssign(undefined, undefined)} className="text-xs text-muted-foreground">
                      Unassign
                    </DropdownMenuItem>
                    {assignees
                      .filter((a) => a.id !== ticket.assignedToId)
                      .map((admin) => (
                        <DropdownMenuItem
                          key={admin.id}
                          onClick={() => onAssign(admin.id, admin.name)}
                          className="text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="size-5">
                              <AvatarFallback className="bg-primary/10 text-primary text-[9px]">
                                {admin.initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p>{admin.name}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {admin.ticketCount} tickets
                                {!admin.isActive && ' · offline'}
                              </p>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Not assigned</p>
              {!isLocked && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full h-7 text-xs gap-1.5">
                      <User className="size-3" />
                      Assign to admin
                      <ChevronDown className="size-3 ml-auto" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-52">
                    {assignees.map((admin) => (
                      <DropdownMenuItem
                        key={admin.id}
                        onClick={() => onAssign(admin.id, admin.name)}
                        className="text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Avatar className="size-5">
                              <AvatarFallback className="bg-primary/10 text-primary text-[9px]">
                                {admin.initials}
                              </AvatarFallback>
                            </Avatar>
                            <span
                              className={cn(
                                'absolute -bottom-0.5 -right-0.5 size-1.5 rounded-full border border-popover',
                                admin.isActive ? 'bg-emerald-500' : 'bg-muted-foreground'
                              )}
                            />
                          </div>
                          <div>
                            <p>{admin.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {admin.ticketCount} open
                              {!admin.isActive && ' · offline'}
                            </p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Tags */}
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70">Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {ticket.tags.map((tag) => {
              const cfg = availableTags.find((t) => t.value === tag);
              return (
                <span
                  key={tag}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]',
                    cfg?.className ?? 'bg-muted text-muted-foreground border-border'
                  )}
                >
                  {cfg?.label ?? tag}
                  {!isLocked && (
                    <button
                      onClick={() => onTagRemove(tag)}
                      className="opacity-60 hover:opacity-100 transition-opacity"
                    >
                      <X className="size-2.5" />
                    </button>
                  )}
                </span>
              );
            })}

            {!isLocked && availableTagsToAdd.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-[11px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
                    <Plus className="size-2.5" />
                    Add tag
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  {availableTagsToAdd.map((tag) => (
                    <DropdownMenuItem
                      key={tag.value}
                      onClick={() => onTagAdd(tag.value)}
                      className="text-xs"
                    >
                      <span className={cn('mr-2 rounded-full border px-2 py-0.5 text-[11px]', tag.className)}>
                        {tag.label}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {ticket.tags.length === 0 && isLocked && (
              <span className="text-xs text-muted-foreground">No tags</span>
            )}
          </div>
        </div>

        {/* Linked tickets */}
        {ticket.linkedTickets.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70">Linked Tickets</p>
              <div className="space-y-1">
                {ticket.linkedTickets.map((id) => (
                  <Link
                    key={id}
                    to={`/admin/help/${id}`}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Hash className="size-3" />
                    {id}
                    <ExternalLink className="size-3 ml-auto" />
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Actions */}
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70">Actions</p>
          <div className="space-y-1.5">
            {!isLocked && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs gap-2 justify-start hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400"
                  onClick={() => setResolveDialogOpen(true)}
                >
                  <CheckCircle2 className="size-3.5" />
                  Mark as Resolved
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs gap-2 justify-start hover:bg-red-50 hover:text-red-700 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  onClick={onEscalate}
                >
                  <ArrowUpCircle className="size-3.5" />
                  Escalate Ticket
                </Button>
              </>
            )}

            {isResolved && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs gap-2 justify-start"
                  onClick={onReopen}
                >
                  <RotateCcw className="size-3.5" />
                  Reopen Ticket
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs gap-2 justify-start text-muted-foreground"
                  onClick={() => setCloseDialogOpen(true)}
                >
                  <X className="size-3.5" />
                  Close Ticket
                </Button>
              </>
            )}

            {isClosed && (
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs gap-2 justify-start"
                onClick={onReopen}
              >
                <RotateCcw className="size-3.5" />
                Reopen Ticket
              </Button>
            )}
          </div>
        </div>

        <Separator />

        {/* Activity timeline */}
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70">Activity</p>
          <ActivityTimeline events={ticket.timeline} />
        </div>
      </div>

      {/* Resolve confirm dialog */}
      <AlertDialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resolve ticket {ticket.id}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the ticket as resolved and notify the user. You can reopen it at any time if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onResolve();
                setResolveDialogOpen(false);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Mark as Resolved
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Close confirm dialog */}
      <AlertDialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close ticket {ticket.id}?</AlertDialogTitle>
            <AlertDialogDescription>
              Closing a ticket archives it permanently. The user will no longer be able to reply. You can still reopen it if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onClose();
                setCloseDialogOpen(false);
              }}
            >
              Close Ticket
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScrollArea>
  );
}
