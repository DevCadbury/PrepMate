import { createBrowserRouter, Navigate } from 'react-router';
import AdminLayout from './admin/layout/AdminLayout';
import AdminDashboard from './admin/pages/Dashboard';
import UsersPage from './admin/pages/Users';
import ContentPage from './admin/pages/Content';
import ReportsPage from './admin/pages/Reports';
import AIPage from './admin/pages/AI';
import AnalyticsPage from './admin/pages/Analytics';
import CodingPage from './admin/pages/Coding';
import SettingsPage from './admin/pages/Settings';
import HelpCenterPage from './admin/pages/HelpCenter';
import AdminManagementPage from './admin/pages/AdminManagement';
import CustomRolesPage from './admin/pages/CustomRoles';
import ActivityLogsPage from './admin/pages/ActivityLogs';
import UserProfilePage from './admin/pages/UserProfile';
import CouponsPage from './admin/pages/Coupons';
import CouponCreate from './admin/pages/CouponCreate';
import CouponDetailPage from './admin/pages/CouponDetail';
import TicketDetailPage from './admin/pages/TicketDetail';
import ProblemDetailPage from './admin/pages/ProblemDetail';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/admin" replace />,
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'users/:id', element: <UserProfilePage /> },
      { path: 'content', element: <ContentPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'ai', element: <AIPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'coding', element: <CodingPage /> },
      { path: 'coding/:id', element: <ProblemDetailPage /> },
      { path: 'admins', element: <AdminManagementPage /> },
      { path: 'roles', element: <CustomRolesPage /> },
      { path: 'logs', element: <ActivityLogsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'help', element: <HelpCenterPage /> },
      { path: 'help/:id', element: <TicketDetailPage /> },
      { path: 'coupons', element: <CouponsPage /> },
      { path: 'coupons/create', element: <CouponCreate /> },
      { path: 'coupons/:id', element: <CouponDetailPage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/admin" replace />,
  },
]);