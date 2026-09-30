import React, { useState, useEffect } from 'react';
import { Store, Check, X, ExternalLink } from 'lucide-react';
import '../styles/PharmacyApproval.css';

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
      <div className="pharmacy-tabs-container">
        <button 
          className={`pharmacy-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Approvals ({pharmacies.filter(p => p.status === 'pending').length})
        </button>
        <button 
          className={`pharmacy-tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          Approved Pharmacies ({pharmacies.filter(p => p.status === 'approved').length})
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
              <div className="pharmacy-card-item card" key={pharm.id}>
                <div className="pharmacy-card-layout">
                  
                  <div className="pharmacy-card-left">
                    <div className="p-avatar-box">
                      <Store size={24} className="p-avatar-icon" />
                    </div>
                    <div>
                      <h3 className="pharmacy-title">{pharm.name}</h3>
                      
                      <div className="pharmacy-meta-grid">
                        <div><strong className="pharmacy-meta-label">License:</strong> <span className="font-mono pharmacy-meta-val">{pharm.license_number}</span></div>
                        <div><strong className="pharmacy-meta-label">Owner:</strong> <span className="pharmacy-meta-val">{pharm.owner_name}</span></div>
                        <div><strong className="pharmacy-meta-label">Address:</strong> <span className="pharmacy-meta-val">{pharm.address}</span></div>
                        <div><strong className="pharmacy-meta-label">Phone:</strong> <span className="pharmacy-meta-val">{pharm.phone}</span></div>
                        <div><strong className="pharmacy-meta-label">Submitted:</strong> <span className="pharmacy-meta-val">{pharm.created_at ? new Date(pharm.created_at).toLocaleDateString([], { day: 'numeric', month: 'short' }) : 'N/A'}</span></div>
                        <div><strong className="pharmacy-meta-label">Catalogue:</strong> <span className="pharmacy-meta-val">{pharm.medicines_count || 0} medicines listed</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="pharmacy-card-right">
                    <span className="badge badge-orange">
                      {pharm.status.toUpperCase()}
                    </span>
                    
                    <button className="pharmacy-view-profile-btn" onClick={() => setSelectedPharmacy(pharm)}>
                      <span>View Full Profile</span>
                      <ExternalLink size={12} />
                    </button>

                    {pharm.status === 'pending' && (
                      <div className="pharmacy-action-btns">
                        <button className="pharmacy-approve-btn" onClick={() => handleAction(pharm.id, 'approve')}>
                          <Check size={14} />
                          <span>Approve</span>
                        </button>
                        <button className="pharmacy-reject-btn" onClick={() => handleAction(pharm.id, 'reject')}>
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
                        <td>{p.address}</td>
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
                        <td colSpan="6" className="pharmacy-empty-card">
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
            <div className="pharmacy-modal-header">
              <div>
                <h3 className="pharmacy-modal-title">{selectedPharmacy.name}</h3>
                <span className="font-mono pharmacy-modal-lic">License: {selectedPharmacy.license_number}</span>
              </div>
              <button 
                onClick={() => setSelectedPharmacy(null)}
                className="pharmacy-modal-close-icon"
              >
                <X size={16} />
              </button>
            </div>

            <div className="pharmacy-modal-grid">
              <div className="pharmacy-modal-box">
                <span className="pharmacy-modal-label">Proprietor</span>
                <strong className="pharmacy-modal-val">{selectedPharmacy.owner_name}</strong>
              </div>
              <div className="pharmacy-modal-box">
                <span className="pharmacy-modal-label">Contact Phone</span>
                <strong className="pharmacy-modal-val">{selectedPharmacy.phone}</strong>
              </div>
              <div className="pharmacy-modal-box">
                <span className="pharmacy-modal-label">Location / Address</span>
                <strong className="pharmacy-modal-val">{selectedPharmacy.address}</strong>
              </div>
              <div className="pharmacy-modal-box">
                <span className="pharmacy-modal-label">Current Status</span>
                <strong className={selectedPharmacy.status === 'approved' ? 'text-green' : 'text-orange'}>
                  {selectedPharmacy.status}
                </strong>
              </div>
            </div>

            <div className="pharmacy-modal-actions">
              {selectedPharmacy.status === 'pending' && (
                <>
                  <button 
                    onClick={() => handleAction(selectedPharmacy.id, 'reject')}
                    className="pharmacy-modal-reject-btn"
                  >
                    Reject Application
                  </button>
                  <button 
                    onClick={() => handleAction(selectedPharmacy.id, 'approve')}
                    className="pharmacy-modal-approve-btn"
                  >
                    Approve Pharmacy
                  </button>
                </>
              )}
              {selectedPharmacy.status !== 'pending' && (
                <button 
                  onClick={() => setSelectedPharmacy(null)}
                  className="pharmacy-modal-close-btn-main"
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
