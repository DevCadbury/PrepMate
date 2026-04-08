/**
 * ResponsiveVoice Service for Indian and International Voices
 * Provides Hindi, Tamil, Bengali, and English voices using ResponsiveVoice.js
 */

// Declare ResponsiveVoice global interface
declare global {
  interface Window {
    responsiveVoice: {
      speak: (text: string, voice: string, options?: ResponsiveVoiceOptions) => void;
      cancel: () => void;
      isPlaying: () => boolean;
      voiceSupport: () => boolean;
      getVoices: () => ResponsiveVoiceInfo[];
    };
  }
}

interface ResponsiveVoiceOptions {
  pitch?: number;
  rate?: number;
  volume?: number;
  onstart?: () => void;
  onend?: () => void;
  onerror?: () => void;
}

interface ResponsiveVoiceInfo {
  name: string;
  flag: string;
  gender: string;
  voiceIDs: number[];
}

interface IndianVoiceModel {
  id: string;
  name: string;
  responsiveVoiceName: string;
  lang: string;
  country: string;
  gender: 'male' | 'female';
  description: string;
  pitch: number;
  rate: number;
  isHindi?: boolean;
  isTamil?: boolean;
  isBengali?: boolean;
}

// Comprehensive Indian voice models using ResponsiveVoice
const INDIAN_VOICE_MODELS: IndianVoiceModel[] = [
  // Hindi Voices
  {
    id: 'hi-IN-male-rajesh',
    name: 'Rajesh (Hindi Male)',
    responsiveVoiceName: 'Hindi Male',
    lang: 'hi-IN',
    country: 'India',
    gender: 'male',
    description: 'Authentic Hindi male voice with natural pronunciation',
    pitch: 0.9,
    rate: 0.85,
    isHindi: true
  },
  {
    id: 'hi-IN-female-priya',
    name: 'Priya (Hindi Female)',
    responsiveVoiceName: 'Hindi Female',
    lang: 'hi-IN',
    country: 'India',
    gender: 'female',
    description: 'Natural Hindi female voice with clear articulation',
    pitch: 1.1,
    rate: 0.85,
    isHindi: true
  },

  // Tamil Voices
  {
    id: 'ta-IN-male-kumar',
    name: 'Kumar (Tamil Male)',
    responsiveVoiceName: 'Tamil Male',
    lang: 'ta-IN',
    country: 'India',
    gender: 'male',
    description: 'Authentic Tamil male voice with traditional pronunciation',
    pitch: 0.9,
    rate: 0.85,
    isTamil: true
  },
  {
    id: 'ta-IN-female-meera',
    name: 'Meera (Tamil Female)',
    responsiveVoiceName: 'Tamil Female',
    lang: 'ta-IN',
    country: 'India',
    gender: 'female',
    description: 'Beautiful Tamil female voice with melodic tone',
    pitch: 1.1,
    rate: 0.85,
    isTamil: true
  },

  // Bengali Voices
  {
    id: 'bn-IN-male-anirban',
    name: 'Anirban (Bengali Male)',
    responsiveVoiceName: 'Bangla India Male',
    lang: 'bn-IN',
    country: 'India',
    gender: 'male',
    description: 'Authentic Bengali male voice with cultural pronunciation',
    pitch: 0.9,
    rate: 0.85,
    isBengali: true
  },
  {
    id: 'bn-IN-female-shreya',
    name: 'Shreya (Bengali Female)',
    responsiveVoiceName: 'Bangla India Female',
    lang: 'bn-IN',
    country: 'India',
    gender: 'female',
    description: 'Elegant Bengali female voice with sweet tone',
    pitch: 1.1,
    rate: 0.85,
    isBengali: true
  },

  // Indian English Voices (Enhanced)
  {
    id: 'en-IN-male-arjun',
    name: 'Arjun (Indian English Male)',
    responsiveVoiceName: 'UK English Male',
    lang: 'en-IN',
    country: 'India',
    gender: 'male',
    description: 'Professional Indian English male voice',
    pitch: 0.85,
    rate: 0.8
  },
  {
    id: 'en-IN-female-kavya',
    name: 'Kavya (Indian English Female)',
    responsiveVoiceName: 'UK English Female',
    lang: 'en-IN',
    country: 'India',
    gender: 'female',
    description: 'Clear Indian English female voice',
    pitch: 1.0,
    rate: 0.8
  },

  // US English Voices
  {
    id: 'en-US-male-david',
    name: 'David (US Male)',
    responsiveVoiceName: 'US English Male',
    lang: 'en-US',
    country: 'United States',
    gender: 'male',
    description: 'Professional American English male voice',
    pitch: 0.9,
    rate: 1.0
  },
  {
    id: 'en-US-female-sarah',
    name: 'Sarah (US Female)',
    responsiveVoiceName: 'US English Female',
    lang: 'en-US',
    country: 'United States',
    gender: 'female',
    description: 'Clear American English female voice',
    pitch: 1.0,
    rate: 1.0
  },

  // UK English Voices
  {
    id: 'en-GB-male-james',
    name: 'James (UK Male)',
    responsiveVoiceName: 'UK English Male',
    lang: 'en-GB',
    country: 'United Kingdom',
    gender: 'male',
    description: 'Distinguished British English male voice',
    pitch: 0.9,
    rate: 0.95
  },
  {
    id: 'en-GB-female-emma',
    name: 'Emma (UK Female)',
    responsiveVoiceName: 'UK English Female',
    lang: 'en-GB',
    country: 'United Kingdom',
    gender: 'female',
    description: 'Elegant British English female voice',
    pitch: 1.0,
    rate: 0.95
  }
];

