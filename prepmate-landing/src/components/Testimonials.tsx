import React from "react";
import { motion } from "framer-motion";
import { StarIcon } from "@heroicons/react/24/solid";

const Testimonials: React.FC = () => {
  const testimonials = [
    {
      id: 1,
      name: "Sarah Chen",
      role: "Software Engineer at Google",
      avatar: "👩‍💻",
      quote:
        "PrepMate's AI mock interviews helped me build confidence and improve my communication skills. The personalized feedback was incredibly valuable.",
      rating: 5,
      company: "Google",
    },
    {
      id: 2,
      name: "Alex Rodriguez",
      role: "Computer Science Student",
      avatar: "👨‍🎓",
      quote:
        "The coding practice section with company-specific questions is gold! I landed my dream job at Microsoft thanks to PrepMate.",
      rating: 5,
      company: "Microsoft",
    },
    {
      id: 3,
      name: "Priya Patel",
      role: "HR Manager",
      avatar: "👩‍💼",
      quote:
        "As an HR professional, I can see the quality of candidates who use PrepMate. The platform produces well-prepared, confident candidates.",
      rating: 5,
      company: "TechCorp",
    },
    {
      id: 4,
      name: "David Kim",
      role: "Full Stack Developer",
      avatar: "👨‍💻",
      quote:
        "The roadmap feature kept me on track and motivated. I went from knowing basic arrays to solving complex DSA problems in 3 months.",
      rating: 5,
      company: "Amazon",
    },
    {
      id: 5,
      name: "Emma Wilson",
      role: "Career Coach",
      avatar: "👩‍🏫",
      quote:
        "I recommend PrepMate to all my clients. The comprehensive approach to interview preparation is unmatched in the market.",
      rating: 5,
      company: "CareerBoost",
    },
    {
      id: 6,
      name: "Michael Brown",
      role: "Recent Graduate",
      avatar: "👨‍🎓",
      quote:
        "The community aspect is amazing. I found study partners and mentors who helped me through the toughest interview prep challenges.",
      rating: 5,
      company: "Netflix",
    },
  ];

  const stats = [
    { number: "10,000+", label: "Active Learners" },
    { number: "40+", label: "Colleges" },
    { number: "95%", label: "Success Rate" },
    { number: "500+", label: "Companies" },
  ];

  return (
    <section className="py-20 bg-white">
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
            Trusted by <span className="gradient-text">Learners & HRs</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands of successful candidates and HR professionals who
            trust PrepMate for interview preparation and assessment.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16"
        >
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                {stat.number}
              </div>
              <div className="text-gray-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="card p-6 hover:shadow-xl transition-shadow duration-300"
            >
              {/* Rating */}
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <StarIcon key={i} className="w-5 h-5 text-yellow-400" />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-gray-700 mb-6 italic">
                "{testimonial.quote}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center">
                <div className="text-3xl mr-4">{testimonial.avatar}</div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {testimonial.role}
                  </div>
                  <div className="text-xs text-primary-600 font-medium">
                    {testimonial.company}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl p-8 md:p-12">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Join the PrepMate Community
            </h3>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              "Used by learners from over 40 colleges" • "Trusted by HRs and
              Educators"
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                ISO 27001 Certified
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                GDPR Compliant
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                SOC 2 Type II
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                24/7 Support
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
