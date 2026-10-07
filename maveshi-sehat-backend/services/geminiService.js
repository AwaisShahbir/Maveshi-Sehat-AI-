const { GoogleGenerativeAI } = require('@google/generative-ai');
const { SYSTEM_PROMPT } = require('../config/systemPrompt');

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }
  return new GoogleGenerativeAI(apiKey);
};

const GEMINI_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3-flash-preview',
  'gemini-3.8-flash'
];

/**
 * Sends a message to Gemini with conversation history and strict system prompt.
 * Automatically tries available models in order.
 * Ensures conversation history begins with role 'user' as strictly required by Google API.
 * @param {string} userMessage - Latest user message
 * @param {Array} history - Previous messages
 * @returns {Promise<string>} AI text reply
 */
const chatWithGemini = async (userMessage, history = [], extraContext = '') => {
  const genAI = getGeminiClient();
  const effectiveSystemPrompt = extraContext ? `${SYSTEM_PROMPT}\n\n${extraContext}` : SYSTEM_PROMPT;

  // Sanitize history: Gemini strictly requires history to start with role 'user'
  const sanitizedHistory = [];
  let foundFirstUser = false;

  for (const item of history) {
    const role = (item.role === 'assistant' || item.role === 'model') ? 'model' : 'user';
    const textContent = typeof item.content === 'string'
      ? item.content
      : (item.parts && item.parts[0]?.text) || item.text || '';

    if (!textContent || textContent.trim().length === 0) continue;

    if (!foundFirstUser) {
      if (role === 'user') {
        foundFirstUser = true;
        sanitizedHistory.push({
          role: 'user',
          parts: [{ text: textContent }],
        });
      }
    } else {
      sanitizedHistory.push({
        role,
        parts: [{ text: textContent }],
      });
    }
  }

  let lastError = null;

  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: effectiveSystemPrompt,
        generationConfig: {
          temperature: 0.6,
          topP: 0.9,
          maxOutputTokens: 1024,
        }
      });

      const chat = model.startChat({
        history: sanitizedHistory,
      });

      const result = await chat.sendMessage(userMessage);
      const response = await result.response;
      return response.text();
    } catch (err) {
      lastError = err;
      console.warn(`[Gemini] Model ${modelName} failed (${err.message}). Trying fallback model...`);
      // Try next available model candidate
      continue;
    }
  }

  throw lastError || new Error('No available Gemini model found');
};

module.exports = { chatWithGemini };


