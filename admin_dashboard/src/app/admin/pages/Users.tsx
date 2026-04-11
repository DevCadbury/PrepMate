import { useState } from 'react';
import {
  Search,
  Filter,
  UserPlus,
  Ban,
  Trash2,
  Key,
  Clock,
  MoreHorizontal,
  AlertTriangle,
  Copy,
  Mail,
  RefreshCw,
  Shield,
  UserX,
  ExternalLink,
} from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Checkbox } from '../../components/ui/checkbox';
import { Separator } from '../../components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { toast } from 'sonner';
import UserProfilePanel from '../components/UserProfilePanel';
import ReportDrawer from '../components/ReportDrawer';
import StatusHistoryPanel from '../components/StatusHistoryPanel';
import CooldownSelector from '../components/CooldownSelector';
import MediaAttachment, { AttachedFile } from '../components/MediaAttachment';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { useNavigate } from 'react-router';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string;
  lastActive: string;
  posts: number;
  followers: number;
  following: number;
  reports: number;
  codingSolved: number;
  restriction?: { type: string; remaining: string; reason: string };
}

const mockUsers: User[] = [
  { id: '1', name: 'John Doe', email: 'john.doe@email.com', role: 'user', status: 'active', joinedAt: 'Jan 15, 2024', lastActive: '2 hours ago', posts: 42, followers: 128, following: 56, reports: 0, codingSolved: 87 },
  { id: '2', name: 'Jane Smith', email: 'jane.smith@email.com', role: 'premium', status: 'active', joinedAt: 'Feb 20, 2024', lastActive: '5 minutes ago', posts: 156, followers: 342, following: 89, reports: 2, codingSolved: 142 },
  { id: '3', name: 'Bob Wilson', email: 'bob.wilson@email.com', role: 'user', status: 'banned', joinedAt: 'Mar 10, 2024', lastActive: '3 days ago', posts: 12, followers: 23, following: 15, reports: 8, codingSolved: 15 },
  { id: '4', name: 'Alice Brown', email: 'alice.brown@email.com', role: 'premium', status: 'suspended', joinedAt: 'Apr 5, 2024', lastActive: '1 week ago', posts: 78, followers: 210, following: 43, reports: 3, codingSolved: 56 },
  { id: '5', name: 'Mike Johnson', email: 'mike.johnson@email.com', role: 'user', status: 'active', joinedAt: 'May 12, 2024', lastActive: '1 hour ago', posts: 34, followers: 67, following: 29, reports: 0, codingSolved: 112, restriction: { type: 'posting', remaining: '18h left', reason: 'Spam posting' } },
  { id: '6', name: 'Sara Lee', email: 'sara.lee@email.com', role: 'user', status: 'active', joinedAt: 'Jun 8, 2024', lastActive: '30 minutes ago', posts: 23, followers: 45, following: 18, reports: 1, codingSolved: 34 },
];

// Mock report details for the drawer
const getMockReportDetails = (userName: string) => [
  { id: '1', contentType: 'post' as const, contentPreview: 'This post contains inappropriate language and targeted harassment towards other community members...', contentTitle: 'Offensive post about algorithms', reason: 'Harassment', reportedBy: { name: 'Mike Johnson', email: 'mike@email.com' }, timestamp: '2 days ago', severity: 'high' as const, status: 'pending' as const },
  { id: '2', contentType: 'comment' as const, contentPreview: 'Check out this amazing offer at example-spam.com for free coding courses...', reason: 'Spam', reportedBy: { name: 'Sara Lee', email: 'sara@email.com' }, timestamp: '1 week ago', severity: 'medium' as const, status: 'resolved' as const, moderationAction: 'Content removed', moderatedBy: 'Admin User', moderatedAt: '5 days ago' },
  { id: '3', contentType: 'post' as const, contentPreview: 'This post contains inappropriate language and targeted harassment towards other community members...', contentTitle: 'Offensive post about algorithms', reason: 'Inappropriate language', reportedBy: { name: 'Alice Brown', email: 'alice@email.com' }, timestamp: '2 weeks ago', severity: 'low' as const, status: 'resolved' as const, moderationAction: 'Warning sent', moderatedBy: 'John Moderator', moderatedAt: '10 days ago' },
];

