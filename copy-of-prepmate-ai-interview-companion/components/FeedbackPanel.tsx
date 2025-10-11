import React from "react";
import type { FeedbackMetrics, Sentiment } from "../types";

interface FeedbackPanelProps {
  metrics: FeedbackMetrics;
}

const FillerWordBadge: React.FC<{ word: string; count: number }> = ({
  word,
  count,
}) => (
  <div className="bg-gradient-to-r from-red-600 to-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
    <span>{word}</span>
    <span className="bg-white bg-opacity-20 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
      {count}
    </span>
  </div>
);

const SentimentIndicator: React.FC<{ sentiment: Sentiment }> = ({
  sentiment,
}) => {
  const color =
    sentiment.label === "Positive"
      ? "text-green-400"
      : sentiment.label === "Negative"
      ? "text-red-400"
      : "text-yellow-400";
  const bgColor =
    sentiment.label === "Positive"
      ? "bg-green-400"
      : sentiment.label === "Negative"
      ? "bg-red-400"
      : "bg-yellow-400";
  const borderColor =
    sentiment.label === "Positive"
      ? "border-green-400"
      : sentiment.label === "Negative"
      ? "border-red-400"
      : "border-yellow-400";

  return (
    <div
      className={`flex items-center space-x-3 p-3 rounded-lg border ${borderColor} bg-gray-800 bg-opacity-50`}
    >
      <div className={`w-4 h-4 rounded-full ${bgColor} animate-pulse`}></div>
      <span className="text-gray-200 font-medium">{sentiment.label}</span>
      <span className={`font-mono text-sm ${color} font-bold`}>
        ({sentiment.score.toFixed(2)})
      </span>
    </div>
  );
};

const FeedbackPanel: React.FC<FeedbackPanelProps> = ({ metrics }) => {
  const sortedFillerWords = Array.from(metrics.fillerWords.entries()).sort(
    (a, b) => b[1] - a[1]
  );
  const lastSentiment =
    metrics.sentimentHistory[metrics.sentimentHistory.length - 1];

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-700 backdrop-blur-sm rounded-xl p-4 space-y-4 w-full h-full shadow-xl border border-gray-600">
      <div className="text-center mb-3">
        <h2 className="text-lg font-bold text-cyan-400 mb-1">
          Interview Feedback
        </h2>
        <p className="text-xs text-gray-400">Real-time metrics</p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-200 mb-2 flex items-center gap-2">
          <svg
            className="w-4 h-4 text-cyan-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
          Pace
        </h3>
        <div className="relative h-8 w-full bg-gray-700 rounded-lg overflow-hidden border border-gray-600 shadow-inner">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-cyan-600 transition-all duration-700 ease-out shadow-lg"
            style={{ width: `${Math.min(100, (metrics.pace / 180) * 100)}%` }}
          ></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-bold text-sm drop-shadow-md">
              {metrics.pace} WPM
            </span>
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Slow</span>
          <span className="text-cyan-400 font-medium">140-160</span>
          <span>Fast</span>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-200 mb-2 flex items-center gap-2">
          <svg
            className="w-4 h-4 text-red-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
          Filler Words
        </h3>
        <div className="h-20 overflow-y-auto p-2 rounded-lg bg-gray-900 bg-opacity-40 border border-gray-600">
          {sortedFillerWords.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {sortedFillerWords.map(([word, count]) => (
                <FillerWordBadge key={word} word={word} count={count} />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 h-full flex flex-col items-center justify-center">
              <svg
                className="w-6 h-6 mb-1 text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-xs font-medium">No filler words</p>
              <p className="text-xs">Great job!</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-200 mb-2 flex items-center gap-2">
          <svg
            className="w-4 h-4 text-yellow-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
              clipRule="evenodd"
            />
          </svg>
          Sentiment
        </h3>
        {lastSentiment ? (
          <SentimentIndicator sentiment={lastSentiment} />
        ) : (
          <div className="text-center text-gray-400 p-3 bg-gray-800 bg-opacity-50 rounded-lg border border-gray-600">
            <svg
              className="w-6 h-6 mx-auto mb-1 text-gray-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-xs">Awaiting response</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackPanel;
