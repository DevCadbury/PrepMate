import React, { useState } from "react";
import { motion } from "framer-motion";
import { CheckIcon } from "@heroicons/react/24/outline";

interface PricingProps {
  onGetStarted: () => void;
}

const Pricing: React.FC<PricingProps> = ({ onGetStarted }) => {
  const [isYearly, setIsYearly] = useState(false);

  const plans = [
    {
      name: "Free",
      price: { monthly: 0, yearly: 0 },
      description: "Perfect for getting started with interview preparation",
      features: [
        "5 AI Mock Interviews per month",
        "Basic coding practice (50 problems)",
        "Community access",
        "Basic progress tracking",
        "Email support",
      ],
      limitations: [
        "Limited roadmap access",
        "No video calls",
        "Basic analytics only",
      ],
      color: "bg-gray-500",
      popular: false,
    },
    {
      name: "Pro",
      price: { monthly: 19, yearly: 190 },
      description: "For serious learners who want to accelerate their progress",
      features: [
        "Unlimited AI Mock Interviews",
        "Full coding practice library (1000+ problems)",
        "Personalized roadmaps",
        "Advanced analytics & insights",
        "Video calls with peers",
        "Priority email support",
        "Resume analyzer (coming soon)",
        "Company-specific question banks",
      ],
      limitations: [],
      color: "bg-primary-600",
      popular: true,
    },
    {
      name: "Mentor",
      price: { monthly: 49, yearly: 490 },
      description: "For educators, HR professionals, and career coaches",
      features: [
        "Everything in Pro",
        "Create & assign tests",
        "Student progress tracking",
        "Advanced admin tools",
        "Custom branding",
        "API access",
        "Dedicated support manager",
        "White-label options",
        "Bulk user management",
        "Advanced reporting",
      ],
      limitations: [],
      color: "bg-accent-500",
      popular: false,
    },
  ];

  const savings = isYearly ? "Save 17%" : "";

  return (
    <section id="pricing" className="py-20 bg-white">
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
            Simple, <span className="gradient-text">Transparent Pricing</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the plan that fits your learning goals. All plans include a
            14-day free trial.
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="flex justify-center items-center mb-12"
        >
          <div className="bg-gray-100 rounded-lg p-1 flex items-center">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
                !isYearly
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
                isYearly
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Yearly
            </button>
          </div>
          {isYearly && (
            <span className="ml-4 px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
              {savings}
            </span>
          )}
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`relative card p-8 ${
                plan.popular ? "ring-2 ring-primary-600 scale-105" : ""
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    ${plan.price[isYearly ? "yearly" : "monthly"]}
                  </span>
                  {plan.price[isYearly ? "yearly" : "monthly"] > 0 && (
                    <span className="text-gray-600">
                      /{isYearly ? "year" : "month"}
                    </span>
                  )}
                </div>
                <button
                  onClick={onGetStarted}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                    plan.popular
                      ? "btn-primary"
                      : plan.name === "Free"
                      ? "btn-secondary"
                      : "btn-accent"
                  }`}
                >
                  {plan.name === "Free" ? "Get Started" : "Start Free Trial"}
                </button>
              </div>

              {/* Features */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 mb-4">
                  What's included:
                </h4>
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-start">
                    <CheckIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}

                {/* Limitations */}
                {plan.limitations.length > 0 && (
                  <>
                    <h4 className="font-semibold text-gray-900 mb-4 mt-6">
                      Limitations:
                    </h4>
                    {plan.limitations.map((limitation, limitationIndex) => (
                      <div key={limitationIndex} className="flex items-start">
                        <div className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0">
                          ×
                        </div>
                        <span className="text-gray-500">{limitation}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Enterprise CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl p-8 md:p-12">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Need a Custom Solution?
            </h3>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              For enterprise customers, colleges, and organizations with
              specific requirements, we offer custom pricing and dedicated
              support.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn-primary">Contact Sales</button>
              <button className="btn-secondary">Schedule Demo</button>
            </div>
          </div>
        </motion.div>

        {/* FAQ Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-gray-600">
            Have questions about pricing?{" "}
            <a
              href="#faq"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Check our FAQ
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
