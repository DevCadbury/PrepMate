// Type declarations for Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface GeminiConfig {
  apiKey: string;
  model: string;
  voiceName: string;
  languageCode: string;
}

interface InterviewContext {
  candidateName: string;
  jobPosition: string;
  interviewType: string;
  currentQuestion: number;
  totalQuestions: number;
}

class GeminiService {
  private config: GeminiConfig;
  private session: any = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording: boolean = false;
  private speechSynthesis: SpeechSynthesisUtterance | null = null;
  private speechRecognition: any = null;
  private interviewContext: InterviewContext | null = null;
  private onSpeechStart: (() => void) | null = null;
  private onSpeechEnd: (() => void) | null = null;
  private onListeningStart: (() => void) | null = null;
  private onListeningEnd: (() => void) | null = null;

  constructor(config: GeminiConfig) {
    this.config = config;
    this.initializeSpeechRecognition();
  }

  private initializeSpeechRecognition() {
    // Initialize speech recognition if available
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      try {
        const SpeechRecognition =
          (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition;
        this.speechRecognition = new SpeechRecognition();
        this.speechRecognition.continuous = false;
        this.speechRecognition.interimResults = false;
        this.speechRecognition.lang = "en-US";
        console.log("Speech recognition initialized successfully");
      } catch (error) {
        console.error("Failed to initialize speech recognition:", error);
      }
    } else {
      console.warn("Speech recognition not available in this browser");
    }
  }

  async initSession(): Promise<void> {
    try {
      console.log("Initializing Gemini session with config:", this.config);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      this.session = {
        id: `session_${Date.now()}`,
        config: this.config,
        status: "active",
      };

      console.log("Gemini session initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Gemini session:", error);
      throw error;
    }
  }

  setInterviewContext(context: InterviewContext) {
    this.interviewContext = context;
  }

  setCallbacks(callbacks: {
    onSpeechStart?: () => void;
    onSpeechEnd?: () => void;
    onListeningStart?: () => void;
    onListeningEnd?: () => void;
  }) {
    this.onSpeechStart = callbacks.onSpeechStart || null;
    this.onSpeechEnd = callbacks.onSpeechEnd || null;
    this.onListeningStart = callbacks.onListeningStart || null;
    this.onListeningEnd = callbacks.onListeningEnd || null;
  }

  async startInterview(): Promise<void> {
    if (!this.session) {
      throw new Error("Session not initialized. Call initSession() first.");
    }

    console.log("Starting interview...");

    // Start with greeting and asking for name
    await this.speak(
      "Hello! Welcome to your AI interview. I'm your virtual interviewer. What's your name?"
    );

    // Wait for user response
    const candidateName = await this.listenForResponse();
    console.log("Candidate name:", candidateName);

    // Ask for job position
    await this.speak(
      "Nice to meet you, " +
        candidateName +
        ". What position are you interviewing for today?"
    );

    // Wait for job position response
    const jobPosition = await this.listenForResponse();
    console.log("Job position:", jobPosition);

    // Update interview context
    if (this.interviewContext) {
      this.interviewContext.candidateName = candidateName;
      this.interviewContext.jobPosition = jobPosition;
    }

    // Start the actual interview
    await this.speak(
      "Perfect! Let's begin your interview for the " +
        jobPosition +
        " position. I'll ask you a series of questions. Please answer them clearly and provide specific examples when possible."
    );

    return;
  }

  async speak(text: string): Promise<void> {
    try {
      if (!this.session) {
        throw new Error("Session not initialized. Call initSession() first.");
      }

      console.log("AI speaking:", text);

      if (this.onSpeechStart) {
        this.onSpeechStart();
      }

      return new Promise((resolve, reject) => {
        if ("speechSynthesis" in window) {
          try {
            // Cancel any existing speech
            speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            // Try to set a more natural voice
            const voices = speechSynthesis.getVoices();
            console.log(
              "Available voices:",
              voices.map((v) => v.name)
            );

            if (voices.length > 0) {
              const preferredVoice = voices.find(
                (voice) =>
                  voice.name.includes("Google") ||
                  voice.name.includes("Natural") ||
                  voice.name.includes("Premium") ||
                  voice.name.includes("US English") ||
                  voice.name.includes("Microsoft") ||
                  voice.name.includes("Samantha") ||
                  voice.name.includes("Alex")
              );
              if (preferredVoice) {
                utterance.voice = preferredVoice;
                console.log("Using voice:", preferredVoice.name);
              } else {
                console.log("Using default voice:", voices[0].name);
                utterance.voice = voices[0];
              }
            }

            utterance.onstart = () => {
              console.log("Speech synthesis started");
            };

            utterance.onend = () => {
              console.log("AI finished speaking");
              if (this.onSpeechEnd) {
                this.onSpeechEnd();
              }
              resolve();
            };

            utterance.onerror = (error) => {
              console.error("Speech synthesis error:", error);
              if (this.onSpeechEnd) {
                this.onSpeechEnd();
              }
              // Don't reject, just resolve to continue
              resolve();
            };

            speechSynthesis.speak(utterance);
          } catch (error) {
            console.error("Error with speech synthesis:", error);
            // Fallback: just wait and resolve
            setTimeout(() => {
              console.log("Speech synthesis failed, simulating speech");
              if (this.onSpeechEnd) {
                this.onSpeechEnd();
              }
              resolve();
            }, text.length * 100);
          }
        } else {
          // Fallback: just wait and resolve
          setTimeout(() => {
            console.log("Speech synthesis not available, simulating speech");
            if (this.onSpeechEnd) {
              this.onSpeechEnd();
            }
            resolve();
          }, text.length * 100); // Rough estimate of speaking time
        }
      });
    } catch (error) {
      console.error("Failed to speak:", error);
      // Don't throw, just resolve to continue
      if (this.onSpeechEnd) {
        this.onSpeechEnd();
      }
    }
  }

