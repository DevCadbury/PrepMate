import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import Navbar from "../../Navbar";
import Hero from "../../Hero";
import Features from "../../Features";
import Pricing from "../../Pricing";
import Testimonials from "../../Testimonials";
import Contact from "../../Contact";
import Footer from "../../Footer";
import SignInModal from "../../SignInModal";
import SignUpModal from "../../SignUpModal";
import { useToast, ToastContainer } from "../../ui/toast";

const LandingPage: React.FC = () => {
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const { toasts, removeToast } = useToast();

  const handleGetStarted = () => {
    setShowSignUp(true);
  };

  const handleSignIn = () => {
    setShowSignIn(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar onSignIn={handleSignIn} onGetStarted={handleGetStarted} />
      <Hero onGetStarted={handleGetStarted} onSignIn={handleSignIn} />
      <Features />
      <Pricing onGetStarted={handleGetStarted} />
      <Testimonials />
      <Contact />
      <Footer />

      <AnimatePresence>
        {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} />}
        {showSignUp && <SignUpModal onClose={() => setShowSignUp(false)} />}
      </AnimatePresence>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};

export default LandingPage;
