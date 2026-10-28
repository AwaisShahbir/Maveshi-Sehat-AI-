import React, { useState, useEffect } from 'react';
import { Store, Check, X, ExternalLink, ShieldAlert, ShieldCheck, Clock, Pill, TrendingUp, AlertCircle } from 'lucide-react';
import '../styles/PharmacyApproval.css';

export default function PharmacyApproval() {
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('approved');
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [platformStats, setPlatformStats] = useState(null);

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

  useEffect(() => {
    fetchPharmacies();
    fetchPlatformStats();
  }, []);

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

  const displayPharmacies = pharmacies.filter(p => p.status === activeTab);

  const approvedCount = pharmacies.filter(p => p.status === 'approved').length;
  const pendingCount = pharmacies.filter(p => p.status === 'pending').length;
  const blockedCount = pharmacies.filter(p => p.status === 'blocked').length;
  const totalMedsCount = platformStats?.pharmacies?.totalMedicines || pharmacies.reduce((sum, p) => sum + (parseInt(p.medicines_count) || 0), 0);
  const totalRevenue = platformStats?.pharmacies?.totalRevenue || 0;

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
            <span className="pharmacy-summary-sub">{platformStats?.pharmacies?.lowStock || 0} low stock items</span>
          </div>
        </div>

        <div className="pharmacy-summary-card">
          <div className="pharmacy-summary-icon purple">
            <TrendingUp size={22} />
          </div>
          <div className="pharmacy-summary-content">
            <span className="pharmacy-summary-value">Rs. {Number(totalRevenue).toLocaleString('en-PK')}</span>
            <span className="pharmacy-summary-label">Platform Sales GMV</span>
            <span className="pharmacy-summary-sub">{platformStats?.pharmacies?.totalOrders || 0} platform orders fulfilled</span>
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
      </div>

      {loading ? (
        <div className="pharmacy-loading-msg">Loading pharmacy records...</div>
      ) : (
        <div className="pharmacy-layout">
          
          <div className="pharmacy-cards-container">
            {displayPharmacies.map(pharm => (
              <div className={`pharmacy-card-item card status-${pharm.status}`} key={pharm.id}>
                <div className="pharmacy-card-layout">
                  
                  <div className="pharmacy-card-left">
                    <div className="p-avatar-box">
                      <Store size={24} className="p-avatar-icon" />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <h3 className="pharmacy-title" style={{ margin: 0 }}>{pharm.name}</h3>
                        {pharm.name_urdu && (
                          <span style={{ fontSize: '13px', color: '#135431', fontWeight: 'bold' }}>
                            ({pharm.name_urdu})
                          </span>
                        )}
                      </div>
                      
                      <div className="pharmacy-meta-grid">
                        <div><strong className="pharmacy-meta-label">License:</strong> <span className="font-mono pharmacy-meta-val">{pharm.license_number}</span></div>
                        <div><strong className="pharmacy-meta-label">Owner:</strong> <span className="pharmacy-meta-val">{pharm.owner_name}</span></div>
                        <div><strong className="pharmacy-meta-label">Email:</strong> <span className="pharmacy-meta-val">{pharm.email || 'N/A'}</span></div>
                        <div><strong className="pharmacy-meta-label">Phone:</strong> <span className="pharmacy-meta-val">{pharm.phone}</span></div>
                        <div><strong className="pharmacy-meta-label">Address:</strong> <span className="pharmacy-meta-val">{pharm.address || (pharm.city ? `${pharm.city}, ${pharm.province || ''}` : 'N/A')}</span></div>
                        <div><strong className="pharmacy-meta-label">Submitted:</strong> <span className="pharmacy-meta-val">{pharm.created_at ? new Date(pharm.created_at).toLocaleDateString([], { day: 'numeric', month: 'short' }) : 'N/A'}</span></div>
                        <div><strong className="pharmacy-meta-label">Catalogue:</strong> <span className="pharmacy-meta-val">{pharm.medicines_count || 0} medicines listed</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="pharmacy-card-right">
                    <span className={`badge ${
                      pharm.status === 'approved' 
                        ? 'badge-green' 
                        : pharm.status === 'blocked' 
                        ? 'badge-red' 
                        : pharm.status === 'rejected'
                        ? 'badge-red'
                        : 'badge-orange'
                    }`}>
                      {pharm.status.toUpperCase()}
                    </span>
                    
                    <button className="pharmacy-view-profile-btn" onClick={() => setSelectedPharmacy(pharm)}>
                      <span>View Full Profile</span>
                      <ExternalLink size={12} />
                    </button>

                    <div className="pharmacy-action-btns">
                      {pharm.status === 'approved' && (
                        <button 
                          className="pharmacy-block-btn" 
                          onClick={() => handleAction(pharm.id, 'block')}
                          title="Block pharmacy from accessing portal and listing medicines"
                        >
                          <ShieldAlert size={13} />
                          <span>Block Pharmacy</span>
                        </button>
                      )}

                      {pharm.status === 'blocked' && (
                        <button 
                          className="pharmacy-unblock-btn" 
                          onClick={() => handleAction(pharm.id, 'unblock')}
                          title="Restore approved access for pharmacy"
                        >
                          <ShieldCheck size={13} />
                          <span>Unblock Pharmacy</span>
                        </button>
                      )}

                      {pharm.status === 'pending' && (
                        <>
                          <button className="pharmacy-approve-btn" onClick={() => handleAction(pharm.id, 'approve')}>
                            <Check size={14} />
                            <span>Approve</span>
                          </button>
                          <button className="pharmacy-reject-btn" onClick={() => handleAction(pharm.id, 'reject')}>
                            <X size={14} />
                            <span>Reject</span>
                          </button>
                        </>
                      )}
                    </div>
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

    </div>
  );
}
