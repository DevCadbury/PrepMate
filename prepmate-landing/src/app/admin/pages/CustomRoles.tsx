import { useState } from 'react';
import { Plus, Edit, Trash2, Shield } from 'lucide-react';
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
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Switch } from '../../components/ui/switch';
import { ScrollArea } from '../../components/ui/scroll-area';
import { toast } from 'sonner';
import { CustomRole, Permission } from '../../types/admin';

const mockCustomRoles: CustomRole[] = [
  {
    id: '1',
    name: 'Content Reviewer',
    permissions: {
      canManageUsers: false,
      canBanUsers: false,
      canDeleteUsers: false,
      canManageContent: true,
      canDeleteContent: true,
      canManageReports: true,
      canManageAI: false,
      canViewAnalytics: false,
      canManageCoding: false,
      canManageSettings: false,
      canManageSupport: false,
      canManageAdmins: false,
      canViewAdminLogs: false,
      canCreateCustomRoles: false,
    },
    createdBy: 'admin@prepmate.com',
    createdAt: 'Jan 15, 2024',
  },
];

const defaultPermissions: Permission = {
  canManageUsers: false,
  canBanUsers: false,
  canDeleteUsers: false,
  canManageContent: false,
  canDeleteContent: false,
  canManageReports: false,
  canManageAI: false,
  canViewAnalytics: false,
  canManageCoding: false,
  canManageSettings: false,
  canManageSupport: false,
  canManageAdmins: false,
  canViewAdminLogs: false,
  canCreateCustomRoles: false,
};

const permissionLabels: Record<keyof Permission, string> = {
  canManageUsers: 'Manage Users',
  canBanUsers: 'Ban Users',
  canDeleteUsers: 'Delete Users',
  canManageContent: 'Manage Content',
  canDeleteContent: 'Delete Content',
  canManageReports: 'Manage Reports',
  canManageAI: 'Manage AI',
  canViewAnalytics: 'View Analytics',
  canManageCoding: 'Manage Coding Platform',
  canManageSettings: 'Manage Settings',
  canManageSupport: 'Manage Support',
  canManageAdmins: 'Manage Admins',
  canViewAdminLogs: 'View Admin Logs',
  canCreateCustomRoles: 'Create Custom Roles',
};

export default function CustomRolesPage() {
  const [roles, setRoles] = useState<CustomRole[]>(mockCustomRoles);
  const [addRoleOpen, setAddRoleOpen] = useState(false);
  const [editRole, setEditRole] = useState<CustomRole | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<CustomRole | null>(null);
  const [newRole, setNewRole] = useState({
    name: '',
    permissions: defaultPermissions,
  });

  const handleAddRole = () => {
    const role: CustomRole = {
      id: String(roles.length + 1),
      name: newRole.name,
      permissions: newRole.permissions,
      createdBy: 'admin@prepmate.com',
      createdAt: new Date().toLocaleDateString(),
    };
    setRoles([...roles, role]);
    setAddRoleOpen(false);
    setNewRole({ name: '', permissions: defaultPermissions });
    toast.success('Custom role created successfully');
  };

  const handleUpdateRole = () => {
    if (!editRole) return;
    setRoles(roles.map((r) => (r.id === editRole.id ? editRole : r)));
    setEditRole(null);
    toast.success('Role updated successfully');
  };

  const handleDeleteRole = () => {
    if (!deleteDialog) return;
    setRoles(roles.filter((r) => r.id !== deleteDialog.id));
    setDeleteDialog(null);
    toast.success('Role deleted successfully');
  };

  const togglePermission = (
    permissions: Permission,
    key: keyof Permission,
    setter: (p: Permission) => void
  ) => {
    setter({ ...permissions, [key]: !permissions[key] });
  };

  const countActivePermissions = (permissions: Permission) => {
    return Object.values(permissions).filter(Boolean).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl tracking-tight">Custom Roles</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage custom admin roles with specific permissions
          </p>
        </div>
        <Button onClick={() => setAddRoleOpen(true)}>
          <Plus className="mr-2 size-4" />
          Create Role
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role Name</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Shield className="size-4 text-purple-500" />
                    <span className="font-medium">{role.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className="rounded-full bg-primary text-primary-foreground">
                    {countActivePermissions(role.permissions)} permissions
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{role.createdBy}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{role.createdAt}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                      onClick={() => setEditRole(role)}
                    >
                      <Edit className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                      onClick={() => setDeleteDialog(role)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={addRoleOpen} onOpenChange={setAddRoleOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Custom Role</DialogTitle>
            <DialogDescription>Define a new role with specific permissions.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="role-name">Role Name</Label>
              <Input
                id="role-name"
                value={newRole.name}
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                placeholder="Content Reviewer"
              />
            </div>
            <div>
              <Label>Permissions</Label>
              <ScrollArea className="h-[400px] rounded-lg border border-border p-4">
                <div className="space-y-4">
                  {Object.entries(permissionLabels).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label htmlFor={key} className="cursor-pointer">
                        {label}
                      </Label>
                      <Switch
                        id={key}
                        checked={newRole.permissions[key as keyof Permission]}
                        onCheckedChange={() =>
                          togglePermission(
                            newRole.permissions,
                            key as keyof Permission,
                            (p) => setNewRole({ ...newRole, permissions: p })
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddRoleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRole}>
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editRole} onOpenChange={() => setEditRole(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>Update role permissions.</DialogDescription>
          </DialogHeader>
          {editRole && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-role-name">Role Name</Label>
                <Input
                  id="edit-role-name"
                  value={editRole.name}
                  onChange={(e) => setEditRole({ ...editRole, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Permissions</Label>
                <ScrollArea className="h-[400px] rounded-lg border border-border p-4">
                  <div className="space-y-4">
                    {Object.entries(permissionLabels).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between">
                        <Label htmlFor={`edit-${key}`} className="cursor-pointer">
                          {label}
                        </Label>
                        <Switch
                          id={`edit-${key}`}
                          checked={editRole.permissions[key as keyof Permission]}
                          onCheckedChange={() =>
                            togglePermission(
                              editRole.permissions,
                              key as keyof Permission,
                              (p) => setEditRole({ ...editRole, permissions: p })
                            )
                          }
                        />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRole(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole}>
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the "{deleteDialog?.name}" role? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRole}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
