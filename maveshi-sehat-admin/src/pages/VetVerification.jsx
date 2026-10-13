import { useState, useEffect } from 'react';
import { 
  Check, 
  X, 
  HelpCircle, 
  Copy, 
  Download, 
  ExternalLink, 
  Award, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Activity, 
  UserCheck, 
  FileText 
} from 'lucide-react';
import '../styles/VetVerification.css';

export default function VetVerification() {
  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); 
  const [selectedVetForInfo, setSelectedVetForInfo] = useState(null);
  const [selectedVetForProfile, setSelectedVetForProfile] = useState(null);
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
      console.error('Error fetching vets:', err);
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
        alert(`Vet doctor application successfully ${action === 'approve' ? 'verified' : 'rejected'}.`);
        if (selectedVetForProfile && selectedVetForProfile.id === userId) {
          setSelectedVetForProfile(null);
        }
        fetchVets();
      } else {
        alert('Failed to update doctor verification status.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert(`Copied PVMC License: ${text}`);
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
        alert('Request for additional information sent successfully to doctor.');
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
        <div className="vet-cards-container">
          {filteredVets.map(vet => (
            <div className={`vet-card-item card status-${vet.status}`} key={vet.id}>
              
              <div className="vet-card-layout">
                
                {/* Left Side: Avatar, Name & Metadata */}
                <div className="vet-card-left">
                  <div className="vet-avatar-box">
                    {getInitials(vet.full_name)}
                  </div>

                  <div className="vet-card-info">
                    <div className="vet-title-row">
                      <h3 className="vet-title">{vet.full_name}</h3>
                      <span className="vet-spec-pill">
                        {vet.specialization || 'General Practitioner'}
                      </span>
                    </div>

                    <div className="vet-meta-grid">
                      <div>
                        <strong className="vet-meta-label">License No:</strong>
                        <span className="font-mono vet-meta-val" style={{ marginLeft: '4px' }}>
                          {vet.pvmc_number || 'N/A'}
                        </span>
                        {vet.pvmc_number && (
                          <button 
                            className="vet-inline-copy-btn" 
                            onClick={() => copyToClipboard(vet.pvmc_number)}
                            title="Copy license number"
                          >
                            <Copy size={11} />
                          </button>
                        )}
                      </div>

                      <div>
                        <strong className="vet-meta-label">Phone:</strong>
                        <span className="vet-meta-val" style={{ marginLeft: '4px' }}>
                          {vet.phone_number || 'N/A'}
                        </span>
                      </div>

                      <div>
                        <strong className="vet-meta-label">City / District:</strong>
                        <span className="vet-meta-val" style={{ marginLeft: '4px' }}>
                          {vet.district || 'Lahore'}
                        </span>
                      </div>

                      <div>
                        <strong className="vet-meta-label">Experience:</strong>
                        <span className="vet-meta-val" style={{ marginLeft: '4px' }}>
                          {vet.experience_years ? `${vet.experience_years} years` : 'Clinical practice'}
                        </span>
                      </div>

                      <div>
                        <strong className="vet-meta-label">Joined:</strong>
                        <span className="vet-meta-val" style={{ marginLeft: '4px' }}>
                          {vet.created_at ? new Date(vet.created_at).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) : 'Jun 10, 2026'}
                        </span>
                      </div>

                      <div>
                        <strong className="vet-meta-label">Consultations:</strong>
                        <span className="vet-meta-val" style={{ marginLeft: '4px', color: '#135431' }}>
                          {vet.vet_consultations_count || 0} cases handled
                        </span>
                      </div>
                    </div>

                    {/* License Document Preview Link */}
                    {vet.license_document_url && (
                      <div className="vet-doc-row">
                        <Download size={13} color="#3da860" />
                        <a 
                          href="#license" 
                          className="vet-doc-link"
                          onClick={(e) => {
                            e.preventDefault();
                            const url = vet.license_document_url.replace('10.0.2.2', 'localhost');
                            window.open(url, '_blank');
                          }}
                        >
                          View Official PVMC License Document
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Status, Actions & View Profile Button */}
                <div className="vet-card-right">
                  <span className={`badge ${
                    vet.status === 'verified' || vet.status === 'approved' 
                      ? 'badge-green' 
                      : vet.status === 'info_requested' 
                      ? 'badge-orange' 
                      : vet.status === 'rejected'
                      ? 'badge-red'
                      : 'badge-orange'
                  }`}>
                    {vet.status === 'verified' || vet.status === 'approved' 
                      ? 'VERIFIED DOCTOR' 
                      : vet.status === 'info_requested' 
                      ? 'INFO REQUESTED' 
                      : vet.status.toUpperCase()}
                  </span>

                  <button 
                    className="vet-view-profile-btn" 
                    onClick={() => setSelectedVetForProfile(vet)}
                  >
                    <span>View Full Profile</span>
                    <ExternalLink size={12} />
                  </button>

                  {activeTab === 'pending' && (
                    <div className="vet-action-btns">
                      <button 
                        className="vet-approve-btn" 
                        onClick={() => handleAction(vet.id, 'approve')}
                        title="Approve and verify doctor"
                      >
                        <Check size={14} />
                        <span>Approve</span>
                      </button>
                      <button 
                        className="vet-reject-btn" 
                        onClick={() => handleAction(vet.id, 'reject')}
                        title="Reject application"
                      >
                        <X size={14} />
                        <span>Reject</span>
                      </button>
                      <button 
                        className="vet-req-info-btn" 
                        onClick={() => setSelectedVetForInfo(vet)}
                        title="Request additional information from doctor"
                      >
                        <HelpCircle size={14} />
                        <span>Request Info</span>
                      </button>
                    </div>
                  )}
                </div>

              </div>

            </div>
          ))}

          {filteredVets.length === 0 && (
            <div className="card vet-empty-card">
              No veterinarians found in this status category.
            </div>
          )}
        </div>
      )}

      {/* FULL DOCTOR PROFILE MODAL */}
      {selectedVetForProfile && (
        <div 
          className="vet-modal-backdrop" 
          onClick={() => setSelectedVetForProfile(null)}
        >
          <div 
            className="vet-modal-content card" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '640px' }}
          >
            <div className="vet-profile-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div className="vet-modal-avatar-box">
                  {getInitials(selectedVetForProfile.full_name)}
                </div>
                <div>
                  <h3 className="vet-modal-title">{selectedVetForProfile.full_name}</h3>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                    <span className="vet-spec-pill" style={{ margin: 0 }}>
                      {selectedVetForProfile.specialization || 'Veterinary Doctor'}
                    </span>
                    <span className="font-mono" style={{ fontSize: '11px', color: '#64748b' }}>
                      PVMC #{selectedVetForProfile.pvmc_number || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={`badge ${
                  selectedVetForProfile.status === 'verified' || selectedVetForProfile.status === 'approved' 
                    ? 'badge-green' 
                    : selectedVetForProfile.status === 'rejected'
                    ? 'badge-red'
                    : 'badge-orange'
                }`}>
                  {selectedVetForProfile.status === 'verified' || selectedVetForProfile.status === 'approved' 
                    ? 'VERIFIED' 
                    : selectedVetForProfile.status.toUpperCase()}
                </span>
                <button 
                  onClick={() => setSelectedVetForProfile(null)}
                  className="vet-modal-close-icon"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Profile Info Grid */}
            <div className="vet-modal-grid">
              <div className="vet-modal-box">
                <span className="vet-modal-label">Registered Email</span>
                <strong className="vet-modal-val">{selectedVetForProfile.email || 'N/A'}</strong>
              </div>

              <div className="vet-modal-box">
                <span className="vet-modal-label">Phone Number</span>
                <strong className="vet-modal-val">{selectedVetForProfile.phone_number || 'N/A'}</strong>
              </div>

              <div className="vet-modal-box">
                <span className="vet-modal-label">PVMC Registration Number</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <strong className="vet-modal-val font-mono">{selectedVetForProfile.pvmc_number || 'N/A'}</strong>
                  {selectedVetForProfile.pvmc_number && (
                    <button 
                      className="vet-inline-copy-btn" 
                      onClick={() => copyToClipboard(selectedVetForProfile.pvmc_number)}
                    >
                      <Copy size={11} />
                    </button>
                  )}
                </div>
              </div>

              <div className="vet-modal-box">
                <span className="vet-modal-label">Clinical Experience</span>
                <strong className="vet-modal-val">
                  {selectedVetForProfile.experience_years ? `${selectedVetForProfile.experience_years} years practice` : 'General Clinical Practice'}
                </strong>
              </div>

              <div className="vet-modal-box">
                <span className="vet-modal-label">Clinic / District Location</span>
                <strong className="vet-modal-val">{selectedVetForProfile.district || 'Punjab, Pakistan'}</strong>
              </div>

              <div className="vet-modal-box">
                <span className="vet-modal-label">Registration Date</span>
                <strong className="vet-modal-val">
                  {selectedVetForProfile.created_at ? new Date(selectedVetForProfile.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Jun 10, 2026'}
                </strong>
              </div>
            </div>

            {/* PVMC License Certificate Download Box */}
            <div className="vet-modal-cert-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#135431" />
                <div>
                  <strong style={{ fontSize: '13px', color: '#135431' }}>PVMC Official License Certificate</strong>
                  <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                    {selectedVetForProfile.license_document_url ? 'Official verification document submitted by doctor' : 'No document file uploaded yet'}
                  </p>
                </div>
              </div>

              {selectedVetForProfile.license_document_url ? (
                <button 
                  className="vet-cert-view-btn"
                  onClick={() => {
                    const url = selectedVetForProfile.license_document_url.replace('10.0.2.2', 'localhost');
                    window.open(url, '_blank');
                  }}
                >
                  <Download size={13} />
                  <span>Download / View</span>
                </button>
              ) : (
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Unavailable</span>
              )}
            </div>

            {/* Platform Activity Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', margin: '16px 0 20px 0' }}>
              <div style={{ background: '#eff7f2', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '18px', fontWeight: '800', color: '#135431' }}>
                  {selectedVetForProfile.vet_consultations_count || 0}
                </span>
                <span style={{ fontSize: '11px', color: '#166534', fontWeight: '600' }}>Cases Handled</span>
              </div>

              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '18px', fontWeight: '800', color: '#1d4ed8' }}>
                  {selectedVetForProfile.vet_completed_consultations || 0}
                </span>
                <span style={{ fontSize: '11px', color: '#1e40af', fontWeight: '600' }}>Completed Cases</span>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '18px', fontWeight: '800', color: '#475569' }}>
                  {selectedVetForProfile.vet_reviewed_cases || 0}
                </span>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Reviewed Scans</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="vet-modal-actions" style={{ justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              <div>
                {(selectedVetForProfile.status === 'pending' || selectedVetForProfile.status === 'info_requested') && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => handleAction(selectedVetForProfile.id, 'approve')}
                      className="vet-modal-approve-btn"
                    >
                      Verify Doctor
                    </button>
                    <button 
                      onClick={() => handleAction(selectedVetForProfile.id, 'reject')}
                      className="vet-modal-reject-btn"
                    >
                      Reject Application
                    </button>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setSelectedVetForProfile(null)}
                className="vet-close-btn-main"
              >
                Close
              </button>
            </div>
          </div>
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
            <h3 className="vet-modal-title">Request Additional Information</h3>
            <p className="vet-modal-subtitle">
              Send an email request to <strong>{selectedVetForInfo.full_name}</strong> specifying what information or documents are needed.
            </p>

            <textarea 
              className="vet-modal-textarea"
              placeholder="e.g. Please upload a clearer copy of your PVMC certificate showing the issue and expiry dates..."
              value={infoRequestMessage}
              onChange={(e) => setInfoRequestMessage(e.target.value)}
            />

            <div className="vet-modal-actions">
              <button 
                className="vet-cancel-btn"
                onClick={() => {
                  setSelectedVetForInfo(null);
                  setInfoRequestMessage('');
                }}
              >
                Cancel
              </button>
              <button 
                className="vet-submit-req-btn" 
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
