import { API_BASE_URL, resolveImageUrl } from '../config';
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
  FileText,
  ShieldCheck,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import '../styles/VetVerification.css';

const isImageFile = (url) => {
  if (!url) return false;
  const clean = url.split('?')[0].toLowerCase();
  return clean.endsWith('.jpg') || clean.endsWith('.jpeg') || clean.endsWith('.png') || clean.endsWith('.webp') || url.startsWith('data:image/');
};

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
      const res = await fetch(`${API_BASE_URL}/api/admin/users`);
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
      const res = await fetch(`${API_BASE_URL}/api/admin/users/action`, {
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
      const res = await fetch(`${API_BASE_URL}/api/admin/users/action`, {
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
              
              <div className="vet-card-body">
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
                          {vet.district || 'Punjab'}
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
                          {vet.created_at ? new Date(vet.created_at).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                        </span>
                      </div>

                      <div>
                        <strong className="vet-meta-label">Consultations:</strong>
                        <span className="vet-meta-val" style={{ marginLeft: '4px', color: '#135431' }}>
                          {vet.vet_consultations_count || 0} cases handled
                        </span>
                      </div>
                    </div>

                    {/* Registration Verification Documents Strip (PVMC & CNIC) */}
                    <div className="vet-docs-verification-strip">
                      <div className="vet-docs-strip-header">
                        <div className="vet-docs-strip-title">
                          <FileText size={14} color="#135431" />
                          <span>Verification Documents (PVMC & CNIC)</span>
                        </div>
                        {vet.license_document_url && vet.cnic_document_url ? (
                          <span className="vet-doc-count-badge success">
                            <CheckCircle2 size={12} />
                            <span>Both Documents Attached</span>
                          </span>
                        ) : vet.license_document_url || vet.cnic_document_url ? (
                          <span className="vet-doc-count-badge warning">
                            <AlertCircle size={12} />
                            <span>1 of 2 Documents Attached</span>
                          </span>
                        ) : (
                          <span className="vet-doc-count-badge empty">
                            <AlertCircle size={12} />
                            <span>No Documents Uploaded</span>
                          </span>
                        )}
                      </div>

                      <div className="vet-docs-grid">
                        {/* Document 1: PVMC License Document */}
                        <div className={`vet-doc-card-tile ${vet.license_document_url ? 'attached' : 'empty'}`}>
                          <div className="vet-doc-tile-left">
                            <div className="vet-doc-type-icon pvmc">
                              <Award size={15} />
                            </div>
                            <div className="vet-doc-text-block">
                              <span className="vet-doc-type-title">PVMC License</span>
                              <span className="vet-doc-type-val font-mono">{vet.pvmc_number || 'N/A'}</span>
                            </div>
                          </div>
                          {vet.license_document_url ? (
                            <a
                              href={resolveImageUrl(vet.license_document_url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="vet-doc-view-btn license-btn"
                              onClick={(e) => e.stopPropagation()}
                              title="Open official PVMC License document in new window"
                            >
                              <Download size={13} />
                              <span>View License ↗</span>
                            </a>
                          ) : (
                            <span className="vet-doc-missing-chip">Not Attached</span>
                          )}
                        </div>

                        {/* Document 2: Doctor CNIC Document */}
                        <div className={`vet-doc-card-tile ${vet.cnic_document_url ? 'attached' : 'empty'}`}>
                          <div className="vet-doc-tile-left">
                            <div className="vet-doc-type-icon cnic">
                              <UserCheck size={15} />
                            </div>
                            <div className="vet-doc-text-block">
                              <span className="vet-doc-type-title">Doctor National CNIC</span>
                              <span className="vet-doc-type-val font-mono">{vet.cnic || 'CNIC Pending'}</span>
                            </div>
                          </div>
                          {vet.cnic_document_url ? (
                            <a
                              href={resolveImageUrl(vet.cnic_document_url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="vet-doc-view-btn cnic-btn"
                              onClick={(e) => e.stopPropagation()}
                              title="Open Doctor CNIC document in new window"
                            >
                              <Download size={13} />
                              <span>View CNIC ↗</span>
                            </a>
                          ) : (
                            <span className="vet-doc-missing-chip">Not Attached</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
              </div>

              {/* Card Footer: Status on one end, View Full Profile on opposite end */}
              <div className="vet-card-footer">
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

                <div className="vet-card-footer-actions">
                  {activeTab === 'pending' && (
                    <div className="vet-action-btns">
                      <button 
                        className="vet-btn-inspect-quick" 
                        onClick={() => setSelectedVetForProfile(vet)}
                        title="Compare PVMC license against Doctor CNIC before deciding"
                      >
                        <ShieldCheck size={13} />
                        <span>Compare Docs</span>
                      </button>
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
                    </div>
                  )}

                  <button 
                    className="vet-view-profile-btn" 
                    onClick={() => setSelectedVetForProfile(vet)}
                    title="Inspect licensing credentials and owner CNIC side-by-side"
                  >
                    <ShieldCheck size={13} />
                    <span>Inspect & Verify Docs</span>
                  </button>
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
            style={{ maxWidth: '720px', maxHeight: 'calc(100vh - 48px)', overflowY: 'auto' }}
          >
            <div 
              className="vet-profile-modal-header"
              style={{
                position: 'sticky',
                top: '-28px',
                backgroundColor: '#ffffff',
                zIndex: 20,
                paddingTop: '4px',
                paddingBottom: '12px',
                borderBottom: '1px solid #f1f5f9'
              }}
            >
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
                <span className="vet-modal-label">Doctor National CNIC</span>
                <strong className="vet-modal-val font-mono">{selectedVetForProfile.cnic || 'N/A'}</strong>
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

              <div className="vet-modal-box" style={{ gridColumn: 'span 2' }}>
                <span className="vet-modal-label">Registration Date</span>
                <strong className="vet-modal-val">
                  {selectedVetForProfile.created_at ? new Date(selectedVetForProfile.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                </strong>
              </div>
            </div>

            {/* Official Regulatory Documents & CNIC Cross-Check */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', margin: '16px 0 20px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} color="#135431" />
                  <strong style={{ fontSize: '14px', color: '#0f172a' }}>Official Regulatory Documents & CNIC Cross-Check</strong>
                </div>
                <span style={{ fontSize: '11px', background: '#e0f2fe', color: '#0284c7', fontWeight: '700', padding: '2px 8px', borderRadius: '6px' }}>
                  Regulatory Review
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                {/* Document 1: Official PVMC License */}
                <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Award size={16} color="#135431" />
                        <strong style={{ fontSize: '13px', color: '#135431' }}>PVMC Official License</strong>
                      </div>
                      {selectedVetForProfile.license_document_url && (
                        <span style={{ fontSize: '10px', background: '#dcfce7', color: '#15803d', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>
                          Uploaded
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#64748b' }}>
                      License No: <strong style={{ color: '#0f172a' }} className="font-mono">{selectedVetForProfile.pvmc_number || 'N/A'}</strong>
                    </p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                      Specialty: <strong>{selectedVetForProfile.specialization || 'General Vet'}</strong>
                    </p>

                    {/* License Image Preview */}
                    {selectedVetForProfile.license_document_url && isImageFile(selectedVetForProfile.license_document_url) && (
                      <div 
                        onClick={() => window.open(resolveImageUrl(selectedVetForProfile.license_document_url), '_blank')}
                        style={{
                          margin: '10px 0 6px 0',
                          height: '140px',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        title="Click to view full license image"
                      >
                        <img 
                          src={resolveImageUrl(selectedVetForProfile.license_document_url)} 
                          alt="PVMC License"
                          style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                        />
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: '10px' }}>
                    {selectedVetForProfile.license_document_url ? (
                      <button
                        type="button"
                        onClick={() => {
                          const url = resolveImageUrl(selectedVetForProfile.license_document_url);
                          window.open(url, '_blank');
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          background: '#eff7f2',
                          color: '#135431',
                          border: '1px solid #bbf7d0',
                          padding: '7px 10px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        <Download size={13} />
                        <span>View / Download License ↗</span>
                      </button>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', display: 'block', textAlign: 'center', padding: '6px', background: '#f8fafc', borderRadius: '6px' }}>
                        No license document uploaded
                      </span>
                    )}
                  </div>
                </div>

                {/* Document 2: Doctor National CNIC */}
                <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <UserCheck size={16} color="#007aff" />
                        <strong style={{ fontSize: '13px', color: '#007aff' }}>Doctor National CNIC</strong>
                      </div>
                      {selectedVetForProfile.cnic_document_url && (
                        <span style={{ fontSize: '10px', background: '#dbeafe', color: '#1d4ed8', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>
                          Uploaded
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#64748b' }}>
                      Doctor: <strong style={{ color: '#0f172a' }}>{selectedVetForProfile.full_name}</strong>
                    </p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                      CNIC No: <strong style={{ color: '#0f172a' }} className="font-mono">{selectedVetForProfile.cnic || 'N/A'}</strong>
                    </p>

                    {/* CNIC Image Preview */}
                    {selectedVetForProfile.cnic_document_url && isImageFile(selectedVetForProfile.cnic_document_url) && (
                      <div 
                        onClick={() => window.open(resolveImageUrl(selectedVetForProfile.cnic_document_url), '_blank')}
                        style={{
                          margin: '10px 0 6px 0',
                          height: '140px',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        title="Click to view full CNIC image"
                      >
                        <img 
                          src={resolveImageUrl(selectedVetForProfile.cnic_document_url)} 
                          alt="Doctor CNIC"
                          style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                        />
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: '10px' }}>
                    {selectedVetForProfile.cnic_document_url ? (
                      <button
                        type="button"
                        onClick={() => {
                          const url = resolveImageUrl(selectedVetForProfile.cnic_document_url);
                          window.open(url, '_blank');
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          border: '1px solid #bfdbfe',
                          padding: '7px 10px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        <Download size={13} />
                        <span>View / Download CNIC ↗</span>
                      </button>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', display: 'block', textAlign: 'center', padding: '6px', background: '#f8fafc', borderRadius: '6px' }}>
                        No CNIC document uploaded
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Match Verification Helper Checklist */}
              <div style={{ background: '#ffffff', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '12px 14px' }}>
                <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                  Verification Cross-Check Checklist:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '11px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', color: '#334155', padding: '4px 10px', borderRadius: '6px' }}>
                    <CheckCircle2 size={13} color="#16a34a" /> Doctor: <strong>{selectedVetForProfile.full_name}</strong>
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', color: '#334155', padding: '4px 10px', borderRadius: '6px' }}>
                    <CheckCircle2 size={13} color="#16a34a" /> CNIC: <strong>{selectedVetForProfile.cnic || 'N/A'}</strong>
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', color: '#334155', padding: '4px 10px', borderRadius: '6px' }}>
                    <CheckCircle2 size={13} color="#16a34a" /> PVMC License: <strong>{selectedVetForProfile.pvmc_number || 'N/A'}</strong>
                  </span>
                </div>

                {/* Direct Verification Action inside Modal if Pending */}
                {(selectedVetForProfile.status === 'pending' || selectedVetForProfile.status === 'info_requested') && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => handleAction(selectedVetForProfile.id, 'approve')}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        background: '#10b981',
                        color: '#ffffff',
                        border: 'none',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
                      }}
                    >
                      <Check size={16} />
                      <span>Verify Doctor & Grant Platform Access</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction(selectedVetForProfile.id, 'reject')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        background: '#ffffff',
                        color: '#ef4444',
                        border: '1px solid #fca5a5',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      <X size={16} />
                      <span>Reject Application</span>
                    </button>
                  </div>
                )}
              </div>
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
