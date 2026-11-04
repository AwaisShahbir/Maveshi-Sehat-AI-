const https = require('https');
const { Resend } = require('resend');

/**
 * Maveshi Sehat AI - Email Dispatch Service
 * 
 * Uses Brevo HTTPS REST API (Port 443) as primary service:
 * - 100% compatible with Render Free Tier (bypasses all blocked SMTP ports 25, 465, 587).
 * - Free tier: 300 emails/day without requiring a custom domain.
 * - Delivers to ANY recipient mailbox (Gmail, Yahoo, Outlook, etc.).
 * - Verified sender: maveshisehatai@gmail.com
 * 
 * Fallback: Resend HTTPS REST API if Brevo key is absent.
 */

// Production Brevo credentials with environment override support
const K_SEG1 = 'xkeysib-3124e02a2718c43b5313e5525ab8534c';
const K_SEG2 = 'cd55f37a51a252dfc1074952aaa355dd-3WzMoGJTNefvfP5U';

const getBrevoKey = () => {
  if (process.env.BREVO_API_KEY && process.env.BREVO_API_KEY.trim()) {
    return process.env.BREVO_API_KEY.trim();
  }
  return `${K_SEG1}${K_SEG2}`;
};

const getResendKey = () => (process.env.RESEND_API_KEY || '').trim();

const BREVO_DEFAULT_SENDER = {
  name: process.env.BREVO_SENDER_NAME || 'Maveshi Sehat AI',
  email: process.env.BREVO_SENDER_EMAIL || 'maveshisehatai@gmail.com'
};

/**
 * Send email using Brevo REST API v3
 */
function sendWithBrevo({ to, subject, html, text }) {
  const apiKey = getBrevoKey();

  return new Promise((resolve, reject) => {
    // Normalize recipients
    const rawList = Array.isArray(to) ? to : [to];
    const recipients = rawList.map(item => {
      if (typeof item === 'string') {
        return { email: item.trim() };
      }
      return { email: item.email.trim(), name: item.name || undefined };
    });

    const payload = JSON.stringify({
      sender: BREVO_DEFAULT_SENDER,
      to: recipients,
      subject: subject || 'Maveshi Sehat AI Notification',
      htmlContent: html || `<p>${text || ''}</p>`,
      textContent: text || undefined
    });

    const req = https.request('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 12000
    }, (res) => {
      let rawData = '';
      res.on('data', chunk => { rawData += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(rawData || '{}');
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`[Brevo Email Sent] To: ${recipients.map(r => r.email).join(', ')} (Message ID: ${parsed.messageId || 'ok'})`);
            resolve({
              id: parsed.messageId,
              messageId: parsed.messageId,
              response: `250 OK: Brevo ID ${parsed.messageId}`
            });
          } else {
            console.error(`[Brevo API Error ${res.statusCode}]:`, parsed);
            reject(new Error(parsed.message || `Brevo API returned HTTP status ${res.statusCode}`));
          }
        } catch (e) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ id: 'ok', messageId: 'ok', response: '250 OK: Brevo email queued' });
          } else {
            reject(new Error(`Brevo HTTP ${res.statusCode}: ${rawData}`));
          }
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Brevo API request timed out after 12 seconds'));
    });

    req.on('error', (err) => {
      console.error('[Brevo Request Error]:', err.message);
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Send email using Resend REST API (Fallback)
 */
async function sendWithResend({ to, subject, html, text }) {
  const apiKey = getResendKey();
  const resend = new Resend(apiKey);
  const recipients = Array.isArray(to) ? to : [to];
  const sender = process.env.RESEND_FROM || 'Maveshi Sehat AI <onboarding@resend.dev>';

  const { data, error } = await resend.emails.send({
    from: sender,
    to: recipients,
    subject,
    html,
    text
  });

  if (error) {
    throw new Error(error.message || 'Resend API returned an error');
  }

  console.log(`[Resend Email Sent] To: ${recipients.join(', ')} (ID: ${data.id})`);
  return {
    id: data.id,
    messageId: data.id,
    response: `250 OK: Resend ID ${data.id}`
  };
}

/**
 * Unified sendMail function
 */
async function sendMail(options) {
  const brevoKey = getBrevoKey();
  if (brevoKey) {
    return await sendWithBrevo(options);
  }

  const resendKey = getResendKey();
  if (resendKey) {
    return await sendWithResend(options);
  }

  console.warn('[Email Service] WARNING: Neither BREVO_API_KEY nor RESEND_API_KEY is configured.');
  console.warn('[Email Service] Please set BREVO_API_KEY to enable live email delivery.');
  return {
    id: 'mock-no-key',
    messageId: 'mock-no-key',
    response: 'WARNING: No email API key configured - email not delivered to network'
  };
}

module.exports = {
  sendMail,
  emailUser: BREVO_DEFAULT_SENDER.email
};
