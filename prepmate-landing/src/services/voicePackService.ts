interface VoicePackData {
  id: string;
  name: string;
  lang: string;
  gender: 'male' | 'female';
  country: string;
  audioUrl?: string;
  isLocal: boolean;
  description: string;
}

// Interface for future audio chunk implementation
interface VoicePackChunk {
  text: string;
  audioData: string; // Base64 encoded audio
  duration: number;
}

class VoicePackService {
  private voicePacks: Map<string, VoicePackData> = new Map();
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private isLoading: boolean = false;

  // Comprehensive bundled voice packs with Hindi and Indian language support
  private bundledVoicePacks: VoicePackData[] = [
    // Hindi Voices
    {
      id: 'hi-IN-male-rajesh',
      name: 'Rajesh (Hindi Male)',
      lang: 'hi-IN',
      gender: 'male',
      country: 'India',
      isLocal: true,
      description: 'Authentic Hindi male voice with natural pronunciation - हिंदी पुरुष आवाज़'
    },
    {
      id: 'hi-IN-female-priya',
      name: 'Priya (Hindi Female)',
      lang: 'hi-IN',
      gender: 'female',
      country: 'India',
      isLocal: true,
      description: 'Natural Hindi female voice with clear articulation - हिंदी महिला आवाज़'
    },

    // Tamil Voices
    {
      id: 'ta-IN-male-kumar',
      name: 'Kumar (Tamil Male)',
      lang: 'ta-IN',
      gender: 'male',
      country: 'India',
      isLocal: true,
      description: 'Authentic Tamil male voice with traditional pronunciation - தமிழ் ஆண் குரல்'
    },
    {
      id: 'ta-IN-female-meera',
      name: 'Meera (Tamil Female)',
      lang: 'ta-IN',
      gender: 'female',
      country: 'India',
      isLocal: true,
      description: 'Beautiful Tamil female voice with melodic tone - தமிழ் பெண் குரல்'
    },

    // Bengali Voices
    {
      id: 'bn-IN-male-anirban',
      name: 'Anirban (Bengali Male)',
      lang: 'bn-IN',
      gender: 'male',
      country: 'India',
      isLocal: true,
      description: 'Authentic Bengali male voice with cultural pronunciation - বাংলা পুরুষ কণ্ঠস্বর'
    },
    {
      id: 'bn-IN-female-shreya',
      name: 'Shreya (Bengali Female)',
      lang: 'bn-IN',
      gender: 'female',
      country: 'India',
      isLocal: true,
      description: 'Elegant Bengali female voice with sweet tone - বাংলা নারী কণ্ঠস্বর'
    },

    // Indian English Voices
    {
      id: 'en-IN-female-aria',
      name: 'Aria (Indian English Female)',
      lang: 'en-IN',
      gender: 'female',
      country: 'India',
      isLocal: true,
      description: 'Professional Indian English female voice with clear pronunciation and natural accent'
    },
    {
      id: 'en-IN-male-arjun',
      name: 'Arjun (Indian English Male)',
      lang: 'en-IN',
      gender: 'male',
      country: 'India',
      isLocal: true,
      description: 'Professional Indian English male voice with natural accent and clear delivery'
    },


    // US Voices
    {
      id: 'en-US-female-sarah',
      name: 'Sarah (US Female)',
      lang: 'en-US',
      gender: 'female',
      country: 'United States',
      isLocal: true,
      description: 'Clear American English female voice with professional and friendly tone'
    },
    {
      id: 'en-US-male-david',
      name: 'David (US Male)',
      lang: 'en-US',
      gender: 'male',
      country: 'United States',
      isLocal: true,
      description: 'Professional American English male voice with confident delivery and clear pronunciation'
    },

    // UK Voices
    {
      id: 'en-GB-female-emma',
      name: 'Emma (UK Female)',
      lang: 'en-GB',
      gender: 'female',
      country: 'United Kingdom',
      isLocal: true,
      description: 'Elegant British English female voice with sophisticated accent and clear articulation'
    },
    {
      id: 'en-GB-male-oliver',
      name: 'Oliver (UK Male)',
      lang: 'en-GB',
      gender: 'male',
      country: 'United Kingdom',
      isLocal: true,
      description: 'Professional British English male voice with distinguished accent and authoritative presence'
    }
  ];

