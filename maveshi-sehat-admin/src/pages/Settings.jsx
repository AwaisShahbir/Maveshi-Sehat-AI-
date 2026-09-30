import React, { useState } from 'react';
import { User, Lock, Bell, Settings as SettingsIcon } from 'lucide-react';

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
      <div className="grid-2-1" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px' }}>
        
        {/* Navigation Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { id: 'profile', label: 'Profile & Account', icon: <User size={18} /> },
            { id: 'security', label: 'Security', icon: <Lock size={18} /> },
            { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
            { id: 'system', label: 'System Settings', icon: <SettingsIcon size={18} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 18px',
                borderRadius: '12px',
                border: 'none',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left',
                backgroundColor: subTab === tab.id ? '#eff7f2' : 'transparent',
                color: subTab === tab.id ? '#3da860' : 'var(--text-muted)',
                transition: 'all 0.2s'
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Box */}
        <div className="card" style={{ padding: '32px', borderRadius: '16px', backgroundColor: '#ffffff' }}>
          
          {subTab === 'profile' && (
            <form onSubmit={handleProfileSave}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#135431', marginBottom: '2px' }}>Admin Profile</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>Account & Personal Information</p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#135431',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: '700'
                }}>
                  SA
                </div>
                <div>
                  <button type="button" className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}>
                    Upload New Avatar
                  </button>
                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    JPG, PNG max 2MB
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: '700' }}>Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    style={{ height: '42px', borderRadius: '8px' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: '700' }}>Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    style={{ height: '42px', borderRadius: '8px' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: '700' }}>Phone Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    style={{ height: '42px', borderRadius: '8px' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: '700' }}>Role</label>
                  <input
                    type="text"
                    className="form-control"
                    value="Super Administrator"
                    disabled
                    style={{ height: '42px', borderRadius: '8px', backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    backgroundColor: '#3da860',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 24px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}

          {subTab === 'security' && (
            <form onSubmit={handlePasswordUpdate}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#135431', marginBottom: '2px' }}>Security Settings</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>Password & Authentication</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px', marginBottom: '24px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: '700' }}>Current Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Enter current password"
                    value={currentPwd}
                    onChange={(e) => setCurrentPwd(e.target.value)}
                    style={{ height: '42px', borderRadius: '8px' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: '700' }}>New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="At least 8 characters"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    style={{ height: '42px', borderRadius: '8px' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: '700' }}>Confirm New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Re-enter new password"
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    style={{ height: '42px', borderRadius: '8px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    backgroundColor: '#3da860',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 24px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Update Password
                </button>
              </div>
            </form>
          )}

          {subTab === 'notifications' && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#135431', marginBottom: '2px' }}>Notification Preferences</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>System Alert Channels</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                {[
                  { id: 'email', label: 'Email Notifications', desc: 'Receive urgent security alerts via email', val: emailNotif, set: setEmailNotif },
                  { id: 'sms', label: 'SMS Notifications', desc: 'Critical outbreak alerts sent via SMS gateway', val: smsNotif, set: setSmsNotif },
                  { id: 'outbreak', label: 'Outbreak Alerts', desc: 'Notify immediately when 3+ cases occur in one district', val: outbreakAlerts, set: setOutbreakAlerts },
                  { id: 'reg', label: 'New User Registration', desc: 'Summary of new farmer sign-ups', val: newUserReg, set: setNewUserReg },
                  { id: 'vet', label: 'Vet Verification Requests', desc: 'Alerts when doctors submit PVMC license documents', val: vetReq, set: setVetReq }
                ].map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)', display: 'block' }}>{item.label}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.desc}</span>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px' }}>
                      <input
                        type="checkbox"
                        checked={item.val}
                        onChange={(e) => item.set(e.target.checked)}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{
                        position: 'absolute',
                        cursor: 'pointer',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: item.val ? '#3da860' : '#cbd5e1',
                        borderRadius: '22px',
                        transition: '0.2s'
                      }}>
                        <span style={{
                          position: 'absolute',
                          height: '16px',
                          width: '16px',
                          left: item.val ? '21px' : '3px',
                          bottom: '3px',
                          backgroundColor: '#ffffff',
                          borderRadius: '50%',
                          transition: '0.2s'
                        }} />
                      </span>
                    </label>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
                <button
                  type="button"
                  onClick={handleNotifSave}
                  className="btn btn-primary"
                  style={{
                    backgroundColor: '#3da860',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 24px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Save Preferences
                </button>
              </div>
            </div>
          )}

          {subTab === 'system' && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#135431', marginBottom: '2px' }}>Settings & Configuration</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>AI Model and System Parameters</p>

              <div style={{ marginBottom: '28px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#1f2937', marginBottom: '12px' }}>AI Model Configuration</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '400px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>Minimum Confidence Threshold</span>
                    <strong style={{ color: '#3da860' }}>{threshold}%</strong>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    style={{ accentColor: '#3da860', width: '100%', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Detections with confidence below this threshold will automatically require veterinary validation.
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>Interface Language</span>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="form-control"
                    style={{ height: '42px', borderRadius: '8px' }}
                  >
                    <option value="en">English (US)</option>
                  </select>
                </div>

                <div>
                  <span style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>System Timezone</span>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="form-control"
                    style={{ height: '42px', borderRadius: '8px' }}
                  >
                    <option value="utc-5">Asia/Karachi (PKT, UTC+5)</option>
                    <option value="utc">UTC (Universal Time)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
                <button
                  type="button"
                  onClick={handleSystemSave}
                  className="btn btn-primary"
                  style={{
                    backgroundColor: '#3da860',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 24px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
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
