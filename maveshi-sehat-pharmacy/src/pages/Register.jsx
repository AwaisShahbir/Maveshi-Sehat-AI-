import React, { useState } from 'react';
import { ShieldCheck, Info, MapPin, Award, Store, ArrowLeft, Send } from 'lucide-react';

export default function Register({ onViewChange }) {
  
  const [formData, setFormData] = useState({
    name: '',
    nameUrdu: '',
    ownerName: '',
    cnic: '',
    phone: '',
    whatsapp: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    province: 'Punjab',
    city: '',
    licenseNumber: '',
    licenseExpiry: '',
    businessHours: 'Mon-Sat: 9:00 AM - 8:00 PM',
    description: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/pharmacy/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#eff7f2] p-6">
        <div className="w-full max-w-[460px] bg-white border border-slate-200 rounded-[24px] p-8 md:p-12 text-center shadow-xl">
          <div className="w-20 h-20 rounded-full bg-[#3da860]/10 text-[#3da860] flex items-center justify-center mx-auto mb-6 border-[3px] border-[#3da860]">
            <ShieldCheck size={48} />
          </div>
          <h2 className="font-heading text-2xl font-bold text-slate-900 mb-4">Application Submitted!</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Thank you for registering <strong>{formData.name}</strong>. Your application is now pending admin review.
          </p>
          <p className="text-xs text-[#3da860] mt-3 leading-loose urdu">
            آپ کی فارمیسی کی رجسٹریشن درخواست موصول ہو گئی ہے۔ ایڈمن کی منظوری کے بعد آپ لاگ ان کر سکیں گے۔
          </p>
          <button 
            className="w-full h-11 bg-[#3da860] hover:bg-[#2e8c4e] text-white border-none rounded-xl text-sm font-bold cursor-pointer mt-8 transition-colors duration-200" 
            onClick={() => onViewChange('login')}
          >
            Back to Login / لاگ ان پر واپس جائیں
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eff7f2] text-slate-900 flex flex-col">
      
      <header className="flex items-center p-6 md:px-8 bg-white border-b border-slate-200 gap-6">
        <button 
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-900 rounded-xl font-semibold text-xs cursor-pointer hover:bg-[#eff7f2] transition-colors duration-200" 
          onClick={() => onViewChange('login')}
        >
          <ArrowLeft size={18} />
          <span>Back to Login</span>
        </button>
        <div className="flex flex-col">
          <h1 className="font-heading text-xl font-bold text-slate-900">Register Pharmacy Portal</h1>
          <p className="text-xs text-[#3da860] mt-0.5 urdu">فارمیسی رجسٹریشن فارم</p>
        </div>
      </header>

      
      <main className="flex-1 max-w-[800px] w-full mx-auto py-10 px-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 font-semibold text-sm">{error}</div>}

          
          <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3">
              <Info size={20} className="text-[#3da860]" />
              <h2 className="text-sm font-bold text-slate-900">Basic Information / بنیادی معلومات</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="form-group mb-0">
                <label className="form-label">
                  Pharmacy Name (English) <span className="label-ur">فارمیسی کا نام (انگریزی)</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Al-Shifa Medical Store"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-control bg-white border border-slate-200 text-slate-900 rounded-xl focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20 w-full"
                />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">
                  Pharmacy Name (Urdu) <span className="label-ur">فارمیسی کا نام (اردو)</span>
                </label>
                <input
                  type="text"
                  name="nameUrdu"
                  placeholder="مثال: الشفاء میڈیکل اسٹور"
                  value={formData.nameUrdu}
                  onChange={handleChange}
                  className="form-control bg-white border border-slate-200 text-slate-900 rounded-xl focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20 w-full text-right"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
              <div className="form-group mb-0">
                <label className="form-label">
                  Owner Name <span className="label-ur">مالک کا نام</span>
                </label>
                <input
                  type="text"
                  name="ownerName"
                  required
                  placeholder="e.g. Dr. Ahmed Ali"
                  value={formData.ownerName}
                  onChange={handleChange}
                  className="form-control bg-white border border-slate-200 text-slate-900 rounded-xl focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20 w-full"
                />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">
                  CNIC <span className="label-ur">شناختی کارڈ نمبر</span>
                </label>
                <input
                  type="text"
                  name="cnic"
                  required
                  placeholder="e.g. 12345-6789012-3"
                  value={formData.cnic}
                  onChange={handleChange}
                  className="form-control bg-white border border-slate-200 text-slate-900 rounded-xl focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20 w-full"
                />
              </div>
            </div>
          </section>

          
          <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3">
              <Store size={20} className="text-[#3da860]" />
              <h2 className="text-sm font-bold text-slate-900">Contact Information / رابطہ کی معلومات</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="form-group mb-0">
                <label className="form-label">
                  Phone Number <span className="label-ur">فون نمبر</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="e.g. +92 300 1234567"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-control bg-white border border-slate-200 text-slate-900 rounded-xl focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20 w-full"
                />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">
                  WhatsApp Number <span className="label-ur">واٹس ایپ نمبر</span>
                </label>
                <input
                  type="tel"
                  name="whatsapp"
                  placeholder="e.g. +92 300 1234567"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  className="form-control bg-white border border-slate-200 text-slate-900 rounded-xl focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20 w-full"
                />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">
                  Email Address <span className="label-ur">ای میل ایڈریس</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="e.g. alshifa@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-control bg-white border border-slate-200 text-slate-900 rounded-xl focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20 w-full"
                />
              </div>
            </div>
          </section>

          
          <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3">
              <MapPin size={20} className="text-[#3da860]" />
              <h2 className="text-sm font-bold text-slate-900">Location / مقام</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="form-group mb-0">
                <label className="form-label">
                  Province <span className="label-ur">صوبہ</span>
                </label>
                <select
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  className="form-control bg-white border border-slate-200 text-slate-900 rounded-xl focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20 w-full cursor-pointer"
                >
                  <option value="Punjab">Punjab</option>
                  <option value="Sindh">Sindh</option>
                  <option value="KPK">KPK</option>
                  <option value="Balochistan">Balochistan</option>
                  <option value="Gilgit Baltistan">Gilgit Baltistan</option>
                  <option value="AJK">AJK</option>
                </select>
              </div>
              <div className="form-group mb-0">
                <label className="form-label">
                  City <span className="label-ur">شہر</span>
                </label>
                <input
                  type="text"
                  name="city"
                  required
                  placeholder="e.g. Faisalabad"
                  value={formData.city}
                  onChange={handleChange}
                  className="form-control bg-white border border-slate-200 text-slate-900 rounded-xl focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20 w-full"
                />
              </div>
            </div>
            <div className="form-group mb-0 mt-5">
              <label className="form-label">
                Full Address <span className="label-ur">مکمل پتہ</span>
              </label>
              <textarea
                name="address"
                required
                placeholder="Enter complete store location details..."
                value={formData.address}
                onChange={handleChange}
                className="form-control bg-white border border-slate-200 text-slate-900 rounded-xl focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20 w-full h-[80px]"
              />
            </div>
          </section>

          
          <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3">
              <Award size={20} className="text-[#3da860]" />
              <h2 className="text-sm font-bold text-slate-900">License Information / لائسنس کی معلومات</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="form-group mb-0">
                <label className="form-label">
                  DRAP License Number <span className="label-ur">ڈرپ لائسنس نمبر</span>
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  required
                  placeholder="e.g. DRAP/PB/2024/0145"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  className="form-control bg-white border border-slate-200 text-slate-900 rounded-xl focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20 w-full"
                />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">
                  License Expiry Date <span className="label-ur">لائسنس کی تاریخ ختم</span>
                </label>
                <input
                  type="date"
                  name="licenseExpiry"
                  required
                  value={formData.licenseExpiry}
                  onChange={handleChange}
                  className="form-control bg-white border border-slate-200 text-slate-900 rounded-xl focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20 w-full"
                />
              </div>
            </div>
          </section>

          
          <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3">
              <Store size={20} className="text-[#3da860]" />
              <h2 className="text-sm font-bold text-slate-900">Business Details / کاروباری تفصیلات</h2>
            </div>
            <div className="form-group">
              <label className="form-label">
                Business Hours <span className="label-ur">کاروبار کے اوقات</span>
              </label>
              <input
                type="text"
                name="businessHours"
                required
                placeholder="e.g. Mon-Sat: 9:00 AM - 8:00 PM"
                value={formData.businessHours}
                onChange={handleChange}
                className="form-control bg-white border border-slate-200 text-slate-900 rounded-xl focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20 w-full"
              />
            </div>
            <div className="form-group mb-0">
              <label className="form-label">
                Description <span className="label-ur">تفصیل</span>
              </label>
              <textarea
                name="description"
                placeholder="Write a brief overview of your products, medicines available, etc..."
                value={formData.description}
                onChange={handleChange}
                className="form-control bg-white border border-slate-200 text-slate-900 rounded-xl focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20 w-full h-[100px]"
              />
            </div>
          </section>

          
          <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3">
              <Award size={20} className="text-[#3da860]" />
              <h2 className="text-sm font-bold text-slate-900">Security / سیکیورٹی</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="form-group mb-0">
                <label className="form-label">
                  Password <span className="label-ur">پاس ورڈ</span>
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength="6"
                  placeholder="Create password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-control bg-white border border-slate-200 text-slate-900 rounded-xl focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20 w-full"
                />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">
                  Confirm Password <span className="label-ur">تصدیق کریں</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  placeholder="Repeat password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="form-control bg-white border border-slate-200 text-slate-900 rounded-xl focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20 w-full"
                />
              </div>
            </div>
          </section>

          <button 
            type="submit" 
            disabled={loading} 
            className="h-12 bg-[#3da860] hover:bg-[#2e8c4e] disabled:bg-[#3da860]/50 text-white text-sm font-bold border-none rounded-xl flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-[#3da860]/20 mt-3 transition-all duration-200"
          >
            <Send size={18} />
            <span>{loading ? 'Submitting Request...' : 'Submit Registration / درخواست جمع کرائیں'}</span>
          </button>
        </form>
      </main>
    </div>
  );
}
