import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Hash, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  SupportTicket,
  TicketMessage,
  TimelineEvent,
  TicketStatus,
  TicketPriority,
  TicketTag,
  getTicketById,
} from '../data/ticketData';
import { TicketChat } from '../components/tickets/TicketChat';
import { TicketSidebar } from '../components/tickets/TicketSidebar';
import { StatusBadge } from '../components/tickets/StatusBadge';
import { PriorityBadge } from '../components/tickets/PriorityBadge';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';

let msgCounter = 100;
let evtCounter = 100;

function makeTimestamp() {
  return new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [isSimulatingReply, setIsSimulatingReply] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) { setNotFound(true); return; }
    const found = getTicketById(id);
    if (!found) { setNotFound(true); return; }
    setTicket({ ...found });
    setMessages([...found.messages]);
    setTimeline([...found.timeline]);
  }, [id]);

  // ── Messaging ─────────────────────────────────────────────────────────────

  const handleSendMessage = useCallback(
    (content: string, type: 'reply' | 'internal_note') => {
      if (!ticket) return;

      const newMsg: TicketMessage = {
        id: `msg-${++msgCounter}`,
        type,
        senderName: 'Sarah Chen',
        senderEmail: 'sarah.chen@prepmate.io',
        senderRole: 'admin',
        content,
        timestamp: makeTimestamp(),
        isRead: true,
      };
      setMessages((prev) => [...prev, newMsg]);

      const newEvt: TimelineEvent = {
        id: `tl-${++evtCounter}`,
        type: type === 'internal_note' ? 'note_added' : 'message_sent',
        description: type === 'internal_note' ? 'Internal note added' : 'Reply sent to user',
        actor: 'Sarah Chen',
        timestamp: makeTimestamp(),
      };
      setTimeline((prev) => [...prev, newEvt]);

      // Auto-advance status: open → in_progress on first admin reply
      if (type === 'reply' && ticket.status === 'open') {
        setTicket((t) => (t ? { ...t, status: 'in_progress' as TicketStatus } : t));
        setTimeline((prev) => [
          ...prev,
          {
            id: `tl-${++evtCounter}`,
            type: 'status_changed',
            description: 'Status: Open → In Progress',
            actor: 'Sarah Chen',
            timestamp: makeTimestamp(),
          },
        ]);
      }

      toast.success(type === 'internal_note' ? 'Internal note added' : 'Reply sent');

      // Simulated user typing back (~50% chance)
      if (type === 'reply' && Math.random() > 0.5 && ticket.status !== 'resolved') {
        setTimeout(() => setIsSimulatingReply(true), 1400);
        setTimeout(() => {
          setIsSimulatingReply(false);
          setMessages((prev) => [
            ...prev,
            {
              id: `msg-${++msgCounter}`,
              type: 'reply',
              senderName: ticket.userName,
              senderEmail: ticket.userEmail,
              senderRole: 'user',
              content:
                "Thank you for your quick response! I'll follow up if I have any further questions.",
              timestamp: makeTimestamp(),
              isRead: false,
            },
          ]);
        }, 4200);
      }
    },
    [ticket]
  );

  // ── Status ────────────────────────────────────────────────────────────────

  const handleStatusChange = useCallback(
    (status: TicketStatus) => {
      if (!ticket) return;
      const prev = ticket.status;
      setTicket((t) => (t ? { ...t, status } : t));
      setTimeline((tl) => [
        ...tl,
        {
          id: `tl-${++evtCounter}`,
          type: 'status_changed',
          description: `Status: ${prev.replace(/_/g, ' ')} → ${status.replace(/_/g, ' ')}`,
          actor: 'Sarah Chen',
          timestamp: makeTimestamp(),
        },
      ]);
      toast.success(`Status updated to "${status.replace(/_/g, ' ')}"`);
    },
    [ticket]
  );

  const handleResolve = useCallback(() => {
    if (!ticket) return;
    setTicket((t) => (t ? { ...t, status: 'resolved', slaResolution: 'Just now' } : t));
    setTimeline((tl) => [
      ...tl,
      {
        id: `tl-${++evtCounter}`,
        type: 'status_changed',
        description: 'Ticket marked as resolved',
        actor: 'Sarah Chen',
        timestamp: makeTimestamp(),
      },
    ]);
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${++msgCounter}`,
        type: 'system',
        senderName: 'System',
        senderEmail: 'system@prepmate.io',
        senderRole: 'admin',
        content: `Ticket ${ticket.id} has been marked as resolved by Sarah Chen.`,
        timestamp: makeTimestamp(),
        isRead: true,
      },
    ]);
    toast.success('Ticket resolved');
  }, [ticket]);

  const handleReopen = useCallback(() => {
    setTicket((t) => (t ? { ...t, status: 'open' } : t));
    setTimeline((tl) => [
      ...tl,
      {
        id: `tl-${++evtCounter}`,
        type: 'status_changed',
        description: 'Ticket reopened',
        actor: 'Sarah Chen',
        timestamp: makeTimestamp(),
      },
    ]);
    toast.success('Ticket reopened');
  }, []);

  const handleClose = useCallback(() => {
    setTicket((t) => (t ? { ...t, status: 'closed' } : t));
    setTimeline((tl) => [
      ...tl,
      {
        id: `tl-${++evtCounter}`,
        type: 'status_changed',
        description: 'Ticket closed',
        actor: 'Sarah Chen',
        timestamp: makeTimestamp(),
      },
    ]);
    toast.success('Ticket closed');
  }, []);

  const handleEscalate = useCallback(() => {
    setTimeline((tl) => [
      ...tl,
      {
        id: `tl-${++evtCounter}`,
        type: 'escalated',
        description: 'Ticket escalated to Super Admin',
        actor: 'Sarah Chen',
        timestamp: makeTimestamp(),
      },
    ]);
    setTicket((t) =>
      t
        ? {
            ...t,
            priority: 'urgent' as TicketPriority,
            tags: t.tags.includes('escalated' as TicketTag)
              ? t.tags
              : [...t.tags, 'escalated' as TicketTag],
          }
        : t
    );
    toast.success('Ticket escalated — priority set to Urgent');
  }, []);

  // ── Priority / Assignment / Tags ──────────────────────────────────────────

  const handlePriorityChange = useCallback((priority: TicketPriority) => {
    setTicket((t) => (t ? { ...t, priority } : t));
    toast.success(`Priority changed to ${priority}`);
  }, []);

  const handleAssign = useCallback(
    (adminId: string | undefined, adminName: string | undefined) => {
      if (!ticket) return;
      const prevAssignee = ticket.assignedTo;
      setTicket((t) => (t ? { ...t, assignedTo: adminName, assignedToId: adminId } : t));
      setTimeline((tl) => [
        ...tl,
        {
          id: `tl-${++evtCounter}`,
          type: prevAssignee ? 'reassigned' : 'assigned',
          description: adminName
            ? `${prevAssignee ? 'Reassigned' : 'Assigned'} to ${adminName}`
            : 'Ticket unassigned',
          actor: 'Sarah Chen',
          timestamp: makeTimestamp(),
        },
      ]);
      toast.success(adminName ? `Assigned to ${adminName}` : 'Ticket unassigned');
    },
    [ticket]
  );

  const handleTagAdd = useCallback((tag: TicketTag) => {
    setTicket((t) => (t ? { ...t, tags: [...t.tags, tag] } : t));
  }, []);

  const handleTagRemove = useCallback((tag: TicketTag) => {
    setTicket((t) => (t ? { ...t, tags: t.tags.filter((tg) => tg !== tag) } : t));
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
        <AlertCircle className="size-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">Ticket not found.</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/admin/help')}>
          Back to Help Center
        </Button>
      </div>
    );
  }

  if (!ticket) return null;

  const liveTicket: SupportTicket = { ...ticket, messages, timeline };
  const isResolved = ticket.status === 'resolved';
  const isClosed = ticket.status === 'closed';

  return (
    <div className="flex flex-col -m-6" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 py-2.5 border-b border-border bg-card shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/admin/help')}
        >
          <ArrowLeft className="size-3.5" />
          Help Center
        </Button>

        <Separator orientation="vertical" className="h-4" />

        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <Hash className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs font-mono text-muted-foreground shrink-0">{ticket.id}</span>
          </div>
          <Separator orientation="vertical" className="h-3.5 shrink-0" />
          <p className="text-sm truncate text-foreground">{ticket.subject}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {ticket.slaBreached && !isResolved && !isClosed && (
            <div className="flex items-center gap-1 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-2 py-1">
              <AlertCircle className="size-3 text-red-600 dark:text-red-400" />
              <span className="text-[11px] text-red-700 dark:text-red-400">SLA Breached</span>
            </div>
          )}
          <PriorityBadge priority={ticket.priority} size="sm" />
          <StatusBadge status={ticket.status} size="sm" />
        </div>
      </div>

      {/* Workspace split */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat panel */}
        <div className="flex-1 min-w-0 overflow-hidden border-r border-border">
          <TicketChat
            messages={messages}
            onSendMessage={handleSendMessage}
            isResolved={isResolved}
            isClosed={isClosed}
            isSimulatingReply={isSimulatingReply}
          />
        </div>

        {/* Control sidebar */}
        <div className="w-[296px] xl:w-[316px] shrink-0 overflow-hidden bg-card">
          <TicketSidebar
            ticket={liveTicket}
            onStatusChange={handleStatusChange}
            onPriorityChange={handlePriorityChange}
            onAssign={handleAssign}
            onTagAdd={handleTagAdd}
            onTagRemove={handleTagRemove}
            onResolve={handleResolve}
            onReopen={handleReopen}
            onClose={handleClose}
            onEscalate={handleEscalate}
          />
        </div>
      </div>
    </div>
  );
}
