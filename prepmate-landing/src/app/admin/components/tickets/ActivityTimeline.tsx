import { cn } from '../../../lib/utils';
import { TimelineEvent } from '../../data/ticketData';
import {
  MessageSquare,
  StickyNote,
  RefreshCw,
  UserCheck,
  Tag,
  AlertTriangle,
  Plus,
  UserMinus,
} from 'lucide-react';
import type { ReactNode } from 'react';

interface ActivityTimelineProps {
  events: TimelineEvent[];
}

const eventIconMap: Record<TimelineEvent['type'], ReactNode> = {
  created: <Plus className="size-3" />,
  message_sent: <MessageSquare className="size-3" />,
  note_added: <StickyNote className="size-3" />,
  status_changed: <RefreshCw className="size-3" />,
  assigned: <UserCheck className="size-3" />,
  reassigned: <UserMinus className="size-3" />,
  tag_added: <Tag className="size-3" />,
  escalated: <AlertTriangle className="size-3" />,
};

const eventColorMap: Record<TimelineEvent['type'], string> = {
  created: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  message_sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  note_added: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  status_changed: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  assigned: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  reassigned: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  tag_added: 'bg-muted text-muted-foreground',
  escalated: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export function ActivityTimeline({ events }: ActivityTimelineProps) {
  if (events.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-4">No activity yet</p>
    );
  }

  // Show most recent first
  const sorted = [...events].reverse();

  return (
    <div className="relative space-y-0">
      {sorted.map((event, index) => (
        <div key={event.id} className="flex gap-3 group">
          {/* Icon + line */}
          <div className="flex flex-col items-center">
            <div className={cn('flex size-5 shrink-0 items-center justify-center rounded-full', eventColorMap[event.type])}>
              {eventIconMap[event.type]}
            </div>
            {index < sorted.length - 1 && (
              <div className="w-px flex-1 bg-border min-h-[16px]" />
            )}
          </div>

          {/* Content */}
          <div className={cn('pb-3', index === sorted.length - 1 && 'pb-0')}>
            <p className="text-[12px] text-foreground leading-snug">{event.description}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] text-muted-foreground">{event.actor}</span>
              <span className="text-[11px] text-muted-foreground/50">·</span>
              <span className="text-[11px] text-muted-foreground/70">{event.timestamp}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}