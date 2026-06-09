import React, { useState, useEffect } from 'react';
import { Pill, Search, Plus, Edit, Trash2, X, AlertTriangle } from 'lucide-react';

export default function Medicines({ pharmacy, showAddModal, onCloseAddModal }) {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingMed, setEditingMed] = useState(null);

  // Form states
  const [form, setForm] = useState({
    name: '',
    category: 'Vaccine',
    price: '',
    stock: ''
  });

  const categories = ['All', 'Vaccine', 'Antibiotic', 'Vitamin', 'Antiparasitic', 'Other'];

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
      setIsAddOpen(true);
    }
  }, [showAddModal]);

  const handleOpenAdd = () => {
    setForm({ name: '', category: 'Vaccine', price: '', stock: '' });
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
      category: med.category,
      price: med.price,
      stock: med.stock
    });
    setIsEditOpen(true);
  };

  const handleCloseEdit = () => {
    setIsEditOpen(false);
    setEditingMed(null);
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

  const getStatusBadge = (stock, status) => {
    if (parseInt(stock) === 0 || status === 'out_of_stock') {
      return <span className="badge badge-red">Out Of Stock</span>;
    }
    if (parseInt(stock) < 15 || status === 'low_stock') {
      return <span className="badge badge-orange">Low Stock</span>;
    }
    return <span className="badge badge-green">Active</span>;
  };

  const filteredMedicines = medicines.filter(med => {
    const matchesSearch = med.name.toLowerCase().includes(search.toLowerCase()) ||
      med.category.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'All' || med.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div style={styles.container}>
      {/* Top Header Actions bar */}
      <div style={styles.actionBar}>
        <div style={styles.searchWrapper}>
          <Search size={18} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search medicine by name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} />
          <span>Add Medicine / نیا دوا شامل کریں</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div style={styles.tabs}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={selectedCategory === cat ? styles.tabBtnActive : styles.tabBtn}
          >
            {cat}
          </button>
        ))}
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
                <th>ID</th>
                <th>Medicine Name / دوا کا نام</th>
                <th>Category / زمرہ</th>
                <th>Price / قیمت</th>
                <th>Stock / اسٹاک</th>
                <th>Status / حیثیت</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMedicines.map(med => (
                <tr key={med.id}>
                  <td style={{ fontWeight: '700', color: '#10b981' }}>#{med.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Pill size={16} style={{ color: '#10b981' }} />
                      <span style={{ fontWeight: '600' }}>{med.name}</span>
                    </div>
                  </td>
                  <td>{med.category}</td>
                  <td style={{ fontWeight: '700' }}>PKR {med.price}</td>
                  <td style={{ fontWeight: '600' }}>{med.stock} units</td>
                  <td>{getStatusBadge(med.stock, med.status)}</td>
                  <td>
                    <div style={styles.actionBtns}>
                      <button style={styles.editBtn} onClick={() => handleOpenEdit(med)}>
                        <Edit size={14} />
                      </button>
                      <button style={styles.deleteBtn} onClick={() => handleDelete(med.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                <label className="form-label">Medicine Name</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Oxytetracycline 20%"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-control"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="Vaccine">Vaccine</option>
                  <option value="Antibiotic">Antibiotic</option>
                  <option value="Vitamin">Vitamin</option>
                  <option value="Antiparasitic">Antiparasitic</option>
                  <option value="Other">Other</option>
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
                <label className="form-label">Medicine Name</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-control"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="Vaccine">Vaccine</option>
                  <option value="Antibiotic">Antibiotic</option>
                  <option value="Vitamin">Vitamin</option>
                  <option value="Antiparasitic">Antiparasitic</option>
                  <option value="Other">Other</option>
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
    flex: '1',
    maxWidth: '400px',
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
    border: '1px solid #334155',
    borderRadius: '10px',
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    fontSize: '14px',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    borderBottom: '1px solid #334155',
    paddingBottom: '12px',
    overflowX: 'auto',
  },
  tabBtn: {
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
  tabBtnActive: {
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
  actionBtns: {
    display: 'flex',
    gap: '8px',
  },
  editBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    border: '1px solid #334155',
    backgroundColor: 'transparent',
    color: '#3b82f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  deleteBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    border: '1px solid #334155',
    backgroundColor: 'transparent',
    color: '#ef4444',
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
};
