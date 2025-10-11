import React from "react";
import { motion } from "framer-motion";
import { PlayIcon, RocketLaunchIcon } from "@heroicons/react/24/outline";

interface HeroProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

const Hero: React.FC<HeroProps> = ({ onGetStarted, onSignIn }) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary-50 via-white to-accent-50">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-bounce-slow"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-bounce-slow"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-40 left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-bounce-slow"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 text-primary-800 text-sm font-medium mb-8"
          >
            <span className="w-2 h-2 bg-primary-600 rounded-full mr-2"></span>
            🚀 Now with AI-Powered Mock Interviews
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold font-display text-gray-900 mb-6 leading-tight"
          >
            Ace Your Interviews with{" "}
            <span className="gradient-text">AI-Powered</span> PrepMate
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed"
          >
            Practice, Learn, Connect & Grow — all in one platform. Master
            coding, communication, and confidence with personalized roadmaps and
            real-time support.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
          >
            <button
              onClick={onGetStarted}
              className="btn-primary text-lg px-8 py-4 flex items-center"
            >
              <RocketLaunchIcon className="w-5 h-5 mr-2" />
              Get Started Free
            </button>
            <button
              onClick={onSignIn}
              className="btn-secondary text-lg px-8 py-4 flex items-center"
            >
              <PlayIcon className="w-5 h-5 mr-2" />
              Sign In
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto"
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">
                10K+
              </div>
              <div className="text-gray-600">Active Learners</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">
                40+
              </div>
              <div className="text-gray-600">Colleges</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">
                95%
              </div>
              <div className="text-gray-600">Success Rate</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1 h-3 bg-gray-400 rounded-full mt-2"
          ></motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;
