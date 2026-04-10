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
import { ChatReportItem, ModerationPost } from "../types";
import { formatDateTime, getErrorMessage } from "../utils";

const reportStatusClass: Record<ChatReportItem["status"], string> = {
  open: "bg-amber-50 border-amber-200 text-amber-700",
  resolved: "bg-emerald-50 border-emerald-200 text-emerald-700",
  dismissed: "bg-slate-50 border-slate-200 text-slate-700",
  blocked: "bg-rose-50 border-rose-200 text-rose-700",
};

interface ChatDecisionDialogState {
  report: ChatReportItem;
  decision: "resolved" | "dismissed";
  note: string;
}

const AdminModerationPage: React.FC = () => {
  const { runWithNotice } = useAdminConsole();

  const [posts, setPosts] = useState<ModerationPost[]>([]);
  const [chatReports, setChatReports] = useState<ChatReportItem[]>([]);
  const [isLoadingModeration, setIsLoadingModeration] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const [postStatusFilter, setPostStatusFilter] = useState("all");
  const [chatReportStatusFilter, setChatReportStatusFilter] = useState("open");

  const [safePostDialog, setSafePostDialog] = useState<{
    post: ModerationPost;
    note: string;
  } | null>(null);
  const [hidePostTarget, setHidePostTarget] = useState<ModerationPost | null>(null);

  const [chatDecisionDialog, setChatDecisionDialog] =
    useState<ChatDecisionDialogState | null>(null);
  const [blockChatTarget, setBlockChatTarget] = useState<ChatReportItem | null>(null);

  const refreshModeration = useCallback(async () => {
    setIsLoadingModeration(true);
    setLocalError(null);

    try {
      const [postsResult, reportsResult] = await Promise.all([
        adminConsoleApi.getModerationPosts({
          reportedOnly: true,
          status: postStatusFilter,
          limit: 80,
        }),
        adminConsoleApi.getChatReports({
          status: chatReportStatusFilter,
          limit: 80,
        }),
      ]);

      setPosts(postsResult);
      setChatReports(reportsResult);
    } catch (error) {
      setLocalError(getErrorMessage(error));
    } finally {
      setIsLoadingModeration(false);
    }
  }, [chatReportStatusFilter, postStatusFilter]);

  useEffect(() => {
    void refreshModeration();
  }, [refreshModeration]);

  const handleModeratePost = async (
    postId: string,
    status: "active" | "hidden" | "archived",
    resolutionNote?: string
  ) => {
    await runWithNotice(
      async () => {
        await adminConsoleApi.moderatePost(postId, { status, resolutionNote });
        await refreshModeration();
      },
      "Post moderation updated",
      { refreshCore: true }
    );
  };

  const handleReviewChatReport = async (
    messageId: string,
    decision: "resolved" | "dismissed" | "blocked",
    note?: string
  ) => {
    await runWithNotice(
      async () => {
        await adminConsoleApi.reviewChatReport(messageId, { decision, note });
        await refreshModeration();
      },
      "Chat report reviewed",
      { refreshCore: true }
    );
  };

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 bg-white">
        <CardContent className="p-4">
          <AdminSectionHeader
            title="Moderation Workbench"
            description="Review reported posts and chat reports with explicit moderation decisions and audit-ready notes."
            actionLabel="Refresh"
            onAction={() => {
              void refreshModeration();
            }}
            actionDisabled={isLoadingModeration}
          />
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            <Select value={postStatusFilter} onValueChange={setPostStatusFilter}>
              <SelectTrigger className="border-slate-200">
                <SelectValue placeholder="Post status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Post Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={chatReportStatusFilter}
              onValueChange={setChatReportStatusFilter}
            >
              <SelectTrigger className="border-slate-200">
                <SelectValue placeholder="Chat report status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Report Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
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

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Reported Posts</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[560px]">
              {isLoadingModeration ? (
                <div className="flex items-center justify-center py-10 text-sm text-slate-500">
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Loading reported posts...
                </div>
              ) : posts.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-slate-500">
                  No reported posts for this filter.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {posts.map((post) => (
                    <div key={post.id} className="px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">
                        {post.user?.name || post.user?.username || "Unknown user"}
                      </p>
                      <p className="mt-1 text-xs text-slate-600 line-clamp-3">
                        {post.contentPreview || "(No preview available)"}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="border-slate-200 bg-white text-slate-600">
                          {post.status}
                        </Badge>
                        <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                          {post.pendingReportsCount} pending reports
                        </Badge>
                      </div>
                      {post.latestReportReason ? (
                        <p className="mt-1 text-[11px] text-slate-500">
                          Latest reason: {post.latestReportReason}
                        </p>
                      ) : null}
                      <div className="mt-2 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-300"
                          onClick={() => setSafePostDialog({ post, note: "Reviewed and marked safe" })}
                        >
                          Mark Safe
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-rose-200 text-rose-700 hover:bg-rose-50"
                          onClick={() => setHidePostTarget(post)}
                        >
                          Hide Post
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Chat Reports</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[560px]">
              {isLoadingModeration ? (
                <div className="flex items-center justify-center py-10 text-sm text-slate-500">
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Loading chat reports...
                </div>
              ) : chatReports.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-slate-500">
                  No chat reports for this filter.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {chatReports.map((report) => (
                    <div key={report.messageId} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {report.sender?.name || report.sender?.username || "Unknown sender"}
                          </p>
                          <p className="text-xs text-slate-500">
                            Last reported: {formatDateTime(report.lastReportedAt)}
                          </p>
                        </div>
                        <Badge className={cn("border", reportStatusClass[report.status])}>
                          {report.status}
                        </Badge>
                      </div>

                      <p className="mt-1 text-xs text-slate-600 line-clamp-3">
                        {report.messagePreview}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Reports: {report.reportCount} | Reason: {report.lastReason || "-"}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setChatDecisionDialog({
                              report,
                              decision: "resolved",
                              note: "Reviewed by admin",
                            })
                          }
                        >
                          Resolve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setChatDecisionDialog({
                              report,
                              decision: "dismissed",
                              note: "Report dismissed after review",
                            })
                          }
                        >
                          Dismiss
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-rose-200 text-rose-700 hover:bg-rose-50"
                          onClick={() => setBlockChatTarget(report)}
                        >
                          Block Message
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={Boolean(safePostDialog)}
        onOpenChange={(open) => {
          if (!open) {
            setSafePostDialog(null);
          }
        }}
      >
        <DialogContent
          className="max-w-lg"
          open={Boolean(safePostDialog)}
          onOpenChange={(open) => {
            if (!open) {
              setSafePostDialog(null);
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Mark Post as Safe</DialogTitle>
            <DialogDescription>
              Add an optional moderation note for audit visibility.
            </DialogDescription>
          </DialogHeader>

          {safePostDialog ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 line-clamp-4">
                {safePostDialog.post.contentPreview}
              </p>
              <Textarea
                value={safePostDialog.note}
                onChange={(event) =>
                  setSafePostDialog({ ...safePostDialog, note: event.target.value })
                }
                className="min-h-[120px] border-slate-200"
                placeholder="Optional note"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  className="border-slate-300"
                  onClick={() => setSafePostDialog(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    const target = safePostDialog;
                    setSafePostDialog(null);
                    void handleModeratePost(target.post.id, "active", target.note.trim());
                  }}
                >
                  Confirm Safe
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(chatDecisionDialog)}
        onOpenChange={(open) => {
          if (!open) {
            setChatDecisionDialog(null);
          }
        }}
      >
        <DialogContent
          className="max-w-lg"
          open={Boolean(chatDecisionDialog)}
          onOpenChange={(open) => {
            if (!open) {
              setChatDecisionDialog(null);
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {chatDecisionDialog?.decision === "resolved" ? "Resolve Report" : "Dismiss Report"}
            </DialogTitle>
            <DialogDescription>
              Capture review note before applying this moderation decision.
            </DialogDescription>
          </DialogHeader>

          {chatDecisionDialog ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 line-clamp-4">
                {chatDecisionDialog.report.messagePreview}
              </p>
              <Textarea
                value={chatDecisionDialog.note}
                onChange={(event) =>
                  setChatDecisionDialog({
                    ...chatDecisionDialog,
                    note: event.target.value,
                  })
                }
                className="min-h-[120px] border-slate-200"
                placeholder="Review note"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  className="border-slate-300"
                  onClick={() => setChatDecisionDialog(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    const payload = chatDecisionDialog;
                    setChatDecisionDialog(null);
                    void handleReviewChatReport(
                      payload.report.messageId,
                      payload.decision,
                      payload.note.trim()
                    );
                  }}
                >
                  Submit Review
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(hidePostTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setHidePostTarget(null);
          }
        }}
      >
        <AlertDialogContent
          className="max-w-md"
          open={Boolean(hidePostTarget)}
          onOpenChange={(open) => {
            if (!open) {
              setHidePostTarget(null);
            }
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Hide Reported Post?</AlertDialogTitle>
            <AlertDialogDescription>
              This is a destructive moderation action and will remove post visibility from normal feeds.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setHidePostTarget(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const target = hidePostTarget;
                setHidePostTarget(null);
                if (target) {
                  void handleModeratePost(target.id, "hidden", "Hidden by admin moderation");
                }
              }}
            >
              Hide Post
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(blockChatTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setBlockChatTarget(null);
          }
        }}
      >
        <AlertDialogContent
          className="max-w-md"
          open={Boolean(blockChatTarget)}
          onOpenChange={(open) => {
            if (!open) {
              setBlockChatTarget(null);
            }
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Block Reported Message?</AlertDialogTitle>
            <AlertDialogDescription>
              This destructive action removes the message content and records a blocked moderation decision.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBlockChatTarget(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const target = blockChatTarget;
                setBlockChatTarget(null);
                if (target) {
                  void handleReviewChatReport(
                    target.messageId,
                    "blocked",
                    "Blocked due to policy violation"
                  );
                }
              }}
            >
              Block Message
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminModerationPage;
