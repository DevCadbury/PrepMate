# 🚀 AI Interview System Setup Guide

## Overview

This system provides live video interviews with AI-powered feedback using Google Gemini API for real-time responses and audio processing.

## 🧠 Features Implemented

### ✅ Complete Integration

- **Google Gemini API**: Real-time AI responses and audio processing
- **Live Video Calls**: WebRTC-based video streaming
- **AI Avatar Support**: VSeeFace + OBS Virtual Camera integration
- **Real-time Audio**: Voice-to-text and text-to-speech
- **Interview Types**: HR, Technical, and Behavioral interviews
- **AI Feedback**: Intelligent responses based on user answers

## 🔧 Technical Stack

| Component            | Technology         | Purpose                    |
| -------------------- | ------------------ | -------------------------- |
| **AI Brain**         | Google Gemini API  | Real-time AI responses     |
| **Voice TTS**        | Google AI Studio   | Text-to-speech synthesis   |
| **Avatar**           | VSeeFace           | Live animated AI avatar    |
| **Video Output**     | OBS Virtual Camera | Seamless video integration |
| **Frontend**         | React + TypeScript | Modern UI/UX               |
| **Audio Processing** | Web Audio API      | Real-time audio handling   |

## 📋 Setup Instructions

### 1. Environment Configuration

Create a `.env` file in the root directory:

```bash
# Google Gemini API Configuration
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here

# Optional: ElevenLabs for alternative TTS
REACT_APP_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

### 2. Install Dependencies

```bash
npm install @google/genai
```

### 3. Get Google Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file

### 4. Install VSeeFace (AI Avatar)

1. Download from [VSeeFace Releases](https://github.com/emilianavt/VSeeFace/releases)
2. Install and launch VSeeFace
3. Load an AI avatar model (.vrm file)
4. Configure webcam input for face tracking
5. Set up OBS Virtual Camera as output

### 5. Install OBS Studio (Virtual Camera)

1. Download from [OBS Project](https://obsproject.com/download)
2. Install OBS Studio
3. Add VSeeFace window as source
4. Start Virtual Camera
5. Configure audio input/output

## 🎯 Usage

### Starting an Interview

1. **Setup Mode**: Configure your environment
2. **Interview Mode**: Start live video call
3. **Real-time Interaction**: Speak or type answers
4. **AI Feedback**: Get instant feedback from Gemini

### Features

- **Live Video**: Real-time video streaming
- **Voice Input**: Speak your answers naturally
- **AI Responses**: Gemini provides intelligent feedback
- **Progress Tracking**: Monitor interview progress
- **Score Analytics**: Track performance over time

## 🔧 Technical Implementation

### Gemini Service Integration

```typescript
// Initialize Gemini service
const geminiService = new GeminiService({
  apiKey: process.env.REACT_APP_GEMINI_API_KEY,
  model: "gemini-2.5-flash-preview-native-audio-dialog",
  voiceName: "Orus",
  languageCode: "en-US",
});

// Start real-time audio processing
await geminiService.initSession();
await geminiService.startRecording();
```

### Audio Processing

- **Input**: 16kHz PCM audio from microphone
- **Output**: 24kHz synthesized speech from Gemini
- **Real-time**: Low-latency audio processing
- **Interruption**: Automatic audio interruption handling

### Video Integration

- **Local Stream**: User's webcam feed
- **Remote Stream**: AI avatar from virtual camera
- **Controls**: Mute, video toggle, recording
- **Status**: Real-time connection indicators

## 🎨 UI Components

### Setup Mode

- Step-by-step installation guide
- External download links
- System requirements check
- Configuration instructions

### Interview Mode

- Live video call interface
- Real-time AI feedback
- Progress tracking
- Performance analytics

## 🚀 Advanced Features

### Real-time AI Processing

- Voice-to-text conversion
- Intelligent response generation
- Text-to-speech synthesis
- Audio interruption handling

### Interview Types

- **HR Interviews**: Behavioral questions
- **Technical Interviews**: Coding and system design
- **Behavioral Interviews**: Situation-based questions

### Analytics

- Interview performance tracking
- Score history
- Improvement metrics
- Feedback analysis

## 🔒 Security & Privacy

- **API Keys**: Stored securely in environment variables
- **Audio Processing**: Local processing with secure transmission
- **Video Streams**: Encrypted WebRTC connections
- **Data Privacy**: No persistent storage of interview data

## 🐛 Troubleshooting

### Common Issues

1. **Gemini API Key Not Found**

   - Check `.env` file configuration
   - Verify API key is valid
   - Ensure environment variable is loaded

2. **Audio Not Working**

   - Check microphone permissions
   - Verify audio device selection
   - Test with browser audio settings

3. **Video Not Displaying**

   - Check camera permissions
   - Verify virtual camera setup
   - Test OBS Virtual Camera

4. **VSeeFace Not Working**
   - Check VRM model compatibility
   - Verify webcam input
   - Test face tracking settings

### Debug Mode

Enable debug logging:

```typescript
// In geminiService.ts
console.log("Gemini session status:", sessionStatus);
console.log("Audio processing:", audioStatus);
console.log("Video streams:", streamStatus);
```

## 📈 Performance Optimization

### Audio Processing

- **Buffer Size**: 256 samples for low latency
- **Sample Rate**: 16kHz input, 24kHz output
- **Channels**: Mono for optimal processing

### Video Streaming

- **Resolution**: Adaptive based on connection
- **Frame Rate**: 30fps for smooth video
- **Codec**: H.264 for compatibility

### AI Response Time

- **Typing**: ~2-3 seconds for text responses
- **Voice**: ~1-2 seconds for audio responses
- **Interruption**: Immediate audio interruption

## 🎯 Future Enhancements

### Planned Features

- **Multi-language Support**: International interview preparation
- **Custom Avatars**: Personalized AI interviewers
- **Advanced Analytics**: Detailed performance insights
- **Integration APIs**: Connect with external platforms

### Technical Improvements

- **WebRTC Optimization**: Better video quality
- **Audio Enhancement**: Noise reduction and echo cancellation
- **AI Model Updates**: Latest Gemini model integration
- **Mobile Support**: React Native implementation

## 📞 Support

For technical support or feature requests:

- Check the troubleshooting section
- Review the setup guide
- Test with different browsers/devices
- Verify all dependencies are installed

---

**🎉 Congratulations!** Your AI interview system is now ready for live video calls with real-time AI feedback powered by Google Gemini.