class ResponsiveVoiceService {
  private isLoaded: boolean = false;
  private loadingPromise: Promise<void> | null = null;
  private currentVoice: IndianVoiceModel | null = null;

  constructor() {
    this.initializeResponsiveVoice();
  }

  // Initialize ResponsiveVoice.js
  private async initializeResponsiveVoice(): Promise<void> {
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = new Promise((resolve, reject) => {
      // Check if ResponsiveVoice is already loaded
      if (window.responsiveVoice && window.responsiveVoice.voiceSupport()) {
        this.isLoaded = true;
        console.log('✅ ResponsiveVoice already loaded');
        resolve();
        return;
      }

      // Load ResponsiveVoice script
      const script = document.createElement('script');
      script.src = 'https://code.responsivevoice.org/responsivevoice.js?key=mYd0dhU3';
      script.async = true;
      
      script.onload = () => {
        // Wait for ResponsiveVoice to be fully initialized
        const checkInit = () => {
          if (window.responsiveVoice && window.responsiveVoice.voiceSupport()) {
            this.isLoaded = true;
            console.log('✅ ResponsiveVoice loaded successfully');
            console.log(`📢 Available voices: ${window.responsiveVoice.getVoices().length}`);
            resolve();
          } else {
            setTimeout(checkInit, 100);
          }
        };
        setTimeout(checkInit, 100);
      };

      script.onerror = () => {
        console.error('❌ Failed to load ResponsiveVoice');
        reject(new Error('Failed to load ResponsiveVoice'));
      };

      document.head.appendChild(script);
    });

    return this.loadingPromise;
  }

  // Get all available voice models
  getAvailableVoices(): IndianVoiceModel[] {
    return INDIAN_VOICE_MODELS;
  }

  // Get voice model by ID
  getVoiceModel(id: string): IndianVoiceModel | undefined {
    return INDIAN_VOICE_MODELS.find(voice => voice.id === id);
  }

  // Get voices by language
  getVoicesByLanguage(lang: string): IndianVoiceModel[] {
    return INDIAN_VOICE_MODELS.filter(voice => voice.lang === lang);
  }

  // Get Hindi voices
  getHindiVoices(): IndianVoiceModel[] {
    return INDIAN_VOICE_MODELS.filter(voice => voice.isHindi);
  }

  // Get Tamil voices
  getTamilVoices(): IndianVoiceModel[] {
    return INDIAN_VOICE_MODELS.filter(voice => voice.isTamil);
  }

  // Get Bengali voices
  getBengaliVoices(): IndianVoiceModel[] {
    return INDIAN_VOICE_MODELS.filter(voice => voice.isBengali);
  }

