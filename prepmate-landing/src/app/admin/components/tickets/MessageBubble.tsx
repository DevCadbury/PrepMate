import { Lock, Bot } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { TicketMessage } from '../../data/ticketData';
import { Avatar, AvatarFallback } from '../../../components/ui/avatar';

interface MessageBubbleProps {
  message: TicketMessage;
}

function formatContent(text: string) {
  // Simple markdown-like rendering for bold text and line breaks
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={i}>
        {parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j}>{part.slice(2, -2)}</strong>;
          }
          return part;
        })}
        {i < lines.length - 1 && <br />}
      </span>
    );
  });
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.senderRole === 'user';
  const isInternal = message.type === 'internal_note';
  const isSystem = message.type === 'system';

  // System messages — centered minimal row
  if (isSystem) {
    return (
      <div className="flex items-center justify-center gap-2 py-1">
        <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">
          <Bot className="size-3 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">{message.content}</span>
          <span className="text-[11px] text-muted-foreground/50">·</span>
          <span className="text-[11px] text-muted-foreground/60">{message.timestamp}</span>
        </div>
      </div>
    );
  }

  // Internal note — full-width amber banner
  if (isInternal) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-3">
        <div className="flex items-start gap-2.5">
          <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40 mt-0.5">
            <Lock className="size-3 text-amber-700 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-amber-700 dark:text-amber-400">
                Internal Note
              </span>
              <span className="text-[11px] text-amber-600/60 dark:text-amber-500/60">·</span>
              <span className="text-xs text-amber-700 dark:text-amber-400">{message.senderName}</span>
              <span className="text-[11px] text-amber-600/60 dark:text-amber-500/60">·</span>
              <span className="text-[11px] text-amber-600/60 dark:text-amber-500/60">{message.timestamp}</span>
            </div>
            <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Regular message — user on left, admin on right
  return (
    <div className={cn('flex gap-2.5', isUser ? 'flex-row' : 'flex-row-reverse')}>
      {/* Avatar */}
      <Avatar className="size-7 shrink-0 mt-0.5">
        <AvatarFallback
          className={cn(
            'text-[11px]',
            isUser
              ? 'bg-muted text-muted-foreground'
              : 'bg-primary/10 text-primary'
          )}
        >
          {message.senderName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Bubble */}
      <div className={cn('flex flex-col gap-1', isUser ? 'items-start' : 'items-end', 'max-w-[80%]')}>
        <div className="flex items-center gap-2">
          <span className={cn('text-[11px] text-muted-foreground', !isUser && 'order-last')}>{message.senderName}</span>
          <span className="text-[10px] text-muted-foreground/50">{message.timestamp}</span>
        </div>
        <div
          className={cn(
            'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
            isUser
              ? 'rounded-tl-sm bg-card border border-border text-foreground'
              : 'rounded-tr-sm bg-primary text-primary-foreground',
          )}
        >
          <p className="whitespace-pre-wrap break-words">{formatContent(message.content)}</p>
        </div>
      </div>
    </div>
  );
}
