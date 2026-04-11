import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { initializeIndianVoices } from "./services/initIndianVoices";
import { responsiveVoiceService } from "./services/responsiveVoiceService";
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
import AdminTerminal from "./components/admin-terminal/AdminTerminal";
import TestAuth from "./components/TestAuth";
import TestBackend from "./components/TestBackend";
import UsernameSelection from "./components/UsernameSelection";
import GoogleAuthCallback from "./components/GoogleAuthCallback";
import GoogleAuthError from "./components/GoogleAuthError";
import TestGoogleAuth from "./components/TestGoogleAuth";
import ResetPasswordPage from "./components/ResetPasswordPage";
import LandingPage from "./components/dashboards/pages/LandingPage";
import SettingsPage from "./components/dashboards/pages/SettingsPage";
import ProfilePage from "./components/dashboards/pages/ProfilePage";
import FeedPage from "./components/dashboards/pages/FeedPage";
import TrendingPage from "./components/dashboards/pages/TrendingPage";
import QuestionsPage from "./components/dashboards/pages/QuestionsPage";
import CodingPage from "./components/dashboards/pages/CodingPage";
import AICompanionPage from "./components/dashboards/pages/AICompanionPage";

function App() {
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  // Initialize voice services on app startup
  useEffect(() => {
    const initializeVoices = async () => {
      try {
        // Initialize Indian voice service
        initializeIndianVoices();
        
        // Initialize ResponsiveVoice service for Hindi and Indian languages
        console.log('🔄 Initializing ResponsiveVoice service...');
        const status = responsiveVoiceService.getStatus();
        console.log(`📊 Voice service status:`, status);
        
        // Wait a bit for ResponsiveVoice to load
        setTimeout(() => {
          const finalStatus = responsiveVoiceService.getStatus();
          if (finalStatus.available) {
            console.log('✅ ResponsiveVoice service ready');
            console.log(`🇮🇳 Available: ${finalStatus.hindiVoices} Hindi, ${finalStatus.tamilVoices} Tamil, ${finalStatus.bengaliVoices} Bengali voices`);
          } else {
            console.log('⚠️ ResponsiveVoice service not available, using fallbacks');
          }
        }, 2000);
        
      } catch (error) {
        console.error('Voice service initialization error:', error);
      }
    };
    
    initializeVoices();
  }, []);

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
                  (window.location.href = "/admin-dashboard")
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
            path="/admin-terminal/*"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminTerminal />
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
            path="/reset-password/:token"
            element={<ResetPasswordPage />}
          />
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
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:roomId"
            element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/follow-requests"
            element={
              <ProtectedRoute>
                <StudentDashboard />
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
