/**
 * Agora RTC Configuration for Maveshi Sehat Telehealth
 * 
 * To activate live cross-device video calling:
 * 1. Log in to https://console.agora.io (Free Tier gives 10,000 free minutes every month).
 * 2. Create a project with authentication mode set to "App ID" (Testing Mode).
 * 3. Paste the 32-character App ID below.
 */
export const AGORA_APP_ID = '6756f1bffa824551b8db9a0e87037f91';

export const isAgoraConfigured = () => {
  return typeof AGORA_APP_ID === 'string' && AGORA_APP_ID.length === 32 && AGORA_APP_ID !== 'YOUR_AGORA_APP_ID';
};
