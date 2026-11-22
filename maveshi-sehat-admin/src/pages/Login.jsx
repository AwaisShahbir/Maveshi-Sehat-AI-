import { API_BASE_URL } from '../config';
import React, { useState } from 'react';
import { Lock, Mail, Phone, AlertCircle, Eye, EyeOff, CheckCircle, KeyRound, X } from 'lucide-react';
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
    <div className="login-page-container">

      <div className="login-card">

        {/* Brand Header */}
        <div className="login-brand-header">
          <img
            src={logoImg}
            alt="Maveshi Sehat AI"
            className="login-logo-img"
          />
          <h2 className="login-brand-name">Maveshi Sehat AI</h2>
          <span className="login-brand-badge">Admin Panel</span>
        </div>

        <div className="login-header-text">
          <h3 className="login-title">Administrator Login</h3>
          <p className="login-subtitle">Enter your email or phone number to access the console</p>
        </div>

        {errorMsg && (
          <div className="login-error-container">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">

          <div className="form-group">
            <label className="form-label">Email Address or Phone Number</label>
            <div className="login-input-wrapper">
              {isEmail ? (
                <Mail size={18} className="login-input-icon" />
              ) : (
                <Phone size={18} className="login-input-icon" />
              )}
              <input
                type="text"
                className="form-control login-form-input"
                placeholder="admin@maveshisehat.pk or 03XXXXXXXXX"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="login-input-wrapper">
              <Lock size={18} className="login-input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                className="form-control login-form-input password-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="login-toggle-password"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="login-options-row">
            <label className="login-remember-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="login-remember-input"
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
              className="login-forgot-link"
            >
              Forgot Password?
            </a>
          </div>

          <button
            type="submit"
            className="btn btn-primary login-submit-button"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In to Dashboard'}
          </button>
        </form>

        <div className="login-security-notice">
          <span>🔒 Secure administrator portal access</span>
        </div>

      </div>

      <div className="login-footer-text">
        <div>Maveshi Sehat AI Admin Panel</div>
        <div>© 2025 Maveshi Sehat AI</div>
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
                      onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="form-control admin-reset-otp-input"
                    />
                  </div>
                  <div className="mb-3.5">
                    <label className="admin-reset-label">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      autoComplete="new-password"
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="form-control admin-reset-input"
                    />
                  </div>
                  <div className="mb-4.5">
                    <label className="admin-reset-label">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      autoComplete="new-password"
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
                    {forgotLoading ? 'Updating Password...' : 'Save New Password'}
                  </button>
                </form>
              )}

              {/* Step 3: Success */}
              {forgotStep === 3 && (
                <div className="admin-reset-success-box">
                  <CheckCircle size={48} color="#10b981" className="mx-auto mb-3" />
                  <h4 className="m-0 mb-2 text-slate-900 font-bold">Password Reset Complete!</h4>
                  <p className="text-xs text-slate-500 mb-5">
                    {forgotSuccess}
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
