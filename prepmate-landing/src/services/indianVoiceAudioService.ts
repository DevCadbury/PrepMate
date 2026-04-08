/**
 * Indian Voice Audio Service
 * Provides authentic Indian English voices using Google Cloud Text-to-Speech API
 * Supports multiple Indian accents and voice models
 */

interface IndianVoiceConfig {
  id: string;
  name: string;
  voiceName: string; // Google Cloud TTS voice name
  languageCode: string;
  gender: 'MALE' | 'FEMALE';
  ssmlGender: string;
  pitch: number;
  speakingRate: number;
  volumeGainDb: number;
  description: string;
}

// Comprehensive Indian voice configurations
const INDIAN_VOICES: IndianVoiceConfig[] = [
  // Indian Female Voices
  {
    id: 'en-IN-female-aria',
    name: 'Aria (Indian Female)',
    voiceName: 'en-IN-Wavenet-A',
    languageCode: 'en-IN',
    gender: 'FEMALE',
    ssmlGender: 'FEMALE',
    pitch: 1.0,
    speakingRate: 0.95,
    volumeGainDb: 0.0,
    description: 'Professional Indian English female voice with clear pronunciation'
  },
  {
    id: 'en-IN-female-kavya',
    name: 'Kavya (Indian Female)',
    voiceName: 'en-IN-Wavenet-D',
    languageCode: 'en-IN',
    gender: 'FEMALE',
    ssmlGender: 'FEMALE',
    pitch: 0.8,
    speakingRate: 0.92,
    volumeGainDb: 1.0,
    description: 'Warm Indian English female voice with excellent clarity'
  },
  {
    id: 'en-IN-female-priya',
    name: 'Priya (Indian Female)',
    voiceName: 'en-IN-Standard-A',
    languageCode: 'en-IN',
    gender: 'FEMALE',
    ssmlGender: 'FEMALE',
    pitch: 1.2,
    speakingRate: 0.90,
    volumeGainDb: 0.5,
    description: 'Elegant Indian English female voice with smooth pronunciation'
  },
  {
    id: 'en-IN-female-shreya',
    name: 'Shreya (Indian Female)',
    voiceName: 'en-IN-Standard-D',
    languageCode: 'en-IN',
    gender: 'FEMALE',
    ssmlGender: 'FEMALE',
    pitch: 0.9,
    speakingRate: 0.88,
    volumeGainDb: 0.0,
    description: 'Sophisticated Indian English female voice with perfect articulation'
  },

  // Indian Male Voices
  {
    id: 'en-IN-male-arjun',
    name: 'Arjun (Indian Male)',
    voiceName: 'en-IN-Wavenet-B',
    languageCode: 'en-IN',
    gender: 'MALE',
    ssmlGender: 'MALE',
    pitch: -1.0,
    speakingRate: 0.93,
    volumeGainDb: 0.0,
    description: 'Professional Indian English male voice with natural accent'
  },
  {
    id: 'en-IN-male-vikram',
    name: 'Vikram (Indian Male)',
    voiceName: 'en-IN-Wavenet-C',
    languageCode: 'en-IN',
    gender: 'MALE',
    ssmlGender: 'MALE',
    pitch: -1.5,
    speakingRate: 0.90,
    volumeGainDb: 1.0,
    description: 'Confident Indian English male voice with excellent pronunciation'
  },
  {
    id: 'en-IN-male-rohit',
    name: 'Rohit (Indian Male)',
    voiceName: 'en-IN-Standard-B',
    languageCode: 'en-IN',
    gender: 'MALE',
    ssmlGender: 'MALE',
    pitch: -0.8,
    speakingRate: 0.88,
    volumeGainDb: 0.5,
    description: 'Warm Indian English male voice with smooth articulation'
  },
  {
    id: 'en-IN-male-aditya',
    name: 'Aditya (Indian Male)',
    voiceName: 'en-IN-Standard-C',
    languageCode: 'en-IN',
    gender: 'MALE',
    ssmlGender: 'MALE',
    pitch: -1.2,
    speakingRate: 0.95,
    volumeGainDb: 0.0,
    description: 'Dynamic Indian English male voice with clear diction'
  },

  // US Voices
  {
    id: 'en-US-female-sarah',
    name: 'Sarah (US Female)',
    voiceName: 'en-US-Wavenet-C',
    languageCode: 'en-US',
    gender: 'FEMALE',
    ssmlGender: 'FEMALE',
    pitch: 0.5,
    speakingRate: 1.0,
    volumeGainDb: 0.0,
    description: 'Clear American English female voice with professional tone'
  },
  {
    id: 'en-US-male-david',
    name: 'David (US Male)',
    voiceName: 'en-US-Wavenet-D',
    languageCode: 'en-US',
    gender: 'MALE',
    ssmlGender: 'MALE',
    pitch: -1.0,
    speakingRate: 1.0,
    volumeGainDb: 0.0,
    description: 'Professional American English male voice with confident delivery'
  },

  // UK Voices
  {
    id: 'en-GB-female-emma',
    name: 'Emma (UK Female)',
    voiceName: 'en-GB-Wavenet-A',
    languageCode: 'en-GB',
    gender: 'FEMALE',
    ssmlGender: 'FEMALE',
    pitch: 0.8,
    speakingRate: 0.95,
    volumeGainDb: 0.0,
    description: 'Elegant British English female voice with sophisticated accent'
  },
  {
    id: 'en-GB-male-oliver',
    name: 'Oliver (UK Male)',
    voiceName: 'en-GB-Wavenet-B',
    languageCode: 'en-GB',
    gender: 'MALE',
    ssmlGender: 'MALE',
    pitch: -1.2,
    speakingRate: 0.95,
    volumeGainDb: 0.0,
    description: 'Professional British English male voice with distinguished accent'
  }
];

