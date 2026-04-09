import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import {
  UsersIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  EyeIcon,
  TrashIcon,
  UserPlusIcon,
  CogIcon,
  BellIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckIcon,
  XMarkIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CalendarIcon,
  ClockIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  ShoppingCartIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { apiClient } from "../../lib/apiClient";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "suspended" | "pending";
  joinDate: string;
  lastLogin: string;
  subscription: string;
}

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  monthlyGrowth: number;
  pendingUsers: number;
  suspendedUsers: number;
}

interface AdminDashboardProps {
  onLogout?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const { logout } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalRevenue: 0,
    monthlyGrowth: 0,
    pendingUsers: 0,
    suspendedUsers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await apiClient.fetch(
        "/admin/dashboard",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUsers(Array.isArray(data.users) ? data.users : []);
        setStats(
          data.stats || {
            totalUsers: 0,
            activeUsers: 0,
            totalRevenue: 0,
            monthlyGrowth: 0,
            pendingUsers: 0,
            suspendedUsers: 0,
          }
        );
      } else {
        console.error("Failed to fetch dashboard data:", response.status);
        setStats({
          totalUsers: 0,
          activeUsers: 0,
          totalRevenue: 0,
          monthlyGrowth: 0,
          pendingUsers: 0,
          suspendedUsers: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: string) => {
    setActionLoading(userId);
    try {
      const token = localStorage.getItem("adminToken");
      const response = await apiClient.fetch(
        `/admin/users/${userId}/${action}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        await fetchDashboardData();
      } else {
        const data = await response.json();
        alert(data.message || `Failed to ${action} user`);
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      alert(`Failed to ${action} user`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionLoading(userId);
    try {
      const token = localStorage.getItem("adminToken");
      const response = await apiClient.fetch(
        `/admin/users/${userId}/role`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (response.ok) {
        await fetchDashboardData();
      } else {
        const data = await response.json();
        alert(data.message || "Failed to update user role");
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      alert("Failed to update user role");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "suspended":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const handleLogout = async () => {
    try {
      console.log("=== ADMIN DASHBOARD LOGOUT CALLED ===");

      // Clear admin-specific data
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminData");

      // Call the proper logout function if available
      if (typeof logout === "function") {
        await logout();
      }

      if (onLogout) {
        onLogout();
      } else {
        window.location.href = "/admin";
      }
    } catch (error: any) {
      console.error("Error during admin logout:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700">
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <ShieldCheckIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">PREPMATE ADMIN</span>
          </div>
        </div>

        <nav className="mt-8">
          <div className="px-6 mb-4">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              MAIN NAVIGATION
            </span>
          </div>

          <div className="space-y-2 px-3">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "dashboard"
                  ? "bg-blue-500 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              <ChartBarIcon className="w-5 h-5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab("users")}
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "users"
                  ? "bg-blue-500 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              <UsersIcon className="w-5 h-5" />
              <span>User Management</span>
            </button>

            <button
              onClick={() => setActiveTab("analytics")}
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "analytics"
                  ? "bg-blue-500 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              <DocumentTextIcon className="w-5 h-5" />
              <span>Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab("billing")}
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "billing"
                  ? "bg-blue-500 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              <CurrencyDollarIcon className="w-5 h-5" />
              <span>Billing</span>
            </button>
          </div>

          <div className="px-6 mt-8 mb-4">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              ACCOUNT PAGES
            </span>
          </div>

          <div className="space-y-2 px-3">
            <button className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
              <UserGroupIcon className="w-5 h-5" />
              <span>Profile</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Help Section */}
          <div className="absolute bottom-6 left-6 right-6">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">?</span>
                </div>
                <div>
                  <p className="text-sm text-white font-medium">Need help?</p>
                  <p className="text-xs text-gray-400">Please check our docs</p>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">
                {activeTab === "dashboard" && "Dashboard"}
                {activeTab === "users" && "User Management"}
                {activeTab === "analytics" && "Analytics"}
                {activeTab === "billing" && "Billing"}
              </h1>
              <p className="text-gray-400 text-sm">
                {activeTab === "dashboard" &&
                  "Welcome back, Admin! Here's what's happening with your platform today."}
                {activeTab === "users" &&
                  "Manage user accounts and permissions"}
                {activeTab === "analytics" &&
                  "View detailed platform analytics and reports"}
                {activeTab === "billing" && "Manage subscriptions and billing"}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Type here..."
                  className="bg-gray-700 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                <BellIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-800 rounded-xl p-6 border border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm font-medium">
                        Today's Money
                      </p>
                      <p className="text-2xl font-bold text-white">
                        ${(stats.totalRevenue || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                      <CurrencyDollarIcon className="w-6 h-6 text-blue-500" />
                    </div>
                  </div>
                  <div className="flex items-center mt-4">
                    <ArrowUpIcon className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-500 text-sm font-medium ml-1">
                      +{stats.monthlyGrowth || 0}%
                    </span>
                    <span className="text-gray-400 text-sm ml-2">
                      since last month
                    </span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gray-800 rounded-xl p-6 border border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm font-medium">
                        Today's Users
                      </p>
                      <p className="text-2xl font-bold text-white">
                        {stats.activeUsers || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-emerald-500/10 rounded-lg">
                      <UsersIcon className="w-6 h-6 text-emerald-500" />
                    </div>
                  </div>
                  <div className="flex items-center mt-4">
                    <ArrowUpIcon className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-500 text-sm font-medium ml-1">
                      +5%
                    </span>
                    <span className="text-gray-400 text-sm ml-2">
                      since yesterday
                    </span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gray-800 rounded-xl p-6 border border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm font-medium">
                        New Clients
                      </p>
                      <p className="text-2xl font-bold text-white">
                        +{stats.pendingUsers || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-500/10 rounded-lg">
                      <UserPlusIcon className="w-6 h-6 text-purple-500" />
                    </div>
                  </div>
                  <div className="flex items-center mt-4">
                    <ArrowDownIcon className="w-4 h-4 text-red-500" />
                    <span className="text-red-500 text-sm font-medium ml-1">
                      -14%
                    </span>
                    <span className="text-gray-400 text-sm ml-2">
                      since last week
                    </span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gray-800 rounded-xl p-6 border border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm font-medium">
                        Total Sales
                      </p>
                      <p className="text-2xl font-bold text-white">
                        ${(stats.totalRevenue * 1.4 || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-500/10 rounded-lg">
                      <ShoppingCartIcon className="w-6 h-6 text-yellow-500" />
                    </div>
                  </div>
                  <div className="flex items-center mt-4">
                    <ArrowUpIcon className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-500 text-sm font-medium ml-1">
                      +8%
                    </span>
                    <span className="text-gray-400 text-sm ml-2">
                      since last month
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Welcome Card and Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="lg:col-span-2 bg-gray-800 rounded-xl p-6 border border-gray-700"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        Welcome back, Admin!
                      </h3>
                      <p className="text-gray-400">
                        Glad to see you again! Ask me anything.
                      </p>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-2xl">👋</span>
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-300 text-sm">Tap to record →</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gray-800 rounded-xl p-6 border border-gray-700"
                >
                  <h3 className="text-lg font-bold text-white mb-2">
                    Satisfaction Rate
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    From all projects
                  </p>
                  <div className="flex items-center justify-center">
                    <div className="relative w-24 h-24">
                      <svg
                        className="w-24 h-24 transform -rotate-90"
                        viewBox="0 0 36 36"
                      >
                        <path
                          className="text-gray-700"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-emerald-500"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeDasharray="95, 100"
                          strokeLinecap="round"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">
                          95%
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-center text-gray-400 text-sm mt-2">
                    Based on likes
                  </p>
                </motion.div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-gray-800 rounded-xl p-6 border border-gray-700"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white">
                      Sales Overview
                    </h3>
                    <span className="text-emerald-500 text-sm">
                      (+5) more in 2024
                    </span>
                  </div>
                  <div className="h-64 bg-gray-700 rounded-lg flex items-center justify-center">
                    <p className="text-gray-400">Chart Placeholder</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-gray-800 rounded-xl p-6 border border-gray-700"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white">
                      Active Users
                    </h3>
                    <span className="text-emerald-500 text-sm">
                      (+23) than last week
                    </span>
                  </div>
                  <div className="h-64 bg-gray-700 rounded-lg flex items-center justify-center">
                    <p className="text-gray-400">Chart Placeholder</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">32,984</p>
                      <p className="text-gray-400 text-sm">Users</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">2,42m</p>
                      <p className="text-gray-400 text-sm">Clicks</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">$2,400</p>
                      <p className="text-gray-400 text-sm">Sales</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">320</p>
                      <p className="text-gray-400 text-sm">Items</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-6">
              {/* User Management Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    User Management
                  </h2>
                  <p className="text-gray-400">
                    Manage user accounts and permissions
                  </p>
                </div>
                <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2">
                  <UserPlusIcon className="w-5 h-5" />
                  <span>Add User</span>
                </button>
              </div>

              {/* Filters */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FunnelIcon className="w-5 h-5 text-gray-400" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Join Date
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Last Login
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                      {(filteredUsers || []).map((user) => (
                        <tr
                          key={user.id}
                          className="hover:bg-gray-700 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                                  <span className="text-sm font-medium text-white">
                                    {user.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-white">
                                  {user.name}
                                </div>
                                <div className="text-sm text-gray-400">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={user.role}
                              onChange={(e) =>
                                handleRoleChange(user.id, e.target.value)
                              }
                              disabled={actionLoading === user.id}
                              className="text-sm bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="student">Student</option>
                              <option value="teacher">Teacher</option>
                              <option value="hr">HR</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                                user.status
                              )}`}
                            >
                              {user.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {new Date(user.joinDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {new Date(user.lastLogin).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setSelectedUser(user)}
                                className="text-blue-400 hover:text-blue-300 transition-colors"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              {user.status === "active" ? (
                                <button
                                  onClick={() =>
                                    handleUserAction(user.id, "suspend")
                                  }
                                  disabled={actionLoading === user.id}
                                  className="text-yellow-400 hover:text-yellow-300 disabled:opacity-50 transition-colors"
                                >
                                  {actionLoading === user.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                                  ) : (
                                    <XMarkIcon className="w-4 h-4" />
                                  )}
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    handleUserAction(user.id, "activate")
                                  }
                                  disabled={actionLoading === user.id}
                                  className="text-emerald-400 hover:text-emerald-300 disabled:opacity-50 transition-colors"
                                >
                                  {actionLoading === user.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-400"></div>
                                  ) : (
                                    <CheckIcon className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                              <button
                                onClick={() =>
                                  handleUserAction(user.id, "delete")
                                }
                                disabled={actionLoading === user.id}
                                className="text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
                              >
                                {actionLoading === user.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                                ) : (
                                  <TrashIcon className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">
                Analytics Dashboard
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-lg font-bold text-white mb-4">
                    User Growth
                  </h3>
                  <div className="h-64 bg-gray-700 rounded-lg flex items-center justify-center">
                    <p className="text-gray-400">Analytics Chart Placeholder</p>
                  </div>
                </div>
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-lg font-bold text-white mb-4">
                    Revenue Analytics
                  </h3>
                  <div className="h-64 bg-gray-700 rounded-lg flex items-center justify-center">
                    <p className="text-gray-400">Revenue Chart Placeholder</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "billing" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">
                Billing & Subscriptions
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-lg font-bold text-white mb-4">
                    Subscription Overview
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Revenue</span>
                      <span className="text-white font-bold">
                        ${(stats.totalRevenue || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">
                        Active Subscriptions
                      </span>
                      <span className="text-white font-bold">
                        {stats.activeUsers || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Monthly Growth</span>
                      <span className="text-emerald-500 font-bold">
                        +{stats.monthlyGrowth || 0}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-lg font-bold text-white mb-4">
                    Recent Transactions
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                      <div>
                        <p className="text-white font-medium">
                          Premium Subscription
                        </p>
                        <p className="text-gray-400 text-sm">
                          john.doe@example.com
                        </p>
                      </div>
                      <span className="text-emerald-500 font-bold">$29.99</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                      <div>
                        <p className="text-white font-medium">
                          Basic Subscription
                        </p>
                        <p className="text-gray-400 text-sm">
                          jane.smith@example.com
                        </p>
                      </div>
                      <span className="text-emerald-500 font-bold">$9.99</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
