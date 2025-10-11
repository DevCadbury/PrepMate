# AI Interview Companion - PrepMate

This is a comprehensive AI-powered interview practice system that provides real-time voice interaction, feedback, and analysis using Google Gemini AI.

## Features

### 🎯 **Real-time AI Interview**

- Voice-to-text and text-to-speech interaction
- Professional AI interviewer with customizable voice
- Dynamic question generation based on user responses
- Real-time feedback and guidance

### 📊 **Live Feedback & Analytics**

- **Speech Pace Analysis**: Words per minute tracking
- **Filler Word Detection**: Identifies and counts filler words (um, uh, like, etc.)
- **Sentiment Analysis**: Real-time emotional tone assessment
- **Performance Metrics**: Comprehensive interview scoring

### 🎨 **Modern UI/UX**

- Dark theme with cyan/blue accent colors
- Responsive design for all screen sizes
- Smooth animations and transitions
- Professional interview environment

### 🔧 **Technical Features**

- Speech recognition (Chrome/Edge compatible)
- Speech synthesis with voice selection
- Google Gemini AI integration
- Real-time conversation tracking

## Setup Instructions

### 1. **Get Google Gemini API Key**

- Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
- Create a new API key
- Copy the key for use in the application

### 2. **Browser Requirements**

- **Chrome** or **Edge** (for speech recognition)
- Microphone access enabled
- Modern browser with ES6+ support

### 3. **Installation**

The component is already integrated into the PrepMate landing page. No additional installation required.

## Usage

### **Starting an Interview**

1. Navigate to the AI Companion page
2. Enter your name and target job role
3. Provide your Google Gemini API key
4. Click "Start Interview"

### **During the Interview**

- **Listen**: AI asks questions and provides feedback
- **Speak**: Respond naturally - the system transcribes your speech
- **Monitor**: Watch real-time feedback metrics
- **Learn**: Receive instant guidance and suggestions

### **Ending the Interview**

- Click "End Interview" to finish
- Review comprehensive AI-generated summary
- Analyze performance metrics
- Restart for additional practice

## Components Structure

```
src/
├── components/
│   ├── interview/
│   │   ├── ConversationView.tsx      # Chat interface
│   │   ├── FeedbackPanel.tsx         # Real-time metrics
│   │   ├── PostInterviewReport.tsx   # Final summary
│   │   ├── SimpleAvatar.tsx          # AI interviewer avatar
│   │   ├── SetupScreen.tsx           # Initial configuration
│   │   └── index.ts                  # Component exports
│   └── dashboards/
│       └── pages/
│           └── AICompanionPage.tsx   # Main page
├── services/
│   └── interviewService.ts           # AI service functions
├── types/
│   └── interview.ts                  # TypeScript definitions
└── index.css                         # Styling and animations
```

## API Integration

### **Google Gemini Functions**

- `createInterviewChat()`: Initialize AI interviewer
- `getNextChatResponse()`: Get AI follow-up questions
- `analyzeSentiment()`: Assess emotional tone
- `getInterviewSummary()`: Generate final report

### **Speech Recognition**

- Continuous listening with interim results
- Automatic transcription and processing
- Debounced response handling

### **Speech Synthesis**

- Multiple voice options
- Professional Indian English support
- Configurable speech parameters

## Customization

### **Voice Selection**

- Choose from available system voices
- Prioritizes Indian English voices
- Fallback to Google voices

### **Interview Types**

- HR Interviews
- Technical Interviews
- Behavioral Interviews
- Custom role-specific questions

### **UI Themes**

- Dark mode optimized
- Cyan/blue accent colors
- Professional interview aesthetic

## Performance Features

### **Real-time Processing**

- Live speech analysis
- Instant feedback generation
- Smooth conversation flow

### **Memory Management**

- Efficient state management
- Cleanup on component unmount
- Optimized re-renders

## Browser Compatibility

| Feature            | Chrome | Edge | Firefox | Safari |
| ------------------ | ------ | ---- | ------- | ------ |
| Speech Recognition | ✅     | ✅   | ❌      | ❌     |
| Speech Synthesis   | ✅     | ✅   | ✅      | ✅     |
| WebRTC             | ✅     | ✅   | ✅      | ✅     |

## Troubleshooting

### **Common Issues**

1. **"Speech recognition not supported"**

   - Use Chrome or Edge browser
   - Ensure microphone permissions are granted

2. **"Microphone access denied"**

   - Check browser microphone settings
   - Allow microphone access when prompted

3. **"API key error"**

   - Verify Google Gemini API key is correct
   - Ensure API key has proper permissions

4. **"No voices available"**
   - Install language packs for your OS
   - Restart browser after installation

### **Performance Tips**

- Close unnecessary browser tabs
- Use wired headphones for better audio
- Ensure stable internet connection
- Restart browser if experiencing issues

## Future Enhancements

- [ ] Video call integration
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Interview question customization
- [ ] Performance benchmarking
- [ ] Export interview reports
- [ ] Integration with learning platforms

## Support

For technical support or feature requests, please contact the development team or create an issue in the project repository.

---

**PrepMate AI Interview Companion** - Making interview preparation smarter, more effective, and accessible to everyone.
