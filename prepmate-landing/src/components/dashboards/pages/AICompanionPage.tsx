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
import { ttsService, type TTSVoice } from "../../../services/ttsService";
import { voicePackService } from "../../../services/voicePackService";
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
import { apiClient } from "../../../lib/apiClient";

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
  const [selectedVoiceModel, setSelectedVoiceModel] = useState<string>("en-IN-female-aria");
  const [useWebGLAvatar, setUseWebGLAvatar] = useState(true);
  const [voicePitch, setVoicePitch] = useState<number>(1.0);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  
  // Camera position and size states
  const [cameraPosition, setCameraPosition] = useState({ x: 100, y: 100 }); // initial position
  const [cameraSize, setCameraSize] = useState({ width: 192, height: 144 }); // w-48 h-36 in pixels
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  
  // Camera and face detection states
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [faceDetected, setFaceDetected] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string>("");
  const [showCameraWarning, setShowCameraWarning] = useState<boolean>(false);
  const [isUserPresent, setIsUserPresent] = useState<boolean>(true);
  
  // Microphone monitoring states
  const [microphoneLevel, setMicrophoneLevel] = useState<number>(0);
  const [isUserSpeaking, setIsUserSpeaking] = useState<boolean>(false);

  const chatRef = useRef<Chat | null>(null);
  const recognitionRef = useRef<any | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const userSpeechStartTime = useRef<number | null>(null);
  const speechDebounceTimer = useRef<number | null>(null);
  
  // Camera and face detection refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const faceDetectionInterval = useRef<number | null>(null);
  const userPresenceTimer = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const interviewStateRef = useRef(interviewState);
  useEffect(() => {
    interviewStateRef.current = interviewState;
  }, [interviewState]);

  // Set initial camera position on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCameraPosition({
        x: window.innerWidth - 220,
        y: 20
      });
    }
  }, []);

  // Voice model to browser voice mapping
  const mapVoiceModelToBrowserVoice = (voiceModelId: string, voices: SpeechSynthesisVoice[]) => {
    // Advanced voice mapping with multiple fallback strategies
    const voiceMap: Record<string, string[]> = {
      // New Hindi Voices (ResponsiveVoice)
      "hi-IN-female-priya": ["Hindi Female", "Google हिन्दी", "Microsoft Hindi Female", "hi-IN"],
      "hi-IN-male-rajesh": ["Hindi Male", "Google हिन्दी", "Microsoft Hindi Male", "hi-IN"],
      
      // New Tamil Voices (ResponsiveVoice)
      "ta-IN-female-meera": ["Tamil Female", "Google தமிழ்", "Microsoft Tamil Female", "ta-IN"],
      "ta-IN-male-kumar": ["Tamil Male", "Google தமிழ்", "Microsoft Tamil Male", "ta-IN"],
      
      // New Bengali Voices (ResponsiveVoice)
      "bn-IN-female-shreya": ["Bengali Female", "Google বাংলা", "Microsoft Bengali Female", "bn-IN"],
      "bn-IN-male-anirban": ["Bengali Male", "Google বাংলা", "Microsoft Bengali Male", "bn-IN"],
      
      // Indian English Voices (Google TTS)
      "en-IN-female-aria": ["Microsoft Heera - English (India)", "Heera", "English (India)", "Google India English Female", "en-IN"],
      "en-IN-female-kavya": ["Microsoft Heera - English (India)", "Heera", "English (India)", "Google India English Female", "en-IN"],
      "en-IN-female-priya": ["Microsoft Heera - English (India)", "Heera", "English (India)", "Google India English Female", "en-IN"],
      "en-IN-female-shreya": ["Microsoft Heera - English (India)", "Heera", "English (India)", "Google India English Female", "en-IN"],
      "en-IN-male-arjun": ["Microsoft Ravi - English (India)", "Ravi", "English (India)", "Google India English Male", "en-IN"],
      "en-IN-male-vikram": ["Microsoft Ravi - English (India)", "Ravi", "English (India)", "Google India English Male", "en-IN"],
      "en-IN-male-rohit": ["Microsoft Ravi - English (India)", "Ravi", "English (India)", "Google India English Male", "en-IN"],
      "en-IN-male-aditya": ["Microsoft Ravi - English (India)", "Ravi", "English (India)", "Google India English Male", "en-IN"],
      
      // US Voices
      "en-US-female-sarah": ["Microsoft Zira - English (United States)", "Zira", "Google US English", "en-US"],
      "en-US-male-david": ["Microsoft David - English (United States)", "David", "Google US English", "en-US"],
      
      // UK Voices
      "en-GB-female-emma": ["Microsoft Hazel - English (Great Britain)", "Hazel", "Google UK English Female", "en-GB"],
      "en-GB-male-oliver": ["Microsoft George - English (Great Britain)", "George", "Google UK English Male", "en-GB"],
      
      // Legacy support for old IDs
      "en-IN-female-1": ["Microsoft Heera - English (India)", "Heera", "English (India)", "en-IN"],
      "en-IN-female-2": ["Microsoft Heera - English (India)", "Heera", "English (India)", "en-IN"],
      "en-IN-female-3": ["Microsoft Heera - English (India)", "Heera", "English (India)", "en-IN"],
      "en-IN-female-4": ["Microsoft Heera - English (India)", "Heera", "English (India)", "en-IN"],
      "en-IN-male-1": ["Microsoft Ravi - English (India)", "Ravi", "English (India)", "en-IN"],
      "en-IN-male-2": ["Microsoft Ravi - English (India)", "Ravi", "English (India)", "en-IN"],
      "en-IN-male-3": ["Microsoft Ravi - English (India)", "Ravi", "English (India)", "en-IN"],
      "en-IN-male-4": ["Microsoft Ravi - English (India)", "Ravi", "English (India)", "en-IN"],
      "en-US-female-1": ["Microsoft Zira - English (United States)", "Zira", "Google US English", "en-US"],
      "en-US-male-1": ["Microsoft David - English (United States)", "David", "Google US English", "en-US"],
      "en-GB-female-1": ["Microsoft Hazel - English (Great Britain)", "Hazel", "Google UK English Female", "en-GB"],
      "en-GB-male-1": ["Microsoft George - English (Great Britain)", "George", "Google UK English Male", "en-GB"],
    };

    const preferredNames = voiceMap[voiceModelId] || [voiceModelId.split('-')[1]];
    
    // Strategy 1: Exact name match
    for (const preferredName of preferredNames) {
      const voice = voices.find(v => v.name.includes(preferredName));
      if (voice) return voice;
    }
    
    // Strategy 2: Language and gender matching
    const isIndian = voiceModelId.includes("en-IN") || voiceModelId.includes("hi-IN") || voiceModelId.includes("ta-IN") || voiceModelId.includes("bn-IN");
    const isFemale = voiceModelId.includes("female");
    const targetLang = voiceModelId.includes("en-IN") ? "en-IN" : 
                      voiceModelId.includes("hi-IN") ? "hi-IN" :
                      voiceModelId.includes("ta-IN") ? "ta-IN" :
                      voiceModelId.includes("bn-IN") ? "bn-IN" :
                      voiceModelId.includes("en-US") ? "en-US" : 
                      voiceModelId.includes("en-GB") ? "en-GB" : "en";
    
    if (isIndian) {
      // Try to find Indian English voices (exclude Hindi voices)
      const indianVoices = voices.filter(v => 
        (v.lang === "en-IN" && v.name.toLowerCase().includes("english")) || 
        (v.name.toLowerCase().includes("india") && v.name.toLowerCase().includes("english")) ||
        (v.name.toLowerCase().includes("heera") && v.name.toLowerCase().includes("english")) ||
        (v.name.toLowerCase().includes("ravi") && v.name.toLowerCase().includes("english"))
      );
      
      if (indianVoices.length > 0) {
        const genderMatch = indianVoices.find(v => 
          isFemale ? 
            (v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("heera")) :
            (v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("ravi"))
        );
        if (genderMatch) return genderMatch;
        return indianVoices[0];
      }
    }
    
    // Strategy 3: Language-based fallback
    const langVoices = voices.filter(v => v.lang.startsWith(targetLang));
    if (langVoices.length > 0) {
      const genderMatch = langVoices.find(v => 
        isFemale ? 
          (!v.name.toLowerCase().includes("male") && !v.name.toLowerCase().includes("david") && !v.name.toLowerCase().includes("george")) :
          (v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("david") || v.name.toLowerCase().includes("george"))
      );
      if (genderMatch) return genderMatch;
      return langVoices[0];
    }
    
    // Strategy 4: English fallback
    const englishVoices = voices.filter(v => v.lang.startsWith("en"));
    if (englishVoices.length > 0) {
      return englishVoices[0];
    }
    
    // Strategy 5: Any voice
    return voices[0] || null;
  };

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 10;
    
    const populateVoiceList = () => {
      if (typeof window.speechSynthesis === "undefined") return;
      
      // Force refresh voices on some browsers
      window.speechSynthesis.getVoices();
      
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0 && retryCount < maxRetries) {
        retryCount++;
        // Sometimes voices aren't loaded immediately, try again
        setTimeout(populateVoiceList, 200 * retryCount);
        return;
      }

      if (voices.length > 0) {
        const allVoices = voices.sort((a, b) => a.name.localeCompare(b.name));
        setAvailableVoices(allVoices);

        // Log available Indian voices for debugging
        const indianVoices = allVoices.filter(v => 
          v.lang === "en-IN" || 
          v.name.toLowerCase().includes("india") ||
          v.name.toLowerCase().includes("hindi") ||
          v.name.toLowerCase().includes("heera") ||
          v.name.toLowerCase().includes("ravi")
        );
        console.log('Available Indian voices:', indianVoices.map(v => `${v.name} (${v.lang})`));

        // Map the selected voice model to a browser voice
        const mappedVoice = mapVoiceModelToBrowserVoice(selectedVoiceModel, allVoices);
        if (mappedVoice) {
          setSelectedVoiceURI(mappedVoice.voiceURI);
          console.log(`Voice mapped: ${selectedVoiceModel} -> ${mappedVoice.name} (${mappedVoice.lang})`);
        } else if (allVoices.length > 0) {
          // Find a decent fallback voice
          const fallbackVoice = allVoices.find(v => v.lang.startsWith("en")) || allVoices[0];
          setSelectedVoiceURI(fallbackVoice.voiceURI);
          console.log(`Fallback voice: ${fallbackVoice.name} (${fallbackVoice.lang})`);
        }
      }
    };

    // Initial load with a slight delay to ensure speech synthesis is ready
    setTimeout(populateVoiceList, 100);
    
    // Handle voice loading events
    if (typeof window.speechSynthesis !== "undefined") {
      window.speechSynthesis.onvoiceschanged = populateVoiceList;
    }
    
    return () => {
      if (typeof window.speechSynthesis !== "undefined") {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [selectedVoiceModel]);

  const resetState = useCallback(() => {
    if (speechDebounceTimer.current) clearTimeout(speechDebounceTimer.current);
    if (faceDetectionInterval.current) clearInterval(faceDetectionInterval.current);
    if (userPresenceTimer.current) clearTimeout(userPresenceTimer.current);
    
    // Stop camera stream
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    
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
    setFaceDetected(true);
    setIsUserPresent(true);
    setShowCameraWarning(false);
    setCameraError("");
    chatRef.current = null;
    if (recognitionRef.current) recognitionRef.current.stop();
    window.speechSynthesis.cancel();
  }, [cameraStream]);

  // Camera initialization
  const initializeCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false // We handle audio separately for speech recognition
      });
      
      setCameraStream(stream);
      setCameraError("");
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      return true;
    } catch (error: any) {
      console.error('Camera access error:', error);
      setCameraError(`Camera access denied: ${error.message}`);
      return false;
    }
  }, []);

  // Simple face detection using video dimensions and face patterns
  const detectFace = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !cameraStream) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Enhanced face/person detection algorithm
      let brightnessSum = 0;
      let pixelCount = 0;
      let darkPixels = 0;
      let midTonePixels = 0;
      let brightPixels = 0;
      let edgePixels = 0;
      
      // Sample more pixels for better accuracy
      for (let i = 0; i < data.length; i += 20) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r + g + b) / 3;
        brightnessSum += brightness;
        pixelCount++;
        
        // Categorize pixels
        if (brightness < 60) darkPixels++;
        else if (brightness < 180) midTonePixels++;
        else brightPixels++;
        
        // Simple edge detection (compare with next pixel)
        if (i + 60 < data.length) {
          const nextR = data[i + 60];
          const nextG = data[i + 61];
          const nextB = data[i + 62];
          const nextBrightness = (nextR + nextG + nextB) / 3;
          if (Math.abs(brightness - nextBrightness) > 30) {
            edgePixels++;
          }
        }
      }
      
      const averageBrightness = brightnessSum / pixelCount;
      const darkRatio = darkPixels / pixelCount;
      const midToneRatio = midTonePixels / pixelCount;
      const edgeRatio = edgePixels / pixelCount;
      
      // Enhanced presence detection
      const hasReasonableBrightness = averageBrightness > 30 && averageBrightness < 220;
      const hasGoodContrast = edgeRatio > 0.1; // Indicates edges/features present
      const hasVariedTones = midToneRatio > 0.2 && darkRatio > 0.1; // Skin tones and shadows
      const notTooUniform = !(darkRatio > 0.8 || brightPixels / pixelCount > 0.8); // Not all dark or all bright
      
      const facePresent = hasReasonableBrightness && hasGoodContrast && hasVariedTones && notTooUniform;
      
      console.log(`👤 Face detection: brightness=${averageBrightness.toFixed(1)}, edges=${edgeRatio.toFixed(3)}, midtones=${midToneRatio.toFixed(3)}, present=${facePresent}`);
      
      setFaceDetected(facePresent);
      
      if (facePresent) {
        setIsUserPresent(true);
        setShowCameraWarning(false);
        if (userPresenceTimer.current) {
          clearTimeout(userPresenceTimer.current);
          userPresenceTimer.current = null;
        }
      } else {
        // User might have left - start timer if not already started
        if (!userPresenceTimer.current && isUserPresent) {
          console.log('👤 User may have left camera view, starting 5-second timer...');
          userPresenceTimer.current = window.setTimeout(() => {
            console.log('⚠️ User presence timeout - pausing interview');
            setIsUserPresent(false);
            setShowCameraWarning(true);
            
            // Pause speech recognition when user is not present
            if (recognitionRef.current && (interviewStateRef.current === InterviewState.LISTENING || interviewStateRef.current === InterviewState.THINKING)) {
              try {
                recognitionRef.current.stop();
                console.log('🛑 Speech recognition paused due to user absence');
              } catch (err) {
                console.log('Recognition already stopped');
              }
            }
            
            // Cancel current speech synthesis
            speechSynthesis.cancel();
            ttsService.stop();
            console.log('🔇 Speech synthesis stopped due to user absence');
            
          }, 5000); // Wait 5 seconds before showing warning (increased from 3s)
        }
      }
      
    } catch (error) {
      console.error('Face detection error:', error);
    }
  }, [cameraStream, isUserPresent, interviewState]);

  // Start face detection monitoring
  const startFaceDetection = useCallback(() => {
    if (faceDetectionInterval.current) {
      clearInterval(faceDetectionInterval.current);
    }
    
    faceDetectionInterval.current = window.setInterval(detectFace, 1000); // Check every second
  }, [detectFace]);

  const startMicrophoneMonitoring = useCallback(async () => {
    try {
      // Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });
      
      microphoneStreamRef.current = stream;
      
      // Create audio context and analyser
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      // Start monitoring
      const monitorAudio = () => {
        if (!analyserRef.current) return;
        
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate average audio level
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const average = sum / bufferLength;
        const level = average / 255; // Normalize to 0-1
        
        setMicrophoneLevel(level);
        
        // Detect if user is speaking (adjust threshold as needed)
        const speakingThreshold = 0.01; // Very sensitive threshold
        const wasSpeaking = isUserSpeaking;
        const nowSpeaking = level > speakingThreshold;
        
        if (nowSpeaking !== wasSpeaking) {
          setIsUserSpeaking(nowSpeaking);
          console.log(`🎤 User ${nowSpeaking ? 'started' : 'stopped'} speaking (level: ${level.toFixed(3)})`);
        }
        
        animationFrameRef.current = requestAnimationFrame(monitorAudio);
      };
      
      monitorAudio();
      console.log('🎤 Microphone monitoring started');
      
    } catch (error) {
      console.error('❌ Failed to start microphone monitoring:', error);
      setCameraError('Could not access microphone for monitoring');
    }
  }, [isUserSpeaking]);

  const stopMicrophoneMonitoring = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (microphoneStreamRef.current) {
      microphoneStreamRef.current.getTracks().forEach(track => track.stop());
      microphoneStreamRef.current = null;
    }
    
    analyserRef.current = null;
    setMicrophoneLevel(0);
    setIsUserSpeaking(false);
    console.log('🔇 Microphone monitoring stopped');
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
    recognition.maxAlternatives = 3; // More alternatives for better accuracy
    
    // Configure for better sensitivity
    if ('webkitSpeechRecognition' in window) {
      // Chrome/Edge specific optimizations
      (recognition as any).serviceURI = 'wss://www.google.com/speech-api/full-duplex/v1/up';
    }

    recognition.onstart = () => {
      console.log('🎤 Speech recognition started');
      if (interviewStateRef.current !== InterviewState.SPEAKING) {
        setInterviewState(InterviewState.LISTENING);
        console.log('📡 State set to LISTENING');
      }
      userSpeechStartTime.current = Date.now();
    };

    recognition.onresult = (event: any) => {
      console.log('🎯 Speech recognition result received');
      
      // Handle user interruption during AI speaking
      if (interviewStateRef.current === InterviewState.SPEAKING) {
        console.log('⚡ User interrupted AI speech');
        speechSynthesis.cancel(); // Stop AI immediately
        setInterviewState(InterviewState.LISTENING);
      }
      
      if (speechDebounceTimer.current) {
        clearTimeout(speechDebounceTimer.current);
      }
      
      let interim = "";
      let final = "";
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        console.log(`📝 Transcript ${i}: "${transcript}" (final: ${event.results[i].isFinal})`);
        
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      
      if (interim) {
        console.log(`💭 Interim: "${interim}"`);
        setInterimTranscript(interim);
      }
      
      if (final.trim()) {
        console.log(`✅ Final transcript: "${final}"`);
        setFinalTranscript((prev) => (prev + " " + final).trim());
        
        // Extended silence detection - wait longer for user to continue
        speechDebounceTimer.current = window.setTimeout(() => {
          console.log('⏰ Speech timeout, stopping recognition');
          if (recognitionRef.current && interviewStateRef.current === InterviewState.LISTENING) {
            recognitionRef.current.stop();
          }
        }, 2500); // Increased from 1500ms to 2500ms for more natural pauses
      }
    };

    recognition.onerror = (event: any) => {
      console.error('🚨 Speech recognition error:', event.error);
      
      // Handle specific errors gracefully
      if (event.error === 'no-speech') {
        console.log('🔇 No speech detected, letting onend handle restart...');
        // Don't restart here - let onend handle it to avoid double-starting
        return;
      }
      
      if (event.error === 'audio-capture') {
        console.error('🎤 Audio capture error');
        setError('Microphone access lost. Please check your microphone settings and refresh the page.');
        return;
      }
      
      if (event.error === 'not-allowed') {
        console.error('🚫 Microphone permission denied');
        setError('Microphone permission denied. Please allow microphone access and refresh the page.');
        return;
      }
      
      if (event.error === 'aborted') {
        console.log('🛑 Speech recognition aborted (normal during state changes)');
        return;
      }
      
      // For other errors, attempt to restart after a delay
      console.log('🔄 Attempting to restart recognition after error:', event.error);
      setTimeout(() => {
        if ((interviewStateRef.current === InterviewState.LISTENING || 
            interviewStateRef.current === InterviewState.THINKING) && isUserPresent) {
          try {
            // Only start if recognition is not already active
            if (recognitionRef.current && recognitionRef.current.continuous !== undefined) {
              console.log('🚀 Restarting recognition after error');
              recognitionRef.current.start();
            }
          } catch (err) {
            console.error('❌ Failed to restart speech recognition:', err);
          }
        }
      }, 1000);
    };

    recognition.onend = () => {
      console.log('🏁 Speech recognition ended');
      
      if (speechDebounceTimer.current) {
        clearTimeout(speechDebounceTimer.current);
      }
      
      // Only process if we were actually listening (not speaking)
      if (interviewStateRef.current === InterviewState.LISTENING) {
        console.log('🤔 Setting state to THINKING');
        setInterviewState(InterviewState.THINKING);
      }
      
      // Auto-restart recognition for continuous listening
      const currentState = interviewStateRef.current;
      const shouldRestart = currentState === InterviewState.THINKING ||
                           currentState === InterviewState.LISTENING;
      
      if (shouldRestart && isUserPresent) {
        console.log('🔄 Auto-restarting recognition for continuous listening');
        setTimeout(() => {
          // Double-check state hasn't changed and we're not already running
          if (interviewStateRef.current !== InterviewState.ENDED && 
              interviewStateRef.current !== InterviewState.IDLE &&
              interviewStateRef.current !== InterviewState.SPEAKING &&
              isUserPresent) {
            try {
              console.log('🚀 Restarting recognition (auto)');
              if (recognitionRef.current) {
                recognitionRef.current.start();
              }
            } catch (err) {
              if (err instanceof Error && err.message.includes('already started')) {
                console.log('⚠️ Recognition already active, skipping restart');
              } else {
                console.error('❌ Auto-restart failed:', err);
              }
            }
          }
        }, 500); // Longer delay to prevent conflicts
      }
    };
    
    recognitionRef.current = recognition;
    
    return () => {
      if (recognition) {
        recognition.stop();
      }
      if (speechDebounceTimer.current) {
        clearTimeout(speechDebounceTimer.current);
      }
    };
  }, [isUserPresent]);

  // Function to speak with a specific voice model (for initialization)
  const speakWithVoiceModel = useCallback(
    async (text: string, voiceModel: string) => {
      try {
        // Cancel any ongoing speech first
        speechSynthesis.cancel();
        ttsService.stop();
        voicePackService.stopAll();
        
        // CRITICAL: Stop speech recognition to prevent AI from listening to itself
        if (recognitionRef.current) {
          try {
            console.log('🛑 Stopping speech recognition while AI speaks');
            recognitionRef.current.stop();
          } catch (err) {
            console.log('Recognition already stopped');
          }
        }
        
        setInterviewState(InterviewState.SPEAKING);
        
        // Determine voice options based on selected model and user preference
        const basePitch = voiceModel.includes("female") ? 1.1 : 0.85;
        const voiceOptions = {
          rate: voiceModel.includes("female") ? 0.9 : 0.95,
          pitch: basePitch * voicePitch, // Apply user's pitch preference
          volume: 1.0
        };
        
        // Special settings for Indian voices (both English and native languages)
        if (voiceModel.includes("en-IN") || voiceModel.includes("hi-IN") || 
            voiceModel.includes("ta-IN") || voiceModel.includes("bn-IN")) {
          voiceOptions.rate = 0.85; // Slower for Indian accent clarity
          voiceOptions.pitch = 1.0 * voicePitch; // Natural pitch with user adjustment
        }
        
        console.log('AI started speaking');
        console.log(`🔊 Speaking with voice model: ${voiceModel}`);
        
        // Set audio playing state for lip-sync
        setIsAudioPlaying(true);
        
        // Use voice pack service first, then TTS service fallback
        try {
          await voicePackService.speakWithVoicePack(text, voiceModel, voiceOptions);
        } catch (voicePackError) {
          console.log('Voice pack failed, using TTS service:', voicePackError);
          await ttsService.speak(text, voiceModel, voiceOptions);
        }
        
        // Reset audio playing state
        setIsAudioPlaying(false);
        
        console.log('🔊 AI finished speaking');
        if (interviewStateRef.current === InterviewState.SPEAKING) {
          // Automatically start listening for user response
          console.log('🎤 Starting speech recognition after AI speech');
          setInterviewState(InterviewState.LISTENING);
          
          // Small delay to ensure state transition
          setTimeout(() => {
            try {
              if (recognitionRef.current) {
                console.log('🚀 Attempting to start recognition');
                recognitionRef.current.start();
              } else {
                console.error('❌ No recognition reference available');
              }
            } catch (err) {
              console.log('⚠️ Recognition start error:', err);
              // Try again with a longer delay
              setTimeout(() => {
                try {
                  recognitionRef.current?.start();
                } catch (err2) {
                  console.error('❌ Second attempt failed:', err2);
                }
              }, 1000);
            }
          }, 100);
        }
        
      } catch (error) {
        console.error('🚨 TTS Error with specific voice model, using fallback:', error);
        
        // Fallback to original speech synthesis if TTS service fails
        const utterance = new SpeechSynthesisUtterance(text);
        const selectedVoice = availableVoices.find(
          (v) => v.voiceURI === selectedVoiceURI
        );
        
        if (selectedVoice) {
          utterance.voice = selectedVoice;
          utterance.lang = selectedVoice.lang;
          
          if (voiceModel.includes("female")) {
            utterance.pitch = 1.1 * voicePitch; // Apply user pitch preference
            utterance.rate = 0.9;
          } else if (voiceModel.includes("male")) {
            utterance.pitch = 0.85 * voicePitch; // Apply user pitch preference
            utterance.rate = 0.95;
          }
          
          // Special settings for Indian voices (both English and native languages)
          if (voiceModel.includes("en-IN") || voiceModel.includes("hi-IN") || 
              voiceModel.includes("ta-IN") || voiceModel.includes("bn-IN")) {
            utterance.rate = 0.85;
            utterance.pitch = 1.0 * voicePitch; // Natural pitch with user adjustment
          }
        } else {
          utterance.lang = "en-US";
          utterance.rate = 0.9;
          utterance.pitch = 1.0 * voicePitch; // Apply user pitch preference even for fallback
        }
        
        utterance.volume = 1.0;
        
        utterance.onend = () => {
          console.log('🔊 AI finished speaking (fallback)');
          setIsAudioPlaying(false); // Reset audio playing state
          if (interviewStateRef.current === InterviewState.SPEAKING) {
            setInterviewState(InterviewState.LISTENING);
            setTimeout(() => {
              try {
                recognitionRef.current?.start();
              } catch (err) {
                console.log('Recognition start error:', err);
              }
            }, 100);
          }
        };
        
        utteranceRef.current = utterance;
        speechSynthesis.speak(utterance);
        console.log(`🔊 Speaking with fallback voice for model: ${voiceModel}`);
      }
    },
    [availableVoices, selectedVoiceURI, voicePitch]
  );

  const speak = useCallback(
    async (text: string) => {
      try {
        // Cancel any ongoing speech first
        speechSynthesis.cancel();
        ttsService.stop();
        voicePackService.stopAll();
        
        // CRITICAL: Stop speech recognition to prevent AI from listening to itself
        if (recognitionRef.current) {
          try {
            console.log('🛑 Stopping speech recognition while AI speaks');
            recognitionRef.current.stop();
          } catch (err) {
            console.log('Recognition already stopped');
          }
        }
        
        setInterviewState(InterviewState.SPEAKING);
        
        // Determine voice options based on selected model and user preference
        const basePitch = selectedVoiceModel.includes("female") ? 1.1 : 0.85;
        const voiceOptions = {
          rate: selectedVoiceModel.includes("female") ? 0.9 : 0.95,
          pitch: basePitch * voicePitch, // Apply user's pitch preference
          volume: 1.0
        };
        
        // Special settings for Indian voices (both English and native languages)
        if (selectedVoiceModel.includes("en-IN") || selectedVoiceModel.includes("hi-IN") || 
            selectedVoiceModel.includes("ta-IN") || selectedVoiceModel.includes("bn-IN")) {
          voiceOptions.rate = 0.85; // Slower for Indian accent clarity
          voiceOptions.pitch = 1.0 * voicePitch; // Natural pitch with user adjustment
        }
        
        console.log('AI started speaking');
        console.log(`🔊 Speaking with TTS service: ${selectedVoiceModel}`);
        
        // Set audio playing state for lip-sync
        setIsAudioPlaying(true);
        
        // Use voice pack service first, then TTS service fallback
        try {
          await voicePackService.speakWithVoicePack(text, selectedVoiceModel, voiceOptions);
        } catch (voicePackError) {
          console.log('Voice pack failed, using TTS service:', voicePackError);
          await ttsService.speak(text, selectedVoiceModel, voiceOptions);
        }
        
        // Reset audio playing state
        setIsAudioPlaying(false);
        
        console.log('🔊 AI finished speaking');
        if (interviewStateRef.current === InterviewState.SPEAKING) {
          // Automatically start listening for user response
          console.log('🎤 Starting speech recognition after AI speech');
          setInterviewState(InterviewState.LISTENING);
          
          // Small delay to ensure state transition
          setTimeout(() => {
            try {
              if (recognitionRef.current) {
                console.log('🚀 Attempting to start recognition');
                recognitionRef.current.start();
              } else {
                console.error('❌ No recognition reference available');
              }
            } catch (err) {
              console.log('⚠️ Recognition start error:', err);
              // Try again with a longer delay
              setTimeout(() => {
                try {
                  recognitionRef.current?.start();
                } catch (err2) {
                  console.error('❌ Second attempt failed:', err2);
                }
              }, 1000);
            }
          }, 100);
        }
        
      } catch (error) {
        console.error('🚨 TTS Error, using fallback:', error);
        
        // Fallback to original speech synthesis if TTS service fails
        const utterance = new SpeechSynthesisUtterance(text);
        const selectedVoice = availableVoices.find(
          (v) => v.voiceURI === selectedVoiceURI
        );
        
        if (selectedVoice) {
          utterance.voice = selectedVoice;
          utterance.lang = selectedVoice.lang;
          
          if (selectedVoiceModel.includes("female")) {
            utterance.pitch = 1.1 * voicePitch; // Apply user pitch preference
            utterance.rate = 0.9;
          } else if (selectedVoiceModel.includes("male")) {
            utterance.pitch = 0.85 * voicePitch; // Apply user pitch preference
            utterance.rate = 0.95;
          }
          
          // Special settings for Indian voices (both English and native languages)
          if (selectedVoiceModel.includes("en-IN") || selectedVoiceModel.includes("hi-IN") || 
              selectedVoiceModel.includes("ta-IN") || selectedVoiceModel.includes("bn-IN")) {
            utterance.rate = 0.85;
            utterance.pitch = 1.0 * voicePitch; // Natural pitch with user adjustment
          }
        } else {
          utterance.lang = "en-US";
          utterance.rate = 0.9;
          utterance.pitch = 1.0 * voicePitch; // Apply user pitch preference even for fallback
        }
        
        utterance.volume = 1.0;
        
        utterance.onend = () => {
          console.log('🔊 AI finished speaking (fallback)');
          setIsAudioPlaying(false); // Reset audio playing state
          if (interviewStateRef.current === InterviewState.SPEAKING) {
            setInterviewState(InterviewState.LISTENING);
            setTimeout(() => {
              try {
                recognitionRef.current?.start();
              } catch (err) {
                console.log('Recognition start error:', err);
              }
            }, 100);
          }
        };
        
        utteranceRef.current = utterance;
        speechSynthesis.speak(utterance);
        console.log(`🔊 Speaking with fallback voice: ${selectedVoice?.name || 'default'} (${selectedVoiceModel})`);
      }
    },
    [availableVoices, selectedVoiceURI, selectedVoiceModel, voicePitch]
  );

  // Camera drag handlers
  const handleCameraMouseDown = useCallback((e: React.MouseEvent) => {
    // Check if clicking on draggable area (not buttons)
    const target = e.target as HTMLElement;
    const isButton = target.tagName === 'BUTTON' || target.closest('button');
    const isResizeHandle = target.classList.contains('resize-handle') || target.closest('.resize-handle');
    
    if (!isButton && !isResizeHandle) {
      console.log('🔥 Starting drag from:', cameraPosition);
      setIsDragging(true);
      // Calculate offset from current camera position
      setDragOffset({
        x: e.clientX - cameraPosition.x,
        y: e.clientY - cameraPosition.y
      });
      console.log('🔥 Drag offset:', { x: e.clientX - cameraPosition.x, y: e.clientY - cameraPosition.y });
      e.preventDefault();
    }
  }, [cameraPosition]);

  const handleCameraMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Ensure camera stays within viewport bounds
      const maxX = window.innerWidth - cameraSize.width - 20;
      const maxY = window.innerHeight - cameraSize.height - 20;
      
      setCameraPosition({
        x: Math.max(0, Math.min(maxX, newX)),
        y: Math.max(0, Math.min(maxY, newY))
      });
    }
  }, [isDragging, dragOffset, cameraSize]);

  const handleCameraMouseUp = useCallback(() => {
    setIsDragging(false);
    console.log('🔥 Drag ended');
  }, []);

  // Camera resize handlers
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
  }, []);

  const handleResizeMouseMove = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = Math.max(160, Math.min(400, e.clientX - cameraPosition.x));
      const newHeight = Math.max(120, Math.min(300, e.clientY - cameraPosition.y));
      setCameraSize({ width: newWidth, height: newHeight });
    }
  }, [isResizing, cameraPosition]);

  const handleResizeMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add global event listeners for drag and resize
  useEffect(() => {
    if (isDragging || isResizing) {
      const moveHandler = isDragging ? handleCameraMouseMove : handleResizeMouseMove;
      const upHandler = isDragging ? handleCameraMouseUp : handleResizeMouseUp;
      
      document.addEventListener('mousemove', moveHandler);
      document.addEventListener('mouseup', upHandler);
      
      return () => {
        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('mouseup', upHandler);
      };
    }
  }, [isDragging, isResizing, handleCameraMouseMove, handleCameraMouseUp, handleResizeMouseMove, handleResizeMouseUp]);

  const handleStartInterview = useCallback(
    async (name: string, role: string, apiKey: string, voiceModel: string) => {
      setInterviewState(InterviewState.STARTING);
      setError("");
      
      try {
        // Request both audio and camera permissions
        const [audioStream, cameraSuccess] = await Promise.all([
          navigator.mediaDevices.getUserMedia({ audio: true }),
          initializeCamera()
        ]);
        
        if (!cameraSuccess) {
          setError("Camera access is required for facial expression monitoring during the interview.");
          setInterviewState(InterviewState.IDLE);
          return;
        }
        
        setUserName(name);
        setJobRole(role);
        
        // Get API key from backend if not provided
        let actualApiKey = apiKey;
        if (!actualApiKey) {
          try {
            const response = await apiClient.fetch(`/users/ai-companion/settings`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json',
              },
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.data.settings.hasApiKey && data.data.settings.isApiKeyValid) {
                // API key is stored in backend, we'll use it there
                actualApiKey = "backend"; // Placeholder to indicate backend storage
              }
            }
          } catch (error) {
            console.error('Error fetching API key from backend:', error);
          }
        }
        
        setGeminiApiKey(actualApiKey);
        setSelectedVoiceModel(voiceModel);
        
        // Map voice model to browser voice
        const mappedVoice = mapVoiceModelToBrowserVoice(voiceModel, availableVoices);
        if (mappedVoice) {
          setSelectedVoiceURI(mappedVoice.voiceURI);
        }
        
        // Start face detection monitoring
        startFaceDetection();
        
        // Start microphone monitoring for better speech detection
        await startMicrophoneMonitoring();
        
        chatRef.current = createInterviewChat(name, role, actualApiKey);

        const welcomeText = `Hello ${name}! I'm PrepMate. I'll be interviewing you for the ${role} position today. Please ensure you remain visible in the camera throughout the interview for optimal facial expression analysis. To start, could you please tell me a bit about yourself?`;

        setMessages([{ author: MessageAuthor.AI, text: welcomeText }]);
        
        // Use the voiceModel parameter directly instead of relying on state
        console.log(`🎯 Starting interview with voice model: ${voiceModel}`);
        await speakWithVoiceModel(welcomeText, voiceModel);
      } catch (err: any) {
        setError(
          `Permission denied. Please enable microphone and camera access in your browser settings. ${err.message || ''}`
        );
        setInterviewState(InterviewState.IDLE);
      }
    },
    [speakWithVoiceModel, initializeCamera, startFaceDetection, availableVoices]
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
    
    // Stop monitoring systems
    stopMicrophoneMonitoring();
    if (faceDetectionInterval.current) {
      clearInterval(faceDetectionInterval.current);
      faceDetectionInterval.current = null;
    }

    const summary = await getInterviewSummary(userName, messages, geminiApiKey);
    setPostInterviewSummary(summary);
  }, [messages, userName, geminiApiKey, stopMicrophoneMonitoring]);

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

  // Cleanup effect to stop all audio and services when component unmounts
  useEffect(() => {
    return () => {
      console.log('🧹 AICompanionPage cleanup: Stopping all audio and services');
      
      // Stop all voice services immediately
      voicePackService.stopAll();
      ttsService.stop();
      
      // Stop speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      
      // Stop microphone monitoring
      if (microphoneStreamRef.current) {
        microphoneStreamRef.current.getTracks().forEach(track => track.stop());
        microphoneStreamRef.current = null;
      }
      
      // Clear all timeouts and intervals
      if (speechDebounceTimer.current) {
        clearTimeout(speechDebounceTimer.current);
      }
      if (faceDetectionInterval.current) {
        clearInterval(faceDetectionInterval.current);
      }
      if (userPresenceTimer.current) {
        clearTimeout(userPresenceTimer.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Force stop any ResponsiveVoice that might be running
      if ((window as any).responsiveVoice) {
        (window as any).responsiveVoice.cancel();
      }
    };
  }, []);

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
    <div className="h-screen w-full flex flex-col p-4 bg-background text-foreground">
      <header className="flex-shrink-0 flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-ai-600 dark:text-ai-400">PrepMate</h1>
        <div className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-full hover:bg-muted transition-colors duration-200 text-foreground"
          >
            <Settings className="w-6 h-6" />
          </button>
          {showSettings && (
            <div className="absolute right-0 mt-2 w-72 bg-card border border-border rounded-lg shadow-xl z-50 p-3">
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground block mb-2">
                    Avatar Type
                  </label>
                  <div className="flex gap-2">
                    <Button
                      variant={useWebGLAvatar ? "ai" : "outline"}
                      size="sm"
                      onClick={() => setUseWebGLAvatar(true)}
                      className="flex-1"
                    >
                      <Monitor className="w-4 h-4 mr-2" />
                      3D Avatar
                    </Button>
                    <Button
                      variant={!useWebGLAvatar ? "ai" : "outline"}
                      size="sm"
                      onClick={() => setUseWebGLAvatar(false)}
                      className="flex-1"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Simple
                    </Button>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="voice-select"
                    className="text-sm text-muted-foreground block mb-2"
                  >
                    Select AI Voice
                  </label>
                  {availableVoices.length > 0 ? (
                    <>
                      <select
                        id="voice-select"
                        value={selectedVoiceURI || ""}
                        onChange={(e) => setSelectedVoiceURI(e.target.value)}
                        className="w-full bg-background border border-border rounded-md py-1 px-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ai-500"
                      >
                        {availableVoices.map((voice) => (
                          <option key={voice.voiceURI} value={voice.voiceURI}>
                            {`${voice.name} (${voice.lang})`}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground mt-2">
                        Note: Voices are from your browser/OS. Install language
                        packs for more options.
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No voices available.
                    </p>
                  )}
                </div>
                
                {/* Voice Pitch Control */}
                <div className="bg-muted/50 p-3 rounded-lg border border-border shadow-sm">
                  <label
                    htmlFor="voice-pitch"
                    className="text-sm text-foreground font-medium block mb-2 flex items-center justify-between"
                  >
                    <span className="flex items-center">
                      🎚️ Voice Pitch
                    </span>
                    <span className="text-ai-600 dark:text-ai-400 text-xs font-bold bg-ai-50 dark:bg-ai-900/30 px-2 py-1 rounded">{voicePitch.toFixed(1)}x</span>
                  </label>
                  <input
                    id="voice-pitch"
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={voicePitch}
                    onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                    className="w-full h-3 bg-muted rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ai-500"
                    style={{
                      background: `linear-gradient(to right, hsl(var(--ai)) 0%, hsl(var(--ai)) ${((voicePitch - 0.5) / 1.5) * 100}%, hsl(var(--muted)) ${((voicePitch - 0.5) / 1.5) * 100}%, hsl(var(--muted)) 100%)`,
                      WebkitAppearance: 'none',
                      height: '12px',
                      borderRadius: '6px',
                    }}
                  />
                  <style>{`
                    input[type="range"]::-webkit-slider-thumb {
                      appearance: none;
                      width: 20px;
                      height: 20px;
                      border-radius: 50%;
                      background: #06b6d4;
                      border: 2px solid #fff;
                      cursor: pointer;
                      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    }
                    input[type="range"]::-moz-range-thumb {
                      width: 20px;
                      height: 20px;
                      border-radius: 50%;
                      background: #06b6d4;
                      border: 2px solid #fff;
                      cursor: pointer;
                      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    }
                  `}</style>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Lower</span>
                    <span>Normal</span>
                    <span>Higher</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground">
                      Adjust the AI voice pitch for better comfort
                    </p>
                    <Button
                      variant="ai"
                      size="sm"
                      onClick={async () => {
                        if (selectedVoiceModel) {
                          try {
                            await voicePackService.speakWithVoicePack(
                              "Testing voice pitch adjustment", 
                              selectedVoiceModel, 
                              { pitch: voicePitch, rate: 0.9, volume: 1.0 }
                            );
                          } catch (error) {
                            console.log('Voice pack failed, using fallback');
                            const utterance = new SpeechSynthesisUtterance("Testing voice pitch adjustment");
                            utterance.pitch = voicePitch;
                            utterance.rate = 0.9;
                            speechSynthesis.speak(utterance);
                          }
                        }
                      }}
                      className="text-xs px-2 py-1"
                    >
                      Test
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Camera Warning Overlay */}
      {showCameraWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-red-800 border border-red-600 rounded-xl p-8 max-w-md mx-4 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Please Return to Camera View
            </h2>
            <p className="text-red-200 mb-6">
              You've moved away from the camera. For proper facial expression analysis, 
              please position yourself back in view of the camera to continue the interview.
            </p>
            <Button
              onClick={() => {
                setShowCameraWarning(false);
                setIsUserPresent(true);
                // Restart speech recognition
                if (recognitionRef.current) {
                  try {
                    recognitionRef.current.start();
                  } catch (err) {
                    console.log('Recognition already active');
                  }
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2"
            >
              I'm Back in Camera View
            </Button>
          </div>
        </div>
      )}

      {/* User camera view - draggable and resizable */}
      <div 
        className="fixed z-40 select-none"
        style={{
          left: `${cameraPosition.x}px`,
          top: `${cameraPosition.y}px`,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleCameraMouseDown}
      >
        <div className="relative bg-card rounded-lg p-2 shadow-sm border border-border hover:border-ai-500 transition-colors">
          {/* Draggable header */}
          <div className="camera-header flex items-center justify-between text-xs text-muted-foreground mb-1 cursor-grab active:cursor-grabbing hover:text-ai-400 transition-colors" title="Drag to move camera">
            <span className="flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
              Your Camera
            </span>
            <div className="flex items-center space-x-2">
              {/* Status indicator */}
              <div className={`w-2 h-2 rounded-full ${
                faceDetected ? 'bg-green-400' : 'bg-red-400'
              } animate-pulse`} />
              {/* Reset position button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCameraPosition({ x: window.innerWidth - 220, y: 20 });
                  setCameraSize({ width: 192, height: 144 });
                }}
                className="text-muted-foreground hover:text-ai-400"
                title="Reset position and size"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              </button>
              {/* Minimize button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCameraSize(prev => ({ 
                    width: prev.width < 100 ? 192 : 80, 
                    height: prev.height < 75 ? 144 : 60 
                  }));
                }}
                className="text-muted-foreground hover:text-foreground"
                title="Minimize/Restore"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Video element */}
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            className="rounded-lg bg-black object-cover pointer-events-none"
            style={{
              width: `${cameraSize.width}px`,
              height: `${cameraSize.height}px`
            }}
          />
          
          {/* Resize handle */}
          <div
            className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-nw-resize bg-ai-600 rounded-tl-lg opacity-70 hover:opacity-100 transition-opacity"
            onMouseDown={handleResizeMouseDown}
            title="Drag to resize"
          >
            <div className="w-full h-full flex items-end justify-end p-1">
              <div className="w-1 h-1 bg-white rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden canvas for face detection processing */}
      <div className="hidden">
        <canvas ref={canvasRef} />
      </div>

      {/* Camera status indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            faceDetected ? 'bg-green-800 text-green-200' : 'bg-red-800 text-red-200'
          }`}>
            <div className={`w-2 h-2 rounded-full ${faceDetected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span>{faceDetected ? 'Camera Active' : 'No Face Detected'}</span>
          </div>
          
          {cameraError && (
            <div className="bg-yellow-800 text-yellow-200 px-3 py-1 rounded-full text-sm">
              Camera: {cameraError}
            </div>
          )}
        </div>
        
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium border ${
          interviewState === InterviewState.LISTENING ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' : 
          interviewState === InterviewState.SPEAKING ? 'bg-ai-50 text-ai-700 border-ai-200 dark:bg-ai-900/30 dark:text-ai-300 dark:border-ai-800' :
          interviewState === InterviewState.THINKING ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800' :
          'bg-muted text-muted-foreground border-border'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            interviewState === InterviewState.LISTENING ? 'bg-blue-400 animate-pulse' : 
            interviewState === InterviewState.SPEAKING ? 'bg-purple-400 animate-pulse' :
            interviewState === InterviewState.THINKING ? 'bg-yellow-400 animate-pulse' :
            'bg-gray-400'
          }`} />
          <span>
            {interviewState === InterviewState.LISTENING ? 'Listening...' : 
             interviewState === InterviewState.SPEAKING ? 'AI Speaking...' :
             interviewState === InterviewState.THINKING ? 'Processing...' :
             'Ready'}
          </span>
        </div>
      </div>

      <main className="flex-grow flex gap-6 overflow-hidden">
        <div className="w-4/5 flex flex-col gap-4">
          <div className="flex-shrink-0 card-interactive bg-card rounded-xl p-4 flex flex-col items-center justify-center relative h-[500px] border border-border">
            {useWebGLAvatar ? (
              <WebGLAvatar interviewState={interviewState} isAudioPlaying={isAudioPlaying} />
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
          
          {/* Microphone Level Indicator */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-4 rounded-xl shadow-xl border border-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <Mic className={`w-4 h-4 ${isUserSpeaking ? 'text-green-400' : 'text-gray-400'}`} />
              <span className="text-sm text-gray-300">Microphone</span>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-100 ${
                  isUserSpeaking ? 'bg-green-400' : 'bg-blue-400'
                }`}
                style={{ width: `${Math.min(microphoneLevel * 100, 100)}%` }}
              />
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {isUserSpeaking ? '🎤 Speaking' : '🔇 Silent'} ({(microphoneLevel * 100).toFixed(0)}%)
            </div>
          </div>
          
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
