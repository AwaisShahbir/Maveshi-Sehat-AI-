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
  AlertCircle,
  FileCheck,
  Check
} from 'lucide-react';
import logoImg from '../assets/logo_circular.png';
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
    province: '',
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

    if (!formData.name.trim() || formData.name.trim().length < 3) {
      setError('Pharmacy name must be at least 3 characters long.');
      return;
    }

    if (!formData.ownerName.trim() || formData.ownerName.trim().length < 3) {
      setError('Owner / Pharmacist name must be at least 3 characters long.');
      return;
    }

    const cleanCnic = (formData.cnic || '').replace(/\D/g, '');
    if (cleanCnic.length !== 13) {
      setError('CNIC must be exactly 13 digits (e.g. 35201-1234567-1).');
      return;
    }

    const cleanPhone = (formData.phone || '').trim().replace(/[\s\-]/g, '');
    if (!/^(03\d{9}|\+923\d{9})$/.test(cleanPhone)) {
      setError('Please enter a valid Pakistani mobile number (e.g. 03001234567).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test((formData.email || '').trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    if (!formData.licenseNumber.trim()) {
      setError('Please enter your Pharmacy Drug License Number.');
      return;
    }

    if (!formData.address.trim() || formData.address.trim().length < 5) {
      setError('Please enter complete pharmacy address (minimum 5 characters).');
      return;
    }

    if (!formData.province) {
      setError('Please select your Province.');
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
        <div className="pharmacy-success-card">
          <div className="pharmacy-success-icon-bubble">
            <ShieldCheck size={48} />
          </div>
          <h2 className="pharmacy-success-title">Application Submitted!</h2>
          <p className="pharmacy-success-text">
            Thank you for registering <strong>{formData.name}</strong>. Your application is now pending admin review.
          </p>
          <button 
            className="pharmacy-success-btn" 
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
      {/* Header Bar */}
      <header className="pharmacy-reg-header">
        <button 
          type="button"
          className="pharmacy-reg-back-btn" 
          onClick={() => onViewChange('login')}
        >
          <ArrowLeft size={18} />
          <span>Back to Login</span>
        </button>
        <div className="pharmacy-reg-brand-group">
          <img src={logoImg} alt="Maveshi Sehat AI" className="pharmacy-reg-logo-img" />
          <h1 className="pharmacy-reg-heading">Register Pharmacy Portal</h1>
        </div>
      </header>

      {/* Main Form Body */}
      <main className="pharmacy-reg-main">
        <form onSubmit={handleSubmit} className="pharmacy-reg-form" autoComplete="off">
          {error && <div className="pharmacy-reg-error-banner">{error}</div>}

          {/* Section 1: Basic Information */}
          <section className="pharmacy-reg-card">
            <div className="pharmacy-reg-card-header">
              <Info size={20} className="pharmacy-reg-header-icon" />
              <h2 className="pharmacy-reg-section-title">Basic Information</h2>
            </div>
            <div className="pharmacy-reg-grid-2">
              <div className="form-group mb-0">
                <label className="form-label">Pharmacy Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Al-Shifa Medical Store"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-control pharmacy-reg-input"
                />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">Branch / Trade Name</label>
                <input
                  type="text"
                  name="nameUrdu"
                  placeholder="e.g. Main Bazar Branch"
                  value={formData.nameUrdu}
                  onChange={handleChange}
                  className="form-control pharmacy-reg-input"
                />
              </div>
            </div>
            <div className="pharmacy-reg-grid-2 mt-5">
              <div className="form-group mb-0">
                <label className="form-label">Owner Name</label>
                <input
                  type="text"
                  name="ownerName"
                  required
                  placeholder="e.g. Dr. Ahmed Ali"
                  value={formData.ownerName}
                  onChange={handleChange}
                  className="form-control pharmacy-reg-input"
                />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">CNIC</label>
                <input
                  type="text"
                  name="cnic"
                  required
                  placeholder="e.g. 12345-6789012-3"
                  value={formData.cnic}
                  onChange={handleChange}
                  className="form-control pharmacy-reg-input"
                />
              </div>
            </div>
          </section>

          {/* Section 2: Contact Information */}
          <section className="pharmacy-reg-card">
            <div className="pharmacy-reg-card-header">
              <Store size={20} className="pharmacy-reg-header-icon" />
              <h2 className="pharmacy-reg-section-title">Contact Information</h2>
            </div>
            <div className="pharmacy-reg-grid-3">
              <div className="form-group mb-0">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="e.g. +92 300 1234567"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-control pharmacy-reg-input"
                />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">WhatsApp Number</label>
                <input
                  type="tel"
                  name="whatsapp"
                  placeholder="e.g. +92 300 1234567"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  className="form-control pharmacy-reg-input"
                />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="e.g. alshifa@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-control pharmacy-reg-input"
                />
              </div>
            </div>
          </section>

          {/* Section 3: Location */}
          <section className="pharmacy-reg-card">
            <div className="pharmacy-reg-card-header">
              <MapPin size={20} className="pharmacy-reg-header-icon" />
              <h2 className="pharmacy-reg-section-title">Location</h2>
            </div>
            <div className="pharmacy-reg-grid-2">
              <div className="form-group mb-0">
                <label className="form-label">
                  Province <span className="text-red-500 font-bold">*</span>
                </label>
                <select
                  name="province"
                  required
                  value={formData.province}
                  onChange={handleChange}
                  className="form-control pharmacy-reg-input cursor-pointer"
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
              <div className="form-group mb-0">
                <label className="form-label">City</label>
                <input
                  type="text"
                  name="city"
                  required
                  placeholder="e.g. Faisalabad"
                  value={formData.city}
                  onChange={handleChange}
                  className="form-control pharmacy-reg-input"
                />
              </div>
            </div>
            <div className="form-group mb-0 mt-5">
              <label className="form-label">Full Address</label>
              <textarea
                name="address"
                required
                placeholder="Enter complete store location details..."
                value={formData.address}
                onChange={handleChange}
                className="form-control pharmacy-reg-textarea pharmacy-reg-textarea-sm"
              />
            </div>
          </section>

          {/* Section 4: License Information */}
          <section className="pharmacy-reg-card">
            <div className="pharmacy-reg-card-header">
              <Award size={20} className="pharmacy-reg-header-icon" />
              <h2 className="pharmacy-reg-section-title">License Information</h2>
            </div>
            <div className="pharmacy-reg-grid-2">
              <div className="form-group mb-0">
                <label className="form-label">DRAP License Number</label>
                <input
                  type="text"
                  name="licenseNumber"
                  required
                  placeholder="e.g. DRAP/PB/2024/0145"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  className="form-control pharmacy-reg-input"
                />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">License Expiry Date</label>
                <input
                  type="date"
                  name="licenseExpiry"
                  required
                  value={formData.licenseExpiry}
                  onChange={handleChange}
                  className="form-control pharmacy-reg-input"
                />
              </div>
            </div>
          </section>

          {/* Section 5: Official Document Verification */}
          <section className="pharmacy-reg-card">
            <div className="pharmacy-reg-card-header">
              <FileCheck size={20} className="pharmacy-reg-header-icon" />
              <div className="flex-1">
                <h2 className="pharmacy-reg-section-title">Official Verification Documents</h2>
                <p className="pharmacy-reg-section-subtitle">Uploaded documents are cross-checked by the administrator before granting portal access.</p>
              </div>
            </div>

            <div className="pharmacy-reg-policy-banner">
              <AlertCircle size={18} className="pharmacy-reg-policy-icon" />
              <p className="pharmacy-reg-policy-text">
                <strong>DRAP & Health Department Regulatory Policy:</strong> The administrator will inspect your official <strong>Drug Sale License</strong> against your <strong>CNIC</strong>. Please ensure the Proprietor Name and CNIC on both documents match your entered details.
              </p>
            </div>

            <div className="pharmacy-reg-grid-2 items-stretch">
              {/* DRAP License Document Upload */}
              <div className="pharmacy-upload-column">
                <div className="pharmacy-upload-header-row">
                  <span className="pharmacy-upload-title">
                    <Award size={15} className="text-[#3da860] shrink-0" />
                    <span>Pharmacy / DRAP License</span>
                    <span className="text-red-500 font-bold">*</span>
                  </span>
                  <span className="pharmacy-upload-badge">PDF, JPG, PNG (Max 10MB)</span>
                </div>

                <input
                  type="file"
                  ref={licenseInputRef}
                  accept=".pdf,image/jpeg,image/png,image/jpg"
                  className="pharmacy-file-input-hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0], 'license');
                    }
                  }}
                />

                <div 
                  onClick={() => !uploadingLicense && licenseInputRef.current?.click()}
                  className={`pharmacy-upload-dropzone ${formData.licenseDocumentUrl ? 'attached' : ''}`}
                >
                  {uploadingLicense ? (
                    <div className="flex flex-col items-center gap-2.5">
                      <div className="pharmacy-upload-spinner"></div>
                      <span className="pharmacy-upload-spinner-text">Uploading license document...</span>
                    </div>
                  ) : formData.licenseDocumentUrl ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="pharmacy-upload-attached-icon">
                        <Check size={24} />
                      </div>
                      <span className="pharmacy-upload-filename">
                        {licenseFileName || 'License Document Attached'}
                      </span>
                      <span className="pharmacy-upload-attached-pill">
                        ✓ Document Attached • Click to change
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="pharmacy-upload-idle-icon">
                        <UploadCloud size={24} />
                      </div>
                      <span className="pharmacy-upload-idle-title">Click to upload Pharmacy License</span>
                      <span className="pharmacy-upload-idle-desc">Form 9, DRAP Certificate, or Govt Sale License</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Owner CNIC Document Upload */}
              <div className="pharmacy-upload-column">
                <div className="pharmacy-upload-header-row">
                  <span className="pharmacy-upload-title">
                    <FileText size={15} className="text-[#007aff] shrink-0" />
                    <span>Proprietor CNIC Document</span>
                    <span className="text-red-500 font-bold">*</span>
                  </span>
                  <span className="pharmacy-upload-badge">PDF, JPG, PNG (Max 10MB)</span>
                </div>

                <input
                  type="file"
                  ref={cnicInputRef}
                  accept=".pdf,image/jpeg,image/png,image/jpg"
                  className="pharmacy-file-input-hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0], 'cnic');
                    }
                  }}
                />

                <div 
                  onClick={() => !uploadingCnic && cnicInputRef.current?.click()}
                  className={`pharmacy-upload-dropzone ${formData.cnicDocumentUrl ? 'attached' : ''}`}
                >
                  {uploadingCnic ? (
                    <div className="flex flex-col items-center gap-2.5">
                      <div className="pharmacy-upload-spinner"></div>
                      <span className="pharmacy-upload-spinner-text">Uploading CNIC document...</span>
                    </div>
                  ) : formData.cnicDocumentUrl ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="pharmacy-upload-attached-icon">
                        <Check size={24} />
                      </div>
                      <span className="pharmacy-upload-filename">
                        {cnicFileName || 'CNIC Document Attached'}
                      </span>
                      <span className="pharmacy-upload-attached-pill">
                        ✓ Document Attached • Click to change
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="pharmacy-upload-idle-icon">
                        <FileText size={24} />
                      </div>
                      <span className="pharmacy-upload-idle-title">Click to upload Owner's CNIC</span>
                      <span className="pharmacy-upload-idle-desc">Front & Back scan or combined PDF document</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Section 6: Business Details */}
          <section className="pharmacy-reg-card">
            <div className="pharmacy-reg-card-header">
              <Store size={20} className="pharmacy-reg-header-icon" />
              <h2 className="pharmacy-reg-section-title">Business Details</h2>
            </div>
            <div className="form-group">
              <label className="form-label">Business Hours</label>
              <input
                type="text"
                name="businessHours"
                required
                placeholder="e.g. Mon-Sat: 9:00 AM - 8:00 PM"
                value={formData.businessHours}
                onChange={handleChange}
                className="form-control pharmacy-reg-input"
              />
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Description</label>
              <textarea
                name="description"
                placeholder="Write a brief overview of your products, medicines available, etc..."
                value={formData.description}
                onChange={handleChange}
                className="form-control pharmacy-reg-textarea pharmacy-reg-textarea-md"
              />
            </div>
          </section>

          {/* Section 7: Security */}
          <section className="pharmacy-reg-card">
            <div className="pharmacy-reg-card-header">
              <Award size={20} className="pharmacy-reg-header-icon" />
              <h2 className="pharmacy-reg-section-title">Security</h2>
            </div>
            <div className="pharmacy-reg-grid-2">
              <div className="form-group mb-0">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength="6"
                  placeholder="Create password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-control pharmacy-reg-input"
                />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  placeholder="Repeat password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="form-control pharmacy-reg-input"
                />
              </div>
            </div>
          </section>

          <button 
            type="submit" 
            disabled={loading} 
            className="pharmacy-reg-submit-btn"
          >
            <Send size={18} />
            <span>{loading ? 'Submitting Request...' : 'Submit Registration'}</span>
          </button>
        </form>
      </main>
    </div>
  );
}
