import React, { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/card';
import { CheckCircle, XCircle, AlertCircle, Download, Mic, Camera, VolumeX } from 'lucide-react';
import { voicePackService } from '../../services/voicePackService';

interface SystemCheck {
  name: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  action?: string;
  actionUrl?: string;
}

interface VoiceAvailability {
  indianVoices: number;
  totalVoices: number;
  hasIndianMale: boolean;
  hasIndianFemale: boolean;
  missingLanguages: string[];
}

const SystemStatusCheck: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [checks, setChecks] = useState<SystemCheck[]>([]);
  const [voiceInfo, setVoiceInfo] = useState<VoiceAvailability | null>(null);
  const [loading, setLoading] = useState(true);

  const runSystemChecks = async () => {
    const newChecks: SystemCheck[] = [];
    
    // Check microphone access
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      newChecks.push({
        name: 'Microphone Access',
        status: 'success',
        message: 'Microphone is accessible and working'
      });
    } catch (error) {
      newChecks.push({
        name: 'Microphone Access',
        status: 'error',
        message: 'Microphone access denied. Please enable microphone permissions in your browser settings.',
        action: 'Enable Microphone'
      });
    }

    // Check camera access
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately
      newChecks.push({
        name: 'Camera Access',
        status: 'success',
        message: 'Camera is accessible for facial expression monitoring'
      });
    } catch (error) {
      newChecks.push({
        name: 'Camera Access',
        status: 'error',
        message: 'Camera access denied. Camera is required for facial expression analysis during interviews.',
        action: 'Enable Camera'
      });
    }

    // Check speech synthesis
    if (typeof speechSynthesis !== 'undefined') {
      newChecks.push({
        name: 'Speech Synthesis',
        status: 'success',
        message: 'AI voice synthesis is supported'
      });

      // Load and check voice packs
      try {
        await voicePackService.loadVoicePacks();
        const compatibility = await voicePackService.checkSystemCompatibility();
        const packStatus = voicePackService.getVoicePackStatus();

        newChecks.push({
          name: 'Voice Packs',
          status: packStatus.loaded ? 'success' : 'warning',
          message: `Loaded ${packStatus.availablePacks} bundled voice packs. No language pack installation required!`
        });

        if (compatibility.issues.length > 0 && compatibility.issues.some(issue => !issue.includes('fallback'))) {
          newChecks.push({
            name: 'Voice Compatibility',
            status: 'warning',
            message: `Voice system ready with built-in fallbacks. ${compatibility.issues.filter(i => !i.includes('fallback')).join(', ')}`
          });
        } else {
          newChecks.push({
            name: 'Voice Compatibility',
            status: 'success',
            message: 'All voice systems operational with excellent compatibility and built-in voices'
          });
        }
      } catch (error) {
        newChecks.push({
          name: 'Voice Packs',
          status: 'warning',
          message: 'Voice packs loading failed, but system will use browser voices as fallback'
        });
      }
    } else {
      newChecks.push({
        name: 'Speech Synthesis',
        status: 'error',
        message: 'Speech synthesis not supported in this browser. Please use Chrome, Edge, or Safari.'
      });
    }

    // Check speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      newChecks.push({
        name: 'Speech Recognition',
        status: 'success',
        message: 'Speech recognition is supported'
      });
    } else {
      newChecks.push({
        name: 'Speech Recognition',
        status: 'error',
        message: 'Speech recognition not supported. Please use Chrome or Edge browser.'
      });
    }

    // Analyze voice availability
    const voices = speechSynthesis.getVoices();
    const indianVoices = voices.filter(v => 
      v.lang === 'en-IN' || 
      v.name.toLowerCase().includes('india') ||
      v.name.toLowerCase().includes('hindi') ||
      v.name.toLowerCase().includes('heera') ||
      v.name.toLowerCase().includes('ravi')
    );
    
    const hasIndianMale = indianVoices.some(v => 
      v.name.toLowerCase().includes('male') || 
      v.name.toLowerCase().includes('ravi') ||
      v.name.toLowerCase().includes('mark')
    );
    
    const hasIndianFemale = indianVoices.some(v => 
      v.name.toLowerCase().includes('female') || 
      v.name.toLowerCase().includes('heera') ||
      v.name.toLowerCase().includes('zira')
    );

    const voiceAvailability: VoiceAvailability = {
      indianVoices: indianVoices.length,
      totalVoices: voices.length,
      hasIndianMale,
      hasIndianFemale,
      missingLanguages: []
    };

    if (indianVoices.length === 0) {
      voiceAvailability.missingLanguages.push('English (India)');
      newChecks.push({
        name: 'Indian Voice Models',
        status: 'warning',
        message: `No Indian English voices found. Found ${voices.length} total voices. Indian voices will use fallback voices.`,
        action: 'Install Language Pack',
        actionUrl: 'ms-settings:regionlanguage-languageoptions'
      });
    } else if (indianVoices.length < 2) {
      newChecks.push({
        name: 'Indian Voice Models',
        status: 'warning',
        message: `Found ${indianVoices.length} Indian voice(s). Limited voice variety available.`,
        action: 'Install More Voices'
      });
    } else {
      newChecks.push({
        name: 'Indian Voice Models',
        status: 'success',
        message: `Found ${indianVoices.length} Indian English voices. All voice models will work properly.`
      });
    }

    setVoiceInfo(voiceAvailability);
    setChecks(newChecks);
    setLoading(false);
  };

  useEffect(() => {
    // Wait a bit for voices to load
    const timer = setTimeout(() => {
      runSystemChecks();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const getStatusIcon = (status: SystemCheck['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'warning':  
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
    }
  };

  const installLanguagePack = () => {
    // Open Windows language settings
    if (navigator.platform.includes('Win')) {
      window.open('ms-settings:regionlanguage-languageoptions', '_blank');
    } else {
      // Provide instructions for other platforms
      alert(`To install Indian English voices:
      
Windows: Go to Settings > Time & Language > Language > Add Language > English (India)
Mac: Go to System Preferences > Accessibility > Speech > System Voice > Customize
Chrome OS: Go to Settings > Advanced > Languages > Add Language
      
After installation, refresh this page.`);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="bg-gray-800 border-gray-700 w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white">Checking system compatibility...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasErrors = checks.some(check => check.status === 'error');
  const hasWarnings = checks.some(check => check.status === 'warning');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="bg-gray-800 border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center pb-4">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
            hasErrors ? 'bg-red-600' : hasWarnings ? 'bg-yellow-600' : 'bg-green-600'
          }`}>
            {hasErrors ? <XCircle className="w-8 h-8 text-white" /> :
             hasWarnings ? <AlertCircle className="w-8 h-8 text-white" /> :
             <CheckCircle className="w-8 h-8 text-white" />}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            System Compatibility Check
          </h2>
          <p className="text-gray-400">
            Ensuring optimal interview experience
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {checks.map((check, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-gray-700 rounded-lg">
              {getStatusIcon(check.status)}
              <div className="flex-1">
                <h3 className="font-medium text-white">{check.name}</h3>
                <p className="text-sm text-gray-300 mt-1">{check.message}</p>
                {check.action && (
                  <Button
                    onClick={check.name === 'Indian Voice Models' ? installLanguagePack : undefined}
                    className="mt-2 text-xs bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    {check.action}
                  </Button>
                )}
              </div>
            </div>
          ))}

          {voiceInfo && (
            <div className="mt-6 p-4 bg-gray-700 rounded-lg">
              <h3 className="font-medium text-white mb-3 flex items-center">
                <VolumeX className="w-4 h-4 mr-2" />
                Voice Availability Summary
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Total Voices:</span>
                  <span className="text-white ml-2">{voiceInfo.totalVoices}</span>
                </div>
                <div>
                  <span className="text-gray-400">Indian Voices:</span>
                  <span className="text-white ml-2">{voiceInfo.indianVoices}</span>
                </div>
                <div>
                  <span className="text-gray-400">Male Voices:</span>
                  <span className={`ml-2 ${voiceInfo.hasIndianMale ? 'text-green-400' : 'text-yellow-400'}`}>
                    {voiceInfo.hasIndianMale ? 'Available' : 'Fallback'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Female Voices:</span>
                  <span className={`ml-2 ${voiceInfo.hasIndianFemale ? 'text-green-400' : 'text-yellow-400'}`}>
                    {voiceInfo.hasIndianFemale ? 'Available' : 'Fallback'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4 border-t border-gray-600">
            <Button
              onClick={runSystemChecks}
              variant="ghost"
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white"
            >
              Recheck
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
              disabled={hasErrors}
            >
              {hasErrors ? 'Fix Issues First' : hasWarnings ? 'Continue Anyway' : 'All Good!'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemStatusCheck;