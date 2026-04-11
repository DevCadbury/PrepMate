import { Outlet } from 'react-router';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';
import { SidebarProvider } from '../../contexts/SidebarContext';
import '../admin.css';

export default function AdminLayout() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        <AdminSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AdminTopbar />
          <main className="flex-1 overflow-y-auto p-6 bg-background">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}