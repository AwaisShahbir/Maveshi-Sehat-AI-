import React, { useState } from 'react';
import { User, Lock, Bell, Settings as SettingsIcon } from 'lucide-react';
import '../styles/Settings.css';

export default function Settings() {
  const [subTab, setSubTab] = useState('profile');

  const [profileName, setProfileName] = useState(() => {
    try {
      const saved = sessionStorage.getItem('adminUser');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.user?.full_name || 'Super Admin';
      }
    } catch {
      // ignore
    }
    return 'Super Admin';
  });

  const [profileEmail, setProfileEmail] = useState(() => {
    try {
      const saved = sessionStorage.getItem('adminUser');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.user?.email || 'admin@maveshisehat.pk';
      }
    } catch {
      // ignore
    }
    return 'admin@maveshisehat.pk';
  });

  const [profilePhone, setProfilePhone] = useState('+92 300 1234567');

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(true);
  const [outbreakAlerts, setOutbreakAlerts] = useState(true);
  const [newUserReg, setNewUserReg] = useState(true);
  const [vetReq, setVetReq] = useState(true);

  const [threshold, setThreshold] = useState(85);
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('utc-5');

  const handleProfileSave = (e) => {
    e.preventDefault();
    alert('Profile changes saved successfully.');
  };

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      alert('Passwords do not match.');
      return;
    }
    alert('Password updated successfully.');
    setCurrentPwd('');
    setNewPwd('');
    setConfirmPwd('');
  };

  const handleNotifSave = () => {
    alert('Notification preferences updated.');
  };

  const handleSystemSave = () => {
    alert('System configurations applied.');
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
              onClick={() => setSubTab(tab.id)}
              className={`settings-nav-item ${subTab === tab.id ? 'active' : ''}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Box */}
        <div className="card settings-content-card">
          
          {subTab === 'profile' && (
            <form onSubmit={handleProfileSave}>
              <h3 className="settings-heading">Admin Profile</h3>
              <p className="settings-subheading">Account & Personal Information</p>

              <div className="settings-avatar-row">
                <div className="settings-avatar-circle">
                  SA
                </div>
                <div>
                  <button type="button" className="btn btn-secondary settings-avatar-btn">
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
                  />
                </div>

                <div className="form-group">
                  <label className="form-label settings-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control settings-input"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label settings-label">Phone Number</label>
                  <input
                    type="text"
                    className="form-control settings-input"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label settings-label">Role</label>
                  <input
                    type="text"
                    className="form-control settings-input-disabled"
                    value="Super Administrator"
                    disabled
                  />
                </div>
              </div>

              <div className="settings-form-footer">
                <button
                  type="submit"
                  className="btn btn-primary settings-save-btn"
                >
                  Save Changes
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
                  />
                </div>

                <div className="form-group">
                  <label className="form-label settings-label">New Password</label>
                  <input
                    type="password"
                    className="form-control settings-input"
                    placeholder="At least 8 characters"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
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
                  />
                </div>
              </div>

              <div className="settings-form-footer">
                <button
                  type="submit"
                  className="btn btn-primary settings-save-btn"
                >
                  Update Password
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
                  className="btn btn-primary settings-save-btn"
                >
                  Save Preferences
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

              <div className="settings-grid-options">
                <div>
                  <span className="settings-select-label">Interface Language</span>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="form-control settings-input"
                  >
                    <option value="en">English (US)</option>
                  </select>
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
                  className="btn btn-primary settings-save-btn"
                >
                  Apply System Settings
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
