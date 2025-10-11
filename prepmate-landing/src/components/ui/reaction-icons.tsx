import React from "react";

interface ReactionIconProps {
  emoji: string;
  count: number;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export const ReactionIcon: React.FC<ReactionIconProps> = ({
  emoji,
  count,
  isActive = false,
  onClick,
  className = "",
}) => {
  const getEmojiSVG = (emoji: string) => {
    switch (emoji) {
      case "👍":
        return (
          <svg
            className={`w-4 h-4 ${
              isActive ? "text-yellow-500" : "text-gray-600"
            } transition-all duration-200 hover:scale-110`}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M14 9V5a3 3 0 0 0-6 0v4H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-2z" />
            <path d="M8 9V5a1 1 0 0 1 2 0v4H8z" />
          </svg>
        );
      case "❤️":
        return (
          <svg
            className={`w-4 h-4 ${
              isActive ? "text-red-500 animate-pulse" : "text-gray-600"
            } transition-all duration-200 hover:scale-110`}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        );
      case "😂":
        return (
          <svg
            className={`w-4 h-4 ${
              isActive ? "text-yellow-500" : "text-gray-600"
            } transition-all duration-200 hover:scale-110`}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        );
      case "😮":
        return (
          <svg
            className={`w-4 h-4 ${
              isActive ? "text-blue-500" : "text-gray-600"
            } transition-all duration-200 hover:scale-110`}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        );
      case "😢":
        return (
          <svg
            className={`w-4 h-4 ${
              isActive ? "text-blue-500" : "text-gray-600"
            } transition-all duration-200 hover:scale-110`}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9 10h.01" />
            <path d="M15 10h.01" />
            <path d="M9.5 15.5c.667.667 1.167 1 1.5 1s.833-.333 1.5-1" />
          </svg>
        );
      case "🔥":
        return (
          <svg
            className={`w-4 h-4 ${
              isActive ? "text-orange-500 animate-bounce" : "text-gray-600"
            } transition-all duration-200 hover:scale-110`}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        );
      default:
        return <span className="text-lg">{emoji}</span>;
    }
  };

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200 ${className}`}
    >
      {getEmojiSVG(emoji)}
      {count > 0 && (
        <span className="text-xs font-medium text-gray-700">{count}</span>
      )}
    </button>
  );
};

export const ReactionPicker: React.FC<{
  onReaction: (emoji: string) => void;
  isVisible: boolean;
  onClose: () => void;
}> = ({ onReaction, isVisible, onClose }) => {
  const reactions = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

  if (!isVisible) return null;

  return (
    <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50">
      <div className="flex space-x-1">
        {reactions.map((emoji) => (
          <button
            key={emoji}
            onClick={() => {
              onReaction(emoji);
              onClose();
            }}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <span className="text-lg">{emoji}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
