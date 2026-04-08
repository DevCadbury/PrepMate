interface TTSVoice {
  id: string;
  name: string;
  lang: string;
  country: string;
  gender: 'male' | 'female';
  provider: 'browser' | 'web' | 'elevenlabs';
  voiceURI?: string;
  isOnline?: boolean;
}

interface TTSOptions {
  rate: number;
  pitch: number;
  volume: number;
  voice?: string;
}

class TTSService {
  private fallbackVoices: TTSVoice[] = [
    // English voices
    { id: 'en-US-female-1', name: 'Sarah (US Female)', lang: 'en-US', country: 'US', gender: 'female', provider: 'web', isOnline: true },
    { id: 'en-US-male-1', name: 'John (US Male)', lang: 'en-US', country: 'US', gender: 'male', provider: 'web', isOnline: true },
    { id: 'en-GB-female-1', name: 'Emma (UK Female)', lang: 'en-GB', country: 'UK', gender: 'female', provider: 'web', isOnline: true },
    { id: 'en-GB-male-1', name: 'James (UK Male)', lang: 'en-GB', country: 'UK', gender: 'male', provider: 'web', isOnline: true },
    { id: 'en-AU-female-1', name: 'Olivia (AU Female)', lang: 'en-AU', country: 'AU', gender: 'female', provider: 'web', isOnline: true },
    { id: 'en-IN-female-1', name: 'Priya (IN Female)', lang: 'en-IN', country: 'IN', gender: 'female', provider: 'web', isOnline: true },
    { id: 'en-IN-male-1', name: 'Arjun (IN Male)', lang: 'en-IN', country: 'IN', gender: 'male', provider: 'web', isOnline: true },
  ];

  private browserVoices: TTSVoice[] = [];
  private audioContext: AudioContext | null = null;

  constructor() {
    this.loadBrowserVoices();
    // Update voices when they become available
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => this.loadBrowserVoices();
    }
  }

  private loadBrowserVoices(): void {
    const voices = speechSynthesis.getVoices();
    this.browserVoices = voices
      .filter(voice => voice.lang.startsWith('en')) // Only English voices
      .map(voice => ({
        id: `browser-${voice.voiceURI}`,
        name: voice.name,
        lang: voice.lang,
        country: this.extractCountry(voice.lang),
        gender: this.guessGender(voice.name),
        provider: 'browser' as const,
        voiceURI: voice.voiceURI,
        isOnline: false
      }));
  }

  private extractCountry(lang: string): string {
    const countryMap: { [key: string]: string } = {
      'en-US': 'US',
      'en-GB': 'UK',
      'en-AU': 'AU',
      'en-IN': 'IN',
      'en-CA': 'CA',
      'en-ZA': 'ZA'
    };
    return countryMap[lang] || 'US';
  }

  private guessGender(name: string): 'male' | 'female' {
    const femaleKeywords = ['female', 'woman', 'zira', 'cortana', 'hazel', 'susan', 'karen', 'samantha', 'tessa', 'moira', 'fiona', 'veena', 'aria'];
    const maleKeywords = ['male', 'man', 'david', 'mark', 'alex', 'tom', 'daniel', 'ravi'];
    
    const lowerName = name.toLowerCase();
    
    if (femaleKeywords.some(keyword => lowerName.includes(keyword))) return 'female';
    if (maleKeywords.some(keyword => lowerName.includes(keyword))) return 'male';
    
    return 'female'; // Default to female
  }

  getAllVoices(): TTSVoice[] {
    return [...this.browserVoices, ...this.fallbackVoices];
  }

  getBrowserVoices(): TTSVoice[] {
    return this.browserVoices;
  }

  getFallbackVoices(): TTSVoice[] {
    return this.fallbackVoices;
  }

  findBestVoice(preferredId: string): TTSVoice | null {
    const allVoices = this.getAllVoices();
    
    // Try exact match first
    let voice = allVoices.find(v => v.id === preferredId);
    if (voice) return voice;

    // Try browser voices first (higher quality, no internet required)
    const browserVoice = this.browserVoices.find(v => 
      v.lang.includes('en-IN') || v.name.toLowerCase().includes('india')
    );
    if (browserVoice) return browserVoice;

    // Fall back to English voices
    voice = this.browserVoices.find(v => v.lang.startsWith('en-'));
    if (voice) return voice;

    // Last resort: use web fallback
    return this.fallbackVoices[0];
  }

  async speak(text: string, voiceId: string, options: TTSOptions = { rate: 1, pitch: 1, volume: 1 }): Promise<void> {
    const voice = this.findBestVoice(voiceId);
    
    if (!voice) {
      throw new Error('No suitable voice found');
    }

    if (voice.provider === 'browser') {
      return this.speakWithBrowser(text, voice, options);
    } else if (voice.provider === 'web') {
      return this.speakWithWebTTS(text, voice, options);
    }

    throw new Error('Unsupported voice provider');
  }

  private speakWithBrowser(text: string, voice: TTSVoice, options: TTSOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      speechSynthesis.cancel(); // Stop any current speech

      const utterance = new SpeechSynthesisUtterance(text);
      const browserVoice = speechSynthesis.getVoices().find(v => v.voiceURI === voice.voiceURI);
      
      if (browserVoice) {
        utterance.voice = browserVoice;
      }
      
      utterance.rate = options.rate;
      utterance.pitch = options.pitch;
      utterance.volume = options.volume;
      
      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(`Speech synthesis error: ${event.error}`));
      
      speechSynthesis.speak(utterance);
    });
  }

  private async speakWithWebTTS(text: string, voice: TTSVoice, options: TTSOptions): Promise<void> {
    try {
      // Use ResponsiveVoice.js if available
      if (typeof (window as any).responsiveVoice !== 'undefined') {
        return new Promise((resolve, reject) => {
          (window as any).responsiveVoice.speak(text, voice.id, {
            rate: options.rate,
            pitch: options.pitch,
            volume: options.volume,
            onend: resolve,
            onerror: reject
          });
        });
      }

      // Fallback to browser TTS with a generic voice
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options.rate;
      utterance.pitch = options.pitch;
      utterance.volume = options.volume;
      utterance.lang = voice.lang;
      
      return new Promise((resolve, reject) => {
        utterance.onend = () => resolve();
        utterance.onerror = (event) => reject(new Error(`Speech synthesis error: ${event.error}`));
        speechSynthesis.speak(utterance);
      });
    } catch (error) {
      throw new Error(`Web TTS failed: ${error}`);
    }
  }

  stop(): void {
    speechSynthesis.cancel();
  }

  getVoiceStatus(): { browserVoicesCount: number; fallbackVoicesCount: number; totalVoices: number } {
    return {
      browserVoicesCount: this.browserVoices.length,
      fallbackVoicesCount: this.fallbackVoices.length,
      totalVoices: this.getAllVoices().length
    };
  }
}

export const ttsService = new TTSService();
export type { TTSVoice, TTSOptions };