import React, { useState } from 'react';
import { Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
      
      onLoginSuccess(data.user);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100vw',
      background: 'linear-gradient(180deg, #eff7f2 0%, #e3f2e8 100%)',
      padding: '24px',
      fontFamily: 'var(--font-main)'
    }}>
      <div className="login-card" style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        boxShadow: '0 20px 40px rgba(0, 74, 32, 0.06)',
        border: '1px solid rgba(61, 168, 96, 0.12)',
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        
        <div className="login-brand" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          marginBottom: '24px',
          width: '100%'
        }}>
          <div style={{
            width: '88px',
            height: '88px',
            borderRadius: '50%',
            backgroundColor: '#135431',
            border: '4px solid #3da860',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            overflow: 'hidden'
          }}>
            <img src={logoImg} alt="Maveshi Sehat Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#135431',
            fontFamily: 'var(--font-heading)',
            margin: 0
          }}>Maveshi Sehat AI</h2>
          <span className="urdu" style={{
            fontSize: '18px',
            color: '#135431',
            fontWeight: '500',
            display: 'block',
            marginTop: '2px'
          }}>مویشی صحت اے آئی</span>
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

        
        <div style={{ width: '100%' }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#1f2937',
            marginBottom: '4px',
            textAlign: 'left'
          }}>Administrator Login</h3>
          <p className="urdu" style={{
            fontSize: '14px',
            color: '#6b7280',
            marginBottom: '20px',
            textAlign: 'left'
          }}>ایڈمنسٹریٹر لاگ ان</p>
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
            }}>Email / ای میل</label>
            <div className="login-input-wrapper">
              <Mail size={18} className="login-input-icon" style={{
                position: 'absolute',
                left: '14px',
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
            }}>Password / پاس ورڈ</label>
            <div className="login-input-wrapper" style={{ position: 'relative' }}>
              <Lock size={18} className="login-input-icon" style={{
                position: 'absolute',
                left: '14px',
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
            {loading ? 'Signing in... / لاگ ان ہو رہا ہے...' : 'Login to Dashboard / ڈیش بورڈ میں لاگ ان کریں'}
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
            🔒 Secure admin access only
          </span>
          <span className="urdu">صرف محفوظ ایڈمن رسائی</span>
        </div>

      </div>

      
      <div style={{
        marginTop: '24px',
        textAlign: 'center',
        fontSize: '12px',
        color: '#6b7280',
        lineHeight: '1.6'
      }}>
        <div>Maveshi Sehat AI Admin Panel v1.0</div>
        <div style={{ opacity: 0.8 }}>© 2025 Riphah International University</div>
      </div>

    </div>
  );
}
