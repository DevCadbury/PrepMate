import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

const Footer: React.FC = () => {
  const [email, setEmail] = useState("");

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Newsletter signup:", email);
    setEmail("");
  };

  const footerLinks = {
    product: [
      { name: "Features", href: "#features" },
      { name: "Pricing", href: "#pricing" },
      { name: "Mock Interviews", href: "#" },
      { name: "Coding Practice", href: "#" },
      { name: "HR Analytics", href: "#" },
    ],
    company: [
      { name: "About Us", href: "#" },
      { name: "Careers", href: "#" },
      { name: "Press Kit", href: "#" },
      { name: "Contact", href: "#" },
    ],
    legal: [
      { name: "Privacy Policy", href: "#" },
      { name: "Terms of Service", href: "#" },
      { name: "Cookie Policy", href: "#" },
    ],
  };

  const socialLinks = [
    { name: "LinkedIn", href: "#", icon: "💼" },
    { name: "Twitter", href: "#", icon: "🐦" },
    { name: "GitHub", href: "#", icon: "🐙" },
  ];

  return (
    <footer className="bg-background text-foreground relative z-10 pt-20">
      
      {/* Massive CTA Block */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 relative">
        <div className="bg-blue-600 rounded-[3rem] px-8 py-20 text-center relative overflow-hidden shadow-[0_30px_60px_rgba(37,99,235,0.3)]">
          {/* CTA Animated Background */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-50%] left-[-20%] w-[100%] h-[200%] bg-blue-500 rounded-full mix-blend-screen filter blur-[100px] animate-blob-orbit"></div>
            <div className="absolute top-0 right-[-20%] w-[80%] h-[150%] bg-cyan-400/50 rounded-full mix-blend-screen filter blur-[100px] animate-blob-orbit" style={{ animationDelay: '-5s' }}></div>
          </div>
          
          <div className="relative z-10 max-w-3xl mx-auto">
             <motion.h2 
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8 }}
               className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight leading-tight"
             >
               Ready to crush your next interview?
             </motion.h2>
             <motion.p 
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, delay: 0.1 }}
               className="text-xl text-blue-100 mb-10"
             >
               Join 10,000+ candidates who have already unlocked their dream careers with PrepMate.
             </motion.p>
             <motion.div
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, delay: 0.2 }}
               className="flex flex-col sm:flex-row gap-4 justify-center"
             >
               <button className="bg-white text-blue-600 hover:bg-blue-50 font-black px-10 py-5 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl text-lg">
                 Start for Free
               </button>
               <button className="bg-blue-700 text-white border border-blue-500 hover:bg-blue-800 font-bold px-10 py-5 rounded-2xl transition-all duration-300 text-lg">
                 Request Demo
               </button>
             </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-border">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand Section */}
          <div className="lg:col-span-2 pr-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                 <span className="text-white font-bold text-xl leading-none">P</span>
              </div>
              <h3 className="text-3xl font-black font-display tracking-tight text-foreground">
                PrepMate
              </h3>
            </div>
            <p className="text-muted-foreground mb-8 text-lg">
              The ecosystem built to master coding, shatter communication anxiety, and connect with top-tier talent.
            </p>

            {/* Newsletter */}
            <form onSubmit={handleNewsletterSubmit} className="flex relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Subscribe to our newsletter"
                className="w-full px-5 py-4 rounded-xl bg-card border border-border focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 pr-32 text-foreground"
                required
              />
              <button
                type="submit"
                className="absolute right-2 top-2 bottom-2 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors duration-200"
              >
                Join
              </button>
            </form>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-lg font-black text-foreground mb-6 uppercase tracking-wider">Product</h4>
            <ul className="space-y-4">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-muted-foreground font-medium hover:text-blue-500 transition-colors duration-200">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-black text-foreground mb-6 uppercase tracking-wider">Company</h4>
            <ul className="space-y-4">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-muted-foreground font-medium hover:text-blue-500 transition-colors duration-200">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-black text-foreground mb-6 uppercase tracking-wider">Legal</h4>
            <ul className="space-y-4">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-muted-foreground font-medium hover:text-blue-500 transition-colors duration-200">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-muted-foreground font-medium mb-4 md:mb-0">
            © {new Date().getFullYear()} PrepMate. Designed for ambition.
          </div>

          {/* Social Links */}
          <div className="flex space-x-4">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.href}
                className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-xl text-muted-foreground hover:text-blue-500 hover:border-blue-500 hover:-translate-y-1 transition-all duration-300"
                aria-label={social.name}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
