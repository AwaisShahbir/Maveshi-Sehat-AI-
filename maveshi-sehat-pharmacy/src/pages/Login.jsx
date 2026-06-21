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
    <div className="flex min-h-screen w-screen bg-slate-50">
      
      <div 
        className="hidden md:flex flex-col justify-center items-center p-10 bg-gradient-to-br from-emerald-950 to-emerald-900 border-r border-emerald-800 text-white"
        style={{ flex: '1.1' }}
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-[90px] h-[90px] rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center mb-5">
            
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#10b981" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M12 8v8M8 12h8" strokeWidth="3" />
            </svg>
          </div>
          <h1 className="font-heading text-3xl font-extrabold text-white tracking-tight">Maveshi Sehat AI</h1>
          <h2 className="text-lg font-medium text-emerald-400 mt-1">Pharmacy Portal</h2>
          <p className="text-sm text-emerald-400 mt-1 urdu">فارمیسی پورٹل</p>
        </div>

        <div className="w-full max-w-[400px] flex flex-col gap-6 mb-12">
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-full bg-emerald-900/50 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Verified & trusted platform</p>
              <p className="text-xs text-slate-300 mt-0.5">تصدیق شدہ اور قابل اعتماد پلیٹ فارم</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-full bg-emerald-900/50 text-emerald-400 flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Real-time order management</p>
              <p className="text-xs text-slate-300 mt-0.5">حقیقی وقت میں آرڈر کا انتظام</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-full bg-emerald-900/50 text-emerald-400 flex items-center justify-center shrink-0">
              <Heart size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Direct farmer-pharmacy connection</p>
              <p className="text-xs text-slate-300 mt-0.5">کسان اور فارمیسی کا براہ راست رابطہ</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-full bg-emerald-900/50 text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Grow your medicine business</p>
              <p className="text-xs text-slate-300 mt-0.5">اپنے دوا کے کاروبار کو بڑھائیں</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 border-t border-emerald-800/60 pt-6 w-full max-w-[400px]">
          <p className="text-sm text-slate-300">Don't have an account?</p>
          <button 
            className="bg-transparent border-none text-emerald-400 font-semibold text-sm cursor-pointer underline hover:text-emerald-300"
            onClick={() => onViewChange('register')}
          >
            Register your pharmacy / اپنی فارمیسی رجسٹر کریں
          </button>
        </div>
      </div>

      
      <div 
        className="flex items-center justify-center p-6 md:p-10"
        style={{ flex: '1.2' }}
      >
        <div className="w-full max-w-[460px] bg-white rounded-[24px] border border-slate-200 p-8 md:p-12 shadow-xl flex flex-col">
          <h2 className="font-heading text-2xl font-bold text-slate-900 text-center">Welcome Back</h2>
          <p className="text-sm text-slate-500 text-center mt-1">Login to your pharmacy portal</p>
          <p className="text-xs text-emerald-600 text-center mt-0.5 urdu">اپنے فارمیسی پورٹل میں لاگ ان کریں</p>

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
                  className="form-control pl-11 pr-11 bg-white border border-slate-200 text-slate-900 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 w-full"
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
                  className="form-control pl-11 pr-11 bg-white border border-slate-200 text-slate-900 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 w-full"
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
                <input type="checkbox" className="cursor-pointer rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                <span>Remember me</span>
              </label>
              <button 
                type="button" 
                className="bg-transparent border-none text-xs text-emerald-600 font-semibold cursor-pointer hover:text-emerald-700"
              >
                Forgot Password?
              </button>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-bold border-none rounded-xl flex items-center justify-center gap-2.5 cursor-pointer transition-colors duration-200"
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
            className="w-full h-12 bg-transparent text-emerald-600 border border-emerald-600 hover:bg-emerald-50 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center transition-all duration-200"
          >
            Register New Pharmacy / فارمیسی رجسٹر کریں
          </button>

          <div className="text-center mt-8 text-xs text-slate-400">
            Need help? Contact support at <a href="mailto:support@maveshisehat.ai" className="text-emerald-600 font-semibold hover:underline">support@maveshisehat.ai</a>
          </div>
        </div>
      </div>
    </div>
  );
}
