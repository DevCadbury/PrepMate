// ResponsiveVoice Integration Test
// Run this file to test the Hindi voice functionality

import { responsiveVoiceService } from './src/services/responsiveVoiceService.js';

console.log('🇮🇳 Testing ResponsiveVoice Hindi Integration...');

// Test 1: Service Status
console.log('\n📊 Test 1: Service Status');
const status = responsiveVoiceService.getStatus();
console.log('Status:', status);

// Test 2: Available Voices
console.log('\n🎤 Test 2: Available Voices');
const voices = responsiveVoiceService.getAvailableVoices();
console.log(`Found ${voices.length} voice models:`);
voices.forEach(voice => {
  console.log(`  • ${voice.id}: ${voice.name} (${voice.language})`);
});

// Test 3: Hindi Voice Detection
console.log('\n🔍 Test 3: Hindi Voice Detection');
const hindiVoices = voices.filter(v => v.language.includes('Hindi'));
console.log(`Hindi voices found: ${hindiVoices.length}`);
hindiVoices.forEach(voice => {
  console.log(`  🇮🇳 ${voice.name}`);
});

// Test 4: Voice Model Configuration
console.log('\n⚙️ Test 4: Voice Model Configuration');
const testVoiceId = 'hi-IN-male-rajesh';
const voiceModel = responsiveVoiceService.getVoiceModel(testVoiceId);
console.log('Sample voice model:', voiceModel);

// Test 5: Preview Text Generation
console.log('\n📝 Test 5: Preview Text Generation');
console.log('Hindi preview:', responsiveVoiceService.getPreviewText('hi-IN'));
console.log('Tamil preview:', responsiveVoiceService.getPreviewText('ta-IN'));
console.log('Bengali preview:', responsiveVoiceService.getPreviewText('bn-IN'));

console.log('\n✅ ResponsiveVoice integration test completed!');
console.log('💡 To hear the voices, open the test-responsivevoice.html file in a browser');