/**
 * Maveshi Sehat AI - Executive Grade Transactional Email Templates
 * 
 * Specifically engineered to look exceptional in both Light & Dark modes
 * across Gmail (Android/iOS), Apple Mail, Outlook, and Webmail.
 */

/**
 * Renders the High-Contrast Header
 * Uses Deep Forest Emerald (#052e16) with vibrant emerald accents (#10b981 / #34d399)
 * and guaranteed pure-white typography to prevent Gmail dark mode mud/inversion.
 */
function renderHeader(badgeText = 'ACCOUNT SECURITY', title = 'Maveshi Sehat AI', urduSubtitle = 'مویشی صحت • پاکستان') {
  return `
  <!-- HEADER SECTION -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="header-table" style="background-color: #052e16; border-radius: 16px 16px 0 0; border-bottom: 3px solid #10b981;">
    <tr>
      <td style="padding: 34px 24px 28px; text-align: center;" class="header-td">
        
        <!-- App Emblem / Badge -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto 14px;">
          <tr>
            <td align="center" style="background-color: #047857; border: 2px solid #34d399; width: 54px; height: 54px; border-radius: 50%; text-align: center; vertical-align: middle; box-shadow: 0 4px 14px rgba(0,0,0,0.4);">
              <span style="font-size: 26px; line-height: 54px; display: inline-block;">🌿</span>
            </td>
          </tr>
        </table>

        <!-- Security Pill -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto 12px;">
          <tr>
            <td class="header-badge" style="background-color: #047857; border: 1px solid #34d399; border-radius: 20px; padding: 4px 16px; text-align: center;">
              <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #ffffff !important;">
                🛡️ ${badgeText}
              </span>
            </td>
          </tr>
        </table>

        <!-- Main Title (Guaranteed Crisp Pure White) -->
        <h1 class="header-title" style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 28px; font-weight: 800; line-height: 34px; letter-spacing: -0.5px; color: #ffffff !important; text-shadow: 0 2px 5px rgba(0,0,0,0.6);">
          ${title}
        </h1>

        <!-- Subtitle & Urdu Tagline -->
        <p class="header-sub" style="margin: 8px 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 600; color: #a7f3d0 !important; letter-spacing: 0.3px;">
          Smart Livestock Health & Diagnostics • ${urduSubtitle}
        </p>

      </td>
    </tr>
  </table>
  `;
}

/**
 * 4-Digit High-Contrast OTP Digit Cards
 */
function renderOtpBoxes(otp = '0000', label = 'YOUR VERIFICATION CODE', urduLabel = 'آپ کا تصدیقی کوڈ') {
  const digits = String(otp).trim().padStart(4, '0').split('').slice(0, 4);

  return `
  <!-- OTP CONTAINER -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="otp-table" style="margin: 26px 0; background-color: #f0fdf4; border: 2px solid #86efac; border-radius: 14px; text-align: center;">
    <tr>
      <td style="padding: 24px 16px;">
        
        <!-- Label -->
        <div class="otp-label" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #166534; margin-bottom: 4px;">
          ${label}
        </div>
        <div class="otp-urdu" style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-size: 14px; font-weight: 700; color: #15803d; margin-bottom: 16px;">
          ${urduLabel}
        </div>

        <!-- 4 Digit Cards -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto;">
          <tr>
            ${digits.map(d => `
              <td style="padding: 0 6px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="digit-card" style="background-color: #ffffff; border: 2px solid #16a34a; border-radius: 12px; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.15);">
                  <tr>
                    <td width="54" height="66" align="center" valign="middle" class="digit-text" style="font-family: 'SF Pro Display', Consolas, Monaco, 'Courier New', monospace; font-size: 36px; font-weight: 900; color: #052e16 !important; text-align: center; line-height: 66px;">
                      ${d}
                    </td>
                  </tr>
                </table>
              </td>
            `).join('')}
          </tr>
        </table>

        <!-- Expiration Timer Pill -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 18px auto 0;">
          <tr>
            <td class="timer-pill" style="background-color: #dcfce7; border: 1px solid #86efac; border-radius: 20px; padding: 5px 14px; text-align: center;">
              <span class="timer-text" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-weight: 700; color: #14532d;">
                ⏱️ Valid for 10 minutes • ۱۰ منٹ کے لیے کارآمد
              </span>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
  `;
}

/**
 * Security Advisory Notice
 */
function renderSecurityNotice() {
  return `
  <!-- SECURITY ADVISORY -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="notice-table" style="margin-top: 24px; background-color: #f8fafc; border-left: 4px solid #16a34a; border-radius: 0 10px 10px 0;">
    <tr>
      <td style="padding: 16px 18px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="26" valign="top" style="font-size: 18px; line-height: 22px;">🛡️</td>
            <td style="padding-left: 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 19px; color: #475569;" class="notice-text">
              <strong style="color: #0f172a;" class="notice-strong">Security Advisory:</strong> Never share this code with anyone. Maveshi Sehat AI support will never call or SMS to ask for your verification code. If you did not request this, your account is completely safe and you can ignore this email.
              <div style="margin-top: 6px; color: #64748b; font-size: 11px;" class="notice-urdu">
                یہ کوڈ کسی کے ساتھ شیئر نہ کریں۔ مویشی صحت عملہ کبھی آپ سے کوڈ نہیں مانگے گا۔
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  `;
}

/**
 * Footer Component
 */
function renderFooter() {
  return `
  <!-- FOOTER -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="footer-table" style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; border-radius: 0 0 16px 16px; text-align: center;">
    <tr>
      <td style="padding: 24px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 18px; color: #64748b; text-align: center;" class="footer-td">
        <div style="font-weight: 800; color: #1e293b; font-size: 13px; margin-bottom: 4px;" class="footer-title">
          Maveshi Sehat AI • پاکستان کا قومی ڈیجیٹل لائیو اسٹاک پلیٹ فارم
        </div>
        <div style="color: #64748b; font-size: 11px; margin-bottom: 12px;" class="footer-sub">
          Empowering Farmers • Advancing Veterinary Healthcare Across Pakistan
        </div>
        <div style="font-size: 11px; color: #94a3b8;" class="footer-help">
          Need assistance? Reach our support desk at <a href="mailto:maveshisehatai@gmail.com" style="color: #16a34a; text-decoration: none; font-weight: 700;">maveshisehatai@gmail.com</a>
        </div>
        <div style="margin-top: 12px; font-size: 10px; color: #cbd5e1;" class="footer-copy">
          © ${new Date().getFullYear()} Maveshi Sehat AI. All rights reserved.
        </div>
      </td>
    </tr>
  </table>
  `;
}

/**
 * Common Dark Mode Head Styles
 */
const COMMON_HEAD_STYLES = `
  :root {
    color-scheme: light dark;
    supported-color-schemes: light dark;
  }
  body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
  body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  
  /* DARK MODE OVERRIDES FOR GMAIL, APPLE MAIL & OUTLOOK */
  @media (prefers-color-scheme: dark) {
    body, .body-bg { background-color: #0b0f19 !important; }
    .card-container { background-color: #111827 !important; border-color: #1f2937 !important; }
    .header-table { background-color: #052e16 !important; border-bottom-color: #10b981 !important; }
    .header-title { color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; }
    .header-sub { color: #86efac !important; -webkit-text-fill-color: #86efac !important; }
    .header-badge { background-color: #047857 !important; }
    .content-h2 { color: #f9fafb !important; }
    .content-p { color: #d1d5db !important; }
    .otp-table { background-color: #064e3b !important; border-color: #059669 !important; }
    .otp-label { color: #86efac !important; }
    .otp-urdu { color: #bbf7d0 !important; }
    .digit-card { background-color: #0f172a !important; border-color: #10b981 !important; }
    .digit-text { color: #34d399 !important; -webkit-text-fill-color: #34d399 !important; }
    .timer-pill { background-color: #047857 !important; border-color: #10b981 !important; }
    .timer-text { color: #ffffff !important; }
    .notice-table { background-color: #1f2937 !important; border-left-color: #10b981 !important; }
    .notice-text { color: #9ca3af !important; }
    .notice-strong { color: #f9fafb !important; }
    .notice-urdu { color: #6b7280 !important; }
    .features-table { background-color: #1f2937 !important; border-color: #374151 !important; }
    .features-title { color: #9ca3af !important; }
    .features-item { color: #e5e7eb !important; }
    .footer-table { background-color: #111827 !important; border-top-color: #1f2937 !important; }
    .footer-title { color: #f9fafb !important; }
    .footer-sub { color: #9ca3af !important; }
    .footer-copy { color: #4b5563 !important; }
  }

  @media only screen and (max-width: 600px) {
    .card-container { width: 100% !important; max-width: 100% !important; border-radius: 0 !important; }
    .content-td { padding: 26px 18px !important; }
  }
`;

