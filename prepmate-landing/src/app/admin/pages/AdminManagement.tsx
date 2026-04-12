import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, UserPlus, Edit, Trash2, Shield, Activity, User, FileText, Settings, Flag, Clock } from 'lucide-react';
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
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { ScrollArea } from '../../components/ui/scroll-area';
import { toast } from 'sonner';
import { AdminUser, AdminLog } from '../../types/admin';
import { apiClient } from '../../../lib/apiClient';
import { fetchRecentLogEntries } from '../lib/backendAdapters';

type BackendAdminUser = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  adminRole?: string | null;
  joinDate?: string;
  lastLogin?: string;
};

type ListUsersResponse = {
  success?: boolean;
  data?: {
    users?: BackendAdminUser[];
  };
};

const typeIcons: Record<string, typeof User> = {
  user: User,
  content: FileText,
  admin: Shield,
  report: Flag,
  settings: Settings,
  system: Activity,
};

const typeColor = (type: string) => {
  switch (type) {
    case 'user': return 'bg-sky-500/10 text-sky-600 dark:text-sky-400';
    case 'content': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
    case 'admin': return 'bg-violet-500/10 text-violet-600 dark:text-violet-400';
    case 'report': return 'bg-red-500/10 text-red-600 dark:text-red-400';
    case 'settings': return 'bg-slate-500/10 text-slate-600 dark:text-slate-400';
    case 'system': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    default: return 'bg-muted text-muted-foreground';
  }
};

const roleLabel = (role: string) => {
  const normalized = String(role || '').trim().toLowerCase();
  if (normalized === 'superadmin') return 'super admin';
  return normalized.replace(/_/g, ' ');
};

const toUiAdminRole = (role?: string | null): AdminUser['role'] => {
  const normalized = String(role || '').trim().toLowerCase();
  if (normalized === 'superadmin') return 'super_admin';
  if (normalized === 'moderator') return 'moderator';
  if (normalized === 'support_admin') return 'support_admin';
  if (normalized === 'analytics_admin') return 'analytics_admin';
  return 'support_admin';
};

const toBackendAdminRole = (role: string) => {
  const normalized = String(role || '').trim().toLowerCase();
  if (normalized === 'super_admin' || normalized === 'superadmin') return 'superadmin';
  if (normalized === 'moderator') return 'moderator';
  if (normalized === 'support_admin') return 'support_admin';
  if (normalized === 'analytics_admin') return 'analytics_admin';
  return 'support_admin';
};

const toDateLabel = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString();
};

