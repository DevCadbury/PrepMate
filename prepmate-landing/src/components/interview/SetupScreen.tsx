import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Badge } from "../ui/badge";
import { Settings, Volume2, Key, User, Briefcase, Play, Pause, CheckCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { aiCompanionService, VoiceModel, AICompanionSettings } from "../../services/aiCompanionService";
import { ttsService } from "../../services/ttsService";
import { voicePackService } from "../../services/voicePackService";
import SystemStatusCheck from "./SystemStatusCheck";

interface SetupScreenProps {
  onStart: (name: string, role: string, apiKey: string, voiceModel: string) => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onStart }) => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [selectedVoiceModel, setSelectedVoiceModel] = useState("en-IN-female-1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voiceModels, setVoiceModels] = useState<VoiceModel[]>([]);
  const [settings, setSettings] = useState<AICompanionSettings | null>(null);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKeyError, setApiKeyError] = useState("");
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState<string | null>(null);
  const [showSystemCheck, setShowSystemCheck] = useState(false);

  // Auto-detect user name and load settings
  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
    loadInitialData();
  }, [user]);

  // Enhanced voice mapping helper function with comprehensive fallbacks
  const mapVoiceModelToBrowserVoice = (voiceModel: VoiceModel) => {
    const voices = speechSynthesis.getVoices();
    
    // Comprehensive voice mapping with multiple fallback options for all new voice models
    const voiceMap: Record<string, string[]> = {
      // Indian Female Voices
      "en-IN-female-aria": [
        "Microsoft Heera - English (India)", "Heera", "English (India)", 
        "Microsoft Zira Desktop - English (India)", "India", "Aria",
        "en-IN", "en-US", "en-GB"
      ],
      "en-IN-female-kavya": [
        "Microsoft Heera - English (India)", "Heera", "English (India)", 
        "Microsoft Zira Desktop - English (India)", "India", "Kavya",
        "en-IN", "en-US", "en-GB"
      ],
      "en-IN-female-priya": [
        "Microsoft Heera - English (India)", "Heera", "English (India)", 
        "Microsoft Zira Desktop - English (India)", "India", "Priya",
        "en-IN", "en-US", "en-GB"
      ],
      "en-IN-female-shreya": [
        "Microsoft Heera - English (India)", "Heera", "English (India)", 
        "Microsoft Zira Desktop - English (India)", "India", "Shreya",
        "en-IN", "en-US", "en-GB"
      ],
      
      // Indian Male Voices
      "en-IN-male-arjun": [
        "Microsoft Ravi - English (India)", "Ravi", "English (India)",
        "Microsoft Mark Desktop - English (India)", "India", "Arjun",
        "en-IN", "en-US", "en-GB"
      ],
      "en-IN-male-vikram": [
        "Microsoft Ravi - English (India)", "Ravi", "English (India)",
        "Microsoft Mark Desktop - English (India)", "India", "Vikram",
        "en-IN", "en-US", "en-GB"
      ],
      "en-IN-male-rohit": [
        "Microsoft Ravi - English (India)", "Ravi", "English (India)",
        "Microsoft Mark Desktop - English (India)", "India", "Rohit",
        "en-IN", "en-US", "en-GB"
      ],
      "en-IN-male-aditya": [
        "Microsoft Ravi - English (India)", "Ravi", "English (India)",
        "Microsoft Mark Desktop - English (India)", "India", "Aditya",
        "en-IN", "en-US", "en-GB"
      ],
      
      // US Voices
      "en-US-female-sarah": [
        "Microsoft Zira - English (United States)", "Zira", "Google US English",
        "Microsoft Eva Desktop - English (United States)", "Samantha", "Victoria", "Sarah",
        "en-US", "en-GB"
      ],
      "en-US-male-david": [
        "Microsoft David - English (United States)", "David", "Google US English",
        "Microsoft Mark Desktop - English (United States)", "Alex", "Daniel",
        "en-US", "en-GB"
      ],
      
      // UK Voices
      "en-GB-female-emma": [
        "Microsoft Hazel - English (Great Britain)", "Hazel", "Google UK English Female",
        "Microsoft Susan Desktop - English (Great Britain)", "Kate", "Serena", "Emma",
        "en-GB", "en-US"
      ],
      "en-GB-male-oliver": [
        "Microsoft George - English (Great Britain)", "George", "Google UK English Male",
        "Microsoft Ryan Desktop - English (Great Britain)", "Oliver", "Daniel",
        "en-GB", "en-US"
      ],
      
      // Legacy support for old IDs
      "en-IN-female-1": [
        "Microsoft Heera - English (India)", "Heera", "English (India)", 
        "Microsoft Zira Desktop - English (India)", "India",
        "en-IN", "en-US", "en-GB"
      ],
      "en-IN-male-1": [
        "Microsoft Ravi - English (India)", "Ravi", "English (India)",
        "Microsoft Mark Desktop - English (India)", "India",
        "en-IN", "en-US", "en-GB"
      ],
      "en-US-female-1": [
        "Microsoft Zira - English (United States)", "Zira", "Google US English",
        "Microsoft Eva Desktop - English (United States)", "Samantha", "Victoria",
        "en-US", "en-GB"
      ],
      "en-US-male-1": [
        "Microsoft David - English (United States)", "David", "Google US English",
        "Microsoft Mark Desktop - English (United States)", "Alex", "Daniel",
        "en-US", "en-GB"
      ],
      "en-GB-female-1": [
        "Microsoft Hazel - English (Great Britain)", "Hazel", "Google UK English Female",
        "Microsoft Susan Desktop - English (Great Britain)", "Kate", "Serena",
        "en-GB", "en-US"
      ],
      "en-GB-male-1": [
        "Microsoft George - English (Great Britain)", "George", "Google UK English Male",
        "Microsoft Ryan Desktop - English (Great Britain)", "Oliver", "Daniel",
        "en-GB", "en-US"
      ]
    };

    const preferredOptions = voiceMap[voiceModel.id] || [voiceModel.lang];
    
    // Strategy 1: Exact name matching
    for (const option of preferredOptions) {
      const voice = voices.find(v => v.name.includes(option));
      if (voice) {
        console.log(`Voice found (exact): ${voiceModel.name} -> ${voice.name}`);
        return voice;
      }
    }
    
    // Strategy 2: Language code matching
    for (const option of preferredOptions) {
      if (option.includes('-')) { // This is a language code
        const voice = voices.find(v => v.lang === option);
        if (voice) {
          console.log(`Voice found (lang): ${voiceModel.name} -> ${voice.name}`);
          return voice;
        }
      }
    }
    
    // Strategy 3: Partial language matching with gender preference
    const targetLang = voiceModel.lang.split('-')[0]; // Get base language (e.g., 'en' from 'en-IN')
    const genderKeywords = voiceModel.gender === 'female' 
      ? ['female', 'woman', 'zira', 'hazel', 'heera', 'eva', 'susan', 'kate', 'serena', 'samantha', 'victoria']
      : ['male', 'man', 'david', 'george', 'ravi', 'mark', 'ryan', 'oliver', 'alex', 'daniel'];
    
    const langVoices = voices.filter(v => v.lang.startsWith(targetLang));
    for (const keyword of genderKeywords) {
      const voice = langVoices.find(v => v.name.toLowerCase().includes(keyword));
      if (voice) {
        console.log(`Voice found (gender): ${voiceModel.name} -> ${voice.name}`);
        return voice;
      }
    }
    
    // Strategy 4: Any voice in target language
    if (langVoices.length > 0) {
      console.log(`Voice found (fallback): ${voiceModel.name} -> ${langVoices[0].name}`);
      return langVoices[0];
    }
    
    // Strategy 5: Any English voice
    const englishVoices = voices.filter(v => v.lang.startsWith('en'));
    if (englishVoices.length > 0) {
      console.log(`Voice found (english): ${voiceModel.name} -> ${englishVoices[0].name}`);
      return englishVoices[0];
    }
    
    // Strategy 6: System default voice
    if (voices.length > 0) {
      console.log(`Voice found (default): ${voiceModel.name} -> ${voices[0].name}`);
      return voices[0];
    }
    
    console.warn(`No voice found for: ${voiceModel.name}`);
    return null;
  };

  // Test voice function with enhanced voice conflict prevention
  const testVoice = async (voiceModel: VoiceModel) => {
    try {
      // CRITICAL: Stop ALL voice services immediately to prevent conflicts
      console.log('🛑 Stopping all voice services before test...');
      speechSynthesis.cancel();
      ttsService.stop();
      voicePackService.stopAll();
      
      // If clicking the same voice that's playing, just stop
      if (isPlayingVoice === voiceModel.id) {
        setIsPlayingVoice(null);
        console.log('🔄 Stopping current voice test');
        return;
      }

      // Wait a moment to ensure all audio is stopped
      await new Promise(resolve => setTimeout(resolve, 200));

      setIsPlayingVoice(voiceModel.id);
      console.log(`🔊 Testing voice: ${voiceModel.name} (${voiceModel.country})`);

      // Use voice pack service for preview (which has short, accent-appropriate greetings)
      try {
        await voicePackService.previewVoicePack(voiceModel.id);
        console.log(`✅ Voice test completed: ${voiceModel.name} with ${voiceModel.country} accent`);
      } catch (voicePackError) {
        console.log('Voice pack preview failed, using fallback TTS:', voicePackError);
        
        // Fallback with country-appropriate greeting
        let testText = '';
        const voiceName = voiceModel.name.split(' ')[0];
        
        if (voiceModel.country === 'India') {
          testText = `Hello, I am ${voiceName}.`; // Simple for Indian accent
        } else if (voiceModel.country === 'United States') {
          testText = `Hi, I'm ${voiceName}.`; // American style
        } else if (voiceModel.country === 'United Kingdom') {
          testText = `Good day, I'm ${voiceName}.`; // British style
        } else {
          testText = `Hello, I am ${voiceName}.`;
        }
        
        const voiceOptions = {
          rate: voiceModel.country === 'India' ? 0.85 : 0.9, // Slower for Indian accent clarity
          pitch: voiceModel.gender === 'female' ? 1.0 : 0.9,
          volume: 1.0
        };

        await ttsService.speak(testText, voiceModel.id, voiceOptions);
        console.log(`✅ Fallback voice test completed: ${voiceModel.name}`);
      }
      
      setIsPlayingVoice(null);

    } catch (error) {
      console.error('Voice test error:', error);
      setIsPlayingVoice(null);
      
      // Fallback to original speech synthesis if available
      try {
        const voice = mapVoiceModelToBrowserVoice(voiceModel);
        if (voice) {
          const testText = `Hello! I'm ${voiceModel.name.split(' ')[0]}, using fallback voice.`;
          const utterance = new SpeechSynthesisUtterance(testText);
          utterance.voice = voice;
          utterance.rate = 0.9;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;
          
          utterance.onend = () => setIsPlayingVoice(null);
          speechSynthesis.speak(utterance);
          console.log(`🔊 Playing fallback voice: ${voice.name}`);
        } else {
          // Show TTS service voice status
          const status = ttsService.getVoiceStatus();
          alert(`Voice "${voiceModel.name}" testing failed, but don't worry! The system has ${status.totalVoices} voices available including ${status.fallbackVoicesCount} built-in fallback voices that work without language packs.`);
        }
      } catch (fallbackError) {
        console.error('Fallback voice test error:', fallbackError);
        const status = ttsService.getVoiceStatus();
        alert(`Voice preview unavailable, but the interview system has ${status.totalVoices} voices ready including built-in fallbacks.`);
      }
    }
  };

  const loadInitialData = async () => {
    try {
      // Load voice packs first to ensure they're available
      await voicePackService.loadVoicePacks();
      
      // Get bundled voice packs and convert to VoiceModel format
      const voicePacksData = voicePackService.getAvailableVoicePacks();
      const voiceModelsData: VoiceModel[] = voicePacksData.map(pack => ({
        id: pack.id,
        name: pack.name,
        lang: pack.lang,
        gender: pack.gender,
        country: pack.country
      }));

      // Try to load settings from backend
      let settingsData;
      try {
        settingsData = await aiCompanionService.getSettings();
      } catch (settingsError) {
        console.warn("Could not load settings from backend, using defaults:", settingsError);
        settingsData = {
          selectedVoiceModel: "en-IN-female-aria", // Default to Aria
          voicePreferences: { rate: 1.0, pitch: 1.0, volume: 1.0 },
          hasApiKey: false,
          isApiKeyValid: false
        };
      }
      
      setVoiceModels(voiceModelsData);
      setSettings(settingsData);
      
      // Ensure selected voice model exists in our voice packs
      const selectedModel = settingsData.selectedVoiceModel;
      if (voiceModelsData.find(v => v.id === selectedModel)) {
        setSelectedVoiceModel(selectedModel);
        console.log(`📍 Using saved voice model: ${selectedModel}`);
      } else {
        // Fallback to first Indian female voice (prefer Hindi if available)
        const fallbackVoice = voiceModelsData.find(v => v.id.startsWith('hi-IN') && v.gender === 'female') ||
                             voiceModelsData.find(v => v.country === 'India' && v.gender === 'female') || 
                             voiceModelsData[0];
        setSelectedVoiceModel(fallbackVoice.id);
        console.log(`🔄 Backend voice model not found, using fallback: ${fallbackVoice.id}`);
      }
      
      setShowApiKeyInput(!settingsData.hasApiKey || !settingsData.isApiKeyValid);
      
      console.log(`✅ Loaded ${voiceModelsData.length} voice models from voice pack service`);
    } catch (error) {
      console.error("Error loading initial data:", error);
      // Ultimate fallback with comprehensive Indian voices
      const fallbackVoices: VoiceModel[] = [
        { id: "en-IN-female-aria", name: "Aria (Indian Female)", lang: "en-IN", gender: "female", country: "India" },
        { id: "en-IN-female-kavya", name: "Kavya (Indian Female)", lang: "en-IN", gender: "female", country: "India" },
        { id: "en-IN-female-priya", name: "Priya (Indian Female)", lang: "en-IN", gender: "female", country: "India" },
        { id: "en-IN-female-shreya", name: "Shreya (Indian Female)", lang: "en-IN", gender: "female", country: "India" },
        { id: "en-IN-male-arjun", name: "Arjun (Indian Male)", lang: "en-IN", gender: "male", country: "India" },
        { id: "en-IN-male-vikram", name: "Vikram (Indian Male)", lang: "en-IN", gender: "male", country: "India" },
        { id: "en-IN-male-rohit", name: "Rohit (Indian Male)", lang: "en-IN", gender: "male", country: "India" },
        { id: "en-IN-male-aditya", name: "Aditya (Indian Male)", lang: "en-IN", gender: "male", country: "India" },
        { id: "en-US-female-sarah", name: "Sarah (US Female)", lang: "en-US", gender: "female", country: "United States" },
        { id: "en-US-male-david", name: "David (US Male)", lang: "en-US", gender: "male", country: "United States" },
        { id: "en-GB-female-emma", name: "Emma (UK Female)", lang: "en-GB", gender: "female", country: "United Kingdom" },
        { id: "en-GB-male-oliver", name: "Oliver (UK Male)", lang: "en-GB", gender: "male", country: "United Kingdom" }
      ];
      setVoiceModels(fallbackVoices);
      setSelectedVoiceModel("en-IN-female-aria");
      setShowApiKeyInput(true);
    }
  };

  const handleApiKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setIsValidatingKey(true);
    setApiKeyError("");
    
    try {
      await aiCompanionService.setApiKey(apiKey.trim());
      setShowApiKeyInput(false);
      setSettings(prev => prev ? { ...prev, hasApiKey: true, isApiKeyValid: true } : null);
    } catch (error: any) {
      setApiKeyError(error.message || "Invalid API key");
    } finally {
      setIsValidatingKey(false);
    }
  };

  const handleVoiceModelChange = async (voiceModelId: string) => {
    // Stop any current voice immediately
    speechSynthesis.cancel();
    setIsPlayingVoice(null);
    
    // Always update the frontend state first
    setSelectedVoiceModel(voiceModelId);
    
    try {
      // Try to update backend, but don't fail if it doesn't support new voice models
      await aiCompanionService.updateVoiceModel(voiceModelId);
      console.log(`✅ Backend updated with voice model: ${voiceModelId}`);
    } catch (error) {
      // Log the error but don't prevent voice selection from working
      console.warn(`⚠️ Backend doesn't support voice model: ${voiceModelId}. Using frontend-only selection.`, error);
    }
    
    // Auto-test new voice for preview
    const selectedVoice = voiceModels.find(v => v.id === voiceModelId);
    if (selectedVoice) {
      setTimeout(() => {
        testVoice(selectedVoice);
      }, 100);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && role.trim() && settings?.hasApiKey && settings?.isApiKeyValid) {
      setIsSubmitting(true);
      onStart(name.trim(), role.trim(), "", selectedVoiceModel);
    }
  };

  if (showApiKeyInput) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <Card className="card-interactive bg-card shadow-lg border border-border">
            <CardHeader className="text-center pb-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center shadow-sm">
                <Key className="w-8 h-8 text-amber-600" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                API Key Required
              </h1>
              <p className="text-muted-foreground">
                Please set your Gemini API key to continue
              </p>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleApiKeySubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="apiKey"
                    className="block text-sm font-medium text-muted-foreground mb-2"
                  >
                    Google Gemini API Key
                  </label>
                  <Input
                    type="password"
                    id="apiKey"
                    value={apiKey}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setApiKey(e.target.value);
                      setApiKeyError("");
                    }}
                    required
                    className="w-full bg-background border-border text-foreground placeholder-muted-foreground focus:ring-ai-500"
                    placeholder="Enter your API key"
                  />
                  {apiKeyError && (
                    <p className="text-destructive text-xs mt-1">{apiKeyError}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Get your API key from{" "}
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ai-600 hover:underline"
                    >
                      Google AI Studio
                    </a>
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={!apiKey || isValidatingKey}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transform hover:scale-105"
                >
                  {isValidatingKey ? "Validating..." : "Save API Key"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        <Card className="card-interactive bg-card shadow-lg border border-border">
          <CardHeader className="text-center pb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-ai-50 dark:bg-ai-900/30 flex items-center justify-center shadow-sm">
              <div className="text-3xl font-bold text-ai-600 dark:text-ai-400">AI</div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome to PrepMate
            </h1>
            <p className="text-muted-foreground">
              {user?.name ? `Welcome back, ${user.name}!` : "Let's get your personalized AI interview ready."}
            </p>
            
            {settings?.hasApiKey && settings?.isApiKeyValid && (
              <div className="mt-4">
                <Badge variant="success">
                  <Key className="w-3 h-3 mr-1" />
                  API Key Configured
                </Badge>
              </div>
            )}
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-foreground mb-2 flex items-center"
                >
                  <User className="w-4 h-4 mr-2" />
                  What is your name?
                </label>
                <Input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setName(e.target.value)
                  }
                  required
                  className="w-full bg-background border-border text-foreground placeholder-muted-foreground focus:ring-ai-500"
                  placeholder="e.g., Priya Sharma"
                />
                {user?.name && (
                  <p className="text-xs text-ai-600 mt-1">
                    Auto-detected from your profile
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-foreground mb-2 flex items-center"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  What role are you interviewing for?
                </label>
                <Input
                  type="text"
                  id="role"
                  value={role}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setRole(e.target.value)
                  }
                  required
                  className="w-full bg-background border-border text-foreground placeholder-muted-foreground focus:ring-ai-500"
                  placeholder="e.g., Senior Frontend Engineer"
                />
              </div>

              <div>
                <label
                  htmlFor="voiceModel"
                  className="block text-sm font-medium text-foreground mb-2 flex items-center"
                >
                  <Volume2 className="w-4 h-4 mr-2" />
                  Select AI Voice
                </label>
                
                <div className="space-y-3">
                  {voiceModels.map((voice) => (
                    <div
                      key={voice.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedVoiceModel === voice.id
                          ? "bg-ai-50 dark:bg-ai-900/20 border-ai-500"
                          : "bg-background border-border hover:border-muted-foreground"
                      }`}
                      onClick={() => handleVoiceModelChange(voice.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-4 h-4 rounded-full border-2 ${
                              selectedVoiceModel === voice.id
                                ? "bg-ai-500 border-ai-500"
                                : "border-muted-foreground"
                            }`}
                          />
                          <div>
                            <div className="text-foreground font-medium">{voice.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {voice.country} • {voice.gender} • {voice.lang}
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            testVoice(voice);
                          }}
                          className="text-ai-600 hover:text-ai-700 hover:bg-ai-100 dark:hover:bg-ai-900/30"
                          disabled={isPlayingVoice === voice.id}
                        >
                          {isPlayingVoice === voice.id ? (
                            <>
                              <Pause className="w-4 h-4 mr-1" />
                              Stop
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-1" />
                              Test
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <p className="text-xs text-gray-500 mt-2">
                  Click "Test" to preview how each voice sounds during interviews
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowApiKeyInput(true)}
                    className="text-muted-foreground hover:text-foreground flex items-center"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Change API Key
                  </Button>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowSystemCheck(true)}
                    className="text-muted-foreground hover:text-foreground flex items-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    System Check
                  </Button>
                </div>
                
                <Button
                  type="submit"
                  disabled={!name || !role || !settings?.hasApiKey || !settings?.isApiKeyValid || isSubmitting}
                  className="bg-ai-600 hover:bg-ai-700 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transform hover:scale-105"
                >
                  {isSubmitting ? "Initializing..." : "Start Interview"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      
      {showSystemCheck && (
        <SystemStatusCheck onClose={() => setShowSystemCheck(false)} />
      )}
    </div>
  );
};

export default SetupScreen;
