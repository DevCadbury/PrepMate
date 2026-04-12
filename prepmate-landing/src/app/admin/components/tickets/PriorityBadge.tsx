import { cn } from '../../../lib/utils';
import { TicketPriority, ticketPriorityConfig } from '../../data/ticketData';

interface PriorityBadgeProps {
  priority: TicketPriority;
  size?: 'sm' | 'default' | 'lg';
  showDot?: boolean;
}

export function PriorityBadge({ priority, size = 'default', showDot = true }: PriorityBadgeProps) {
  const cfg = ticketPriorityConfig[priority];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 select-none',
        cfg.bgClass,
        cfg.textClass,
        cfg.borderClass,
        size === 'sm' && 'px-2 py-px text-[11px]',
        size === 'default' && 'text-xs',
        size === 'lg' && 'px-3 py-1 text-sm'
      )}
    >
      {showDot && (
        <span className={cn('inline-block rounded-full shrink-0', cfg.dotClass, size === 'sm' ? 'size-1' : 'size-1.5')} />
      )}
      {cfg.label}
    </span>
  );
}
