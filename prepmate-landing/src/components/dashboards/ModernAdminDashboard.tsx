import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ShieldCheckIcon,
  DocumentTextIcon,
  ShoppingCartIcon,
  UserGroupIcon,
  KeyIcon,
  LinkIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  StarIcon,
  LockClosedIcon,
  GlobeAltIcon,
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
  permissions?: string[];
  googleLinked?: boolean;
}

interface AdminPermission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  monthlyGrowth: number;
  pendingUsers: number;
  suspendedUsers: number;
}

interface ModernAdminDashboardProps {
  onLogout?: () => void;
}

const ModernAdminDashboard: React.FC<ModernAdminDashboardProps> = ({
  onLogout,
}) => {
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
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [adminToken, setAdminToken] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);

  // Available permissions
  const availablePermissions: AdminPermission[] = [
    {
      id: "user_management",
      name: "User Management",
      description: "Manage user accounts",
      category: "Users",
    },
    {
      id: "role_management",
      name: "Role Management",
      description: "Assign and modify user roles",
      category: "Users",
    },
    {
      id: "admin_creation",
      name: "Admin Creation",
      description: "Create new admin accounts",
      category: "Administration",
    },
    {
      id: "permission_management",
      name: "Permission Management",
      description: "Manage admin permissions",
      category: "Administration",
    },
    {
      id: "analytics_view",
      name: "Analytics View",
      description: "View platform analytics",
      category: "Analytics",
    },
    {
      id: "billing_management",
      name: "Billing Management",
      description: "Manage subscriptions and billing",
      category: "Finance",
    },
    {
      id: "content_moderation",
      name: "Content Moderation",
      description: "Moderate platform content",
      category: "Content",
    },
    {
      id: "system_settings",
      name: "System Settings",
      description: "Modify system configurations",
      category: "System",
    },
  ];

  useEffect(() => {
    fetchDashboardData();
    fetchNotifications();
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

  const fetchNotifications = async () => {
    // Mock notifications - in real app, fetch from API
    setNotifications([
      {
        id: 1,
        type: "info",
        message: "New user registration",
        time: "2 min ago",
      },
      {
        id: 2,
        type: "warning",
        message: "System maintenance scheduled",
        time: "1 hour ago",
      },
      {
        id: 3,
        type: "success",
        message: "Payment processed successfully",
        time: "3 hours ago",
      },
    ]);
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

  const handlePermissionUpdate = async (
    userId: string,
    permissions: string[]
  ) => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await apiClient.fetch(
        `/admin/users/${userId}/permissions`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ permissions }),
        }
      );

      if (response.ok) {
        await fetchDashboardData();
        setShowPermissionModal(false);
        setSelectedUser(null);
      } else {
        const data = await response.json();
        alert(data.message || "Failed to update permissions");
      }
    } catch (error) {
      console.error("Error updating permissions:", error);
      alert("Failed to update permissions");
    }
  };

  const generateAdminToken = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await apiClient.fetch(
        "/admin/generate-token",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAdminToken(data.token);
        setShowTokenModal(true);
      } else {
        const data = await response.json();
        alert(data.message || "Failed to generate admin token");
      }
    } catch (error) {
      console.error("Error generating admin token:", error);
      alert("Failed to generate admin token");
    }
  };

  const handleGoogleLogin = () => {
     window.location.href = apiClient.getApiUrl("/auth/admin/google");
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
      console.log("=== MODERN ADMIN DASHBOARD LOGOUT CALLED ===");

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
      console.error("Error during modern admin logout:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div
            className="absolute inset-0 w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"
            style={{ animationDelay: "-0.5s" }}
          ></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex">
      {/* Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="w-72 bg-gray-800/50 backdrop-blur-xl border-r border-gray-700/50"
      >
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <ShieldCheckIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-white">PREPMATE</span>
              <p className="text-xs text-gray-400">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="mt-8 px-4">
          <div className="mb-6">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">
              MAIN NAVIGATION
            </span>
          </div>

          <div className="space-y-2">
            {[
              { id: "dashboard", label: "Dashboard", icon: ChartBarIcon },
              { id: "users", label: "User Management", icon: UsersIcon },
              { id: "analytics", label: "Analytics", icon: DocumentTextIcon },
              { id: "billing", label: "Billing", icon: CurrencyDollarIcon },
              { id: "settings", label: "Admin Settings", icon: CogIcon },
            ].map((item) => (
              <motion.button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === item.id
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                    : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </motion.button>
            ))}
          </div>

          <div className="mt-8 mb-6">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">
              QUICK ACTIONS
            </span>
          </div>

          <div className="space-y-2">
            <motion.button
              onClick={generateAdminToken}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <KeyIcon className="w-5 h-5" />
              <span>Generate Admin Token</span>
            </motion.button>

            <motion.button
              onClick={handleGoogleLogin}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <GlobeAltIcon className="w-5 h-5" />
              <span>Google Login</span>
            </motion.button>
          </div>

          <div className="absolute bottom-6 left-4 right-4">
            <motion.button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:bg-red-500/20 hover:text-red-400 transition-all duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <XMarkIcon className="w-5 h-5" />
              <span>Sign Out</span>
            </motion.button>
          </div>
        </nav>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <motion.header
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gray-800/30 backdrop-blur-xl border-b border-gray-700/50 px-8 py-6"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">
                {activeTab === "dashboard" && "Dashboard"}
                {activeTab === "users" && "User Management"}
                {activeTab === "analytics" && "Analytics"}
                {activeTab === "billing" && "Billing & Subscriptions"}
                {activeTab === "settings" && "Admin Settings"}
              </h1>
              <p className="text-gray-400 mt-1">
                {activeTab === "dashboard" &&
                  "Welcome back! Here's what's happening with your platform today."}
                {activeTab === "users" &&
                  "Manage user accounts, roles, and permissions"}
                {activeTab === "analytics" &&
                  "View detailed platform analytics and insights"}
                {activeTab === "billing" &&
                  "Manage subscriptions, billing, and revenue"}
                {activeTab === "settings" &&
                  "Configure admin permissions and system settings"}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <motion.button
                  className="bg-gray-700/50 text-white p-3 rounded-xl hover:bg-gray-600/50 transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <BellIcon className="w-5 h-5" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </motion.button>
              </div>

              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-gray-700/50 text-white pl-10 pr-4 py-3 rounded-xl border border-gray-600/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
              </div>

              {/* Admin Profile */}
              <div className="flex items-center space-x-3 bg-gray-700/50 px-4 py-2 rounded-xl">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">A</span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Admin</p>
                  <p className="text-gray-400 text-xs">Super Admin</p>
                </div>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Content Area */}
        <main className="flex-1 p-8 overflow-auto">
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    {
                      title: "Total Revenue",
                      value: `$${(stats.totalRevenue || 0).toLocaleString()}`,
                      change: `+${stats.monthlyGrowth || 0}%`,
                      changeType: "positive",
                      icon: CurrencyDollarIcon,
                      color: "blue",
                    },
                    {
                      title: "Active Users",
                      value: (stats.activeUsers || 0).toLocaleString(),
                      change: "+5%",
                      changeType: "positive",
                      icon: UsersIcon,
                      color: "emerald",
                    },
                    {
                      title: "New Users",
                      value: `+${stats.pendingUsers || 0}`,
                      change: "-14%",
                      changeType: "negative",
                      icon: UserPlusIcon,
                      color: "purple",
                    },
                    {
                      title: "Total Sales",
                      value: `$${(
                        stats.totalRevenue * 1.4 || 0
                      ).toLocaleString()}`,
                      change: "+8%",
                      changeType: "positive",
                      icon: ShoppingCartIcon,
                      color: "yellow",
                    },
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm font-medium">
                            {stat.title}
                          </p>
                          <p className="text-2xl font-bold text-white mt-1">
                            {stat.value}
                          </p>
                        </div>
                        <div
                          className={`p-3 bg-${stat.color}-500/10 rounded-xl`}
                        >
                          <stat.icon
                            className={`w-6 h-6 text-${stat.color}-500`}
                          />
                        </div>
                      </div>
                      <div className="flex items-center mt-4">
                        {stat.changeType === "positive" ? (
                          <ArrowUpIcon className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <ArrowDownIcon className="w-4 h-4 text-red-500" />
                        )}
                        <span
                          className={`text-${
                            stat.changeType === "positive" ? "emerald" : "red"
                          }-500 text-sm font-medium ml-1`}
                        >
                          {stat.change}
                        </span>
                        <span className="text-gray-400 text-sm ml-2">
                          since last month
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Welcome Card and Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2 bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          Welcome back, Admin! 👋
                        </h3>
                        <p className="text-gray-400 mt-1">
                          Here's what's happening with your platform today.
                        </p>
                      </div>
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-white text-2xl">🚀</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gray-700/50 rounded-xl">
                        <p className="text-2xl font-bold text-white">
                          {stats.totalUsers || 0}
                        </p>
                        <p className="text-gray-400 text-sm">Total Users</p>
                      </div>
                      <div className="text-center p-4 bg-gray-700/50 rounded-xl">
                        <p className="text-2xl font-bold text-white">
                          {stats.activeUsers || 0}
                        </p>
                        <p className="text-gray-400 text-sm">Active Users</p>
                      </div>
                      <div className="text-center p-4 bg-gray-700/50 rounded-xl">
                        <p className="text-2xl font-bold text-white">
                          {stats.pendingUsers || 0}
                        </p>
                        <p className="text-gray-400 text-sm">Pending</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50"
                  >
                    <h3 className="text-lg font-bold text-white mb-4">
                      Platform Health
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">System Status</span>
                        <span className="text-emerald-500 flex items-center">
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Online
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Database</span>
                        <span className="text-emerald-500 flex items-center">
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Connected
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">API Status</span>
                        <span className="text-emerald-500 flex items-center">
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Healthy
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {activeTab === "users" && (
              <motion.div
                key="users"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* User Management Header */}
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      User Management
                    </h2>
                    <p className="text-gray-400">
                      Manage user accounts, roles, and permissions
                    </p>
                  </div>
                  <motion.button
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <UserPlusIcon className="w-5 h-5" />
                    <span>Add User</span>
                  </motion.button>
                </div>

                {/* Filters */}
                <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search users..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FunnelIcon className="w-5 h-5 text-gray-400" />
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700/50">
                      <thead className="bg-gray-700/30">
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
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-gray-800/30 divide-y divide-gray-700/30">
                        {(filteredUsers || []).map((user) => (
                          <motion.tr
                            key={user.id}
                            className="hover:bg-gray-700/30 transition-colors"
                            whileHover={{ scale: 1.01 }}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
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
                                  {user.googleLinked && (
                                    <div className="flex items-center mt-1">
                                      <GlobeAltIcon className="w-3 h-3 text-blue-400 mr-1" />
                                      <span className="text-xs text-blue-400">
                                        Google Linked
                                      </span>
                                    </div>
                                  )}
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
                                className="text-sm bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <motion.button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowPermissionModal(true);
                                  }}
                                  className="text-blue-400 hover:text-blue-300 transition-colors p-1 rounded"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <LockClosedIcon className="w-4 h-4" />
                                </motion.button>
                                <motion.button
                                  className="text-blue-400 hover:text-blue-300 transition-colors p-1 rounded"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <EyeIcon className="w-4 h-4" />
                                </motion.button>
                                {user.status === "active" ? (
                                  <motion.button
                                    onClick={() =>
                                      handleUserAction(user.id, "suspend")
                                    }
                                    disabled={actionLoading === user.id}
                                    className="text-yellow-400 hover:text-yellow-300 disabled:opacity-50 transition-colors p-1 rounded"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    {actionLoading === user.id ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                                    ) : (
                                      <XMarkIcon className="w-4 h-4" />
                                    )}
                                  </motion.button>
                                ) : (
                                  <motion.button
                                    onClick={() =>
                                      handleUserAction(user.id, "activate")
                                    }
                                    disabled={actionLoading === user.id}
                                    className="text-emerald-400 hover:text-emerald-300 disabled:opacity-50 transition-colors p-1 rounded"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    {actionLoading === user.id ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-400"></div>
                                    ) : (
                                      <CheckIcon className="w-4 h-4" />
                                    )}
                                  </motion.button>
                                )}
                                <motion.button
                                  onClick={() =>
                                    handleUserAction(user.id, "delete")
                                  }
                                  disabled={actionLoading === user.id}
                                  className="text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors p-1 rounded"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  {actionLoading === user.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                                  ) : (
                                    <TrashIcon className="w-4 h-4" />
                                  )}
                                </motion.button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Admin Settings
                  </h2>
                  <p className="text-gray-400">
                    Configure admin permissions and system settings
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50">
                    <h3 className="text-lg font-bold text-white mb-4">
                      Admin Permissions
                    </h3>
                    <div className="space-y-3">
                      {availablePermissions.map((permission) => (
                        <div
                          key={permission.id}
                          className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg"
                        >
                          <div>
                            <p className="text-white font-medium">
                              {permission.name}
                            </p>
                            <p className="text-gray-400 text-sm">
                              {permission.description}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500 bg-gray-600/50 px-2 py-1 rounded">
                              {permission.category}
                            </span>
                            <button className="text-blue-400 hover:text-blue-300">
                              <CheckIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50">
                    <h3 className="text-lg font-bold text-white mb-4">
                      System Configuration
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Google OAuth</span>
                        <span className="text-emerald-500 flex items-center">
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Enabled
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">
                          Admin Token Generation
                        </span>
                        <span className="text-emerald-500 flex items-center">
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Active
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Role-based Access</span>
                        <span className="text-emerald-500 flex items-center">
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Enabled
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Permission Modal */}
      <AnimatePresence>
        {showPermissionModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700/50"
            >
              <h3 className="text-xl font-bold text-white mb-4">
                Manage Permissions - {selectedUser.name}
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {availablePermissions.map((permission) => (
                  <label
                    key={permission.id}
                    className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg cursor-pointer hover:bg-gray-700/50"
                  >
                    <input
                      type="checkbox"
                      className="rounded border-gray-600 text-blue-500 focus:ring-blue-500"
                      defaultChecked={selectedUser.permissions?.includes(
                        permission.id
                      )}
                    />
                    <div>
                      <p className="text-white font-medium">
                        {permission.name}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {permission.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex space-x-3 mt-6">
                <motion.button
                  onClick={() => setShowPermissionModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={() => {
                    const checkboxes = document.querySelectorAll(
                      'input[type="checkbox"]:checked'
                    );
                    const permissions = Array.from(checkboxes).map((cb) =>
                      cb.getAttribute("data-permission")
                    );
                    handlePermissionUpdate(
                      selectedUser.id,
                      permissions as string[]
                    );
                  }}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Save Permissions
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Token Modal */}
      <AnimatePresence>
        {showTokenModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700/50"
            >
              <h3 className="text-xl font-bold text-white mb-4">
                Admin Token Generated
              </h3>
              <p className="text-gray-400 mb-4">
                Share this token with the new admin to create their account:
              </p>
              <div className="bg-gray-700/50 p-3 rounded-lg border border-gray-600/50">
                <code className="text-blue-400 break-all">{adminToken}</code>
              </div>
              <div className="flex space-x-3 mt-6">
                <motion.button
                  onClick={() => setShowTokenModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Close
                </motion.button>
                <motion.button
                  onClick={() => {
                    navigator.clipboard.writeText(adminToken);
                    alert("Token copied to clipboard!");
                  }}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Copy Token
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModernAdminDashboard;
