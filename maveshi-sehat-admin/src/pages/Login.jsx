import React, { useState } from 'react';
import { Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';
import logoImg from '../assets/logo.png';
import './Login.css';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

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
          <p className="login-subtitle">Enter your credentials to access the console</p>
        </div>

        {errorMsg && (
          <div className="login-error-container">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="login-input-wrapper">
              <Mail size={18} className="login-input-icon" />
              <input 
                type="email" 
                className="form-control login-form-input"
                placeholder="admin@maveshisehat.pk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                placeholder="Enter admin password"
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
              onClick={(e) => { e.preventDefault(); alert("Please contact system administrator to reset password."); }} 
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
        <div>© 2025 Riphah International University</div>
      </div>

    </div>
  );
}
