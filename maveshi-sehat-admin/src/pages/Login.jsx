import React, { useState } from 'react';
import { Lock, Mail, AlertCircle } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password.trim()) {
      return setErrorMsg('Please enter your email and password.');
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'admin' })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed. Please try again.');
      }
      
      // Call parent success trigger
      onLoginSuccess(data.user);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-card">
        {/* Brand Header */}
        <div className="login-brand">
          <div className="login-logo">M</div>
          <h2 className="login-brand-name">Maveshi Sehat AI</h2>
          <span className="login-brand-tag">Admin Dashboard / ایڈمن پینل</span>
        </div>

        {/* Info text */}
        <p className="login-subtitle">
          Please sign in to access your administrative workspace.
          <br />
          <span style={{ fontSize: '12px', opacity: 0.8 }}>لاگ ان کریں اور اپنا کام شروع کریں</span>
        </p>

        {/* Error Alert */}
        {errorMsg && (
          <div className="login-error-container">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Email field */}
          <div className="form-group">
            <label className="form-label">Email Address / ای میل</label>
            <div className="login-input-wrapper">
              <Mail size={18} className="login-input-icon" />
              <input 
                type="email" 
                className="form-control login-input"
                placeholder="admin@maveshisehat.pk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Password field */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Password / پاس ورڈ</label>
            <div className="login-input-wrapper">
              <Lock size={18} className="login-input-icon" />
              <input 
                type="password" 
                className="form-control login-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Submit button */}
          <button 
            type="submit" 
            className="btn btn-primary login-submit-btn"
            disabled={loading}
          >
            {loading ? 'Signing in... / لاگ ان ہو رہا ہے...' : 'لاگ ان / Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
