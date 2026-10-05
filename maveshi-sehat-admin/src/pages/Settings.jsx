import React, { useState, useEffect, useRef } from 'react';
import { User, Lock, Bell, Settings as SettingsIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import '../styles/Settings.css';

export default function Settings({ onProfileUpdate }) {
  const [subTab, setSubTab] = useState('profile');
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  // Profile Form States
  const [profileName, setProfileName] = useState('Awais Shabbir');
  const [profileEmail, setProfileEmail] = useState('maveshisehatai@gmail.com');
  const [profilePhone, setProfilePhone] = useState('03240650810');
  const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem('adminAvatar') || '');
  const fileInputRef = useRef(null);

  // Security Form States
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  // Notification Preferences States
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(true);
  const [outbreakAlerts, setOutbreakAlerts] = useState(true);
  const [newUserReg, setNewUserReg] = useState(true);
  const [vetReq, setVetReq] = useState(true);

  // System Settings States
  const [threshold, setThreshold] = useState(85);
  const [language, setLanguage] = useState('Both');
  const [timezone, setTimezone] = useState('utc-5');
  const [enforceAdminLanguage, setEnforceAdminLanguage] = useState(true);

  // Load initial settings and profile from backend API
  useEffect(() => {
    const fetchProfileAndSettings = async () => {
      try {
        const [profileRes, settingsRes] = await Promise.all([
          fetch('http://localhost:5000/api/admin/profile'),
          fetch('http://localhost:5000/api/admin/settings')
        ]);

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData.fullName || profileData.full_name) {
            setProfileName(profileData.fullName || profileData.full_name);
          }
          if (profileData.email) setProfileEmail(profileData.email);
          if (profileData.phoneNumber || profileData.phone_number) {
            setProfilePhone(profileData.phoneNumber || profileData.phone_number);
          }
        }

        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          if (settingsData.notifications) {
            const notifs = settingsData.notifications;
            if (notifs.emailNotif !== undefined) setEmailNotif(notifs.emailNotif);
            if (notifs.smsNotif !== undefined) setSmsNotif(notifs.smsNotif);
            if (notifs.outbreakAlerts !== undefined) setOutbreakAlerts(notifs.outbreakAlerts);
            if (notifs.newUserReg !== undefined) setNewUserReg(notifs.newUserReg);
            if (notifs.vetReq !== undefined) setVetReq(notifs.vetReq);
          }
          if (settingsData.system) {
            const sys = settingsData.system;
            if (sys.threshold !== undefined) setThreshold(sys.threshold);
            if (sys.language !== undefined) setLanguage(sys.language);
            if (sys.timezone !== undefined) setTimezone(sys.timezone);
            if (sys.enforceAdminLanguage !== undefined) setEnforceAdminLanguage(sys.enforceAdminLanguage);
          }
        }
      } catch (err) {
        console.error('Failed to load settings from server:', err);
      }
    };

    fetchProfileAndSettings();
  }, []);

  // Compute initials dynamically (e.g. Awais Shabbir -> AS)
  const getInitials = (name) => {
    if (!name) return 'AS';
    return name
      .trim()
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setFeedback({ type: 'error', message: 'Avatar image must be under 2MB.' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        setAvatarUrl(base64);
        localStorage.setItem('adminAvatar', base64);
        setFeedback({ type: 'success', message: 'Avatar updated successfully.' });
        window.dispatchEvent(new Event('adminAvatarUpdated'));
      };
      reader.readAsDataURL(file);
    }
  };

  // 1. Save Profile
  const handleProfileSave = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: profileName,
          phone_number: profilePhone,
          email: profileEmail
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile.');
      }

      setFeedback({ type: 'success', message: 'Profile details saved successfully.' });

      // Update sessionStorage so header and sidebar reflect the change
      const saved = sessionStorage.getItem('adminUser');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          parsed.user = {
            ...parsed.user,
            full_name: data.user.full_name,
            fullName: data.user.full_name,
            email: data.user.email,
            phone_number: data.user.phone_number
          };
          sessionStorage.setItem('adminUser', JSON.stringify(parsed));
        } catch {
          // ignore
        }
      }

      if (onProfileUpdate) {
        onProfileUpdate(data.user);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Error updating profile.' });
    } finally {
      setLoading(false);
    }
  };

  // 2. Change Password
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    if (!currentPwd || !newPwd || !confirmPwd) {
      setFeedback({ type: 'error', message: 'Please fill in all password fields.' });
      return;
    }

    if (newPwd !== confirmPwd) {
      setFeedback({ type: 'error', message: 'New password and confirmation do not match.' });
      return;
    }

    if (newPwd.length < 6) {
      setFeedback({ type: 'error', message: 'New password must be at least 6 characters long.' });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: currentPwd,
          newPassword: newPwd
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password.');
      }

      setFeedback({ type: 'success', message: 'Password updated successfully.' });
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Error updating password.' });
    } finally {
      setLoading(false);
    }
  };

  // 3. Save Notification Preferences
  const handleNotifSave = async () => {
    setFeedback({ type: '', message: '' });
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'notifications',
          value: {
            emailNotif,
            smsNotif,
            outbreakAlerts,
            newUserReg,
            vetReq
          }
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save notifications.');
      }

      setFeedback({ type: 'success', message: 'Notification preferences saved successfully.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Error saving notification preferences.' });
    } finally {
      setLoading(false);
    }
  };

  // 4. Save System Settings
  const handleSystemSave = async () => {
    setFeedback({ type: '', message: '' });
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'system',
          value: {
            threshold: Number(threshold),
            language,
            timezone,
            enforceAdminLanguage
          }
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save system settings.');
      }

      setFeedback({ type: 'success', message: 'System configurations applied successfully.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Error saving system settings.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-view">
      <div className="settings-layout">
        
        {/* Navigation Sidebar */}
        <div className="settings-nav">
          {[
            { id: 'profile', label: 'Profile & Account', icon: <User size={18} /> },
            { id: 'security', label: 'Security', icon: <Lock size={18} /> },
            { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
            { id: 'system', label: 'System Settings', icon: <SettingsIcon size={18} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setSubTab(tab.id);
                setFeedback({ type: '', message: '' });
              }}
              className={`settings-nav-item ${subTab === tab.id ? 'active' : ''}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Box */}
        <div className="card settings-content-card">

          {/* Feedback Banner */}
          {feedback.message && (
            <div className={`settings-alert ${feedback.type === 'success' ? 'alert-success' : 'alert-error'}`}>
              {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{feedback.message}</span>
            </div>
          )}
          
          {subTab === 'profile' && (
            <form onSubmit={handleProfileSave}>
              <h3 className="settings-heading">Admin Profile</h3>
              <p className="settings-subheading">Account & Personal Information</p>

              <div className="settings-avatar-row">
                <div className="settings-avatar-circle">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="settings-avatar-img" />
                  ) : (
                    getInitials(profileName)
                  )}
                </div>
                <div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    accept="image/*" 
                    onChange={handleAvatarChange} 
                  />
                  <button 
                    type="button" 
                    className="btn btn-secondary settings-avatar-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Upload New Avatar
                  </button>
                  <span className="settings-avatar-hint">
                    JPG, PNG max 2MB
                  </span>
                </div>
              </div>

              <div className="settings-form-grid">
                <div className="form-group">
                  <label className="form-label settings-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control settings-input"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label settings-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control settings-input"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label settings-label">Phone Number</label>
                  <input
                    type="text"
                    className="form-control settings-input"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label settings-label">Role</label>
                  <input
                    type="text"
                    className="form-control settings-input-disabled"
                    value="Super Administrator"
                    disabled
                    title="Account authorization role is fixed by system administrator policy"
                  />
                </div>
              </div>

              <div className="settings-form-footer">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary settings-save-btn"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {subTab === 'security' && (
            <form onSubmit={handlePasswordUpdate}>
              <h3 className="settings-heading">Security Settings</h3>
              <p className="settings-subheading">Password & Authentication</p>

              <div className="settings-security-form">
                <div className="form-group">
                  <label className="form-label settings-label">Current Password</label>
                  <input
                    type="password"
                    className="form-control settings-input"
                    placeholder="Enter current password"
                    value={currentPwd}
                    onChange={(e) => setCurrentPwd(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label settings-label">New Password</label>
                  <input
                    type="password"
                    className="form-control settings-input"
                    placeholder="At least 6 characters"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label settings-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-control settings-input"
                    placeholder="Re-enter new password"
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="settings-form-footer">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary settings-save-btn"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}

          {subTab === 'notifications' && (
            <div>
              <h3 className="settings-heading">Notification Preferences</h3>
              <p className="settings-subheading">System Alert Channels</p>

              <div className="settings-notif-list">
                {[
                  { id: 'email', label: 'Email Notifications', desc: 'Receive urgent security alerts via email', val: emailNotif, set: setEmailNotif },
                  { id: 'sms', label: 'SMS Notifications', desc: 'Critical outbreak alerts sent via SMS gateway', val: smsNotif, set: setSmsNotif },
                  { id: 'outbreak', label: 'Outbreak Alerts', desc: 'Notify immediately when 3+ cases occur in one district', val: outbreakAlerts, set: setOutbreakAlerts },
                  { id: 'reg', label: 'New User Registration', desc: 'Summary of new farmer sign-ups', val: newUserReg, set: setNewUserReg },
                  { id: 'vet', label: 'Vet Verification Requests', desc: 'Alerts when doctors submit PVMC license documents', val: vetReq, set: setVetReq }
                ].map((item) => (
                  <div key={item.id} className="settings-notif-item">
                    <div>
                      <span className="settings-notif-title">{item.label}</span>
                      <span className="settings-notif-desc">{item.desc}</span>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={item.val}
                        onChange={(e) => item.set(e.target.checked)}
                        className="settings-toggle-checkbox"
                      />
                      <span className={`settings-toggle-slider ${item.val ? 'active' : ''}`}>
                        <span className={`settings-toggle-knob ${item.val ? 'active' : ''}`} />
                      </span>
                    </label>
                  </div>
                ))}
              </div>

              <div className="settings-form-footer">
                <button
                  type="button"
                  onClick={handleNotifSave}
                  disabled={loading}
                  className="btn btn-primary settings-save-btn"
                >
                  {loading ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </div>
          )}

          {subTab === 'system' && (
            <div>
              <h3 className="settings-heading">Settings & Configuration</h3>
              <p className="settings-subheading">AI Model and System Parameters</p>

              <div className="settings-ai-section">
                <h4 className="settings-ai-title">AI Model Configuration</h4>
                
                <div className="settings-slider-wrap">
                  <div className="settings-slider-header">
                    <span>Minimum Confidence Threshold</span>
                    <strong className="settings-slider-accent">{threshold}%</strong>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    className="settings-slider-input"
                  />
                  <span className="settings-slider-hint">
                    Detections with confidence below this threshold will automatically require veterinary validation.
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '20px', padding: '16px', background: '#F8FAF9', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '14px', color: '#1E293B', display: 'block' }}>
                      Enforce Admin Language on Mobile App
                    </span>
                    <span className="settings-slider-hint" style={{ marginTop: '3px', display: 'block' }}>
                      {enforceAdminLanguage 
                        ? 'Active: App language is strictly controlled by Admin. Mobile users cannot change it.' 
                        : 'Disabled: Mobile app users and Veterinarians can choose their own preferred language in profile.'}
                    </span>
                  </div>
                  <label className="settings-toggle">
                    <input
                      type="checkbox"
                      checked={enforceAdminLanguage}
                      onChange={(e) => setEnforceAdminLanguage(e.target.checked)}
                      className="settings-toggle-checkbox"
                    />
                    <span className={`settings-toggle-slider ${enforceAdminLanguage ? 'active' : ''}`}>
                      <span className={`settings-toggle-knob ${enforceAdminLanguage ? 'active' : ''}`} />
                    </span>
                  </label>
                </div>
              </div>

              <div className="settings-grid-options">
                <div>
                  <span className="settings-select-label">Mobile App & System Language</span>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="form-control settings-input"
                    disabled={!enforceAdminLanguage}
                    style={!enforceAdminLanguage ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                  >
                    <option value="English">English</option>
                    <option value="Urdu">Urdu</option>
                    <option value="Both">Both (English & Urdu)</option>
                  </select>
                  <span className="settings-slider-hint" style={{ marginTop: '4px', display: 'block' }}>
                    {enforceAdminLanguage 
                      ? 'Controls the global language across the mobile app.' 
                      : 'Disabled while admin enforcement is OFF. Turn ON toggle above to lock language.'}
                  </span>
                </div>

                <div>
                  <span className="settings-select-label">System Timezone</span>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="form-control settings-input"
                  >
                    <option value="utc-5">Asia/Karachi (PKT, UTC+5)</option>
                    <option value="utc">UTC (Universal Time)</option>
                  </select>
                </div>
              </div>

              <div className="settings-form-footer">
                <button
                  type="button"
                  onClick={handleSystemSave}
                  disabled={loading}
                  className="btn btn-primary settings-save-btn"
                >
                  {loading ? 'Applying...' : 'Apply System Settings'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
