import React, { useState } from 'react';
import { ShieldAlert, CheckCircle, Clock, Heart, TrendingUp, KeyRound, Mail, LogIn, Eye, EyeOff } from 'lucide-react';

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
      const response = await fetch('http://localhost:5000/api/pharmacy/login', {
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
    <div style={styles.container}>
      {/* Left Banner Section */}
      <div style={styles.leftBanner}>
        <div style={styles.logoContainer}>
          <div style={styles.logoCircle}>
            {/* Custom SVG logo resembling the cross and hands shape */}
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#10b981" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M12 8v8M8 12h8" strokeWidth="3" />
            </svg>
          </div>
          <h1 style={styles.brandTitle}>Maveshi Sehat AI</h1>
          <h2 style={styles.brandSubtitle}>Pharmacy Portal</h2>
          <p style={styles.brandUrdu} className="urdu">فارمیسی پورٹل</p>
        </div>

        <div style={styles.bulletsContainer}>
          <div style={styles.bulletItem}>
            <div style={styles.bulletIcon}><CheckCircle size={20} /></div>
            <div>
              <p style={styles.bulletText}>Verified & trusted platform</p>
              <p style={styles.bulletTextUrdu}>تصدیق شدہ اور قابل اعتماد پلیٹ فارم</p>
            </div>
          </div>

          <div style={styles.bulletItem}>
            <div style={styles.bulletIcon}><Clock size={20} /></div>
            <div>
              <p style={styles.bulletText}>Real-time order management</p>
              <p style={styles.bulletTextUrdu}>حقیقی وقت میں آرڈر کا انتظام</p>
            </div>
          </div>

          <div style={styles.bulletItem}>
            <div style={styles.bulletIcon}><Heart size={20} /></div>
            <div>
              <p style={styles.bulletText}>Direct farmer-pharmacy connection</p>
              <p style={styles.bulletTextUrdu}>کسان اور فارمیسی کا براہ راست رابطہ</p>
            </div>
          </div>

          <div style={styles.bulletItem}>
            <div style={styles.bulletIcon}><TrendingUp size={20} /></div>
            <div>
              <p style={styles.bulletText}>Grow your medicine business</p>
              <p style={styles.bulletTextUrdu}>اپنے دوا کے کاروبار کو بڑھائیں</p>
            </div>
          </div>
        </div>

        <div style={styles.footerLinkContainer}>
          <p style={styles.footerPrompt}>Don't have an account?</p>
          <button style={styles.linkButton} onClick={() => onViewChange('register')}>
            Register your pharmacy / اپنی فارمیسی رجسٹر کریں
          </button>
        </div>
      </div>

      {/* Right Login Form Section */}
      <div style={styles.rightForm}>
        <div style={styles.loginCard}>
          <h2 style={styles.cardHeader}>Welcome Back</h2>
          <p style={styles.cardHeaderSubtitle}>Login to your pharmacy portal</p>
          <p style={styles.cardHeaderUrdu}>اپنے فارمیسی پورٹل میں لاگ ان کریں</p>

          {error && (
            <div style={styles.errorBox}>
              <ShieldAlert size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div className="form-group">
              <label className="form-label">
                Email or Phone Number <span className="label-ur">ای میل یا فون نمبر</span>
              </label>
              <div style={styles.inputWrapper}>
                <Mail size={18} style={styles.inputIcon} />
                <input
                  type="text"
                  required
                  placeholder="Enter email or phone"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  style={styles.input}
                  className="form-control"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Password <span className="label-ur">پاس ورڈ</span>
              </label>
              <div style={styles.inputWrapper}>
                <KeyRound size={18} style={styles.inputIcon} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.input}
                  className="form-control"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={styles.flexRow}>
              <label style={styles.checkboxLabel}>
                <input type="checkbox" style={styles.checkbox} />
                <span>Remember me</span>
              </label>
              <button type="button" style={styles.forgotBtn}>Forgot Password?</button>
            </div>

            <button type="submit" disabled={loading} style={styles.submitBtn}>
              <LogIn size={18} />
              <span>{loading ? 'Logging in...' : 'Login to Dashboard / لاگ ان کریں'}</span>
            </button>
          </form>

          <div style={styles.divider}>
            <span style={styles.dividerText}>OR</span>
          </div>

          <button
            type="button"
            onClick={() => onViewChange('register')}
            style={styles.registerBtn}
          >
            Register New Pharmacy / فارمیسی رجسٹر کریں
          </button>

          <div style={styles.supportFooter}>
            Need help? Contact support at <a href="mailto:support@maveshisehat.ai" style={styles.supportLink}>support@maveshisehat.ai</a>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    width: '100vw',
  },
  leftBanner: {
    flex: '1.1',
    backgroundColor: '#0c1b15',
    backgroundImage: 'linear-gradient(135deg, #0c1b15 0%, #0d2a1d 100%)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px',
    borderRight: '1px solid #162f25',
    color: '#ffffff',
  },
  logoContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '40px',
  },
  logoCircle: {
    width: '90px',
    height: '90px',
    borderRadius: '50%',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '2px solid #10b981',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  brandTitle: {
    fontFamily: 'Outfit, sans-serif',
    fontSize: '32px',
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: '-0.5px',
  },
  brandSubtitle: {
    fontSize: '18px',
    fontWeight: '500',
    color: '#10b981',
    marginTop: '4px',
  },
  brandUrdu: {
    fontSize: '14px',
    color: '#10b981',
    marginTop: '4px',
  },
  bulletsContainer: {
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    marginBottom: '50px',
  },
  bulletItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
  },
  bulletIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#162f25',
    color: '#10b981',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: '0',
  },
  bulletText: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#ffffff',
  },
  bulletTextUrdu: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '2px',
  },
  footerLinkContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    borderTop: '1px solid #162f25',
    paddingTop: '24px',
    width: '100%',
    maxWidth: '400px',
  },
  footerPrompt: {
    fontSize: '14px',
    color: '#94a3b8',
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#10b981',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  rightForm: {
    flex: '1.2',
    backgroundColor: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
  },
  loginCard: {
    width: '100%',
    maxWidth: '460px',
    backgroundColor: '#1e293b',
    borderRadius: '24px',
    border: '1px solid #334155',
    padding: '48px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column',
  },
  cardHeader: {
    fontFamily: 'Outfit, sans-serif',
    fontSize: '28px',
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  cardHeaderSubtitle: {
    fontSize: '14px',
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: '4px',
  },
  cardHeaderUrdu: {
    fontSize: '12px',
    color: '#10b981',
    textAlign: 'center',
    marginTop: '2px',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    color: '#ef4444',
    padding: '12px 16px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '600',
    marginTop: '24px',
    border: '1px solid rgba(239, 68, 68, 0.2)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: '28px',
  },

  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    color: '#64748b',
  },
  input: {
    paddingLeft: '44px',
    paddingRight: '44px',
  },
  eyeBtn: {
    position: 'absolute',
    right: '14px',
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  flexRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '8px',
    marginBottom: '24px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#94a3b8',
    cursor: 'pointer',
  },
  checkbox: {
    cursor: 'pointer',
  },
  forgotBtn: {
    background: 'none',
    border: 'none',
    fontSize: '13px',
    color: '#10b981',
    fontWeight: '600',
    cursor: 'pointer',
  },
  submitBtn: {
    width: '100%',
    height: '48px',
    backgroundColor: '#10b981',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: '700',
    border: 'none',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '24px 0',
  },
  dividerText: {
    margin: '0 10px',
    color: '#64748b',
    fontSize: '12px',
    fontWeight: '700',
  },
  registerBtn: {
    width: '100%',
    height: '48px',
    backgroundColor: 'transparent',
    color: '#10b981',
    border: '1px solid #10b981',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  supportFooter: {
    textAlign: 'center',
    marginTop: '32px',
    fontSize: '12px',
    color: '#64748b',
  },
  supportLink: {
    color: '#10b981',
    fontWeight: '600',
  },
};
