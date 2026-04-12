import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  Flag,
  Brain,
  BarChart3,
  Code,
  Settings,
  HelpCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Shield,
  KeyRound,
  ScrollText,
  Tag,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import type { Permission } from '../../types/admin';
import { useSidebar } from '../../contexts/SidebarContext';
import { Button } from '../../components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { Separator } from '../../components/ui/separator';

type NavItem = {
  path: string;
  label: string;
  icon: LucideIcon;
  tooltip: string;
  exact?: boolean;
  permission?: keyof Permission;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    label: 'Overview',
    items: [
      { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true, tooltip: 'Command center' },
    ],
  },
  {
    label: 'Management',
    items: [
      { path: '/admin/users', label: 'Users', icon: Users, permission: 'canManageUsers', tooltip: 'Manage platform users' },
      { path: '/admin/content', label: 'Content', icon: FileText, permission: 'canManageContent', tooltip: 'Moderate content' },
      { path: '/admin/reports', label: 'Reports', icon: Flag, permission: 'canManageReports', tooltip: 'Handle reports' },
      { path: '/admin/coding', label: 'Coding', icon: Code, permission: 'canManageCoding', tooltip: 'Coding platform' },
      { path: '/admin/coupons', label: 'Coupons', icon: Tag, tooltip: 'Coupon management' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { path: '/admin/ai', label: 'AI Monitor', icon: Brain, permission: 'canManageAI', tooltip: 'AI usage & costs' },
      { path: '/admin/analytics', label: 'Analytics', icon: BarChart3, permission: 'canViewAnalytics', tooltip: 'Platform metrics' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { path: '/admin/admins', label: 'Admins', icon: Shield, permission: 'canManageAdmins', tooltip: 'Manage admins' },
      { path: '/admin/roles', label: 'Roles', icon: KeyRound, permission: 'canCreateCustomRoles', tooltip: 'Custom roles' },
      { path: '/admin/logs', label: 'Logs', icon: ScrollText, permission: 'canViewAdminLogs', tooltip: 'Activity logs' },
      { path: '/admin/settings', label: 'Settings', icon: Settings, permission: 'canManageSettings', tooltip: 'Configuration' },
      { path: '/admin/help', label: 'Help Center', icon: HelpCircle, permission: 'canManageSupport', tooltip: 'Support tickets' },
    ],
  },
];

export default function AdminSidebar() {
  const location = useLocation();
  const { permissions } = useAdminAuth();
  const { collapsed, toggleSidebar } = useSidebar();

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname === path || (path !== '/admin' && location.pathname.startsWith(path));
  };

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-border bg-card transition-all duration-200 ease-in-out',
        collapsed ? 'w-[60px]' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex h-14 items-center border-b border-border shrink-0',
        collapsed ? 'justify-center px-2' : 'justify-between px-4'
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary">
              <span className="text-xs text-primary-foreground tracking-tight">PM</span>
            </div>
            <span className="text-sm tracking-tight text-foreground">PrepMate</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
        >
          {collapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        <TooltipProvider delayDuration={0}>
          {navSections.map((section, sIdx) => {
            const visibleItems = section.items.filter((item) => {
              if (!item.permission) return true;
              return permissions?.[item.permission as keyof typeof permissions];
            });
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.label} className={cn(sIdx > 0 && 'mt-1')}>
                {!collapsed && sIdx > 0 && <Separator className="mx-3 mb-2" />}
                {!collapsed && (
                  <div className="px-4 py-1.5">
                    <span className="text-[11px] tracking-wider uppercase text-muted-foreground/70">
                      {section.label}
                    </span>
                  </div>
                )}
                {collapsed && sIdx > 0 && <Separator className="mx-2 my-1" />}
                <div className="space-y-0.5 px-2">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path, item.exact);

                    const linkContent = (
                      <Link
                        to={item.path}
                        className={cn(
                          'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors duration-150',
                          collapsed && 'justify-center px-0 py-2',
                          active
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <Icon className={cn('size-4 shrink-0', active && 'text-primary')} />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    );

                    if (collapsed) {
                      return (
                        <Tooltip key={item.path}>
                          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                          <TooltipContent side="right" sideOffset={8}>
                            <span className="text-xs">{item.label}</span>
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

                    return <div key={item.path}>{linkContent}</div>;
                  })}
                </div>
              </div>
            );
          })}
        </TooltipProvider>
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-2 shrink-0">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/"
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground',
                  collapsed && 'justify-center px-0 py-2'
                )}
              >
                <ArrowLeft className="size-4 shrink-0" />
                {!collapsed && <span>Back to App</span>}
              </Link>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" sideOffset={8}>
                <span className="text-xs">Back to App</span>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </aside>
  );
}