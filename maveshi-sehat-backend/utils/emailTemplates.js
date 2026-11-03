/**
 * Professional HTML Email Templates for Maveshi Sehat AI
 */

function getOtpEmailHtml(fullName = 'Farmer', otp = '0000') {
  const safeName = (fullName || 'Valued User').trim();
  const safeOtp = String(otp).trim();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Maveshi Sehat Verification Code</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f4f6f8;
      padding: 36px 12px;
      box-sizing: border-box;
    }
    .card {
      max-width: 540px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #135431 0%, #0d3820 100%);
      padding: 32px 24px;
      text-align: center;
      color: #ffffff;
    }
    .brand-badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.25);
      padding: 4px 14px;
      border-radius: 50px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #86efac;
      margin-bottom: 12px;
    }
    .brand-title {
      margin: 0;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #ffffff;
    }
    .brand-sub {
      margin: 6px 0 0;
      font-size: 13px;
      color: #d1fae5;
      font-weight: 500;
    }
    .body {
      padding: 32px 28px 24px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 12px;
    }
    .lead-text {
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
      margin: 0 0 24px;
    }
    .otp-card {
      background: linear-gradient(180deg, #f0fdf4 0%, #ecfdf5 100%);
      border: 2px dashed #10b981;
      border-radius: 14px;
      padding: 24px 16px;
      text-align: center;
      margin: 24px 0;
    }
    .otp-label {
      font-size: 12px;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 1.2px;
      color: #047857;
      margin-bottom: 8px;
    }
    .otp-code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 40px;
      font-weight: 800;
      letter-spacing: 14px;
      color: #135431;
      margin: 6px 0 8px 14px;
      display: inline-block;
    }
    .otp-hint {
      font-size: 12px;
      color: #059669;
      font-weight: 600;
      margin: 0;
    }
    .features-card {
      background-color: #f8fafc;
      border-radius: 12px;
      padding: 16px;
      margin: 24px 0 16px;
      border: 1px solid #e2e8f0;
    }
    .features-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #64748b;
      margin: 0 0 10px;
    }
    .features-list {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .feature-item {
      font-size: 13px;
      color: #334155;
      padding: 4px 0;
      display: flex;
      align-items: center;
    }
    .security-notice {
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.5;
      margin: 20px 0 0;
      border-top: 1px solid #f1f5f9;
      padding-top: 16px;
    }
    .footer {
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 20px 24px;
      text-align: center;
      color: #64748b;
      font-size: 12px;
      line-height: 1.6;
    }
    .footer-links {
      margin-top: 6px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <div class="brand-badge">Account Verification</div>
        <h1 class="brand-title">Maveshi Sehat AI</h1>
        <p class="brand-sub">Smart Livestock Health & Diagnostics • مویشی صحت</p>
      </div>

      <div class="body">
        <div class="greeting">Assalam-o-Alaikum, ${safeName}!</div>
        <p class="lead-text">
          Thank you for joining <strong>Maveshi Sehat AI</strong>. To complete your account registration and secure your profile, please enter the one-time verification code below into your mobile app.
        </p>

        <div class="otp-card">
          <div class="otp-label">Your One-Time Password (OTP)</div>
          <div class="otp-code">${safeOtp}</div>
          <p class="otp-hint">⏳ Valid for the next 10 minutes</p>
        </div>

        <div class="features-card">
          <div class="features-title">What you can do with your account:</div>
          <div class="feature-item">✓ Instant AI scan & skin disease detection for cows & buffalos</div>
          <div class="feature-item">✓ Connect with certified veterinary doctors in your district</div>
          <div class="feature-item">✓ Order authentic livestock medicines with door-to-door delivery</div>
          <div class="feature-item">✓ Real-time THI heat stress & regional epidemic warnings</div>
        </div>

        <p class="security-notice">
          <strong>Security Tip:</strong> Never share this verification code with anyone. Maveshi Sehat AI support representatives will never ask you for your OTP. If you did not request this registration, you can safely ignore this email.
        </p>
      </div>

      <div class="footer">
        <div><strong>Maveshi Sehat AI</strong> — Pakistan's National Livestock Platform</div>
        <div class="footer-links">Empowering Farmers • Advancing Veterinary Healthcare</div>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function getVetWelcomeEmailHtml(fullName = 'Doctor') {
  const safeName = (fullName || 'Doctor').trim();
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Application Received - Maveshi Sehat AI</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .card { max-width: 540px; margin: 30px auto; background: #ffffff; border-radius: 18px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #135431 0%, #0d3820 100%); padding: 30px 24px; text-align: center; color: #fff; }
    .body { padding: 28px 24px; font-size: 14px; line-height: 1.6; color: #334155; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px; text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2 style="margin:0; font-size: 24px;">Maveshi Sehat AI</h2>
      <p style="margin:4px 0 0; color: #86efac; font-size: 13px;">Veterinarian Portal Registration</p>
    </div>
    <div class="body">
      <h3 style="margin-top:0; color:#0f172a;">Welcome, Dr. ${safeName}!</h3>
      <p>We have successfully received your registration application and PVMC license details.</p>
      <p>Our veterinary verification team is reviewing your submitted credentials. Once approved by our administrator, you will receive an approval confirmation email and your account will be unlocked for login.</p>
      <p>Thank you for contributing to modern digital veterinary care across Pakistan.</p>
    </div>
    <div class="footer">
      Maveshi Sehat AI • Professional Veterinary Network
    </div>
  </div>
</body>
</html>
  `.trim();
}

module.exports = {
  getOtpEmailHtml,
  getVetWelcomeEmailHtml
};
