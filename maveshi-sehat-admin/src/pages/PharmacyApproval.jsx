import React, { useState, useEffect } from 'react';
import { Store, Check, X, ExternalLink } from 'lucide-react';

export default function PharmacyApproval() {
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);

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

  useEffect(() => {
    fetchPharmacies();
  }, []);

  const handleAction = async (pharmacyId, action) => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/pharmacies/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pharmacyId, action })
      });
      if (res.ok) {
        alert(`Pharmacy ${action === 'approve' ? 'approved' : 'rejected'} successfully.`);
        if (selectedPharmacy && selectedPharmacy.id === pharmacyId) {
          setSelectedPharmacy(null);
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

  return (
    <div className="pharmacy-approval-view">
      
      {/* Tabs */}
      <div className="tabs-container" style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--border-light)', marginBottom: '24px' }}>
        <button 
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          style={{
            padding: '12px 4px',
            fontSize: '15px',
            fontWeight: '600',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: '2px solid',
            borderBottomColor: activeTab === 'pending' ? '#3da860' : 'transparent',
            color: activeTab === 'pending' ? '#3da860' : 'var(--text-muted)',
            cursor: 'pointer'
          }}
          onClick={() => setActiveTab('pending')}
        >
          Pending Approvals ({pharmacies.filter(p => p.status === 'pending').length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
          style={{
            padding: '12px 4px',
            fontSize: '15px',
            fontWeight: '600',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: '2px solid',
            borderBottomColor: activeTab === 'approved' ? '#3da860' : 'transparent',
            color: activeTab === 'approved' ? '#3da860' : 'var(--text-muted)',
            cursor: 'pointer'
          }}
          onClick={() => setActiveTab('approved')}
        >
          Approved Pharmacies ({pharmacies.filter(p => p.status === 'approved').length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'rejected' ? 'active' : ''}`}
          style={{
            padding: '12px 4px',
            fontSize: '15px',
            fontWeight: '600',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: '2px solid',
            borderBottomColor: activeTab === 'rejected' ? '#3da860' : 'transparent',
            color: activeTab === 'rejected' ? '#3da860' : 'var(--text-muted)',
            cursor: 'pointer'
          }}
          onClick={() => setActiveTab('rejected')}
        >
          Rejected Applications ({pharmacies.filter(p => p.status === 'rejected').length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading pharmacy records...</div>
      ) : (
        <div className="pharmacy-layout">
          
          <div className="pharmacy-cards-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
            {displayPharmacies.map(pharm => (
              <div className="pharmacy-card card" key={pharm.id} style={{ borderLeft: '4px solid var(--color-orange)', padding: '24px', borderRadius: '16px', backgroundColor: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                  
                  <div style={{ display: 'flex', gap: '16px', flex: 1, minWidth: '280px' }}>
                    <div className="p-avatar-box" style={{ width: '48px', height: '48px', backgroundColor: '#fff3e0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>
                      <Store size={24} style={{ color: 'var(--color-orange)' }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-main)' }}>{pharm.name}</h3>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px 20px', fontSize: '13px' }}>
                        <div><strong style={{ color: 'var(--text-muted)' }}>License:</strong> <span className="font-mono" style={{ fontWeight: 600 }}>{pharm.license_number}</span></div>
                        <div><strong style={{ color: 'var(--text-muted)' }}>Owner:</strong> <span style={{ fontWeight: 600 }}>{pharm.owner_name}</span></div>
                        <div><strong style={{ color: 'var(--text-muted)' }}>Address:</strong> <span style={{ fontWeight: 600 }}>{pharm.address}</span></div>
                        <div><strong style={{ color: 'var(--text-muted)' }}>Phone:</strong> <span style={{ fontWeight: 600 }}>{pharm.phone}</span></div>
                        <div><strong style={{ color: 'var(--text-muted)' }}>Submitted:</strong> <span style={{ fontWeight: 600 }}>{pharm.created_at ? new Date(pharm.created_at).toLocaleDateString([], { day: 'numeric', month: 'short' }) : 'N/A'}</span></div>
                        <div><strong style={{ color: 'var(--text-muted)' }}>Catalogue:</strong> <span style={{ fontWeight: 600 }}>{pharm.medicines_count || 0} medicines listed</span></div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <span className="badge" style={{
                      backgroundColor: '#fff3e0',
                      color: '#ff9800',
                      padding: '4px 12px',
                      borderRadius: '30px',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}>
                      {pharm.status.toUpperCase()}
                    </span>
                    
                    <button style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#007aff', cursor: 'pointer', fontWeight: '600' }} onClick={() => setSelectedPharmacy(pharm)}>
                      <span>View Full Profile</span>
                      <ExternalLink size={12} />
                    </button>

                    {pharm.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                        <button style={{ padding: '8px 16px', fontSize: '13px', backgroundColor: '#3da860', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => handleAction(pharm.id, 'approve')}>
                          <Check size={14} />
                          <span>Approve</span>
                        </button>
                        <button style={{ padding: '8px 16px', fontSize: '13px', backgroundColor: 'transparent', color: 'var(--color-red)', border: '1px solid var(--color-red)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => handleAction(pharm.id, 'reject')}>
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
              <div className="card" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
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
                      <th>City</th>
                      <th>Medicines</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pharmacies.filter(p => p.status === 'approved').slice(0, 5).map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td className="font-mono">{p.license_number}</td>
                        <td>{p.owner_name}</td>
                        <td>{p.address}</td>
                        <td>{p.medicines_count || 0}</td>
                        <td>
                          <span className="badge" style={{ backgroundColor: '#eff7f2', color: '#3da860', padding: '4px 10px', borderRadius: '30px', fontSize: '11px', fontWeight: '600' }}>
                            Approved
                          </span>
                        </td>
                      </tr>
                    ))}
                    {pharmacies.filter(p => p.status === 'approved').length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
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
          className="modal-backdrop"
          onClick={() => setSelectedPharmacy(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div 
            className="modal-content card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '600px',
              padding: '28px',
              borderRadius: '16px',
              backgroundColor: '#ffffff',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' }}>{selectedPharmacy.name}</h3>
                <span className="font-mono" style={{ fontSize: '12px', color: '#64748b' }}>License: {selectedPharmacy.license_number}</span>
              </div>
              <button 
                onClick={() => setSelectedPharmacy(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px', marginBottom: '24px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px' }}>
                <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Proprietor</span>
                <strong style={{ color: '#0f172a' }}>{selectedPharmacy.owner_name}</strong>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px' }}>
                <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Contact Phone</span>
                <strong style={{ color: '#0f172a' }}>{selectedPharmacy.phone}</strong>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px' }}>
                <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Location / Address</span>
                <strong style={{ color: '#0f172a' }}>{selectedPharmacy.address}</strong>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px' }}>
                <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Current Status</span>
                <strong style={{ color: selectedPharmacy.status === 'approved' ? '#3da860' : '#ff9800', textTransform: 'capitalize' }}>
                  {selectedPharmacy.status}
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              {selectedPharmacy.status === 'pending' && (
                <>
                  <button 
                    onClick={() => handleAction(selectedPharmacy.id, 'reject')}
                    style={{ padding: '10px 18px', backgroundColor: 'transparent', color: 'var(--color-red)', border: '1px solid var(--color-red)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                  >
                    Reject Application
                  </button>
                  <button 
                    onClick={() => handleAction(selectedPharmacy.id, 'approve')}
                    style={{ padding: '10px 18px', backgroundColor: '#3da860', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                  >
                    Approve Pharmacy
                  </button>
                </>
              )}
              {selectedPharmacy.status !== 'pending' && (
                <button 
                  onClick={() => setSelectedPharmacy(null)}
                  style={{ padding: '10px 18px', backgroundColor: '#3da860', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
