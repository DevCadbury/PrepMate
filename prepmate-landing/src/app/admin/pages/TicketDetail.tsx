import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Hash, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type {
  SupportTicket,
  TicketMessage,
  TimelineEvent,
  TicketStatus,
  TicketPriority,
  TicketTag,
} from '../data/ticketData';
import { TicketChat } from '../components/tickets/TicketChat';
import { TicketSidebar } from '../components/tickets/TicketSidebar';
import { StatusBadge } from '../components/tickets/StatusBadge';
import { PriorityBadge } from '../components/tickets/PriorityBadge';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';
import { apiClient } from '../../../lib/apiClient';
import {
  fetchAssigneeOptions,
  mapBackendSupportTicketToUi,
  type AssigneeOption,
} from '../lib/backendAdapters';

type BackendSupportTicketRecord = {
  id: string;
  subject: string;
  description: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  adminNotes?: string;
  user?: {
    id: string;
    name?: string;
    email?: string;
    username?: string;
  } | null;
  assignedTo?: {
    id: string;
    name?: string;
    username?: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
};

type TicketResponse = {
  success?: boolean;
  data?: {
    ticket?: BackendSupportTicketRecord;
  };
};

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assigneeOptions, setAssigneeOptions] = useState<AssigneeOption[]>([]);
  const [notFound, setNotFound] = useState(false);

  const fetchTicket = useCallback(async () => {
    if (!id) {
      setNotFound(true);
      return;
    }

    setIsLoading(true);

    try {
      const [ticketResponse, assignees] = await Promise.all([
        apiClient.get<TicketResponse>(`/support/tickets/${id}`),
        fetchAssigneeOptions(),
      ]);

      const backendTicket = ticketResponse?.data?.ticket;
      if (!backendTicket) {
        setNotFound(true);
        return;
      }

      const mapped = mapBackendSupportTicketToUi(backendTicket as any);
      setTicket(mapped);
      setMessages([...mapped.messages]);
      setTimeline([...mapped.timeline]);
      setAssigneeOptions(assignees);
      setNotFound(false);
    } catch (error) {
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  const updateTicket = async (payload: Record<string, unknown>, successMessage?: string) => {
    if (!id) return;

    setIsSubmitting(true);

    try {
      await apiClient.patch(`/support/tickets/${id}`, payload);
      if (successMessage) toast.success(successMessage);
      await fetchTicket();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const appendLocalMessage = (content: string, type: 'reply' | 'internal_note') => {
    const newMessage: TicketMessage = {
      id: `local-${Date.now()}`,
      type,
      senderName: 'Support Admin',
      senderEmail: 'support@prepmate.io',
      senderRole: 'admin',
      content,
      timestamp: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      isRead: true,
    };

    setMessages((prev) => [...prev, newMessage]);

    if (type === 'internal_note') {
      void updateTicket(
        {
          adminNotes: content,
        },
        'Internal note saved'
      );
      return;
    }

    if (ticket?.status === 'open') {
      void updateTicket({ status: 'in_progress' }, 'Reply sent');
      return;
    }

    toast.success('Reply sent');
  };

  const handleStatusChange = (status: TicketStatus) => {
    if (!ticket) return;
    if (status === ticket.status) return;
    void updateTicket({ status }, `Status updated to "${status.replace(/_/g, ' ')}"`);
  };

  const handlePriorityChange = (priority: TicketPriority) => {
    if (!ticket) return;
    if (priority === ticket.priority) return;
    void updateTicket({ priority }, `Priority changed to ${priority}`);
  };

  const handleAssign = (adminId: string | undefined) => {
    const assignedTo = adminId || null;
    void updateTicket({ assignedTo }, adminId ? 'Ticket assigned' : 'Ticket unassigned');
  };

  const handleTagAdd = (tag: TicketTag) => {
    if (!ticket) return;
    setTicket((prev) => (prev ? { ...prev, tags: [...prev.tags, tag] } : prev));
  };

  const handleTagRemove = (tag: TicketTag) => {
    if (!ticket) return;
    setTicket((prev) => (prev ? { ...prev, tags: prev.tags.filter((item) => item !== tag) } : prev));
  };

  const handleResolve = () => {
    void updateTicket({ status: 'resolved' }, 'Ticket resolved');
  };

  const handleReopen = () => {
    void updateTicket({ status: 'open' }, 'Ticket reopened');
  };

  const handleClose = () => {
    void updateTicket({ status: 'closed' }, 'Ticket closed');
  };

  const handleEscalate = () => {
    void updateTicket({ priority: 'urgent' }, 'Ticket escalated');
  };

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

  if (isLoading || !ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
        <p className="text-sm text-muted-foreground">Loading ticket...</p>
      </div>
    );
  }

  const liveTicket: SupportTicket = { ...ticket, messages, timeline };
  const isResolved = ticket.status === 'resolved';
  const isClosed = ticket.status === 'closed';

  return (
    <div className="flex flex-col -m-6" style={{ height: 'calc(100vh - 56px)' }}>
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

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 min-w-0 overflow-hidden border-r border-border">
          <TicketChat
            messages={messages}
            onSendMessage={appendLocalMessage}
            isResolved={isResolved}
            isClosed={isClosed}
            isSimulatingReply={false}
          />
        </div>

        <div className="w-[296px] xl:w-[316px] shrink-0 overflow-hidden bg-card">
          <TicketSidebar
            ticket={liveTicket}
            onStatusChange={handleStatusChange}
            onPriorityChange={handlePriorityChange}
            onAssign={(adminId) => handleAssign(adminId)}
            onTagAdd={handleTagAdd}
            onTagRemove={handleTagRemove}
            onResolve={handleResolve}
            onReopen={handleReopen}
            onClose={handleClose}
            onEscalate={handleEscalate}
            assigneeOptions={assigneeOptions}
          />
        </div>
      </div>

      {isSubmitting && (
        <div className="absolute bottom-4 right-4 rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
          Saving changes...
        </div>
      )}
    </div>
  );
}