  // Main speak function
  async speak(text: string, voiceId: string, options: {
    pitch?: number;
    rate?: number;
    volume?: number;
  } = {}): Promise<void> {
    // Ensure ResponsiveVoice is loaded
    await this.initializeResponsiveVoice();

    if (!this.isLoaded) {
      throw new Error('ResponsiveVoice not available');
    }

    const voiceModel = this.getVoiceModel(voiceId);
    if (!voiceModel) {
      throw new Error(`Voice model not found: ${voiceId}`);
    }

    // Stop any current speech
    this.stop();

    return new Promise((resolve, reject) => {
      const voiceOptions: ResponsiveVoiceOptions = {
        pitch: options.pitch ?? voiceModel.pitch,
        rate: options.rate ?? voiceModel.rate,
        volume: options.volume ?? 1.0,
        onstart: () => {
          this.currentVoice = voiceModel;
          console.log(`🔊 Speaking with ${voiceModel.name} (${voiceModel.lang})`);
        },
        onend: () => {
          this.currentVoice = null;
          console.log(`✅ Speech completed: ${voiceModel.name}`);
          resolve();
        },
        onerror: () => {
          this.currentVoice = null;
          console.error(`❌ Speech error: ${voiceModel.name}`);
          reject(new Error('Speech synthesis failed'));
        }
      };

      // Log voice selection
      const language = voiceModel.isHindi ? 'Hindi' : 
                      voiceModel.isTamil ? 'Tamil' : 
                      voiceModel.isBengali ? 'Bengali' : 'English';
      
      console.log(`🌍 Using ${language} voice: ${voiceModel.name}`);
      console.log(`🎭 ResponsiveVoice name: ${voiceModel.responsiveVoiceName}`);

      // Speak with ResponsiveVoice
      try {
        window.responsiveVoice.speak(text, voiceModel.responsiveVoiceName, voiceOptions);
      } catch (error) {
        console.error('ResponsiveVoice speak error:', error);
        reject(error);
      }
    });
  }

  // Preview voice with sample text
  async previewVoice(voiceId: string): Promise<void> {
    const voiceModel = this.getVoiceModel(voiceId);
    if (!voiceModel) {
      throw new Error(`Voice model not found: ${voiceId}`);
    }

    let previewText = '';
    const voiceName = voiceModel.name.split(' ')[0];

    // Create language-appropriate preview text
    if (voiceModel.isHindi) {
      previewText = `नमस्ते, मैं ${voiceName} हूँ।`; // "Hello, I am [Name]"
    } else if (voiceModel.isTamil) {
      previewText = `வணக்கம், நான் ${voiceName}.`; // "Hello, I am [Name]"
    } else if (voiceModel.isBengali) {
      previewText = `নমস্কার, আমি ${voiceName}।`; // "Hello, I am [Name]"
    } else if (voiceModel.country === 'India') {
      previewText = `Hello, I am ${voiceName}.`;
    } else if (voiceModel.country === 'United States') {
      previewText = `Hi, I'm ${voiceName}.`;
    } else if (voiceModel.country === 'United Kingdom') {
      previewText = `Good day, I'm ${voiceName}.`;
    } else {
      previewText = `Hello, I am ${voiceName}.`;
    }

    return this.speak(previewText, voiceId);
  }

  // Stop current speech
  stop(): void {
    if (this.isLoaded && window.responsiveVoice) {
      window.responsiveVoice.cancel();
      this.currentVoice = null;
      console.log('🛑 ResponsiveVoice speech stopped');
    }
  }

  // Check if speech is currently playing
  isPlaying(): boolean {
    return this.isLoaded && window.responsiveVoice ? window.responsiveVoice.isPlaying() : false;
  }

  // Get service status
  getStatus(): {
    loaded: boolean;
    available: boolean;
    currentVoice: string | null;
    totalVoices: number;
    hindiVoices: number;
    tamilVoices: number;
    bengaliVoices: number;
    englishVoices: number;
  } {
    const hindiVoices = this.getHindiVoices().length;
    const tamilVoices = this.getTamilVoices().length;
    const bengaliVoices = this.getBengaliVoices().length;
    const englishVoices = INDIAN_VOICE_MODELS.length - hindiVoices - tamilVoices - bengaliVoices;

    return {
      loaded: this.isLoaded,
      available: this.isLoaded && window.responsiveVoice && window.responsiveVoice.voiceSupport(),
      currentVoice: this.currentVoice ? this.currentVoice.name : null,
      totalVoices: INDIAN_VOICE_MODELS.length,
      hindiVoices,
      tamilVoices,
      bengaliVoices,
      englishVoices
    };
  }

  // Get available ResponsiveVoice voices (for debugging)
  getResponsiveVoicesList(): ResponsiveVoiceInfo[] {
    if (this.isLoaded && window.responsiveVoice) {
      return window.responsiveVoice.getVoices();
    }
    return [];
  }
}

// Export singleton instance
export const responsiveVoiceService = new ResponsiveVoiceService();
export type { IndianVoiceModel };
export { INDIAN_VOICE_MODELS };