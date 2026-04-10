import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AdminConsoleProvider } from "./AdminConsoleContext";
import AdminConsoleLayout from "./components/AdminConsoleLayout";
import AdminCodingQueuePage from "./pages/AdminCodingQueuePage";
import AdminLogsAuditPage from "./pages/AdminLogsAuditPage";
import AdminModerationPage from "./pages/AdminModerationPage";
import AdminOverviewPage from "./pages/AdminOverviewPage";
import AdminSupportPage from "./pages/AdminSupportPage";
import AdminUsersPage from "./pages/AdminUsersPage";

const AdminConsoleRoutes: React.FC = () => {
  return (
    <AdminConsoleProvider>
      <Routes>
        <Route element={<AdminConsoleLayout />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<AdminOverviewPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="moderation" element={<AdminModerationPage />} />
          <Route path="support" element={<AdminSupportPage />} />
          <Route path="coding" element={<AdminCodingQueuePage />} />
          <Route path="logs" element={<AdminLogsAuditPage />} />
          <Route path="*" element={<Navigate to="overview" replace />} />
        </Route>
      </Routes>
    </AdminConsoleProvider>
  );
};

export default AdminConsoleRoutes;
