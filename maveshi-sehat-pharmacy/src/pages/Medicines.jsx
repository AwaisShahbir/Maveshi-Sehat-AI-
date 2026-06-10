import React, { useState, useEffect } from 'react';
import { Pill, Search, Plus, Edit, Trash2, X, AlertTriangle, CheckCircle, Eye } from 'lucide-react';

export default function Medicines({ pharmacy, showAddModal, onCloseAddModal, editMedicineId, onCloseEditModal }) {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('All'); // 'All', 'Low Stock', 'Good Stock'

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewingMed, setViewingMed] = useState(null);
  const [editingMed, setEditingMed] = useState(null);

  // Form states
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
    <div style={styles.container}>
      {/* Top Header Actions bar (matching Screenshot 2 search + filter tabs + green button) */}
      <div style={styles.actionBar}>
        <div style={styles.searchWrapper}>
          <Search size={18} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search medicines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        {/* Filter Pills */}
        <div style={styles.filterGroup}>
          <button
            onClick={() => setStockFilter('All')}
            style={stockFilter === 'All' ? styles.filterBtnActive : styles.filterBtn}
          >
            All Stock
          </button>
          <button
            onClick={() => setStockFilter('Low Stock')}
            style={stockFilter === 'Low Stock' ? styles.filterBtnActive : styles.filterBtn}
          >
            Low Stock
          </button>
          <button
            onClick={() => setStockFilter('Good Stock')}
            style={stockFilter === 'Good Stock' ? styles.filterBtnActive : styles.filterBtn}
          >
            Good Stock
          </button>
        </div>
      </div>

      {/* Table Listings */}
      {loading ? (
        <div style={styles.loading}>Loading medicines list...</div>
      ) : filteredMedicines.length === 0 ? (
        <div style={styles.empty}>No medicines found matching the filters.</div>
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
                    {/* ID Column */}
                    <td style={{ fontWeight: '700', color: '#94a3b8' }}>
                      {formatMedicineId(med.id)}
                    </td>
                    
                    {/* Name Column (Bilingual + Manufacturer) */}
                    <td>
                      <div style={styles.nameBlock}>
                        <span style={styles.medNameText}>{med.name}</span>
                        {med.name_urdu && <span style={styles.medNameUrdu}>{med.name_urdu}</span>}
                        {med.manufacturer && <span style={styles.medManufacturer}>{med.manufacturer}</span>}
                      </div>
                    </td>
                    
                    {/* Category Column */}
                    <td>
                      <span style={styles.catLabel}>{med.category}</span>
                    </td>
                    
                    {/* Price Column */}
                    <td style={{ fontWeight: '700', color: '#ffffff' }}>
                      {new Intl.NumberFormat('en-PK').format(med.price)}
                    </td>
                    
                    {/* Stock Column (Low stock alerts) */}
                    <td>
                      <div style={styles.stockBlock}>
                        {isLow ? (
                          <div style={styles.stockAlertRow}>
                            <AlertTriangle size={14} style={{ color: '#f59e0b', marginRight: '4px' }} />
                            <span style={styles.stockCountLow}>{med.stock}</span>
                          </div>
                        ) : (
                          <span style={styles.stockCountGood}>{med.stock}</span>
                        )}
                        <span style={styles.minStockText}>Min: {minS}</span>
                      </div>
                    </td>
                    
                    {/* Status Toggle Column */}
                    <td>
                      <div style={styles.statusCell}>
                        <label style={styles.switch}>
                          <input 
                            type="checkbox" 
                            checked={med.status !== 'inactive'}
                            onChange={() => handleToggleStatus(med)}
                            style={styles.switchInput}
                          />
                          <span style={{
                            ...styles.switchSlider,
                            backgroundColor: med.status !== 'inactive' ? '#10b981' : '#475569'
                          }}>
                            <span style={{
                              ...styles.switchKnob,
                              transform: med.status !== 'inactive' ? 'translateX(16px)' : 'translateX(2px)'
                            }} />
                          </span>
                        </label>
                        <span style={med.status !== 'inactive' ? styles.statusActive : styles.statusInactive}>
                          {med.status !== 'inactive' ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    
                    {/* Actions Column */}
                    <td>
                      <div style={styles.actionBtns}>
                        <button style={styles.actionBtnIcon} onClick={() => handleOpenView(med)}>
                          <Eye size={15} style={{ color: '#10b981' }} />
                        </button>
                        <button style={styles.actionBtnIcon} onClick={() => handleOpenEdit(med)}>
                          <Edit size={15} style={{ color: '#3b82f6' }} />
                        </button>
                        <button style={styles.actionBtnIcon} onClick={() => handleDelete(med.id)}>
                          <Trash2 size={15} style={{ color: '#ef4444' }} />
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

      {/* VIEW MODAL */}
      {isViewOpen && viewingMed && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <button style={styles.modalCloseBtn} onClick={handleCloseView}><X size={18} /></button>
            <h3 className="modal-title" style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Pill size={20} />
              <span>Medicine Details</span>
            </h3>
            
            <div style={styles.viewGrid}>
              <div style={styles.viewItem}>
                <span style={styles.viewLabel}>Medicine ID</span>
                <span style={styles.viewValue}>{formatMedicineId(viewingMed.id)}</span>
              </div>
              <div style={styles.viewItem}>
                <span style={styles.viewLabel}>Status</span>
                <span style={viewingMed.status !== 'inactive' ? styles.statusActive : styles.statusInactive}>
                  {viewingMed.status !== 'inactive' ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div style={styles.viewItemFull}>
                <span style={styles.viewLabel}>English Name</span>
                <span style={styles.viewValueBig}>{viewingMed.name}</span>
              </div>
              {viewingMed.name_urdu && (
                <div style={styles.viewItemFull}>
                  <span style={styles.viewLabel}>Urdu Name</span>
                  <span style={{ ...styles.viewValueBig, color: '#10b981' }}>{viewingMed.name_urdu}</span>
                </div>
              )}
              {viewingMed.manufacturer && (
                <div style={styles.viewItemFull}>
                  <span style={styles.viewLabel}>Manufacturer / Company</span>
                  <span style={styles.viewValue}>{viewingMed.manufacturer}</span>
                </div>
              )}
              <div style={styles.viewItem}>
                <span style={styles.viewLabel}>Category</span>
                <span style={styles.viewValue}>{viewingMed.category}</span>
              </div>
              <div style={styles.viewItem}>
                <span style={styles.viewLabel}>Price (PKR)</span>
                <span style={{ ...styles.viewValue, fontWeight: '700', color: '#10b981' }}>
                  {new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(viewingMed.price)}
                </span>
              </div>
              <div style={styles.viewItem}>
                <span style={styles.viewLabel}>Stock Level</span>
                <span style={styles.viewValue}>{viewingMed.stock} units</span>
              </div>
              <div style={styles.viewItem}>
                <span style={styles.viewLabel}>Min Stock Alert</span>
                <span style={styles.viewValue}>{viewingMed.min_stock || 10} units</span>
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleCloseView}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD MODAL */}
      {isAddOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button style={styles.modalCloseBtn} onClick={handleCloseAdd}><X size={18} /></button>
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

              <div style={styles.formGrid}>
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

      {/* EDIT MODAL */}
      {isEditOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button style={styles.modalCloseBtn} onClick={handleCloseEdit}><X size={18} /></button>
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

              <div style={styles.formGrid}>
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

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  actionBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
  },
  searchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    flex: '1.2',
    maxWidth: '450px',
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    color: '#64748b',
  },
  searchInput: {
    width: '100%',
    height: '42px',
    paddingLeft: '44px',
    paddingRight: '16px',
    border: '1px solid #1e293b',
    borderRadius: '10px',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    fontSize: '14px',
  },
  filterGroup: {
    display: 'flex',
    backgroundColor: '#0f172a',
    padding: '4px',
    borderRadius: '10px',
    border: '1px solid #1e293b',
  },
  filterBtn: {
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#94a3b8',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
  },
  filterBtnActive: {
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#10b981',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
  },
  addMedBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: '#10b981',
    color: '#ffffff',
    borderRadius: '30px',
    fontSize: '13px',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  loading: {
    textAlign: 'center',
    color: '#94a3b8',
    padding: '40px 0',
  },
  empty: {
    textAlign: 'center',
    color: '#64748b',
    padding: '60px 0',
    fontSize: '15px',
    backgroundColor: '#1e293b',
    border: '1px dashed #334155',
    borderRadius: '12px',
  },
  nameBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  medNameText: {
    fontWeight: '700',
    fontSize: '14px',
    color: '#ffffff',
  },
  medNameUrdu: {
    fontSize: '12px',
    color: '#10b981',
    fontWeight: '600',
  },
  medManufacturer: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: '500',
  },
  catLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#94a3b8',
    backgroundColor: '#1e293b',
    padding: '4px 10px',
    borderRadius: '6px',
    border: '1px solid #334155',
  },
  stockBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  stockAlertRow: {
    display: 'flex',
    alignItems: 'center',
  },
  stockCountLow: {
    fontWeight: '700',
    color: '#f59e0b',
  },
  stockCountGood: {
    fontWeight: '700',
    color: '#10b981',
  },
  minStockText: {
    fontSize: '10px',
    color: '#64748b',
    fontWeight: '600',
  },
  statusCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  switch: {
    position: 'relative',
    display: 'inline-block',
    width: '36px',
    height: '20px',
    cursor: 'pointer',
  },
  switchInput: {
    opacity: 0,
    width: 0,
    height: 0,
  },
  switchSlider: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: '20px',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
  },
  switchKnob: {
    width: '16px',
    height: '16px',
    backgroundColor: '#ffffff',
    borderRadius: '50%',
    transition: 'all 0.2s ease',
    display: 'block',
  },
  statusActive: {
    fontSize: '12px',
    color: '#10b981',
    fontWeight: '600',
  },
  statusInactive: {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: '600',
  },
  actionBtns: {
    display: 'flex',
    gap: '8px',
  },
  actionBtnIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: '1px solid #334155',
    backgroundColor: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  viewGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginTop: '16px',
  },
  viewItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  viewItemFull: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    gridColumn: 'span 2',
  },
  viewLabel: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  viewValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#f8fafc',
  },
  viewValueBig: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#ffffff',
  }
};
