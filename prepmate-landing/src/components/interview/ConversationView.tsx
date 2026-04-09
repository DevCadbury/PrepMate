import React, { useRef, useEffect } from "react";
import type { Message } from "../../types/interview";
import { MessageAuthor } from "../../types/interview";

interface ConversationViewProps {
  messages: Message[];
  interimTranscript: string;
  isListening: boolean;
}

const ConversationView: React.FC<ConversationViewProps> = ({
  messages,
  interimTranscript,
  isListening,
}) => {
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, interimTranscript]);

  return (
    <div className="flex-1 bg-card p-4 rounded-xl overflow-y-auto h-48 scrollbar-thin scrollbar-thumb-muted scrollbar-track-background shadow-sm border border-border">
      <div className="space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-4">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-muted flex items-center justify-center">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-sm font-medium">Start your interview</p>
            <p className="text-xs">
              The AI interviewer will guide you through the process
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex items-end gap-2 animate-fade-in ${
              message.author === MessageAuthor.USER
                ? "justify-end"
                : "justify-start"
            }`}
          >
            {message.author === MessageAuthor.AI && (
              <div className="w-8 h-8 rounded-full flex-shrink-0 bg-ai-600 flex items-center justify-center font-bold text-white shadow-sm text-xs">
                AI
              </div>
            )}
            <div
              className={`max-w-xs p-3 rounded-lg shadow-sm ${
                message.author === MessageAuthor.USER
                  ? "bg-navy-600 text-white rounded-br-none"
                  : "bg-muted text-foreground border border-border rounded-bl-none"
              }`}
            >
              <p className="leading-relaxed text-sm">{message.text}</p>
            </div>
            {message.author === MessageAuthor.USER && (
              <div className="w-8 h-8 rounded-full flex-shrink-0 bg-navy-600 flex items-center justify-center font-bold text-white shadow-sm text-xs">
                You
              </div>
            )}
          </div>
        ))}

        {isListening && (
          <div className="flex items-end gap-2 justify-end animate-fade-in">
            <div className="max-w-xs p-3 rounded-lg bg-navy-600/80 text-white rounded-br-none shadow-sm">
              <div className="italic flex items-center gap-2 text-sm">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
                  <div
                    className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
                {interimTranscript || "Listening..."}
              </div>
            </div>
            <div className="w-8 h-8 rounded-full flex-shrink-0 bg-navy-600 flex items-center justify-center font-bold text-white shadow-sm text-xs">
              You
            </div>
          </div>
        )}
      </div>
      <div ref={endOfMessagesRef} />
    </div>
  );
};

export default ConversationView;
