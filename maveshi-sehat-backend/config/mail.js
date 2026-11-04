const { Resend } = require('resend');

/**
 * Resend Email Service for Maveshi Sehat AI
 * Operates exclusively over HTTPS (Port 443), completely bypassing
 * Render Free Tier's outbound SMTP port blocking (ports 25, 465, 587).
 */

const getApiKey = () => (process.env.RESEND_API_KEY || '').trim();
const getDefaultFrom = () => process.env.RESEND_FROM || 'Maveshi Sehat AI <onboarding@resend.dev>';

/**
 * Send an email via the Resend HTTPS REST API
 * @param {Object} options
 * @param {string} [options.from] - Sender address (e.g. 'Maveshi Sehat AI <onboarding@resend.dev>')
 * @param {string|string[]} options.to - Recipient email address(es)
 * @param {string} options.subject - Email subject
 * @param {string} [options.html] - HTML body
 * @param {string} [options.text] - Plain text body
 * @returns {Promise<{ id: string, messageId: string, response: string }>}
 */
async function sendMail({ from, to, subject, html, text }) {
  const apiKey = getApiKey();

  if (!apiKey) {
    console.warn('[Resend] WARNING: RESEND_API_KEY is not configured in .env or Render Dashboard.');
    console.warn('[Resend] Please set RESEND_API_KEY to enable live email delivery.');
    return {
      id: 'mock-id-no-api-key',
      messageId: 'mock-id-no-api-key',
      response: 'WARNING: RESEND_API_KEY missing - email not delivered to network'
    };
  }

  const recipients = Array.isArray(to) ? to : [to];
  const sender = from || getDefaultFrom();

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: sender,
      to: recipients,
      subject,
      html,
      text
    });

    if (error) {
      console.error('[Resend API Error]:', error);
      throw new Error(error.message || 'Resend API returned an error');
    }

    console.log(`[Resend Success] Email sent to ${recipients.join(', ')} (ID: ${data.id})`);
    return {
      id: data.id,
      messageId: data.id,
      response: `250 OK: Resend ID ${data.id}`
    };
  } catch (err) {
    console.error(`[Resend Dispatch Failed for ${recipients.join(', ')}]:`, err.message);
    throw err;
  }
}

module.exports = {
  sendMail,
  emailUser: process.env.RESEND_FROM || 'onboarding@resend.dev'
};
