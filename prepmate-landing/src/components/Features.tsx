import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
      title: "AI Interview Module",
      description:
        "Step into a lifelike mock interview environment. Get instantaneous, actionable feedback to sharpen your delivery.",
      icon: ComputerDesktopIcon,
      image: "/feature_1_blue.png",
      colorTag: "bg-blue-500",
    },
    {
      id: 1,
      title: "Interactive Roadmap",
      description:
        "Visualize your journey. An elegant, glowing nodes-based roadmap designed to adapt directly to your learning speed.",
      icon: ChartBarIcon,
      image: "/feature_2_blue.png",
      colorTag: "bg-indigo-500",
    },
    {
      id: 2,
      title: "Coding Mastery",
      description:
        "Solve problems in a fast, robust editor. Built specifically to mimic top-tier technical assignments.",
      icon: DocumentCheckIcon,
      image: "/feature_3_blue.png",
      colorTag: "bg-cyan-500",
    },
    {
      id: 3,
      title: "Community Network",
      description:
        "Join a passionate network of like-minded candidates. Discuss patterns, share offers, and find mock partners.",
      icon: UserGroupIcon,
      image: "/feature_4_blue.png",
      colorTag: "bg-sky-500",
    },
    {
      id: 4,
      title: "HR Analytics",
      description:
        "Deep performance metrics built for educators and HR. Predict candidate success with stunning visualization.",
      icon: CogIcon,
      image: "/feature_5_blue.png",
      colorTag: "bg-blue-600",
    },
  ];

  return (
    <section id="features" className="py-32 bg-background relative border-b border-border">
      {/* Background Decorators */}
       <div className="absolute top-0 right-0 w-full h-[500px] bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-900/10 pointer-events-none -z-10"></div>
       
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-24"
        >
          <div className="inline-flex items-center px-4 py-2 mb-6 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-bold tracking-widest uppercase shadow-sm">
             The PrepMate Advantage
          </div>
          <h2 className="text-4xl md:text-6xl font-bold font-display text-foreground mb-6 tracking-tight">
            Tools built to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Accelerate</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Every feature is meticulously crafted to ensure you walk into your next interview with absolute clarity and undeniable confidence.
          </p>
        </motion.div>

        {/* Feature Bento Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch h-full">
          
          {/* Sidebar Navigation */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-4">
            {features.map((feature, index) => {
              const isActive = activeFeature === index;
              return (
                <motion.button
                  key={feature.id}
                  onClick={() => setActiveFeature(index)}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`w-full text-left px-6 py-6 rounded-3xl transition-all duration-300 relative group overflow-hidden ${
                    isActive
                      ? "bg-muted/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] ring-1 ring-border border-transparent"
                      : "bg-transparent border border-transparent hover:bg-muted/50"
                  }`}
                >
                  {/* Glow effect inside active button */}
                  {isActive && (
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-500/5 to-transparent pointer-events-none"></div>
                  )}
                  
                  <div className="flex items-start relative z-10">
                    <div className={`p-4 rounded-2xl mr-5 transition-colors duration-300 ${isActive ? `${feature.colorTag} text-white shadow-lg` : "bg-card text-muted-foreground border border-border group-hover:border-blue-500/30 group-hover:text-blue-500"}`}>
                      {React.createElement(feature.icon, {
                        className: "w-6 h-6",
                      })}
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold mb-2 transition-colors duration-300 ${isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                        {feature.title}
                      </h3>
                      <AnimatePresence>
                        {isActive && (
                          <motion.p
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: "auto", marginTop: 8 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            className="text-muted-foreground text-sm leading-relaxed overflow-hidden"
                          >
                            {feature.description}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>

          {/* Dynamic Image Display with Framer Motion Layout */}
          <div className="lg:col-span-7 flex justify-center items-center h-full min-h-[500px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={`mockup-${activeFeature}`}
                initial={{ opacity: 0, y: 40, scale: 0.95, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -40, scale: 0.95, filter: "blur(10px)" }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full h-[400px] md:h-[600px] xl:h-[700px] rounded-[3rem] overflow-hidden bg-card border border-border shadow-[0_20px_60px_rgba(37,99,235,0.1)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex items-center justify-center p-2 group"
              >
                 {/* Internal Animated Glow */}
                 <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-indigo-500/10 pointer-events-none group-hover:opacity-100 opacity-50 transition-opacity duration-500"></div>
                 
                 <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden bg-muted/20">
                   <img 
                     src={features[activeFeature].image} 
                     alt={features[activeFeature].title} 
                     className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-[1.03]" 
                   />
                 </div>
                 
                 {/* Floating floating badge based on active feature */}
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="absolute top-8 right-8 bg-background/80 backdrop-blur-xl border border-border px-4 py-2 rounded-xl shadow-lg flex items-center gap-2"
                  >
                     <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                     <span className="text-xs font-bold text-foreground">Active Module</span>
                  </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
