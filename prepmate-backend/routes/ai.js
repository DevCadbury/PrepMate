const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { verifyTokenMiddleware } = require("../utils/jwtUtils");
const { asyncHandler } = require("../utils/asyncHandler");
const logger = require("../utils/logger");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyTokenMiddleware);

// Use the model from environment variable or default to gemini-2.5-flash-preview-native-audio-dialog
const GEMINI_MODEL = process.env.REACT_APP_GEMINI_MODEL || "gemini-2.5-flash-preview-native-audio-dialog";

// @route   POST /api/ai/chat
// @desc    Handle chat messages using stored API key
// @access  Private
router.post(
  "/chat",
  [
    body("message").notEmpty().withMessage("Message is required"),
    body("userName").notEmpty().withMessage("User name is required"),
    body("jobRole").notEmpty().withMessage("Job role is required"),
    body("conversationHistory").isArray().withMessage("Conversation history must be an array"),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { message, userName, jobRole, conversationHistory } = req.body;

    // Get user's API key
    const user = await User.findById(req.user.id).select("+aiCompanion.geminiApiKey");
    
    if (!user || !user.aiCompanion?.geminiApiKey || !user.aiCompanion?.isApiKeyValid) {
      return res.status(400).json({
        success: false,
        message: "Valid API key not found. Please set your API key first.",
      });
    }

    try {
      const genAI = new GoogleGenerativeAI(user.aiCompanion.geminiApiKey);
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

      // Build system instruction
      const systemInstruction = `You are an expert interviewer named PrepMate, conducting an interview for a ${jobRole} position with a candidate named ${userName}.
Your tone is professional, encouraging, and warm. Use professional Indian English phrasing where appropriate (e.g., "Kindly explain..."), but keep the language clear.

The user's first response will be their self-introduction. Your primary task is to ask relevant follow-up questions based on the details they provide in their introduction and subsequent answers.
Also, mix in general behavioral and technical questions suitable for a ${jobRole} candidate. This ensures a comprehensive and realistic interview.

Key instructions:
1. Ask only one question at a time.
2. After the user answers, provide brief, constructive feedback in 1-2 sentences.
3. Immediately after the feedback, ask your next question in the same response.
4. Keep the interview flowing and conversational.`;

      // Build conversation context
      let fullPrompt = systemInstruction + "\n\nConversation so far:\n";
      conversationHistory.forEach((entry) => {
        fullPrompt += `${entry.role === 'user' ? userName : 'Interviewer'}: ${entry.content}\n`;
      });
      fullPrompt += `${userName}: ${message}\nInterviewer:`;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const responseText = response.text();

      res.json({
        success: true,
        response: responseText,
      });
    } catch (error) {
      logger.error("Error in AI chat:", error);
      
      // Check if it's an API key error
      if (error.message.includes("API key") || error.message.includes("authentication")) {
        // Mark API key as invalid
        await User.findByIdAndUpdate(req.user.id, {
          "aiCompanion.isApiKeyValid": false,
        });
        
        return res.status(400).json({
          success: false,
          message: "API key is invalid. Please update your API key.",
          invalidApiKey: true,
        });
      }

      res.status(500).json({
        success: false,
        message: "Error processing AI request",
      });
    }
  })
);

// @route   POST /api/ai/sentiment
// @desc    Analyze sentiment using stored API key
// @access  Private
router.post(
  "/sentiment",
  [
    body("text").notEmpty().withMessage("Text is required"),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { text } = req.body;

    // Get user's API key
    const user = await User.findById(req.user.id).select("+aiCompanion.geminiApiKey");
    
    if (!user || !user.aiCompanion?.geminiApiKey || !user.aiCompanion?.isApiKeyValid) {
      return res.status(400).json({
        success: false,
        message: "Valid API key not found. Please set your API key first.",
      });
    }

    try {
      const genAI = new GoogleGenerativeAI(user.aiCompanion.geminiApiKey);
      const model = genAI.getGenerativeModel({ 
        model: GEMINI_MODEL,
        generationConfig: {
          responseMimeType: "application/json",
        },
      });

      const prompt = `Analyze the sentiment of the following text. Is it Positive, Neutral, or Negative? Provide a confidence score from -1.0 (very negative) to 1.0 (very positive).

Return your response as JSON with the following structure:
{
  "sentiment_label": "Positive|Neutral|Negative",
  "confidence_score": number
}

Text: "${text}"`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();

      let jsonResponse;
      try {
        jsonResponse = JSON.parse(responseText);
      } catch (parseError) {
        // Fallback if JSON parsing fails
        jsonResponse = {
          sentiment_label: "Neutral",
          confidence_score: 0,
        };
      }

      res.json({
        success: true,
        sentiment_label: jsonResponse.sentiment_label,
        confidence_score: jsonResponse.confidence_score,
      });
    } catch (error) {
      logger.error("Error in sentiment analysis:", error);
      
      if (error.message.includes("API key") || error.message.includes("authentication")) {
        await User.findByIdAndUpdate(req.user.id, {
          "aiCompanion.isApiKeyValid": false,
        });
        
        return res.status(400).json({
          success: false,
          message: "API key is invalid. Please update your API key.",
          invalidApiKey: true,
        });
      }

      res.status(500).json({
        success: false,
        message: "Error processing sentiment analysis",
      });
    }
  })
);

// @route   POST /api/ai/summary
// @desc    Generate interview summary using stored API key
// @access  Private
router.post(
  "/summary",
  [
    body("userName").notEmpty().withMessage("User name is required"),
    body("transcript").notEmpty().withMessage("Transcript is required"),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { userName, transcript } = req.body;

    // Get user's API key
    const user = await User.findById(req.user.id).select("+aiCompanion.geminiApiKey");
    
    if (!user || !user.aiCompanion?.geminiApiKey || !user.aiCompanion?.isApiKeyValid) {
      return res.status(400).json({
        success: false,
        message: "Valid API key not found. Please set your API key first.",
      });
    }

    try {
      const genAI = new GoogleGenerativeAI(user.aiCompanion.geminiApiKey);
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

      const prompt = `Please provide a comprehensive summary and constructive feedback for the following interview transcript with the applicant, ${userName}.
Focus on ${userName}'s performance, highlighting strengths and areas for improvement regarding clarity, confidence, and substance of answers. Address the feedback to ${userName} directly in the second person (e.g., "You did a great job...").
Format the output using markdown, including headings and bullet points.

Transcript:
---
${transcript}
---`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const summary = response.text();

      res.json({
        success: true,
        summary: summary || "Could not generate a summary for this interview.",
      });
    } catch (error) {
      logger.error("Error generating interview summary:", error);
      
      if (error.message.includes("API key") || error.message.includes("authentication")) {
        await User.findByIdAndUpdate(req.user.id, {
          "aiCompanion.isApiKeyValid": false,
        });
        
        return res.status(400).json({
          success: false,
          message: "API key is invalid. Please update your API key.",
          invalidApiKey: true,
        });
      }

      res.status(500).json({
        success: false,
        message: "Error generating interview summary",
      });
    }
  })
);

module.exports = router;