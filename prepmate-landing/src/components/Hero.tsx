import React from "react";
import { motion } from "framer-motion";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

interface HeroProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

const Hero: React.FC<HeroProps> = ({ onGetStarted, onSignIn }) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Intense Animated Blue Theme Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[70%] rounded-full bg-blue-500/20 dark:bg-blue-600/30 mix-blend-normal filter blur-[120px] animate-blob-orbit"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[70%] rounded-full bg-indigo-500/10 dark:bg-indigo-600/20 mix-blend-normal filter blur-[120px] animate-blob-orbit" style={{ animationDelay: '-7.5s' }}></div>
        <div className="absolute top-[30%] left-[20%] w-[40%] h-[40%] rounded-full bg-cyan-400/10 dark:bg-cyan-500/10 mix-blend-normal filter blur-[90px] animate-pulse-glow"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        {/* Left Content */}
        <div className="text-left space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800/50 shadow-sm"
          >
            <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mr-2 animate-pulse"></span>
            <span className="text-blue-700 dark:text-blue-300 text-xs font-bold tracking-wide uppercase">Meet PrepMate 2.0</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-7xl font-bold font-display text-foreground tracking-tight leading-[1.1] drop-shadow-sm"
          >
            Own the interview.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-400">
              Own your future.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed"
          >
            The ultimate ecosystem to master coding, shatter communication anxiety, and connect with top-tier talent. Engineered for the ambitious.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row gap-4 pt-6"
          >
            <button
              onClick={onGetStarted}
              className="group relative bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-2xl flex items-center justify-center overflow-hidden transition-all duration-300 shadow-[0_0_40px_rgba(37,99,235,0.3)] hover:shadow-[0_0_60px_rgba(37,99,235,0.5)] transform hover:-translate-y-1"
            >
              <div className="absolute inset-0 w-full h-full animate-shimmer opacity-20 pointer-events-none"></div>
              <span className="relative z-10 flex items-center">
                Start your journey
                <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            <button
              onClick={onSignIn}
              className="bg-background/80 backdrop-blur-md text-foreground border-2 border-border hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all duration-300 font-semibold px-8 py-4 rounded-2xl flex items-center justify-center transform hover:-translate-y-1"
            >
              See how it works
            </button>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="pt-10 flex items-center gap-6"
          >
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <img
                  key={i}
                  className="w-12 h-12 rounded-full border-4 border-background object-cover shadow-sm transition-transform hover:scale-110 hover:z-10 cursor-pointer"
                  src={`https://i.pravatar.cc/100?img=${i + 12}`}
                  alt="User"
                />
              ))}
            </div>
            <div>
              <p className="text-foreground font-bold flex items-center gap-2">
                <span className="flex text-yellow-400">★★★★★</span>
              </p>
              <p className="text-sm font-medium text-muted-foreground mt-0.5">
                Loved by 10,000+ engineers
              </p>
            </div>
          </motion.div>
        </div>

        {/* Right Content - Hero Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative lg:h-[650px] flex items-center justify-center perspective-[2000px]"
        >
          {/* Glassmorphic pedestal/backdrop */}
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 to-indigo-600/5 rounded-[3rem] -z-10 backdrop-blur-3xl border border-white/10 dark:border-white/5 transform-gpu rotate-[-2deg] scale-105 shadow-2xl"></div>
          
          <div className="relative w-full h-[500px] lg:h-full rounded-3xl overflow-hidden border border-border shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-muted animate-float flex items-center justify-center group">
            <img 
              src="/hero_blue.png" 
              alt="Student using PrepMate" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Interactive overlay element */}
            <div className="absolute bottom-8 right-8 bg-background/90 backdrop-blur-xl border border-border rounded-2xl p-4 shadow-xl transform transition-transform duration-500 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 hidden sm:flex items-center gap-4">
               <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                 <span className="text-xl">✅</span>
               </div>
               <div>
                 <p className="text-sm font-bold text-foreground">Interview Passed</p>
                 <p className="text-xs font-medium text-muted-foreground">Offer received: $120k</p>
               </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
