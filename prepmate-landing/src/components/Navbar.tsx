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
    { name: "Why PrepMate", id: "why-prepmate" },
    { name: "Pricing", id: "pricing" },
    { name: "FAQ", id: "faq" },
  ];

  return (
    <nav className="fixed top-0 w-full bg-gray-900/95 backdrop-blur-md z-50 shadow-lg border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center"
          >
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold font-display gradient-text">
                📛 PrepMate
              </h1>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => scrollToSection(item.id)}
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Go to Dashboard Button - Left Side */}
                <button
                  onClick={() => navigate("/dashboard")}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <UserIcon className="h-4 w-4" />
                  <span>Go to Dashboard</span>
                </button>

                {/* User Profile Dropdown */}
                <div className="relative user-menu group">
                  <button className="flex items-center space-x-2 text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 group-hover:scale-105">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-blue-600 flex items-center justify-center shadow-lg">
                      {user?.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-sm font-medium">
                          {user?.name?.charAt(0) || "U"}
                        </span>
                      )}
                    </div>
                    <span className="hidden lg:block">{user?.name}</span>
                    <svg
                      className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  <div className="absolute right-0 mt-2 w-48 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-xl shadow-2xl z-50 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto transform scale-95 group-hover:scale-100">
                    <div className="py-2">
                      <div className="px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user?.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {user?.email}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          // Settings functionality
                          success("Settings", "Settings page coming soon!");
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transition-all duration-200"
                      >
                        <div className="flex items-center space-x-2">
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          <span>Settings</span>
                        </div>
                      </button>

                      <button
                        onClick={async () => {
                          console.log("=== NAVBAR LOGOUT BUTTON CLICKED ===");
                          try {
                            await logout();
                            success(
                              "Logged out successfully",
                              "You have been logged out."
                            );
                            console.log("Logout completed successfully");
                          } catch (error) {
                            console.error("Logout error in Navbar:", error);
                            success("Logout failed", "Please try again.");
                          }
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 dark:hover:from-red-900/20 dark:hover:to-pink-900/20 transition-all duration-200"
                      >
                        <div className="flex items-center space-x-2">
                          <ArrowRightOnRectangleIcon className="h-4 w-4" />
                          <span>Logout</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={onSignIn}
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Sign In
                </button>
                <button onClick={onGetStarted} className="btn-primary text-sm">
                  Get Started
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden mobile-menu">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-300 hover:text-white p-2 rounded-md"
            >
              {isOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-gray-900 border-t border-gray-800 mobile-menu"
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => scrollToSection(item.id)}
                className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
              >
                {item.name}
              </button>
            ))}
            <div className="pt-4 space-y-2">
              {isAuthenticated ? (
                <>
                  <div className="px-3 py-2 border-b border-gray-700">
                    <p className="text-sm font-medium text-white">
                      {user?.name}
                    </p>
                    <p className="text-xs text-gray-400">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      navigate("/dashboard");
                      setIsOpen(false);
                    }}
                    className="flex items-center space-x-2 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-base font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 w-full"
                  >
                    <UserIcon className="h-4 w-4" />
                    <span>Go to Dashboard</span>
                  </button>
                  <button
                    onClick={() => {
                      // Settings functionality
                      success("Settings", "Settings page coming soon!");
                      setIsOpen(false);
                    }}
                    className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 w-full text-left"
                  >
                    <div className="flex items-center space-x-2">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span>Settings</span>
                    </div>
                  </button>
                  <button
                    onClick={async () => {
                      console.log("=== MOBILE LOGOUT BUTTON CLICKED ===");
                      try {
                        await logout();
                        setIsOpen(false);
                        success(
                          "Logged out successfully",
                          "You have been logged out."
                        );
                        console.log("Mobile logout completed successfully");
                      } catch (error) {
                        console.error("Mobile logout error:", error);
                        success("Logout failed", "Please try again.");
                      }
                    }}
                    className="text-red-400 hover:text-red-300 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 w-full text-left"
                  >
                    <div className="flex items-center space-x-2">
                      <ArrowRightOnRectangleIcon className="h-4 w-4" />
                      <span>Logout</span>
                    </div>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={onSignIn}
                    className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                  >
                    Sign In
                  </button>
                  <button onClick={onGetStarted} className="btn-primary w-full">
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;
