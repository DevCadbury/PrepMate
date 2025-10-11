import React from "react";
import { motion } from "framer-motion";
import {
  ChatBubbleLeftRightIcon,
  CodeBracketIcon,
  MapIcon,
  DocumentTextIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";

const WhyPrepMate: React.FC = () => {
  const features = [
    {
      icon: ChatBubbleLeftRightIcon,
      title: "AI Mock Interviews",
      description:
        "Practice with intelligent AI that adapts to your responses and provides real-time feedback on communication skills.",
      color: "bg-blue-500",
      delay: 0.1,
    },
    {
      icon: CodeBracketIcon,
      title: "Coding Practice + Company Questions",
      description:
        "Master DSA, system design, and company-specific questions with our curated problem bank and real-time evaluation.",
      color: "bg-green-500",
      delay: 0.2,
    },
    {
      icon: MapIcon,
      title: "Personalized Roadmaps",
      description:
        "Get AI-generated learning paths tailored to your goals, experience level, and target companies.",
      color: "bg-purple-500",
      delay: 0.3,
    },
    {
      icon: DocumentTextIcon,
      title: "Resume Analyzer",
      description:
        "Coming Soon! Get AI-powered feedback on your resume with suggestions for improvement and ATS optimization.",
      color: "bg-orange-500",
      delay: 0.4,
    },
    {
      icon: VideoCameraIcon,
      title: "Real-Time Chat, Video, Support",
      description:
        "Connect with peers, mentors, and support team through integrated chat and video calling features.",
      color: "bg-red-500",
      delay: 0.5,
    },
  ];

  return (
    <section id="why-prepmate" className="py-20 bg-white">
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
            Why Choose <span className="gradient-text">PrepMate</span>?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to ace your interviews, all in one powerful
            platform. From AI-powered practice to personalized learning paths.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: feature.delay }}
              viewport={{ once: true }}
              className="card p-8 group hover:shadow-2xl"
            >
              {/* Icon */}
              <div
                className={`inline-flex p-4 rounded-xl ${feature.color} text-white mb-6 group-hover:scale-110 transition-transform duration-300`}
              >
                <feature.icon className="w-8 h-8" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-primary-600 transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>

              {/* Coming Soon Badge */}
              {feature.title === "Resume Analyzer" && (
                <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></span>
                  Coming Soon
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl p-8 md:p-12">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Ready to Transform Your Interview Skills?
            </h3>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of learners who have already improved their
              interview success rate with PrepMate.
            </p>
            <button className="btn-primary text-lg px-8 py-4">
              Start Your Free Trial
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default WhyPrepMate;