  constructor() {
    this.initializeVoicePacks();
  }

  private initializeVoicePacks(): void {
    this.bundledVoicePacks.forEach(pack => {
      this.voicePacks.set(pack.id, pack);
    });
  }

  async loadVoicePacks(): Promise<void> {
    if (this.isLoading) return;
    
    this.isLoading = true;
    console.log('📦 Loading bundled voice packs...');

    try {
      // In a real implementation, this would load actual audio files
      // For now, we'll use the Web Speech API as fallback
      console.log(`✅ Loaded ${this.bundledVoicePacks.length} voice packs`);
      
      // Initialize audio elements for each voice pack
      for (const pack of this.bundledVoicePacks) {
        if (!this.audioCache.has(pack.id)) {
          // Create audio element for potential future use
          const audio = new Audio();
          audio.preload = 'none';
          this.audioCache.set(pack.id, audio);
        }
      }
    } catch (error) {
      console.error('❌ Failed to load voice packs:', error);
    } finally {
      this.isLoading = false;
    }
  }

  getAvailableVoicePacks(): VoicePackData[] {
    return Array.from(this.voicePacks.values());
  }

  getVoicePack(id: string): VoicePackData | undefined {
    return this.voicePacks.get(id);
  }

  async speakWithVoicePack(text: string, voiceId: string, options: {
    rate?: number;
    pitch?: number;
    volume?: number;
  } = {}): Promise<void> {
    const pack = this.voicePacks.get(voiceId);
    if (!pack) {
      throw new Error(`Voice pack not found: ${voiceId}`);
    }

    // Use ResponsiveVoice for Hindi and Indian languages (hi-IN, ta-IN, bn-IN)
    if (voiceId.startsWith('hi-IN') || voiceId.startsWith('ta-IN') || voiceId.startsWith('bn-IN')) {
      try {
        const { responsiveVoiceService } = await import('./responsiveVoiceService');
        const language = voiceId.startsWith('hi-IN') ? 'Hindi' : 
                        voiceId.startsWith('ta-IN') ? 'Tamil' : 'Bengali';
        console.log(`🇮🇳 Using ResponsiveVoice for ${language}: ${pack.name}`);
        return await responsiveVoiceService.speak(text, voiceId, options);
      } catch (error) {
        console.warn('ResponsiveVoice service not available, using fallback:', error);
      }
    }

    // Use the enhanced voice service for English accents (Indian, US, UK)
    if (voiceId.startsWith('en-IN') || voiceId.startsWith('en-US') || voiceId.startsWith('en-GB')) {
      try {
        const { indianVoiceAudioService } = await import('./indianVoiceAudioService');
        const accent = pack.lang === 'en-IN' ? 'Indian' : pack.lang === 'en-US' ? 'American' : 'British';
        console.log(`🌍 Using enhanced voice service for ${accent} accent: ${pack.name}`);
        return await indianVoiceAudioService.speak(text, voiceId, options);
      } catch (error) {
        console.warn('Enhanced voice service not available, using fallback:', error);
      }
    }

    // Fallback: Use Web Speech API with enhanced settings based on voice pack
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Try to find a matching browser voice
      const voices = speechSynthesis.getVoices();
      let selectedVoice = null;

      // Enhanced voice matching based on pack data with comprehensive Indian voice support
      if (pack.lang === 'en-IN') {
        // First try exact language match
        selectedVoice = voices.find(v => v.lang === 'en-IN');
        
        // Then try India-specific voices
        if (!selectedVoice) {
          selectedVoice = voices.find(v => 
            v.name.toLowerCase().includes('india') || 
            v.name.toLowerCase().includes('indian') ||
            v.name.toLowerCase().includes('hindi') ||
            v.name.toLowerCase().includes('devanagari')
          );
        }
        
        // Gender-specific Indian voice matching
        if (!selectedVoice && pack.gender === 'female') {
          selectedVoice = voices.find(v => 
            (v.name.toLowerCase().includes('heera') || 
             v.name.toLowerCase().includes('kalpana') ||
             v.name.toLowerCase().includes('lekha') ||
             v.name.toLowerCase().includes('hemant')) &&
            v.lang.startsWith('en')
          );
        }
        
        if (!selectedVoice && pack.gender === 'male') {
          selectedVoice = voices.find(v => 
            (v.name.toLowerCase().includes('ravi') || 
             v.name.toLowerCase().includes('hemant') ||
             v.name.toLowerCase().includes('pico')) &&
            v.lang.startsWith('en')
          );
        }
      } else if (pack.lang === 'en-GB') {
        selectedVoice = voices.find(v => 
          v.lang === 'en-GB' || 
          v.name.toLowerCase().includes('british') ||
          v.name.toLowerCase().includes('uk') ||
          (pack.gender === 'female' && (v.name.toLowerCase().includes('hazel') || v.name.toLowerCase().includes('susan'))) ||
          (pack.gender === 'male' && (v.name.toLowerCase().includes('george') || v.name.toLowerCase().includes('daniel')))
        );
      } else if (pack.lang === 'en-US') {
        selectedVoice = voices.find(v => 
          v.lang === 'en-US' ||
          v.name.toLowerCase().includes('united states') ||
          (pack.gender === 'female' && (v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('eva'))) ||
          (pack.gender === 'male' && (v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('mark')))
        );
      }

      // Fallback to any English voice
      if (!selectedVoice) {
        selectedVoice = voices.find(v => v.lang.startsWith('en'));
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
      } else {
        utterance.lang = pack.lang;
      }

      // Apply voice pack specific settings
      utterance.rate = options.rate || (pack.gender === 'female' ? 0.9 : 0.95);
      utterance.pitch = options.pitch || (pack.gender === 'female' ? 1.1 : 0.85);
      utterance.volume = options.volume || 1.0;

      // Special settings for Indian voices
      if (pack.lang === 'en-IN') {
        utterance.rate = Math.min(utterance.rate, 0.85); // Slower for clarity
        utterance.pitch = pack.gender === 'female' ? 1.05 : 0.9;
      }

      utterance.onend = () => {
        console.log(`✅ Voice pack speech completed: ${pack.name}`);
        resolve();
      };

      utterance.onerror = (event) => {
        console.error(`❌ Voice pack speech error: ${event.error}`);
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      console.log(`🔊 Speaking with voice pack: ${pack.name} (${selectedVoice?.name || 'default'})`);
      speechSynthesis.speak(utterance);
    });
  }

  async previewVoicePack(voiceId: string): Promise<void> {
    const pack = this.voicePacks.get(voiceId);
    if (!pack) {
      throw new Error(`Voice pack not found: ${voiceId}`);
    }

    // CRITICAL: Stop all voices first to prevent conflicts
    this.stopAll();
    
    // Use ResponsiveVoice for Hindi and Indian languages (hi-IN, ta-IN, bn-IN)
    if (voiceId.startsWith('hi-IN') || voiceId.startsWith('ta-IN') || voiceId.startsWith('bn-IN')) {
      try {
        const { responsiveVoiceService } = await import('./responsiveVoiceService');
        const language = voiceId.startsWith('hi-IN') ? 'Hindi' : 
                        voiceId.startsWith('ta-IN') ? 'Tamil' : 'Bengali';
        console.log(`🇮🇳 Previewing ${language} voice: ${pack.name}`);
        return await responsiveVoiceService.previewVoice(voiceId);
      } catch (error) {
        console.warn('ResponsiveVoice service preview failed, using fallback:', error);
      }
    }

    // Use enhanced voice service for English accents (Indian, US, UK)
    if (voiceId.startsWith('en-IN') || voiceId.startsWith('en-US') || voiceId.startsWith('en-GB')) {
      try {
        const { indianVoiceAudioService } = await import('./indianVoiceAudioService');
        const accent = pack.lang === 'en-IN' ? 'Indian' : pack.lang === 'en-US' ? 'American' : 'British';
        console.log(`🌍 Previewing ${accent} accent voice: ${pack.name}`);
        return await indianVoiceAudioService.previewVoice(voiceId);
      } catch (error) {
        console.warn('Enhanced voice service preview failed, using fallback:', error);
      }
    }

    // Get the voice name without parentheses
    const voiceName = pack.name.split(' ')[0];
    
    // Create SHORT country-specific preview text (just name and accent)
    let previewText = '';
    if (pack.country === 'India') {
      previewText = `Hello, I am ${voiceName}.`;
    } else if (pack.country === 'United States') {
      previewText = `Hi, I'm ${voiceName}.`;
    } else if (pack.country === 'United Kingdom') {
      previewText = `Good day, I'm ${voiceName}.`;
    } else {
      previewText = `Hello, I am ${voiceName}.`;
    }
    
    return this.speakWithVoicePack(previewText, voiceId);
  }

  stopAll(): void {
    // Stop browser speech synthesis immediately
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    
    // Stop ResponsiveVoice service if it's playing
    try {
      import('./responsiveVoiceService').then(({ responsiveVoiceService }) => {
        responsiveVoiceService.stop();
      }).catch(() => {
        // Service not loaded yet, that's okay
      });
    } catch (error) {
      // Service not available, continue
    }
    
    // Stop Indian voice service if it's playing
    try {
      import('./indianVoiceAudioService').then(({ indianVoiceAudioService }) => {
        indianVoiceAudioService.stop();
      }).catch(() => {
        // Service not loaded yet, that's okay
      });
    } catch (error) {
      // Service not available, continue
    }
    
    // Stop any audio elements if they were playing
    this.audioCache.forEach(audio => {
      try {
        if (!audio.paused) {
          audio.pause();
          audio.currentTime = 0;
        }
      } catch (error) {
        // Audio element might be disposed, continue
      }
    });
    
    console.log('🛑 All voice playback stopped (including ResponsiveVoice)');
  }

  getVoicePackStatus(): {
    loaded: boolean;
    totalPacks: number;
    availablePacks: number;
    cachedAudio: number;
  } {
    return {
      loaded: !this.isLoading,
      totalPacks: this.bundledVoicePacks.length,
      availablePacks: this.voicePacks.size,
      cachedAudio: this.audioCache.size
    };
  }

  // Method to check system compatibility
  async checkSystemCompatibility(): Promise<{
    webSpeechSupported: boolean;
    voicePacksLoaded: boolean;
    recommendedVoices: string[];
    issues: string[];
  }> {
    const issues: string[] = [];
    const recommendedVoices: string[] = [];

    // Check Web Speech API support
    const webSpeechSupported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
    if (!webSpeechSupported) {
      issues.push('Web Speech API not supported in this browser');
    }

    // Load voice packs if not already loaded
    if (!this.isLoading && this.voicePacks.size === 0) {
      await this.loadVoicePacks();
    }

    // Check available browser voices
    const browserVoices = speechSynthesis.getVoices();
    const englishVoices = browserVoices.filter(v => v.lang.startsWith('en'));

    if (englishVoices.length === 0) {
      issues.push('No English voices found in browser - voice packs will provide fallbacks');
    }

    // Recommend voices based on availability
    for (const pack of this.bundledVoicePacks) {
      const hasMatchingBrowserVoice = browserVoices.some(v => 
        v.lang === pack.lang || 
        (pack.lang === 'en-IN' && v.name.toLowerCase().includes('india'))
      );
      
      if (hasMatchingBrowserVoice) {
        recommendedVoices.push(pack.id);
      }
    }

    // If no matching voices, recommend default packs
    if (recommendedVoices.length === 0) {
      recommendedVoices.push('en-US-female-1', 'en-US-male-1');
    }

    return {
      webSpeechSupported,
      voicePacksLoaded: this.voicePacks.size > 0,
      recommendedVoices,
      issues
    };
  }
}

export const voicePackService = new VoicePackService();
export type { VoicePackData };