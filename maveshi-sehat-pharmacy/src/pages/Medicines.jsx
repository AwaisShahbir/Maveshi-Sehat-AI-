import React, { useState, useEffect } from 'react';
import { Pill, Search, Plus, Edit, Trash2, X, AlertTriangle, CheckCircle, Eye } from 'lucide-react';

export default function Medicines({ pharmacy, showAddModal, onCloseAddModal, editMedicineId, onCloseEditModal }) {
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
      
      <div className="flex justify-between items-center gap-5">
        <div className="relative flex items-center flex-[1.2] max-w-[450px]">
          <Search size={18} className="absolute left-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search medicines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-11 pr-4 border border-slate-200 rounded-xl bg-white text-slate-900 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        
        <div className="flex bg-white p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setStockFilter('All')}
            className={`px-4 py-2 text-xs font-semibold border-none cursor-pointer rounded-lg transition-all ${
              stockFilter === 'All' 
                ? 'text-white bg-emerald-500' 
                : 'text-slate-600 bg-transparent hover:bg-slate-50'
            }`}
          >
            All Stock
          </button>
          <button
            onClick={() => setStockFilter('Low Stock')}
            className={`px-4 py-2 text-xs font-semibold border-none cursor-pointer rounded-lg transition-all ${
              stockFilter === 'Low Stock' 
                ? 'text-white bg-emerald-500' 
                : 'text-slate-600 bg-transparent hover:bg-slate-50'
            }`}
          >
            Low Stock
          </button>
          <button
            onClick={() => setStockFilter('Good Stock')}
            className={`px-4 py-2 text-xs font-semibold border-none cursor-pointer rounded-lg transition-all ${
              stockFilter === 'Good Stock' 
                ? 'text-white bg-emerald-500' 
                : 'text-slate-600 bg-transparent hover:bg-slate-50'
            }`}
          >
            Good Stock
          </button>
        </div>
      </div>

      
      {loading ? (
        <div className="text-center text-slate-500 py-10">Loading medicines list...</div>
      ) : filteredMedicines.length === 0 ? (
        <div className="text-center text-slate-500 py-16 text-sm bg-white border border-dashed border-slate-300 rounded-2xl">
          No medicines found matching the filters.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Medicine ID</th>
                <th>Name / نام</th>
                <th>Category</th>
                <th>Price (PKR)</th>
                <th>Stock</th>
                <th>Status</th>
                <th style={{ width: '150px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMedicines.map(med => {
                const minS = med.min_stock || 10;
                const isLow = med.stock < minS || med.status === 'out_of_stock' || med.status === 'low_stock';
                
                return (
                  <tr key={med.id}>
                    
                    <td className="font-bold text-slate-400">
                      {formatMedicineId(med.id)}
                    </td>
                    
                    
                    <td>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-sm text-slate-900">{med.name}</span>
                        {med.name_urdu && <span className="text-xs text-emerald-600 font-semibold urdu">{med.name_urdu}</span>}
                        {med.manufacturer && <span className="text-[11px] text-slate-400 font-medium">{med.manufacturer}</span>}
                      </div>
                    </td>
                    
                    
                    <td>
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">{med.category}</span>
                    </td>
                    
                    
                    <td className="font-bold text-slate-950">
                      {new Intl.NumberFormat('en-PK').format(med.price)}
                    </td>
                    
                    
                    <td>
                      <div className="flex flex-col gap-0.5">
                        {isLow ? (
                          <div className="flex items-center">
                            <AlertTriangle size={14} className="text-amber-500 mr-1" />
                            <span className="font-bold text-amber-500">{med.stock}</span>
                          </div>
                        ) : (
                          <span className="font-bold text-emerald-600">{med.stock}</span>
                        )}
                        <span className="text-[10px] text-slate-400 font-semibold">Min: {minS}</span>
                      </div>
                    </td>
                    
                    
                    <td>
                      <div className="flex items-center gap-2">
                        <label className="relative inline-block w-9 h-5 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={med.status !== 'inactive'}
                            onChange={() => handleToggleStatus(med)}
                            className="opacity-0 w-0 h-0"
                          />
                          <span className={`absolute inset-0 rounded-full transition-all flex items-center ${
                            med.status !== 'inactive' ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}>
                            <span className={`w-4 h-4 bg-white rounded-full transition-all block shadow-sm ${
                              med.status !== 'inactive' ? 'translate-x-[18px]' : 'translate-x-[2px]'
                            }`} />
                          </span>
                        </label>
                        <span className={`text-xs font-semibold ${
                          med.status !== 'inactive' ? 'text-emerald-600' : 'text-slate-400'
                        }`}>
                          {med.status !== 'inactive' ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    
                    
                    <td>
                      <div className="flex gap-2">
                        <button 
                          className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-all" 
                          onClick={() => handleOpenView(med)}
                        >
                          <Eye size={15} className="text-emerald-500" />
                        </button>
                        <button 
                          className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-all" 
                          onClick={() => handleOpenEdit(med)}
                        >
                          <Edit size={15} className="text-blue-500" />
                        </button>
                        <button 
                          className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-all" 
                          onClick={() => handleDelete(med.id)}
                        >
                          <Trash2 size={15} className="text-red-500" />
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

      
      {isViewOpen && viewingMed && (
        <div className="modal-overlay">
          <div className="modal-content max-w-[450px]">
            <button 
              className="absolute top-4 right-4 bg-transparent border-none text-slate-400 hover:text-slate-600 cursor-pointer" 
              onClick={handleCloseView}
            >
              <X size={18} />
            </button>
            <h3 className="modal-title text-emerald-600 flex items-center gap-2">
              <Pill size={20} />
              <span>Medicine Details</span>
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Medicine ID</span>
                <span className="text-sm font-semibold text-slate-900">{formatMedicineId(viewingMed.id)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Status</span>
                <span className={`text-xs font-semibold ${viewingMed.status !== 'inactive' ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {viewingMed.status !== 'inactive' ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex flex-col gap-1 col-span-2">
                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">English Name</span>
                <span className="text-base font-bold text-slate-900">{viewingMed.name}</span>
              </div>
              {viewingMed.name_urdu && (
                <div className="flex flex-col gap-1 col-span-2">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Urdu Name</span>
                  <span className="text-base font-bold text-emerald-600 urdu">{viewingMed.name_urdu}</span>
                </div>
              )}
              {viewingMed.manufacturer && (
                <div className="flex flex-col gap-1 col-span-2">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Manufacturer / Company</span>
                  <span className="text-sm font-semibold text-slate-900">{viewingMed.manufacturer}</span>
                </div>
              )}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Category</span>
                <span className="text-sm font-semibold text-slate-900">{viewingMed.category}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Price (PKR)</span>
                <span className="text-sm font-bold text-emerald-600">
                  {new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(viewingMed.price)}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Stock Level</span>
                <span className="text-sm font-semibold text-slate-900">{viewingMed.stock} units</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Min Stock Alert</span>
                <span className="text-sm font-semibold text-slate-900">{viewingMed.min_stock || 10} units</span>
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleCloseView}>Close</button>
            </div>
          </div>
        </div>
      )}

      
      {isAddOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button 
              className="absolute top-4 right-4 bg-transparent border-none text-slate-400 hover:text-slate-600 cursor-pointer" 
              onClick={handleCloseAdd}
            >
              <X size={18} />
            </button>
            <h3 className="modal-title">Add New Medicine</h3>
            <form onSubmit={handleAddSubmit}>
              <div className="form-group">
                <label className="form-label">Medicine Name (English)</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Tetracycline 500mg"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Medicine Name (Urdu / اختیاری)</label>
                <input
                  type="text"
                  className="form-control urdu"
                  placeholder="مثال: ٹیٹراسائیکلین"
                  value={form.nameUrdu}
                  onChange={(e) => setForm({ ...form, nameUrdu: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Company / Manufacturer</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Novartis Pakistan"
                  value={form.manufacturer}
                  onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-control"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Price (PKR)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="form-control"
                    placeholder="Price per unit"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock Units</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="form-control"
                    placeholder="Initial stock"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Minimum Stock Alert Level</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="form-control"
                  placeholder="Alert threshold"
                  value={form.minStock}
                  onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseAdd}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Listing</button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      {isEditOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button 
              className="absolute top-4 right-4 bg-transparent border-none text-slate-400 hover:text-slate-600 cursor-pointer" 
              onClick={handleCloseEdit}
            >
              <X size={18} />
            </button>
            <h3 className="modal-title">Edit Medicine Details</h3>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="form-label">Medicine Name (English)</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Medicine Name (Urdu)</label>
                <input
                  type="text"
                  className="form-control urdu"
                  value={form.nameUrdu}
                  onChange={(e) => setForm({ ...form, nameUrdu: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Company / Manufacturer</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={form.manufacturer}
                  onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-control"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Price (PKR)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="form-control"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock Units</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="form-control"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Minimum Stock Alert Level</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="form-control"
                  value={form.minStock}
                  onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseEdit}>Cancel</button>
                <button type="submit" className="btn btn-primary">Update Details</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
