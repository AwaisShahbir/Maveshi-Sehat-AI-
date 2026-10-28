import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Store, Check, X, ExternalLink, ShieldAlert, ShieldCheck, Clock, 
  Pill, TrendingUp, AlertCircle, Search, Filter, User, Phone, Mail, MapPin, Calendar, Award 
} from 'lucide-react';
import '../styles/PharmacyApproval.css';

export default function PharmacyApproval() {
  const [searchParams] = useSearchParams();
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'approved');
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [platformStats, setPlatformStats] = useState(null);

  // Medicines Catalog State
  const [medicines, setMedicines] = useState([]);
  const [medsLoading, setMedsLoading] = useState(false);
  const [selectedPharmacyForMeds, setSelectedPharmacyForMeds] = useState(null);
  const [showMedsModal, setShowMedsModal] = useState(false);
  const [filterPharmacyId, setFilterPharmacyId] = useState('all');
  const [filterStockStatus, setFilterStockStatus] = useState('all');
  const [searchMedQuery, setSearchMedQuery] = useState('');

  const fetchPharmacies = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/pharmacies');
      if (res.ok) {
        const data = await res.json();
        setPharmacies(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatformStats = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/dashboard-stats');
      if (res.ok) {
        const data = await res.json();
        setPlatformStats(data);
      }
    } catch (err) {
      console.error('Error fetching admin dashboard stats:', err);
    }
  };

  const fetchMedicines = async (pharmacyId = null) => {
    setMedsLoading(true);
    try {
      const url = pharmacyId 
        ? `http://localhost:5000/api/admin/medicines?pharmacyId=${pharmacyId}`
        : 'http://localhost:5000/api/admin/medicines';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMedicines(data);
      }
    } catch (err) {
      console.error('Error fetching medicines:', err);
    } finally {
      setMedsLoading(false);
    }
  };

  useEffect(() => {
    fetchPharmacies();
    fetchPlatformStats();
    fetchMedicines();
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleAction = async (pharmacyId, action) => {
    let confirmMsg = '';
    if (action === 'block') {
      confirmMsg = 'Are you sure you want to BLOCK this pharmacy? They will not be able to log into their portal or sell medicines.';
    } else if (action === 'unblock') {
      confirmMsg = 'Are you sure you want to UNBLOCK this pharmacy?';
    } else if (action === 'approve') {
      confirmMsg = 'Are you sure you want to approve this pharmacy application?';
    } else if (action === 'reject') {
      confirmMsg = 'Are you sure you want to reject this pharmacy application?';
    }

    if (confirmMsg && !window.confirm(confirmMsg)) return;

    try {
      const res = await fetch('http://localhost:5000/api/admin/pharmacies/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pharmacyId, action })
      });
      if (res.ok) {
        const result = await res.json();
        const actionLabel = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action === 'block' ? 'blocked' : 'unblocked';
        alert(`Pharmacy ${actionLabel} successfully.`);
        if (selectedPharmacy && selectedPharmacy.id === pharmacyId) {
          const newStatus = (action === 'approve' || action === 'unblock') ? 'approved' : action === 'reject' ? 'rejected' : 'blocked';
          setSelectedPharmacy(prev => prev ? { ...prev, status: newStatus } : null);
        }
        fetchPharmacies();
      } else {
        alert('Failed to update pharmacy status.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const approvedCount = pharmacies.filter(p => p.status === 'approved').length;
  const pendingCount = pharmacies.filter(p => p.status === 'pending').length;
  const blockedCount = pharmacies.filter(p => p.status === 'blocked').length;
  const totalMedsCount = platformStats?.totalMedicines ?? pharmacies.reduce((sum, p) => sum + (parseInt(p.medicines_count) || 0), 0);
  const totalRevenue = platformStats?.totalRevenue ?? 0;
  const totalOrders = platformStats?.totalOrders ?? 0;
  const lowStockCount = platformStats?.lowStockMedsCount ?? 0;

  const getMedStockStatus = (med) => {
    if (med.stock === 0 || med.status === 'out_of_stock') {
      return { label: 'Out of Stock', badgeClass: 'badge-red', dotColor: '#ef4444' };
    }
    if (med.stock <= (med.min_stock || 10) || med.status === 'low_stock') {
      return { label: `Low Stock (${med.stock})`, badgeClass: 'badge-orange', dotColor: '#f59e0b' };
    }
    return { label: `In Stock (${med.stock})`, badgeClass: 'badge-green', dotColor: '#10b981' };
  };

  const handleOpenPharmacyCatalog = (pharm) => {
    setSelectedPharmacyForMeds(pharm);
    setShowMedsModal(true);
    fetchMedicines(pharm.id);
  };

  const filteredMedicines = medicines.filter(m => {
    if (filterPharmacyId !== 'all' && String(m.pharmacy_id) !== String(filterPharmacyId)) {
      return false;
    }
    if (filterStockStatus === 'in_stock' && (m.stock === 0 || m.stock <= (m.min_stock || 10))) {
      return false;
    }
    if (filterStockStatus === 'low_stock' && (m.stock === 0 || m.stock > (m.min_stock || 10))) {
      return false;
    }
    if (filterStockStatus === 'out_of_stock' && m.stock > 0) {
      return false;
    }
    if (searchMedQuery) {
      const q = searchMedQuery.toLowerCase();
      const matchName = (m.name || '').toLowerCase().includes(q);
      const matchCat = (m.category || '').toLowerCase().includes(q);
      const matchPharm = (m.pharmacy_name || '').toLowerCase().includes(q);
      const matchMfg = (m.manufacturer || '').toLowerCase().includes(q);
      if (!matchName && !matchCat && !matchPharm && !matchMfg) return false;
    }
    return true;
  });

  const displayPharmacies = pharmacies.filter(p => p.status === activeTab);

  return (
    <div className="pharmacy-approval-view">
      
      {/* Executive Pharmacy KPI Strip */}
      <div className="pharmacy-summary-strip">
        <div className="pharmacy-summary-card">
          <div className="pharmacy-summary-icon emerald">
            <Store size={22} />
          </div>
          <div className="pharmacy-summary-content">
            <span className="pharmacy-summary-value">{approvedCount}</span>
            <span className="pharmacy-summary-label">Approved Pharmacies</span>
            <span className="pharmacy-summary-sub">Active dispensing stores</span>
          </div>
        </div>

        <div className="pharmacy-summary-card">
          <div className="pharmacy-summary-icon amber">
            <Clock size={22} />
          </div>
          <div className="pharmacy-summary-content">
            <span className="pharmacy-summary-value">{pendingCount}</span>
            <span className="pharmacy-summary-label">Pending Licensure</span>
            <span className="pharmacy-summary-sub">{pendingCount > 0 ? 'Requires administrative review' : 'All applications vetted'}</span>
          </div>
        </div>

        <div className="pharmacy-summary-card">
          <div className="pharmacy-summary-icon blue">
            <Pill size={22} />
          </div>
          <div className="pharmacy-summary-content">
            <span className="pharmacy-summary-value">{totalMedsCount} Products</span>
            <span className="pharmacy-summary-label">Cataloged Drugs</span>
            <span className="pharmacy-summary-sub">{lowStockCount} low stock items</span>
          </div>
        </div>

        <div className="pharmacy-summary-card">
          <div className="pharmacy-summary-icon purple">
            <TrendingUp size={22} />
          </div>
          <div className="pharmacy-summary-content">
            <span className="pharmacy-summary-value">Rs. {Number(totalRevenue).toLocaleString('en-PK')}</span>
            <span className="pharmacy-summary-label">Platform Sales GMV</span>
            <span className="pharmacy-summary-sub">{totalOrders} platform orders fulfilled</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="pharmacy-tabs-container">
        <button 
          className={`pharmacy-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Approvals ({pendingCount})
        </button>
        <button 
          className={`pharmacy-tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          Approved Pharmacies ({approvedCount})
        </button>
        <button 
          className={`pharmacy-tab-btn ${activeTab === 'blocked' ? 'active' : ''}`}
          onClick={() => setActiveTab('blocked')}
        >
          Blocked Pharmacies ({blockedCount})
        </button>
        <button 
          className={`pharmacy-tab-btn ${activeTab === 'rejected' ? 'active' : ''}`}
          onClick={() => setActiveTab('rejected')}
        >
          Rejected Applications ({pharmacies.filter(p => p.status === 'rejected').length})
        </button>
        <button 
          className={`pharmacy-tab-btn ${activeTab === 'medicines' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('medicines');
            setFilterPharmacyId('all');
            fetchMedicines();
          }}
        >
          Catalog Inventory ({medicines.length})
        </button>
      </div>

      {loading ? (
        <div className="pharmacy-loading-msg">Loading pharmacy records...</div>
      ) : activeTab === 'medicines' ? (
        /* Master Medicine Catalog & Live Stock Status Directory */
        <div className="card" style={{ padding: '24px' }}>
          <div className="pharmacy-meds-filter-bar">
            <div className="pharmacy-filter-controls-group">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Filter size={15} style={{ color: '#64748b' }} />
                <select 
                  className="pharmacy-select-filter"
                  value={filterPharmacyId}
                  onChange={(e) => setFilterPharmacyId(e.target.value)}
                >
                  <option value="all">All Pharmacies ({pharmacies.length} Stores)</option>
                  {pharmacies.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.status !== 'approved' ? `(${p.status})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <select 
                className="pharmacy-select-filter"
                value={filterStockStatus}
                onChange={(e) => setFilterStockStatus(e.target.value)}
              >
                <option value="all">All Inventory Statuses</option>
                <option value="in_stock">In Stock Only</option>
                <option value="low_stock">Low Stock Warning Only</option>
                <option value="out_of_stock">Out of Stock Only</option>
              </select>
            </div>

            <div style={{ position: 'relative' }}>
              <input 
                type="text"
                placeholder="Search medicine, formula, brand..."
                className="pharmacy-search-input"
                value={searchMedQuery}
                onChange={(e) => setSearchMedQuery(e.target.value)}
              />
            </div>
          </div>

          {medsLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Loading platform medicine catalog...
            </div>
          ) : filteredMedicines.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              No medicines found matching the selected pharmacy and stock filter.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Medicine & Formulation</th>
                    <th>Dispensing Pharmacy</th>
                    <th>Category</th>
                    <th>Units in Stock</th>
                    <th>Live Inventory Status</th>
                    <th>Unit Price</th>
                    <th>Prescription (Rx)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMedicines.map(med => {
                    const statusObj = getMedStockStatus(med);
                    return (
                      <tr key={med.id}>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: '700', color: '#0f172a' }}>{med.name}</span>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                              {med.dosage_form && (
                                <span className="top-med-badge">{med.dosage_form.trim()}</span>
                              )}
                              {med.strength && (
                                <span style={{ fontSize: '11px', color: '#64748b' }}>{med.strength}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="pharmacy-store-badge">
                            <Store size={12} />
                            <span>{med.pharmacy_name || 'AI-shefa'}</span>
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', color: '#475569' }}>
                            {med.category || 'General'}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: med.stock === 0 ? '#ef4444' : '#0f172a' }}>
                            {med.stock} units
                          </strong>
                          <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>
                            Alert under: {med.min_stock || 10}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${statusObj.badgeClass}`}>
                            <span className="stock-dot-indicator" style={{ backgroundColor: statusObj.dotColor }} />
                            {statusObj.label}
                          </span>
                        </td>
                        <td style={{ fontWeight: '700', color: '#135431' }}>
                          PKR {Number(med.price).toLocaleString()}
                        </td>
                        <td>
                          {med.prescription_required ? (
                            <span className="badge badge-purple" style={{ backgroundColor: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' }}>
                              Rx Required
                            </span>
                          ) : (
                            <span className="badge badge-green">OTC</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="pharmacy-layout">
          
          <div className="pharmacy-cards-container">
            {displayPharmacies.map(pharm => (
              <div className={`pharmacy-pro-card status-${pharm.status}`} key={pharm.id}>
                {/* Card Header Row */}
                <div className="pharm-header-row">
                  <div className="pharm-brand-block">
                    <div className={`pharm-avatar-badge ${pharm.status}`}>
                      <Store size={22} className="pharm-avatar-icon" />
                    </div>
                    <div>
                      <div className="pharm-title-line">
                        <h3 className="pharm-name">{pharm.name}</h3>
                        {pharm.name_urdu && (
                          <span className="pharm-urdu-badge">
                            {pharm.name_urdu}
                          </span>
                        )}
                        {pharm.status === 'approved' && (
                          <span className="pharm-verified-badge" title="Verified Licensed Pharmacy">
                            <ShieldCheck size={13} />
                            <span>Verified Store</span>
                          </span>
                        )}
                      </div>
                      <div className="pharm-sub-meta">
                        <span className="pharm-license-code">
                          <span className="license-label">DRAP:</span> {pharm.license_number}
                        </span>
                        <span className="pharm-meta-dot">•</span>
                        <span className="pharm-date-text">
                          Submitted: {pharm.created_at ? new Date(pharm.created_at).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Pill with Dot */}
                  <div className="pharm-status-box">
                    <span className={`pharm-status-pill ${pharm.status}`}>
                      <span className="pharm-status-dot" />
                      {pharm.status === 'approved' ? 'Approved & Active' : pharm.status === 'pending' ? 'Pending Review' : pharm.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Structured 4-Column Metadata Grid */}
                <div className="pharm-details-grid">
                  <div className="pharm-meta-tile">
                    <div className="meta-tile-icon user"><User size={15} /></div>
                    <div className="meta-tile-info">
                      <span className="meta-tile-label">Managing Owner</span>
                      <span className="meta-tile-val">{pharm.owner_name || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="pharm-meta-tile">
                    <div className="meta-tile-icon phone"><Phone size={15} /></div>
                    <div className="meta-tile-info">
                      <span className="meta-tile-label">Contact Line</span>
                      <span className="meta-tile-val">{pharm.phone || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="pharm-meta-tile">
                    <div className="meta-tile-icon email"><Mail size={15} /></div>
                    <div className="meta-tile-info">
                      <span className="meta-tile-label">Official Email</span>
                      <span className="meta-tile-val" title={pharm.email}>{pharm.email || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="pharm-meta-tile">
                    <div className="meta-tile-icon map"><MapPin size={15} /></div>
                    <div className="meta-tile-info">
                      <span className="meta-tile-label">Store Location</span>
                      <span className="meta-tile-val" title={pharm.address || pharm.city}>
                        {pharm.city ? `${pharm.city}, ${pharm.province || 'Punjab'}` : (pharm.address || 'Address pending')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Toolbar */}
                <div className="pharm-card-footer">
                  <div className="pharm-inventory-preview">
                    <button 
                      className="pharm-inv-tag"
                      onClick={() => handleOpenPharmacyCatalog(pharm)}
                      title="Inspect pharmacy medicine catalog"
                    >
                      <Pill size={14} style={{ color: '#0ea5e9' }} />
                      <span><strong>{pharm.medicines_count || 0}</strong> cataloged medicines</span>
                    </button>
                    {pharm.address && pharm.address.toLowerCase() !== 'no address' && (
                      <span className="pharm-address-line" title={pharm.address}>
                        📍 {pharm.address}
                      </span>
                    )}
                  </div>

                  <div className="pharm-actions-toolbar">
                    <button 
                      className="pharm-btn-catalog"
                      onClick={() => handleOpenPharmacyCatalog(pharm)}
                      title="View all medicines cataloged under this pharmacy"
                    >
                      <Pill size={13} />
                      <span>Listed Drugs ({pharm.medicines_count || 0})</span>
                    </button>

                    <button 
                      className="pharm-btn-profile" 
                      onClick={() => setSelectedPharmacy(pharm)}
                      title="View licensing credentials and profile"
                    >
                      <span>View Profile</span>
                      <ExternalLink size={12} />
                    </button>

                    {pharm.status === 'approved' && (
                      <button 
                        className="pharm-btn-block" 
                        onClick={() => handleAction(pharm.id, 'block')}
                        title="Block pharmacy from accessing marketplace"
                      >
                        <ShieldAlert size={13} />
                        <span>Block Pharmacy</span>
                      </button>
                    )}

                    {pharm.status === 'blocked' && (
                      <button 
                        className="pharm-btn-unblock" 
                        onClick={() => handleAction(pharm.id, 'unblock')}
                        title="Restore store operations"
                      >
                        <ShieldCheck size={13} />
                        <span>Unblock Store</span>
                      </button>
                    )}

                    {pharm.status === 'pending' && (
                      <div className="pharm-pending-actions">
                        <button className="pharm-btn-approve" onClick={() => handleAction(pharm.id, 'approve')}>
                          <Check size={14} />
                          <span>Approve Store</span>
                        </button>
                        <button className="pharm-btn-reject" onClick={() => handleAction(pharm.id, 'reject')}>
                          <X size={14} />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {displayPharmacies.length === 0 && (
              <div className="card pharmacy-empty-card">
                No pharmacies found in this status category.
              </div>
            )}
          </div>

          {/* Active Pharmacies Overview Table */}
          {activeTab === 'pending' && (
            <div className="card">
              <div className="card-title-container">
                <div>
                  <h3 className="card-title">Active Approved Pharmacies</h3>
                  <p className="card-subtitle">Verified platform pharmaceutical vendors</p>
                </div>
              </div>

              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Pharmacy Name</th>
                      <th>License Number</th>
                      <th>Owner</th>
                      <th>Email</th>
                      <th>City</th>
                      <th>Medicines</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pharmacies.filter(p => p.status === 'approved').slice(0, 5).map(p => (
                      <tr key={p.id}>
                        <td className="pharmacy-meta-val">{p.name}</td>
                        <td className="font-mono">{p.license_number}</td>
                        <td>{p.owner_name}</td>
                        <td>{p.email || 'N/A'}</td>
                        <td>{p.city || p.address || 'N/A'}</td>
                        <td>{p.medicines_count || 0}</td>
                        <td>
                          <span className="badge badge-green">
                            Approved
                          </span>
                        </td>
                      </tr>
                    ))}
                    {pharmacies.filter(p => p.status === 'approved').length === 0 && (
                      <tr>
                        <td colSpan="7" className="pharmacy-empty-card">
                          No approved pharmacies found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Pharmacy Details Modal */}
      {selectedPharmacy && (
        <div 
          className="pharmacy-modal-backdrop"
          onClick={() => setSelectedPharmacy(null)}
        >
          <div 
            className="pharmacy-modal-content card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '680px' }}
          >
            <div className="pharmacy-modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 className="pharmacy-modal-title">{selectedPharmacy.name}</h3>
                  {selectedPharmacy.name_urdu && (
                    <span style={{ fontSize: '15px', color: '#135431', fontWeight: 'bold' }}>
                      ({selectedPharmacy.name_urdu})
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '4px' }}>
                  <span className="font-mono pharmacy-modal-lic">DRAP License: {selectedPharmacy.license_number}</span>
                  {selectedPharmacy.license_expiry && (
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      Expires: {selectedPharmacy.license_expiry}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={`badge ${
                  selectedPharmacy.status === 'approved' 
                    ? 'badge-green' 
                    : selectedPharmacy.status === 'blocked'
                    ? 'badge-red'
                    : selectedPharmacy.status === 'rejected'
                    ? 'badge-red'
                    : 'badge-orange'
                }`}>
                  {selectedPharmacy.status.toUpperCase()}
                </span>
                <button 
                  onClick={() => setSelectedPharmacy(null)}
                  className="pharmacy-modal-close-icon"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="pharmacy-modal-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <div className="pharmacy-modal-box">
                <span className="pharmacy-modal-label">Proprietor / Owner</span>
                <strong className="pharmacy-modal-val">{selectedPharmacy.owner_name}</strong>
              </div>

              <div className="pharmacy-modal-box">
                <span className="pharmacy-modal-label">Owner CNIC</span>
                <strong className="pharmacy-modal-val font-mono">{selectedPharmacy.cnic || 'N/A'}</strong>
              </div>

              <div className="pharmacy-modal-box">
                <span className="pharmacy-modal-label">Registered Email</span>
                <strong className="pharmacy-modal-val">{selectedPharmacy.email || 'N/A'}</strong>
              </div>

              <div className="pharmacy-modal-box">
                <span className="pharmacy-modal-label">Contact Phone</span>
                <strong className="pharmacy-modal-val">{selectedPharmacy.phone}</strong>
              </div>

              <div className="pharmacy-modal-box">
                <span className="pharmacy-modal-label">WhatsApp Number</span>
                <strong className="pharmacy-modal-val">{selectedPharmacy.whatsapp || selectedPharmacy.phone || 'N/A'}</strong>
              </div>

              <div className="pharmacy-modal-box">
                <span className="pharmacy-modal-label">Operating Hours</span>
                <strong className="pharmacy-modal-val">{selectedPharmacy.business_hours || 'Mon-Sat: 9:00 AM - 9:00 PM'}</strong>
              </div>

              <div className="pharmacy-modal-box" style={{ gridColumn: 'span 2' }}>
                <span className="pharmacy-modal-label">Full Location & Address</span>
                <strong className="pharmacy-modal-val">
                  {selectedPharmacy.address && selectedPharmacy.address !== 'no address'
                    ? selectedPharmacy.address
                    : (selectedPharmacy.city ? `${selectedPharmacy.city}, ${selectedPharmacy.province || 'Punjab'}` : 'Lahore, Punjab')}
                </strong>
              </div>

              {selectedPharmacy.description && (
                <div className="pharmacy-modal-box" style={{ gridColumn: 'span 2' }}>
                  <span className="pharmacy-modal-label">Store Bio & Description</span>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#334155', lineHeight: '1.4' }}>
                    {selectedPharmacy.description}
                  </p>
                </div>
              )}
            </div>

            {/* Catalogue & Performance Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              <div style={{ background: '#eff7f2', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '18px', fontWeight: '800', color: '#135431' }}>
                  {selectedPharmacy.medicines_count || 0}
                </span>
                <span style={{ fontSize: '11px', color: '#166534', fontWeight: '600' }}>Listed Medicines</span>
              </div>

              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '18px', fontWeight: '800', color: '#1d4ed8' }}>
                  {selectedPharmacy.orders_count || 0}
                </span>
                <span style={{ fontSize: '11px', color: '#1e40af', fontWeight: '600' }}>Orders Handled</span>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#475569', marginTop: '2px' }}>
                  {selectedPharmacy.created_at ? new Date(selectedPharmacy.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Jun 10, 2026'}
                </span>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Registered On</span>
              </div>
            </div>

            {/* View Listed Medicines Direct Button */}
            <div style={{ marginBottom: '18px' }}>
              <button 
                onClick={() => {
                  setSelectedPharmacyForMeds(selectedPharmacy);
                  setShowMedsModal(true);
                  fetchMedicines(selectedPharmacy.id);
                }}
                className="pharmacy-view-meds-btn"
                style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: '13px' }}
              >
                <Pill size={15} />
                <span>View {selectedPharmacy.name}'s Listed Medicines & Stock Status ({selectedPharmacy.medicines_count || 0})</span>
              </button>
            </div>

            <div className="pharmacy-modal-actions" style={{ justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              <div>
                {selectedPharmacy.status === 'approved' && (
                  <button 
                    onClick={() => handleAction(selectedPharmacy.id, 'block')}
                    className="pharmacy-block-btn"
                    style={{ padding: '8px 16px', fontSize: '12px' }}
                  >
                    <ShieldAlert size={14} />
                    <span>Block Pharmacy</span>
                  </button>
                )}

                {selectedPharmacy.status === 'blocked' && (
                  <button 
                    onClick={() => handleAction(selectedPharmacy.id, 'unblock')}
                    className="pharmacy-unblock-btn"
                    style={{ padding: '8px 16px', fontSize: '12px' }}
                  >
                    <ShieldCheck size={14} />
                    <span>Unblock Pharmacy</span>
                  </button>
                )}

                {selectedPharmacy.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => handleAction(selectedPharmacy.id, 'approve')}
                      className="pharmacy-modal-approve-btn"
                    >
                      Approve Pharmacy
                    </button>
                    <button 
                      onClick={() => handleAction(selectedPharmacy.id, 'reject')}
                      className="pharmacy-modal-reject-btn"
                    >
                      Reject Application
                    </button>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setSelectedPharmacy(null)}
                className="pharmacy-modal-close-btn-main"
                style={{
                  backgroundColor: '#3da860',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 22px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pharmacy Specific Medicine Catalog Modal */}
      {showMedsModal && (
        <div 
          className="pharmacy-modal-backdrop"
          onClick={() => setShowMedsModal(false)}
        >
          <div 
            className="pharmacy-modal-content card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '850px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
          >
            <div className="pharmacy-modal-header" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Store size={20} className="text-[#3da860]" />
                  <h3 className="pharmacy-modal-title" style={{ margin: 0 }}>
                    {selectedPharmacyForMeds ? selectedPharmacyForMeds.name : 'All Pharmacies'} — Medicine Inventory & Stock Status
                  </h3>
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                  Live inventory and stock availability for drugs cataloged under this pharmacy
                </p>
              </div>

              <button 
                onClick={() => setShowMedsModal(false)}
                className="pharmacy-modal-close-icon"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
              {medsLoading ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>Loading medicines...</div>
              ) : medicines.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>No medicines found for this pharmacy.</div>
              ) : (
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Medicine & Strength</th>
                        <th>Dosage / Category</th>
                        <th>Stock Available</th>
                        <th>Inventory Status</th>
                        <th>Unit Price</th>
                        <th>Prescription</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medicines.map(med => {
                        const statusObj = getMedStockStatus(med);
                        return (
                          <tr key={med.id}>
                            <td>
                              <span style={{ fontWeight: '700', color: '#0f172a', display: 'block' }}>{med.name}</span>
                              {med.strength && <span style={{ fontSize: '11px', color: '#64748b' }}>{med.strength}</span>}
                            </td>
                            <td>
                              <span className="top-med-badge">{med.dosage_form || med.category || 'General'}</span>
                            </td>
                            <td>
                              <strong style={{ color: med.stock === 0 ? '#ef4444' : '#0f172a' }}>{med.stock}</strong> units
                              <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Min alert: {med.min_stock || 10}</span>
                            </td>
                            <td>
                              <span className={`badge ${statusObj.badgeClass}`}>
                                <span className="stock-dot-indicator" style={{ backgroundColor: statusObj.dotColor }} />
                                {statusObj.label}
                              </span>
                            </td>
                            <td style={{ fontWeight: '700', color: '#135431' }}>
                              PKR {Number(med.price).toLocaleString()}
                            </td>
                            <td>
                              {med.prescription_required ? (
                                <span className="badge badge-purple" style={{ backgroundColor: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' }}>Rx Required</span>
                              ) : (
                                <span className="badge badge-green">OTC</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
              <button 
                onClick={() => setShowMedsModal(false)}
                className="pharmacy-modal-close-btn-main"
                style={{ backgroundColor: '#3da860', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
