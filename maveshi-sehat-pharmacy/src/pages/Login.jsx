import { API_BASE_URL } from '../config';
import React, { useState } from 'react';
import { ShieldAlert, CheckCircle, Clock, Heart, TrendingUp, KeyRound, Mail, LogIn, Eye, EyeOff } from 'lucide-react';
import '../styles/Login.css';

export default function Login({ onLoginSuccess, onViewChange }) {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/pharmacy/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailOrPhone, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Login failed.');
      }

      onLoginSuccess(data.pharmacy);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pharmacy-login-wrapper">
      {/* Left Branding Sidepane */}
      <div className="pharmacy-login-branding">
        <div className="pharmacy-login-brand-header">
          <div className="pharmacy-login-logo-ring">
            <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="#3da860" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M12 8v8M8 12h8" strokeWidth="3" />
            </svg>
          </div>
          <h1 className="pharmacy-login-brand-title">Maveshi Sehat AI</h1>
          <h2 className="pharmacy-login-brand-subtitle">Pharmacy Portal</h2>
        </div>

        <div className="pharmacy-login-features">
          <div className="pharmacy-login-feature-item">
            <div className="pharmacy-login-feature-icon">
              <CheckCircle size={20} />
            </div>
            <div>
              <p className="pharmacy-login-feature-text">Verified & trusted platform</p>
            </div>
          </div>

          <div className="pharmacy-login-feature-item">
            <div className="pharmacy-login-feature-icon">
              <Clock size={20} />
            </div>
            <div>
              <p className="pharmacy-login-feature-text">Real-time order management</p>
            </div>
          </div>

          <div className="pharmacy-login-feature-item">
            <div className="pharmacy-login-feature-icon">
              <Heart size={20} />
            </div>
            <div>
              <p className="pharmacy-login-feature-text">Direct farmer-pharmacy connection</p>
            </div>
          </div>

          <div className="pharmacy-login-feature-item">
            <div className="pharmacy-login-feature-icon">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="pharmacy-login-feature-text">Grow your medicine business</p>
            </div>
          </div>
        </div>

        <div className="pharmacy-login-register-prompt">
          <p className="pharmacy-login-prompt-text">Don't have an account?</p>
          <button 
            type="button"
            className="pharmacy-login-link-btn"
            onClick={() => onViewChange('register')}
          >
            Register your pharmacy
          </button>
        </div>
      </div>

      {/* Right Form Sidepane */}
      <div className="pharmacy-login-form-pane">
        <div className="pharmacy-login-card">
          <h2 className="pharmacy-login-card-title">Welcome Back</h2>
          <p className="pharmacy-login-card-subtitle">Login to your pharmacy portal</p>

          {error && (
            <div className="pharmacy-login-alert">
              <ShieldAlert size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="pharmacy-login-form" autoComplete="off">
            <div className="form-group">
              <label className="form-label">
                Email or Phone Number
              </label>
              <div className="relative flex items-center">
                <Mail size={18} className="pharmacy-input-icon-left" />
                <input
                  type="text"
                  name="pharmacy_user_id"
                  id="pharmacy_user_id"
                  autoComplete="off"
                  required
                  placeholder="Enter email or phone"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  className="form-control pharmacy-login-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Password
              </label>
              <div className="relative flex items-center">
                <KeyRound size={18} className="pharmacy-input-icon-left" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="pharmacy_user_pwd"
                  id="pharmacy_user_pwd"
                  autoComplete="new-password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-control pharmacy-login-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="pharmacy-input-icon-right"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="pharmacy-login-options-row">
              <label className="pharmacy-login-remember">
                <input type="checkbox" className="cursor-pointer rounded border-slate-300 text-[#3da860] focus:ring-[#3da860]" />
                <span>Remember me</span>
              </label>
              <button 
                type="button" 
                className="pharmacy-login-forgot"
              >
                Forgot Password?
              </button>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="pharmacy-login-submit-btn"
            >
              <LogIn size={18} />
              <span>{loading ? 'Logging in...' : 'Login to Dashboard'}</span>
            </button>
          </form>

          <div className="pharmacy-login-divider">
            <div className="pharmacy-login-divider-line"></div>
            <span className="pharmacy-login-divider-text">OR</span>
            <div className="pharmacy-login-divider-line"></div>
          </div>

          <button
            type="button"
            onClick={() => onViewChange('register')}
            className="pharmacy-login-secondary-btn"
          >
            Register New Pharmacy
          </button>

          <div className="pharmacy-login-footer">
            Need help? Contact support at <a href="mailto:support@maveshisehat.ai">support@maveshisehat.ai</a>
          </div>
        </div>
      </div>
    </div>
  );
}
