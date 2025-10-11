import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ComputerDesktopIcon,
  ChartBarIcon,
  UserGroupIcon,
  DocumentCheckIcon,
  CogIcon,
} from "@heroicons/react/24/outline";

const Features: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      id: 0,
      title: "Mock Interview Module",
      description:
        "Practice with AI-powered mock interviews that adapt to your responses. Get real-time feedback on communication, confidence, and technical skills.",
      icon: ComputerDesktopIcon,
      color: "bg-blue-500",
      mockup: (
        <div className="bg-gray-900 rounded-lg p-4 h-64 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="text-white text-sm">AI Interview Session</div>
          </div>
          <div className="flex-1 bg-gray-800 rounded p-4 mb-4">
            <div className="text-green-400 text-sm mb-2">
              AI: "Tell me about a challenging project you worked on."
            </div>
            <div className="text-white text-sm mb-4">
              User: "I developed a full-stack e-commerce platform..."
            </div>
            <div className="text-blue-400 text-sm">
              Feedback: Great structure! Consider adding specific metrics.
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>Confidence: 85%</span>
            <span>Fluency: 92%</span>
            <span>Technical: 78%</span>
          </div>
        </div>
      ),
    },
    {
      id: 1,
      title: "Roadmap Tracker",
      description:
        "Follow personalized learning paths with progress tracking, milestone achievements, and adaptive recommendations based on your performance.",
      icon: ChartBarIcon,
      color: "bg-green-500",
      mockup: (
        <div className="bg-white rounded-lg p-4 h-64 border shadow-lg">
          <div className="text-gray-900 font-semibold mb-4">
            DSA Mastery Path
          </div>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-700">Arrays & Strings</span>
              <span className="ml-auto text-xs text-green-600">✓ Complete</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-700">Linked Lists</span>
              <span className="ml-auto text-xs text-green-600">✓ Complete</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-700">Trees & Graphs</span>
              <span className="ml-auto text-xs text-blue-600">In Progress</span>
            </div>
            <div className="flex items-center opacity-50">
              <div className="w-4 h-4 bg-gray-300 rounded-full mr-3"></div>
              <span className="text-sm text-gray-500">Dynamic Programming</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm text-gray-600 mb-2">Overall Progress</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: "65%" }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">65% Complete</div>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      title: "Test & Assignments",
      description:
        "Take coding challenges, MCQ tests, and assignments created by teachers or HR professionals. Get instant feedback and detailed analytics.",
      icon: DocumentCheckIcon,
      color: "bg-purple-500",
      mockup: (
        <div className="bg-white rounded-lg p-4 h-64 border shadow-lg">
          <div className="text-gray-900 font-semibold mb-4">
            Coding Challenge
          </div>
          <div className="bg-gray-50 rounded p-3 mb-3">
            <div className="text-sm text-gray-700 mb-2">Problem: Two Sum</div>
            <div className="text-xs text-gray-600">
              Given an array of integers, return indices of the two numbers that
              add up to a specific target.
            </div>
          </div>
          <div className="bg-gray-900 rounded p-3 mb-3">
            <div className="text-green-400 text-xs font-mono">
              def twoSum(nums, target):
              <br />
              &nbsp;&nbsp;hash_map = {}
              <br />
              &nbsp;&nbsp;for i, num in enumerate(nums):
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;complement = target - num
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;if complement in hash_map:
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;return [hash_map[complement],
              i]
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;hash_map[num] = i
            </div>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-green-600">✓ All tests passed</span>
            <span className="text-blue-600">Runtime: 45ms</span>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      title: "Community & Posts",
      description:
        "Share your learning journey, ask questions, and connect with peers. Build a supportive community of learners and mentors.",
      icon: UserGroupIcon,
      color: "bg-orange-500",
      mockup: (
        <div className="bg-white rounded-lg p-4 h-64 border shadow-lg">
          <div className="text-gray-900 font-semibold mb-4">Community Feed</div>
          <div className="space-y-3">
            <div className="border-b pb-3">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-sm font-medium text-gray-700">
                  Sarah K.
                </span>
                <span className="text-xs text-gray-500 ml-auto">2h ago</span>
              </div>
              <div className="text-sm text-gray-700">
                Just completed my first AI mock interview! The feedback was
                incredibly helpful. Anyone else tried it?
              </div>
              <div className="flex items-center mt-2 text-xs text-gray-500">
                <span className="mr-4">👍 12</span>
                <span className="mr-4">💬 5</span>
                <span>🔗 Share</span>
              </div>
            </div>
            <div className="border-b pb-3">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm font-medium text-gray-700">
                  Alex M.
                </span>
                <span className="text-xs text-gray-500 ml-auto">4h ago</span>
              </div>
              <div className="text-sm text-gray-700">
                Looking for study partners for Google interview prep. Anyone
                interested?
              </div>
              <div className="flex items-center mt-2 text-xs text-gray-500">
                <span className="mr-4">👍 8</span>
                <span className="mr-4">💬 3</span>
                <span>🔗 Share</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 4,
      title: "Dashboard Analytics",
      description:
        "Track your progress with detailed analytics, performance insights, and personalized recommendations to optimize your learning journey.",
      icon: CogIcon,
      color: "bg-red-500",
      mockup: (
        <div className="bg-white rounded-lg p-4 h-64 border shadow-lg">
          <div className="text-gray-900 font-semibold mb-4">
            Performance Dashboard
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">156</div>
              <div className="text-xs text-gray-600">Problems Solved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">23</div>
              <div className="text-xs text-gray-600">Mock Interviews</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">85%</div>
              <div className="text-xs text-gray-600">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">12</div>
              <div className="text-xs text-gray-600">Day Streak</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Weak Areas:</span>
              <span className="text-red-600">Dynamic Programming</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Strong Areas:</span>
              <span className="text-green-600">Arrays, Strings</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Next Goal:</span>
              <span className="text-blue-600">Complete Trees Module</span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="features" className="py-20 bg-gray-50">
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
            Powerful Features for{" "}
            <span className="gradient-text">Every Learner</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore our comprehensive suite of tools designed to accelerate your
            interview preparation journey.
          </p>
        </motion.div>

        {/* Feature Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {features.map((feature, index) => (
            <button
              key={feature.id}
              onClick={() => setActiveFeature(index)}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                activeFeature === index
                  ? "bg-primary-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              {feature.title}
            </button>
          ))}
        </div>

        {/* Feature Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            key={`content-${activeFeature}`}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div
              className={`inline-flex p-4 rounded-xl ${features[activeFeature].color} text-white`}
            >
              {React.createElement(features[activeFeature].icon, {
                className: "w-8 h-8",
              })}
            </div>
            <h3 className="text-3xl font-bold text-gray-900">
              {features[activeFeature].title}
            </h3>
            <p className="text-lg text-gray-600 leading-relaxed">
              {features[activeFeature].description}
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="btn-primary">Try It Now</button>
              <button className="btn-secondary">Learn More</button>
            </div>
          </motion.div>

          {/* Mockup */}
          <motion.div
            key={`mockup-${activeFeature}`}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center"
          >
            {features[activeFeature].mockup}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Features;
