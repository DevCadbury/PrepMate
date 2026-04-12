import { Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AdminAuthProvider } from "./contexts/AdminAuthContext";
import { Toaster } from "./components/ui/sonner";
import AdminLayout from "./admin/layout/AdminLayout";
import AdminDashboard from "./admin/pages/Dashboard";
import UsersPage from "./admin/pages/Users";
import ContentPage from "./admin/pages/Content";
import ReportsPage from "./admin/pages/Reports";
import AIPage from "./admin/pages/AI";
import AnalyticsPage from "./admin/pages/Analytics";
import CodingPage from "./admin/pages/Coding";
import SettingsPage from "./admin/pages/Settings";
import HelpCenterPage from "./admin/pages/HelpCenter";
import AdminManagementPage from "./admin/pages/AdminManagement";
import CustomRolesPage from "./admin/pages/CustomRoles";
import ActivityLogsPage from "./admin/pages/ActivityLogs";
import UserProfilePage from "./admin/pages/UserProfile";
import CouponsPage from "./admin/pages/Coupons";
import CouponCreate from "./admin/pages/CouponCreate";
import CouponDetailPage from "./admin/pages/CouponDetail";
import TicketDetailPage from "./admin/pages/TicketDetail";
import ProblemDetailPage from "./admin/pages/ProblemDetail";

export default function AdminRoutes() {
  return (
    <ThemeProvider>
      <AdminAuthProvider>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="users/:id" element={<UserProfilePage />} />
            <Route path="content" element={<ContentPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="ai" element={<AIPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="coding" element={<CodingPage />} />
            <Route path="coding/:id" element={<ProblemDetailPage />} />
            <Route path="admins" element={<AdminManagementPage />} />
            <Route path="roles" element={<CustomRolesPage />} />
            <Route path="logs" element={<ActivityLogsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="help" element={<HelpCenterPage />} />
            <Route path="help/:id" element={<TicketDetailPage />} />
            <Route path="coupons" element={<CouponsPage />} />
            <Route path="coupons/create" element={<CouponCreate />} />
            <Route path="coupons/:id" element={<CouponDetailPage />} />
          </Route>
          <Route path="*" element={<Navigate to="." replace />} />
        </Routes>
        <Toaster />
      </AdminAuthProvider>
    </ThemeProvider>
  );
}
