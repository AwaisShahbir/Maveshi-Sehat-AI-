const { chatWithGemini } = require('./geminiService');
const { chatWithGroq } = require('./groqService');

/**
 * Intelligent AI Router:
 * 1. Attempts Google Gemini 1.5 Flash (Primary)
 * 2. On error / failure / quota limit, automatically fails over to Groq Llama 3.3 70B (Fallback)
 * @param {string} userMessage - User's query
 * @param {Array} history - Prior conversation
 * @returns {Promise<{ reply: string, provider: 'gemini' | 'groq' }>}
 */
const routeChatMessage = async (userMessage, history = [], extraContext = '') => {
  try {
    const reply = await chatWithGemini(userMessage, history, extraContext);
    return { reply, provider: 'gemini' };
  } catch (geminiError) {
    console.warn('Primary AI (Gemini) failed, attempting Groq fallback. Error:', geminiError.message);
    try {
      const reply = await chatWithGroq(userMessage, history, extraContext);
      return { reply, provider: 'groq' };
    } catch (groqError) {
      console.error('Fallback AI (Groq) also failed. Error:', groqError.message);
      throw new Error(`Both AI services failed. Gemini: ${geminiError.message} | Groq: ${groqError.message}`);
    }
  }
};

module.exports = { routeChatMessage };
