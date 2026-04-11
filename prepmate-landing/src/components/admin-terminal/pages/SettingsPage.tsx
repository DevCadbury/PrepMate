import React, { useMemo, useState } from 'react';
import { RefreshCcw, Save, Settings2, ShieldCheck } from 'lucide-react';
import { useAdminData } from '../hooks/useAdminData';
import { fetchUsers, updateAdminRole, updateCustomPermissions } from '../services/adminApi';
import { useAdminContext } from '../contexts/AdminContext';
import type { AdminRole, AdminUser, AdminTheme } from '../types';

const ADMIN_ROLES: AdminRole[] = ['superadmin', 'moderator', 'support_admin', 'analytics_admin'];

const parsePermissionCsv = (value: string) => {
  return Array.from(
    new Set(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
};

const formatPermissionCsv = (permissions: string[] | undefined) => {
  return Array.isArray(permissions) ? permissions.join(', ') : '';
};

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'roles'>('general');
  const [search, setSearch] = useState('');
  const [draftRoles, setDraftRoles] = useState<Record<string, AdminRole>>({});
  const [draftPermissions, setDraftPermissions] = useState<Record<string, string>>({});
  const [savingById, setSavingById] = useState<Record<string, boolean>>({});

  const {
    adminRole,
    effectivePermissions,
    permissionCatalog,
    roleDefaults,
    hasPermission,
    theme,
    setTheme,
    refreshPermissions,
    isPermissionsLoading,
  } = useAdminContext();

  const canManageAdmins = hasPermission('admin.admins.manage');
  const canManageSettings = hasPermission(['admin.settings.view', 'admin.settings.manage']);

  const { data, loading, refetch } = useAdminData(
    fetchUsers,
    { page: 1, limit: 50, role: 'admin', search },
    [search]
  );

  const adminUsers = useMemo(() => {
    return (data?.users || []).filter((user) => user.role === 'admin');
  }, [data]);

  const handleSaveAdmin = async (user: AdminUser) => {
    if (!canManageAdmins) return;

    const userId = user.id;
    const nextRole = draftRoles[userId] || (user.adminRole as AdminRole) || 'support_admin';
    const nextPermissions = parsePermissionCsv(
      draftPermissions[userId] !== undefined
        ? draftPermissions[userId]
        : formatPermissionCsv(user.permissions)
    );

    setSavingById((prev) => ({ ...prev, [userId]: true }));
    try {
      await updateAdminRole(userId, nextRole);
      await updateCustomPermissions(userId, nextPermissions);
      await refetch();
      await refreshPermissions();
    } catch (error) {
      console.error('Failed to update admin settings:', error);
    } finally {
      setSavingById((prev) => ({ ...prev, [userId]: false }));
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--admin-on-surface)] mb-1">Platform Settings</h1>
          <p className="text-[var(--admin-on-surface-muted)] text-sm">Manage admin access controls and terminal configuration.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 space-y-1">
          <button
            onClick={() => setActiveTab('general')}
            className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'general' ? 'bg-[var(--admin-surface-container-high)] text-[var(--admin-primary)] border border-[var(--admin-outline)]' : 'text-[var(--admin-on-surface-variant)] hover:bg-[var(--admin-surface-container)] hover:text-[var(--admin-on-surface)]'}`}
          >
            <Settings2 size={18} className="mr-3" /> General
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'roles' ? 'bg-[var(--admin-surface-container-high)] text-[var(--admin-primary)] border border-[var(--admin-outline)]' : 'text-[var(--admin-on-surface-variant)] hover:bg-[var(--admin-surface-container)] hover:text-[var(--admin-on-surface)]'}`}
          >
            <ShieldCheck size={18} className="mr-3" /> Roles & Permissions
          </button>
        </div>

        <div className="flex-1 admin-card p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--admin-outline)] pb-3">
                <h3 className="text-lg font-medium text-[var(--admin-on-surface)]">General Settings</h3>
                <button
                  onClick={() => refreshPermissions()}
                  className="inline-flex items-center px-3 py-1.5 text-xs rounded border border-[var(--admin-outline)] text-[var(--admin-on-surface-variant)] hover:text-[var(--admin-on-surface)]"
                >
                  <RefreshCcw size={14} className="mr-1.5" />
                  Refresh Access Profile
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="p-4 rounded border border-[var(--admin-outline)] bg-[var(--admin-surface-container)]">
                  <p className="text-xs uppercase tracking-wider text-[var(--admin-on-surface-muted)] mb-1">Current Admin Role</p>
                  <p className="text-sm font-semibold text-[var(--admin-on-surface)] capitalize">{(adminRole || 'superadmin').replace('_', ' ')}</p>
                </div>

                <div className="p-4 rounded border border-[var(--admin-outline)] bg-[var(--admin-surface-container)]">
                  <p className="text-xs uppercase tracking-wider text-[var(--admin-on-surface-muted)] mb-1">Effective Permissions</p>
                  <p className="text-sm font-semibold text-[var(--admin-on-surface)]">{effectivePermissions.includes('*') ? 'Full access (*)' : `${effectivePermissions.length} grants`}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--admin-on-surface-variant)]">Admin Terminal Theme</label>
                <select
                  disabled={!canManageSettings}
                  value={theme}
                  onChange={(event) => setTheme(event.target.value as AdminTheme)}
                  className="admin-input w-full max-w-xs"
                >
                  <option value="white">White (Default)</option>
                  <option value="black">Black</option>
                  <option value="colorful">Colorful</option>
                </select>
                {!canManageSettings && (
                  <p className="text-xs text-[var(--admin-on-surface-muted)]">
                    Settings are read-only for your current role.
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-[var(--admin-on-surface)] mb-3">Active Permission Grants</p>
                <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto">
                  {(effectivePermissions || []).map((permission) => (
                    <span
                      key={permission}
                      className="text-xs px-2 py-1 rounded border border-[var(--admin-outline)] bg-[var(--admin-surface-container)] text-[var(--admin-on-surface-variant)]"
                    >
                      {permission}
                    </span>
                  ))}
                  {effectivePermissions.length === 0 && (
                    <span className="text-sm text-[var(--admin-on-surface-muted)]">No permissions loaded.</span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-[var(--admin-on-surface)] mb-3">Role Defaults</p>
                <div className="space-y-3">
                  {Object.entries(roleDefaults || {}).map(([role, defaults]) => (
                    <div key={role} className="p-3 rounded border border-[var(--admin-outline)] bg-[var(--admin-surface-container)]">
                      <p className="text-sm font-semibold text-[var(--admin-on-surface)] capitalize mb-2">{role.replace('_', ' ')}</p>
                      <p className="text-xs text-[var(--admin-on-surface-muted)] break-all">
                        {Array.isArray(defaults) && defaults.length > 0 ? defaults.join(', ') : 'No defaults'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--admin-outline)] pb-3">
                <div>
                  <h3 className="text-lg font-medium text-[var(--admin-on-surface)]">Roles & Custom Permissions</h3>
                  <p className="text-sm text-[var(--admin-on-surface-muted)]">Assign admin sub-roles and custom permission keys.</p>
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="admin-input w-64"
                  placeholder="Search admins..."
                />
              </div>

              <div className="overflow-x-auto border border-[var(--admin-outline)] rounded-lg">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase text-[var(--admin-on-surface-muted)] bg-[var(--admin-surface-container-high)] border-b border-[var(--admin-outline)]">
                    <tr>
                      <th className="px-4 py-3">Admin</th>
                      <th className="px-4 py-3">Sub-Role</th>
                      <th className="px-4 py-3">Custom Permissions</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading || isPermissionsLoading ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-[var(--admin-on-surface-muted)]">Loading admin users...</td>
                      </tr>
                    ) : adminUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-[var(--admin-on-surface-muted)]">No admin users found.</td>
                      </tr>
                    ) : (
                      adminUsers.map((adminUser) => {
                        const currentRole = (draftRoles[adminUser.id] || adminUser.adminRole || 'support_admin') as AdminRole;
                        const currentPermissions =
                          draftPermissions[adminUser.id] !== undefined
                            ? draftPermissions[adminUser.id]
                            : formatPermissionCsv(adminUser.permissions);

                        return (
                          <tr key={adminUser.id} className="border-b border-[var(--admin-outline)]">
                            <td className="px-4 py-3">
                              <p className="font-medium text-[var(--admin-on-surface)]">{adminUser.name}</p>
                              <p className="text-xs text-[var(--admin-on-surface-muted)]">{adminUser.email}</p>
                            </td>
                            <td className="px-4 py-3">
                              <select
                                disabled={!canManageAdmins}
                                value={currentRole}
                                onChange={(event) =>
                                  setDraftRoles((prev) => ({
                                    ...prev,
                                    [adminUser.id]: event.target.value as AdminRole,
                                  }))
                                }
                                className="admin-input min-w-[170px]"
                              >
                                {ADMIN_ROLES.map((role) => (
                                  <option key={role} value={role}>
                                    {role.replace('_', ' ')}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                disabled={!canManageAdmins}
                                value={currentPermissions}
                                onChange={(event) =>
                                  setDraftPermissions((prev) => ({
                                    ...prev,
                                    [adminUser.id]: event.target.value,
                                  }))
                                }
                                className="admin-input w-full min-w-[320px]"
                                placeholder="admin.users.view, admin.help.manage"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <button
                                disabled={!canManageAdmins || Boolean(savingById[adminUser.id])}
                                onClick={() => handleSaveAdmin(adminUser)}
                                className="inline-flex items-center px-3 py-1.5 text-xs rounded bg-[var(--admin-primary)] text-white hover:bg-[var(--admin-primary-hover)] disabled:opacity-50"
                              >
                                <Save size={13} className="mr-1.5" />
                                {savingById[adminUser.id] ? 'Saving...' : 'Save'}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="admin-card p-4 bg-[var(--admin-surface-container)] border border-[var(--admin-outline)]">
                <p className="text-sm font-medium text-[var(--admin-on-surface)] mb-2">Available Permission Keys</p>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {permissionCatalog.map((permission) => (
                    <span key={permission.key} className="text-[11px] px-2 py-1 rounded border border-[var(--admin-outline)] text-[var(--admin-on-surface-variant)]">
                      {permission.key}
                    </span>
                  ))}
                  {permissionCatalog.length === 0 && (
                    <span className="text-sm text-[var(--admin-on-surface-muted)]">Permission catalog is unavailable.</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
