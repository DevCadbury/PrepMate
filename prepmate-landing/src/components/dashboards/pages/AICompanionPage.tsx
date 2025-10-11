import React, { useState, useEffect, useRef, useCallback } from "react";
import { Chat } from "@google/genai";
import { FILLER_WORDS } from "../../../types/interview";
import {
  InterviewState,
  MessageAuthor,
  type Message,
  type FeedbackMetrics,
  type Sentiment,
} from "../../../types/interview";
import {
  createInterviewChat,
  getNextChatResponse,
  analyzeSentiment,
  getInterviewSummary,
} from "../../../services/interviewService";
import PostInterviewReport from "../../interview/PostInterviewReport";
import ConversationView from "../../interview/ConversationView";
import FeedbackPanel from "../../interview/FeedbackPanel";
import SimpleAvatar from "../../interview/SimpleAvatar";
import WebGLAvatar from "../../interview/WebGLAvatar";
import SetupScreen from "../../interview/SetupScreen";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import {
  Settings,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Monitor,
  User,
} from "lucide-react";

const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const AICompanionPage: React.FC<{ user: any }> = ({ user }) => {
  const [interviewState, setInterviewState] = useState<InterviewState>(
    InterviewState.IDLE
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [feedbackMetrics, setFeedbackMetrics] = useState<FeedbackMetrics>({
    pace: 0,
    fillerWords: new Map(),
    sentimentHistory: [],
  });
  const [interimTranscript, setInterimTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string>("");
  const [postInterviewSummary, setPostInterviewSummary] = useState("");
  const [userName, setUserName] = useState<string>("");
  const [jobRole, setJobRole] = useState<string>("");
  const [geminiApiKey, setGeminiApiKey] = useState<string>("");
  const [availableVoices, setAvailableVoices] = useState<
    SpeechSynthesisVoice[]
  >([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | null>(null);
  const [useWebGLAvatar, setUseWebGLAvatar] = useState(true);

  const chatRef = useRef<Chat | null>(null);
  const recognitionRef = useRef<any | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const userSpeechStartTime = useRef<number | null>(null);
  const speechDebounceTimer = useRef<number | null>(null);

  const interviewStateRef = useRef(interviewState);
  useEffect(() => {
    interviewStateRef.current = interviewState;
  }, [interviewState]);

  useEffect(() => {
    const populateVoiceList = () => {
      if (typeof window.speechSynthesis === "undefined") return;
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return;

      const englishVoices = voices
        .filter((v) => v.lang.startsWith("en"))
        .sort((a, b) => a.name.localeCompare(b.name));
      setAvailableVoices(englishVoices);

      setSelectedVoiceURI((currentURI) => {
        if (currentURI || englishVoices.length === 0) return currentURI;
        const indianFemaleVoice = englishVoices.find(
          (v) => v.lang === "en-IN" && /female/i.test(v.name)
        );
        if (indianFemaleVoice) return indianFemaleVoice.voiceURI;
        const indianVoice = englishVoices.find((v) => v.lang === "en-IN");
        if (indianVoice) return indianVoice.voiceURI;
        const googleFemaleVoice = englishVoices.find(
          (v) => /google/i.test(v.name) && /female/i.test(v.name)
        );
        if (googleFemaleVoice) return googleFemaleVoice.voiceURI;
        const googleVoice = englishVoices.find((v) => /google/i.test(v.name));
        if (googleVoice) return googleVoice.voiceURI;
        return englishVoices[0].voiceURI;
      });
    };

    populateVoiceList();
    if (
      typeof window.speechSynthesis !== "undefined" &&
      window.speechSynthesis.onvoiceschanged !== undefined
    ) {
      window.speechSynthesis.onvoiceschanged = populateVoiceList;
    }
    return () => {
      if (typeof window.speechSynthesis !== "undefined") {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const resetState = useCallback(() => {
    if (speechDebounceTimer.current) clearTimeout(speechDebounceTimer.current);
    setInterviewState(InterviewState.IDLE);
    setMessages([]);
    setFeedbackMetrics({
      pace: 0,
      fillerWords: new Map(),
      sentimentHistory: [],
    });
    setInterimTranscript("");
    setFinalTranscript("");
    setPostInterviewSummary("");
    setUserName("");
    setJobRole("");
    setGeminiApiKey("");
    setUseWebGLAvatar(true);
    chatRef.current = null;
    if (recognitionRef.current) recognitionRef.current.stop();
    window.speechSynthesis.cancel();
  }, []);

  useEffect(() => {
    if (!SpeechRecognition) {
      setError(
        "Speech recognition is not supported by your browser. Please use Chrome or Edge."
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setInterviewState(InterviewState.LISTENING);
      userSpeechStartTime.current = Date.now();
    };

    recognition.onresult = (event: any) => {
      if (speechDebounceTimer.current)
        clearTimeout(speechDebounceTimer.current);
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setInterimTranscript(interim);
      if (final.trim()) {
        setFinalTranscript((prev) => (prev + " " + final).trim());
        speechDebounceTimer.current = window.setTimeout(() => {
          recognitionRef.current?.stop();
        }, 1500);
      }
    };

    recognition.onend = () => {
      if (speechDebounceTimer.current)
        clearTimeout(speechDebounceTimer.current);
      if (interviewStateRef.current === InterviewState.LISTENING) {
        setInterviewState(InterviewState.THINKING);
      }
    };
    recognitionRef.current = recognition;
    return () => {
      recognition.stop();
      if (speechDebounceTimer.current)
        clearTimeout(speechDebounceTimer.current);
    };
  }, []);

  const speak = useCallback(
    (text: string) => {
      setInterviewState(InterviewState.SPEAKING);
      const utterance = new SpeechSynthesisUtterance(text);
      const selectedVoice = availableVoices.find(
        (v) => v.voiceURI === selectedVoiceURI
      );
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
      } else {
        utterance.lang = "en-US";
      }
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.onend = () => {
        if (interviewStateRef.current === InterviewState.SPEAKING) {
          recognitionRef.current?.start();
        }
      };
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [availableVoices, selectedVoiceURI]
  );

  const handleStartInterview = useCallback(
    async (name: string, role: string, apiKey: string) => {
      setInterviewState(InterviewState.STARTING);
      setError("");
      setGeminiApiKey(apiKey);
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setUserName(name);
        setJobRole(role);
        chatRef.current = createInterviewChat(name, role, apiKey);

        const welcomeText = `Hello ${name}! I'm PrepMate. I'll be interviewing you for the ${role} position today. To start, could you please tell me a bit about yourself?`;

        setMessages([{ author: MessageAuthor.AI, text: welcomeText }]);
        speak(welcomeText);
      } catch (err) {
        setError(
          "Microphone access denied. Please enable it in your browser settings."
        );
        setInterviewState(InterviewState.IDLE);
      }
    },
    [speak]
  );

  const handleEndInterview = useCallback(async () => {
    if (speechDebounceTimer.current) clearTimeout(speechDebounceTimer.current);
    const previousState = interviewStateRef.current;
    setInterviewState(InterviewState.ENDED);

    if (
      recognitionRef.current &&
      (previousState === InterviewState.LISTENING ||
        previousState === InterviewState.THINKING)
    ) {
      recognitionRef.current.stop();
    }
    if (utteranceRef.current) window.speechSynthesis.cancel();

    const summary = await getInterviewSummary(userName, messages, geminiApiKey);
    setPostInterviewSummary(summary);
  }, [messages, userName, geminiApiKey]);

  useEffect(() => {
    const process = async () => {
      if (
        interviewState === InterviewState.THINKING &&
        finalTranscript.trim() &&
        chatRef.current
      ) {
        const userSpeech = finalTranscript.trim();
        setFinalTranscript("");
        setInterimTranscript("");

        const durationMinutes = userSpeechStartTime.current
          ? (Date.now() - userSpeechStartTime.current) / 60000
          : 0;
        const wordCount = userSpeech.split(/\s+/).length;
        const wpm =
          durationMinutes > 0 ? Math.round(wordCount / durationMinutes) : 0;

        const detectedFillers = new Map<string, number>();
        FILLER_WORDS.forEach((word) => {
          const regex = new RegExp(`\\b${word}\\b`, "gi");
          const matches = userSpeech.match(regex);
          if (matches) {
            detectedFillers.set(
              word,
              (feedbackMetrics.fillerWords.get(word) || 0) + matches.length
            );
          }
        });

        const newSentiment = await analyzeSentiment(userSpeech, geminiApiKey);

        setFeedbackMetrics((prev) => ({
          pace: wpm,
          fillerWords: new Map([...prev.fillerWords, ...detectedFillers]),
          sentimentHistory: [...prev.sentimentHistory, newSentiment],
        }));

        const userMessage: Message = {
          author: MessageAuthor.USER,
          text: userSpeech,
          sentiment: newSentiment,
        };
        setMessages((prev) => [...prev, userMessage]);

        const aiResponseText = await getNextChatResponse(
          chatRef.current,
          userSpeech
        );
        setMessages((prev) => [
          ...prev,
          { author: MessageAuthor.AI, text: aiResponseText },
        ]);
        speak(aiResponseText);
      }
    };
    process();
  }, [
    interviewState,
    finalTranscript,
    speak,
    feedbackMetrics.fillerWords,
    geminiApiKey,
  ]);

  if (error) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-red-900 text-white p-4">
        <h2 className="text-2xl font-bold mb-4">An Error Occurred</h2>
        <p>{error}</p>
        <Button onClick={resetState} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  if (interviewState === InterviewState.IDLE) {
    return <SetupScreen onStart={handleStartInterview} />;
  }

  if (interviewState === InterviewState.ENDED) {
    return (
      <PostInterviewReport
        conversation={messages}
        metrics={feedbackMetrics}
        summary={postInterviewSummary}
        onRestart={resetState}
      />
    );
  }

  return (
    <div className="h-screen w-full flex flex-col p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <header className="flex-shrink-0 flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-cyan-400">PrepMate</h1>
        <div className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-full hover:bg-gray-700 transition-colors duration-200"
          >
            <Settings className="w-6 h-6" />
          </button>
          {showSettings && (
            <div className="absolute right-0 mt-2 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 p-3">
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-2">
                    Avatar Type
                  </label>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUseWebGLAvatar(true)}
                      className={`flex-1 ${
                        useWebGLAvatar
                          ? "bg-cyan-600 hover:bg-cyan-700 text-white"
                          : "bg-gray-700 hover:bg-gray-600"
                      }`}
                    >
                      <Monitor className="w-4 h-4 mr-2" />
                      3D Avatar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUseWebGLAvatar(false)}
                      className={`flex-1 ${
                        !useWebGLAvatar
                          ? "bg-cyan-600 hover:bg-cyan-700 text-white"
                          : "bg-gray-700 hover:bg-gray-600"
                      }`}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Simple
                    </Button>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="voice-select"
                    className="text-sm text-gray-400 block mb-2"
                  >
                    Select AI Voice
                  </label>
                  {availableVoices.length > 0 ? (
                    <>
                      <select
                        id="voice-select"
                        value={selectedVoiceURI || ""}
                        onChange={(e) => setSelectedVoiceURI(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md py-1 px-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        {availableVoices.map((voice) => (
                          <option key={voice.voiceURI} value={voice.voiceURI}>
                            {`${voice.name} (${voice.lang})`}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-2">
                        Note: Voices are from your browser/OS. Install language
                        packs for more options.
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-500">
                      No voices available.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-grow flex gap-6 overflow-hidden">
        <div className="w-4/5 flex flex-col gap-4">
          <div className="flex-shrink-0 bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl p-4 flex flex-col items-center justify-center relative h-[500px] shadow-2xl border border-gray-600">
            {useWebGLAvatar ? (
              <WebGLAvatar interviewState={interviewState} />
            ) : (
              <SimpleAvatar interviewState={interviewState} />
            )}
            <div className="absolute bottom-4 flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setUseWebGLAvatar(true)}
                className={`p-2 rounded-full ${
                  useWebGLAvatar
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-gray-600 hover:bg-gray-500"
                }`}
              >
                <Monitor className="w-6 h-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setUseWebGLAvatar(false)}
                className={`p-2 rounded-full ${
                  !useWebGLAvatar
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-gray-600 hover:bg-gray-500"
                }`}
              >
                <User className="w-6 h-6" />
              </Button>
            </div>
          </div>
          <ConversationView
            messages={messages}
            interimTranscript={interimTranscript}
            isListening={interviewState === InterviewState.LISTENING}
          />
        </div>
        <div className="w-1/5 flex flex-col gap-4">
          <FeedbackPanel metrics={feedbackMetrics} />
          <div className="flex-shrink-0 flex items-center justify-center gap-4 bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-xl shadow-xl border border-gray-600">
            <Button
              onClick={handleEndInterview}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 disabled:bg-gray-500 shadow-lg hover:shadow-xl transform hover:scale-105"
              disabled={interviewState === InterviewState.STARTING}
            >
              <PhoneOff className="w-6 h-6" />
              <span>End Interview</span>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AICompanionPage;
