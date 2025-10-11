import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "How is AI used in PrepMate?",
      answer:
        "PrepMate uses advanced AI in multiple ways: AI-powered mock interviews that adapt to your responses and provide real-time feedback on communication, confidence, and technical skills. Our AI also generates personalized learning roadmaps based on your goals and performance, and provides intelligent recommendations for practice problems and study materials.",
    },
    {
      question: "Is this suitable for college students?",
      answer:
        "Absolutely! PrepMate is designed specifically for college students and recent graduates. We offer beginner-friendly content, step-by-step learning paths, and a supportive community of peers. Whether you're a freshman just starting to learn programming or a senior preparing for job interviews, our platform adapts to your skill level.",
    },
    {
      question: "Can I practice with friends?",
      answer:
        "Yes! PrepMate has built-in social features that allow you to connect with friends, form study groups, and practice together. You can share coding challenges, conduct peer mock interviews, and collaborate on learning goals. Our community features make interview preparation more engaging and effective.",
    },
    {
      question: "Are there certifications?",
      answer:
        "Currently, we provide completion certificates for our learning paths and mock interview sessions. We're working on industry-recognized certifications in partnership with leading tech companies and educational institutions. These will be available soon for Pro and Mentor plan subscribers.",
    },
    {
      question: "What companies do you have questions from?",
      answer:
        "We have a comprehensive database of questions from top tech companies including Google, Microsoft, Amazon, Meta, Apple, Netflix, Uber, Airbnb, and many more. Our question bank is constantly updated with the latest interview patterns and includes both coding problems and behavioral questions.",
    },
    {
      question: "How accurate are the AI mock interviews?",
      answer:
        "Our AI mock interviews are trained on thousands of real interview scenarios and provide highly accurate feedback. The AI evaluates your responses for technical accuracy, communication clarity, confidence level, and overall interview performance. Users report 95% accuracy compared to real interview feedback.",
    },
    {
      question: "Can I use PrepMate on mobile devices?",
      answer:
        "Yes! PrepMate is fully responsive and works great on mobile devices. You can practice coding problems, take mock interviews, and access all features from your smartphone or tablet. We also offer a mobile app for iOS and Android for an even better experience.",
    },
    {
      question: "What if I'm not satisfied with the platform?",
      answer:
        "We offer a 14-day free trial for all paid plans, and a 30-day money-back guarantee. If you're not completely satisfied with PrepMate, we'll refund your subscription, no questions asked. We're committed to your success and want you to feel confident in your investment.",
    },
    {
      question: "Do you offer group discounts for colleges?",
      answer:
        "Yes! We offer special pricing for colleges, universities, and educational institutions. Our team plans include bulk licensing, custom branding, and dedicated support. Contact our sales team to learn more about our educational partnerships and group pricing options.",
    },
    {
      question: "How often is the content updated?",
      answer:
        "We update our content weekly with new coding problems, interview questions, and learning materials. Our AI models are continuously trained on the latest interview patterns and industry trends. We also regularly add new features and improvements based on user feedback.",
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold font-display text-gray-900 mb-6">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find answers to common questions about PrepMate. Can't find what
            you're looking for? Contact our support team.
          </p>
        </motion.div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="card"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
              >
                <h3 className="text-lg font-semibold text-gray-900 pr-4">
                  {faq.question}
                </h3>
                <ChevronDownIcon
                  className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-4">
                      <p className="text-gray-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl p-8 md:p-12">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Still Have Questions?
            </h3>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Our support team is here to help you get the most out of PrepMate.
              We typically respond within 2 hours during business hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn-primary">Contact Support</button>
              <button className="btn-secondary">Schedule a Call</button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;
