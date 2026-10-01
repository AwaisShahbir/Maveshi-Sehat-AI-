import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Lock, Bell, Store, CheckCircle2, AlertCircle, 
  Eye, EyeOff, ShieldCheck 
} from 'lucide-react';
import '../styles/Settings.css';

export default function Settings({ pharmacy }) {
  const [subTab, setSubTab] = useState('profile');
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  // Profile Form States
  const [name, setName] = useState(pharmacy?.name || '');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState(pharmacy?.email || '');
  const [phone, setPhone] = useState(pharmacy?.phone || '');
  const [whatsapp, setWhatsapp] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [businessHours, setBusinessHours] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  
  // Avatar / Logo State
  const [avatarUrl, setAvatarUrl] = useState(() => {
    return localStorage.getItem(`pharmacyLogo_${pharmacy?.id}`) || '';
  });
  const fileInputRef = useRef(null);

  // Security Form States
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  // Notification Preferences States
  const [notifNewOrder, setNotifNewOrder] = useState(true);
  const [notifLowStock, setNotifLowStock] = useState(true);
  const [notifOutOfStock, setNotifOutOfStock] = useState(true);
  const [notifOrderStatus, setNotifOrderStatus] = useState(true);
  const [notifEmail, setNotifEmail] = useState(false);

  // Store Configuration States
  const [storeOpen, setStoreOpen] = useState(true);
  const [enforcePrescription, setEnforcePrescription] = useState(true);
  const [stockThreshold, setStockThreshold] = useState(15);
  const [minOrderValue, setMinOrderValue] = useState(0);
  const [deliveryNote, setDeliveryNote] = useState('');

  // Load pharmacy profile and saved settings
  useEffect(() => {
    if (!pharmacy?.id) return;

    const fetchProfileAndSettings = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/pharmacy/profile?pharmacyId=${pharmacy.id}`);
        if (res.ok) {
          const data = await res.json();
          setName(data.name || '');
          setOwnerName(data.owner_name || '');
          setEmail(data.email || '');
          setPhone(data.phone || '');
          setWhatsapp(data.whatsapp || '');
          setLicenseNumber(data.license_number || '');
          setBusinessHours(data.business_hours || '');
          setCity(data.city || '');
          setProvince(data.province || '');
          setAddress(data.address || '');
          setDescription(data.description || '');
        }
      } catch (err) {
        console.error('Failed to load pharmacy profile:', err);
      }

      // Load store settings & notifications from localStorage
      try {
        const savedSettings = localStorage.getItem(`pharmacy_settings_${pharmacy.id}`);
        if (savedSettings) {
          const s = JSON.parse(savedSettings);
          if (s.notifNewOrder !== undefined) setNotifNewOrder(s.notifNewOrder);
          if (s.notifLowStock !== undefined) setNotifLowStock(s.notifLowStock);
          if (s.notifOutOfStock !== undefined) setNotifOutOfStock(s.notifOutOfStock);
          if (s.notifOrderStatus !== undefined) setNotifOrderStatus(s.notifOrderStatus);
          if (s.notifEmail !== undefined) setNotifEmail(s.notifEmail);
          
          if (s.storeOpen !== undefined) setStoreOpen(s.storeOpen);
          if (s.enforcePrescription !== undefined) setEnforcePrescription(s.enforcePrescription);
          if (s.stockThreshold !== undefined) setStockThreshold(s.stockThreshold);
          if (s.minOrderValue !== undefined) setMinOrderValue(s.minOrderValue);
          if (s.deliveryNote !== undefined) setDeliveryNote(s.deliveryNote);
        }
      } catch (err) {
        console.error('Failed to load settings from storage:', err);
      }
    };

    fetchProfileAndSettings();
  }, [pharmacy?.id]);

  // Compute initials for avatar fallback (e.g. Al Shefa -> AS)
  const getInitials = (text) => {
    if (!text) return 'PH';
    return text
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
        setFeedback({ type: 'error', message: 'Logo image must be under 2MB.' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        setAvatarUrl(base64);
        if (pharmacy?.id) {
          localStorage.setItem(`pharmacyLogo_${pharmacy.id}`, base64);
        }
        setFeedback({ type: 'success', message: 'Store logo updated successfully.' });
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
      const res = await fetch('http://localhost:5000/api/pharmacy/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pharmacyId: pharmacy.id,
          name,
          nameUrdu: '',
          ownerName,
          phone,
          whatsapp,
          address,
          province,
          city,
          businessHours,
          description
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile.');
      }

      // Update session storage so header updates if name changed
      const savedSession = localStorage.getItem('maveshi_sehat_pharmacy_session');
      if (savedSession) {
        try {
          const parsed = JSON.parse(savedSession);
          parsed.name = name;
          parsed.phone = phone;
          localStorage.setItem('maveshi_sehat_pharmacy_session', JSON.stringify(parsed));
        } catch {}
      }

      setFeedback({ type: 'success', message: 'Pharmacy profile saved successfully.' });
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

    if (newPwd.length < 8) {
      setFeedback({ type: 'error', message: 'New password must be at least 8 characters long.' });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/pharmacy/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pharmacyId: pharmacy.id,
          currentPassword: currentPwd,
          newPassword: newPwd
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to change password.');
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
  const handleNotifSave = () => {
    setFeedback({ type: '', message: '' });
    setLoading(true);

    try {
      const settingsKey = `pharmacy_settings_${pharmacy.id}`;
      const existing = JSON.parse(localStorage.getItem(settingsKey) || '{}');
      const updated = {
        ...existing,
        notifNewOrder,
        notifLowStock,
        notifOutOfStock,
        notifOrderStatus,
        notifEmail
      };
      localStorage.setItem(settingsKey, JSON.stringify(updated));
      setFeedback({ type: 'success', message: 'Notification preferences saved successfully.' });
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to save notification preferences.' });
    } finally {
      setLoading(false);
    }
  };

  // 4. Save Store Settings
  const handleStoreSettingsSave = () => {
    setFeedback({ type: '', message: '' });
    setLoading(true);

    try {
      const settingsKey = `pharmacy_settings_${pharmacy.id}`;
      const existing = JSON.parse(localStorage.getItem(settingsKey) || '{}');
      const updated = {
        ...existing,
        storeOpen,
        enforcePrescription,
        stockThreshold: Number(stockThreshold),
        minOrderValue: Number(minOrderValue),
        deliveryNote
      };
      localStorage.setItem(settingsKey, JSON.stringify(updated));
      setFeedback({ type: 'success', message: 'Pharmacy store configurations applied successfully.' });
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to save store settings.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-view">
      <div className="settings-layout">
        
        {/* Navigation Sidebar matching Admin */}
        <div className="settings-nav">
          {[
            { id: 'profile', label: 'Profile & Account', icon: <User size={18} /> },
            { id: 'security', label: 'Security', icon: <Lock size={18} /> },
            { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
            { id: 'store', label: 'Store Settings', icon: <Store size={18} /> }
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

          {/* ─── Profile & Account Tab ─── */}
          {subTab === 'profile' && (
            <form onSubmit={handleProfileSave}>
              <h3 className="settings-heading">Pharmacy Profile</h3>
              <p className="settings-subheading">Account & Store Information</p>

              <div className="settings-avatar-row">
                <div className="settings-avatar-circle">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Store Logo" className="settings-avatar-img" />
                  ) : (
                    getInitials(name)
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
                    className="settings-avatar-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Upload Store Logo
                  </button>
                  <span className="settings-avatar-hint">
                    JPG, PNG max 2MB
                  </span>
                </div>
              </div>

              <div className="settings-form-grid">
                <div className="form-group">
                  <label className="settings-label">Pharmacy Name</label>
                  <input
                    type="text"
                    className="form-control settings-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="settings-label">Owner / Proprietor Name</label>
                  <input
                    type="text"
                    className="form-control settings-input"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="settings-label">Registered Email</label>
                  <input
                    type="email"
                    className="form-control settings-input-disabled"
                    value={email}
                    disabled
                    title="Registered email is tied to portal licensing and cannot be modified directly"
                  />
                </div>

                <div className="form-group">
                  <label className="settings-label">Contact Phone</label>
                  <input
                    type="text"
                    className="form-control settings-input font-mono"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="settings-label">WhatsApp Number</label>
                  <input
                    type="text"
                    className="form-control settings-input font-mono"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="e.g. 03001234567"
                  />
                </div>

                <div className="form-group">
                  <label className="settings-label">DRAP License Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      className="form-control settings-input-disabled font-mono"
                      value={licenseNumber || 'DRAP-VERIFIED'}
                      disabled
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="settings-label">Operating Hours</label>
                  <input
                    type="text"
                    className="form-control settings-input"
                    value={businessHours}
                    onChange={(e) => setBusinessHours(e.target.value)}
                    placeholder="e.g. Mon-Sat: 9:00 AM - 10:00 PM"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="settings-label">City</label>
                  <input
                    type="text"
                    className="form-control settings-input"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Lahore"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="settings-label">Province</label>
                  <input
                    type="text"
                    className="form-control settings-input"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    placeholder="e.g. Punjab"
                    required
                  />
                </div>

                <div className="form-group settings-form-grid-full">
                  <label className="settings-label">Full Physical Store Address</label>
                  <textarea
                    className="form-control settings-textarea"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Shop #, Street, Plaza, Commercial Market..."
                    required
                  />
                </div>

                <div className="form-group settings-form-grid-full">
                  <label className="settings-label">Pharmacy Description & Services</label>
                  <textarea
                    className="form-control settings-textarea"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Authorized supplier for livestock antibiotics, veterinary vaccines, supplements..."
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

          {/* ─── Security Tab ─── */}
          {subTab === 'security' && (
            <form onSubmit={handlePasswordUpdate}>
              <h3 className="settings-heading">Security Settings</h3>
              <p className="settings-subheading">Password & Authentication</p>

              <div className="settings-security-form">
                <div className="form-group">
                  <label className="settings-label">Current Password</label>
                  <div className="settings-password-wrapper">
                    <Lock size={16} className="settings-pwd-icon" />
                    <input
                      type={showCurrentPwd ? 'text' : 'password'}
                      className="form-control settings-input settings-pwd-input"
                      placeholder="Enter current password"
                      value={currentPwd}
                      onChange={(e) => setCurrentPwd(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="settings-pwd-toggle"
                      onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                    >
                      {showCurrentPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="settings-label">New Password</label>
                  <div className="settings-password-wrapper">
                    <Lock size={16} className="settings-pwd-icon" />
                    <input
                      type={showNewPwd ? 'text' : 'password'}
                      className="form-control settings-input settings-pwd-input"
                      placeholder="At least 8 characters"
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="settings-pwd-toggle"
                      onClick={() => setShowNewPwd(!showNewPwd)}
                    >
                      {showNewPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {newPwd.length > 0 && (
                    <div className="mt-1.5 flex gap-1">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            newPwd.length >= [4, 8, 12, 16][i]
                              ? i < 1 ? 'bg-red-400' : i < 2 ? 'bg-amber-400' : i < 3 ? 'bg-[#3da860]' : 'bg-emerald-500'
                              : 'bg-slate-100'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="settings-label">Confirm New Password</label>
                  <div className="settings-password-wrapper">
                    <Lock size={16} className="settings-pwd-icon" />
                    <input
                      type={showConfirmPwd ? 'text' : 'password'}
                      className="form-control settings-input settings-pwd-input"
                      placeholder="Re-enter new password"
                      value={confirmPwd}
                      onChange={(e) => setConfirmPwd(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="settings-pwd-toggle"
                      onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                    >
                      {showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmPwd && newPwd !== confirmPwd && (
                    <p className="text-xs text-red-500 mt-1 font-semibold">Passwords do not match</p>
                  )}
                  {confirmPwd && newPwd === confirmPwd && (
                    <p className="text-xs text-[#3da860] mt-1 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={12} /> Passwords match
                    </p>
                  )}
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

          {/* ─── Notifications Tab ─── */}
          {subTab === 'notifications' && (
            <div>
              <h3 className="settings-heading">Notification Preferences</h3>
              <p className="settings-subheading">Order & Stock Alert Channels</p>

              <div className="settings-notif-list">
                {[
                  {
                    id: 'new_order',
                    label: 'New Customer Order Alerts',
                    desc: 'Immediate notification when a new medicine order or prescription is placed',
                    val: notifNewOrder,
                    set: setNotifNewOrder
                  },
                  {
                    id: 'low_stock',
                    label: 'Low Stock Warnings',
                    desc: 'Automatic alerts when any medicine falls below its minimum inventory threshold',
                    val: notifLowStock,
                    set: setNotifLowStock
                  },
                  {
                    id: 'out_of_stock',
                    label: 'Out of Stock Urgent Alerts',
                    desc: 'Instant priority alert when medicine stock level reaches 0 units',
                    val: notifOutOfStock,
                    set: setNotifOutOfStock
                  },
                  {
                    id: 'order_status',
                    label: 'Order Status Transitions',
                    desc: 'Notifications when customer confirms delivery or cancels pending requests',
                    val: notifOrderStatus,
                    set: setNotifOrderStatus
                  },
                  {
                    id: 'email_notif',
                    label: 'Email Notifications & Daily Digest',
                    desc: 'Receive order confirmation copies and daily revenue summaries to your email',
                    val: notifEmail,
                    set: setNotifEmail
                  }
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

          {/* ─── Store Settings Tab ─── */}
          {subTab === 'store' && (
            <div>
              <h3 className="settings-heading">Pharmacy & Store Settings</h3>
              <p className="settings-subheading">Store Operations and Order Fulfillment Rules</p>

              {/* Operational Status Toggle */}
              <div className="settings-notif-list">
                <div className="settings-notif-item">
                  <div>
                    <span className="settings-notif-title">Accepting Online Orders</span>
                    <span className="settings-notif-desc">
                      When enabled, livestock farmers and vets can browse inventory and place online orders.
                    </span>
                  </div>
                  <label className="settings-toggle">
                    <input
                      type="checkbox"
                      checked={storeOpen}
                      onChange={(e) => setStoreOpen(e.target.checked)}
                      className="settings-toggle-checkbox"
                    />
                    <span className={`settings-toggle-slider ${storeOpen ? 'active' : ''}`}>
                      <span className={`settings-toggle-knob ${storeOpen ? 'active' : ''}`} />
                    </span>
                  </label>
                </div>

                <div className="settings-notif-item">
                  <div>
                    <span className="settings-notif-title">Prescription Requirement Enforcement</span>
                    <span className="settings-notif-desc">
                      Strictly require uploaded veterinary doctor prescription before dispatching Rx-designated items.
                    </span>
                  </div>
                  <label className="settings-toggle">
                    <input
                      type="checkbox"
                      checked={enforcePrescription}
                      onChange={(e) => setEnforcePrescription(e.target.checked)}
                      className="settings-toggle-checkbox"
                    />
                    <span className={`settings-toggle-slider ${enforcePrescription ? 'active' : ''}`}>
                      <span className={`settings-toggle-knob ${enforcePrescription ? 'active' : ''}`} />
                    </span>
                  </label>
                </div>
              </div>

              {/* Stock Threshold Slider */}
              <div className="settings-section-block">
                <h4 className="settings-section-title">Inventory Thresholds</h4>
                <div className="settings-slider-wrap">
                  <div className="settings-slider-header">
                    <span>Default Minimum Stock Alert Limit</span>
                    <strong className="settings-slider-accent">{stockThreshold} units</strong>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="1"
                    value={stockThreshold}
                    onChange={(e) => setStockThreshold(e.target.value)}
                    className="settings-slider-input"
                  />
                  <span className="settings-slider-hint">
                    Medicines with stock falling at or below this threshold trigger low-stock alerts.
                  </span>
                </div>
              </div>

              {/* Order Rules */}
              <div className="settings-form-grid">
                <div className="form-group">
                  <label className="settings-label">Minimum Order Amount (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    className="form-control settings-input"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(e.target.value)}
                    placeholder="e.g. 500"
                  />
                  <span className="settings-avatar-hint">Enter 0 if there is no minimum requirement</span>
                </div>

                <div className="form-group settings-form-grid-full">
                  <label className="settings-label">Customer Order Notice & Delivery Instructions</label>
                  <textarea
                    className="form-control settings-textarea"
                    value={deliveryNote}
                    onChange={(e) => setDeliveryNote(e.target.value)}
                    placeholder="e.g. Orders placed before 4:00 PM are delivered same-day. Cold chain guaranteed for all live vaccines."
                  />
                </div>
              </div>

              <div className="settings-form-footer">
                <button
                  type="button"
                  onClick={handleStoreSettingsSave}
                  disabled={loading}
                  className="btn btn-primary settings-save-btn"
                >
                  {loading ? 'Applying...' : 'Apply Store Settings'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
