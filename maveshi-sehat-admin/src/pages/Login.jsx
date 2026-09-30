import React, { useState } from 'react';
import { Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';
import logoImg from '../assets/logo.png';

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
    <div className="login-page-container" style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f1f5f9',
      padding: '24px'
    }}>
      
      <div className="login-card" style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        padding: '40px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        
        {/* Brand Header */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '32px',
          textAlign: 'center'
        }}>
          <img 
            src={logoImg} 
            alt="Maveshi Sehat AI" 
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              marginBottom: '16px',
              boxShadow: '0 4px 12px rgba(19, 84, 49, 0.15)'
            }}
          />
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#135431',
            fontFamily: 'var(--font-heading)',
            margin: 0
          }}>Maveshi Sehat AI</h2>
          <span style={{
            fontSize: '11px',
            fontWeight: '600',
            color: '#3da860',
            backgroundColor: '#eff7f2',
            padding: '4px 12px',
            borderRadius: '12px',
            marginTop: '8px',
            display: 'inline-block',
            border: '1px solid rgba(61, 168, 96, 0.2)'
          }}>Admin Panel</span>
        </div>

        <div style={{ width: '100%', marginBottom: '20px' }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#1f2937',
            marginBottom: '4px',
            textAlign: 'left'
          }}>Administrator Login</h3>
          <p style={{
            fontSize: '13px',
            color: '#6b7280',
            margin: 0,
            textAlign: 'left'
          }}>Enter your credentials to access the console</p>
        </div>

        {errorMsg && (
          <div className="login-error-container" style={{
            width: '100%',
            backgroundColor: 'var(--color-red-light)',
            color: 'var(--color-red)',
            padding: '12px 16px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '20px'
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form" style={{ width: '100%' }}>
          
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '6px',
              display: 'block'
            }}>Email Address</label>
            <div className="login-input-wrapper" style={{ position: 'relative' }}>
              <Mail size={18} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af',
                pointerEvents: 'none'
              }} />
              <input 
                type="email" 
                className="form-control"
                style={{
                  width: '100%',
                  height: '46px',
                  paddingLeft: '44px',
                  paddingRight: '14px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#f9fafb',
                  fontSize: '14px'
                }}
                placeholder="admin@maveshisehat.pk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '6px',
              display: 'block'
            }}>Password</label>
            <div className="login-input-wrapper" style={{ position: 'relative' }}>
              <Lock size={18} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af',
                pointerEvents: 'none'
              }} />
              <input 
                type={showPassword ? "text" : "password"} 
                className="form-control"
                style={{
                  width: '100%',
                  height: '46px',
                  paddingLeft: '44px',
                  paddingRight: '44px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#f9fafb',
                  fontSize: '14px'
                }}
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9ca3af',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            marginBottom: '24px',
            width: '100%'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4b5563', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  accentColor: '#3da860',
                  width: '14px',
                  height: '14px',
                  cursor: 'pointer'
                }}
              />
              <span>Remember me</span>
            </label>
            <a href="#forgot" onClick={(e) => { e.preventDefault(); alert("Please contact system administrator to reset password."); }} style={{
              color: '#3da860',
              fontWeight: '600',
              textDecoration: 'none'
            }}>Forgot Password?</a>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            style={{
              width: '100%',
              height: '48px',
              fontSize: '15px',
              fontWeight: '600',
              backgroundColor: '#3da860',
              borderColor: '#3da860',
              color: '#ffffff',
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(61, 168, 96, 0.2)'
            }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In to Dashboard'}
          </button>
        </form>

        <div style={{
          marginTop: '20px',
          fontSize: '11px',
          color: '#9ca3af',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            🔒 Secure administrator portal access
          </span>
        </div>

      </div>

      <div style={{
        marginTop: '24px',
        textAlign: 'center',
        fontSize: '12px',
        color: '#6b7280',
        lineHeight: '1.6'
      }}>
        <div>Maveshi Sehat AI Admin Panel</div>
        <div style={{ opacity: 0.8 }}>© 2025 Riphah International University</div>
      </div>

    </div>
  );
}