/**
 * 1. Account Registration Verification OTP Template
 */
function getOtpEmailHtml(fullName = 'Farmer', otp = '0000') {
  const safeName = (fullName || 'Valued User').trim();
  const safeOtp = String(otp).trim();

  return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Account Verification Code - Maveshi Sehat AI</title>
  <style>
    ${COMMON_HEAD_STYLES}
  </style>
</head>
<body class="body-bg" style="margin: 0; padding: 0; background-color: #f1f5f9; -webkit-font-smoothing: antialiased;">
  <div style="background-color: #f1f5f9; padding: 32px 12px;" class="body-bg">
    <!-- MAIN CARD CONTAINER -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);" class="card-container">
      
      <!-- HEADER -->
      <tr>
        <td>
          ${renderHeader('ACCOUNT ACTIVATION', 'Maveshi Sehat AI', 'مویشی صحت • پنجاب، سندھ، خیبر، بلوچستان')}
        </td>
      </tr>

      <!-- BODY CONTENT -->
      <tr>
        <td style="padding: 32px 28px 24px;" class="content-td">
          <!-- GREETING -->
          <h2 class="content-h2" style="margin: 0 0 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 20px; font-weight: 800; color: #0f172a;">
            Assalam-o-Alaikum, ${safeName}! 👋
          </h2>

          <p class="content-p" style="margin: 0 0 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 22px; color: #475569;">
            Welcome to <strong>Maveshi Sehat AI</strong> — Pakistan's premier livestock health network. To complete your account registration and secure your profile, enter this 4-digit code in the app:
          </p>

          <!-- 4-DIGIT OTP BOXES -->
          ${renderOtpBoxes(safeOtp, 'YOUR ACTIVATION CODE', 'اکاؤنٹ کی تصدیق کا 4 ہندسوں کا کوڈ')}

          <!-- HIGHLIGHTS PILL -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="features-table" style="margin: 20px 0 10px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
            <tr>
              <td style="padding: 16px 18px;">
                <div class="features-title" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: #64748b; margin-bottom: 8px;">
                  What you can do with your account:
                </div>
                <div class="features-item" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; line-height: 22px; color: #334155;">
                  • 🔬 Instant AI skin disease diagnosis for cattle & buffalos<br>
                  • 🩺 Consult verified veterinary specialists in your district<br>
                  • 💊 Order 100% genuine livestock medicines delivered home<br>
                  • ☀️ Real-time THI heat stress & regional outbreak alerts
                </div>
              </td>
            </tr>
          </table>

          <!-- SECURITY NOTICE -->
          ${renderSecurityNotice()}
        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td>
          ${renderFooter()}
        </td>
      </tr>

    </table>
  </div>
