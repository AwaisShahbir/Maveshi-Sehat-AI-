import { API_BASE_URL } from '../config';
import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  Phone, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  KeyRound, 
  X, 
  ShieldCheck, 
  FileCheck, 
  Activity, 
  ShieldAlert,
  LogIn 
} from 'lucide-react';
import logoImg from '../assets/logo.png';
import '../styles/Login.css';

export default function Login({ onLoginSuccess }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1 = identifier, 2 = otp + new pass, 3 = success
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!identifier.trim() || !password.trim()) {
      setErrorMsg('Please enter your email/phone and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password })
      });

      let data;
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Backend server returned an invalid response. Please verify the backend is running.');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials or unauthorized access');
      }

      if (data.user?.role !== 'admin' && data.user?.role !== 'superadmin' && data.user?.role !== 'super_admin') {
        throw new Error('Access denied. This portal is restricted to authorized administrators.');
      }

      onLoginSuccess(data.user);
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetCode = async (e) => {
    e.preventDefault();
    setForgotError('');
    if (!forgotIdentifier.trim()) {
      setForgotError('Please enter your registered email or phone number.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: forgotIdentifier.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch reset code.');
      }

      setTargetEmail(data.email);
      setResetOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError('');

    if (!resetOtp.trim()) {
      setForgotError('Please enter the 4-digit code.');
      return;
    }
    if (!newPassword.trim() || newPassword.length < 6) {
      setForgotError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          otp: resetOtp.trim(),
          newPassword: newPassword.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password.');
      }

      setForgotSuccess('Password updated successfully! You can now log in.');
      setForgotStep(3);
    } catch (err) {
      setForgotError(err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  const isEmail = identifier.includes('@');

  return (
    <div className="admin-login-wrapper">
      {/* Left Branding Sidepane */}
      <div className="admin-login-branding">
        <div className="admin-login-brand-header">
          <div className="admin-login-logo-ring">
            <img 
              src={logoImg} 
              alt="Maveshi Sehat AI Logo" 
              className="admin-login-logo-img" 
            />
          </div>
          <h1 className="admin-login-brand-title">Maveshi Sehat AI</h1>
          <h2 className="admin-login-brand-subtitle">Admin Portal</h2>
        </div>

        <div className="admin-login-features">
          <div className="admin-login-feature-item">
            <div className="admin-login-feature-icon">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="admin-login-feature-text">Ecosystem Governance</p>
              <p className="admin-login-feature-desc">Centralized oversight of farmers, vets & pharmacies</p>
            </div>
          </div>

          <div className="admin-login-feature-item">
            <div className="admin-login-feature-icon">
              <FileCheck size={20} />
            </div>
            <div>
              <p className="admin-login-feature-text">Official Verification Auditing</p>
              <p className="admin-login-feature-desc">Inspect & cross-check DRAP drug licenses & PVMC credentials</p>
            </div>
          </div>

          <div className="admin-login-feature-item">
            <div className="admin-login-feature-icon">
              <Activity size={20} />
            </div>
            <div>
              <p className="admin-login-feature-text">AI Disease Surveillance</p>
              <p className="admin-login-feature-desc">Real-time health telemetry & clinical analytics</p>
            </div>
          </div>

          <div className="admin-login-feature-item">
            <div className="admin-login-feature-icon">
              <Lock size={20} />
            </div>
            <div>
              <p className="admin-login-feature-text">Enterprise Security & RBAC</p>
              <p className="admin-login-feature-desc">256-bit encrypted access & administrative audit trails</p>
            </div>
          </div>
        </div>

        <div className="admin-login-security-prompt">
          <span className="admin-login-security-tag">
            🔒 Restricted Access Console
          </span>
          <p className="admin-login-prompt-text">
            Enterprise portal for authorized platform administrators only.
          </p>
        </div>
      </div>

      {/* Right Form Sidepane */}
      <div className="admin-login-form-pane">
        <div className="admin-login-card">
          {/* Mobile Brand Header */}
          <div className="admin-login-mobile-brand">
            <div className="admin-login-mobile-logo-ring">
              <img src={logoImg} alt="Maveshi Sehat AI" className="admin-login-mobile-logo" />
            </div>
            <h2 className="admin-login-mobile-title">Maveshi Sehat AI</h2>
            <span className="admin-login-mobile-badge">Admin Portal</span>
          </div>

          <h2 className="admin-login-card-title">Welcome Back</h2>
          <p className="admin-login-card-subtitle">Login to access the administrative console</p>

          {errorMsg && (
            <div className="admin-login-alert">
              <ShieldAlert size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="admin-login-form" autoComplete="off">
            <div className="form-group">
              <label className="form-label">Email or Phone Number</label>
              <div className="admin-input-wrapper">
                {isEmail ? (
                  <Mail size={18} className="admin-input-icon-left" />
                ) : (
                  <Phone size={18} className="admin-input-icon-left" />
                )}
                <input
                  type="text"
                  name="admin_identifier"
                  id="admin_identifier"
                  autoComplete="off"
                  required
                  placeholder="admin@maveshisehat.pk or 03XXXXXXXXX"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="form-control admin-login-input"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="admin-input-wrapper">
                <Lock size={18} className="admin-input-icon-left" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="admin_password"
                  id="admin_password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-control admin-login-input password-input"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="admin-toggle-password"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="admin-login-options">
              <label className="admin-remember-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="admin-remember-input"
                />
                <span>Remember me</span>
              </label>
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  setForgotIdentifier(identifier);
                  setResetOtp('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setForgotError('');
                  setForgotStep(1);
                  setShowForgotModal(true);
                }}
                className="admin-forgot-link"
              >
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              className="admin-login-submit-btn"
              disabled={loading}
            >
              <LogIn size={18} />
              <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
            </button>
          </form>

          <div className="admin-login-card-footer">
            <span className="admin-login-footer-security">
              🛡️ Protected by Enterprise Multi-Layer Authentication
            </span>
            <p className="admin-login-footer-copy">
              Maveshi Sehat AI • Administrative Control Center
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="admin-reset-modal-backdrop">
          <div className="admin-reset-modal-card">
            {/* Modal Header */}
            <div className="admin-reset-modal-header">
              <div className="flex items-center gap-2.5">
                <KeyRound size={22} color="#86efac" />
                <h4 className="admin-reset-modal-title">Reset Admin Password</h4>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="admin-reset-close-btn"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="admin-reset-modal-body">
              {forgotError && (
                <div className="admin-reset-alert">
                  <AlertCircle size={16} />
                  <span>{forgotError}</span>
                </div>
              )}

              {/* Step 1: Identifier */}
              {forgotStep === 1 && (
                <form onSubmit={handleSendResetCode}>
                  <p className="admin-reset-desc">
                    Enter your registered email address or phone number. We will send a 4-digit verification code to reset your password.
                  </p>
                  <div className="mb-4">
                    <label className="admin-reset-label">
                      Email or Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="admin@maveshisehat.pk or 03XXXXXXXXX"
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      className="form-control admin-reset-input"
                    />
                  </div>
                  <button
                    type="submit"
                    className="admin-reset-submit-btn"
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? 'Sending Verification Code...' : 'Send Verification Code'}
                  </button>
                </form>
              )}

              {/* Step 2: OTP + New Password */}
              {forgotStep === 2 && (
                <form onSubmit={handleResetPassword}>
                  <p className="admin-reset-desc">
                    A 4-digit code was sent to <strong className="text-emerald-500">{targetEmail}</strong>. Please enter the code and your new password.
                  </p>
                  <div className="mb-3.5">
                    <label className="admin-reset-label">
                      4-Digit Code
                    </label>
                    <input
                      type="text"
                      name="resetOtp"
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      placeholder="• • • •"
                      maxLength={4}
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value)}
                      className="admin-reset-otp-input"
                    />
                  </div>
                  <div className="mb-3.5">
                    <label className="admin-reset-label">
                      New Password
                    </label>
                    <input
                      type="password"
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="form-control admin-reset-input"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="admin-reset-label">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="form-control admin-reset-input"
                    />
                  </div>
                  <button
                    type="submit"
                    className="admin-reset-submit-btn"
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? 'Updating Password...' : 'Set New Password'}
                  </button>
                </form>
              )}

              {/* Step 3: Success */}
              {forgotStep === 3 && (
                <div className="admin-reset-success-box">
                  <CheckCircle size={48} className="admin-reset-success-icon" />
                  <h4 className="admin-reset-success-title">Password Reset Complete</h4>
                  <p className="admin-reset-success-desc">
                    {forgotSuccess || 'Your admin credentials have been successfully updated.'}
                  </p>
                  <button
                    onClick={() => {
                      setShowForgotModal(false);
                      setForgotStep(1);
                    }}
                    className="admin-reset-submit-btn"
                  >
                    Return to Login
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
