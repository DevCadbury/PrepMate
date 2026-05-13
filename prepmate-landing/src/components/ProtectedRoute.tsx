import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLocation } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  // Redirect to onboarding if profile is incomplete
  if (!user.isProfileComplete && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace state={{ from: location.pathname }} />;
  }

  // Check role if required
  if (requiredRole && user.role !== requiredRole) {
    // Redirect to appropriate dashboard based on user role
    switch (user.role) {
      case "student":
        return <Navigate to="/student-dashboard" replace />;
      case "teacher":
        return <Navigate to="/teacher-dashboard" replace />;
      case "hr":
        return <Navigate to="/hr-dashboard" replace />;
      case "admin":
        return <Navigate to="/admin" replace />;
      case "support":
        return <Navigate to="/support-dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  // Profile completion flow is handled inside the app; do not redirect to a separate page.

  return <>{children}</>;
};

export default ProtectedRoute;
