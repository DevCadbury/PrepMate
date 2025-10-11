const OpenAI = require("openai");
const logger = require("../utils/logger");

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class AIService {
  constructor() {
    this.model = process.env.OPENAI_MODEL || "gpt-4";
    this.maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS) || 2000;
  }

  // Generate interview questions based on type and difficulty
  async generateInterviewQuestions(type, difficulty, count = 10) {
    try {
      const prompt = this.buildQuestionPrompt(type, difficulty, count);

      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "You are an expert interview coach specializing in technical and behavioral interviews.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: this.maxTokens,
        temperature: 0.7,
      });

      const questions = this.parseQuestions(
        response.choices[0].message.content
      );
      return questions;
    } catch (error) {
      logger.error("Error generating interview questions:", error);
      throw new Error("Failed to generate interview questions");
    }
  }

  // Analyze user's answer and provide feedback
  async analyzeAnswer(question, userAnswer, expectedAnswer = null) {
    try {
      const prompt = this.buildAnalysisPrompt(
        question,
        userAnswer,
        expectedAnswer
      );

      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "You are an expert interview evaluator. Provide constructive feedback and scoring.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: this.maxTokens,
        temperature: 0.3,
      });

      const analysis = this.parseAnalysis(response.choices[0].message.content);
      return analysis;
    } catch (error) {
      logger.error("Error analyzing answer:", error);
      throw new Error("Failed to analyze answer");
    }
  }

  // Generate follow-up questions based on user's answer
  async generateFollowUpQuestions(originalQuestion, userAnswer) {
    try {
      const prompt = `Based on the user's answer to this question: "${originalQuestion}"
User's answer: "${userAnswer}"

Generate 2-3 relevant follow-up questions that would help explore the topic further or clarify any points. Format as a JSON array of strings.`;

      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "You are an expert interviewer who asks insightful follow-up questions.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      const followUpQuestions = this.parseFollowUpQuestions(
        response.choices[0].message.content
      );
      return followUpQuestions;
    } catch (error) {
      logger.error("Error generating follow-up questions:", error);
      return [];
    }
  }

  // Provide overall interview feedback
  async generateOverallFeedback(interviewData) {
    try {
      const prompt = this.buildOverallFeedbackPrompt(interviewData);

      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "You are an expert interview coach providing comprehensive feedback.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: this.maxTokens,
        temperature: 0.4,
      });

      const feedback = this.parseOverallFeedback(
        response.choices[0].message.content
      );
      return feedback;
    } catch (error) {
      logger.error("Error generating overall feedback:", error);
      throw new Error("Failed to generate overall feedback");
    }
  }

  // Build question generation prompt
  buildQuestionPrompt(type, difficulty, count) {
    const typeDescriptions = {
      technical: "technical programming and computer science questions",
      behavioral: "behavioral and situational questions about past experiences",
      mixed: "a mix of technical and behavioral questions",
      "system-design": "system design and architecture questions",
      coding: "coding problems and algorithms",
    };

    const difficultyDescriptions = {
      beginner: "suitable for entry-level positions",
      intermediate: "suitable for mid-level positions",
      advanced: "suitable for senior positions",
      expert: "suitable for lead/architect positions",
    };

    return `Generate ${count} ${difficultyDescriptions[difficulty]} ${typeDescriptions[type]} for a mock interview.

For each question, provide:
- The question text
- Category (technical/behavioral/situational/problem-solving/leadership)
- Difficulty (easy/medium/hard)
- Expected answer points (for behavioral questions)
- Keywords that should be mentioned

Format the response as a JSON array with objects containing: question, category, difficulty, expectedAnswer, keywords.

Make sure the questions are relevant to ${difficulty} level ${type} interviews.`;
  }

  // Build analysis prompt
  buildAnalysisPrompt(question, userAnswer, expectedAnswer) {
    let prompt = `Analyze this interview answer:

Question: "${question}"
User's Answer: "${userAnswer}"`;

    if (expectedAnswer) {
      prompt += `\nExpected Answer Points: "${expectedAnswer}"`;
    }

    prompt += `

Provide analysis in JSON format with:
- score (0-100)
- feedback (detailed feedback)
- suggestions (array of improvement suggestions)
- confidence (0-100, how confident the answer was)
- fluency (0-100, how well it was communicated)
- technicalAccuracy (0-100, technical correctness)

Be constructive and specific in your feedback.`;

    return prompt;
  }

  // Build overall feedback prompt
  buildOverallFeedbackPrompt(interviewData) {
    const { questions, totalDuration, type, difficulty } = interviewData;

    let prompt = `Provide overall feedback for this ${difficulty} ${type} interview:

Total Duration: ${totalDuration} minutes
Number of Questions: ${questions.length}

Question Analysis:`;

    questions.forEach((q, index) => {
      prompt += `\n${index + 1}. ${q.question}
   - Score: ${q.aiFeedback?.score || "N/A"}
   - Feedback: ${q.aiFeedback?.feedback || "No feedback"}`;
    });

    prompt += `

Provide overall analysis in JSON format with:
- overallFeedback (comprehensive feedback)
- strengths (array of strengths)
- weaknesses (array of areas for improvement)
- recommendations (array of specific recommendations)
- confidence (0-100, overall confidence level)
- fluency (0-100, overall communication fluency)
- technicalAccuracy (0-100, overall technical accuracy)
- communication (0-100, overall communication skills)
- problemSolving (0-100, problem-solving ability)

Be encouraging but honest in your assessment.`;

    return prompt;
  }

  // Parse questions from AI response
  parseQuestions(content) {
    try {
      // Extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback: try to parse the entire content
      return JSON.parse(content);
    } catch (error) {
      logger.error("Error parsing questions:", error);
      // Return default questions if parsing fails
      return this.getDefaultQuestions();
    }
  }

  // Parse analysis from AI response
  parseAnalysis(content) {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(content);
    } catch (error) {
      logger.error("Error parsing analysis:", error);
      return {
        score: 50,
        feedback: "Unable to analyze answer",
        suggestions: ["Provide more detailed answers"],
        confidence: 50,
        fluency: 50,
        technicalAccuracy: 50,
      };
    }
  }

  // Parse follow-up questions
  parseFollowUpQuestions(content) {
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch (error) {
      logger.error("Error parsing follow-up questions:", error);
      return [];
    }
  }

  // Parse overall feedback
  parseOverallFeedback(content) {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(content);
    } catch (error) {
      logger.error("Error parsing overall feedback:", error);
      return {
        overallFeedback: "Unable to generate feedback",
        strengths: [],
        weaknesses: [],
        recommendations: [],
        confidence: 50,
        fluency: 50,
        technicalAccuracy: 50,
        communication: 50,
        problemSolving: 50,
      };
    }
  }

  // Get default questions if AI fails
  getDefaultQuestions() {
    return [
      {
        question: "Tell me about yourself and your background.",
        category: "behavioral",
        difficulty: "easy",
        expectedAnswer:
          "Should include education, experience, and career goals",
        keywords: ["background", "experience", "goals"],
      },
      {
        question: "What are your strengths and weaknesses?",
        category: "behavioral",
        difficulty: "easy",
        expectedAnswer: "Honest assessment with examples",
        keywords: ["strengths", "weaknesses", "improvement"],
      },
    ];
  }

  // Transcribe audio using Whisper
  async transcribeAudio(audioBuffer) {
    try {
      const response = await openai.audio.transcriptions.create({
        file: audioBuffer,
        model: "whisper-1",
        response_format: "text",
      });

      return response;
    } catch (error) {
      logger.error("Error transcribing audio:", error);
      throw new Error("Failed to transcribe audio");
    }
  }

  // Generate speech using TTS
  async generateSpeech(text, voice = "alloy") {
    try {
      const response = await openai.audio.speech.create({
        model: "tts-1",
        voice: voice,
        input: text,
      });

      return response;
    } catch (error) {
      logger.error("Error generating speech:", error);
      throw new Error("Failed to generate speech");
    }
  }
}

module.exports = new AIService();
