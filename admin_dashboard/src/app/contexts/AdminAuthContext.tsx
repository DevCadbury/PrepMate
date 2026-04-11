import { createContext, useContext, useState, ReactNode } from 'react';
import { AdminUser, Permission, ROLE_PERMISSIONS } from '../types/admin';

interface AdminAuthContextType {
  admin: AdminUser | null;
  permissions: Permission | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(() => {
    // Mock admin user for demo
    return {
      id: '1',
      name: 'Admin User',
      email: 'admin@prepmate.com',
      role: 'super_admin',
    };
  });

  const permissions = admin ? ROLE_PERMISSIONS[admin.role] : null;

  const login = async (email: string, password: string) => {
    // Mock login - in production, this would call an API
    await new Promise(resolve => setTimeout(resolve, 500));

    setAdmin({
      id: '1',
      name: 'Admin User',
      email,
      role: 'super_admin',
    });
  };

  const logout = () => {
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        permissions,
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
