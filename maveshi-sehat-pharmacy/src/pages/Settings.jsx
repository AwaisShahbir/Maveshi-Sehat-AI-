import { API_BASE_URL } from '../config';
import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Lock, Bell, Store, CheckCircle2, AlertCircle, 
  Eye, EyeOff, ShieldCheck, CreditCard, RefreshCw, Upload, DollarSign, AlertTriangle, ArrowRight
} from 'lucide-react';
import '../styles/Settings.css';

export default function Settings({ pharmacy, initialSubTab = 'profile' }) {
  const [subTab, setSubTab] = useState(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);
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

  // Payment Credentials & Commission States
  const [walletType, setWalletType] = useState('JazzCash');
  const [accountTitle, setAccountTitle] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [commissionData, setCommissionData] = useState(null);
  const [commissionLoading, setCommissionLoading] = useState(false);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [settlementAmount, setSettlementAmount] = useState('');
  const [settlementSenderPhone, setSettlementSenderPhone] = useState(pharmacy?.phone || '');
  const [settlementTid, setSettlementTid] = useState('');
  const [settlementProofBase64, setSettlementProofBase64] = useState(null);
  const [settlementSubmitting, setSettlementSubmitting] = useState(false);
  const settlementFileRef = useRef(null);
  
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
        const res = await fetch(`${API_BASE_URL}/api/pharmacy/profile?pharmacyId=${pharmacy.id}`);
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
          setWalletType(data.payment_wallet_type || 'JazzCash');
          setAccountTitle(data.payment_account_title || data.name || '');
          setAccountNumber(data.payment_account_number || data.phone || '');
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
      const res = await fetch(`${API_BASE_URL}/api/pharmacy/profile`, {
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
      const res = await fetch(`${API_BASE_URL}/api/pharmacy/change-password`, {
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

  const fetchCommissionStatus = async () => {
    if (!pharmacy?.id) return;
    try {
      setCommissionLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/pharmacy/${pharmacy.id}/commission-status`);
      if (res.ok) {
        const data = await res.json();
        setCommissionData(data);
        if (data.commissionDue !== undefined) {
          setSettlementAmount(String(Math.max(1000, Math.round(data.commissionDue || 1000))));
        }
      }
    } catch (err) {
      console.error('Failed to load commission data:', err);
    } finally {
      setCommissionLoading(false);
    }
  };

  useEffect(() => {
    if (subTab === 'commissions') {
      fetchCommissionStatus();
    }
  }, [subTab, pharmacy?.id]);

  const handleSavePaymentCredentials = async (e) => {
    e.preventDefault();
    if (!accountTitle.trim() || !accountNumber.trim()) {
      setFeedback({ type: 'error', message: 'Please enter account title and account number.' });
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/pharmacy/${pharmacy.id}/payment-info`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletType,
          accountTitle: accountTitle.trim(),
          accountNumber: accountNumber.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update payment info');
      setFeedback({ type: 'success', message: 'Online payment credentials updated successfully! Farmers will now transfer directly to your account.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSettlementFilePick = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettlementProofBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitSettlement = async (e) => {
    e.preventDefault();
    const amt = parseFloat(settlementAmount);
    if (isNaN(amt) || amt < 1000) {
      alert('The minimum amount you can transfer to Admin is Rs. 1,000.');
      return;
    }
    if (!settlementSenderPhone || !settlementTid || !settlementProofBase64) {
      alert('Please enter your sender phone number, TID, and attach payment screenshot proof.');
      return;
    }
    try {
      setSettlementSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/api/pharmacy/settlements/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pharmacyId: pharmacy.id,
          amount: parseFloat(settlementAmount),
          senderPhone: settlementSenderPhone.trim(),
          transactionId: settlementTid.trim(),
          paymentMethod: 'JazzCash',
          proofBase64: settlementProofBase64
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit settlement proof');
      alert(data.message || (commissionData?.isLocked 
        ? 'Settlement submitted! Admin will verify and unlock your store.' 
        : 'Deposit proof submitted! Admin will verify and credit your commission ledger.'));
      setIsSettlementModalOpen(false);
      setSettlementTid('');
      setSettlementProofBase64(null);
      fetchCommissionStatus();
    } catch (err) {
      alert('Error submitting settlement: ' + err.message);
    } finally {
      setSettlementSubmitting(false);
    }
  };

  return (
    <div className="settings-view">
      <div className="settings-layout">
        
        {/* Navigation Sidebar matching Admin */}
        <div className="settings-nav">
          {[
            { id: 'profile', label: 'Profile & Account', icon: <User size={18} /> },
            { id: 'commissions', label: 'Payment & Commissions', icon: <CreditCard size={18} /> },
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
                    className="settings-file-input-hidden"
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
                      value={licenseNumber || 'N/A'}
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
                  <select
                    className="form-control settings-input bg-white cursor-pointer"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select Province</option>
                    <option value="Punjab">Punjab</option>
                    <option value="Sindh">Sindh</option>
                    <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa (KPK)</option>
                    <option value="Balochistan">Balochistan</option>
                    <option value="Islamabad Capital Territory">Islamabad Capital Territory</option>
                    <option value="Gilgit-Baltistan">Gilgit-Baltistan</option>
                    <option value="Azad Jammu & Kashmir">Azad Jammu & Kashmir (AJK)</option>
                  </select>
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

          {/* ─── Payment & Platform Commission Tab ─── */}
          {subTab === 'commissions' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h3 className="settings-heading" style={{ margin: 0 }}>Payment & Platform Commissions</h3>
                  <p className="settings-subheading" style={{ margin: '4px 0 0 0' }}>Manage customer direct payment credentials & 10% platform commission ledger</p>
                </div>
                <button
                  type="button"
                  onClick={fetchCommissionStatus}
                  className="btn"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', color: '#334155' }}
                >
                  <RefreshCw size={14} className={commissionLoading ? 'animate-spin' : ''} /> Refresh Ledger
                </button>
              </div>

              {/* Commission Debt & Store Status Alert */}
              {commissionData && (
                <div style={{
                  backgroundColor: commissionData.isLocked ? '#FEF2F2' : '#F0FDF4',
                  border: `1px solid ${commissionData.isLocked ? '#F87171' : '#86EFAC'}`,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 24
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        {commissionData.isLocked ? (
                          <AlertTriangle size={20} color="#DC2626" />
                        ) : (
                          <CheckCircle2 size={20} color="#059669" />
                        )}
                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: commissionData.isLocked ? '#991B1B' : '#065F46' }}>
                          {commissionData.isLocked ? 'Store & Stock Blocked: Commission Limit Exceeded' : 'Store Active: Commission in Good Standing'}
                        </h4>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: commissionData.isLocked ? '#B91C1C' : '#047857' }}>
                        {commissionData.isLocked
                          ? `Your unpaid commission is Rs. ${commissionData.commissionDue.toFixed(2)}, which exceeds the Rs. 2,000 credit limit. Your stock is temporarily blocked. Transfer at least Rs. 1,000 to the Admin to unblock your store.`
                          : `Your stock is fully active and taking customer orders normally. Your outstanding commission due is Rs. ${commissionData.commissionDue.toFixed(2)} (within the Rs. 2,000 limit). Remaining credit: Rs. ${commissionData.remainingCredit.toFixed(2)}. You can deposit commission anytime (min. Rs. 1,000) to keep your balance low.`}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsSettlementModalOpen(true)}
                      style={{
                        padding: '10px 18px',
                        backgroundColor: '#059669',
                        color: '#FFF',
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: 13,
                        border: 'none',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)'
                      }}
                    >
                      {commissionData.isLocked ? 'Settle & Unblock Stock' : 'Deposit Commission'}
                    </button>
                  </div>

                  {/* Progress bar towards Rs. 2000 */}
                  <div style={{ marginTop: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 4 }}>
                      <span>Due: Rs. {commissionData.commissionDue.toFixed(2)}</span>
                      <span>Stock Block Limit: Rs. 2,000.00 (Min Transfer: Rs. 1,000)</span>
                    </div>
                    <div style={{ width: '100%', height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(100, (commissionData.commissionDue / 2000) * 100)}%`,
                        height: '100%',
                        backgroundColor: commissionData.isLocked ? '#DC2626' : (commissionData.commissionDue > 1500 ? '#F59E0B' : '#059669'),
                        borderRadius: 4,
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Form 1: Online Customer Payment Credentials */}
              <form onSubmit={handleSavePaymentCredentials} style={{ marginBottom: 32 }}>
                <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: 12, marginBottom: 16 }}>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: '#1E293B', margin: '0 0 4px 0' }}>
                    Customer Payment Credentials
                  </h4>
                  <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
                    When farmers checkout with online payment, they send money directly to this wallet. You verify the receipt and dispatch delivery.
                  </p>
                </div>

                <div className="settings-form-grid">
                  <div className="form-group">
                    <label className="settings-label">Wallet / Bank Type</label>
                    <select
                      className="form-control settings-input"
                      value={walletType}
                      onChange={(e) => setWalletType(e.target.value)}
                    >
                      <option value="JazzCash">JazzCash</option>
                      <option value="EasyPaisa">EasyPaisa</option>
                      <option value="Bank Account">Bank Account / Nayapay</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="settings-label">Account Title</label>
                    <input
                      type="text"
                      className="form-control settings-input"
                      value={accountTitle}
                      onChange={(e) => setAccountTitle(e.target.value)}
                      placeholder="e.g. Al-Madina Vet Pharmacy"
                      required
                    />
                  </div>

                  <div className="form-group settings-form-grid-full">
                    <label className="settings-label">Account / Mobile Number</label>
                    <input
                      type="text"
                      className="form-control settings-input"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="e.g. 03001234567 or IBAN"
                      required
                    />
                    <span className="settings-avatar-hint">
                      This number is presented to customers during mobile app checkout with a 1-tap copy button.
                    </span>
                  </div>
                </div>

                <div className="settings-form-footer">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary settings-save-btn"
                  >
                    {loading ? 'Saving...' : 'Save Payment Credentials'}
                  </button>
                </div>
              </form>

              {/* Commission Financials Summary Grid */}
              {commissionData && (
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: '#1E293B', margin: '0 0 12px 0' }}>
                    Financials & Commission Breakdown
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                    <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 16 }}>
                      <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Total Gross Sales</span>
                      <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: '6px 0 0 0' }}>
                        Rs. {(commissionData.salesSummary?.total_sales || 0).toLocaleString()}
                      </h3>
                    </div>

                    <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: 16 }}>
                      <span style={{ fontSize: 12, color: '#166534', fontWeight: 600 }}>Your Net Revenue (90%)</span>
                      <h3 style={{ fontSize: 20, fontWeight: 800, color: '#15803D', margin: '6px 0 0 0' }}>
                        Rs. {(commissionData.salesSummary?.total_pharmacy_earnings || 0).toLocaleString()}
                      </h3>
                    </div>

                    <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 12, padding: 16 }}>
                      <span style={{ fontSize: 12, color: '#92400E', fontWeight: 600 }}>Platform Commission (10%)</span>
                      <h3 style={{ fontSize: 20, fontWeight: 800, color: '#B45309', margin: '6px 0 0 0' }}>
                        Rs. {(commissionData.salesSummary?.total_admin_commission || 0).toLocaleString()}
                      </h3>
                    </div>

                    <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: 16 }}>
                      <span style={{ fontSize: 12, color: '#1E40AF', fontWeight: 600 }}>Settled to Date</span>
                      <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1D4ED8', margin: '6px 0 0 0' }}>
                        Rs. {(commissionData.commissionPaid || 0).toLocaleString()}
                      </h3>
                    </div>
                  </div>

                  {/* Past Settlements History */}
                  <h5 style={{ fontSize: 14, fontWeight: 700, color: '#334155', margin: '0 0 10px 0' }}>
                    Past Commission Settlements Submitted to Admin
                  </h5>
                  {commissionData.settlements?.length === 0 ? (
                    <p style={{ fontSize: 13, color: '#94A3B8' }}>No commission settlements recorded yet.</p>
                  ) : (
                    <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 10 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>
                            <th style={{ padding: '10px 14px' }}>Date</th>
                            <th style={{ padding: '10px 14px' }}>Amount</th>
                            <th style={{ padding: '10px 14px' }}>TID</th>
                            <th style={{ padding: '10px 14px' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {commissionData.settlements.map((s) => (
                            <tr key={s.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                              <td style={{ padding: '10px 14px' }}>{new Date(s.created_at).toLocaleDateString()}</td>
                              <td style={{ padding: '10px 14px', fontWeight: 700 }}>Rs. {parseFloat(s.amount).toFixed(2)}</td>
                              <td style={{ padding: '10px 14px', fontFamily: 'monospace' }}>{s.transaction_id}</td>
                              <td style={{ padding: '10px 14px' }}>
                                <span style={{
                                  padding: '3px 8px',
                                  borderRadius: 6,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  backgroundColor: s.status === 'approved' ? '#DCFCE7' : (s.status === 'rejected' ? '#FEE2E2' : '#FEF3C7'),
                                  color: s.status === 'approved' ? '#16A34A' : (s.status === 'rejected' ? '#DC2626' : '#D97706')
                                }}>
                                  {s.status.toUpperCase()}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Settlement Modal */}
              {isSettlementModalOpen && (
                <div style={{
                  position: 'fixed',
                  inset: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 9999,
                  padding: 16
                }}>
                  <div style={{
                    backgroundColor: '#FFF',
                    borderRadius: 16,
                    width: '100%',
                    maxWidth: 480,
                    padding: 24,
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                  }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1E293B', margin: '0 0 8px 0' }}>
                      {commissionData?.isLocked ? 'Settle Debt to Unblock Stock' : 'Deposit Platform Commission'}
                    </h3>
                    <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 16px 0' }}>
                      {commissionData?.isLocked
                        ? <>Your store is currently paused because unpaid commission reached Rs. 2,000. Transfer at least <strong>Rs. 1,000</strong> to the platform Admin JazzCash account below to restore your store and stock.</>
                        : <>Transfer platform commission to the Admin JazzCash account below. Minimum deposit is <strong>Rs. 1,000</strong>. Your stock remains active and orders continue uninterrupted as long as your debt is under <strong>Rs. 2,000</strong>.</>
                      }
                    </p>

                    <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 12, marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748B', marginBottom: 4 }}>
                        <span>Admin JazzCash Number:</span>
                        <strong style={{ color: '#DC2626', fontSize: 14 }}>03054758667</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748B' }}>
                        <span>Account Title:</span>
                        <strong style={{ color: '#1E293B' }}>Maveshi Sehat Official</strong>
                      </div>
                    </div>

                    <form onSubmit={handleSubmitSettlement}>
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>
                            Amount to Settle (PKR)
                          </label>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#DC2626' }}>
                            Min: Rs. 1,000
                          </span>
                        </div>
                        <input
                          type="number"
                          className="form-control"
                          value={settlementAmount}
                          onChange={(e) => setSettlementAmount(e.target.value)}
                          required
                          min="1000"
                          placeholder="Min. Rs. 1,000"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1' }}
                        />
                        <span style={{ fontSize: '11px', color: '#64748B', marginTop: 4, display: 'block' }}>
                          {commissionData?.isLocked
                            ? 'Minimum transfer of Rs. 1,000 is required to unblock your store.'
                            : 'Minimum deposit is Rs. 1,000. Stock stays active as long as debt is under Rs. 2,000.'}
                        </span>
                      </div>

                      <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                          Your Sender JazzCash Phone Number
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={settlementSenderPhone}
                          onChange={(e) => setSettlementSenderPhone(e.target.value)}
                          placeholder="03XXXXXXXXX"
                          required
                          style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1' }}
                        />
                      </div>

                      <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                          JazzCash Transaction ID (TID)
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={settlementTid}
                          onChange={(e) => setSettlementTid(e.target.value)}
                          placeholder="e.g. JC891238910"
                          required
                          style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1' }}
                        />
                      </div>

                      <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                          Payment Receipt Screenshot Proof
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          ref={settlementFileRef}
                          onChange={handleSettlementFilePick}
                          required
                          style={{ fontSize: 12 }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <button
                          type="button"
                          onClick={() => setIsSettlementModalOpen(false)}
                          style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #CBD5E1', backgroundColor: '#F1F5F9', cursor: 'pointer', fontSize: 13 }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={settlementSubmitting}
                          style={{ padding: '8px 18px', borderRadius: 8, border: 'none', backgroundColor: '#059669', color: '#FFF', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
                        >
                          {settlementSubmitting 
                            ? 'Submitting Proof...' 
                            : (commissionData?.isLocked ? 'Submit & Unblock Store' : 'Submit Deposit Proof')}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
