import { API_BASE_URL, resolveImageUrl } from '../config';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Store, Check, X, ExternalLink, ShieldAlert, ShieldCheck, Clock, 
  Pill, TrendingUp, AlertCircle, Search, Filter, User, Phone, Mail, MapPin, Calendar, Award,
  FileText, Download, CheckCircle2, UserCheck
} from 'lucide-react';
import '../styles/PharmacyApproval.css';

const isImageFile = (url) => {
  if (!url) return false;
  const clean = url.split('?')[0].toLowerCase();
  return clean.endsWith('.jpg') || clean.endsWith('.jpeg') || clean.endsWith('.png') || clean.endsWith('.webp') || url.startsWith('data:image/');
};

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
      const res = await fetch(`${API_BASE_URL}/api/admin/pharmacies`);
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
      const res = await fetch(`${API_BASE_URL}/api/admin/dashboard-stats`);
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
        ? `${API_BASE_URL}/api/admin/medicines?pharmacyId=${pharmacyId}`
        : `${API_BASE_URL}/api/admin/medicines`;
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
      const res = await fetch(`${API_BASE_URL}/api/admin/pharmacies/approve`, {
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
        <div className="card pharmacy-meds-card">
          <div className="pharmacy-meds-filter-bar">
            <div className="pharmacy-filter-controls-group">
              <div className="flex items-center gap-2">
                <Filter size={15} className="text-slate-500" />
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

            <div className="relative">
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
            <div className="text-center py-10 text-slate-500">
              Loading platform medicine catalog...
            </div>
          ) : filteredMedicines.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
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
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">{med.name}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {med.dosage_form && (
                                <span className="top-med-badge">{med.dosage_form.trim()}</span>
                              )}
                              {med.strength && (
                                <span className="text-[11px] text-slate-500">{med.strength}</span>
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
                          <span className="text-xs text-slate-600">
                            {med.category || 'General'}
                          </span>
                        </td>
                        <td>
                          <strong className={med.stock === 0 ? 'text-red-500 font-bold' : 'text-slate-900 font-bold'}>
                            {med.stock} units
                          </strong>
                          <span className="text-[10px] text-slate-400 block">
                            Alert under: {med.min_stock || 10}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${statusObj.badgeClass}`}>
                            <span className="stock-dot-indicator" style={{ backgroundColor: statusObj.dotColor }} />
                            {statusObj.label}
                          </span>
                        </td>
                        <td className="font-bold text-[#135431]">
                          PKR {Number(med.price).toLocaleString()}
                        </td>
                        <td>
                          {med.prescription_required ? (
                            <span className="badge badge-purple bg-purple-50 text-purple-600 border border-purple-200">
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

                {/* Registration Verification Documents Strip (DRAP License & CNIC) */}
                <div className="pharm-docs-verification-strip">
                  <div className="pharm-docs-strip-header">
                    <div className="pharm-docs-strip-title">
                      <FileText size={14} color="#135431" />
                      <span>Verification Documents (License & CNIC)</span>
                    </div>
                    {pharm.license_document_url && pharm.cnic_document_url ? (
                      <span className="pharm-doc-count-badge success">
                        <CheckCircle2 size={12} />
                        <span>Both Documents Attached</span>
                      </span>
                    ) : pharm.license_document_url || pharm.cnic_document_url ? (
                      <span className="pharm-doc-count-badge warning">
                        <AlertCircle size={12} />
                        <span>1 of 2 Documents Attached</span>
                      </span>
                    ) : (
                      <span className="pharm-doc-count-badge empty">
                        <AlertCircle size={12} />
                        <span>No Documents Uploaded</span>
                      </span>
                    )}
                  </div>

                  <div className="pharm-docs-grid">
                    {/* Document 1: DRAP Drug Sale License */}
                    <div className={`pharm-doc-card-tile ${pharm.license_document_url ? 'attached' : 'empty'}`}>
                      <div className="pharm-doc-tile-left">
                        <div className="pharm-doc-type-icon drap">
                          <Award size={15} />
                        </div>
                        <div className="pharm-doc-text-block">
                          <span className="pharm-doc-type-title">DRAP Sale License</span>
                          <span className="pharm-doc-type-val font-mono">{pharm.license_number || 'N/A'}</span>
                        </div>
                      </div>
                      {pharm.license_document_url ? (
                        <a
                          href={resolveImageUrl(pharm.license_document_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pharm-doc-view-btn license-btn"
                          onClick={(e) => e.stopPropagation()}
                          title="Open official DRAP License document in new window"
                        >
                          <Download size={13} />
                          <span>View License ↗</span>
                        </a>
                      ) : (
                        <span className="pharm-doc-missing-chip">Not Attached</span>
                      )}
                    </div>

                    {/* Document 2: Owner / Proprietor CNIC */}
                    <div className={`pharm-doc-card-tile ${pharm.cnic_document_url ? 'attached' : 'empty'}`}>
                      <div className="pharm-doc-tile-left">
                        <div className="pharm-doc-type-icon cnic">
                          <UserCheck size={15} />
                        </div>
                        <div className="pharm-doc-text-block">
                          <span className="pharm-doc-type-title">Owner National CNIC</span>
                          <span className="pharm-doc-type-val font-mono">{pharm.cnic || 'N/A'}</span>
                        </div>
                      </div>
                      {pharm.cnic_document_url ? (
                        <a
                          href={resolveImageUrl(pharm.cnic_document_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pharm-doc-view-btn cnic-btn"
                          onClick={(e) => e.stopPropagation()}
                          title="Open Owner CNIC document in new window"
                        >
                          <Download size={13} />
                          <span>View CNIC ↗</span>
                        </a>
                      ) : (
                        <span className="pharm-doc-missing-chip">Not Attached</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer Toolbar */}
                <div className="pharm-card-footer">
                  <div className="pharm-inventory-preview">
                    {pharm.address && pharm.address.toLowerCase() !== 'no address' ? (
                      <span className="pharm-address-line" title={pharm.address}>
                        📍 {pharm.address}
                      </span>
                    ) : (
                      <span className="pharm-address-line text-slate-400">
                        Registered Vendor
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
                      title="Inspect licensing credentials and owner CNIC side-by-side"
                    >
                      <ShieldCheck size={13} />
                      <span>Inspect & Verify Docs</span>
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
                        <button 
                          className="pharm-btn-inspect-quick" 
                          onClick={() => setSelectedPharmacy(pharm)}
                          title="Cross-check owner CNIC against DRAP license before deciding"
                        >
                          <ShieldCheck size={14} />
                          <span>Compare Docs</span>
                        </button>
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
                      <th>DRAP License</th>
                      <th>Owner</th>
                      <th>Owner CNIC</th>
                      <th>Documents</th>
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
                        <td className="font-mono">{p.cnic || 'N/A'}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            {p.license_document_url ? (
                              <a
                                href={resolveImageUrl(p.license_document_url)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-emerald-700 font-bold hover:underline"
                                title="Open DRAP License"
                              >
                                License ↗
                              </a>
                            ) : (
                              <span className="text-[11px] text-slate-400">No Lic</span>
                            )}
                            <span className="text-slate-300">•</span>
                            {p.cnic_document_url ? (
                              <a
                                href={resolveImageUrl(p.cnic_document_url)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-blue-700 font-bold hover:underline"
                                title="Open Owner CNIC"
                              >
                                CNIC ↗
                              </a>
                            ) : (
                              <span className="text-[11px] text-slate-400">No CNIC</span>
                            )}
                          </div>
                        </td>
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
                        <td colSpan="8" className="pharmacy-empty-card">
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
            
          >
            <div 
              className="pharmacy-modal-header"
              
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="pharmacy-modal-title">{selectedPharmacy.name}</h3>
                  {selectedPharmacy.name_urdu && (
                    <span className="text-[15px] text-[#135431] font-bold">
                      ({selectedPharmacy.name_urdu})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="font-mono pharmacy-modal-lic">DRAP License: {selectedPharmacy.license_number}</span>
                  {selectedPharmacy.license_expiry && (
                    <span className="text-[11px] text-slate-500">
                      Expires: {selectedPharmacy.license_expiry}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
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

            <div className="pharmacy-modal-grid grid grid-cols-2">
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
                <strong className="pharmacy-modal-val">{selectedPharmacy.business_hours || 'Not specified'}</strong>
              </div>

              <div className="pharmacy-modal-box col-span-2">
                <span className="pharmacy-modal-label">Full Location & Address</span>
                <strong className="pharmacy-modal-val">
                  {selectedPharmacy.address && selectedPharmacy.address !== 'no address'
                    ? selectedPharmacy.address
                    : (selectedPharmacy.city ? `${selectedPharmacy.city}, ${selectedPharmacy.province || 'Punjab'}` : 'Lahore, Punjab')}
                </strong>
              </div>

              {selectedPharmacy.description && (
                <div className="pharmacy-modal-box col-span-2">
                  <span className="pharmacy-modal-label">Store Bio & Description</span>
                  <p className="mt-1 text-xs text-slate-700 leading-normal">
                    {selectedPharmacy.description}
                  </p>
                </div>
              )}
            </div>

            {/* Catalogue & Performance Summary */}
            <div className="verification-stats-summary-grid">
              <div className="verification-stat-box green">
                <span className="verification-stat-number">
                  {selectedPharmacy.medicines_count || 0}
                </span>
                <span className="verification-stat-label">Listed Medicines</span>
              </div>

              <div className="verification-stat-box blue">
                <span className="verification-stat-number">
                  {selectedPharmacy.orders_count || 0}
                </span>
                <span className="verification-stat-label">Orders Handled</span>
              </div>

              <div className="verification-stat-box gray">
                <span className="verification-stat-number">
                  {selectedPharmacy.created_at ? new Date(selectedPharmacy.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                </span>
                <span className="verification-stat-label">Registered On</span>
              </div>
            </div>

            {/* Official Verification Documents & CNIC Cross-Check */}
            <div className="verification-docs-container">
              <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} color="#135431" />
                  <strong className="text-sm text-slate-900 font-bold">Official Regulatory Documents & CNIC Cross-Check</strong>
                </div>
                <span className="text-[11px] bg-sky-100 text-sky-700 font-bold px-2 py-0.5 rounded-md">
                  Regulatory Review
                </span>
              </div>

              <div className="verification-docs-grid">
                {/* Document 1: Official DRAP Pharmacy License */}
                <div className="verification-doc-card">
                  <div>
                    <div className="verification-doc-title-row">
                      <div className="flex items-center gap-1.5">
                        <Award size={16} color="#135431" />
                        <strong className="text-[13px] text-[#135431]">DRAP / Drug Sale License</strong>
                      </div>
                      {selectedPharmacy.license_document_url && (
                        <span className="verification-doc-badge-green">
                          Uploaded
                        </span>
                      )}
                    </div>
                    <p className="mb-1 text-[11px] text-slate-500">
                      License No: <strong className="text-slate-900 font-mono">{selectedPharmacy.license_number}</strong>
                    </p>
                    <p className="m-0 text-[11px] text-slate-500">
                      Expiry: <strong>{selectedPharmacy.license_expiry || 'Not specified'}</strong>
                    </p>

                    {/* License Image Preview */}
                    {selectedPharmacy.license_document_url && isImageFile(selectedPharmacy.license_document_url) && (
                      <div onClick={() => window.open(resolveImageUrl(selectedPharmacy.license_document_url), '_blank')} className="verification-doc-preview-box" title="Click to view full license image">
                        <img 
                          src={resolveImageUrl(selectedPharmacy.license_document_url)} 
                          alt="DRAP License"
                          className="verification-doc-img"
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-2.5">
                    {selectedPharmacy.license_document_url ? (
                      <button type="button" onClick={() => { const url = resolveImageUrl(selectedPharmacy.license_document_url); window.open(url, '_blank'); }} className="verification-doc-btn-green">
                        <Download size={13} />
                        <span>View / Download Full License ↗</span>
                      </button>
                    ) : (
                      <span className="verification-doc-empty-hint">
                        No license document uploaded
                      </span>
                    )}
                  </div>
                </div>

                {/* Document 2: Proprietor Owner CNIC Document */}
                <div className="verification-doc-card">
                  <div>
                    <div className="verification-doc-title-row">
                      <div className="flex items-center gap-1.5">
                        <UserCheck size={16} color="#007aff" />
                        <strong className="text-[13px] text-[#007aff]">Owner National CNIC</strong>
                      </div>
                      {selectedPharmacy.cnic_document_url && (
                        <span className="verification-doc-badge-blue">
                          Uploaded
                        </span>
                      )}
                    </div>
                    <p className="mb-1 text-[11px] text-slate-500">
                      Proprietor: <strong className="text-slate-900">{selectedPharmacy.owner_name}</strong>
                    </p>
                    <p className="m-0 text-[11px] text-slate-500">
                      CNIC No: <strong className="text-slate-900 font-mono">{selectedPharmacy.cnic || 'N/A'}</strong>
                    </p>

                    {/* CNIC Image Preview */}
                    {selectedPharmacy.cnic_document_url && isImageFile(selectedPharmacy.cnic_document_url) && (
                      <div onClick={() => window.open(resolveImageUrl(selectedPharmacy.cnic_document_url), '_blank')} className="verification-doc-preview-box" title="Click to view full CNIC image">
                        <img 
                          src={resolveImageUrl(selectedPharmacy.cnic_document_url)} 
                          alt="Owner CNIC"
                          className="verification-doc-img"
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-2.5">
                    {selectedPharmacy.cnic_document_url ? (
                      <button type="button" onClick={() => { const url = resolveImageUrl(selectedPharmacy.cnic_document_url); window.open(url, '_blank'); }} className="verification-doc-btn-blue">
                        <Download size={13} />
                        <span>View / Download Full CNIC ↗</span>
                      </button>
                    ) : (
                      <span className="verification-doc-empty-hint">
                        No CNIC document uploaded
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Match Verification Helper */}
              <div className="verification-checklist-box">
                <span className="verification-checklist-title">
                  Verification Cross-Check Checklist:
                </span>
                <div className="verification-checklist-chips">
                  <span className="verification-checklist-chip">
                    <CheckCircle2 size={13} color="#16a34a" /> Owner: <strong>{selectedPharmacy.owner_name}</strong>
                  </span>
                  <span className="verification-checklist-chip">
                    <CheckCircle2 size={13} color="#16a34a" /> CNIC: <strong>{selectedPharmacy.cnic || 'N/A'}</strong>
                  </span>
                  <span className="verification-checklist-chip">
                    <CheckCircle2 size={13} color="#16a34a" /> License: <strong>{selectedPharmacy.license_number}</strong>
                  </span>
                </div>

                {/* Direct Verification Action inside Modal if Pending */}
                {selectedPharmacy.status === 'pending' && (
                  <div className="verification-quick-actions-row">
                    <button
                      type="button"
                      onClick={() => handleAction(selectedPharmacy.id, 'approve')}
                      className="verification-btn-approve-quick"
                    >
                      <Check size={16} />
                      <span>Verify & Approve Store Access</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction(selectedPharmacy.id, 'reject')}
                      className="verification-btn-reject-quick"
                    >
                      <X size={16} />
                      <span>Reject Application</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* View Listed Medicines Direct Button */}
            <div className="mb-4">
              <button 
                onClick={() => {
                  setSelectedPharmacyForMeds(selectedPharmacy);
                  setShowMedsModal(true);
                  fetchMedicines(selectedPharmacy.id);
                }}
                className="pharmacy-view-meds-btn"
                
              >
                <Pill size={15} />
                <span>View {selectedPharmacy.name}'s Listed Medicines & Stock Status ({selectedPharmacy.medicines_count || 0})</span>
              </button>
            </div>

            <div className="pharmacy-modal-actions justify-between border-t border-slate-100 pt-4">
              <div>
                {selectedPharmacy.status === 'approved' && (
                  <button 
                    onClick={() => handleAction(selectedPharmacy.id, 'block')}
                    className="pharmacy-block-btn"
                    
                  >
                    <ShieldAlert size={14} />
                    <span>Block Pharmacy</span>
                  </button>
                )}

                {selectedPharmacy.status === 'blocked' && (
                  <button 
                    onClick={() => handleAction(selectedPharmacy.id, 'unblock')}
                    className="pharmacy-unblock-btn"
                    
                  >
                    <ShieldCheck size={14} />
                    <span>Unblock Pharmacy</span>
                  </button>
                )}

                {selectedPharmacy.status === 'pending' && (
                  <div className="flex gap-2">
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
            className="pharmacy-modal-content card verification-meds-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pharmacy-modal-header border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Store size={20} className="text-[#3da860]" />
                  <h3 className="pharmacy-modal-title m-0">
                    {selectedPharmacyForMeds ? selectedPharmacyForMeds.name : 'All Pharmacies'} — Medicine Inventory & Stock Status
                  </h3>
                </div>
                <p className="mt-1 text-xs text-slate-500">
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

            <div className="verification-meds-modal-body">
              {medsLoading ? (
                <div className="text-center py-8 text-slate-500">Loading medicines...</div>
              ) : medicines.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No medicines found for this pharmacy.</div>
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
                              <span className="font-bold text-slate-900 block">{med.name}</span>
                              {med.strength && <span className="text-[11px] text-slate-500">{med.strength}</span>}
                            </td>
                            <td>
                              <span className="top-med-badge">{med.dosage_form || med.category || 'General'}</span>
                            </td>
                            <td>
                              <strong className={med.stock === 0 ? 'text-red-500 font-bold' : 'text-slate-900 font-bold'}>{med.stock}</strong> units
                              <span className="text-[10px] text-slate-400 block">Min alert: {med.min_stock || 10}</span>
                            </td>
                            <td>
                              <span className={`badge ${statusObj.badgeClass}`}>
                                <span className="stock-dot-indicator" style={{ backgroundColor: statusObj.dotColor }} />
                                {statusObj.label}
                              </span>
                            </td>
                            <td className="font-bold text-[#135431]">
                              PKR {Number(med.price).toLocaleString()}
                            </td>
                            <td>
                              {med.prescription_required ? (
                                <span className="badge badge-purple bg-purple-50 text-purple-600 border border-purple-200">Rx Required</span>
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

            <div className="flex justify-end pt-3.5 border-t border-slate-100">
              <button 
                onClick={() => setShowMedsModal(false)}
                className="pharmacy-modal-close-btn-main"
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
