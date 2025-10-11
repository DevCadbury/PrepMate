
import React, { useState, useEffect } from 'react';
import type { Message, FeedbackMetrics } from '../types';

interface PostInterviewReportProps {
  metrics: FeedbackMetrics;
  conversation: Message[];
  summary: string;
  onRestart: () => void;
}

const PostInterviewReport: React.FC<PostInterviewReportProps> = ({ metrics, conversation, summary, onRestart }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  const totalFillerWords = Array.from(metrics.fillerWords.values()).reduce((sum: number, count: number) => sum + count, 0);
  const averageSentiment = metrics.sentimentHistory.length > 0 ? metrics.sentimentHistory.reduce((sum, s) => sum + s.score, 0) / metrics.sentimentHistory.length : 0;
  
  const getSentimentLabel = (score: number): 'Positive' | 'Negative' | 'Neutral' => {
    if (score > 0.2) return 'Positive';
    if (score < -0.2) return 'Negative';
    return 'Neutral';
  };

  const processedSummary = summary
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br />');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4 transition-opacity duration-300">
      <div className={`bg-gray-800 rounded-lg p-8 max-w-4xl w-full h-full max-h-[90vh] flex flex-col shadow-2xl transform transition-all duration-500 ease-out ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <div className="flex justify-between items-start mb-4 flex-shrink-0">
            <h2 className="text-3xl font-bold text-cyan-400">Interview Report</h2>
            <button
              onClick={onRestart}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
            >
              Try Again
            </button>
        </div>
        
        <div className="flex-grow overflow-y-auto pr-2 -mr-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gray-700 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-400">Avg. Pace</p>
                    <p className="text-2xl font-bold text-white">{metrics.pace > 0 ? metrics.pace.toFixed(0) : 'N/A'} WPM</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-400">Total Filler Words</p>
                    <p className="text-2xl font-bold text-white">{totalFillerWords}</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-400">Avg. Sentiment</p>
                    <p className="text-2xl font-bold text-white">{getSentimentLabel(averageSentiment)}</p>
                </div>
            </div>

            <div className="bg-gray-900 bg-opacity-50 p-6 rounded-lg mb-6">
                <h3 className="text-xl font-semibold mb-3 text-cyan-300">AI Summary & Feedback</h3>
                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: processedSummary }}></div>
            </div>

            <div className="bg-gray-900 bg-opacity-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-cyan-300">Full Transcript</h3>
                <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
                    {conversation.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.author === 'user' ? 'justify-end' : 'justify-start'}`}>
                             {msg.author === 'ai' && <div className="w-8 h-8 rounded-full bg-cyan-800 flex-shrink-0 flex items-center justify-center font-bold text-sm">AI</div>}
                            <div className={`p-3 rounded-lg max-w-lg ${msg.author === 'user' ? 'bg-cyan-700' : 'bg-gray-600'}`}>
                                <p>{msg.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PostInterviewReport;
