# 🎥 Live Video Call Setup Guide

## Overview

This guide will help you set up a complete live video call system for AI interviews using:

- **Google AI Studio** (Gemini API) for AI responses and voice synthesis
- **VSeeFace** for AI avatar animation
- **OBS Studio** for virtual camera output
- **WebRTC** for real-time video/audio streaming

## 🛠️ Prerequisites

### System Requirements

- Windows 10/11 or macOS
- Webcam for face tracking
- Microphone for voice input
- 4GB RAM minimum
- Stable internet connection
- Modern browser (Chrome, Firefox, Edge)

### Required Software

1. **VSeeFace** - AI avatar animation
2. **OBS Studio** - Virtual camera output
3. **Google AI Studio Account** - For Gemini API

## 📋 Step-by-Step Setup

### Step 1: Install VSeeFace

1. Download VSeeFace from [GitHub Releases](https://github.com/emilianavt/VSeeFace/releases)
2. Install and launch VSeeFace
3. Load an AI avatar model (.vrm file)
4. Configure webcam input for face tracking
5. Set up OBS Virtual Camera as output

### Step 2: Install OBS Studio

1. Download OBS Studio from [OBS Project](https://obsproject.com/download)
2. Install and launch OBS Studio
3. Add VSeeFace window as source
4. Start Virtual Camera
5. Configure audio input/output

### Step 3: Setup Google AI Studio

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new project
3. Enable Gemini API
4. Generate an API key
5. Configure voice synthesis settings

### Step 4: Configure Environment Variables

Create a `.env` file in your project root:

```env
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
REACT_APP_GEMINI_MODEL=gemini-2.5-flash-preview-native-audio-dialog
REACT_APP_GEMINI_VOICE=Orus
REACT_APP_GEMINI_LANGUAGE=en-US
```

## 🔧 Technical Implementation

### Live Video Call Flow

1. **User initiates call** → WebRTC establishes connection
2. **Camera/Mic access** → Browser requests media permissions
3. **AI processing** → Google Gemini processes audio input
4. **Voice synthesis** → AI responses converted to speech
5. **Avatar animation** → VSeeFace animates based on audio
6. **Virtual camera** → OBS outputs AI avatar to browser

### Key Components

#### 1. GeminiService (`src/services/geminiService.ts`)

```typescript
// Real-time audio processing with Google Gemini API
- Audio input capture (16kHz PCM)
- Real-time AI response generation
- Audio output synthesis (24kHz)
- Session management and cleanup
```

#### 2. LiveVideoCall (`src/components/dashboards/pages/LiveVideoCall.tsx`)

```typescript
// WebRTC video call interface
- Local video stream (user camera)
- Remote video stream (AI avatar via OBS)
- Call controls (mute, video, recording)
- Interview progress tracking
```

#### 3. AICompanionPage (`src/components/dashboards/pages/AICompanionPage.tsx`)

```typescript
// Main interview interface
- Setup mode with step-by-step guidance
- Interview mode with live video call
- Chat interface for AI assistance
- Progress tracking and feedback
```

## 🎯 Usage Instructions

### Starting a Live Interview

1. Navigate to AI Companion page
2. Complete setup steps (VSeeFace, OBS, API keys)
3. Click "Start Live Interview"
4. Grant camera/microphone permissions
5. Begin real-time AI interview

### During the Interview

- **Speak naturally** - AI processes your voice in real-time
- **Listen to responses** - AI speaks through avatar
- **Use chat** - Text-based AI assistance available
- **Track progress** - Interview progress and feedback shown

### Call Controls

- **Mute/Unmute** - Toggle microphone
- **Video On/Off** - Toggle camera
- **Recording** - Start/stop interview recording
- **End Call** - Terminate interview session

## 🔍 Troubleshooting

### Common Issues

#### 1. Camera/Microphone Not Working

- Check browser permissions
- Ensure devices are not in use by other applications
- Try refreshing the page

#### 2. AI Avatar Not Appearing

- Verify VSeeFace is running
- Check OBS Virtual Camera is active
- Ensure avatar model is loaded

#### 3. AI Not Responding

- Verify Gemini API key is correct
- Check internet connection
- Review browser console for errors

#### 4. Audio Issues

- Check system audio settings
- Verify microphone permissions
- Test with different browsers

### Debug Steps

1. Open browser developer tools (F12)
2. Check Console tab for errors
3. Verify Network tab for API calls
4. Test with different browsers (Chrome recommended)

## 🚀 Advanced Configuration

### Custom Avatar Models

1. Download VRM files from [VRoid Hub](https://hub.vroid.com/)
2. Import into VSeeFace
3. Configure face tracking parameters
4. Test with different expressions

### Voice Customization

1. Access Google AI Studio voice settings
2. Choose from available voices
3. Adjust speech rate and pitch
4. Test with different languages

### Interview Types

- **HR Interviews** - Behavioral questions
- **Technical Interviews** - Coding and system design
- **Behavioral Interviews** - Past experiences and scenarios

## 📊 Performance Optimization

### Audio Quality

- Use high-quality microphone
- Minimize background noise
- Optimize audio processing settings

### Video Quality

- Ensure good lighting
- Use stable internet connection
- Adjust camera resolution if needed

### AI Response Speed

- Use wired internet connection
- Close unnecessary applications
- Monitor API usage limits

## 🔒 Security & Privacy

### Data Handling

- Audio is processed in real-time
- No audio data is stored permanently
- API keys are stored securely
- All communication is encrypted

### Privacy Settings

- Users control camera/microphone access
- Interview recordings are optional
- Data can be deleted on request
- No personal data is shared with third parties

## 📞 Support

### Getting Help

1. Check this setup guide
2. Review browser console errors
3. Test with different devices
4. Contact support if issues persist

### Useful Links

- [VSeeFace Documentation](https://github.com/emilianavt/VSeeFace)
- [OBS Studio Guide](https://obsproject.com/wiki/)
- [Google AI Studio](https://aistudio.google.com/)
- [WebRTC Documentation](https://webrtc.org/)

---

## 🎉 Ready to Start!

Once you've completed all setup steps, you're ready to begin live AI interviews! The system provides a realistic interview experience with real-time AI interaction, voice synthesis, and animated avatars.

**Happy Interviewing! 🚀**
