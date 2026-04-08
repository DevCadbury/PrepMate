/**
 * Indian Voice Service Initialization
 * Initialize this at app startup to enable Google Cloud TTS
 */

import { indianVoiceAudioService, type IndianVoiceConfig } from './indianVoiceAudioService';

/**
 * Initialize Indian voice service with Google Cloud TTS API key
 * Call this function when your app starts
 */
export const initializeIndianVoices = () => {
  // Option 1: Get API key from environment variable (recommended)
  const apiKey = process.env.REACT_APP_GOOGLE_TTS_API_KEY;
  
  // Option 2: Get from user settings (if stored in database)
  // const apiKey = userSettings.googleTtsApiKey;
  
  // Option 3: Hardcode for testing (NOT recommended for production)
  // const apiKey = 'YOUR_API_KEY_HERE';
  
  if (apiKey) {
    indianVoiceAudioService.setApiKey(apiKey);
    console.log('✅ Indian voice service initialized with Google Cloud TTS');
    console.log('🇮🇳 Authentic Indian voices are now available');
  } else {
    console.log('⚠️  No API key found - using browser voice fallback');
    console.log('💡 Set REACT_APP_GOOGLE_TTS_API_KEY for authentic Indian voices');
  }
  
  // Log available voices
  const voices = indianVoiceAudioService.getAvailableVoices();
  console.log(`📢 Available Indian voices: ${voices.length}`);
  voices.forEach((voice: IndianVoiceConfig) => {
    console.log(`   - ${voice.name} (${voice.voiceName})`);
  });
};

/**
 * Test function to verify Indian voice quality
 */
export const testIndianVoice = async (voiceId: string = 'en-IN-female-aria') => {
  console.log(`🧪 Testing Indian voice: ${voiceId}`);
  
  try {
    await indianVoiceAudioService.previewVoice(voiceId);
    console.log('✅ Voice test completed successfully');
  } catch (error) {
    console.error('❌ Voice test failed:', error);
  }
};

/**
 * Get Google Cloud TTS setup status
 */
export const getVoiceServiceStatus = () => {
  const status = indianVoiceAudioService.getStatus();
  
  return {
    isInitialized: status.hasApiKey,
    usingGoogleTTS: status.usingGoogleTTS,
    availableVoices: status.availableVoices,
    quality: status.usingGoogleTTS ? 'Premium (Google Cloud)' : 'Standard (Browser)',
    recommendation: status.usingGoogleTTS 
      ? 'Using authentic Indian voices with natural accents'
      : 'Get Google Cloud TTS API key for authentic Indian voices'
  };
};

// Auto-initialize on import
initializeIndianVoices();
