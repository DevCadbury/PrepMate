import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bars3Icon,
  XMarkIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "./ui/toast";

interface NavbarProps {
  onSignIn: () => void;
  onGetStarted: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onSignIn, onGetStarted }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { success } = useToast();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsOpen(false);
  };

  // Close mobile menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && !(event.target as Element).closest(".mobile-menu")) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const navItems = [
    { name: "Features", id: "features" },
    { name: "Pricing", id: "pricing" },
  ];

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
    >
      <div className="w-full max-w-5xl bg-background/70 dark:bg-card/70 backdrop-blur-2xl shadow-[0_8px_30px_rgba(37,99,235,0.1)] border border-border/50 rounded-full px-6 py-3 flex justify-between items-center pointer-events-auto transition-all duration-300 hover:shadow-[0_8px_40px_rgba(37,99,235,0.2)]">
        {/* Logo */}
        <div className="flex items-center cursor-pointer group" onClick={() => window.scrollTo(0,0)}>
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center mr-3 shadow-[0_0_15px_rgba(37,99,235,0.5)] group-hover:scale-110 transition-transform">
             <span className="text-white font-bold text-lg leading-none">P</span>
          </div>
          <h1 className="text-xl font-bold font-display text-foreground hidden sm:block">
            PrepMate
          </h1>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => scrollToSection(item.id)}
              className="relative px-4 py-2 rounded-full text-sm font-bold text-muted-foreground hover:text-foreground transition-colors duration-200 group overflow-hidden"
            >
              <span className="relative z-10">{item.name}</span>
              <div className="absolute inset-0 bg-blue-500/10 scale-0 group-hover:scale-100 rounded-full transition-transform duration-300 origin-center z-0"></div>
            </button>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center space-x-3">
          {isAuthenticated ? (
            <>
              {/* Go to Dashboard Button */}
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-sm font-bold transition-all duration-200"
              >
                <UserIcon className="h-4 w-4" />
                <span>Dashboard</span>
              </button>

              {/* User Profile Dropdown */}
              <div className="relative user-menu group">
                <button className="flex items-center space-x-2 px-2 py-1.5 rounded-full border border-transparent hover:border-border transition-all duration-200 group-hover:bg-muted/50">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                    {user?.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold">
                        {user?.name?.charAt(0) || "U"}
                      </span>
                    )}
                  </div>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-56 bg-background/95 backdrop-blur-xl border border-border rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-50 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto transform origin-top-right scale-95 group-hover:scale-100 overflow-hidden">
                  <div className="px-4 py-4 border-b border-border bg-muted/30">
                    <p className="text-sm font-bold text-foreground truncate">
                      {user?.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {user?.email}
                    </p>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={async () => {
                        try {
                          await logout();
                          success("Logged out successfully", "You have been logged out.");
                        } catch (error) {
                          success("Logout failed", "Please try again.");
                        }
                      }}
                      className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 flex items-center space-x-3 group/btn"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4 group-hover/btn:-translate-x-1 transition-transform" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={onSignIn}
                className="text-muted-foreground hover:text-foreground px-4 py-2 rounded-full text-sm font-bold transition-all duration-200"
              >
                Sign In
              </button>
              <button onClick={onGetStarted} className="bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 transform hover:scale-105">
                Start Free
              </button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden mobile-menu">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-foreground p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
          >
            {isOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-20 left-4 right-4 bg-background/95 backdrop-blur-2xl border border-border rounded-[2rem] shadow-2xl mobile-menu overflow-hidden pointer-events-auto md:hidden"
          >
            <div className="p-4 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => scrollToSection(item.id)}
                  className="w-full text-center px-4 py-3 rounded-2xl text-foreground bg-muted/30 hover:bg-muted/60 text-lg font-bold transition-colors duration-200"
                >
                  {item.name}
                </button>
              ))}
              
              <div className="h-px bg-border my-4"></div>
              
              {isAuthenticated ? (
                <>
                  <div className="px-4 py-3 bg-muted/30 rounded-2xl mb-2 text-center">
                    <p className="text-sm font-bold text-foreground">
                      {user?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      navigate("/dashboard");
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold"
                  >
                    <UserIcon className="h-5 w-5" />
                    <span>Dashboard</span>
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await logout();
                        setIsOpen(false);
                        success("Logged out successfully", "");
                      } catch (error) {
                        success("Logout failed", "Please try again.");
                      }
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl text-red-500 bg-red-50 dark:bg-red-900/20 font-bold mt-2"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <div className="space-y-3 pt-2">
                  <button
                    onClick={() => { onSignIn(); setIsOpen(false); }}
                    className="w-full text-center px-4 py-3 rounded-2xl text-foreground font-bold border border-border"
                  >
                    Sign In
                  </button>
                  <button onClick={() => { onGetStarted(); setIsOpen(false); }} className="w-full text-center px-4 py-3 rounded-2xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/30">
                    Get Started Free
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
