import React, { useState } from 'react';
import { UserPlus, UserX, ShieldBan, Mail } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { useAdminData } from '../hooks/useAdminData';
import { activateUser, deleteUser, fetchUsers, suspendUser } from '../services/adminApi';
import { AdminUser } from '../types';
import { UserProfileSheet } from '../components/UserProfileSheet';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useAdminContext } from '../contexts/AdminContext';

export const UsersPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  
  const { hasPermission } = useAdminContext();

  const { data, loading, refetch } = useAdminData(
    fetchUsers,
    { page, limit: 10, search, role: roleFilter, status: statusFilter },
    [page, search, roleFilter, statusFilter]
  );

  const columns = [
    {
      header: 'User',
      accessorKey: 'name' as keyof AdminUser,
      width: '30%',
      cell: (user: AdminUser) => (
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-[var(--admin-surface-container-highest)] flex items-center justify-center flex-shrink-0 overflow-hidden">
            {user.profilePicture ? (
              <img src={user.profilePicture} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[var(--admin-on-surface-variant)] text-xs font-bold">{user.name.charAt(0)}</span>
            )}
          </div>
          <div>
            <p className="font-medium text-[var(--admin-on-surface)] truncate max-w-[150px]">{user.name}</p>
            <p className="text-xs text-[var(--admin-on-surface-muted)] truncate max-w-[150px]">@{user.username}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Role',
      accessorKey: 'role' as keyof AdminUser,
      width: '15%',
      cell: (user: AdminUser) => (
        <span className={`admin-badge ${user.role === 'admin' ? 'admin-badge-primary' : 'admin-badge-neutral'} capitalize`}>
          {user.role}
        </span>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status' as keyof AdminUser,
      width: '15%',
      cell: (user: AdminUser) => (
        <span className={`admin-badge flex w-max ${
          user.status === 'active' ? 'admin-badge-success' :
          user.status === 'suspended' ? 'admin-badge-error' : 'admin-badge-warning'
        }`}>
          {user.status}
        </span>
      )
    },
    {
      header: 'Joined',
      accessorKey: 'joinDate' as keyof AdminUser,
      width: '20%',
      cell: (user: AdminUser) => (
        <span className="text-[var(--admin-on-surface-variant)] text-sm">
          {new Date(user.joinDate || Date.now()).toLocaleDateString()}
        </span>
      )
    },
    {
      header: 'Actions',
      width: '20%',
      cell: (user: AdminUser) => (
        <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
          {hasPermission('admin.users.moderate') && (
            <ConfirmDialog 
              trigger={
                <button className="p-1.5 text-[var(--admin-on-surface-muted)] hover:text-amber-500 hover:bg-amber-500/10 rounded transition-colors" title="Suspend User">
                  <ShieldBan size={16} />
                </button>
              }
              title={`${user.status === 'suspended' ? 'Activate' : 'Suspend'} ${user.name}?`}
              description={
                user.status === 'suspended'
                  ? 'This will restore account access for the user immediately.'
                  : 'This will temporarily prevent the user from accessing their account. They will receive an email notification.'
              }
              variant="warning"
              actionText={user.status === 'suspended' ? 'Activate User' : 'Suspend User'}
              onConfirm={async () => {
                try {
                  if (user.status === 'suspended') {
                    await activateUser(user.id);
                  } else {
                    await suspendUser(user.id, 'Suspended by admin panel');
                  }
                  refetch();
                } catch (error) {
                  console.error('Failed to update user status:', error);
                }
              }}
            />
          )}

          {hasPermission('admin.users.delete') && (
            <ConfirmDialog 
              trigger={
                <button className="p-1.5 text-[var(--admin-on-surface-muted)] hover:text-[var(--admin-error)] hover:bg-[var(--admin-error-muted)] rounded transition-colors" title="Delete User">
                  <UserX size={16} />
                </button>
              }
              title={`Delete ${user.name}?`}
              description="This action cannot be undone. This will permanently delete the user account and remove all associated data."
              variant="destructive"
              actionText="Delete User"
              onConfirm={async () => {
                try {
                  await deleteUser(user.id);
                  refetch();
                } catch (error) {
                  console.error('Failed to delete user:', error);
                }
              }}
            />
          )}
          
          <button 
            className="p-1.5 text-[var(--admin-on-surface-muted)] hover:text-[var(--admin-primary)] hover:bg-[var(--admin-primary-muted)] rounded transition-colors" 
            title="Email User"
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `mailto:${user.email}`;
            }}
          >
            <Mail size={16} />
          </button>
        </div>
      )
    }
  ];

  const filters = (
    <>
      <select 
        value={roleFilter} 
        onChange={(e) => setRoleFilter(e.target.value)}
        className="admin-input py-1.5 text-sm w-32"
      >
        <option value="">All Roles</option>
        <option value="student">Student</option>
        <option value="teacher">Teacher</option>
        <option value="hr">HR</option>
        <option value="admin">Admin</option>
      </select>
      <select 
        value={statusFilter} 
        onChange={(e) => setStatusFilter(e.target.value)}
        className="admin-input py-1.5 text-sm w-32"
      >
        <option value="">All Statuses</option>
        <option value="active">Active</option>
        <option value="suspended">Suspended</option>
        <option value="pending">Pending</option>
      </select>
    </>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[var(--admin-on-surface)] mb-1">Users Management</h1>
          <p className="text-[var(--admin-on-surface-muted)] text-sm">Manage {data?.pagination?.total || 0} registered users across the platform.</p>
        </div>
        <div>
          {hasPermission('admin.users.role.assign') && (
            <button className="flex items-center px-4 py-2 bg-[var(--admin-primary)] text-white rounded-md hover:bg-[var(--admin-primary-hover)] text-sm font-medium transition-colors">
              <UserPlus size={16} className="mr-2" />
              Add User
            </button>
          )}
        </div>
      </div>

      <DataTable 
        columns={columns}
        data={data?.users || []}
        pagination={data?.pagination}
        onPageChange={setPage}
        onSearch={setSearch}
        isLoading={loading}
        filters={filters}
        onRowClick={(user) => setSelectedUser(user.id || (user as any)._id)}
        searchPlaceholder="Search name, email, or username..."
      />

      <UserProfileSheet 
        userId={selectedUser} 
        isOpen={!!selectedUser} 
        onClose={() => setSelectedUser(null)} 
      />
    </div>
  );
};

export default UsersPage;
