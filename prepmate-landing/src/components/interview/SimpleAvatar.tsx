import React from "react";
import { InterviewState } from "../../types/interview";

interface SimpleAvatarProps {
  interviewState: InterviewState;
}

const SimpleAvatar: React.FC<SimpleAvatarProps> = ({ interviewState }) => {
  const getStatusInfo = (): { text: string; color: string } => {
    switch (interviewState) {
      case InterviewState.LISTENING:
        return { text: "Listening...", color: "text-green-400" };
      case InterviewState.THINKING:
        return { text: "Thinking...", color: "text-yellow-400" };
      case InterviewState.SPEAKING:
        return { text: "Speaking...", color: "text-cyan-400" };
      case InterviewState.STARTING:
        return { text: "Getting ready...", color: "text-gray-400" };
      default:
        return { text: "Ready to start", color: "text-gray-500" };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* Avatar Circle */}
      <div className="relative">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-2xl border-4 border-cyan-300">
          <div className="text-4xl font-bold text-white">AI</div>
        </div>

        {/* Status Indicator */}
        <div className="absolute -bottom-2 -right-2">
          <div
            className={`w-8 h-8 rounded-full bg-gray-800 border-2 border-cyan-400 flex items-center justify-center`}
          >
            {interviewState === InterviewState.LISTENING && (
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            )}
            {interviewState === InterviewState.THINKING && (
              <div className="w-4 h-4 border-2 border-t-transparent border-yellow-400 rounded-full animate-spin"></div>
            )}
            {interviewState === InterviewState.SPEAKING && (
              <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
            )}
            {interviewState === InterviewState.STARTING && (
              <div className="w-3 h-3 bg-gray-400 rounded-full animate-pulse"></div>
            )}
            {interviewState === InterviewState.IDLE && (
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            )}
          </div>
        </div>
      </div>

      {/* Status Text */}
      <div className="text-center">
        <p className={`text-lg font-semibold ${statusInfo.color}`}>
          {statusInfo.text}
        </p>
        <p className="text-sm text-gray-400 mt-1">AI Interviewer</p>
      </div>

      {/* Decorative Elements */}
      <div className="flex space-x-2">
        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
        <div
          className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
          style={{ animationDelay: "0.1s" }}
        ></div>
        <div
          className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
          style={{ animationDelay: "0.2s" }}
        ></div>
      </div>
    </div>
  );
};

export default SimpleAvatar;
