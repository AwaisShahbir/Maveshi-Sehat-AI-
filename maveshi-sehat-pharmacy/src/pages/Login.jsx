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
    <div className="flex min-h-screen w-screen bg-[#eff7f2]">
      
      <div 
        className="hidden md:flex flex-col justify-center items-center p-12 bg-gradient-to-br from-[#135431] to-[#0e3a22] border-r border-[#0e3a22] text-white"
        style={{ flex: '1.1' }}
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-[96px] h-[96px] rounded-full bg-white/5 border-[3px] border-[#3da860] flex items-center justify-center mb-5 shadow-inner">
            <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="#3da860" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M12 8v8M8 12h8" strokeWidth="3" />
            </svg>
          </div>
          <h1 className="font-heading text-3xl font-extrabold text-white tracking-tight">Maveshi Sehat AI</h1>
          <h2 className="text-lg font-semibold text-[#3da860] mt-1">Pharmacy Portal</h2>
          <p className="text-sm text-[#3da860] mt-1.5 urdu">فارمیسی پورٹل</p>
        </div>

        <div className="w-full max-w-[400px] flex flex-col gap-6 mb-12">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#3da860]/10 text-[#3da860] flex items-center justify-center shrink-0 border border-[#3da860]/20">
              <CheckCircle size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Verified & trusted platform</p>
              <p className="text-xs text-slate-300 mt-0.5">تصدیق شدہ اور قابل اعتماد پلیٹ فارم</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#3da860]/10 text-[#3da860] flex items-center justify-center shrink-0 border border-[#3da860]/20">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Real-time order management</p>
              <p className="text-xs text-slate-300 mt-0.5">حقیقی وقت میں آرڈر کا انتظام</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#3da860]/10 text-[#3da860] flex items-center justify-center shrink-0 border border-[#3da860]/20">
              <Heart size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Direct farmer-pharmacy connection</p>
              <p className="text-xs text-slate-300 mt-0.5">کسان اور فارمیسی کا براہ راست رابطہ</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#3da860]/10 text-[#3da860] flex items-center justify-center shrink-0 border border-[#3da860]/20">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Grow your medicine business</p>
              <p className="text-xs text-slate-300 mt-0.5">اپنے دوا کے کاروبار کو بڑھائیں</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 border-t border-[#3da860]/20 pt-6 w-full max-w-[400px]">
          <p className="text-sm text-slate-300">Don't have an account?</p>
          <button 
            className="bg-transparent border-none text-[#3da860] font-bold text-sm cursor-pointer underline hover:text-[#4cb880] transition-colors"
            onClick={() => onViewChange('register')}
          >
            Register your pharmacy / اپنی فارمیسی رجسٹر کریں
          </button>
        </div>
      </div>

      
      <div 
        className="flex items-center justify-center p-6 md:p-12"
        style={{ flex: '1.2' }}
      >
        <div className="w-full max-w-[460px] bg-white rounded-[24px] border border-slate-200 p-8 md:p-12 shadow-xl flex flex-col">
          <h2 className="font-heading text-2xl font-bold text-slate-900 text-center">Welcome Back</h2>
          <p className="text-sm text-slate-500 text-center mt-1">Login to your pharmacy portal</p>
          <p className="text-xs text-[#3da860] text-center mt-0.5 urdu">اپنے فارمیسی پورٹل میں لاگ ان کریں</p>

          {error && (
            <div className="flex items-center gap-2.5 bg-red-50 text-red-600 p-3.5 rounded-xl text-xs font-semibold mt-6 border border-red-100">
              <ShieldAlert size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col mt-7">
            <div className="form-group">
              <label className="form-label">
                Email or Phone Number <span className="label-ur">ای میل یا فون نمبر</span>
              </label>
              <div className="relative flex items-center">
                <Mail size={18} className="absolute left-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Enter email or phone"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  className="form-control pl-11 pr-11 bg-white border border-slate-200 text-slate-900 rounded-xl focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20 w-full"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Password <span className="label-ur">پاس ورڈ</span>
              </label>
              <div className="relative flex items-center">
                <KeyRound size={18} className="absolute left-3.5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-control pl-11 pr-11 bg-white border border-slate-200 text-slate-900 rounded-xl focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20 w-full"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 bg-transparent border-none text-slate-400 hover:text-slate-600 cursor-pointer flex items-center"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center mt-2 mb-6">
              <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                <input type="checkbox" className="cursor-pointer rounded border-slate-300 text-[#3da860] focus:ring-[#3da860]" />
                <span>Remember me</span>
              </label>
              <button 
                type="button" 
                className="bg-transparent border-none text-xs text-[#3da860] font-semibold cursor-pointer hover:text-[#2e8c4e]"
              >
                Forgot Password?
              </button>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full h-12 bg-[#3da860] hover:bg-[#2e8c4e] disabled:bg-[#3da860]/50 text-white text-sm font-bold border-none rounded-xl flex items-center justify-center gap-2.5 cursor-pointer transition-colors duration-200 shadow-md shadow-[#3da860]/10"
            >
              <LogIn size={18} />
              <span>{loading ? 'Logging in...' : 'Login to Dashboard / لاگ ان کریں'}</span>
            </button>
          </form>

          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-slate-200"></div>
            <span className="mx-2.5 text-slate-400 text-xs font-bold">OR</span>
            <div className="flex-1 border-t border-slate-200"></div>
          </div>

          <button
            type="button"
            onClick={() => onViewChange('register')}
            className="w-full h-12 bg-transparent text-[#3da860] border border-[#3da860] hover:bg-[#eff7f2] rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center transition-all duration-200"
          >
            Register New Pharmacy / فارمیسی رجسٹر کریں
          </button>

          <div className="text-center mt-8 text-xs text-slate-400">
            Need help? Contact support at <a href="mailto:support@maveshisehat.ai" className="text-[#3da860] font-semibold hover:underline">support@maveshisehat.ai</a>
          </div>
        </div>
      </div>
    </div>
  );
}
