export enum MessageAuthor {
  USER = "user",
  AI = "ai",
}

export interface Message {
  author: MessageAuthor;
  text: string;
  sentiment?: Sentiment;
}

export interface FeedbackMetrics {
  pace: number; // words per minute
  fillerWords: Map<string, number>;
  sentimentHistory: Sentiment[];
}

export enum InterviewState {
  IDLE = "idle",
  STARTING = "starting",
  LISTENING = "listening",
  THINKING = "thinking",
  SPEAKING = "speaking",
  ENDED = "ended",
}

export interface Sentiment {
  score: number; // e.g., -1 to 1
  label: "Positive" | "Neutral" | "Negative";
}

export const FILLER_WORDS = [
  "ah",
  "uh",
  "um",
  "er",
  "like",
  "so",
  "you know",
  "actually",
  "basically",
  "seriously",
  "literally",
  "i mean",
  "right",
];
