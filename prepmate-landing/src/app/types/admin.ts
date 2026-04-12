export type AdminRole = 'super_admin' | 'moderator' | 'support_admin' | 'analytics_admin' | string;

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  avatar?: string;
  createdAt?: string;
  lastActive?: string;
  isCustomRole?: boolean;
}

export interface Permission {
  canManageUsers: boolean;
  canBanUsers: boolean;
  canDeleteUsers: boolean;
  canManageContent: boolean;
  canDeleteContent: boolean;
  canManageReports: boolean;
  canManageAI: boolean;
  canViewAnalytics: boolean;
  canManageCoding: boolean;
  canManageSettings: boolean;
  canManageSupport: boolean;
  canManageAdmins: boolean;
  canViewAdminLogs: boolean;
  canCreateCustomRoles: boolean;
}

export const ROLE_PERMISSIONS: Record<string, Permission> = {
  super_admin: {
    canManageUsers: true,
    canBanUsers: true,
    canDeleteUsers: true,
    canManageContent: true,
    canDeleteContent: true,
    canManageReports: true,
    canManageAI: true,
    canViewAnalytics: true,
    canManageCoding: true,
    canManageSettings: true,
    canManageSupport: true,
    canManageAdmins: true,
    canViewAdminLogs: true,
    canCreateCustomRoles: true,
  },
  moderator: {
    canManageUsers: true,
    canBanUsers: true,
    canDeleteUsers: false,
    canManageContent: true,
    canDeleteContent: true,
    canManageReports: true,
    canManageAI: false,
    canViewAnalytics: true,
    canManageCoding: false,
    canManageSettings: false,
    canManageSupport: true,
    canManageAdmins: false,
    canViewAdminLogs: false,
    canCreateCustomRoles: false,
  },
  support_admin: {
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
    canManageSupport: true,
    canManageAdmins: false,
    canViewAdminLogs: false,
    canCreateCustomRoles: false,
  },
  analytics_admin: {
    canManageUsers: false,
    canBanUsers: false,
    canDeleteUsers: false,
    canManageContent: false,
    canDeleteContent: false,
    canManageReports: false,
    canManageAI: false,
    canViewAnalytics: true,
    canManageCoding: false,
    canManageSettings: false,
    canManageSupport: false,
    canManageAdmins: false,
    canViewAdminLogs: false,
    canCreateCustomRoles: false,
  },
};

export interface AdminLog {
  id: string;
  adminName: string;
  adminEmail: string;
  action: string;
  target: string;
  timestamp: string;
  details: string;
  type: 'user' | 'content' | 'report' | 'admin' | 'system' | 'settings';
}

export interface CustomRole {
  id: string;
  name: string;
  permissions: Permission;
  createdBy: string;
  createdAt: string;
}
