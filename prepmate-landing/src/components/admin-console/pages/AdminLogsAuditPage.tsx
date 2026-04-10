import React, { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { ScrollArea } from "../../ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { useAdminConsole } from "../AdminConsoleContext";
import AdminSectionHeader from "../components/AdminSectionHeader";
import { adminConsoleApi } from "../services/adminConsoleApi";
import { getErrorMessage } from "../utils";

const AdminLogsAuditPage: React.FC = () => {
  const { insights, refreshCore } = useAdminConsole();

  const [logLines, setLogLines] = useState<string[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [lineCount, setLineCount] = useState("200");

  const refreshLogs = useCallback(async () => {
    setIsLoadingLogs(true);
    setLocalError(null);

    try {
      const nextLines = await adminConsoleApi.getRecentLogs(Number(lineCount));
      setLogLines(nextLines);
    } catch (error) {
      setLocalError(getErrorMessage(error));
    } finally {
      setIsLoadingLogs(false);
    }
  }, [lineCount]);

  useEffect(() => {
    void refreshLogs();
  }, [refreshLogs]);

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 bg-white">
        <CardContent className="p-4">
          <AdminSectionHeader
            title="Logs and Audit Trail"
            description="Inspect moderation throughput and backend operational logs for governance and incident response."
            actionLabel="Refresh All"
            onAction={() => {
              void Promise.all([refreshLogs(), refreshCore()]);
            }}
            actionDisabled={isLoadingLogs}
          />
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <p className="text-xs text-slate-500">Pending post reports</p>
              <p className="font-semibold text-slate-900">{insights?.audit.pendingPostReports || 0}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <p className="text-xs text-slate-500">Open chat reports</p>
              <p className="font-semibold text-slate-900">{insights?.audit.openChatReports || 0}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <p className="text-xs text-slate-500">Post actions (24h)</p>
              <p className="font-semibold text-slate-900">{insights?.audit.postModerationActions24h || 0}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <p className="text-xs text-slate-500">Chat actions (24h)</p>
              <p className="font-semibold text-slate-900">{insights?.audit.chatModerationActions24h || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Recent Backend Logs</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={lineCount} onValueChange={setLineCount}>
                <SelectTrigger className="h-8 w-[140px] border-slate-200 bg-white text-xs">
                  <SelectValue placeholder="Line count" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100">100 lines</SelectItem>
                  <SelectItem value="200">200 lines</SelectItem>
                  <SelectItem value="400">400 lines</SelectItem>
                  <SelectItem value="800">800 lines</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                className="border-slate-300"
                onClick={() => {
                  void refreshLogs();
                }}
                disabled={isLoadingLogs}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-slate-200 bg-white text-slate-600">
              Log lines: {logLines.length}
            </Badge>
            <Badge className="border-sky-200 bg-sky-50 text-sky-700">
              Moderation actions (24h): {insights?.audit.moderationActions24h || 0}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {localError ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {localError}
            </p>
          ) : null}

          <ScrollArea className="h-[560px] rounded-xl border border-slate-200 bg-slate-950 p-4">
            {isLoadingLogs ? (
              <div className="flex items-center justify-center py-10 text-sm text-slate-200">
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Loading logs...
              </div>
            ) : logLines.length === 0 ? (
              <p className="text-xs text-slate-300">No log lines available yet.</p>
            ) : (
              <pre className="whitespace-pre-wrap text-xs leading-5 text-slate-200">
                {logLines.join("\n")}
              </pre>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogsAuditPage;
