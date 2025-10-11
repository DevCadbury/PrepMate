import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  PhoneOff,
  Brain,
  Sparkles,
  Settings,
  Volume2,
  VolumeX,
  AlertCircle,
  CheckCircle2,
  User,
  Briefcase,
  Play,
  Pause,
} from "lucide-react";
import GeminiService, { GeminiConfig } from "../../../services/geminiService";

interface LiveVideoCallProps {
  user: any;
  interviewType: string;
  onInterviewEnd: () => void;
  onFeedback: (feedback: string) => void;
}

const LiveVideoCall: React.FC<LiveVideoCallProps> = ({
  user,
  interviewType,
  onInterviewEnd,
  onFeedback,
}) => {
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isAIListening, setIsAIListening] = useState(false);
  const [isGeminiConnected, setIsGeminiConnected] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState("");
  const [geminiError, setGeminiError] = useState("");

  // Video streams
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isVirtualCameraActive, setIsVirtualCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");

  // Interview state
  const [candidateName, setCandidateName] = useState("");
  const [jobPosition, setJobPosition] = useState("");
  const [interviewProgress, setInterviewProgress] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [aiAvatarVisible, setAiAvatarVisible] = useState(false);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const geminiServiceRef = useRef<GeminiService | null>(null);

  // Interview questions
  const interviewQuestions = {
    hr: [
      "Tell me about yourself and your background.",
      "Why are you interested in this position?",
      "What are your strengths and weaknesses?",
      "Where do you see yourself in 5 years?",
      "Why should we hire you?",
    ],
    technical: [
      "Explain the difference between REST and GraphQL.",
      "What is the time complexity of binary search?",
      "How would you handle a production bug?",
      "Explain the concept of microservices.",
      "What is the difference between SQL and NoSQL?",
    ],
    behavioral: [
      "Describe a challenging project you worked on.",
      "Tell me about a time you had to resolve a conflict.",
      "How do you handle tight deadlines?",
      "Describe a situation where you had to learn something quickly.",
      "Tell me about a time you failed and what you learned.",
    ],
  };

  // Initialize Gemini service
  const initializeGemini = useCallback(async () => {
    try {
      setGeminiStatus("Initializing Gemini AI...");

      const apiKey =
        process.env.REACT_APP_GEMINI_API_KEY ||
        localStorage.getItem("gemini_api_key") ||
        "demo_key"; // Fallback for demo

      const config: GeminiConfig = {
        apiKey,
        model: "gemini-2.5-flash-preview-native-audio-dialog",
        voiceName: "Orus",
        languageCode: "en-US",
      };

      geminiServiceRef.current = new GeminiService(config);

      // Set up callbacks for UI updates
      geminiServiceRef.current.setCallbacks({
        onSpeechStart: () => {
          console.log("AI started speaking");
          setIsAISpeaking(true);
        },
        onSpeechEnd: () => {
          console.log("AI finished speaking");
          setIsAISpeaking(false);
        },
        onListeningStart: () => {
          console.log("AI started listening");
          setIsAIListening(true);
        },
        onListeningEnd: () => {
          console.log("AI finished listening");
          setIsAIListening(false);
        },
      });

      await geminiServiceRef.current.initSession();

      setIsGeminiConnected(true);
      setGeminiStatus("Gemini AI connected successfully");
      setGeminiError("");
    } catch (error) {
      console.error("Error initializing Gemini:", error);
      setGeminiError(
        `Failed to initialize Gemini: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setIsGeminiConnected(false);
    }
  }, []);

  // Initialize local video stream
  const initializeLocalStream = useCallback(async () => {
    try {
      console.log("Requesting camera and microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      console.log("Camera and microphone access granted");
      setLocalStream(stream);
      setCameraError("");

      // Ensure video element is properly set
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch((e) => {
          console.error("Error playing video:", e);
        });
      }
    } catch (error) {
      console.error("Error accessing media devices:", error);
      setCameraError(
        "Camera access denied. Please allow camera and microphone permissions."
      );
    }
  }, []);

  useEffect(() => {
    if (isInCall) {
      initializeLocalStream();
      initializeGemini();
    }

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (geminiServiceRef.current) {
        geminiServiceRef.current.destroy();
      }
    };
  }, [isInCall, initializeGemini, initializeLocalStream]);

  const startInterview = async () => {
    console.log("Starting interview...");
    setIsInCall(true);
    setInterviewProgress(0);
    setScore(0);
    setFeedback("");
    setIsInterviewStarted(false);
    setAiAvatarVisible(false);
    setCameraError("");

    // Simulate virtual camera activation
    setTimeout(() => {
      setIsVirtualCameraActive(true);
      setAiAvatarVisible(true);
    }, 2000);

    // Start the interactive interview
    if (geminiServiceRef.current && isGeminiConnected) {
      try {
        // Wait a bit for the avatar to appear
        await new Promise((resolve) => setTimeout(resolve, 3000));

        await geminiServiceRef.current.startInterview();
        setIsInterviewStarted(true);
        await conductInterview();
      } catch (error) {
        console.error("Error starting interview:", error);
        setGeminiError("Failed to start interview. Please try again.");
      }
    }
  };

  const conductInterview = async () => {
    if (!geminiServiceRef.current) return;

    const questions =
      interviewQuestions[interviewType as keyof typeof interviewQuestions];

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      setCurrentQuestion(question);
      setInterviewProgress(i + 1);

      try {
        // Ask question and get response
        const answer = await geminiServiceRef.current.askQuestion(question);
        setUserAnswer(answer);

        // Provide feedback
        const feedback = await geminiServiceRef.current.provideFeedback(
          answer,
          question
        );
        setFeedback(feedback);
        onFeedback(feedback);

        // Wait a bit before next question
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error("Error during interview question:", error);
        setFeedback(
          "I didn't catch that. Could you please repeat your answer?"
        );
      }
    }

    // Interview completed
    setInterviewProgress(questions.length);
    setCurrentQuestion("Interview completed! Great job!");
    setScore(Math.floor(Math.random() * 30) + 70);

    if (geminiServiceRef.current) {
      await geminiServiceRef.current.speak(
        "Thank you for completing the interview. You've done well!"
      );
    }
  };

  const endInterview = () => {
    setIsInCall(false);
    setInterviewProgress(0);
    setCurrentQuestion("");
    setUserAnswer("");
    setIsAISpeaking(false);
    setIsAIListening(false);
    setIsVirtualCameraActive(false);
    setIsGeminiConnected(false);
    setGeminiStatus("");
    setGeminiError("");
    setIsInterviewStarted(false);
    setCandidateName("");
    setJobPosition("");
    setAiAvatarVisible(false);
    setCameraError("");

    if (geminiServiceRef.current) {
      geminiServiceRef.current.stopRecording();
      geminiServiceRef.current.destroy();
      geminiServiceRef.current = null;
    }

    onInterviewEnd();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
  };

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn);
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  // AI Avatar Component
  const AIAvatar = () => (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="relative">
        {/* AI Avatar Circle */}
        <div className="w-48 h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
          <div className="w-40 h-40 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <div className="w-32 h-32 bg-white/30 rounded-full flex items-center justify-center">
              <div className="w-24 h-24 bg-white/50 rounded-full flex items-center justify-center">
                <Brain className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Speaking Animation */}
        {isAISpeaking && (
          <div className="absolute -top-4 -right-4 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
            <Volume2 className="w-4 h-4 text-white" />
          </div>
        )}

        {/* Listening Animation */}
        {isAIListening && (
          <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center animate-pulse">
            <Mic className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Left Panel - AI Interview Assistant */}
      <div className="w-80 bg-blue-900 p-6 text-white">
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">AI Interview Assistant</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span>
                Question {interviewProgress} of{" "}
                {interviewQuestions[
                  interviewType as keyof typeof interviewQuestions
                ]?.length || 0}
              </span>
            </div>
            {isVirtualCameraActive && (
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span>Virtual Camera Active</span>
              </div>
            )}
            {isGeminiConnected && (
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span>Gemini AI connected successfully</span>
              </div>
            )}
            {isAISpeaking && (
              <div className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-blue-400 animate-pulse" />
                <span>AI Speaking...</span>
              </div>
            )}
            {isAIListening && (
              <div className="flex items-center space-x-2">
                <Mic className="w-4 h-4 text-yellow-400 animate-pulse" />
                <span>Listening to you...</span>
              </div>
            )}
          </div>
        </div>

        {candidateName && (
          <div className="mb-4 p-3 bg-blue-800 rounded">
            <div className="flex items-center space-x-2 mb-2">
              <User className="w-4 h-4" />
              <span className="font-semibold">Candidate:</span>
            </div>
            <span>{candidateName}</span>
          </div>
        )}

        {jobPosition && (
          <div className="mb-4 p-3 bg-blue-800 rounded">
            <div className="flex items-center space-x-2 mb-2">
              <Briefcase className="w-4 h-4" />
              <span className="font-semibold">Position:</span>
            </div>
            <span>{jobPosition}</span>
          </div>
        )}

        {geminiError && (
          <div className="p-3 bg-red-800 rounded text-red-200">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{geminiError}</span>
            </div>
          </div>
        )}

        {cameraError && (
          <div className="p-3 bg-red-800 rounded text-red-200">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{cameraError}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Video Area */}
      <div className="flex-1 bg-gradient-to-br from-purple-900 to-blue-900 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          {!aiAvatarVisible ? (
            <div className="text-center text-white">
              <Brain className="w-24 h-24 mx-auto mb-4 text-white/50" />
              <h3 className="text-xl font-semibold mb-2">
                AI Avatar Loading...
              </h3>
              <p className="text-white/70">Connecting to virtual camera</p>
            </div>
          ) : (
            <div className="text-center text-white">
              <AIAvatar />
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-2">AI Interviewer</h3>
                <p className="text-white/70">
                  {isAISpeaking
                    ? "Speaking..."
                    : isAIListening
                    ? "Listening..."
                    : "Ready"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Local Video Preview */}
        {localStream && (
          <div className="absolute top-4 right-4 w-48 h-36 bg-black rounded-lg overflow-hidden border-2 border-white/20">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Video Status Indicators */}
            {isMuted && (
              <div className="absolute top-2 left-2 bg-red-500 rounded-full p-1">
                <MicOff className="w-3 h-3 text-white" />
              </div>
            )}
            {!isVideoOn && (
              <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1">
                <VideoOff className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        )}

        {/* Call Controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-4">
          <Button
            onClick={toggleMute}
            variant={isMuted ? "destructive" : "secondary"}
            size="lg"
            className={`w-14 h-14 rounded-full ${
              isMuted
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-white/20 hover:bg-white/30 text-white border border-white/30"
            }`}
          >
            {isMuted ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </Button>
          <Button
            onClick={toggleVideo}
            variant={isVideoOn ? "secondary" : "destructive"}
            size="lg"
            className={`w-14 h-14 rounded-full ${
              isVideoOn
                ? "bg-white/20 hover:bg-white/30 text-white border border-white/30"
                : "bg-red-500 hover:bg-red-600 text-white"
            }`}
          >
            {isVideoOn ? (
              <Video className="w-6 h-6" />
            ) : (
              <VideoOff className="w-6 h-6" />
            )}
          </Button>
          <Button
            onClick={endInterview}
            variant="destructive"
            size="lg"
            className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white"
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Right Panel - Interview Progress and Feedback */}
      <div className="w-80 bg-white p-6 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">Interview Progress</h2>

          {!isInCall ? (
            <div className="text-center py-8">
              <Brain className="w-16 h-16 mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-semibold mb-2">
                Ready to Start Interview
              </h3>
              <p className="text-gray-600 mb-4">
                Click the button below to begin your AI-powered interview
              </p>
              <Button
                onClick={startInterview}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Interview
              </Button>
            </div>
          ) : (
            <>
              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Progress
                  </span>
                  <span className="text-sm text-gray-500">
                    {interviewProgress}/
                    {interviewQuestions[
                      interviewType as keyof typeof interviewQuestions
                    ]?.length || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        (interviewProgress /
                          (interviewQuestions[
                            interviewType as keyof typeof interviewQuestions
                          ]?.length || 1)) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Current Question */}
              {currentQuestion && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Current Question
                  </h3>
                  <div className="p-3 bg-gray-100 rounded text-gray-700">
                    {currentQuestion}
                  </div>
                </div>
              )}

              {/* User Answer */}
              {userAnswer && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Your Answer
                  </h3>
                  <div className="p-3 bg-blue-50 rounded text-gray-700">
                    "{userAnswer}"
                  </div>
                </div>
              )}

              {/* AI Feedback */}
              {feedback && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    AI Feedback
                  </h3>
                  <div className="p-3 bg-green-50 rounded text-gray-700">
                    {feedback}
                  </div>
                </div>
              )}

              {/* Interview Score */}
              {score > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Interview Score
                  </h3>
                  <div className="p-3 bg-green-100 rounded">
                    <span className="text-2xl font-bold text-green-600">
                      {score}/100
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveVideoCall;
