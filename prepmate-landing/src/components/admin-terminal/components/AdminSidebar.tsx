import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, ShieldAlert, Activity, 
  BrainCircuit, Code2, Settings, HelpCircle, LogOut 
} from 'lucide-react';
import { useAdminContext } from '../contexts/AdminContext';
import { AdminPage } from '../types';

const navItems: Array<{ id: AdminPage; label: string; icon: React.ReactNode; requiredPermissions?: string[] }> = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'users', label: 'Users', icon: <Users size={20} />, requiredPermissions: ['admin.users.view'] },
  { id: 'content', label: 'Content', icon: <ShieldAlert size={20} />, requiredPermissions: ['admin.content.view', 'admin.chatreports.view'] },
  { id: 'ai', label: 'AI Monitor', icon: <BrainCircuit size={20} />, requiredPermissions: ['admin.ai.view'] },
  { id: 'analytics', label: 'Analytics', icon: <Activity size={20} />, requiredPermissions: ['admin.analytics.view', 'admin.analytics.view.limited'] },
  { id: 'coding', label: 'Coding Platform', icon: <Code2 size={20} />, requiredPermissions: ['admin.coding.view'] },
];

const bottomNavItems: Array<{ id: AdminPage; label: string; icon: React.ReactNode; requiredPermissions?: string[] }> = [
  { id: 'settings', label: 'Settings', icon: <Settings size={20} />, requiredPermissions: ['admin.settings.view', 'admin.settings.manage'] },
  { id: 'help', label: 'Help Center', icon: <HelpCircle size={20} />, requiredPermissions: ['admin.help.view', 'admin.help.manage'] },
];

export const AdminSidebar: React.FC = () => {
  const { isSidebarOpen, activePath, setActivePath, hasPermission } = useAdminContext();
  const navigate = useNavigate();

  const handleNavClick = (id: AdminPage) => {
    setActivePath(id);
  };

  const renderNavItems = (items: typeof navItems) => {
    return items.map((item) => {
      if (item.requiredPermissions && !hasPermission(item.requiredPermissions, 'any')) {
        return null; // hide items user doesn't have permissions for
      }

      return (
        <button
          key={item.id}
          onClick={() => handleNavClick(item.id)}
          className={`flex items-center w-full px-4 py-3 mb-1 text-sm font-medium admin-nav-item ${
            activePath === item.id ? 'active' : ''
          }`}
        >
          <span className="mr-3">{item.icon}</span>
          {isSidebarOpen && <span>{item.label}</span>}
        </button>
      );
    });
  };

  return (
    <aside 
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 transform admin-glass-panel border-r flex flex-col shadow-2xl
      ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-16 -translate-x-full lg:translate-x-0'}`}
    >
      <div className="flex items-center h-16 px-4 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
        <ShieldAlert className="text-[var(--admin-primary)] mr-3 flex-shrink-0" size={24} />
        {isSidebarOpen && <span className="font-bold text-lg text-[var(--admin-on-surface)]">PrepMate Admin</span>}
      </div>

      <div className="flex-1 overflow-y-auto admin-terminal scrollbar-thin py-4">
        <div className="space-y-1">
          {renderNavItems(navItems)}
        </div>
      </div>

      <div className="p-4 border-t border-white/5 space-y-1 bg-gradient-to-t from-black/20 to-transparent">
        {renderNavItems(bottomNavItems)}
        <button
          onClick={() => navigate('/modern-admin-dashboard')}
          className="flex items-center w-full px-4 py-3 mt-4 text-sm font-medium text-[var(--admin-error)] hover:text-white hover:bg-[var(--admin-error)] rounded-lg transition-all duration-300 group"
        >
          <LogOut size={20} className="mr-3 flex-shrink-0 group-hover:-translate-x-1 transition-transform" />
          {isSidebarOpen && <span>Back to Legacy Panel</span>}
        </button>
      </div>
    </aside>
  );
};
