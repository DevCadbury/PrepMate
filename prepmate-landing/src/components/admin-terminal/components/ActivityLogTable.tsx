import React from 'react';
import { Shield, UserX, AlertTriangle, MessageSquare, Clock } from 'lucide-react';

interface ActivityLogProps {
  logs: string[];
}

export const ActivityLogTable: React.FC<ActivityLogProps> = ({ logs }) => {
  // Parse logs (assuming format: [Timestamp] LEVEL: Action - Details)
  const parsedLogs = logs.map(logLine => {
    try {
      const match = logLine.match(/\[(.*?)\] (.*?): (.*)/);
      if (match) {
        return {
          timestamp: new Date(match[1]).toLocaleString(),
          level: match[2],
          message: match[3],
          raw: logLine
        };
      }
      return { timestamp: 'Unknown', level: 'INFO', message: logLine, raw: logLine };
    } catch {
      return { timestamp: 'Unknown', level: 'INFO', message: logLine, raw: logLine };
    }
  });

  const getLogIcon = (message: string) => {
    const msg = message.toLowerCase();
    if (msg.includes('suspend') || msg.includes('ban')) return <UserX size={14} className="text-rose-500" />;
    if (msg.includes('report') || msg.includes('flag')) return <AlertTriangle size={14} className="text-amber-500" />;
    if (msg.includes('message') || msg.includes('post')) return <MessageSquare size={14} className="text-blue-500" />;
    return <Shield size={14} className="text-emerald-500" />;
  };

  return (
    <div className="admin-card overflow-hidden">
      <div className="p-4 border-b border-[var(--admin-outline)] flex justify-between items-center bg-[var(--admin-surface-container)]">
        <h3 className="font-semibold text-sm flex items-center">
          <Clock size={16} className="mr-2 text-[var(--admin-on-surface-variant)]" />
          Recent Activity Logs
        </h3>
        <button className="text-xs text-[var(--admin-primary)] hover:text-[var(--admin-primary-hover)] transition-colors">
          View All
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-[var(--admin-on-surface-muted)] uppercase bg-[var(--admin-surface-container-high)] border-b border-[var(--admin-outline)]">
            <tr>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">Details</th>
            </tr>
          </thead>
          <tbody>
            {parsedLogs.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-[var(--admin-on-surface-muted)]">
                  No activity logs found.
                </td>
              </tr>
            ) : (
              parsedLogs.slice(0, 5).map((log, i) => (
                <tr key={i} className="admin-table-row">
                  <td className="px-4 py-3 text-[var(--admin-on-surface-muted)] whitespace-nowrap text-xs font-mono">
                    {log.timestamp}
                  </td>
                  <td className="px-4 py-3 text-[var(--admin-on-surface)] flex items-center space-x-2">
                    <div className="p-1.5 rounded bg-[var(--admin-surface-container-high)] border border-[var(--admin-outline-variant)]">
                      {getLogIcon(log.message)}
                    </div>
                    <span className="truncate max-w-[200px]" title={log.message}>
                      {log.message.split('-')[0] || log.message}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--admin-on-surface-variant)] truncate max-w-xs hidden sm:table-cell" title={log.message}>
                    {log.message.split('-')[1] || ''}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
