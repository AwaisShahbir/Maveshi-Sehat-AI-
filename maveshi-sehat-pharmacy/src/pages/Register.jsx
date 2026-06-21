import React, { useState } from 'react';
import { ShieldCheck, Info, MapPin, Award, Store, ArrowLeft, Send } from 'lucide-react';

export default function Register({ onViewChange }) {
  // Form State
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

    // Validations
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
      <div style={styles.overlayContainer}>
        <div style={styles.successCard}>
          <div style={styles.successIcon}>
            <ShieldCheck size={48} />
          </div>
          <h2 style={styles.successTitle}>Application Submitted!</h2>
          <p style={styles.successText}>
            Thank you for registering <strong>{formData.name}</strong>. Your application is now pending admin review.
          </p>
          <p style={styles.successTextUrdu} className="urdu">
            آپ کی فارمیسی کی رجسٹریشن درخواست موصول ہو گئی ہے۔ ایڈمن کی منظوری کے بعد آپ لاگ ان کر سکیں گے۔
          </p>
          <button style={styles.backToLoginBtn} onClick={() => onViewChange('login')}>
            Back to Login / لاگ ان پر واپس جائیں
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <button style={styles.backBtn} onClick={() => onViewChange('login')}>
          <ArrowLeft size={18} />
          <span>Back to Login</span>
        </button>
        <div style={styles.headerTitleBlock}>
          <h1 style={styles.title}>Register Pharmacy Portal</h1>
          <p style={styles.subtitle} className="urdu">فارمیسی رجسٹریشن فارم</p>
        </div>
      </header>

      {/* Form Container */}
      <main style={styles.formContainer}>
        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.errorAlert}>{error}</div>}

          {/* 1. Basic Information */}
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <Info size={20} style={styles.sectionIcon} />
              <h2 style={styles.sectionTitle}>Basic Information / بنیادی معلومات</h2>
            </div>
            <div style={styles.grid2}>
              <div className="form-group">
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
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Pharmacy Name (Urdu) <span className="label-ur">فارمیسی کا نام (اردو)</span>
                </label>
                <input
                  type="text"
                  name="nameUrdu"
                  placeholder="مثال: الشفاء میڈیکل اسٹور"
                  value={formData.nameUrdu}
                  onChange={handleChange}
                  className="form-control"
                  style={{ textAlign: 'right' }}
                />
              </div>
            </div>
            <div style={styles.grid2}>
              <div className="form-group">
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
                  className="form-control"
                />
              </div>
              <div className="form-group">
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
                  className="form-control"
                />
              </div>
            </div>
          </section>

          {/* 2. Contact Information */}
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <Store size={20} style={styles.sectionIcon} />
              <h2 style={styles.sectionTitle}>Contact Information / رابطہ کی معلومات</h2>
            </div>
            <div style={styles.grid3}>
              <div className="form-group">
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
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  WhatsApp Number <span className="label-ur">واٹس ایپ نمبر</span>
                </label>
                <input
                  type="tel"
                  name="whatsapp"
                  placeholder="e.g. +92 300 1234567"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
              <div className="form-group">
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
                  className="form-control"
                />
              </div>
            </div>
          </section>

          {/* 3. Location */}
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <MapPin size={20} style={styles.sectionIcon} />
              <h2 style={styles.sectionTitle}>Location / مقام</h2>
            </div>
            <div style={styles.grid2}>
              <div className="form-group">
                <label className="form-label">
                  Province <span className="label-ur">صوبہ</span>
                </label>
                <select
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  className="form-control"
                  style={styles.select}
                >
                  <option value="Punjab">Punjab</option>
                  <option value="Sindh">Sindh</option>
                  <option value="KPK">KPK</option>
                  <option value="Balochistan">Balochistan</option>
                  <option value="Gilgit Baltistan">Gilgit Baltistan</option>
                  <option value="AJK">AJK</option>
                </select>
              </div>
              <div className="form-group">
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
                  className="form-control"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">
                Full Address <span className="label-ur">مکمل پتہ</span>
              </label>
              <textarea
                name="address"
                required
                placeholder="Enter complete store location details..."
                value={formData.address}
                onChange={handleChange}
                className="form-control"
              />
            </div>
          </section>

          {/* 4. License Information */}
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <Award size={20} style={styles.sectionIcon} />
              <h2 style={styles.sectionTitle}>License Information / لائسنس کی معلومات</h2>
            </div>
            <div style={styles.grid2}>
              <div className="form-group">
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
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  License Expiry Date <span className="label-ur">لائسنس کی تاریخ ختم</span>
                </label>
                <input
                  type="date"
                  name="licenseExpiry"
                  required
                  value={formData.licenseExpiry}
                  onChange={handleChange}
                  className="form-control"
                  style={styles.dateInput}
                />
              </div>
            </div>
          </section>

          {/* 5. Business Details */}
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <Store size={20} style={styles.sectionIcon} />
              <h2 style={styles.sectionTitle}>Business Details / کاروباری تفصیلات</h2>
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
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                Description <span className="label-ur">تفصیل</span>
              </label>
              <textarea
                name="description"
                placeholder="Write a brief overview of your products, medicines available, etc..."
                value={formData.description}
                onChange={handleChange}
                className="form-control"
              />
            </div>
          </section>

          {/* 6. Security (Passwords) */}
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <Award size={20} style={styles.sectionIcon} />
              <h2 style={styles.sectionTitle}>Security / سیکیورٹی</h2>
            </div>
            <div style={styles.grid2}>
              <div className="form-group">
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
                  className="form-control"
                />
              </div>
              <div className="form-group">
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
                  className="form-control"
                />
              </div>
            </div>
          </section>

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            <Send size={18} />
            <span>{loading ? 'Submitting Request...' : 'Submit Registration / درخواست جمع کرائیں'}</span>
          </button>
        </form>
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '24px 32px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    gap: '24px',
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    color: '#0f172a',
    borderRadius: '10px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  headerTitleBlock: {
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    fontFamily: 'Outfit, sans-serif',
    fontSize: '22px',
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: '12px',
    color: '#10b981',
    marginTop: '2px',
  },
  formContainer: {
    flex: '1',
    maxWidth: '800px',
    width: '100%',
    margin: '0 auto',
    padding: '40px 24px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  errorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    padding: '14px 18px',
    borderRadius: '12px',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    fontWeight: '600',
    fontSize: '14px',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '28px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '12px',
  },
  sectionIcon: {
    color: '#10b981',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0f172a',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  grid3: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '20px',
  },
  select: {
    cursor: 'pointer',
  },
  dateInput: {
    color: '#0f172a',
  },
  submitBtn: {
    height: '52px',
    backgroundColor: '#10b981',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '700',
    border: 'none',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
    marginTop: '12px',
    transition: 'all 0.2s ease',
  },
  overlayContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    padding: '24px',
  },
  successCard: {
    width: '100%',
    maxWidth: '460px',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '24px',
    padding: '48px',
    textAlign: 'center',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)',
  },
  successIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    color: '#10b981',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px auto',
    border: '2px solid #10b981',
  },
  successTitle: {
    fontFamily: 'Outfit, sans-serif',
    fontSize: '26px',
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: '16px',
  },
  successText: {
    fontSize: '15px',
    color: '#475569',
    lineHeight: '1.6',
  },
  successTextUrdu: {
    fontSize: '13px',
    color: '#10b981',
    marginTop: '12px',
    lineHeight: '1.8',
  },
  backToLoginBtn: {
    width: '100%',
    height: '46px',
    backgroundColor: '#10b981',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '32px',
    transition: 'background-color 0.2s ease',
  },
};
