import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  UserIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  CogIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";

const RolePreviews: React.FC = () => {
  const [activeRole, setActiveRole] = useState(0);

  const roles = [
    {
      id: 0,
      name: "Student Dashboard",
      icon: UserIcon,
      color: "bg-blue-500",
      description:
        "Personalized learning experience with progress tracking and AI-powered practice.",
      preview: (
        <div className="bg-white rounded-lg p-4 h-80 border shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Student Dashboard</h3>
            <div className="text-sm text-gray-500">Welcome back, Alex!</div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 rounded p-3">
              <div className="text-2xl font-bold text-blue-600">65%</div>
              <div className="text-xs text-gray-600">DSA Progress</div>
            </div>
            <div className="bg-green-50 rounded p-3">
              <div className="text-2xl font-bold text-green-600">12</div>
              <div className="text-xs text-gray-600">Day Streak</div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-700">
                Next: Mock Interview
              </span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Today
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-700">Coding Challenge</span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                Complete
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-700">Study Group</span>
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                2:00 PM
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 1,
      name: "Teacher Panel",
      icon: AcademicCapIcon,
      color: "bg-green-500",
      description:
        "Create assignments, track student progress, and provide personalized guidance.",
      preview: (
        <div className="bg-white rounded-lg p-4 h-80 border shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Teacher Panel</h3>
            <div className="text-sm text-gray-500">Prof. Sarah Wilson</div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-green-50 rounded p-3">
              <div className="text-2xl font-bold text-green-600">45</div>
              <div className="text-xs text-gray-600">Active Students</div>
            </div>
            <div className="bg-blue-50 rounded p-3">
              <div className="text-2xl font-bold text-blue-600">8</div>
              <div className="text-xs text-gray-600">Pending Reviews</div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-700">DSA Assignment #3</span>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                Due Today
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-700">
                Student Progress Report
              </span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                View
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-700">Create New Test</span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                + New
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      name: "HR Interview Mode",
      icon: BuildingOfficeIcon,
      color: "bg-purple-500",
      description:
        "Conduct interviews, evaluate candidates, and manage the hiring process efficiently.",
      preview: (
        <div className="bg-white rounded-lg p-4 h-80 border shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">HR Interview Mode</h3>
            <div className="text-sm text-gray-500">TechCorp Inc.</div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-purple-50 rounded p-3">
              <div className="text-2xl font-bold text-purple-600">23</div>
              <div className="text-xs text-gray-600">Candidates</div>
            </div>
            <div className="bg-orange-50 rounded p-3">
              <div className="text-2xl font-bold text-orange-600">5</div>
              <div className="text-xs text-gray-600">Today's Interviews</div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-700">
                John Smith - Frontend
              </span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                10:00 AM
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-700">
                Maria Garcia - Backend
              </span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                2:00 PM
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-700">Review Submissions</span>
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                12 New
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      name: "Admin Console",
      icon: CogIcon,
      color: "bg-red-500",
      description:
        "Manage users, content, and platform settings with comprehensive administrative tools.",
      preview: (
        <div className="bg-white rounded-lg p-4 h-80 border shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Admin Console</h3>
            <div className="text-sm text-gray-500">System Admin</div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-red-50 rounded p-3">
              <div className="text-2xl font-bold text-red-600">1,247</div>
              <div className="text-xs text-gray-600">Total Users</div>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <div className="text-2xl font-bold text-gray-600">99.9%</div>
              <div className="text-xs text-gray-600">Uptime</div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-700">User Management</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Manage
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-700">Content Moderation</span>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                5 Pending
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-700">System Analytics</span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                View
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 4,
      name: "Support Executive",
      icon: QuestionMarkCircleIcon,
      color: "bg-orange-500",
      description:
        "Handle customer support tickets and provide real-time assistance to users.",
      preview: (
        <div className="bg-white rounded-lg p-4 h-80 border shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Support Dashboard</h3>
            <div className="text-sm text-gray-500">Support Agent</div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-orange-50 rounded p-3">
              <div className="text-2xl font-bold text-orange-600">8</div>
              <div className="text-xs text-gray-600">Open Tickets</div>
            </div>
            <div className="bg-green-50 rounded p-3">
              <div className="text-2xl font-bold text-green-600">15</div>
              <div className="text-xs text-gray-600">Resolved Today</div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-700">
                #1234 - Payment Issue
              </span>
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                High
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-700">
                #1235 - Feature Request
              </span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Medium
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-700">
                #1236 - Login Problem
              </span>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                In Progress
              </span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold font-display text-gray-900 mb-6">
            Role-Based <span className="gradient-text">Access Previews</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience how PrepMate adapts to different user roles, providing
            tailored interfaces and functionality for everyone.
          </p>
        </motion.div>

        {/* Role Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {roles.map((role, index) => (
            <button
              key={role.id}
              onClick={() => setActiveRole(index)}
              className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                activeRole === index
                  ? "bg-primary-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              {React.createElement(role.icon, { className: "w-5 h-5 mr-2" })}
              {role.name}
            </button>
          ))}
        </div>

        {/* Role Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            key={activeRole}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div
              className={`inline-flex p-4 rounded-xl ${roles[activeRole].color} text-white`}
            >
              {React.createElement(roles[activeRole].icon, {
                className: "w-8 h-8",
              })}
            </div>
            <h3 className="text-3xl font-bold text-gray-900">
              {roles[activeRole].name}
            </h3>
            <p className="text-lg text-gray-600 leading-relaxed">
              {roles[activeRole].description}
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="btn-primary">Try This Role</button>
              <button className="btn-secondary">Learn More</button>
            </div>
          </motion.div>

          {/* Preview */}
          <motion.div
            key={activeRole}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center"
          >
            {roles[activeRole].preview}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default RolePreviews;
