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
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm gap-4">
        <div className="flex flex-col">
          <h2 className="text-lg font-bold text-slate-900 font-heading">Add Medicine / دوا شامل کریں</h2>
          <span className="text-xs text-[#3da860] font-semibold mt-0.5 urdu">نیا میڈیسن کارڈ بنائیں</span>
        </div>
        <div className="flex gap-2">
          <button 
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl font-semibold text-xs hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer" 
            onClick={onCancel} 
            disabled={loading}
          >
            <Ban size={14} />
            <span>Cancel / منسوخ کریں</span>
          </button>
          <button 
            className="inline-flex items-center gap-2 px-5 py-2 bg-[#3da860] text-white rounded-xl font-bold text-xs hover:bg-[#2e8c4e] transition-colors disabled:opacity-50 shadow-md shadow-[#3da860]/10 cursor-pointer" 
            onClick={handleSubmit} 
            disabled={loading}
          >
            <Check size={14} />
            <span>{loading ? 'Saving...' : 'Save Medicine / محفوظ کریں'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Form Block */}
        <div className="lg:col-span-2 flex flex-col">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            {/* Basic Info Card */}
            <div className="card p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <h3 className="text-sm font-bold text-[#135431] border-b border-slate-50 pb-3 mb-5 font-heading flex items-center justify-between">
                <span>Basic Information / بنیادی معلومات</span>
                <span className="text-[10px] text-red-500 font-normal">* Fields are required</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group mb-4">
                  <label className="form-label">Medicine Name (English) <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="form-control focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20 placeholder:text-slate-400"
                    placeholder="e.g., Tetracycline 500mg"
                    value={form.name}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group mb-4">
                  <label className="form-label">Medicine Name (Urdu)</label>
                  <input
                    type="text"
                    name="nameUrdu"
                    className="form-control urdu focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20 placeholder:text-slate-400"
                    placeholder="مثال: ٹیٹراسائیکلین"
                    value={form.nameUrdu}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group mb-4">
                  <label className="form-label">Category <span className="text-red-500">*</span></label>
                  <select
                    name="category"
                    required
                    className="form-control focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20"
                    value={form.category}
                    onChange={handleChange}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group mb-4">
                  <label className="form-label">Manufacturer <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="manufacturer"
                    required
                    className="form-control focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20 placeholder:text-slate-400"
                    placeholder="e.g., Novartis Pakistan"
                    value={form.manufacturer}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group mb-0">
                  <label className="form-label">Dosage Form <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="dosageForm"
                    required
                    className="form-control focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20 placeholder:text-slate-400"
                    placeholder="e.g., Tablet, Syrup, Injection"
                    value={form.dosageForm}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">Strength <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="strength"
                    required
                    className="form-control focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20 placeholder:text-slate-400"
                    placeholder="e.g., 500mg, 10ml"
                    value={form.strength}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Pricing & Stock Card */}
            <div className="card p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <h3 className="text-sm font-bold text-[#135431] border-b border-slate-50 pb-3 mb-5 font-heading">
                Pricing & Stock / قیمت اور اسٹاک
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="form-group mb-0">
                  <label className="form-label">Price (PKR) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    name="price"
                    required
                    min="1"
                    className="form-control focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20 placeholder:text-slate-400"
                    placeholder="850"
                    value={form.price}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">Current Stock <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    name="stock"
                    required
                    min="0"
                    className="form-control focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20 placeholder:text-slate-400"
                    placeholder="50"
                    value={form.stock}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">Minimum Stock Limit <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    name="minStock"
                    required
                    min="1"
                    className="form-control focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20 placeholder:text-slate-400"
                    placeholder="20"
                    value={form.minStock}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Product Details Card */}
            <div className="card p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <h3 className="text-sm font-bold text-[#135431] border-b border-slate-50 pb-3 mb-5 font-heading">
                Product Details / پروڈکٹ کی تفصیلات
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group mb-4">
                  <label className="form-label">Batch Number</label>
                  <input
                    type="text"
                    name="batchNumber"
                    className="form-control focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20 placeholder:text-slate-400"
                    placeholder="e.g., BAT-2024-001"
                    value={form.batchNumber}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group mb-4">
                  <label className="form-label">Expiry Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    name="expiryDate"
                    required
                    className="form-control focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20"
                    value={form.expiryDate}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group mb-4">
                <label className="form-label">Active Ingredients</label>
                <input
                  type="text"
                  name="activeIngredients"
                  className="form-control focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20 placeholder:text-slate-400"
                  placeholder="e.g., Tetracycline Hydrochloride"
                  value={form.activeIngredients}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group mb-4">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  className="form-control min-h-[90px] focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20 placeholder:text-slate-400"
                  placeholder="Brief description of the medicine and its uses..."
                  value={form.description}
                  onChange={handleChange}
                />
              </div>

              <div className="flex items-start gap-3 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <input
                  type="checkbox"
                  id="prescriptionRequired"
                  name="prescriptionRequired"
                  checked={form.prescriptionRequired}
                  onChange={handleChange}
                  className="mt-1 cursor-pointer w-4 h-4 text-[#3da860] border-slate-300 rounded focus:ring-[#3da860]/30"
                />
                <label htmlFor="prescriptionRequired" className="flex flex-col cursor-pointer">
                  <strong className="text-xs text-slate-800 font-bold">Prescription Required / نسخہ ضروری ہے</strong>
                  <span className="text-[11px] text-slate-400 mt-0.5">This medicine requires a valid veterinary prescription to purchase.</span>
                </label>
              </div>
            </div>

            {/* Product Image Card */}
            <div className="card p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <h3 className="text-sm font-bold text-[#135431] border-b border-slate-50 pb-3 mb-5 font-heading">
                Product Image / پروڈکٹ کی تصویر
              </h3>
              <div className="border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-8 text-center cursor-pointer hover:border-[#3da860] hover:bg-[#3da860]/5 transition-all">
                <input
                  type="file"
                  id="imageUploadInput"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <label htmlFor="imageUploadInput" className="flex flex-col items-center cursor-pointer">
                  <Upload size={32} className="text-slate-400 mb-3" />
                  <span className="text-xs font-bold text-slate-800 mb-1">Click to upload or drag and drop</span>
                  <span className="text-[10px] text-slate-400">PNG, JPG or JPEG (Max 5MB)</span>
                </label>
              </div>
            </div>

          </form>
        </div>

        {/* Right Sidebar Block */}
        <div className="lg:col-span-1 flex flex-col gap-6 sticky top-[104px]">
          
          {/* Live Preview Card */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col shadow-sm">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#3da860] uppercase tracking-wider mb-4 border-b border-slate-50 pb-2">
              <Pill size={16} />
              <span>Live Preview / ڈیمو پیش نظارہ</span>
            </div>
            
            <div className="aspect-video bg-slate-100 rounded-xl border border-slate-200 flex justify-center items-center overflow-hidden mb-4 relative">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#64748b" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span className="text-[10px] text-slate-400 font-semibold">Image placeholder</span>
                </div>
              )}
              {form.prescriptionRequired && (
                <span className="absolute top-2.5 right-2.5 bg-red-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">Rx Needed</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 leading-tight">{form.name || 'Medicine Name'}</h4>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">{form.manufacturer || 'Manufacturer'}</p>
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md self-start">{form.category}</span>
              </div>
              <div className="border-t border-slate-50 pt-2 flex items-center justify-between mt-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Price</span>
                <h3 className="text-base font-extrabold text-[#3da860]">
                  {form.price ? `PKR ${new Intl.NumberFormat('en-PK').format(form.price)}` : 'PKR ---'}
                </h3>
              </div>
            </div>
          </div>

          {/* Guide Card */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center mb-3">
              <HelpCircle size={16} className="text-[#3da860] mr-2" />
              <span className="text-xs font-bold text-slate-800">Guidelines / رہنمائی</span>
            </div>
            <ul className="pl-4 text-xs text-slate-500 flex flex-col gap-2.5 list-disc leading-relaxed">
              <li>Ensure English name matches the packaging exactly.</li>
              <li>Provide Urdu names when possible for local customers.</li>
              <li>Always check and verify the **expiry date** before listing.</li>
              <li>Define realistic minimum stock levels to trigger timely alerts.</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}

