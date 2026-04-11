import React from 'react';
import { Menu, Search, Bell, User as UserIcon, Palette } from 'lucide-react';
import { useAdminContext } from '../contexts/AdminContext';
import { useAuth } from '../../../contexts/AuthContext';
import type { AdminTheme } from '../types';

export const AdminTopBar: React.FC = () => {
  const { isSidebarOpen, setSidebarOpen, theme, setTheme, adminRole } = useAdminContext();
  const { user } = useAuth();

  return (
    <header className="h-16 border-b admin-glass-panel sticky top-0 z-30 flex items-center justify-between px-4 transition-all duration-300">
      <div className="flex items-center">
        <button
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="p-2 mr-4 text-[var(--admin-on-surface-variant)] hover:text-[var(--admin-on-surface)] transition-all duration-200 rounded-lg hover:bg-white/5 active:scale-95"
          aria-label="Toggle Sidebar"
        >
          <Menu size={20} />
        </button>

        <div className="hidden md:flex items-center max-w-md w-full relative">
          <Search size={18} className="absolute left-3 text-[var(--admin-on-surface-muted)]" />
          <input
            type="text"
            placeholder="Search users, posts, or tickets... (Ctrl+K)"
            className="admin-input w-full pl-10 h-9 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="hidden md:flex items-center mr-2 pl-2 pr-2 rounded-md border border-[var(--admin-outline)] bg-[var(--admin-surface-container)]">
          <Palette size={14} className="text-[var(--admin-on-surface-muted)] mr-2" />
          <select
            value={theme}
            onChange={(event) => setTheme(event.target.value as AdminTheme)}
            className="bg-transparent py-1.5 text-xs text-[var(--admin-on-surface)] outline-none"
            aria-label="Admin theme"
          >
            <option value="white">White</option>
            <option value="black">Black</option>
            <option value="colorful">Colorful</option>
          </select>
        </div>

        <button className="p-2 text-[var(--admin-on-surface-variant)] hover:text-[var(--admin-on-surface)] transition-all duration-200 relative rounded-lg hover:bg-white/5 active:scale-95 mr-2">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--admin-error)] rounded-full border border-[var(--admin-surface)] shadow-[0_0_8px_var(--admin-error)]"></span>
        </button>
        
        <div className="pl-4 border-l border-white/5 flex items-center cursor-pointer hover:opacity-80 transition-opacity">
          <div className="hidden sm:block text-right mr-3">
            <p className="text-sm font-medium text-[var(--admin-on-surface)] leading-none mb-1">
              {user?.name || 'Admin'}
            </p>
            <p className="text-xs text-[var(--admin-on-surface-muted)] capitalize">
              {(adminRole || (user as any)?.adminRole || 'superadmin').replace('_', ' ')}
            </p>
          </div>
          <div className="h-8 w-8 rounded-full bg-[var(--admin-surface-container-highest)] border border-[var(--admin-outline)] flex items-center justify-center overflow-hidden">
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <UserIcon size={16} className="text-[var(--admin-on-surface-variant)]" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
