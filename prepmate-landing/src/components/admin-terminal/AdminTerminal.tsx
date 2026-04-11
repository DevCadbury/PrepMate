import React from 'react';
import './admin-theme.css';
import { AdminProvider, useAdminContext } from './contexts/AdminContext';
import { AdminSidebar } from './components/AdminSidebar';
import { AdminTopBar } from './components/AdminTopBar';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { ContentPage } from './pages/ContentPage';
import { AIModulePage } from './pages/AIModulePage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { CodingPage } from './pages/CodingPage';
import { SettingsPage } from './pages/SettingsPage';
import { HelpCenterPage } from './pages/HelpCenterPage';

// Placeholder Pages
// Removed placeholders

const AdminContent: React.FC = () => {
  const { isSidebarOpen, activePath, theme } = useAdminContext();

  const renderPage = () => {
    switch (activePath) {
      case 'dashboard': return <DashboardPage />;
      case 'users': return <UsersPage />;
      case 'content': return <ContentPage />;
      case 'ai': return <AIModulePage />;
      case 'analytics': return <AnalyticsPage />;
      case 'coding': return <CodingPage />;
      case 'settings': return <SettingsPage />;
      case 'help': return <HelpCenterPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div className={`admin-terminal theme-${theme}`}>
      <AdminSidebar />
      <div 
        className={`transition-all duration-300 flex flex-col min-h-screen ${
          isSidebarOpen ? 'lg:ml-64' : 'ml-0 lg:ml-16'
        }`}
      >
        <AdminTopBar />
        <main className="flex-1 overflow-x-hidden bg-[var(--admin-surface)]">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export const AdminTerminal: React.FC = () => {
  return (
    <AdminProvider>
      <AdminContent />
    </AdminProvider>
  );
};

export default AdminTerminal;
