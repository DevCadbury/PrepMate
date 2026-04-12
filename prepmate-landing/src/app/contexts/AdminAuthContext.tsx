import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { apiClient } from '../../lib/apiClient';
import { AdminUser, Permission, ROLE_PERMISSIONS } from '../types/admin';

interface AdminAuthContextType {
  admin: AdminUser | null;
  permissions: Permission | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const EMPTY_PERMISSIONS: Permission = {
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

const mapAdminRole = (value: unknown) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'superadmin') return 'super_admin';
  return normalized || 'support_admin';
};

const hasPermission = (effectivePermissions: string[], keys: string[]) => {
  if (!Array.isArray(effectivePermissions) || effectivePermissions.length === 0) {
    return false;
  }

  if (effectivePermissions.includes('*')) {
    return true;
  }

  return keys.some((requiredKey) => {
    if (effectivePermissions.includes(requiredKey)) {
      return true;
    }

    return effectivePermissions.some(
      (grantedKey) =>
        grantedKey.endsWith('.*') &&
        requiredKey.startsWith(grantedKey.slice(0, -1))
    );
  });
};

const derivePermissions = (
  role: string,
  effectivePermissions: string[]
): Permission => {
  const rolePermissions = ROLE_PERMISSIONS[role] || EMPTY_PERMISSIONS;

  if (!Array.isArray(effectivePermissions) || effectivePermissions.length === 0) {
    return rolePermissions;
  }

  return {
    canManageUsers: hasPermission(effectivePermissions, [
      'admin.users.view',
      'admin.users.moderate',
      'admin.users.role.assign',
      'admin.users.permissions.manage',
    ]),
    canBanUsers: hasPermission(effectivePermissions, ['admin.users.moderate']),
    canDeleteUsers: hasPermission(effectivePermissions, ['admin.users.delete']),
    canManageContent: hasPermission(effectivePermissions, [
      'admin.content.view',
      'admin.content.moderate',
    ]),
    canDeleteContent: hasPermission(effectivePermissions, ['admin.content.moderate']),
    canManageReports: hasPermission(effectivePermissions, [
      'admin.chatreports.view',
      'admin.chatreports.moderate',
      'admin.content.moderate',
    ]),
    canManageAI: hasPermission(effectivePermissions, ['admin.ai.view']),
    canViewAnalytics: hasPermission(effectivePermissions, [
      'admin.analytics.view',
      'admin.analytics.view.limited',
    ]),
    canManageCoding: hasPermission(effectivePermissions, [
      'admin.coding.view',
      'admin.coding.moderate',
      'admin.coding.delete',
    ]),
    canManageSettings: hasPermission(effectivePermissions, [
      'admin.settings.manage',
      'admin.settings.view',
    ]),
    canManageSupport: hasPermission(effectivePermissions, [
      'admin.help.manage',
      'admin.help.view',
    ]),
    canManageAdmins: hasPermission(effectivePermissions, [
      'admin.admins.manage',
      'admin.admins.create',
      'admin.tokens.generate',
    ]),
    canViewAdminLogs: hasPermission(effectivePermissions, ['admin.logs.view']),
    canCreateCustomRoles: hasPermission(effectivePermissions, [
      'admin.users.permissions.manage',
      'admin.admins.manage',
    ]),
  };
};

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [effectivePermissions, setEffectivePermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const permissions = useMemo(() => {
    if (!admin) {
      return null;
    }

    return derivePermissions(admin.role, effectivePermissions);
  }, [admin, effectivePermissions]);

  const loadAdmin = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setAdmin(null);
      setEffectivePermissions([]);
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.fetch('/admin/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || 'Unable to load admin profile');
      }

      const user = payload?.data?.user;
      const role = mapAdminRole(payload?.data?.adminRole || user?.adminRole);

      setAdmin({
        id: String(user?.id || ''),
        name: String(user?.name || 'Admin'),
        email: String(user?.email || ''),
        role,
        avatar: user?.profilePicture || undefined,
        createdAt: user?.joinDate,
        lastActive: user?.lastLogin,
      });

      setEffectivePermissions(
        Array.isArray(payload?.data?.effectivePermissions)
          ? payload.data.effectivePermissions
          : []
      );
    } catch (error) {
      setAdmin(null);
      setEffectivePermissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdmin();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);

    const response = await apiClient.fetch('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifier: email, password }),
    });

    const payload = await response.json();
    if (!response.ok || !payload?.success) {
      setIsLoading(false);
      throw new Error(payload?.message || 'Login failed');
    }

    if (payload?.data?.token) {
      localStorage.setItem('token', payload.data.token);
    }

    await loadAdmin();
  };

  const logout = async () => {
    const token = localStorage.getItem('token');

    if (token) {
      try {
        await apiClient.fetch('/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch {
        // Ignore logout API failures and clear local auth state regardless.
      }
    }

    localStorage.removeItem('token');
    setAdmin(null);
    setEffectivePermissions([]);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        permissions,
        isLoading,
        isAuthenticated: !!admin,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
}
