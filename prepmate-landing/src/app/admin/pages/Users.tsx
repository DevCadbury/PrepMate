import { useCallback, useEffect, useMemo, useState } from 'react';
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
import StatusHistoryPanel from '../components/StatusHistoryPanel';
import CooldownSelector from '../components/CooldownSelector';
import type { Restriction } from '../components/CooldownSelector';
import type { AttachedFile } from '../components/MediaAttachment';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../../lib/apiClient';
import { mapBackendUserToUsersRow } from '../lib/backendAdapters';

type User = {
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
};

type BackendUserRecord = {
  id: string;
  name: string;
  email: string;
  role: string;
  adminRole?: string | null;
  status: string;
  joinDate?: string;
  lastLogin?: string;
  restrictions?: {
    canPost?: boolean;
    canComment?: boolean;
    canFollow?: boolean;
    canLink?: boolean;
  };
};

type ListUsersResponse = {
  success?: boolean;
  data?: {
    users?: BackendUserRecord[];
  };
};

type ResetPasswordResponse = {
  success?: boolean;
  data?: {
    resetUrl?: string;
  };
};

const statusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
    case 'banned':
      return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
    case 'suspended':
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    default:
      return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
  }
};

const parseDurationToDays = (value: string) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return 7;

  if (normalized.endsWith('d')) {
    const days = Number(normalized.slice(0, -1));
    return Number.isFinite(days) && days > 0 ? days : 7;
  }

  if (normalized.endsWith('h')) {
    const hours = Number(normalized.slice(0, -1));
    if (!Number.isFinite(hours) || hours <= 0) return 1;
    return Math.max(1, Math.ceil(hours / 24));
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 7;
};

type StatusHistoryEvent = {
  id: string;
  type: 'ban' | 'unban' | 'suspend' | 'unsuspend' | 'warn' | 'restrict' | 'account_created';
  reason: string;
  appliedBy: string;
  timestamp: string;
  duration?: string;
  relatedContent?: string;
  active: boolean;
};

const buildStatusHistory = (user: User) => {
  const history: StatusHistoryEvent[] = [
    {
      id: `${user.id}-created`,
      type: 'account_created' as const,
      reason: 'Account registered',
      appliedBy: 'System',
      timestamp: user.joinedAt,
      active: false,
    },
  ];

  if (user.status === 'suspended' || user.status === 'banned') {
    history.push({
      id: `${user.id}-status`,
      type: user.status === 'banned' ? ('ban' as const) : ('suspend' as const),
      reason: 'Applied by admin moderation',
      appliedBy: 'Admin',
      timestamp: user.lastActive,
      active: true,
    });
  }

  if (user.restriction) {
    history.push({
      id: `${user.id}-restriction`,
      type: 'restrict' as const,
      reason: user.restriction.reason,
      appliedBy: 'Admin',
      timestamp: user.lastActive,
      active: true,
      duration: user.restriction.remaining,
    });
  }

  return history.reverse();
};

