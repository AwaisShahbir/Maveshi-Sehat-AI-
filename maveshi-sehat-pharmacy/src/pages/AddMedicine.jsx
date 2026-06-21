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
    <div className="flex flex-col gap-6">
      
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-slate-800">Add Medicine</h2>
          <span className="text-xs text-emerald-600 font-semibold mt-0.5 urdu">دوا شامل کریں</span>
        </div>
        <div className="flex gap-3">
          <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-transparent border border-red-500 text-red-500 rounded-lg font-semibold text-xs hover:bg-red-50 transition-colors disabled:opacity-50" onClick={onCancel} disabled={loading}>
            <Ban size={16} />
            <span>Cancel</span>
          </button>
          <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-lg font-semibold text-xs hover:bg-emerald-600 transition-colors disabled:opacity-50" onClick={handleSubmit} disabled={loading}>
            <Check size={16} />
            <span>{loading ? 'Saving...' : 'Save Medicine'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        <div className="lg:col-span-2 flex flex-col">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            
            
            <div className="card p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2.5 mb-4">Basic Information / بنیادی معلومات</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            
            <div className="card p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2.5 mb-4">Pricing & Stock / قیمت اور اسٹاک</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            
            <div className="card p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2.5 mb-4">Product Details / پروڈکٹ کی تفصیلات</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="form-control min-h-[80px]"
                  placeholder="Brief description of the medicine and its uses..."
                  value={form.description}
                  onChange={handleChange}
                />
              </div>

              <div className="flex items-start gap-3 mt-2">
                <input
                  type="checkbox"
                  id="prescriptionRequired"
                  name="prescriptionRequired"
                  checked={form.prescriptionRequired}
                  onChange={handleChange}
                  className="mt-1 cursor-pointer w-4 h-4 text-emerald-500 border-slate-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="prescriptionRequired" className="flex flex-col cursor-pointer">
                  <strong>Prescription Required</strong>
                  <span className="text-xs text-slate-400 mt-0.5">This medicine requires a veterinary prescription</span>
                </label>
              </div>
            </div>

            
            <div className="card p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2.5 mb-4">Product Images / پروڈکٹ کی تصاویر</h3>
              <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 p-10 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/20 transition-all">
                <input
                  type="file"
                  id="imageUploadInput"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <label htmlFor="imageUploadInput" className="flex flex-col items-center cursor-pointer">
                  <Upload size={36} className="text-slate-400 mb-3" />
                  <span className="text-sm font-semibold text-slate-800 mb-1">Click to upload or drag and drop</span>
                  <span className="text-xs text-slate-400">PNG, JPG or JPEG (Max 5MB per image)</span>
                </label>
              </div>
            </div>

          </form>
        </div>

        
        <div className="lg:col-span-1 flex flex-col gap-6 sticky top-[104px]">
          
          
          <div className="bg-emerald-500/[0.02] border border-emerald-500/20 rounded-2xl p-5 flex flex-col shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-4">
              <Pill size={16} className="text-emerald-500" />
              <span>Live Preview</span>
            </div>
            
            <div className="aspect-video bg-slate-100 rounded-xl border border-slate-200 flex justify-center items-center overflow-hidden mb-4">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2.5">
                  <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#334155" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span className="text-xs text-slate-400 font-semibold">Product image preview</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <h4 className="text-base font-bold text-slate-800">{form.name || 'Medicine Name'}</h4>
              <p className="text-xs text-slate-500">{form.manufacturer || 'Manufacturer'}</p>
              <h3 className="text-lg font-extrabold text-emerald-600 mt-1.5">
                PKR {form.price ? new Intl.NumberFormat('en-PK').format(form.price) : '---'}
              </h3>
            </div>
          </div>

          
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
            <div className="flex items-center mb-3">
              <HelpCircle size={16} className="text-blue-500 mr-2" />
              <span className="text-xs font-bold text-blue-500">Tips for Adding Medicine</span>
            </div>
            <ul className="list-disc pl-4 text-xs text-slate-500 flex flex-col gap-2">
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