class IndianVoiceAudioService {
  private apiKey: string = '';
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private currentAudio: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;

  // Initialize with API key
  setApiKey(key: string) {
    this.apiKey = key;
  }

  // Get all available Indian voices
  getAvailableVoices(): IndianVoiceConfig[] {
    return INDIAN_VOICES;
  }

  // Get specific voice configuration
  getVoiceConfig(voiceId: string): IndianVoiceConfig | undefined {
    return INDIAN_VOICES.find(v => v.id === voiceId);
  }

  // Main speak function using Google Cloud TTS
  async speak(text: string, voiceId: string, options: {
    rate?: number;
    pitch?: number;
    volume?: number;
  } = {}): Promise<void> {
    const voiceConfig = this.getVoiceConfig(voiceId);
    if (!voiceConfig) {
      throw new Error(`Voice configuration not found for: ${voiceId}`);
    }

    // CRITICAL: Stop ALL audio sources to prevent conflicts
    this.stop();
    
    // Also stop any other speech synthesis that might be running
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    
    // Small delay to ensure everything is stopped
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      // Try Google Cloud TTS first (requires API key)
      if (this.apiKey) {
        console.log(`🇮🇳 Using Google TTS for ${voiceConfig.languageCode} accent: ${voiceConfig.name}`);
        await this.speakWithGoogleTTS(text, voiceConfig, options);
      } else {
        // Fallback to enhanced browser voices with accent simulation
        console.log(`🔊 Using enhanced browser voice for ${voiceConfig.languageCode} accent: ${voiceConfig.name}`);
        await this.speakWithEnhancedBrowserVoice(text, voiceConfig, options);
      }
    } catch (error) {
      console.error('Error in voice synthesis:', error);
      // Ultimate fallback
      await this.speakWithEnhancedBrowserVoice(text, voiceConfig, options);
    }
  }

  // Google Cloud TTS implementation for authentic Indian voices
  private async speakWithGoogleTTS(
    text: string, 
    voiceConfig: IndianVoiceConfig,
    options: { rate?: number; pitch?: number; volume?: number }
  ): Promise<void> {
    const apiUrl = 'https://texttospeech.googleapis.com/v1/text:synthesize';
    
    const requestBody = {
      input: { text },
      voice: {
        languageCode: voiceConfig.languageCode,
        name: voiceConfig.voiceName,
        ssmlGender: voiceConfig.ssmlGender
      },
      audioConfig: {
        audioEncoding: 'MP3',
        pitch: options.pitch !== undefined ? options.pitch : voiceConfig.pitch,
        speakingRate: options.rate !== undefined ? options.rate : voiceConfig.speakingRate,
        volumeGainDb: voiceConfig.volumeGainDb
      }
    };

    console.log(`🔊 Synthesizing with Google TTS: ${voiceConfig.name}`);

    const response = await fetch(`${apiUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Google TTS API error: ${response.statusText}`);
    }

    const data = await response.json();
    const audioContent = data.audioContent;

    // Create and play audio from base64 data
    return new Promise((resolve, reject) => {
      const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
      audio.volume = options.volume !== undefined ? options.volume : 1.0;
      
      this.currentAudio = audio;
      this.isPlaying = true;

      audio.onended = () => {
        this.isPlaying = false;
        this.currentAudio = null;
        console.log(`✅ Google TTS completed: ${voiceConfig.name}`);
        resolve();
      };

      audio.onerror = (error) => {
        this.isPlaying = false;
        this.currentAudio = null;
        reject(error);
      };

      audio.play();
    });
  }

  // Enhanced browser voice with Indian accent simulation
  private async speakWithEnhancedBrowserVoice(
    text: string,
    voiceConfig: IndianVoiceConfig,
    options: { rate?: number; pitch?: number; volume?: number }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Get browser voices
      const voices = speechSynthesis.getVoices();
      
      // Enhanced voice matching based on language code
      let selectedVoice = null;
      
      if (voiceConfig.languageCode === 'en-IN') {
        // Strategy 1: Find actual Indian English voices
        selectedVoice = voices.find(v => 
          v.lang === 'en-IN' || 
          v.name.toLowerCase().includes('india') ||
          v.name.toLowerCase().includes('indian') ||
          v.name.toLowerCase().includes('heera') ||
          v.name.toLowerCase().includes('ravi')
        );

        // Strategy 2: Gender-specific Indian voice matching
        if (!selectedVoice && voiceConfig.gender === 'FEMALE') {
          selectedVoice = voices.find(v => 
            v.lang.startsWith('en') && 
            (v.name.toLowerCase().includes('heera') ||
             v.name.toLowerCase().includes('kalpana') ||
             v.name.toLowerCase().includes('lekha'))
          );
        }
        
        if (!selectedVoice && voiceConfig.gender === 'MALE') {
          selectedVoice = voices.find(v => 
            v.lang.startsWith('en') && 
            (v.name.toLowerCase().includes('ravi') ||
             v.name.toLowerCase().includes('hemant') ||
             v.name.toLowerCase().includes('pico'))
          );
        }

        // Set language to Indian English
        utterance.lang = 'en-IN';
        
        // Apply Indian accent characteristics
        utterance.rate = options.rate !== undefined ? options.rate : Math.min(voiceConfig.speakingRate, 0.85);
        utterance.pitch = options.pitch !== undefined ? options.pitch : 
          (voiceConfig.gender === 'FEMALE' ? 
            Math.max(voiceConfig.pitch, 0.9) : 
            Math.min(voiceConfig.pitch, -0.8));
        
      } else if (voiceConfig.languageCode === 'en-US') {
        // American voices
        selectedVoice = voices.find(v => 
          v.lang === 'en-US' ||
          (voiceConfig.gender === 'FEMALE' && v.name.toLowerCase().includes('zira')) ||
          (voiceConfig.gender === 'MALE' && v.name.toLowerCase().includes('david'))
        );
        utterance.lang = 'en-US';
        utterance.rate = options.rate !== undefined ? options.rate : voiceConfig.speakingRate;
        utterance.pitch = options.pitch !== undefined ? options.pitch : voiceConfig.pitch;
        
      } else if (voiceConfig.languageCode === 'en-GB') {
        // British voices
        selectedVoice = voices.find(v => 
          v.lang === 'en-GB' ||
          (voiceConfig.gender === 'FEMALE' && v.name.toLowerCase().includes('hazel')) ||
          (voiceConfig.gender === 'MALE' && v.name.toLowerCase().includes('george'))
        );
        utterance.lang = 'en-GB';
        utterance.rate = options.rate !== undefined ? options.rate : voiceConfig.speakingRate;
        utterance.pitch = options.pitch !== undefined ? options.pitch : voiceConfig.pitch;
      }

      // Fallback: Any English voice
      if (!selectedVoice) {
        selectedVoice = voices.find(v => v.lang.startsWith('en'));
        utterance.lang = voiceConfig.languageCode;
        utterance.rate = options.rate !== undefined ? options.rate : voiceConfig.speakingRate;
        utterance.pitch = options.pitch !== undefined ? options.pitch : voiceConfig.pitch;
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      utterance.volume = options.volume !== undefined ? options.volume : 1.0;

      this.isPlaying = true;

      utterance.onend = () => {
        this.isPlaying = false;
        console.log(`✅ Browser voice completed: ${voiceConfig.name} (${voiceConfig.languageCode})`);
        resolve();
      };

      utterance.onerror = (event) => {
        this.isPlaying = false;
        console.error('Browser voice error:', event);
        reject(event);
      };

      console.log(`🔊 Speaking with ${voiceConfig.languageCode} accent: ${voiceConfig.name} (${selectedVoice?.name || 'default'})`);
      speechSynthesis.speak(utterance);
    });
  }

  // Preview voice with custom text
  async previewVoice(voiceId: string): Promise<void> {
    const voiceConfig = this.getVoiceConfig(voiceId);
    if (!voiceConfig) {
      throw new Error(`Voice configuration not found: ${voiceId}`);
    }

    // Simple preview - just say the name with accent
    const voiceName = voiceConfig.name.split(' ')[0];
    let previewText = '';
    
    if (voiceConfig.languageCode === 'en-IN') {
      // Indian accent - brief introduction
      previewText = `Hello, I am ${voiceName}.`;
    } else if (voiceConfig.languageCode === 'en-US') {
      // American accent
      previewText = `Hi, I'm ${voiceName}.`;
    } else if (voiceConfig.languageCode === 'en-GB') {
      // British accent
      previewText = `Good day, I'm ${voiceName}.`;
    } else {
      previewText = `Hello, I am ${voiceName}.`;
    }

    return this.speak(previewText, voiceId);
  }

  // Stop all audio
  stop(): void {
    // Stop browser speech synthesis
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }

    // Stop HTML audio if playing
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }

    this.isPlaying = false;
  }

  // Check if audio is currently playing
  isCurrentlyPlaying(): boolean {
    return this.isPlaying || speechSynthesis.speaking;
  }

  // Get voice pack status
  getStatus(): {
    availableVoices: number;
    hasApiKey: boolean;
    usingGoogleTTS: boolean;
    isPlaying: boolean;
  } {
    return {
      availableVoices: INDIAN_VOICES.length,
      hasApiKey: !!this.apiKey,
      usingGoogleTTS: !!this.apiKey,
      isPlaying: this.isPlaying
    };
  }
}

// Export singleton instance
export const indianVoiceAudioService = new IndianVoiceAudioService();
export type { IndianVoiceConfig };
export { INDIAN_VOICES };