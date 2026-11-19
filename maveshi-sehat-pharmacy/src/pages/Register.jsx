import { API_BASE_URL } from '../config';
import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, 
  Info, 
  MapPin, 
  Award, 
  Store, 
  ArrowLeft, 
  Send,
  FileText,
  UploadCloud,
  CheckCircle2,
  Trash2,
  AlertCircle,
  FileCheck,
  Check
} from 'lucide-react';
import '../styles/Register.css';

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
    businessHours: '',
    description: '',
    licenseDocumentUrl: '',
    cnicDocumentUrl: ''
  });

  const [uploadingLicense, setUploadingLicense] = useState(false);
  const [uploadingCnic, setUploadingCnic] = useState(false);
  const [licenseFileName, setLicenseFileName] = useState('');
  const [cnicFileName, setCnicFileName] = useState('');

  const licenseInputRef = useRef(null);
  const cnicInputRef = useRef(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = async (file, type) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit. Please upload a smaller document.');
      return;
    }

    const uploadData = new FormData();
    uploadData.append(type, file);

    if (type === 'license') {
      setUploadingLicense(true);
      setLicenseFileName(file.name);
    } else {
      setUploadingCnic(true);
      setCnicFileName(file.name);
    }
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: uploadData
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload document.');
      }

      if (type === 'license') {
        setFormData(prev => ({ ...prev, licenseDocumentUrl: data.fileUrl }));
      } else {
        setFormData(prev => ({ ...prev, cnicDocumentUrl: data.fileUrl }));
      }
    } catch (err) {
      setError(`Failed to upload ${type === 'license' ? 'License' : 'CNIC'} document: ${err.message}`);
      if (type === 'license') setLicenseFileName('');
      else setCnicFileName('');
    } finally {
      if (type === 'license') setUploadingLicense(false);
      else setUploadingCnic(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    if (!formData.licenseDocumentUrl) {
      setError('Please upload your official DRAP / Pharmacy Drug License document before submitting.');
      return;
    }

    if (!formData.cnicDocumentUrl) {
      setError('Please upload your Proprietor CNIC document (Front / Back) so the administrator can verify your identity.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/pharmacy/register`, {
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
      <div className="pharmacy-register-success-view">
        <div className="w-full max-w-[460px] bg-white border border-slate-200 rounded-[24px] p-8 md:p-12 text-center shadow-xl">
          <div className="w-20 h-20 rounded-full bg-[#3da860]/10 text-[#3da860] flex items-center justify-center mx-auto mb-6 border-[3px] border-[#3da860]">
            <ShieldCheck size={48} />
          </div>
          <h2 className="font-heading text-2xl font-bold text-slate-900 mb-4">Application Submitted!</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Thank you for registering <strong>{formData.name}</strong>. Your application is now pending admin review.
          </p>
          <button 
            className="w-full h-11 bg-[#3da860] hover:bg-[#2e8c4e] text-white border-none rounded-xl text-sm font-bold cursor-pointer mt-8 transition-colors duration-200" 
            onClick={() => onViewChange('login')}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pharmacy-register-view">
      
      <header className="flex items-center p-4 sm:p-6 md:px-8 bg-white border-b border-slate-200 gap-3 sm:gap-6">
        <button 
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-900 rounded-xl font-semibold text-xs cursor-pointer hover:bg-[#eff7f2] transition-colors duration-200" 
          onClick={() => onViewChange('login')}
        >
          <ArrowLeft size={18} />
          <span>Back to Login</span>
        </button>
        <div className="flex flex-col">
          <h1 className="font-heading text-xl font-bold text-slate-900">Register Pharmacy Portal</h1>
        </div>
      </header>

      
      <main className="flex-1 max-w-[800px] w-full mx-auto py-6 sm:py-10 px-3.5 sm:px-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6" autoComplete="off">
          {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 font-semibold text-sm">{error}</div>}

          
          <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3">
              <Info size={20} className="text-[#3da860]" />
              <h2 className="text-sm font-bold text-slate-900">Basic Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="form-group mb-0">
                <label className="form-label">
                  Pharmacy Name
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
                  Branch / Trade Name
                </label>
                <input
                  type="text"
                  name="nameUrdu"
                  placeholder="e.g. Main Bazar Branch"
                  value={formData.nameUrdu}
                  onChange={handleChange}
                  className="form-control bg-white border border-slate-200 text-slate-900 rounded-xl focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20 w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
              <div className="form-group mb-0">
                <label className="form-label">
                  Owner Name
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
                  CNIC
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

          
          <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3">
              <Store size={20} className="text-[#3da860]" />
              <h2 className="text-sm font-bold text-slate-900">Contact Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="form-group mb-0">
                <label className="form-label">
                  Phone Number
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
                  WhatsApp Number
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
                  Email Address
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

          
          <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3">
              <MapPin size={20} className="text-[#3da860]" />
              <h2 className="text-sm font-bold text-slate-900">Location</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="form-group mb-0">
                <label className="form-label">
                  Province
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
                  City
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
                Full Address
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

          
          <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3">
              <Award size={20} className="text-[#3da860]" />
              <h2 className="text-sm font-bold text-slate-900">License Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="form-group mb-0">
                <label className="form-label">
                  DRAP License Number
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
                  License Expiry Date
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

          {/* Official Document Verification Section */}
          <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-3 border-b border-slate-100 pb-3">
              <FileCheck size={20} className="text-[#3da860]" />
              <div className="flex-1">
                <h2 className="text-sm font-bold text-slate-900">Official Verification Documents</h2>
                <p className="text-xs text-slate-500 m-0">Uploaded documents are cross-checked by the administrator before granting portal access.</p>
              </div>
            </div>

            <div className="bg-[#eff7f2] border border-[#bbf7d0] rounded-xl p-3.5 mb-6 flex items-start gap-3">
              <AlertCircle size={18} className="text-[#135431] shrink-0 mt-0.5" />
              <p className="text-xs text-[#135431] leading-relaxed m-0 font-medium">
                <strong>DRAP & Health Department Regulatory Policy:</strong> The administrator will inspect your official <strong>Drug Sale License</strong> against your <strong>CNIC</strong>. Please ensure the Proprietor Name and CNIC on both documents match your entered details.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* DRAP License Document Upload */}
              <div className="flex flex-col">
                <label className="form-label flex items-center justify-between">
                  <span>Pharmacy / DRAP Drug License <span className="text-red-500">*</span></span>
                  <span className="text-[11px] text-slate-400 font-normal">PDF, JPG, PNG (Max 10MB)</span>
                </label>

                <input
                  type="file"
                  ref={licenseInputRef}
                  accept=".pdf,image/jpeg,image/png,image/jpg"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0], 'license');
                    }
                  }}
                />

                <div 
                  onClick={() => !uploadingLicense && licenseInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 sm:p-5 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[140px] ${
                    formData.licenseDocumentUrl 
                      ? 'border-[#3da860] bg-[#eff7f2]' 
                      : 'border-slate-300 hover:border-[#3da860] hover:bg-slate-50'
                  }`}
                >
                  {uploadingLicense ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-3 border-[#3da860] border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-semibold text-[#135431]">Uploading license document...</span>
                    </div>
                  ) : formData.licenseDocumentUrl ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-[#3da860] text-white flex items-center justify-center">
                        <Check size={20} />
                      </div>
                      <span className="text-xs font-bold text-[#135431] max-w-[220px] truncate">
                        {licenseFileName || 'DRAP_License_Verified.pdf'}
                      </span>
                      <span className="text-[11px] text-[#3da860] font-semibold">Document Attached (Click to change)</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                        <UploadCloud size={20} />
                      </div>
                      <span className="text-xs font-bold text-slate-700">Click to upload Pharmacy License</span>
                      <span className="text-[11px] text-slate-400">Form 9, DRAP Certificate, or Govt License</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Owner CNIC Document Upload */}
              <div className="flex flex-col">
                <label className="form-label flex items-center justify-between">
                  <span>Proprietor CNIC Document <span className="text-red-500">*</span></span>
                  <span className="text-[11px] text-slate-400 font-normal">PDF, JPG, PNG (Max 10MB)</span>
                </label>

                <input
                  type="file"
                  ref={cnicInputRef}
                  accept=".pdf,image/jpeg,image/png,image/jpg"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0], 'cnic');
                    }
                  }}
                />

                <div 
                  onClick={() => !uploadingCnic && cnicInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 sm:p-5 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[140px] ${
                    formData.cnicDocumentUrl 
                      ? 'border-[#3da860] bg-[#eff7f2]' 
                      : 'border-slate-300 hover:border-[#3da860] hover:bg-slate-50'
                  }`}
                >
                  {uploadingCnic ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-3 border-[#3da860] border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-semibold text-[#135431]">Uploading CNIC document...</span>
                    </div>
                  ) : formData.cnicDocumentUrl ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-[#3da860] text-white flex items-center justify-center">
                        <Check size={20} />
                      </div>
                      <span className="text-xs font-bold text-[#135431] max-w-[220px] truncate">
                        {cnicFileName || 'Owner_CNIC_Verified.pdf'}
                      </span>
                      <span className="text-[11px] text-[#3da860] font-semibold">Document Attached (Click to change)</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                        <FileText size={20} />
                      </div>
                      <span className="text-xs font-bold text-slate-700">Click to upload Owner's CNIC</span>
                      <span className="text-[11px] text-slate-400">Front & Back scan or combined PDF</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          
          <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3">
              <Store size={20} className="text-[#3da860]" />
              <h2 className="text-sm font-bold text-slate-900">Business Details</h2>
            </div>
            <div className="form-group">
              <label className="form-label">
                Business Hours
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
                Description
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

          
          <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3">
              <Award size={20} className="text-[#3da860]" />
              <h2 className="text-sm font-bold text-slate-900">Security</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="form-group mb-0">
                <label className="form-label">
                  Password
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
                  Confirm Password
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
            <span>{loading ? 'Submitting Request...' : 'Submit Registration'}</span>
          </button>
        </form>
      </main>
    </div>
  );
}
