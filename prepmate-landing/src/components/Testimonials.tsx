import React from "react";
import { motion } from "framer-motion";

const Testimonials: React.FC = () => {
  const stats = [
    { value: "10,000+", label: "Active Learners" },
    { value: "40+", label: "Colleges" },
    { value: "95%", label: "Success Rate" },
    { value: "500+", label: "Companies" },
  ];

  const testimonials = [
    {
      content:
        "PrepMate's mock interviews helped me build confidence and improve my communication skills. The personalized feedback was incredibly valuable.",
      author: "Sarah Chen",
      role: "Software Engineer at Google",
      avatar: "👩‍💻",
    },
    {
      content:
        "The coding practice section with company-specific questions is gold! I landed my dream job at Microsoft thanks to PrepMate.",
      author: "Alex Rodriguez",
      role: "Computer Science Student",
      avatar: "👨‍🎓",
    },
    {
      content:
        "As an HR professional, I can see the quality of candidates who use PrepMate. The platform produces well-prepared, confident candidates.",
      author: "Priya Patel",
      role: "HR Manager",
      avatar: "👩‍💼",
    },
    {
      content:
        "The roadmap feature kept me on track and motivated. I went from knowing basic arrays to solving complex DSA problems in 3 months.",
      author: "David Kim",
      role: "Full Stack Developer",
      avatar: "👨‍💻",
    },
    {
      content:
        "I recommend PrepMate to all my clients. The comprehensive approach to interview preparation is unmatched in the market.",
      author: "Emma Wilson",
      role: "Career Coach",
      avatar: "👩‍🏫",
    },
    {
      content:
        "The community aspect is amazing. I found study partners and mentors who helped me through the toughest interview prep challenges.",
      author: "Michael Brown",
      role: "Recent Graduate",
      avatar: "👨‍🎓",
    },
  ];

  // Duplicate for infinite marquee effect
  const marqueeItems = [...testimonials, ...testimonials, ...testimonials];

  return (
    <section className="py-32 bg-background relative overflow-hidden border-b border-border">
      {/* Dynamic Background Geometry */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[30%] left-[10%] w-[600px] h-[600px] rounded-[40%] bg-blue-600/5 rotate-45 animate-blob-orbit"></div>
        <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] rounded-[30%] bg-indigo-500/5 rotate-[-45deg] animate-blob-orbit" style={{ animationDelay: '-5s' }}></div>
      </div>

      <div className="relative z-10 w-full">
        {/* Header content... */}
        <div className="text-center mb-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="inline-flex items-center px-4 py-2 mb-6 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/50 text-blue-600 dark:text-blue-400 text-sm font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(37,99,235,0.1)]"
          >
            The Community
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold font-display text-foreground mb-6 tracking-tight"
          >
            Loved by ambitious <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">engineers & recruiters</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-muted-foreground"
          >
            Don't just take our word for it. Join thousands of candidates dominating their interviews.
          </motion.p>
        </div>

        {/* Stats Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-32">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-card border border-border shadow-[0_30px_60px_rgba(0,0,0,0.05)] dark:shadow-[0_30px_60px_rgba(0,0,0,0.4)] rounded-[3rem] p-8 md:p-12 relative overflow-hidden backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 pointer-events-none"></div>
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1, type: "spring", stiffness: 100 }}
                viewport={{ once: true }}
                className="text-center relative z-10 p-4 rounded-2xl hover:bg-muted/50 transition-colors duration-300 group cursor-default"
              >
                <div className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-foreground to-muted-foreground mb-4 tracking-tighter group-hover:from-blue-600 group-hover:to-indigo-500 transition-all duration-500">
                  {stat.value}
                </div>
                <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest group-hover:text-foreground transition-colors duration-300">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Infinite Marquee */}
        <div className="relative flex overflow-x-hidden group">
          {/* Edge fades */}
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"></div>
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"></div>
          
          <motion.div
            className="flex gap-6 py-10 whitespace-nowrap"
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              repeat: Infinity,
              ease: "linear",
              duration: 40,
            }}
          >
            {marqueeItems.map((testimonial, index) => (
              <div
                key={index}
                className="w-[450px] flex-shrink-0 bg-card border border-border rounded-[2.5rem] p-10 flex flex-col hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(37,99,235,0.15)] dark:hover:shadow-[0_20px_60px_rgba(37,99,235,0.1)] hover:border-blue-500/30 transition-all duration-500 group/card whitespace-normal"
              >
                <div className="mb-6">
                  {/* Stars */}
                  <div className="flex gap-1.5 mb-6 text-blue-500">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-foreground text-lg leading-relaxed font-medium">"{testimonial.content}"</p>
                </div>
                <div className="mt-auto pt-8 flex items-center">
                  <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-3xl mr-5 border border-blue-100 dark:border-blue-800/50 group-hover/card:scale-110 transition-transform duration-500 shadow-sm">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-foreground text-lg tracking-tight">
                      {testimonial.author}
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400 font-bold mt-1">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