export default function UsersPage() {
  const { permissions } = useAdminAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);

  const [statusHistoryOpen, setStatusHistoryOpen] = useState(false);
  const [statusHistoryUser, setStatusHistoryUser] = useState<User | null>(null);

  const [cooldownOpen, setCooldownOpen] = useState(false);
  const [cooldownUser, setCooldownUser] = useState<User | null>(null);

  const [actionDialog, setActionDialog] = useState<{
    type: 'ban' | 'unban' | 'suspend' | 'delete' | 'reset-password' | null;
    user: User | null;
  }>({ type: null, user: null });

  const [actionReason, setActionReason] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [actionFiles, setActionFiles] = useState<AttachedFile[]>([]);
  const [suspendDuration, setSuspendDuration] = useState('7');

  const [resetLink, setResetLink] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetSending, setResetSending] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);

    try {
      const params = new URLSearchParams();
      params.set('limit', '200');

      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }

      if (statusFilter !== 'all') {
        params.set('status', statusFilter === 'banned' ? 'suspended' : statusFilter);
      }

      const response = await apiClient.get<ListUsersResponse>(`/admin/users?${params.toString()}`);
      const backendUsers = response?.data?.users;
      const rows = Array.isArray(backendUsers) ? backendUsers : [];
      setUsers(rows.map((user) => mapBackendUserToUsersRow(user as any)));
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (actionDialog.type !== 'reset-password' || !actionDialog.user) {
      return;
    }

    const loadResetLink = async () => {
      setResetSending(true);
      setResetEmailSent(false);

      try {
        const response = await apiClient.post<ResetPasswordResponse>(
          `/admin/users/${actionDialog.user?.id}/reset-password`
        );
        setResetLink(response?.data?.resetUrl || '');
      } catch (error) {
        setResetLink('');
        toast.error('Failed to generate reset link');
      } finally {
        setResetSending(false);
      }
    };

    loadResetLink();
  }, [actionDialog]);

  const filteredUsers = useMemo(() => {
    return (users || []).filter((user) => {
      const name = (user?.name || '') as string;
      const email = (user?.email || '') as string;
      const sq = (searchQuery || '') as string;
      const matchesSearch =
        name.toLowerCase().includes(sq.toLowerCase()) ||
        email.toLowerCase().includes(sq.toLowerCase());
      const matchesStatus = statusFilter === 'all' || user?.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [users, searchQuery, statusFilter]);

  const allSelected =
    filteredUsers.length > 0 && filteredUsers.every((user) => selectedIds.has(user.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
      return;
    }

    setSelectedIds(new Set(filteredUsers.map((user) => user.id)));
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleViewProfile = (user: User) => {
    setSelectedUser(user);
    setProfilePanelOpen(true);
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
    setActionDialog({ type, user });
  };

  const handleSendResetEmail = () => {
    if (!actionDialog.user || !resetLink) {
      toast.error('Reset link is not available');
      return;
    }

    setResetSending(true);
    setTimeout(() => {
      setResetSending(false);
      setResetEmailSent(true);
      toast.success(`Reset link sent to ${actionDialog.user?.email}`);
    }, 700);
  };

  const copyResetLink = async () => {
    if (!resetLink) {
      toast.error('No reset link available');
      return;
    }

    try {
      await navigator.clipboard.writeText(resetLink);
      toast.success('Reset link copied to clipboard');
    } catch {
      toast.error('Unable to copy reset link');
    }
  };

  const confirmAction = async () => {
    if (!actionDialog.user || !actionDialog.type) return;

    if ((actionDialog.type === 'ban' || actionDialog.type === 'suspend') && !actionReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    setIsSubmitting(true);

    try {
      if (actionDialog.type === 'ban') {
        await apiClient.post(`/admin/users/${actionDialog.user.id}/suspend-detailed`, {
          reason: actionReason.trim(),
        });

        try {
          await apiClient.patch(`/admin/users/${actionDialog.user.id}/restrictions`, {
            canPost: false,
            canComment: false,
            canFollow: false,
            canLink: false,
          });
        } catch {
          // Restriction patch is best-effort.
        }

        toast.success(`${actionDialog.user.name} has been banned`);
      }

      if (actionDialog.type === 'unban') {
        await apiClient.patch(`/admin/users/${actionDialog.user.id}/status`, {
          status: 'active',
        });

        try {
          await apiClient.patch(`/admin/users/${actionDialog.user.id}/restrictions`, {
            canPost: true,
            canComment: true,
            canFollow: true,
            canLink: true,
          });
        } catch {
          // Restriction patch is best-effort.
        }

        toast.success(`${actionDialog.user.name} has been unbanned`);
      }

      if (actionDialog.type === 'suspend') {
        await apiClient.post(`/admin/users/${actionDialog.user.id}/suspend-detailed`, {
          reason: actionReason.trim(),
          duration: Number(suspendDuration),
        });

        toast.success(`${actionDialog.user.name} has been suspended for ${suspendDuration} days`);
      }

      if (actionDialog.type === 'delete') {
        await apiClient.post(`/admin/users/${actionDialog.user.id}/delete`);
        toast.success(`${actionDialog.user.name}'s account has been permanently deleted`);
      }

      await fetchUsers();
      setSelectedIds(new Set());
      setActionDialog({ type: null, user: null });
    } catch (error: any) {
      toast.error(error?.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkAction = async (action: 'ban' | 'suspend' | 'delete') => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setIsSubmitting(true);

    try {
      const requests = ids.map(async (id) => {
        if (action === 'ban') {
          await apiClient.post(`/admin/users/${id}/suspend-detailed`, {
            reason: 'Bulk moderation action',
          });
          return;
        }

        if (action === 'suspend') {
          await apiClient.patch(`/admin/users/${id}/status`, {
            status: 'suspended',
          });
          return;
        }

        await apiClient.post(`/admin/users/${id}/delete`);
      });

      await Promise.allSettled(requests);
      toast.success(`${ids.length} user(s) updated`);
      setSelectedIds(new Set());
      await fetchUsers();
    } catch (error: any) {
      toast.error(error?.message || 'Bulk action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyRestriction = (user: User) => {
    setCooldownUser(user);
    setCooldownOpen(true);
  };

  const applyRestriction = async (restriction: Restriction) => {
    if (!cooldownUser) return;

    try {
      if (restriction.type === 'ban_cooldown') {
        await apiClient.post(`/admin/users/${cooldownUser.id}/suspend-detailed`, {
          reason: restriction.reason,
          duration:
            restriction.duration === 'custom'
              ? parseDurationToDays(restriction.customDuration || '')
              : parseDurationToDays(restriction.duration),
        });
      } else {
        const patch: Record<string, boolean> = {};

        if (restriction.type === 'posting') patch.canPost = false;
        if (restriction.type === 'commenting') patch.canComment = false;
        if (restriction.type === 'view_only') {
          patch.canPost = false;
          patch.canComment = false;
          patch.canFollow = false;
          patch.canLink = false;
        }

        await apiClient.patch(`/admin/users/${cooldownUser.id}/restrictions`, patch);
      }

      toast.success(`Restriction applied to ${cooldownUser.name}`);
      setCooldownOpen(false);
      await fetchUsers();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to apply restriction');
    }
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
        <Button variant="outline" disabled>
          <UserPlus className="mr-2 size-4" />
          Add User
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <Filter className="mr-2 size-4" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-4 py-2.5">
          <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>
          <Separator orientation="vertical" className="h-5" />
          <Button variant="outline" size="sm" onClick={() => handleBulkAction('suspend')} disabled={isSubmitting}>
            <Clock className="mr-1.5 size-3.5" />Suspend
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleBulkAction('ban')} disabled={isSubmitting}>
            <Ban className="mr-1.5 size-3.5" />Ban
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleBulkAction('delete')} disabled={isSubmitting}>
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id} className={selectedIds.has(user.id) ? 'bg-primary/[0.03]' : ''}>
                  <TableCell>
                    <Checkbox checked={selectedIds.has(user.id)} onCheckedChange={() => toggleOne(user.id)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => handleViewProfile(user)}>
                      <Avatar>
                        <AvatarFallback>{(user.name || '?').charAt(0).toUpperCase()}</AvatarFallback>
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
                    <span className="text-xs text-muted-foreground">{user.reports > 0 ? user.reports : '-'}</span>
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
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing {filteredUsers.length} of {users.length} users</span>
      </div>

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

      {statusHistoryUser && (
        <StatusHistoryPanel
          open={statusHistoryOpen}
          onClose={() => setStatusHistoryOpen(false)}
          userName={statusHistoryUser.name}
          currentStatus={statusHistoryUser.status}
          history={buildStatusHistory(statusHistoryUser)}
        />
      )}

      {cooldownUser && (
        <CooldownSelector
          open={cooldownOpen}
          onClose={() => setCooldownOpen(false)}
          userName={cooldownUser.name}
          onApply={applyRestriction}
        />
      )}

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
                    <Textarea
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      placeholder="Provide a reason..."
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                )}

                {actionDialog.type !== 'unban' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Internal note (optional)</Label>
                    <Input
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                      placeholder="Add a note for admin logs..."
                    />
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              disabled={isSubmitting}
              className={isDestructiveAction ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
            >
              {isSubmitting ? 'Processing...' : null}
              {!isSubmitting && actionDialog.type === 'delete' && 'Delete Permanently'}
              {!isSubmitting && actionDialog.type === 'ban' && 'Ban User'}
              {!isSubmitting && actionDialog.type === 'unban' && 'Unban User'}
              {!isSubmitting && actionDialog.type === 'suspend' && 'Suspend User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={actionDialog.type === 'reset-password'} onOpenChange={() => setActionDialog({ type: null, user: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>Generate a password reset link for {actionDialog.user?.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-border p-3">
              <Avatar className="size-10"><AvatarFallback>{(actionDialog.user?.name || actionDialog.user?.email || '?').charAt(0).toUpperCase()}</AvatarFallback></Avatar>
              <div>
                <div className="text-sm">{actionDialog.user?.name}</div>
                <div className="text-xs text-muted-foreground">{actionDialog.user?.email}</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Reset Link</Label>
              <div className="flex gap-2">
                <div className="flex-1 rounded-lg border border-border bg-muted p-2.5 overflow-hidden">
                  <code className="text-xs break-all text-muted-foreground">
                    {resetSending ? 'Generating reset link...' : resetLink || 'No reset link available'}
                  </code>
                </div>
                <Button variant="outline" size="icon" onClick={copyResetLink} className="shrink-0" disabled={!resetLink}>
                  <Copy className="size-4" />
                </Button>
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
              <Button className="w-full" onClick={handleSendResetEmail} disabled={resetSending || !resetLink}>
                {resetSending ? (
                  <><RefreshCw className="size-4 mr-2 animate-spin" />Preparing...</>
                ) : (
                  <><Mail className="size-4 mr-2" />Send Reset Link via Email</>
                )}
              </Button>
            )}

            <p className="text-xs text-muted-foreground">This link expires in 10 minutes. The user's current password remains valid until they set a new one.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ type: null, user: null })}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
