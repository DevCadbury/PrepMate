import React, { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import { cn } from "../../../lib/utils";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { ScrollArea } from "../../ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Textarea } from "../../ui/textarea";
import { useAdminConsole } from "../AdminConsoleContext";
import AdminSectionHeader from "../components/AdminSectionHeader";
import { adminConsoleApi } from "../services/adminConsoleApi";
import { SupportTicketRecord } from "../types";
import { formatDateTime, getErrorMessage } from "../utils";

const ticketStatusClass: Record<SupportTicketRecord["status"], string> = {
  open: "bg-sky-50 border-sky-200 text-sky-700",
  in_progress: "bg-amber-50 border-amber-200 text-amber-700",
  resolved: "bg-emerald-50 border-emerald-200 text-emerald-700",
  closed: "bg-slate-50 border-slate-200 text-slate-700",
};

const AdminSupportPage: React.FC = () => {
  const { runWithNotice } = useAdminConsole();

  const [tickets, setTickets] = useState<SupportTicketRecord[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const [supportStatusFilter, setSupportStatusFilter] = useState("open");
  const [ticketDialog, setTicketDialog] = useState<SupportTicketRecord | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  const refreshSupportTickets = useCallback(async () => {
    setIsLoadingTickets(true);
    setLocalError(null);

    try {
      const response = await adminConsoleApi.getSupportTickets({
        status: supportStatusFilter,
        limit: 80,
      });
      setTickets(response);
    } catch (error) {
      setLocalError(getErrorMessage(error));
    } finally {
      setIsLoadingTickets(false);
    }
  }, [supportStatusFilter]);

  useEffect(() => {
    void refreshSupportTickets();
  }, [refreshSupportTickets]);

  const handleTicketStatusChange = async (
    ticket: SupportTicketRecord,
    status: SupportTicketRecord["status"]
  ) => {
    await runWithNotice(
      async () => {
        await adminConsoleApi.updateSupportTicket(ticket.id, { status });
        await refreshSupportTickets();
      },
      "Ticket status updated",
      { refreshCore: true }
    );
  };

  const openTicketDialog = (ticket: SupportTicketRecord) => {
    setTicketDialog(ticket);
    setNoteDraft(ticket.adminNotes || "");
  };

  const handleSaveTicketNotes = async () => {
    if (!ticketDialog) {
      return;
    }

    const current = ticketDialog;

    await runWithNotice(
      async () => {
        await adminConsoleApi.updateSupportTicket(current.id, {
          adminNotes: noteDraft.trim(),
        });
        await refreshSupportTickets();
      },
      "Ticket notes updated",
      { refreshCore: false }
    );

    setTicketDialog(null);
  };

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 bg-white">
        <CardContent className="p-4">
          <AdminSectionHeader
            title="Support Queue"
            description="Track ticket priority, update resolution states, and maintain admin notes in one place."
            actionLabel="Refresh"
            onAction={() => {
              void refreshSupportTickets();
            }}
            actionDisabled={isLoadingTickets}
          />
          <div className="mt-4 max-w-xs">
            <Select value={supportStatusFilter} onValueChange={setSupportStatusFilter}>
              <SelectTrigger className="border-slate-200">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {localError ? (
            <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {localError}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ticket List</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[560px]">
            {isLoadingTickets ? (
              <div className="flex items-center justify-center py-10 text-sm text-slate-500">
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Loading support tickets...
              </div>
            ) : tickets.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-slate-500">
                No support tickets found for this filter.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="px-4 py-3">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{ticket.subject}</p>
                        <p className="text-xs text-slate-500">
                          {ticket.user?.name || ticket.user?.username || "Unknown"} | {ticket.category}
                        </p>
                        <p className="mt-1 text-xs text-slate-600 line-clamp-2">{ticket.description}</p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          Updated: {formatDateTime(ticket.updatedAt)}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={cn("border", ticketStatusClass[ticket.status])}>
                          {ticket.status}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="border-slate-200 bg-white text-slate-600"
                        >
                          {ticket.priority}
                        </Badge>
                        <Select
                          value={ticket.status}
                          onValueChange={(value) => {
                            void handleTicketStatusChange(
                              ticket,
                              value as SupportTicketRecord["status"]
                            );
                          }}
                        >
                          <SelectTrigger className="h-8 w-[150px] border-slate-200 bg-white text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-300"
                          onClick={() => openTicketDialog(ticket)}
                        >
                          View details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={Boolean(ticketDialog)} onOpenChange={(open) => !open && setTicketDialog(null)}>
        <DialogContent
          className="max-w-2xl"
          open={Boolean(ticketDialog)}
          onOpenChange={(open) => !open && setTicketDialog(null)}
        >
          <DialogHeader>
            <DialogTitle>Support Ticket Details</DialogTitle>
            <DialogDescription>
              Review ticket context and update internal notes for support handoff.
            </DialogDescription>
          </DialogHeader>

          {ticketDialog ? (
            <div className="space-y-3 text-sm text-slate-700">
              <p><span className="font-semibold">Subject:</span> {ticketDialog.subject}</p>
              <p><span className="font-semibold">Requester:</span> {ticketDialog.user?.name || ticketDialog.user?.username || "Unknown"}</p>
              <p><span className="font-semibold">Status:</span> {ticketDialog.status}</p>
              <p><span className="font-semibold">Priority:</span> {ticketDialog.priority}</p>
              <p><span className="font-semibold">Description:</span> {ticketDialog.description}</p>

              <div>
                <p className="mb-1 font-semibold">Admin notes</p>
                <Textarea
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                  className="min-h-[120px] border-slate-200"
                  placeholder="Capture root cause, owner, or escalation details."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  className="border-slate-300"
                  onClick={() => setTicketDialog(null)}
                >
                  Close
                </Button>
                <Button onClick={() => void handleSaveTicketNotes()}>Save Notes</Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSupportPage;