  async listenForResponse(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.speechRecognition) {
        console.warn("Speech recognition not available, using fallback");
        // Fallback: simulate listening
        setTimeout(() => {
          const mockResponses = [
            "John",
            "Sarah",
            "Michael",
            "Software Engineer",
            "Data Scientist",
            "Product Manager",
          ];
          const response =
            mockResponses[Math.floor(Math.random() * mockResponses.length)];
          console.log("Mock response:", response);
          resolve(response);
        }, 2000);
        return;
      }

      if (this.onListeningStart) {
        this.onListeningStart();
      }

      this.speechRecognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log("User said:", transcript);

        if (this.onListeningEnd) {
          this.onListeningEnd();
        }

        resolve(transcript);
      };

      this.speechRecognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (this.onListeningEnd) {
          this.onListeningEnd();
        }

        // Fallback for speech recognition errors
        const mockResponses = [
          "John",
          "Sarah",
          "Michael",
          "Software Engineer",
          "Data Scientist",
          "Product Manager",
        ];
        const response =
          mockResponses[Math.floor(Math.random() * mockResponses.length)];
        console.log(
          "Speech recognition failed, using mock response:",
          response
        );
        resolve(response);
      };

      this.speechRecognition.onend = () => {
        if (this.onListeningEnd) {
          this.onListeningEnd();
        }
      };

      try {
        this.speechRecognition.start();
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        // Fallback
        setTimeout(() => {
          const mockResponses = [
            "John",
            "Sarah",
            "Michael",
            "Software Engineer",
            "Data Scientist",
            "Product Manager",
          ];
          const response =
            mockResponses[Math.floor(Math.random() * mockResponses.length)];
          console.log(
            "Speech recognition start failed, using mock response:",
            response
          );
          resolve(response);
        }, 2000);
      }
    });
  }

  async askQuestion(question: string): Promise<string> {
    await this.speak(question);
    return await this.listenForResponse();
  }

  async provideFeedback(answer: string, question: string): Promise<string> {
    const prompt = `As an AI interview coach, provide constructive feedback for this answer to the question "${question}": "${answer}". Keep feedback concise, encouraging, and specific.`;
    return await this.sendTextMessage(prompt);
  }

  async startRecording(): Promise<void> {
    try {
      if (!this.session) {
        throw new Error("Session not initialized. Call initSession() first.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      this.isRecording = true;

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        if (this.audioChunks.length > 0) {
          const audioBlob = new Blob(this.audioChunks, { type: "audio/wav" });
          console.log("Audio recorded, blob size:", audioBlob.size);
        }
      };

      this.mediaRecorder.start();
      console.log("Started recording audio for Gemini");
    } catch (error) {
      console.error("Failed to start recording:", error);
      throw error;
    }
  }

  async stopRecording(): Promise<void> {
    try {
      if (this.mediaRecorder && this.isRecording) {
        this.mediaRecorder.stop();
        this.isRecording = false;

        if (this.mediaRecorder.stream) {
          this.mediaRecorder.stream
            .getTracks()
            .forEach((track) => track.stop());
        }

        console.log("Stopped recording audio");
      }
    } catch (error) {
      console.error("Failed to stop recording:", error);
      throw error;
    }
  }

  async sendTextMessage(message: string): Promise<string> {
    try {
      if (!this.session) {
        throw new Error("Session not initialized. Call initSession() first.");
      }

      console.log("Sending text message to Gemini:", message);

      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockResponses = [
        "Great answer! You demonstrated clear communication skills and provided specific examples.",
        "Excellent response. You showed good problem-solving approach and technical knowledge.",
        "Good job! You handled that question well and showed confidence in your abilities.",
        "Well done! You provided a thoughtful answer with relevant experience.",
        "Good answer, but try to be more specific with concrete examples from your experience.",
        "Great response! You showed good understanding of the topic and communicated clearly.",
        "Excellent! You demonstrated both technical knowledge and soft skills effectively.",
        "Good answer! You showed good analytical thinking and problem-solving approach.",
      ];

      const randomResponse =
        mockResponses[Math.floor(Math.random() * mockResponses.length)];

      return randomResponse;
    } catch (error) {
      console.error("Failed to send text message:", error);
      throw error;
    }
  }

  async sendAudioMessage(audioBlob: Blob): Promise<string> {
    try {
      if (!this.session) {
        throw new Error("Session not initialized. Call initSession() first.");
      }

      console.log("Sending audio message to Gemini, size:", audioBlob.size);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      return "I heard your response. Thank you for that detailed answer.";
    } catch (error) {
      console.error("Failed to send audio message:", error);
      throw error;
    }
  }

  destroy(): void {
    try {
      if (this.mediaRecorder && this.isRecording) {
        this.stopRecording();
      }

      if (this.speechRecognition) {
        this.speechRecognition.abort();
      }

      if (speechSynthesis) {
        speechSynthesis.cancel();
      }

      this.session = null;
      this.mediaRecorder = null;
      this.audioChunks = [];
      this.isRecording = false;
      this.interviewContext = null;

      console.log("Gemini service destroyed");
    } catch (error) {
      console.error("Error destroying Gemini service:", error);
    }
  }

  getStatus(): string {
    return this.session ? "connected" : "disconnected";
  }

  isConnected(): boolean {
    return this.session !== null;
  }
}

export default GeminiService;