</body>
</html>
  `.trim();
}

/**
 * 2. Password Reset OTP Template
 */
function getResetPasswordEmailHtml(fullName = 'Valued User', otp = '0000') {
  const safeName = (fullName || 'Valued User').trim();
  const safeOtp = String(otp).trim();

  return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Reset Your Password - Maveshi Sehat AI</title>
  <style>
    ${COMMON_HEAD_STYLES}
  </style>
</head>
<body class="body-bg" style="margin: 0; padding: 0; background-color: #f1f5f9; -webkit-font-smoothing: antialiased;">
  <div style="background-color: #f1f5f9; padding: 32px 12px;" class="body-bg">
    <!-- MAIN CARD CONTAINER -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);" class="card-container">
      
      <!-- HEADER -->
      <tr>
        <td>
          ${renderHeader('PASSWORD RECOVERY', 'Maveshi Sehat AI', 'پاسورڈ تبدیل کرنے کی تصدیق • سیکیورٹی نوٹس')}
        </td>
      </tr>

      <!-- BODY CONTENT -->
      <tr>
        <td style="padding: 32px 28px 24px;" class="content-td">
          <!-- GREETING -->
          <h2 class="content-h2" style="margin: 0 0 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 20px; font-weight: 800; color: #0f172a;">
            Hello, ${safeName} 👋
          </h2>

          <p class="content-p" style="margin: 0 0 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 22px; color: #475569;">
            We received a request to reset the password for your <strong>Maveshi Sehat AI</strong> account. Use the 4-digit verification code below to authorize your password change:
          </p>

          <!-- 4-DIGIT OTP BOXES -->
          ${renderOtpBoxes(safeOtp, 'PASSWORD RESET CODE', 'پاسورڈ تبدیل کرنے کا تصدیقی کوڈ')}

          <p class="content-p" style="margin: 16px 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; line-height: 20px; color: #64748b; text-align: center;">
            Enter this code on your mobile screen to create your new password.
          </p>

          <!-- SECURITY NOTICE -->
          ${renderSecurityNotice()}
        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td>
          ${renderFooter()}
        </td>
      </tr>

    </table>
  </div>
</body>
</html>
  `.trim();
}

/**
 * 3. Veterinarian Welcome & Verification Pending Email Template
 */
function getVetWelcomeEmailHtml(fullName = 'Doctor') {
  const safeName = (fullName || 'Doctor').trim();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <title>Application Received - Maveshi Sehat AI</title>
  <style>
    ${COMMON_HEAD_STYLES}
  </style>
</head>
<body class="body-bg" style="margin:0; padding:0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="background-color: #f1f5f9; padding: 32px 12px;" class="body-bg">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);" class="card-container">
      <tr>
        <td>
          ${renderHeader('VETERINARIAN PORTAL', 'Maveshi Sehat AI', 'Professional Veterinary Care Network • مویشی صحت')}
        </td>
      </tr>
      <tr>
        <td style="padding: 32px 28px 24px;" class="content-td">
          <h2 class="content-h2" style="margin: 0 0 10px; font-size: 20px; font-weight: 800; color: #0f172a;">
            Welcome, Dr. ${safeName}! 🩺
          </h2>
          <p class="content-p" style="font-size: 14px; line-height: 22px; color: #475569; margin: 0 0 16px;">
            Thank you for applying to join the Maveshi Sehat Veterinary Medical Network. We have received your registration details and PVMC license information.
          </p>
          <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 18px; margin: 20px 0;">
            <div style="font-size: 13px; font-weight: 700; color: #166534; margin-bottom: 6px;">
              ⏳ Application Status: Under Verification
            </div>
            <div style="font-size: 13px; line-height: 20px; color: #15803d;">
              Our veterinary licensing board is currently verifying your credentials. Once approved by our administrator, you will receive an activation confirmation email and your account will be unlocked for clinical consultations.
            </div>
          </div>
          <p class="content-p" style="font-size: 13px; line-height: 20px; color: #64748b; margin: 0;">
            Thank you for your commitment to improving animal health and supporting livestock farmers across Pakistan.
          </p>
        </td>
      </tr>
      <tr>
        <td>
          ${renderFooter()}
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `.trim();
}

module.exports = {
  getOtpEmailHtml,
  getVetWelcomeEmailHtml,
  getResetPasswordEmailHtml
};
