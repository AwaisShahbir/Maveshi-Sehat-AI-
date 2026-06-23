import React, { useState, useEffect } from 'react';
import {
  Globe, Bell, Shield, Eye, EyeOff, Lock, Save, CheckCircle,
  Sun, Moon, Monitor, ChevronRight, AlertTriangle, Smartphone
} from 'lucide-react';

export default function Settings({ pharmacy }) {
  // Language
  const [language, setLanguage] = useState('English');
  // Notifications
  const [notifNewOrder, setNotifNewOrder] = useState(true);
  const [notifLowStock, setNotifLowStock] = useState(true);
  const [notifOrderStatus, setNotifOrderStatus] = useState(true);
  const [notifEmail, setNotifEmail] = useState(false);
  // Security
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  // Display
  const [theme, setTheme] = useState('system');
  const [currency, setCurrency] = useState('PKR');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  // Feedback
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');

  // Load saved settings
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pharmacy_settings');
      if (saved) {
        const s = JSON.parse(saved);
        if (s.language) setLanguage(s.language);
        if (s.notifNewOrder !== undefined) setNotifNewOrder(s.notifNewOrder);
        if (s.notifLowStock !== undefined) setNotifLowStock(s.notifLowStock);
        if (s.notifOrderStatus !== undefined) setNotifOrderStatus(s.notifOrderStatus);
        if (s.notifEmail !== undefined) setNotifEmail(s.notifEmail);
        if (s.theme) setTheme(s.theme);
        if (s.currency) setCurrency(s.currency);
        if (s.dateFormat) setDateFormat(s.dateFormat);
      }
    } catch {}
  }, []);

  const saveGeneralSettings = () => {
    const settings = { language, notifNewOrder, notifLowStock, notifOrderStatus, notifEmail, theme, currency, dateFormat };
    localStorage.setItem('pharmacy_settings', JSON.stringify(settings));
    // Also save language for translate.jsx to pick up
    const profile = JSON.parse(localStorage.getItem('profile') || '{}');
    profile.language = language;
    localStorage.setItem('profile', JSON.stringify(profile));
    setSuccessMsg('Settings saved successfully!');
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');
    if (!currentPwd || !newPwd || !confirmPwd) {
      setPwdError('Please fill out all password fields.');
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError('New password and confirm password do not match.');
      return;
    }
    if (newPwd.length < 8) {
      setPwdError('New password must be at least 8 characters.');
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/pharmacy/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pharmacyId: pharmacy.id, currentPassword: currentPwd, newPassword: newPwd })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password.');
      setPwdSuccess('Password changed successfully!');
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      setTimeout(() => setPwdSuccess(''), 4000);
    } catch (err) {
      setPwdError(err.message);
    }
  };

  const Toggle = ({ value, onChange }) => (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex items-center w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${value ? 'bg-[#3da860]' : 'bg-slate-200'}`}
    >
      <span className={`inline-block w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${value ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );

  const SectionTitle = ({ icon: Icon, title, urdu }) => (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-9 h-9 rounded-xl bg-[#3da860]/10 text-[#3da860] flex items-center justify-center">
        <Icon size={18} />
      </div>
      <div>
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <p className="text-[11px] text-[#3da860] urdu">{urdu}</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 max-w-4xl">

      {/* Success Banner */}
      {successMsg && (
        <div className="flex items-center gap-3 bg-[#3da860]/10 text-[#3da860] border border-[#3da860]/20 p-4 rounded-2xl font-bold text-sm">
          <CheckCircle size={18} />
          {successMsg}
        </div>
      )}

      {/* ─── Language & Display ─── */}
      <div className="bg-white border border-slate-100 rounded-2xl p-7 shadow-sm">
        <SectionTitle icon={Globe} title="Language & Display" urdu="زبان اور ڈسپلے" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Language */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Portal Language / پورٹل کی زبان
            </label>
            <div className="flex flex-col gap-2">
              {['English', 'Urdu', 'Both'].map(lang => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                    language === lang
                      ? 'border-[#3da860] bg-[#3da860]/5 text-[#3da860]'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-[#3da860]/40'
                  }`}
                >
                  <span>
                    {lang === 'English' ? '🇬🇧 English' : lang === 'Urdu' ? '🇵🇰 Urdu (اردو)' : '🔄 Both (English / اردو)'}
                  </span>
                  {language === lang && <CheckCircle size={16} className="text-[#3da860]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Display Preferences */}
          <div className="flex flex-col gap-5">
            {/* Theme */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Theme / تھیم
              </label>
              <div className="flex gap-2">
                {[
                  { val: 'light', icon: Sun, label: 'Light' },
                  { val: 'dark', icon: Moon, label: 'Dark' },
                  { val: 'system', icon: Monitor, label: 'System' }
                ].map(({ val, icon: Icon, label }) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setTheme(val)}
                    className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      theme === val
                        ? 'border-[#3da860] bg-[#3da860]/5 text-[#3da860]'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-[#3da860]/40'
                    }`}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Currency */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Currency / کرنسی
              </label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="form-control focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20 text-sm"
              >
                <option value="PKR">PKR – Pakistani Rupee</option>
                <option value="USD">USD – US Dollar</option>
              </select>
            </div>

            {/* Date Format */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Date Format / تاریخ فارمیٹ
              </label>
              <select
                value={dateFormat}
                onChange={e => setDateFormat(e.target.value)}
                className="form-control focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20 text-sm"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Notification Preferences ─── */}
      <div className="bg-white border border-slate-100 rounded-2xl p-7 shadow-sm">
        <SectionTitle icon={Bell} title="Notification Preferences" urdu="اطلاعات کی ترجیحات" />

        <div className="flex flex-col gap-4">
          {[
            { label: 'New Order Received', urdu: 'نیا آرڈر موصول ہوا', val: notifNewOrder, set: setNotifNewOrder },
            { label: 'Low Stock Alert', urdu: 'کم اسٹاک الرٹ', val: notifLowStock, set: setNotifLowStock },
            { label: 'Order Status Updates', urdu: 'آرڈر کی حالت کی تازہ کاری', val: notifOrderStatus, set: setNotifOrderStatus },
            { label: 'Email Notifications', urdu: 'ای میل اطلاعات', val: notifEmail, set: setNotifEmail, icon: Smartphone }
          ].map(({ label, urdu, val, set }) => (
            <div key={label} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-b-0">
              <div>
                <p className="text-sm font-semibold text-slate-800">{label}</p>
                <p className="text-[11px] text-slate-400 urdu mt-0.5">{urdu}</p>
              </div>
              <Toggle value={val} onChange={set} />
            </div>
          ))}
        </div>
      </div>

      {/* Save General Settings Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={saveGeneralSettings}
          className="btn btn-primary bg-[#3da860] hover:bg-[#2e8c4e] shadow-md shadow-[#3da860]/15 flex items-center gap-2 rounded-xl cursor-pointer font-bold px-6 py-2.5"
        >
          <Save size={16} />
          <span>Save Settings / ترتیبات محفوظ کریں</span>
        </button>
      </div>

      {/* ─── Security / Change Password ─── */}
      <div className="bg-white border border-slate-100 rounded-2xl p-7 shadow-sm">
        <SectionTitle icon={Shield} title="Security / Change Password" urdu="سیکیورٹی / پاس ورڈ تبدیل کریں" />

        {pwdSuccess && (
          <div className="flex items-center gap-2 bg-[#3da860]/10 text-[#3da860] border border-[#3da860]/20 p-3 rounded-xl text-sm font-bold mb-4">
            <CheckCircle size={16} /> {pwdSuccess}
          </div>
        )}
        {pwdError && (
          <div className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-100 p-3 rounded-xl text-sm font-bold mb-4">
            <AlertTriangle size={16} /> {pwdError}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="flex flex-col gap-4 max-w-lg">
          {/* Current Password */}
          <div className="form-group mb-0">
            <label className="form-label">Current Password / موجودہ پاس ورڈ</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showCurrentPwd ? 'text' : 'password'}
                className="form-control pl-9 pr-9 focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20"
                placeholder="Enter current password"
                value={currentPwd}
                onChange={e => setCurrentPwd(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer bg-transparent border-none p-0"
              >
                {showCurrentPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="form-group mb-0">
            <label className="form-label">New Password / نیا پاس ورڈ</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showNewPwd ? 'text' : 'password'}
                className="form-control pl-9 pr-9 focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20"
                placeholder="Min. 8 characters"
                value={newPwd}
                onChange={e => setNewPwd(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowNewPwd(!showNewPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer bg-transparent border-none p-0"
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

          {/* Confirm Password */}
          <div className="form-group mb-0">
            <label className="form-label">Confirm New Password / تصدیق کریں</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showConfirmPwd ? 'text' : 'password'}
                className={`form-control pl-9 pr-9 focus:ring-2 ${
                  confirmPwd && newPwd !== confirmPwd
                    ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                    : confirmPwd && newPwd === confirmPwd
                    ? 'border-[#3da860] focus:border-[#3da860] focus:ring-[#3da860]/20'
                    : 'focus:border-[#3da860] focus:ring-[#3da860]/20'
                }`}
                placeholder="Re-enter new password"
                value={confirmPwd}
                onChange={e => setConfirmPwd(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer bg-transparent border-none p-0"
              >
                {showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmPwd && newPwd !== confirmPwd && (
              <p className="text-xs text-red-500 mt-1 font-semibold">Passwords do not match</p>
            )}
            {confirmPwd && newPwd === confirmPwd && (
              <p className="text-xs text-[#3da860] mt-1 font-semibold flex items-center gap-1"><CheckCircle size={12} /> Passwords match</p>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary bg-[#135431] hover:bg-[#0e3a22] shadow-md flex items-center gap-2 rounded-xl cursor-pointer font-bold w-fit px-6 py-2.5 mt-1"
          >
            <Shield size={16} />
            <span>Change Password / پاس ورڈ تبدیل کریں</span>
          </button>
        </form>
      </div>

      {/* ─── Account Info ─── */}
      <div className="bg-white border border-slate-100 rounded-2xl p-7 shadow-sm">
        <SectionTitle icon={Lock} title="Account Information" urdu="اکاؤنٹ کی معلومات" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Pharmacy Name</span>
            <span className="text-sm font-bold text-slate-900">{pharmacy.name}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Registered Email</span>
            <span className="text-sm font-bold text-slate-900">{pharmacy.email}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Account Status</span>
            <span className="text-sm font-bold text-[#3da860]">✓ Approved & Verified</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Portal Version</span>
            <span className="text-sm font-bold text-slate-900">Maveshi Sehat AI v1.0</span>
          </div>
        </div>
      </div>

    </div>
  );
}
