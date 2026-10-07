const Groq = require('groq-sdk');
const { SYSTEM_PROMPT } = require('../config/systemPrompt');

const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set in environment variables');
  }
  return new Groq({ apiKey });
};

/**
 * Sends a message to Groq (Llama-3.3-70b-versatile) with conversation history and strict system prompt.
 * @param {string} userMessage - Latest user message
 * @param {Array} history - Previous messages [{ role: 'user' | 'assistant', content: '...' }]
 * @returns {Promise<string>} AI text reply
 */
const chatWithGroq = async (userMessage, history = [], extraContext = '') => {
  const groq = getGroqClient();
  const effectiveSystemPrompt = extraContext ? `${SYSTEM_PROMPT}\n\n${extraContext}` : SYSTEM_PROMPT;

  const formattedHistory = history.map(item => ({
    role: item.role === 'model' ? 'assistant' : item.role,
    content: typeof item.content === 'string' 
      ? item.content 
      : (item.parts && item.parts[0]?.text) || ''
  }));

  const messages = [
    { role: 'system', content: effectiveSystemPrompt },
    ...formattedHistory,
    { role: 'user', content: userMessage }
  ];

  const chatCompletion = await groq.chat.completions.create({
    messages,
    model: 'llama-3.3-70b-versatile',
    temperature: 0.6,
    max_tokens: 1024,
  });

  return chatCompletion.choices[0]?.message?.content || '';
};

module.exports = { chatWithGroq };
