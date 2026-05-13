import { useState } from 'react';
import { Search, UserPlus, Edit, Trash2, Shield, Activity, Filter, Calendar, User, FileText, Settings, Flag, Clock } from 'lucide-react';
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
import { Separator } from '../../components/ui/separator';
import { toast } from 'sonner';
import { AdminUser, AdminLog } from '../../types/admin';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';

const mockAdmins: AdminUser[] = [
  { id: '1', name: 'Admin User', email: 'admin@prepmate.com', role: 'super_admin', createdAt: 'Jan 1, 2024', lastActive: '5 min ago' },
  { id: '2', name: 'John Moderator', email: 'john.mod@prepmate.com', role: 'moderator', createdAt: 'Feb 15, 2024', lastActive: '2 hours ago' },
  { id: '3', name: 'Jane Support', email: 'jane.support@prepmate.com', role: 'support_admin', createdAt: 'Mar 10, 2024', lastActive: '1 day ago' },
  { id: '4', name: 'Alex Analytics', email: 'alex.analytics@prepmate.com', role: 'analytics_admin', createdAt: 'Apr 5, 2024', lastActive: '3 hours ago' },
];

const mockLogs: AdminLog[] = [
  { id: '1', adminName: 'Admin User', adminEmail: 'admin@prepmate.com', action: 'Banned user', target: 'bob.wilson@email.com', timestamp: '5 min ago', details: 'User banned for harassment', type: 'user' },
  { id: '2', adminName: 'John Moderator', adminEmail: 'john.mod@prepmate.com', action: 'Removed content', target: 'Post #12453', timestamp: '15 min ago', details: 'Inappropriate content removed', type: 'content' },
  { id: '3', adminName: 'Admin User', adminEmail: 'admin@prepmate.com', action: 'Created admin', target: 'jane.support@prepmate.com', timestamp: '1 hour ago', details: 'New support admin created', type: 'admin' },
  { id: '4', adminName: 'Jane Support', adminEmail: 'jane.support@prepmate.com', action: 'Resolved ticket', target: 'Ticket #892', timestamp: '2 hours ago', details: 'Support ticket resolved', type: 'report' },
  { id: '5', adminName: 'Admin User', adminEmail: 'admin@prepmate.com', action: 'Updated settings', target: 'API rate limit', timestamp: '3 hours ago', details: 'Rate limit changed to 1500/hr', type: 'settings' },
  { id: '6', adminName: 'John Moderator', adminEmail: 'john.mod@prepmate.com', action: 'Suspended user', target: 'mike.johnson@email.com', timestamp: '5 hours ago', details: 'Suspended for 7 days — spam', type: 'user' },
  { id: '7', adminName: 'Admin User', adminEmail: 'admin@prepmate.com', action: 'Deployed update', target: 'v2.4.1', timestamp: '1 day ago', details: 'System update deployed', type: 'system' },
  { id: '8', adminName: 'John Moderator', adminEmail: 'john.mod@prepmate.com', action: 'Approved report', target: 'Report #445', timestamp: '1 day ago', details: 'Report against user approved', type: 'report' },
];

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

const roleLabel = (role: string) => role.replace(/_/g, ' ');

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<AdminUser[]>(mockAdmins);
  const [logs] = useState<AdminLog[]>(mockLogs);
  const [searchQuery, setSearchQuery] = useState('');
  const [addAdminOpen, setAddAdminOpen] = useState(false);
  const [editAdmin, setEditAdmin] = useState<AdminUser | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<AdminUser | null>(null);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', role: 'moderator' });

  // Log filters
  const [logSearch, setLogSearch] = useState('');
  const [logTypeFilter, setLogTypeFilter] = useState('all');
  const [logAdminFilter, setLogAdminFilter] = useState('all');

  const filteredAdmins = admins.filter(
    (admin) =>
      (admin.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (admin.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLogs = logs.filter(log => {
    const matchesSearch = logSearch === '' ||
      (log.action || '').toLowerCase().includes(logSearch.toLowerCase()) ||
      (log.target || '').toLowerCase().includes(logSearch.toLowerCase()) ||
      (log.details || '').toLowerCase().includes(logSearch.toLowerCase());
    const matchesType = logTypeFilter === 'all' || log.type === logTypeFilter;
    const matchesAdmin = logAdminFilter === 'all' || log.adminEmail === logAdminFilter;
    return matchesSearch && matchesType && matchesAdmin;
  });

  const uniqueAdminEmails = [...new Set(logs.map(l => l.adminEmail))];

  const handleAddAdmin = () => {
    const admin: AdminUser = {
      id: String(admins.length + 1),
      name: newAdmin.name,
      email: newAdmin.email,
      role: newAdmin.role,
      createdAt: new Date().toLocaleDateString(),
      lastActive: 'Just now',
    };
    setAdmins([...admins, admin]);
    setAddAdminOpen(false);
    setNewAdmin({ name: '', email: '', role: 'moderator' });
    toast.success('Admin user created');
  };

  const handleUpdateAdmin = () => {
    if (!editAdmin) return;
    setAdmins(admins.map((a) => (a.id === editAdmin.id ? editAdmin : a)));
    setEditAdmin(null);
    toast.success('Admin updated');
  };

  const handleDeleteAdmin = () => {
    if (!deleteDialog) return;
    setAdmins(admins.filter((a) => a.id !== deleteDialog.id));
    setDeleteDialog(null);
    toast.success('Admin removed');
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
                {filteredAdmins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {(admin.name || '?').charAt(0).toUpperCase()}
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
                    <TableCell className="text-sm text-muted-foreground">{admin.createdAt}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{admin.lastActive}</TableCell>
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
          {/* Log Filters */}
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
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Admin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Admins</SelectItem>
                {uniqueAdminEmails.map(email => (
                  <SelectItem key={email} value={email}>{email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Log List */}
          <div className="rounded-lg border border-border">
            <ScrollArea className="h-[600px]">
              {filteredLogs.length === 0 ? (
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
                            <span className="text-muted-foreground"> — {log.target}</span>
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

      {/* Add Admin Dialog */}
      <Dialog open={addAdminOpen} onOpenChange={setAddAdminOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Admin</DialogTitle>
            <DialogDescription>Create a new admin user with a specific role.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Name</Label>
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
            <Button onClick={handleAddAdmin}>Create Admin</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Admin Dialog */}
      <Dialog open={!!editAdmin} onOpenChange={() => setEditAdmin(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Admin</DialogTitle>
            <DialogDescription>Update admin user details.</DialogDescription>
          </DialogHeader>
          {editAdmin && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Name</Label>
                <Input value={editAdmin.name} onChange={(e) => setEditAdmin({ ...editAdmin, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input type="email" value={editAdmin.email} onChange={(e) => setEditAdmin({ ...editAdmin, email: e.target.value })} />
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
            <Button onClick={handleUpdateAdmin}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Admin</AlertDialogTitle>
            <AlertDialogDescription>
              Remove {deleteDialog?.name} from admin access? They will no longer be able to access the admin panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAdmin} className="bg-red-600 hover:bg-red-700 text-white">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
