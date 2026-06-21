import React, { useState } from 'react';
import { Pill, Upload, X, Check, HelpCircle, Save, Ban } from 'lucide-react';

export default function AddMedicine({ pharmacy, onSaveSuccess, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    nameUrdu: '',
    manufacturer: '',
    category: 'Antibiotic',
    dosageForm: '',
    strength: '',
    price: '',
    stock: '',
    minStock: '',
    batchNumber: '',
    expiryDate: '',
    activeIngredients: '',
    description: '',
    prescriptionRequired: false,
    imageUrl: ''
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const categories = ['Vaccine', 'Antibiotic', 'Vitamin', 'Antiparasitic', 'Supplements', 'Other'];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      
      const formData = new FormData();
      formData.append('license', file);
      
      try {
        const res = await fetch('http://localhost:5000/upload', {
          method: 'POST',
          body: formData
        });
        if (res.ok) {
          const data = await res.json();
          setForm(prev => ({
            ...prev,
            imageUrl: data.fileUrl
          }));
        } else {
          console.error('Failed to upload image');
        }
      } catch (err) {
        console.error('Error uploading image:', err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.manufacturer || !form.category || !form.dosageForm || !form.strength || !form.price || !form.stock || !form.minStock || !form.expiryDate) {
      alert('Please fill in all required fields marked with *');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/pharmacy/medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          pharmacyId: pharmacy.id
        })
      });
      if (res.ok) {
        alert('Medicine listing added successfully!');
        onSaveSuccess();
      } else {
        const errorData = await res.json();
        alert(`Failed to save medicine: ${errorData.error || 'Server error'}`);
      }
    } catch (err) {
      console.error('Error saving medicine:', err);
      alert('Failed to save medicine. Check backend server connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header bar matching Screenshot 1 (Cancel + Save buttons) */}
      <div style={styles.headerRow}>
        <div style={styles.headerTitleContainer}>
          <h2 style={styles.headerTitle}>Add Medicine</h2>
          <span style={styles.headerSubtitle} className="urdu">دوا شامل کریں</span>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.cancelBtn} onClick={onCancel} disabled={loading}>
            <Ban size={16} />
            <span>Cancel</span>
          </button>
          <button style={styles.saveBtn} onClick={handleSubmit} disabled={loading}>
            <Check size={16} />
            <span>{loading ? 'Saving...' : 'Save Medicine'}</span>
          </button>
        </div>
      </div>

      <div style={styles.layoutGrid}>
        {/* Left Side: Complex Form */}
        <div style={styles.formContainer}>
          <form onSubmit={handleSubmit} style={styles.form}>
            
            {/* Section 1: Basic Information */}
            <div className="card" style={styles.formCard}>
              <h3 style={styles.cardSectionTitle}>Basic Information / بنیادی معلومات</h3>
              <div style={styles.grid2}>
                <div className="form-group">
                  <label className="form-label">Medicine Name (English) *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="form-control"
                    placeholder="e.g., Tetracycline 500mg"
                    value={form.name}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Medicine Name (Urdu)</label>
                  <input
                    type="text"
                    name="nameUrdu"
                    className="form-control urdu"
                    placeholder="مثال: ٹیٹراسائیکلین"
                    value={form.nameUrdu}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div style={styles.grid2}>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    name="category"
                    required
                    className="form-control"
                    value={form.category}
                    onChange={handleChange}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Manufacturer *</label>
                  <input
                    type="text"
                    name="manufacturer"
                    required
                    className="form-control"
                    placeholder="e.g., Novartis Pakistan"
                    value={form.manufacturer}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div style={styles.grid2}>
                <div className="form-group">
                  <label className="form-label">Dosage Form *</label>
                  <input
                    type="text"
                    name="dosageForm"
                    required
                    className="form-control"
                    placeholder="e.g., Tablet, Syrup, Injection"
                    value={form.dosageForm}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Strength *</label>
                  <input
                    type="text"
                    name="strength"
                    required
                    className="form-control"
                    placeholder="e.g., 500mg, 10ml"
                    value={form.strength}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Pricing & Stock */}
            <div className="card" style={styles.formCard}>
              <h3 style={styles.cardSectionTitle}>Pricing & Stock / قیمت اور اسٹاک</h3>
              <div style={styles.grid3}>
                <div className="form-group">
                  <label className="form-label">Price (PKR) *</label>
                  <input
                    type="number"
                    name="price"
                    required
                    min="1"
                    className="form-control"
                    placeholder="850"
                    value={form.price}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Current Stock *</label>
                  <input
                    type="number"
                    name="stock"
                    required
                    min="0"
                    className="form-control"
                    placeholder="50"
                    value={form.stock}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Minimum Stock *</label>
                  <input
                    type="number"
                    name="minStock"
                    required
                    min="1"
                    className="form-control"
                    placeholder="20"
                    value={form.minStock}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Product Details */}
            <div className="card" style={styles.formCard}>
              <h3 style={styles.cardSectionTitle}>Product Details / پروڈکٹ کی تفصیلات</h3>
              <div style={styles.grid2}>
                <div className="form-group">
                  <label className="form-label">Batch Number</label>
                  <input
                    type="text"
                    name="batchNumber"
                    className="form-control"
                    placeholder="e.g., BAT-2024-001"
                    value={form.batchNumber}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Expiry Date *</label>
                  <input
                    type="date"
                    name="expiryDate"
                    required
                    className="form-control"
                    value={form.expiryDate}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Active Ingredients</label>
                <input
                  type="text"
                  name="activeIngredients"
                  className="form-control"
                  placeholder="e.g., Tetracycline Hydrochloride"
                  value={form.activeIngredients}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  className="form-control"
                  placeholder="Brief description of the medicine and its uses..."
                  value={form.description}
                  onChange={handleChange}
                  style={{ minHeight: '80px' }}
                />
              </div>

              <div style={styles.checkboxWrapper}>
                <input
                  type="checkbox"
                  id="prescriptionRequired"
                  name="prescriptionRequired"
                  checked={form.prescriptionRequired}
                  onChange={handleChange}
                  style={styles.checkbox}
                />
                <label htmlFor="prescriptionRequired" style={styles.checkboxLabel}>
                  <strong>Prescription Required</strong>
                  <span style={styles.checkboxSub}>This medicine requires a veterinary prescription</span>
                </label>
              </div>
            </div>

            {/* Section 4: Product Images */}
            <div className="card" style={styles.formCard}>
              <h3 style={styles.cardSectionTitle}>Product Images / پروڈکٹ کی تصاویر</h3>
              <div style={styles.uploadArea}>
                <input
                  type="file"
                  id="imageUploadInput"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="imageUploadInput" style={styles.uploadLabel}>
                  <Upload size={36} style={{ color: '#64748b', marginBottom: '12px' }} />
                  <span style={styles.uploadTextBold}>Click to upload or drag and drop</span>
                  <span style={styles.uploadTextSub}>PNG, JPG or JPEG (Max 5MB per image)</span>
                </label>
              </div>
            </div>

          </form>
        </div>

        {/* Right Side: Preview & Info */}
        <div style={styles.sidebar}>
          
          {/* Live Preview Card */}
          <div style={styles.previewCard}>
            <div style={styles.previewHeader}>
              <Pill size={16} style={{ color: '#10b981' }} />
              <span style={styles.previewHeaderTitle}>Live Preview</span>
            </div>
            
            <div style={styles.previewImgBox}>
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" style={styles.previewImg} />
              ) : (
                <div style={styles.previewPlaceholder}>
                  <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#334155" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span style={styles.previewPlaceholderText}>Product image preview</span>
                </div>
              )}
            </div>

            <div style={styles.previewBody}>
              <h4 style={styles.previewMedName}>{form.name || 'Medicine Name'}</h4>
              <p style={styles.previewManufacturer}>{form.manufacturer || 'Manufacturer'}</p>
              <h3 style={styles.previewPrice}>
                PKR {form.price ? new Intl.NumberFormat('en-PK').format(form.price) : '---'}
              </h3>
            </div>
          </div>

          {/* Tips Card */}
          <div style={styles.tipsCard}>
            <div style={styles.tipsHeader}>
              <HelpCircle size={16} style={{ color: '#3b82f6', marginRight: '8px' }} />
              <span style={styles.tipsTitle}>Tips for Adding Medicine</span>
            </div>
            <ul style={styles.tipsList}>
              <li>Fill all required fields marked with *</li>
              <li>Use clear product images</li>
              <li>Set accurate stock levels</li>
              <li>Double-check expiry dates</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '16px'
  },
  headerTitleContainer: {
    display: 'flex',
    flexDirection: 'column'
  },
  headerTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Outfit, sans-serif'
  },
  headerSubtitle: {
    fontSize: '13px',
    color: '#10b981',
    marginTop: '2px'
  },
  headerActions: {
    display: 'flex',
    gap: '12px'
  },
  cancelBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: 'transparent',
    border: '1px solid #ef4444',
    color: '#ef4444',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  saveBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: '#10b981',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease'
  },
  layoutGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '24px',
    alignItems: 'start'
  },
  formContainer: {
    display: 'flex',
    flexDirection: 'column'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  formCard: {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius-lg)',
    padding: '24px'
  },
  cardSectionTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#0f172a',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '10px',
    marginBottom: '16px'
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
  },
  grid3: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '16px'
  },
  checkboxWrapper: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    marginTop: '8px'
  },
  checkbox: {
    marginTop: '4px',
    cursor: 'pointer',
    width: '16px',
    height: '16px'
  },
  checkboxLabel: {
    display: 'flex',
    flexDirection: 'column',
    cursor: 'pointer'
  },
  checkboxSub: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '2px'
  },
  uploadArea: {
    border: '2px dashed #cbd5e1',
    borderRadius: '12px',
    backgroundColor: '#f8fafc',
    padding: '40px 20px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'border-color 0.2s ease'
  },
  uploadLabel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer'
  },
  uploadTextBold: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: '4px'
  },
  uploadTextSub: {
    fontSize: '12px',
    color: '#64748b'
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    position: 'sticky',
    top: '104px'
  },
  previewCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.03)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'var(--shadow-md)'
  },
  previewHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#10b981',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '16px'
  },
  previewImgBox: {
    aspectRatio: '4/3',
    backgroundColor: '#f1f5f9',
    borderRadius: '12px',
    border: '1.5px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: '16px'
  },
  previewImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  previewPlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px'
  },
  previewPlaceholderText: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: '600'
  },
  previewBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  previewMedName: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0f172a'
  },
  previewManufacturer: {
    fontSize: '12px',
    color: '#475569'
  },
  previewPrice: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#10b981',
    marginTop: '6px',
    fontFamily: 'Outfit, sans-serif'
  },
  tipsCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '18px',
    boxShadow: 'var(--shadow-sm)'
  },
  tipsHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '12px'
  },
  tipsTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#3b82f6'
  },
  tipsList: {
    paddingLeft: '18px',
    fontSize: '12px',
    color: '#475569',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  }
};
