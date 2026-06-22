import React, { useState, useEffect } from 'react';
import { Pill, Search, Plus, Edit, Trash2, X, AlertTriangle, CheckCircle, Eye } from 'lucide-react';

export default function Medicines({ pharmacy, showAddModal, onCloseAddModal, editMedicineId, onCloseEditModal, formatPrice }) {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('All'); 

  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewingMed, setViewingMed] = useState(null);
  const [editingMed, setEditingMed] = useState(null);

  
  const [form, setForm] = useState({
    name: '',
    nameUrdu: '',
    manufacturer: '',
    category: 'Antibiotic',
    price: '',
    stock: '',
    minStock: '15'
  });

  const categories = ['Vaccine', 'Antibiotic', 'Vitamin', 'Antiparasitic', 'Supplements', 'Other'];

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/pharmacy/medicines?pharmacyId=${pharmacy.id}`);
      const data = await res.json();
      if (res.ok) {
        setMedicines(data);
      }
    } catch (err) {
      console.error('Failed to fetch medicines:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, [pharmacy.id]);

  useEffect(() => {
    if (showAddModal) {
      handleOpenAdd();
    }
  }, [showAddModal]);

  useEffect(() => {
    if (editMedicineId && medicines.length > 0) {
      const med = medicines.find(m => m.id === editMedicineId);
      if (med) {
        handleOpenEdit(med);
      }
    }
  }, [editMedicineId, medicines]);

  const handleOpenAdd = () => {
    setForm({ 
      name: '', 
      nameUrdu: '', 
      manufacturer: '', 
      category: 'Antibiotic', 
      price: '', 
      stock: '', 
      minStock: '15' 
    });
    setIsAddOpen(true);
  };

  const handleCloseAdd = () => {
    setIsAddOpen(false);
    onCloseAddModal();
  };

  const handleOpenEdit = (med) => {
    setEditingMed(med);
    setForm({
      name: med.name,
      nameUrdu: med.name_urdu || '',
      manufacturer: med.manufacturer || '',
      category: med.category,
      price: String(Math.round(med.price)),
      stock: String(med.stock),
      minStock: String(med.min_stock || 10)
    });
    setIsEditOpen(true);
  };

  const handleCloseEdit = () => {
    setIsEditOpen(false);
    setEditingMed(null);
    if (onCloseEditModal) {
      onCloseEditModal();
    }
  };

  const handleOpenView = (med) => {
    setViewingMed(med);
    setIsViewOpen(true);
  };

  const handleCloseView = () => {
    setIsViewOpen(false);
    setViewingMed(null);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/pharmacy/medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          pharmacyId: pharmacy.id
        })
      });
      if (res.ok) {
        fetchMedicines();
        handleCloseAdd();
      }
    } catch (err) {
      console.error('Error adding medicine:', err);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:5000/api/pharmacy/medicines/${editingMed.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        fetchMedicines();
        handleCloseEdit();
      }
    } catch (err) {
      console.error('Error editing medicine:', err);
    }
  };

  const handleToggleStatus = async (med) => {
    const nextStatus = med.status === 'inactive' ? 'active' : 'inactive';
    try {
      const res = await fetch(`http://localhost:5000/api/pharmacy/medicines/${med.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        fetchMedicines();
      }
    } catch (err) {
      console.error('Error toggling medicine status:', err);
    }
  };

  const handleDelete = async (medId) => {
    if (!window.confirm('Are you sure you want to delete this medicine listing?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/pharmacy/medicines/${medId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchMedicines();
      }
    } catch (err) {
      console.error('Error deleting medicine:', err);
    }
  };

  const formatMedicineId = (id) => {
    return `MED-${String(id).padStart(3, '0')}`;
  };

  const filteredMedicines = medicines.filter(med => {
    const matchesSearch = 
      med.name.toLowerCase().includes(search.toLowerCase()) ||
      (med.name_urdu && med.name_urdu.toLowerCase().includes(search.toLowerCase())) ||
      (med.manufacturer && med.manufacturer.toLowerCase().includes(search.toLowerCase())) ||
      med.category.toLowerCase().includes(search.toLowerCase());

    const minS = med.min_stock || 10;
    let matchesStock = true;
    if (stockFilter === 'Low Stock') {
      matchesStock = med.stock < minS || med.status === 'out_of_stock' || med.status === 'low_stock';
    } else if (stockFilter === 'Good Stock') {
      matchesStock = med.stock >= minS && med.status !== 'inactive';
    }

    return matchesSearch && matchesStock;
  });

  return (
    <div className="flex flex-col gap-6">
      
      {/* Top Filter & Search Section */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm gap-4">
        <div className="relative flex items-center flex-1 max-w-[450px]">
          <Search size={18} className="absolute left-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search medicines... / ادویات تلاش کریں..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-11 pr-4 border border-slate-200 rounded-xl bg-white text-slate-900 text-sm focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setStockFilter('All')}
            className={`px-4 py-2 text-xs font-semibold border-none cursor-pointer rounded-lg transition-all ${
              stockFilter === 'All' 
                ? 'text-white bg-[#3da860] shadow-sm' 
                : 'text-slate-600 bg-transparent hover:bg-slate-100'
            }`}
          >
            All Stock / کل اسٹاک
          </button>
          <button
            onClick={() => setStockFilter('Low Stock')}
            className={`px-4 py-2 text-xs font-semibold border-none cursor-pointer rounded-lg transition-all ${
              stockFilter === 'Low Stock' 
                ? 'text-white bg-red-500 shadow-sm' 
                : 'text-slate-600 bg-transparent hover:bg-slate-100'
            }`}
          >
            Low Stock / کم اسٹاک
          </button>
          <button
            onClick={() => setStockFilter('Good Stock')}
            className={`px-4 py-2 text-xs font-semibold border-none cursor-pointer rounded-lg transition-all ${
              stockFilter === 'Good Stock' 
                ? 'text-white bg-[#3da860] shadow-sm' 
                : 'text-slate-600 bg-transparent hover:bg-slate-100'
            }`}
          >
            Good Stock / وافر اسٹاک
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center text-slate-500 py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-[#3da860] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-slate-500">Loading medicines list... / لوڈ ہو رہا ہے...</p>
          </div>
        ) : filteredMedicines.length === 0 ? (
          <div className="text-center text-slate-500 py-16 px-4 text-sm flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
              <Pill size={24} />
            </div>
            <div>
              <p className="font-semibold text-slate-700">No medicines found matching the filters.</p>
              <p className="text-xs text-slate-400 mt-1">کوئی دوا نہیں ملی۔</p>
            </div>
          </div>
        ) : (
          <div className="table-responsive !border-none !rounded-none">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: '130px' }} className="font-bold text-slate-500 uppercase tracking-wider text-xs">Medicine ID</th>
                  <th className="font-bold text-slate-500 uppercase tracking-wider text-xs">Name / نام</th>
                  <th className="font-bold text-slate-500 uppercase tracking-wider text-xs">Category</th>
                  <th className="font-bold text-slate-500 uppercase tracking-wider text-xs">Price (PKR)</th>
                  <th className="font-bold text-slate-500 uppercase tracking-wider text-xs">Stock</th>
                  <th className="font-bold text-slate-500 uppercase tracking-wider text-xs">Status</th>
                  <th style={{ width: '150px' }} className="font-bold text-slate-500 uppercase tracking-wider text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMedicines.map(med => {
                  const minS = med.min_stock || 10;
                  const isLow = med.stock < minS || med.status === 'out_of_stock' || med.status === 'low_stock';
                  
                  return (
                    <tr key={med.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="font-bold text-xs text-slate-400 font-mono">
                        {formatMedicineId(med.id)}
                      </td>
                      <td>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-sm text-slate-900">{med.name}</span>
                          {med.name_urdu && <span className="text-xs text-[#3da860] font-semibold urdu">{med.name_urdu}</span>}
                          {med.manufacturer && <span className="text-[11px] text-slate-400 font-medium">{med.manufacturer}</span>}
                        </div>
                      </td>
                      <td>
                        <span className="text-xs font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">{med.category}</span>
                      </td>
                      <td className="font-bold text-slate-900 text-sm">
                        {formatPrice ? formatPrice(med.price) : `${new Intl.NumberFormat('en-PK').format(med.price)} PKR`}
                      </td>
                      <td>
                        <div className="flex flex-col gap-0.5">
                          {isLow ? (
                            <div className="flex items-center text-red-600">
                              <AlertTriangle size={14} className="mr-1" />
                              <span className="font-bold">{med.stock}</span>
                            </div>
                          ) : (
                            <span className="font-bold text-[#3da860]">{med.stock}</span>
                          )}
                          <span className="text-[10px] text-slate-400 font-medium">Min threshold: {minS}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <label className="relative inline-block w-9 h-5 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={med.status !== 'inactive'}
                              onChange={() => handleToggleStatus(med)}
                              className="opacity-0 w-0 h-0 peer"
                            />
                            <span className="absolute inset-0 rounded-full transition-all flex items-center bg-slate-200 peer-checked:bg-[#3da860]">
                              <span className="w-4 h-4 bg-white rounded-full transition-all block shadow-sm translate-x-[2px] peer-checked:translate-x-[18px]" />
                            </span>
                          </label>
                          <span className={`text-xs font-bold transition-colors ${
                            med.status !== 'inactive' ? 'text-[#3da860]' : 'text-slate-400'
                          }`}>
                            {med.status !== 'inactive' ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="flex justify-end gap-1.5">
                          <button 
                            className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center cursor-pointer hover:border-[#3da860] hover:bg-[#3da860]/5 text-slate-500 hover:text-[#3da860] transition-all" 
                            onClick={() => handleOpenView(med)}
                            title="View Details"
                          >
                            <Eye size={15} />
                          </button>
                          <button 
                            className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-500/5 text-slate-500 hover:text-blue-500 transition-all" 
                            onClick={() => handleOpenEdit(med)}
                            title="Edit"
                          >
                            <Edit size={15} />
                          </button>
                          <button 
                            className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center cursor-pointer hover:border-red-500 hover:bg-red-500/5 text-slate-500 hover:text-red-500 transition-all" 
                            onClick={() => handleDelete(med.id)}
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Modal */}
      {isViewOpen && viewingMed && (
        <div className="modal-overlay">
          <div className="modal-content max-w-[480px] p-7 rounded-2xl border-none">
            <button 
              className="absolute top-5 right-5 bg-slate-100 hover:bg-slate-200 border-none rounded-full w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-700 cursor-pointer transition-all" 
              onClick={handleCloseView}
            >
              <X size={16} />
            </button>
            <h3 className="modal-title text-[#3da860] flex items-center gap-2 mb-6 font-bold">
              <Pill size={22} />
              <span>Medicine Details / دوا کی تفصیلات</span>
            </h3>
            
            <div className="grid grid-cols-2 gap-5">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Medicine ID</span>
                <span className="text-sm font-semibold text-slate-900 font-mono">{formatMedicineId(viewingMed.id)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Status</span>
                <span className={`text-xs font-extrabold ${viewingMed.status !== 'inactive' ? 'text-[#3da860]' : 'text-slate-400'}`}>
                  {viewingMed.status !== 'inactive' ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex flex-col gap-1 col-span-2 border-t border-slate-50 pt-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">English Name</span>
                <span className="text-base font-bold text-slate-900">{viewingMed.name}</span>
              </div>
              {viewingMed.name_urdu && (
                <div className="flex flex-col gap-1 col-span-2 border-t border-slate-50 pt-3">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Urdu Name</span>
                  <span className="text-base font-bold text-[#3da860] urdu">{viewingMed.name_urdu}</span>
                </div>
              )}
              {viewingMed.manufacturer && (
                <div className="flex flex-col gap-1 col-span-2 border-t border-slate-50 pt-3">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Manufacturer / Company</span>
                  <span className="text-sm font-semibold text-slate-900">{viewingMed.manufacturer}</span>
                </div>
              )}
              <div className="flex flex-col gap-1 border-t border-slate-50 pt-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Category</span>
                <span className="text-sm font-semibold text-slate-900">{viewingMed.category}</span>
              </div>
              <div className="flex flex-col gap-1 border-t border-slate-50 pt-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Price (PKR)</span>
                <span className="text-sm font-bold text-[#3da860]">
                  {formatPrice ? formatPrice(viewingMed.price) : `${new Intl.NumberFormat('en-PK').format(viewingMed.price)} PKR`}
                </span>
              </div>
              <div className="flex flex-col gap-1 border-t border-slate-50 pt-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Stock Level</span>
                <span className="text-sm font-semibold text-slate-900">{viewingMed.stock} units</span>
              </div>
              <div className="flex flex-col gap-1 border-t border-slate-50 pt-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Min Stock Alert</span>
                <span className="text-sm font-semibold text-slate-900">{viewingMed.min_stock || 10} units</span>
              </div>
            </div>
            
            <div className="modal-actions border-t border-slate-100 pt-4 mt-6">
              <button className="btn btn-primary w-full bg-[#3da860] hover:bg-[#2e8c4e]" onClick={handleCloseView}>Close / بند کریں</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {isAddOpen && (
        <div className="modal-overlay">
          <div className="modal-content max-w-[500px] p-7 rounded-2xl border-none">
            <button 
              className="absolute top-5 right-5 bg-slate-100 hover:bg-slate-200 border-none rounded-full w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-700 cursor-pointer transition-all" 
              onClick={handleCloseAdd}
            >
              <X size={16} />
            </button>
            <h3 className="modal-title text-slate-900 font-bold mb-5">Add New Medicine / نئی دوا شامل کریں</h3>
            <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
              <div className="form-group mb-0">
                <label className="form-label">Medicine Name (English) <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  className="form-control focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20"
                  placeholder="e.g. Tetracycline 500mg"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="form-group mb-0">
                <label className="form-label">Medicine Name (Urdu / اختیاری)</label>
                <input
                  type="text"
                  className="form-control urdu focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20"
                  placeholder="مثال: ٹیٹراسائیکلین"
                  value={form.nameUrdu}
                  onChange={(e) => setForm({ ...form, nameUrdu: e.target.value })}
                />
              </div>

              <div className="form-group mb-0">
                <label className="form-label">Company / Manufacturer <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  className="form-control focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20"
                  placeholder="e.g. Novartis Pakistan"
                  value={form.manufacturer}
                  onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                />
              </div>

              <div className="form-group mb-0">
                <label className="form-label">Category <span className="text-red-500">*</span></label>
                <select
                  className="form-control focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group mb-0">
                  <label className="form-label">Price (PKR) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="form-control focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20"
                    placeholder="Price per unit"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">Stock Units <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="form-control focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20"
                    placeholder="Initial stock"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group mb-0">
                <label className="form-label">Minimum Stock Alert Level <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  required
                  min="1"
                  className="form-control focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20"
                  placeholder="Alert threshold"
                  value={form.minStock}
                  onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                />
              </div>

              <div className="modal-actions border-t border-slate-100 pt-4 mt-2">
                <button type="button" className="btn btn-secondary" onClick={handleCloseAdd}>Cancel / منسوخ کریں</button>
                <button type="submit" className="btn btn-primary bg-[#3da860] hover:bg-[#2e8c4e]">Save Listing / محفوظ کریں</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && (
        <div className="modal-overlay">
          <div className="modal-content max-w-[500px] p-7 rounded-2xl border-none">
            <button 
              className="absolute top-5 right-5 bg-slate-100 hover:bg-slate-200 border-none rounded-full w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-700 cursor-pointer transition-all" 
              onClick={handleCloseEdit}
            >
              <X size={16} />
            </button>
            <h3 className="modal-title text-slate-900 font-bold mb-5">Edit Medicine Details / ترمیم کریں</h3>
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              <div className="form-group mb-0">
                <label className="form-label">Medicine Name (English) <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  className="form-control focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="form-group mb-0">
                <label className="form-label">Medicine Name (Urdu)</label>
                <input
                  type="text"
                  className="form-control urdu focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20"
                  value={form.nameUrdu}
                  onChange={(e) => setForm({ ...form, nameUrdu: e.target.value })}
                />
              </div>

              <div className="form-group mb-0">
                <label className="form-label">Company / Manufacturer <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  className="form-control focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20"
                  value={form.manufacturer}
                  onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                />
              </div>

              <div className="form-group mb-0">
                <label className="form-label">Category <span className="text-red-500">*</span></label>
                <select
                  className="form-control focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group mb-0">
                  <label className="form-label">Price (PKR) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="form-control focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">Stock Units <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="form-control focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group mb-0">
                <label className="form-label">Minimum Stock Alert Level <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  required
                  min="1"
                  className="form-control focus:border-[#3da860] focus:ring-2 focus:ring-[#3da860]/20"
                  value={form.minStock}
                  onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                />
              </div>

              <div className="modal-actions border-t border-slate-100 pt-4 mt-2">
                <button type="button" className="btn btn-secondary" onClick={handleCloseEdit}>Cancel / منسوخ کریں</button>
                <button type="submit" className="btn btn-primary bg-[#3da860] hover:bg-[#2e8c4e]">Update Details / محفوظ کریں</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
