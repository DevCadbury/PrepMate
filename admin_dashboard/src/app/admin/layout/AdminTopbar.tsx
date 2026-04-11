import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, Bell, Sun, Moon, Check, ExternalLink } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Badge } from '../../components/ui/badge';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Separator } from '../../components/ui/separator';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../lib/utils';
import { Notification, NotificationType } from '../../types/notification';

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'report',
    priority: 'high',
    title: 'New user report',
    message: 'User reported for harassment',
    timestamp: '2 min ago',
    read: false,
    actionUrl: '/admin/reports',
  },
  {
    id: '2',
    type: 'ai',
    priority: 'medium',
    title: 'AI usage spike',
    message: 'Unusual activity from john.doe@email.com',
    timestamp: '15 min ago',
    read: false,
    actionUrl: '/admin/ai',
  },
  {
    id: '3',
    type: 'system',
    priority: 'low',
    title: 'Backup completed',
    message: 'Daily backup completed successfully',
    timestamp: '1 hr ago',
    read: false,
    actionUrl: '/admin/settings',
  },
  {
    id: '4',
    type: 'user',
    priority: 'medium',
    title: 'New admin created',
    message: 'Moderator role assigned to jane.smith',
    timestamp: '2 hrs ago',
    read: true,
    actionUrl: '/admin/admins',
  },
  {
    id: '5',
    type: 'content',
    priority: 'high',
    title: 'Flagged content',
    message: 'Post flagged by 8 users',
    timestamp: '3 hrs ago',
    read: true,
    actionUrl: '/admin/content',
  },
];

const typeIndicator: Record<NotificationType, string> = {
  report: 'bg-red-500',
  ai: 'bg-violet-500',
  system: 'bg-sky-500',
  user: 'bg-emerald-500',
  content: 'bg-amber-500',
};

const filterTabs: { value: 'all' | NotificationType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'report', label: 'Reports' },
  { value: 'ai', label: 'AI' },
  { value: 'system', label: 'System' },
];

export default function AdminTopbar() {
  const navigate = useNavigate();
  const { admin, logout } = useAdminAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState(mockNotifications);
  const [notificationFilter, setNotificationFilter] = useState<'all' | NotificationType>('all');
  const [notifOpen, setNotifOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (notificationFilter === 'all') return true;
    return n.type === notificationFilter;
  });

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      setNotifOpen(false);
      navigate(notification.actionUrl);
    }
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b border-border bg-card px-6 shrink-0">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm bg-muted/50 border-transparent focus:border-border focus:bg-card"
          />
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="size-9 text-muted-foreground hover:text-foreground"
        >
          {theme === 'light' ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </Button>

        {/* Notifications */}
        <Popover open={notifOpen} onOpenChange={setNotifOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative size-9 text-muted-foreground hover:text-foreground">
              <Bell className="size-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-red-500" />
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[380px] p-0" align="end" sideOffset={8}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[11px]">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-7 text-xs text-muted-foreground">
                  <Check className="size-3 mr-1" />
                  Mark all read
                </Button>
              )}
            </div>

            <Separator />

            {/* Filter Tabs */}
            <div className="flex gap-1 px-3 py-2 border-b border-border">
              {filterTabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setNotificationFilter(tab.value)}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs transition-colors',
                    notificationFilter === tab.value
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Notification List */}
            <ScrollArea className="h-[340px]">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Bell className="size-8 text-muted-foreground/30" />
                  <p className="mt-3 text-sm text-muted-foreground">No notifications</p>
                </div>
              ) : (
                <div>
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        'group flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50',
                        !notification.read && 'bg-primary/[0.03]'
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className={cn('size-1.5 rounded-full mt-2 shrink-0', typeIndicator[notification.type])} />
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className={cn('text-sm truncate', !notification.read && 'text-foreground')}>{notification.title}</p>
                          {notification.priority === 'high' && (
                            <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400">
                              urgent
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{notification.message}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-muted-foreground/70">{notification.timestamp}</span>
                          {notification.actionUrl && (
                            <ExternalLink className="size-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </div>
                      {!notification.read && (
                        <div className="size-1.5 rounded-full bg-primary mt-2 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 h-9 px-2">
              <Avatar className="size-7">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {admin?.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start text-left">
                <span className="text-xs">{admin?.name}</span>
                <span className="text-[11px] text-muted-foreground leading-none">
                  {admin?.role.replace('_', ' ')}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs text-muted-foreground">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-sm">Profile</DropdownMenuItem>
            <DropdownMenuItem className="text-sm">Preferences</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-sm text-red-600 dark:text-red-400">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