const toRelativeTime = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  const deltaMs = Date.now() - date.getTime();
  const minutes = Math.floor(deltaMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;

  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? '' : 's'} ago`;
};

const mapCategoryToLogType = (category?: string): AdminLog['type'] => {
  switch (String(category || '').toLowerCase()) {
    case 'auth':
    case 'user':
      return 'user';
    case 'content':
    case 'coding':
      return 'content';
    case 'report':
      return 'report';
    case 'admin':
      return 'admin';
    case 'settings':
      return 'settings';
    default:
      return 'system';
  }
};

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [addAdminOpen, setAddAdminOpen] = useState(false);
  const [editAdmin, setEditAdmin] = useState<AdminUser | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<AdminUser | null>(null);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', role: 'moderator' });

  const [logSearch, setLogSearch] = useState('');
  const [logTypeFilter, setLogTypeFilter] = useState('all');
  const [logAdminFilter, setLogAdminFilter] = useState('all');

  const fetchAdmins = useCallback(async () => {
    setIsLoadingAdmins(true);

    try {
      const response = await apiClient.get<ListUsersResponse>('/admin/users?role=admin&limit=200');
      const backendUsers = response?.data?.users;
      const rows = Array.isArray(backendUsers) ? backendUsers : [];

      setAdmins(
        rows.map((user) => ({
          id: String(user?.id || ''),
          name: String(user?.name || 'Unknown'),
          email: String(user?.email || ''),
          role: toUiAdminRole(user?.adminRole),
          createdAt: toDateLabel(user?.joinDate),
          lastActive: toRelativeTime(user?.lastLogin || user?.joinDate),
        }))
      );
    } catch {
      setAdmins([]);
      toast.error('Failed to load admin users');
    } finally {
      setIsLoadingAdmins(false);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setIsLoadingLogs(true);

    try {
      const entries = await fetchRecentLogEntries(400);
      const mapped: AdminLog[] = entries.map((entry) => ({
        id: entry.id,
        adminName: entry.actor.name,
        adminEmail: entry.actor.email,
        action: entry.action,
        target: entry.target.label,
        timestamp: entry.relativeTime,
        details: entry.details,
        type: mapCategoryToLogType(entry.category),
      }));
      setLogs(mapped);
    } catch {
      setLogs([]);
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
    fetchLogs();
  }, [fetchAdmins, fetchLogs]);

  const filteredAdmins = useMemo(
    () => admins.filter(
      (admin) =>
        admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [admins, searchQuery]
  );

  const filteredLogs = useMemo(() => logs.filter((log) => {
    const q = logSearch.toLowerCase();
    const matchesSearch =
      !q ||
      log.action.toLowerCase().includes(q) ||
      log.target.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.adminName.toLowerCase().includes(q) ||
      log.adminEmail.toLowerCase().includes(q);
    const matchesType = logTypeFilter === 'all' || log.type === logTypeFilter;
    const matchesAdmin = logAdminFilter === 'all' || log.adminEmail === logAdminFilter;
    return matchesSearch && matchesType && matchesAdmin;
  }), [logs, logSearch, logTypeFilter, logAdminFilter]);

  const uniqueAdminEmails = useMemo(() => [...new Set(logs.map((log) => log.adminEmail))], [logs]);

  const handleAddAdmin = async () => {
    if (!newAdmin.email.trim()) {
      toast.error('Email is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const params = new URLSearchParams();
      params.set('search', newAdmin.email.trim());
      params.set('limit', '25');

      const searchResponse = await apiClient.get<ListUsersResponse>(`/admin/users?${params.toString()}`);
      const foundUsers = searchResponse?.data?.users;
      const rows = Array.isArray(foundUsers) ? foundUsers : [];
      const exactMatch = rows.find(
        (user) => String(user?.email || '').toLowerCase() === newAdmin.email.trim().toLowerCase()
      );

      if (!exactMatch?.id) {
        toast.error('User not found. Ask the user to sign up first.');
        return;
      }

      await apiClient.put(`/admin/users/${exactMatch.id}/role`, { role: 'admin' });
      await apiClient.patch(`/admin/users/${exactMatch.id}/admin-role`, {
        adminRole: toBackendAdminRole(newAdmin.role),
      });

      toast.success('Admin access granted');
      setAddAdminOpen(false);
      setNewAdmin({ name: '', email: '', role: 'moderator' });
      await Promise.all([fetchAdmins(), fetchLogs()]);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to grant admin access');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAdmin = async () => {
    if (!editAdmin?.id) return;

    setIsSubmitting(true);

    try {
      await apiClient.patch(`/admin/users/${editAdmin.id}/admin-role`, {
        adminRole: toBackendAdminRole(editAdmin.role),
      });

      toast.success('Admin role updated');
      setEditAdmin(null);
      await Promise.all([fetchAdmins(), fetchLogs()]);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update admin role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!deleteDialog?.id) return;

    if (deleteDialog.role === 'super_admin') {
      toast.error('Super admin access cannot be removed from this panel');
      setDeleteDialog(null);
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.put(`/admin/users/${deleteDialog.id}/role`, { role: 'support' });
      toast.success('Admin access removed');
      setDeleteDialog(null);
      await Promise.all([fetchAdmins(), fetchLogs()]);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to remove admin access');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl tracking-tight">Admin Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage admin users and view activity logs
          </p>
        </div>
        <Button onClick={() => setAddAdminOpen(true)}>
          <UserPlus className="mr-2 size-4" />
          Add Admin
        </Button>
      </div>

      <Tabs defaultValue="admins" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="admins">Admin Users</TabsTrigger>
          <TabsTrigger value="logs">
            Activity Logs
            <span className="ml-1.5 inline-flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {logs.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="admins" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search admins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admin</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingAdmins && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-10">
                      Loading admin users...
                    </TableCell>
                  </TableRow>
                )}

                {!isLoadingAdmins && filteredAdmins.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-10">
                      No admin users found
                    </TableCell>
                  </TableRow>
                )}

                {!isLoadingAdmins && filteredAdmins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {admin.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm">{admin.name}</div>
                          <div className="text-xs text-muted-foreground">{admin.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {roleLabel(admin.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{admin.createdAt || '-'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{admin.lastActive || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => setEditAdmin(admin)}>
                          <Edit className="size-4" />
                        </Button>
                        {admin.role !== 'super_admin' && (
                          <Button variant="ghost" size="icon" className="size-8" onClick={() => setDeleteDialog(admin)}>
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={logTypeFilter} onValueChange={setLogTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="content">Content</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="report">Report</SelectItem>
                <SelectItem value="settings">Settings</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            <Select value={logAdminFilter} onValueChange={setLogAdminFilter}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Admin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Admins</SelectItem>
                {uniqueAdminEmails.map((email) => (
                  <SelectItem key={email} value={email}>{email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-border">
            <ScrollArea className="h-[600px]">
              {isLoadingLogs ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Activity className="size-8 text-muted-foreground/30" />
                  <p className="mt-3 text-sm text-muted-foreground">Loading logs...</p>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Activity className="size-8 text-muted-foreground/30" />
                  <p className="mt-3 text-sm text-muted-foreground">No matching logs</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredLogs.map((log) => {
                    const Icon = typeIcons[log.type] || Activity;
                    return (
                      <div key={log.id} className="flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors">
                        <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${typeColor(log.type)}`}>
                          <Icon className="size-4" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm truncate">{log.adminName}</span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">{log.type}</Badge>
                            </div>
                            <span className="text-[11px] text-muted-foreground shrink-0 flex items-center gap-1">
                              <Clock className="size-3" />
                              {log.timestamp}
                            </span>
                          </div>
                          <p className="text-sm">
                            <span className="text-foreground">{log.action}</span>
                            <span className="text-muted-foreground"> - {log.target}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">{log.details}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          <div className="text-sm text-muted-foreground">
            Showing {filteredLogs.length} of {logs.length} log entries
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={addAdminOpen} onOpenChange={setAddAdminOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Admin Access</DialogTitle>
            <DialogDescription>
              Grant admin privileges to an existing user account by email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Name (optional)</Label>
              <Input value={newAdmin.name} onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })} placeholder="John Doe" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input type="email" value={newAdmin.email} onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })} placeholder="john@prepmate.com" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Role</Label>
              <Select value={newAdmin.role} onValueChange={(value) => setNewAdmin({ ...newAdmin, role: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="support_admin">Support Admin</SelectItem>
                  <SelectItem value="analytics_admin">Analytics Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddAdminOpen(false)}>Cancel</Button>
            <Button onClick={handleAddAdmin} disabled={isSubmitting}>Grant Access</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editAdmin} onOpenChange={() => setEditAdmin(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Admin Role</DialogTitle>
            <DialogDescription>
              Update this admin user role.
            </DialogDescription>
          </DialogHeader>
          {editAdmin && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Name</Label>
                <Input value={editAdmin.name} readOnly />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input type="email" value={editAdmin.email} readOnly />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Role</Label>
                <Select value={editAdmin.role} onValueChange={(value) => setEditAdmin({ ...editAdmin, role: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="support_admin">Support Admin</SelectItem>
                    <SelectItem value="analytics_admin">Analytics Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAdmin(null)}>Cancel</Button>
            <Button onClick={handleUpdateAdmin} disabled={isSubmitting}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Admin Access</AlertDialogTitle>
            <AlertDialogDescription>
              Remove admin access for {deleteDialog?.name}? Their account will be downgraded to support role.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAdmin} className="bg-red-600 hover:bg-red-700 text-white" disabled={isSubmitting}>
              Remove Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