// Mock status history
const getMockStatusHistory = (user: User) => {
  const events = [
    { id: '1', type: 'account_created' as const, reason: 'Account registered', appliedBy: 'System', timestamp: user.joinedAt, active: false },
  ];
  if (user.status === 'banned') {
    events.push({ id: '2', type: 'ban' as const, reason: 'Repeated harassment — 8 reports', appliedBy: 'Admin User', timestamp: '3 days ago', active: true });
    events.push({ id: '3', type: 'warn' as const, reason: 'Inappropriate comments', appliedBy: 'John Moderator', timestamp: '2 weeks ago', active: false });
  }
  if (user.status === 'suspended') {
    events.push({ id: '2', type: 'suspend' as const, reason: 'Spam posting — 3 reports', appliedBy: 'Admin User', timestamp: '1 week ago', active: true, duration: '14 days' } as any);
  }
  return events.reverse();
};

const statusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
    case 'banned': return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
    case 'suspended': return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    default: return '';
  }
};

export default function UsersPage() {
  const { permissions } = useAdminAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Report drawer
  const [reportDrawerOpen, setReportDrawerOpen] = useState(false);
  const [reportDrawerUser, setReportDrawerUser] = useState<User | null>(null);

  // Status history
  const [statusHistoryOpen, setStatusHistoryOpen] = useState(false);
  const [statusHistoryUser, setStatusHistoryUser] = useState<User | null>(null);

  // Cooldown selector
  const [cooldownOpen, setCooldownOpen] = useState(false);
  const [cooldownUser, setCooldownUser] = useState<User | null>(null);

  // Action dialog state
  const [actionDialog, setActionDialog] = useState<{
    type: 'ban' | 'unban' | 'suspend' | 'delete' | 'reset-password' | null;
    user: User | null;
  }>({ type: null, user: null });
  const [actionReason, setActionReason] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [actionFiles, setActionFiles] = useState<AttachedFile[]>([]);
  const [suspendDuration, setSuspendDuration] = useState('7');

  // Reset password state
  const [resetLink, setResetLink] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetSending, setResetSending] = useState(false);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const allSelected = filteredUsers.length > 0 && filteredUsers.every(u => selectedIds.has(u.id));

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredUsers.map(u => u.id)));
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const handleViewProfile = (user: User) => {
    setSelectedUser(user);
    setProfilePanelOpen(true);
  };

  const handleReportClick = (user: User) => {
    if (user.reports === 0) return;
    setReportDrawerUser(user);
    setReportDrawerOpen(true);
  };

  const handleStatusClick = (user: User) => {
    setStatusHistoryUser(user);
    setStatusHistoryOpen(true);
  };

  const openAction = (type: typeof actionDialog.type, user: User) => {
    if (type === 'ban' && !permissions?.canBanUsers) {
      toast.error('You do not have permission to ban users');
      return;
    }
    if (type === 'delete' && !permissions?.canDeleteUsers) {
      toast.error('You do not have permission to delete users');
      return;
    }
    setActionReason('');
    setActionNote('');
    setActionFiles([]);
    setSuspendDuration('7');
    if (type === 'reset-password') {
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      setResetLink(`https://prepmate.com/reset-password?token=${token}`);
      setResetEmailSent(false);
    }
    setActionDialog({ type, user });
  };

  const confirmAction = () => {
    if (!actionDialog.user) return;
    if ((actionDialog.type === 'ban' || actionDialog.type === 'suspend') && !actionReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    const updatedUsers = users.map((u) => {
      if (u.id === actionDialog.user?.id) {
        if (actionDialog.type === 'ban') return { ...u, status: 'banned', restriction: undefined };
        if (actionDialog.type === 'unban') return { ...u, status: 'active' };
        if (actionDialog.type === 'suspend') return { ...u, status: 'suspended' };
      }
      return u;
    });
    if (actionDialog.type === 'delete') {
      setUsers(users.filter((u) => u.id !== actionDialog.user?.id));
      toast.success(`${actionDialog.user.name}'s account has been permanently deleted`);
    } else {
      setUsers(updatedUsers);
      const messages: Record<string, string> = {
        ban: `${actionDialog.user.name} has been banned`,
        unban: `${actionDialog.user.name} has been unbanned`,
        suspend: `${actionDialog.user.name} has been suspended for ${suspendDuration} days`,
      };
      toast.success(messages[actionDialog.type!] || 'Action completed');
    }
    setActionDialog({ type: null, user: null });
  };

  const handleSendResetEmail = () => {
    setResetSending(true);
    setTimeout(() => {
      setResetSending(false);
      setResetEmailSent(true);
      toast.success('Reset link sent to ' + actionDialog.user?.email);
    }, 1200);
  };

  const copyResetLink = () => {
    navigator.clipboard.writeText(resetLink);
    toast.success('Reset link copied to clipboard');
  };

  const handleBulkAction = (action: 'ban' | 'suspend' | 'delete') => {
    const count = selectedIds.size;
    if (action === 'ban') {
      setUsers(users.map(u => selectedIds.has(u.id) ? { ...u, status: 'banned' } : u));
      toast.success(`${count} user(s) banned`);
    } else if (action === 'suspend') {
      setUsers(users.map(u => selectedIds.has(u.id) ? { ...u, status: 'suspended' } : u));
      toast.success(`${count} user(s) suspended`);
    } else if (action === 'delete') {
      setUsers(users.filter(u => !selectedIds.has(u.id)));
      toast.success(`${count} user(s) deleted`);
    }
    setSelectedIds(new Set());
  };

  const handleApplyRestriction = (user: User) => {
    setCooldownUser(user);
    setCooldownOpen(true);
  };

  const isDestructiveAction = actionDialog.type === 'ban' || actionDialog.type === 'delete';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl tracking-tight">User Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage users, permissions, and restrictions
          </p>
        </div>
        <Button>
          <UserPlus className="mr-2 size-4" />
          Add User
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <Filter className="mr-2 size-4" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-4 py-2.5">
          <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>
          <Separator orientation="vertical" className="h-5" />
          <Button variant="outline" size="sm" onClick={() => handleBulkAction('suspend')}>
            <Clock className="mr-1.5 size-3.5" />Suspend
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleBulkAction('ban')}>
            <Ban className="mr-1.5 size-3.5" />Ban
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleBulkAction('delete')}>
            <Trash2 className="mr-1.5 size-3.5" />Delete
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>Clear</Button>
        </div>
      )}

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
              </TableHead>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead>Reports</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id} className={selectedIds.has(user.id) ? 'bg-primary/[0.03]' : ''}>
                <TableCell>
                  <Checkbox checked={selectedIds.has(user.id)} onCheckedChange={() => toggleOne(user.id)} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3 cursor-pointer group" onClick={() => handleViewProfile(user)}>
                    <Avatar>
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm group-hover:text-primary transition-colors">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{user.role}</Badge>
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleStatusClick(user)}
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs cursor-pointer hover:opacity-80 transition-opacity ${statusColor(user.status)}`}
                        >
                          {user.status}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <span className="text-xs">Click to view status history</span>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {/* Cooldown badge */}
                  {user.restriction && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="ml-1.5 inline-flex items-center rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800 px-1.5 py-0 text-[10px] cursor-default">
                            <Clock className="size-2.5 mr-0.5" />
                            {user.restriction.type}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs space-y-0.5">
                            <p>{user.restriction.remaining}</p>
                            <p className="text-muted-foreground">{user.restriction.reason}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{user.joinedAt}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{user.lastActive}</TableCell>
                <TableCell>
                  {user.reports > 0 ? (
                    <button
                      onClick={() => handleReportClick(user)}
                      className="inline-flex items-center rounded-full bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 px-2 py-0.5 text-xs cursor-pointer hover:bg-red-500/20 transition-colors"
                    >
                      {user.reports}
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem onClick={() => handleViewProfile(user)}>
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/admin/users/${user.id}`)}>
                        Open Full Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.open(`/admin/users/${user.id}`, '_blank')}>
                        <ExternalLink className="mr-2 size-4" />Open in New Tab
                      </DropdownMenuItem>
                      {user.reports > 0 && (
                        <DropdownMenuItem onClick={() => handleReportClick(user)}>
                          View Reports ({user.reports})
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      {user.status === 'active' && (
                        <>
                          <DropdownMenuItem onClick={() => openAction('suspend', user)}>
                            <Clock className="mr-2 size-4" />Suspend User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleApplyRestriction(user)}>
                            <Shield className="mr-2 size-4" />Apply Restriction
                          </DropdownMenuItem>
                        </>
                      )}
                      {user.status === 'banned' ? (
                        <DropdownMenuItem onClick={() => openAction('unban', user)}>
                          <UserX className="mr-2 size-4" />Unban User
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => openAction('ban', user)}>
                          <Ban className="mr-2 size-4" />Ban User
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => openAction('reset-password', user)}>
                        <Key className="mr-2 size-4" />Reset Password
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => openAction('delete', user)} className="text-red-600 dark:text-red-400">
                        <Trash2 className="mr-2 size-4" />Delete Account
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing {filteredUsers.length} of {users.length} users</span>
      </div>

      {/* Profile Panel */}
      <UserProfilePanel
        user={selectedUser}
        open={profilePanelOpen}
        onClose={() => setProfilePanelOpen(false)}
        onAction={(type) => {
          if (selectedUser) {
            setProfilePanelOpen(false);
            if (type === 'restrict') {
              handleApplyRestriction(selectedUser);
            } else {
              openAction(type as any, selectedUser);
            }
          }
        }}
      />

      {/* Report Drawer */}
      {reportDrawerUser && (
        <ReportDrawer
          open={reportDrawerOpen}
          onClose={() => setReportDrawerOpen(false)}
          userName={reportDrawerUser.name}
          userEmail={reportDrawerUser.email}
          reports={getMockReportDetails(reportDrawerUser.name)}
          onResolve={(reportId, action, reason) => {
            toast.success(`Report resolved — ${action}`);
          }}
        />
      )}

      {/* Status History */}
      {statusHistoryUser && (
        <StatusHistoryPanel
          open={statusHistoryOpen}
          onClose={() => setStatusHistoryOpen(false)}
          userName={statusHistoryUser.name}
          currentStatus={statusHistoryUser.status}
          history={getMockStatusHistory(statusHistoryUser)}
        />
      )}

      {/* Cooldown Selector */}
      {cooldownUser && (
        <CooldownSelector
          open={cooldownOpen}
          onClose={() => setCooldownOpen(false)}
          userName={cooldownUser.name}
          onApply={(restriction) => {
            setUsers(users.map(u => u.id === cooldownUser.id ? {
              ...u,
              restriction: {
                type: restriction.type,
                remaining: restriction.duration === 'custom'
                  ? restriction.customDuration || 'custom'
                  : restriction.duration,
                reason: restriction.reason,
              },
            } : u));
            toast.success(`Restriction applied to ${cooldownUser.name}`);
            setCooldownOpen(false);
          }}
        />
      )}

      {/* Ban / Suspend / Delete / Unban Dialog */}
      <AlertDialog
        open={actionDialog.type !== null && actionDialog.type !== 'reset-password'}
        onOpenChange={() => setActionDialog({ type: null, user: null })}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {isDestructiveAction && (
                <div className="flex size-8 items-center justify-center rounded-full bg-red-500/10">
                  <AlertTriangle className="size-4 text-red-500" />
                </div>
              )}
              {actionDialog.type === 'ban' && 'Ban User'}
              {actionDialog.type === 'unban' && 'Unban User'}
              {actionDialog.type === 'suspend' && 'Suspend User'}
              {actionDialog.type === 'delete' && 'Delete User Account'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  {actionDialog.type === 'ban' && `Are you sure you want to ban ${actionDialog.user?.name}?`}
                  {actionDialog.type === 'unban' && `Restore full access for ${actionDialog.user?.name}?`}
                  {actionDialog.type === 'suspend' && `Temporarily restrict ${actionDialog.user?.name}'s access?`}
                  {actionDialog.type === 'delete' && `Permanently delete ${actionDialog.user?.name}'s account?`}
                </p>

                {/* Consequences */}
                {(actionDialog.type === 'ban' || actionDialog.type === 'delete') && (
                  <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-3 space-y-1.5">
                    <p className="text-xs text-red-800 dark:text-red-300">{actionDialog.type === 'ban' ? 'This will:' : 'This will permanently:'}</p>
                    <ul className="text-xs text-red-700 dark:text-red-400 space-y-1 list-disc list-inside">
                      {actionDialog.type === 'ban' && (<><li>Immediately revoke platform access</li><li>Hide all user content from public view</li><li>Prevent login and new registrations with this email</li></>)}
                      {actionDialog.type === 'delete' && (<><li>Remove account and all personal data</li><li>Delete all posts, comments, and submissions</li><li>This action cannot be undone</li></>)}
                    </ul>
                  </div>
                )}
                {actionDialog.type === 'suspend' && (
                  <div className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-3 space-y-1.5">
                    <p className="text-xs text-amber-800 dark:text-amber-300">This will:</p>
                    <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1 list-disc list-inside">
                      <li>Restrict posting and commenting</li><li>Allow read-only access</li><li>Automatically expire after the set duration</li>
                    </ul>
                  </div>
                )}

                {actionDialog.type === 'suspend' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Duration</Label>
                    <Select value={suspendDuration} onValueChange={setSuspendDuration}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 day</SelectItem>
                        <SelectItem value="3">3 days</SelectItem>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="14">14 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {(actionDialog.type === 'ban' || actionDialog.type === 'suspend') && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Reason <span className="text-red-500">*</span></Label>
                    <Textarea value={actionReason} onChange={(e) => setActionReason(e.target.value)} placeholder="Provide a reason..." rows={2} className="resize-none" />
                  </div>
                )}

                {actionDialog.type !== 'unban' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Internal note (optional)</Label>
                    <Input value={actionNote} onChange={(e) => setActionNote(e.target.value)} placeholder="Add a note for admin logs..." />
                  </div>
                )}

                {/* Attachment */}
                {actionDialog.type !== 'unban' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Attach evidence (optional)</Label>
                    <MediaAttachment files={actionFiles} onChange={setActionFiles} maxFiles={3} compact />
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAction} className={isDestructiveAction ? 'bg-red-600 hover:bg-red-700 text-white' : ''}>
              {actionDialog.type === 'delete' && 'Delete Permanently'}
              {actionDialog.type === 'ban' && 'Ban User'}
              {actionDialog.type === 'unban' && 'Unban User'}
              {actionDialog.type === 'suspend' && 'Suspend User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Dialog */}
      <Dialog open={actionDialog.type === 'reset-password'} onOpenChange={() => setActionDialog({ type: null, user: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>Generate a password reset link for {actionDialog.user?.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-border p-3">
              <Avatar className="size-10"><AvatarFallback>{actionDialog.user?.name.charAt(0)}</AvatarFallback></Avatar>
              <div>
                <div className="text-sm">{actionDialog.user?.name}</div>
                <div className="text-xs text-muted-foreground">{actionDialog.user?.email}</div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Reset Link</Label>
              <div className="flex gap-2">
                <div className="flex-1 rounded-lg border border-border bg-muted p-2.5 overflow-hidden">
                  <code className="text-xs break-all text-muted-foreground">{resetLink}</code>
                </div>
                <Button variant="outline" size="icon" onClick={copyResetLink} className="shrink-0"><Copy className="size-4" /></Button>
              </div>
            </div>
            {resetEmailSent ? (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-3">
                <div className="size-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Mail className="size-3 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-emerald-800 dark:text-emerald-300">Reset link sent to {actionDialog.user?.email}</p>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleSendResetEmail}>
                  <RefreshCw className="size-3 mr-1" />Resend
                </Button>
              </div>
            ) : (
              <Button className="w-full" onClick={handleSendResetEmail} disabled={resetSending}>
                {resetSending ? (<><RefreshCw className="size-4 mr-2 animate-spin" />Sending...</>) : (<><Mail className="size-4 mr-2" />Send Reset Link via Email</>)}
              </Button>
            )}
            <p className="text-xs text-muted-foreground">This link expires in 24 hours. The user's current password remains valid until they set a new one.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ type: null, user: null })}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}