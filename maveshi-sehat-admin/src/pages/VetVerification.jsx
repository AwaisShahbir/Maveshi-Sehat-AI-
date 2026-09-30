import { useState, useEffect } from 'react';
import { Check, X, HelpCircle, Copy, Download } from 'lucide-react';
import '../styles/VetVerification.css';

export default function VetVerification() {
  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); 
  const [selectedVetForInfo, setSelectedVetForInfo] = useState(null);
  const [infoRequestMessage, setInfoRequestMessage] = useState('');

  const fetchVets = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/users');
      if (res.ok) {
        const users = await res.json();
        const vetUsers = users.filter(user => user.role === 'vet');
        setVets(vetUsers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVets();
  }, []);

  const handleAction = async (userId, action) => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/users/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action })
      });
      if (res.ok) {
        alert(`Vet successfully ${action === 'approve' ? 'verified' : 'rejected'}.`);
        fetchVets();
      } else {
        alert('Failed to update status.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert(`Copied: ${text}`);
  };

  const getInitials = (name) => {
    if (!name) return 'V';
    return name
      .replace('Dr.', '')
      .trim()
      .split(' ')
      .slice(0, 2)
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const submitInfoRequest = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/users/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: selectedVetForInfo.id, 
          action: 'request_info', 
          message: infoRequestMessage 
        })
      });
      if (res.ok) {
        alert('Request for information sent successfully.');
        setSelectedVetForInfo(null);
        setInfoRequestMessage('');
        fetchVets();
      } else {
        alert('Failed to send info request.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredVets = vets.filter(v => {
    if (activeTab === 'pending') {
      return v.status === 'pending' || v.status === 'info_requested';
    }
    if (activeTab === 'approved') {
      return v.status === 'approved' || v.status === 'verified';
    }
    if (activeTab === 'rejected') {
      return v.status === 'rejected';
    }
    return v.status === activeTab;
  });

  return (
    <div className="vet-verification-view">
      
      {/* Tabs */}
      <div className="vet-tabs-container">
        <button 
          className={`vet-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Verification ({vets.filter(v => v.status === 'pending' || v.status === 'info_requested').length})
        </button>
        <button 
          className={`vet-tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          Approved Doctors ({vets.filter(v => v.status === 'approved' || v.status === 'verified').length})
        </button>
        <button 
          className={`vet-tab-btn ${activeTab === 'rejected' ? 'active' : ''}`}
          onClick={() => setActiveTab('rejected')}
        >
          Rejected Applications ({vets.filter(v => v.status === 'rejected').length})
        </button>
      </div>

      {loading ? (
        <div className="vet-loading-msg">Loading verification records...</div>
      ) : (
        <div className="grid-3">
          {filteredVets.map(vet => (
            <div className="card vet-card" key={vet.id}>
              
              <div className="vet-card-header">
                <div className="vet-avatar">
                  {getInitials(vet.full_name)}
                </div>
                <h3 className="vet-name">{vet.full_name}</h3>
                
                <span className="vet-spec-badge">
                  {vet.specialization || 'Veterinary Specialist'}
                </span>

                {(vet.status === 'approved' || vet.status === 'verified') && (
                  <span className="badge-verified">
                    Verified Doctor
                  </span>
                )}

                {vet.status === 'info_requested' && (
                  <span className="badge-info-req">
                    Information Requested
                  </span>
                )}
              </div>

              <div className="vet-details-list">
                <div className="vet-detail-row">
                  <span className="vet-detail-label">License No.</span>
                  <div className="vet-license-box">
                    <span className="font-mono">{vet.pvmc_number || 'N/A'}</span>
                    {vet.pvmc_number && (
                      <button className="vet-copy-btn" onClick={() => copyToClipboard(vet.pvmc_number)}>
                        <Copy size={12} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="vet-detail-row">
                  <span className="vet-detail-label">Phone</span>
                  <span className="vet-detail-value">{vet.phone_number}</span>
                </div>

                <div className="vet-detail-row">
                  <span className="vet-detail-label">City / District</span>
                  <span className="vet-detail-value">{vet.district || 'Punjab'}</span>
                </div>

                <div className="vet-detail-row">
                  <span className="vet-detail-label">Joined</span>
                  <span className="vet-joined-date">
                    {vet.created_at ? new Date(vet.created_at).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                  </span>
                </div>
              </div>

              {/* License Document Preview Box */}
              <div className="vet-doc-box">
                <Download size={20} className="vet-doc-icon" />
                <a 
                  href="#view" 
                  className="vet-doc-link"
                  onClick={(e) => { 
                    e.preventDefault(); 
                    if (vet.license_document_url) {
                      const url = vet.license_document_url.replace('10.0.2.2', 'localhost');
                      window.open(url, '_blank');
                    } else {
                      alert('No license document upload attached to this account.');
                    }
                  }}
                >
                  View License Document
                </a>
              </div>

              <div className="vet-exp-box">
                <strong>Experience:</strong> {vet.experience_years ? `${vet.experience_years} years practice` : 'General Clinical Practice'}
              </div>

              {activeTab === 'pending' && (
                <div className="vet-action-block">
                  <div className="vet-btn-row">
                    <button 
                      className="vet-btn-approve"
                      onClick={() => handleAction(vet.id, 'approve')}
                    >
                      <Check size={14} />
                      <span>Approve</span>
                    </button>
                    <button 
                      className="vet-btn-reject"
                      onClick={() => handleAction(vet.id, 'reject')}
                    >
                      <X size={14} />
                      <span>Reject</span>
                    </button>
                  </div>
                  <button 
                    className="vet-btn-req-info"
                    onClick={() => setSelectedVetForInfo(vet)}
                  >
                    <HelpCircle size={14} />
                    <span>Request Info</span>
                  </button>
                </div>
              )}

            </div>
          ))}

          {filteredVets.length === 0 && (
            <div className="vet-empty-state">
              No veterinarians found in this status category.
            </div>
          )}
        </div>
      )}

      {/* Request Info Modal */}
      {selectedVetForInfo && (
        <div 
          className="vet-modal-backdrop" 
          onClick={() => setSelectedVetForInfo(null)}
        >
          <div 
            className="vet-modal-content card" 
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="vet-modal-title">
              Request Additional Information - {selectedVetForInfo.full_name}
            </h3>
            <p className="vet-modal-subtitle">
              Specify the clarification or document re-upload required from this veterinarian.
            </p>
            
            <textarea
              value={infoRequestMessage}
              onChange={(e) => setInfoRequestMessage(e.target.value)}
              placeholder="e.g. Please upload a clear photo of your renewed PVMC card."
              className="vet-modal-textarea"
            />

            <div className="vet-modal-actions">
              <button 
                className="btn btn-secondary vet-cancel-btn" 
                onClick={() => {
                  setSelectedVetForInfo(null);
                  setInfoRequestMessage('');
                }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary vet-submit-req-btn" 
                onClick={submitInfoRequest}
                disabled={!infoRequestMessage.trim()}
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
