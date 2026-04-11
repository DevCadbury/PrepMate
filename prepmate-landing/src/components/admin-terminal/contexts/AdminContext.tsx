import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { fetchAdminMe } from '../services/adminApi';
import {
  AdminAction,
  AdminPermissionCatalogEntry,
  AdminRole,
  AdminTheme,
} from '../types';

interface AdminContextProps {
  adminRole: AdminRole | null;
  permissions: AdminAction[];
  canPerformAction: (action: AdminAction) => boolean;
  hasPermission: (required: string | string[], mode?: 'any' | 'all') => boolean;
  effectivePermissions: string[];
  customPermissions: string[];
  permissionCatalog: AdminPermissionCatalogEntry[];
  roleDefaults: Record<string, string[]>;
  isPermissionsLoading: boolean;
  refreshPermissions: () => Promise<void>;
  theme: AdminTheme;
  setTheme: (theme: AdminTheme) => void;
  activePath: string;
  setActivePath: (path: string) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
}

const AdminContext = createContext<AdminContextProps | undefined>(undefined);

const THEME_STORAGE_KEY = 'admin-terminal-theme';

const FALLBACK_ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  superadmin: ['*'],
  moderator: [
    'admin.dashboard.view',
    'admin.users.view',
    'admin.users.moderate',
    'admin.content.view',
    'admin.content.moderate',
    'admin.chatreports.view',
    'admin.chatreports.moderate',
    'admin.analytics.view.limited',
    'admin.coding.view',
    'admin.coding.moderate',
    'admin.help.view',
    'admin.logs.view',
    'admin.settings.view',
  ],
  support_admin: [
    'admin.dashboard.view',
    'admin.users.view',
    'admin.users.password.reset',
    'admin.help.view',
    'admin.help.manage',
    'admin.logs.view',
    'admin.settings.view',
  ],
  analytics_admin: [
    'admin.dashboard.view',
    'admin.analytics.view',
    'admin.ai.view',
    'admin.logs.view',
    'admin.settings.view',
  ],
};

const ACTION_PERMISSION_MAP: Record<AdminAction, string[]> = {
  ban: ['admin.users.delete', 'admin.users.moderate'],
  delete: ['admin.users.delete', 'admin.coding.delete'],
  suspend: ['admin.users.moderate'],
  moderate: ['admin.content.moderate', 'admin.chatreports.moderate'],
  view_analytics: ['admin.analytics.view', 'admin.analytics.view.limited'],
  manage_admins: ['admin.admins.manage'],
  manage_settings: ['admin.settings.manage', 'admin.settings.view'],
  manage_coding: ['admin.coding.moderate', 'admin.coding.view'],
  manage_support: ['admin.help.manage', 'admin.help.view'],
  reset_password: ['admin.users.password.reset'],
};

const normalizeAdminRole = (value: unknown): AdminRole => {
  const role = String(value || '').trim().toLowerCase() as AdminRole;
  if (role === 'superadmin' || role === 'moderator' || role === 'support_admin' || role === 'analytics_admin') {
    return role;
  }
  return 'superadmin';
};

const normalizeTheme = (value: unknown): AdminTheme => {
  const theme = String(value || '').trim().toLowerCase() as AdminTheme;
  if (theme === 'white' || theme === 'black' || theme === 'colorful') {
    return theme;
  }
  return 'white';
};

const doesPermissionMatch = (granted: string, required: string) => {
  if (granted === '*') return true;
  if (granted.endsWith('.*')) {
    const prefix = granted.slice(0, -1);
    return required.startsWith(prefix);
  }
  return granted === required;
};

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activePath, setActivePath] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [effectivePermissions, setEffectivePermissions] = useState<string[]>([]);
  const [customPermissions, setCustomPermissions] = useState<string[]>([]);
  const [permissionCatalog, setPermissionCatalog] = useState<AdminPermissionCatalogEntry[]>([]);
  const [roleDefaults, setRoleDefaults] = useState<Record<string, string[]>>({});
  const [isPermissionsLoading, setPermissionsLoading] = useState(false);
  const [theme, setThemeState] = useState<AdminTheme>(() => {
    if (typeof window === 'undefined') return 'white';
    return normalizeTheme(localStorage.getItem(THEME_STORAGE_KEY));
  });

  const setTheme = (nextTheme: AdminTheme) => {
    const normalized = normalizeTheme(nextTheme);
    setThemeState(normalized);
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, normalized);
    }
  };

  const hasPermission = (required: string | string[], mode: 'any' | 'all' = 'any') => {
    const requiredList = (Array.isArray(required) ? required : [required])
      .map((item) => String(item || '').trim().toLowerCase())
      .filter(Boolean);

    if (!requiredList.length) return true;
    if (effectivePermissions.includes('*')) return true;

    const checkOne = (requiredPermission: string) =>
      effectivePermissions.some((grantedPermission) =>
        doesPermissionMatch(grantedPermission, requiredPermission)
      );

    return mode === 'all'
      ? requiredList.every(checkOne)
      : requiredList.some(checkOne);
  };

  const permissions = (Object.keys(ACTION_PERMISSION_MAP) as AdminAction[]).filter((action) =>
    hasPermission(ACTION_PERMISSION_MAP[action], 'any')
  );

  const canPerformAction = (action: AdminAction) => hasPermission(ACTION_PERMISSION_MAP[action], 'any');

  const refreshPermissions = async () => {
    if (user?.role !== 'admin') {
      setAdminRole(null);
      setEffectivePermissions([]);
      setCustomPermissions([]);
      setPermissionCatalog([]);
      setRoleDefaults({});
      return;
    }

    const fallbackRole = normalizeAdminRole((user as any)?.adminRole);

    setPermissionsLoading(true);
    try {
      const payload = await fetchAdminMe();
      setAdminRole(normalizeAdminRole(payload.adminRole));
      setEffectivePermissions(payload.effectivePermissions || []);
      setCustomPermissions(payload.customPermissions || []);
      setPermissionCatalog(payload.permissionCatalog || []);
      setRoleDefaults(payload.roleDefaults || {});
    } catch (error) {
      console.error('Failed to load admin permission profile:', error);
      setAdminRole(fallbackRole);
      setEffectivePermissions(FALLBACK_ROLE_PERMISSIONS[fallbackRole] || []);
      setCustomPermissions(Array.isArray((user as any)?.permissions) ? (user as any).permissions : []);
      setPermissionCatalog([]);
      setRoleDefaults(FALLBACK_ROLE_PERMISSIONS);
    } finally {
      setPermissionsLoading(false);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    refreshPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role, (user as any)?.adminRole]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, [theme]);

  return (
    <AdminContext.Provider
      value={{
        adminRole,
        permissions,
        canPerformAction,
        hasPermission,
        effectivePermissions,
        customPermissions,
        permissionCatalog,
        roleDefaults,
        isPermissionsLoading,
        refreshPermissions,
        theme,
        setTheme,
        activePath,
        setActivePath,
        isSidebarOpen,
        setSidebarOpen,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdminContext = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdminContext must be used within an AdminProvider');
  }
  return context;
};
