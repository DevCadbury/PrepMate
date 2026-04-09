import React, { useState } from "react";
import { motion } from "framer-motion";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";

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
        "5 Mock Interviews per month",
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
      popular: false,
    },
    {
      name: "Pro",
      price: { monthly: 19, yearly: 190 },
      description: "For serious learners who want to accelerate their progress",
      features: [
        "Unlimited Mock Interviews",
        "Full coding practice library (1000+ problems)",
        "Personalized roadmaps",
        "Advanced analytics & insights",
        "Video calls with peers",
        "Priority email support",
        "Resume analyzer (coming soon)",
        "Company-specific question banks",
      ],
      limitations: [],
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
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-32 bg-background border-b border-border relative overflow-hidden">
      {/* Heavy Blue Orbs */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] left-[-20%] w-[70%] h-[70%] rounded-full bg-blue-600/10 mix-blend-normal filter blur-[150px] animate-pulse-glow"></div>
        <div className="absolute bottom-[10%] right-[-20%] w-[60%] h-[60%] rounded-full bg-cyan-600/10 mix-blend-normal filter blur-[150px] animate-pulse-glow" style={{ animationDelay: '-1s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center px-4 py-2 mb-6 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-bold tracking-widest uppercase shadow-sm">
            Transparent Pricing
          </div>
          <h2 className="text-4xl md:text-6xl font-bold font-display text-foreground mb-6 tracking-tight">
            Invest in your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">Career</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your learning goals. Start for free and upgrade when you are ready to dominate.
          </p>
        </motion.div>

        {/* Billing Toggle with Heavy Animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-16"
        >
          <div className="bg-card border border-border rounded-full p-2 flex items-center shadow-lg relative cursor-pointer group">
            {/* Sliding Background */}
            <motion.div 
               className="absolute top-2 bottom-2 w-[120px] rounded-full bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.4)] z-0"
               animate={{ x: isYearly ? 120 : 0 }}
               transition={{ type: "spring", stiffness: 300, damping: 25 }}
            />
            
            <button
              onClick={() => setIsYearly(false)}
              className={`relative z-10 w-[120px] py-3 rounded-full font-bold transition-colors duration-300 ${
                !isYearly ? "text-white" : "text-muted-foreground group-hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`relative z-10 w-[120px] py-3 rounded-full font-bold transition-colors duration-300 ${
                isYearly ? "text-white" : "text-muted-foreground group-hover:text-foreground"
              }`}
            >
              Yearly
            </button>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: isYearly ? 1 : 0.5, scale: isYearly ? 1 : 0.9 }}
            className={`px-4 py-2 rounded-full font-bold text-sm transition-colors duration-300 ${isYearly ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.3)]" : "bg-muted text-muted-foreground"}`}
          >
            Save 17% built-in
          </motion.div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: index * 0.15, type: "spring", stiffness: 100 }}
              viewport={{ once: true }}
              className={`relative p-8 rounded-[2.5rem] flex flex-col transition-all duration-300 ${
                plan.popular 
                ? "bg-blue-600 outline outline-4 outline-blue-600/30 dark:outline-blue-500/20 scale-105 shadow-[0_20px_60px_rgba(37,99,235,0.3)] hover:shadow-[0_30px_70px_rgba(37,99,235,0.4)] hover:-translate-y-2 z-20" 
                : "bg-card border border-border text-foreground hover:shadow-2xl hover:border-blue-500/30 hover:-translate-y-2 z-10"
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-8 transform -translate-y-1/2">
                  <span className="bg-yellow-400 text-yellow-900 px-5 py-2 rounded-full text-xs font-black tracking-widest uppercase shadow-lg shadow-yellow-400/30">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-8 mt-2">
                <h3 className={`text-3xl font-black mb-4 ${plan.popular ? "text-white" : "text-foreground"}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm leading-relaxed h-12 ${plan.popular ? "text-blue-100" : "text-muted-foreground"}`}>
                  {plan.description}
                </p>
              </div>

              <div className="mb-8">
                <div className="flex flex-col">
                  <div className="flex items-baseline">
                    <span className={`text-6xl font-black tracking-tighter ${plan.popular ? "text-white drop-shadow-md" : "text-foreground"}`}>
                      ${plan.price[isYearly ? "yearly" : "monthly"]}
                    </span>
                    {plan.price[isYearly ? "yearly" : "monthly"] > 0 && (
                      <span className={`ml-2 text-lg font-medium ${plan.popular ? "text-blue-200" : "text-muted-foreground"}`}>
                        / {isYearly ? "year" : "month"}
                      </span>
                    )}
                  </div>
                  {isYearly && plan.price.monthly > 0 && (
                     <p className={`mt-2 text-sm font-semibold ${plan.popular ? "text-blue-200" : "text-green-600 dark:text-green-500"}`}>
                       Billed ${(plan.price.yearly).toFixed(2)} annually
                     </p>
                  )}
                </div>
              </div>

              <button
                onClick={onGetStarted}
                className={`w-full py-5 rounded-2xl font-bold text-lg transition-all duration-300 mb-10 transform hover:scale-105 active:scale-95 ${
                  plan.popular
                    ? "bg-white text-blue-700 shadow-xl hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:bg-blue-50"
                    : "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                }`}
              >
                {plan.name === "Free" ? "Get Started for Free" : "Start 14-Day Free Trial"}
              </button>

              <div className="flex-1 space-y-5">
                <p className={`font-bold text-sm tracking-wider uppercase ${plan.popular ? "text-blue-200" : "text-muted-foreground"}`}>
                  Included features:
                </p>
                <div className="space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start text-sm">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${plan.popular ? "bg-blue-500" : "bg-blue-100 dark:bg-blue-900/30"}`}>
                         <CheckIcon className={`w-4 h-4 ${plan.popular ? "text-white" : "text-blue-600 dark:text-blue-400"}`} />
                      </div>
                      <span className={`font-medium pt-0.5 ${plan.popular ? "text-white" : "text-foreground"}`}>{feature}</span>
                    </div>
                  ))}
                  {plan.limitations.map((limitation, limitationIndex) => (
                    <div key={limitationIndex} className="flex items-start text-sm opacity-60">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 bg-red-100/50 dark:bg-red-900/20`}>
                         <XMarkIcon className="w-4 h-4 text-red-500" />
                      </div>
                      <span className={`font-medium pt-0.5 ${plan.popular ? "text-blue-200" : "text-muted-foreground"}`}>{limitation}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
