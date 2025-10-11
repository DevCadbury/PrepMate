import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Hero from "./components/Hero";
import Features from "./components/Features";
import Pricing from "./components/Pricing";
import Testimonials from "./components/Testimonials";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import SignInModal from "./components/SignInModal";
import SignUpModal from "./components/SignUpModal";
import AuthCallback from "./components/AuthCallback";
import AdminAuthCallback from "./components/AdminAuthCallback";
import StudentDashboard from "./components/dashboards/StudentDashboard";
import TeacherDashboard from "./components/dashboards/TeacherDashboard";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/dashboards/AdminDashboard";
import ModernAdminDashboard from "./components/dashboards/ModernAdminDashboard";
import TestAuth from "./components/TestAuth";
import TestBackend from "./components/TestBackend";
import UsernameSelection from "./components/UsernameSelection";
import GoogleAuthCallback from "./components/GoogleAuthCallback";
import GoogleAuthError from "./components/GoogleAuthError";
import TestGoogleAuth from "./components/TestGoogleAuth";
import LandingPage from "./components/dashboards/pages/LandingPage";
import SettingsPage from "./components/dashboards/pages/SettingsPage";
import ProfilePage from "./components/dashboards/pages/ProfilePage";
import FeedPage from "./components/dashboards/pages/FeedPage";
import ChatPage from "./components/dashboards/pages/ChatPage";
import TrendingPage from "./components/dashboards/pages/TrendingPage";
import QuestionsPage from "./components/dashboards/pages/QuestionsPage";
import CodingPage from "./components/dashboards/pages/CodingPage";
import AICompanionPage from "./components/dashboards/pages/AICompanionPage";

function App() {
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  const handleGetStarted = () => {
    setShowSignUp(true);
  };

  const handleSignIn = () => {
    setShowSignIn(true);
  };

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/admin/auth/callback" element={<AdminAuthCallback />} />
          <Route path="/select-username" element={<UsernameSelection />} />
          <Route path="/test-auth" element={<TestAuth />} />
          <Route path="/test-backend" element={<TestBackend />} />
          <Route
            path="/admin"
            element={
              <AdminLogin
                onLogin={() =>
                  (window.location.href = "/modern-admin-dashboard")
                }
              />
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard
                  onLogout={() => (window.location.href = "/admin")}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/modern-admin-dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <ModernAdminDashboard
                  onLogout={() => (window.location.href = "/admin")}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student-dashboard"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher-dashboard"
            element={
              <ProtectedRoute requiredRole="teacher">
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr-dashboard"
            element={
              <ProtectedRoute requiredRole="hr">
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/support-dashboard"
            element={
              <ProtectedRoute requiredRole="support">
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LandingPage />} />
          <Route path="/register" element={<LandingPage />} />
          <Route path="/auth/google/success" element={<GoogleAuthCallback />} />
          <Route path="/auth/google/error" element={<GoogleAuthError />} />
          <Route path="/test-google-auth" element={<TestGoogleAuth />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher"
            element={
              <ProtectedRoute>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:username"
            element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:roomId"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/feed"
            element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trending"
            element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/questions"
            element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coding"
            element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-companion"
            element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/admin-callback" element={<AdminAuthCallback />} />
        </Routes>

        <AnimatePresence>
          {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} />}
          {showSignUp && <SignUpModal onClose={() => setShowSignUp(false)} />}
        </AnimatePresence>
      </Router>
    </AuthProvider>
  );
}

export default App;
