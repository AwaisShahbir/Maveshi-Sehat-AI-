import React, { useState } from 'react';
import { User, Lock, Bell, Settings as SettingsIcon, ShieldAlert, Key, Database, RefreshCw, AlertTriangle } from 'lucide-react';

export default function Settings() {
  const [subTab, setSubTab] = useState('profile');

  
  const [profileName, setProfileName] = useState('Muhammad Asad');
  const [profileEmail, setProfileEmail] = useState('admin@maveshisehat.pk');
  const [profilePhone, setProfilePhone] = useState('+92 300 1234567');

  
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(true);
  const [outbreakAlerts, setOutbreakAlerts] = useState(true);
  const [newUserReg, setNewUserReg] = useState(true);
  const [vetReq, setVetReq] = useState(true);
  const [sysError, setSysError] = useState(false);

  
  const [threshold, setThreshold] = useState(85);
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('utc-5');

  const handleProfileSave = (e) => {
    e.preventDefault();
    alert('Profile changes saved successfully! / پروفائل تبدیلیاں محفوظ ہوگئیں');
  };

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      alert('Passwords do not match.');
      return;
    }
    alert('Password updated successfully! / پاس ورڈ تبدیل ہوگیا');
    setCurrentPwd('');
    setNewPwd('');
    setConfirmPwd('');
  };

  const handleNotifSave = () => {
    alert('Notification preferences updated! / اطلاعات کی ترتیبات تبدیل ہوگئیں');
  };

  const handleSystemSave = () => {
    alert('System configurations applied! / سسٹم ترتیبات تبدیل ہوگئیں');
  };

  return (
    <div className="settings-view">
      <div className="grid-2-1" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px' }}>
        
        
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

        
        
        <div className="card" style={{ padding: '32px', borderRadius: '16px', backgroundColor: '#ffffff' }}>
          
          
          {subTab === 'profile' && (
            <form onSubmit={handleProfileSave}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#135431', marginBottom: '2px' }}>Admin Profile / منتظم پروفائل</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>Profile & Account Details</p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  backgroundColor: '#3da860',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '24px'
                }}>
                  MA
                </div>
                <div>
                  <button 
                    type="button"
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#3da860',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      marginBottom: '6px'
                    }}
                  >
                    Upload New Photo
                  </button>
                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>
                    JPG, PNG or GIF. Max size 2MB.
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: '700' }}>Full Name / نام</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    style={{ height: '42px', borderRadius: '10px' }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: '700' }}>Email Address / ای میل</label>
                  <input 
                    type="email" 
                    className="form-control"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    style={{ height: '42px', borderRadius: '10px' }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: '700' }}>Phone Number / فون نمبر</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    style={{ height: '42px', borderRadius: '10px' }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: '700' }}>Role / کردار</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value="Super Admin"
                    disabled
                    style={{ height: '42px', borderRadius: '10px', backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#64748b' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
                <button 
                  type="button" 
                  style={{ padding: '8px 16px', border: '1px solid var(--border-light)', backgroundColor: '#ffffff', cursor: 'pointer', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}
                  onClick={() => { setProfileName('Muhammad Asad'); setProfileEmail('admin@maveshisehat.pk'); setProfilePhone('+92 300 1234567'); }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={{ padding: '8px 16px', backgroundColor: '#3da860', color: '#ffffff', border: 'none', cursor: 'pointer', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}
                >
                  Save Changes / محفوظ کریں
                </button>
              </div>
            </form>
          )}

          
          {subTab === 'security' && (
            <form onSubmit={handlePasswordUpdate}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#135431', marginBottom: '2px' }}>Security Settings / سیکیورٹی ترتیبات</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>Password Configurations</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: '700' }}>Current Password / موجودہ پاس ورڈ</label>
                  <input 
                    type="password" 
                    className="form-control"
                    value={currentPwd}
                    onChange={(e) => setCurrentPwd(e.target.value)}
                    style={{ height: '42px', borderRadius: '10px' }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: '700' }}>New Password / نیا پاس ورڈ</label>
                  <input 
                    type="password" 
                    className="form-control"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    style={{ height: '42px', borderRadius: '10px' }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: '700' }}>Confirm New Password / نیا پاس ورڈ تصدیق کریں</label>
                  <input 
                    type="password" 
                    className="form-control"
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    style={{ height: '42px', borderRadius: '10px' }}
                  />
                </div>
              </div>

              <div style={{
                backgroundColor: '#fffbeb',
                border: '1px solid #fef3c7',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '13px',
                color: '#78350f',
                marginBottom: '24px'
              }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <Key size={16} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
                  <strong>Password Requirements</strong>
                </div>
                <ul style={{ listStyleType: 'disc', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li>At least 8 characters long</li>
                  <li>Include uppercase and lowercase letters</li>
                  <li>Include at least one number</li>
                  <li>Include at least one special character (@, #, $, etc.)</li>
                </ul>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
                <button 
                  type="button" 
                  style={{ padding: '8px 16px', border: '1px solid var(--border-light)', backgroundColor: '#ffffff', cursor: 'pointer', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}
                  onClick={() => { setCurrentPwd(''); setNewPwd(''); setConfirmPwd(''); }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={{ padding: '8px 16px', backgroundColor: '#3da860', color: '#ffffff', border: 'none', cursor: 'pointer', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}
                >
                  Update Password
                </button>
              </div>
            </form>
          )}

          
          {subTab === 'notifications' && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#135431', marginBottom: '2px' }}>Notification Preferences / اطلاعات کی ترتیبات</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>Manage notification outputs</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
                
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#1f2937', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>Notification Channels</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label style={{ display: 'flex', gap: '10px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={emailNotif} onChange={(e) => setEmailNotif(e.target.checked)} style={{ accentColor: '#3da860', width: '16px', height: '16px', marginTop: '2px' }} />
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', display: 'block' }}>Email Notifications</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Receive updates via email</span>
                      </div>
                    </label>
                    <label style={{ display: 'flex', gap: '10px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={smsNotif} onChange={(e) => setSmsNotif(e.target.checked)} style={{ accentColor: '#3da860', width: '16px', height: '16px', marginTop: '2px' }} />
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', display: 'block' }}>SMS Notifications</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Get alerts on your mobile</span>
                      </div>
                    </label>
                  </div>
                </div>

                
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#1f2937', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>Alert Types</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { state: outbreakAlerts, setter: setOutbreakAlerts, title: 'Disease Outbreak Alerts', sub: 'Critical disease detection notifications' },
                      { state: newUserReg, setter: setNewUserReg, title: 'New User Registrations', sub: 'When new users sign up' },
                      { state: vetReq, setter: setVetReq, title: 'Vet Verification Requests', sub: 'When vets submit verification documents' },
                      { state: sysError, setter: setSysError, title: 'System Errors & Downtime', sub: 'Critical system issues' }
                    ].map((item, idx) => (
                      <label key={idx} style={{ display: 'flex', gap: '10px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={item.state} onChange={(e) => item.setter(e.target.checked)} style={{ accentColor: '#3da860', width: '16px', height: '16px', marginTop: '2px' }} />
                        <div>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', display: 'block' }}>{item.title}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.sub}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
                <button 
                  type="button" 
                  style={{ padding: '8px 16px', backgroundColor: '#3da860', color: '#ffffff', border: 'none', cursor: 'pointer', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}
                  onClick={handleNotifSave}
                >
                  Save Preferences
                </button>
              </div>
            </div>
          )}

          
          {subTab === 'system' && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#135431', marginBottom: '2px' }}>Settings & Configuration / ترتیبات</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>System Configurations</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '24px' }}>
                
                <div style={{ border: '1px solid var(--border-light)', borderRadius: '12px', padding: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#1f2937', marginBottom: '12px' }}>AI Model Configuration / AI تشکیل</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600' }}>
                      <span>AI Confidence Threshold:</span>
                      <span style={{ color: '#3da860' }}>{threshold}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="50" 
                      max="100" 
                      value={threshold} 
                      onChange={(e) => setThreshold(e.target.value)} 
                      style={{ accentColor: '#3da860', width: '100%', cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span>50% (Low)</span>
                      <span>100% (High)</span>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', fontStyle: 'italic' }}>
                      Only show disease predictions above this confidence level.
                    </p>
                  </div>
                </div>

                
                <div style={{ border: '1px solid var(--border-light)', borderRadius: '12px', padding: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#1f2937', marginBottom: '16px' }}>Regional Settings</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <span style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>Language / زبان</span>
                      <select 
                        value={language} 
                        onChange={(e) => setLanguage(e.target.value)}
                        style={{ width: '100%', height: '40px', padding: '8px 12px', border: '1px solid var(--border-light)', borderRadius: '8px', fontSize: '13px' }}
                      >
                        <option value="en">English</option>
                        <option value="ur">Urdu / اردو</option>
                      </select>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>Timezone</span>
                      <select 
                        value={timezone} 
                        onChange={(e) => setTimezone(e.target.value)}
                        style={{ width: '100%', height: '40px', padding: '8px 12px', border: '1px solid var(--border-light)', borderRadius: '8px', fontSize: '13px' }}
                      >
                        <option value="utc-5">Pakistan Standard Time (UTC+5:00)</option>
                        <option value="utc-0">Greenwich Mean Time (UTC+0:00)</option>
                      </select>
                    </div>
                  </div>
                </div>

                
                <div style={{ border: '1px solid var(--border-light)', borderRadius: '12px', padding: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#1f2937', marginBottom: '16px' }}>System Maintenance</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <Database size={16} style={{ color: '#007aff' }} />
                        <div>
                          <span style={{ fontSize: '13px', fontWeight: '600', display: 'block', color: 'var(--text-main)' }}>Database Backup</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Last backup: Jun 2, 2025, 11:45 PM</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => alert('Backup process started...')}
                        style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '600', backgroundColor: '#007aff', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        Backup Now
                      </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <RefreshCw size={16} style={{ color: '#ff9800' }} />
                        <div>
                          <span style={{ fontSize: '13px', fontWeight: '600', display: 'block', color: 'var(--text-main)' }}>Clear Cache</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Remove temporary files and cached data</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => alert('System cache cleared!')}
                        style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '600', backgroundColor: '#ff9800', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        Clear Cache
                      </button>
                    </div>
                  </div>
                </div>

                
                <div style={{ border: '1px solid #fecaca', backgroundColor: '#fff5f5', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#d32f2f', display: 'block' }}>Danger Zone</span>
                      <span style={{ fontSize: '11px', color: '#7f1d1d' }}>Restore default system configuration</span>
                    </div>
                    <button 
                      onClick={() => { if(window.confirm('Reset all settings to default values?')) alert('Settings reset.'); }}
                      style={{ padding: '8px 16px', fontSize: '12px', fontWeight: '600', border: '1px solid #d32f2f', color: '#d32f2f', backgroundColor: '#ffffff', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      Reset Settings
                    </button>
                  </div>
                </div>

              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
                <button 
                  type="button" 
                  style={{ padding: '8px 16px', backgroundColor: '#3da860', color: '#ffffff', border: 'none', cursor: 'pointer', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}
                  onClick={handleSystemSave}
                >
                  Save Configurations
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
