
import React, { useState, useEffect } from 'react';

interface OnboardingModalProps {
  onClose: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 transition-opacity duration-300">
      <div className={`bg-gray-800 rounded-lg p-8 max-w-2xl w-full mx-4 shadow-2xl transform transition-all duration-500 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <h2 className="text-3xl font-bold mb-4 text-cyan-400">Welcome to PrepMate!</h2>
        <p className="text-gray-300 mb-6">This is your personal AI Interview Companion. Here's how to get started:</p>
        <ul className="space-y-4 text-gray-300 mb-8">
          <li className="flex items-start">
            <span className="bg-cyan-500 rounded-full text-white text-sm w-6 h-6 flex items-center justify-center mr-3 mt-1 flex-shrink-0">1</span>
            <span><strong>Start the Interview:</strong> Click the "Start Interview" button to begin. The AI avatar will greet you and ask the first question.</span>
          </li>
          <li className="flex items-start">
            <span className="bg-cyan-500 rounded-full text-white text-sm w-6 h-6 flex items-center justify-center mr-3 mt-1 flex-shrink-0">2</span>
            <span><strong>Speak Naturally:</strong> When the indicator shows "Listening," simply speak your answer. There's no need to click anything.</span>
          </li>
          <li className="flex items-start">
            <span className="bg-cyan-500 rounded-full text-white text-sm w-6 h-6 flex items-center justify-center mr-3 mt-1 flex-shrink-0">3</span>
            <span><strong>Get Real-Time Feedback:</strong> Keep an eye on the right-hand panel for live feedback on your pace, filler word usage, and sentiment.</span>
          </li>
          <li className="flex items-start">
            <span className="bg-cyan-500 rounded-full text-white text-sm w-6 h-6 flex items-center justify-center mr-3 mt-1 flex-shrink-0">4</span>
            <span><strong>Review and Improve:</strong> When you're done, click "End Interview" to get a full report and actionable insights.</span>
          </li>
        </ul>
        <button
          onClick={onClose}
          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-75"
        >
          Let's Get Started
        </button>
      </div>
    </div>
  );
};

export default OnboardingModal;
