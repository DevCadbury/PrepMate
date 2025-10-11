import React from "react";
import { Brain, Mic, MicOff } from "lucide-react";

interface SimpleAvatarProps {
  isSpeaking?: boolean;
  isListening?: boolean;
  className?: string;
}

const SimpleAvatar: React.FC<SimpleAvatarProps> = ({
  isSpeaking = false,
  isListening = false,
  className = "",
}) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative">
        {/* Main Avatar */}
        <div className="w-64 h-64 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center shadow-2xl relative">
          <Brain className="h-32 w-32 text-white" />

          {/* Status Indicator */}
          <div className="absolute bottom-4 right-4">
            <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Speaking Effect */}
        {isSpeaking && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 border-4 border-green-400 rounded-full animate-ping opacity-75"></div>
            <div className="absolute">
              <Mic className="h-8 w-8 text-green-400 animate-pulse" />
            </div>
          </div>
        )}

        {/* Listening Effect */}
        {isListening && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 border-4 border-red-400 rounded-full animate-ping opacity-75"></div>
            <div className="absolute">
              <MicOff className="h-8 w-8 text-red-400 animate-pulse" />
            </div>
          </div>
        )}

        {/* Breathing Animation */}
        <div className="absolute inset-0 w-64 h-64 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full opacity-20 animate-pulse"></div>
      </div>
    </div>
  );
};

export default SimpleAvatar;
