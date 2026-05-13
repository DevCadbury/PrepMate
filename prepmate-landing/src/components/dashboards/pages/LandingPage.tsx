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
import SimplifiedSignUpModal from "../../SimplifiedSignUpModal";

const LandingPage: React.FC = () => {
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

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
        {showSignIn && (
          <SignInModal
            key="signin-modal"
            onClose={() => setShowSignIn(false)}
            onSwitchToSignUp={() => setShowSignUp(true)}
          />
        )}
        {showSignUp && (
          <SimplifiedSignUpModal
            key="signup-modal"
            onClose={() => setShowSignUp(false)}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default LandingPage;
