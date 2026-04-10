import React, { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import { cn } from "../../../lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../ui/alert-dialog";
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
import { CodingProposal } from "../types";
import { formatDateTime, getErrorMessage } from "../utils";

const proposalStatusClass: Record<CodingProposal["approvalStatus"], string> = {
  pending: "bg-amber-50 border-amber-200 text-amber-700",
  approved: "bg-emerald-50 border-emerald-200 text-emerald-700",
  rejected: "bg-rose-50 border-rose-200 text-rose-700",
};

interface ReviewDialogState {
  proposal: CodingProposal;
  decision: "approve" | "reject";
  note: string;
}

const AdminCodingQueuePage: React.FC = () => {
  const { runWithNotice } = useAdminConsole();

  const [codingQueue, setCodingQueue] = useState<CodingProposal[]>([]);
  const [isLoadingCodingQueue, setIsLoadingCodingQueue] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const [proposalStatusFilter, setProposalStatusFilter] = useState("pending");
  const [reviewDialog, setReviewDialog] = useState<ReviewDialogState | null>(null);
  const [rejectConfirmDialog, setRejectConfirmDialog] = useState<ReviewDialogState | null>(null);

  const refreshCodingQueue = useCallback(async () => {
    setIsLoadingCodingQueue(true);
    setLocalError(null);

    try {
      const result = await adminConsoleApi.getCodingQueue({
        status: proposalStatusFilter,
        limit: 80,
      });
      setCodingQueue(result);
    } catch (error) {
      setLocalError(getErrorMessage(error));
    } finally {
      setIsLoadingCodingQueue(false);
    }
  }, [proposalStatusFilter]);

  useEffect(() => {
    void refreshCodingQueue();
  }, [refreshCodingQueue]);

  const handleApprove = async (proposalId: string, notes: string) => {
    await runWithNotice(
      async () => {
        await adminConsoleApi.approveCodingSubmission(proposalId, notes);
        await refreshCodingQueue();
      },
      "Coding problem approved and published",
      { refreshCore: true }
    );
  };

  const handleReject = async (proposalId: string, reason: string) => {
    await runWithNotice(
      async () => {
        await adminConsoleApi.rejectCodingSubmission(proposalId, reason);
        await refreshCodingQueue();
      },
      "Coding problem rejected",
      { refreshCore: true }
    );
  };

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 bg-white">
        <CardContent className="p-4">
          <AdminSectionHeader
            title="Coding Approval Queue"
            description="Review community-submitted coding problems and control publication through admin approval."
            actionLabel="Refresh"
            onAction={() => {
              void refreshCodingQueue();
            }}
            actionDisabled={isLoadingCodingQueue}
          />
          <div className="mt-4 max-w-xs">
            <Select value={proposalStatusFilter} onValueChange={setProposalStatusFilter}>
              <SelectTrigger className="border-slate-200">
                <SelectValue placeholder="Queue filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Submissions</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
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
          <CardTitle className="text-base">Submission Queue</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[560px]">
            {isLoadingCodingQueue ? (
              <div className="flex items-center justify-center py-10 text-sm text-slate-500">
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Loading coding queue...
              </div>
            ) : codingQueue.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-slate-500">
                No coding submissions in this filter.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {codingQueue.map((proposal) => (
                  <div key={proposal.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{proposal.title}</p>
                        <p className="text-xs text-slate-500">
                          {proposal.createdBy?.name || proposal.createdBy?.username || "Unknown"} | {proposal.difficulty} | {formatDateTime(proposal.submittedAt)}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {(proposal.tags || []).slice(0, 6).map((tag) => (
                            <Badge
                              key={`${proposal.id}-${tag}`}
                              variant="outline"
                              className="border-slate-200 bg-white text-[10px] text-slate-600"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        {proposal.approvalNotes ? (
                          <p className="mt-2 text-xs text-slate-600">Note: {proposal.approvalNotes}</p>
                        ) : null}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Badge className={cn("border", proposalStatusClass[proposal.approvalStatus])}>
                          {proposal.approvalStatus}
                        </Badge>
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              setReviewDialog({
                                proposal,
                                decision: "approve",
                                note: "Approved by admin",
                              })
                            }
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-rose-200 text-rose-700 hover:bg-rose-50"
                            onClick={() =>
                              setReviewDialog({
                                proposal,
                                decision: "reject",
                                note: "Please refine constraints, test cases, and editorial clarity.",
                              })
                            }
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(reviewDialog)}
        onOpenChange={(open) => {
          if (!open) {
            setReviewDialog(null);
          }
        }}
      >
        <DialogContent
          className="max-w-xl"
          open={Boolean(reviewDialog)}
          onOpenChange={(open) => {
            if (!open) {
              setReviewDialog(null);
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {reviewDialog?.decision === "approve"
                ? "Approve Coding Submission"
                : "Prepare Rejection Feedback"}
            </DialogTitle>
            <DialogDescription>
              Add reviewer guidance that will be stored with this moderation action.
            </DialogDescription>
          </DialogHeader>

          {reviewDialog ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-700">
                <span className="font-semibold">Problem:</span> {reviewDialog.proposal.title}
              </p>
              <Textarea
                value={reviewDialog.note}
                onChange={(event) =>
                  setReviewDialog({
                    ...reviewDialog,
                    note: event.target.value,
                  })
                }
                className="min-h-[140px] border-slate-200"
                placeholder="Review note"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  className="border-slate-300"
                  onClick={() => setReviewDialog(null)}
                >
                  Cancel
                </Button>
                {reviewDialog.decision === "approve" ? (
                  <Button
                    onClick={() => {
                      const payload = reviewDialog;
                      setReviewDialog(null);
                      void handleApprove(payload.proposal.id, payload.note.trim());
                    }}
                  >
                    Approve and Publish
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="border-rose-200 text-rose-700 hover:bg-rose-50"
                    onClick={() => {
                      const payload = reviewDialog;
                      setReviewDialog(null);
                      setRejectConfirmDialog(payload);
                    }}
                  >
                    Continue to Reject
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(rejectConfirmDialog)}
        onOpenChange={(open) => {
          if (!open) {
            setRejectConfirmDialog(null);
          }
        }}
      >
        <AlertDialogContent
          className="max-w-md"
          open={Boolean(rejectConfirmDialog)}
          onOpenChange={(open) => {
            if (!open) {
              setRejectConfirmDialog(null);
            }
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Coding Submission?</AlertDialogTitle>
            <AlertDialogDescription>
              This destructive action will keep the problem unpublished and notify the contributor with your feedback.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRejectConfirmDialog(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const payload = rejectConfirmDialog;
                setRejectConfirmDialog(null);
                if (payload) {
                  void handleReject(payload.proposal.id, payload.note.trim() || "Rejected by admin");
                }
              }}
            >
              Reject Submission
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminCodingQueuePage;
