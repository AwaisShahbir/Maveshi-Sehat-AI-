/**
 * In-memory AI Chat Session Store
 * Keeps AI Assistant conversation history intact during the active login session.
 * Wiped upon user logout or app cold restart so that chat history is strictly session-scoped.
 */

let sessionMessages = {
  farmer: null,
  vet: null,
};

export const getSessionAiMessages = (role) => {
  const key = (role === 'vet' || role === 'veterinarian') ? 'vet' : 'farmer';
  return sessionMessages[key];
};

export const setSessionAiMessages = (role, msgs) => {
  const key = (role === 'vet' || role === 'veterinarian') ? 'vet' : 'farmer';
  sessionMessages[key] = msgs;
};

export const clearSessionAiMessages = (role = null) => {
  if (role) {
    const key = (role === 'vet' || role === 'veterinarian') ? 'vet' : 'farmer';
    sessionMessages[key] = null;
  } else {
    sessionMessages.farmer = null;
    sessionMessages.vet = null;
  }
};
