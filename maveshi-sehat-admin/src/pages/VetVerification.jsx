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
                        <span className="font-mono vet-meta-val ml-1">
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
                        <span className="vet-meta-val ml-1">
                          {vet.phone_number || 'N/A'}
                        </span>
                      </div>

                      <div>
                        <strong className="vet-meta-label">City / District:</strong>
                        <span className="vet-meta-val ml-1">
                          {vet.district || 'N/A'}
                        </span>
                      </div>

                      <div>
                        <strong className="vet-meta-label">Experience:</strong>
                        <span className="vet-meta-val ml-1">
                          {vet.experience_years ? `${vet.experience_years} years` : 'Clinical practice'}
                        </span>
                      </div>

                      <div>
                        <strong className="vet-meta-label">Joined:</strong>
                        <span className="vet-meta-val ml-1">
                          {vet.created_at ? new Date(vet.created_at).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                        </span>
                      </div>

                      <div>
                        <strong className="vet-meta-label">Consultations:</strong>
                        <span className="vet-meta-val ml-1 text-[#135431]">
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
            className="vet-modal-content card verification-modal-card" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="vet-profile-modal-header verification-modal-sticky-header">
              <div className="flex items-center gap-3.5">
                <div className="vet-modal-avatar-box">
                  {getInitials(selectedVetForProfile.full_name)}
                </div>
                <div>
                  <h3 className="vet-modal-title">{selectedVetForProfile.full_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="vet-spec-pill m-0">
                      {selectedVetForProfile.specialization || 'Veterinary Doctor'}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">
                      PVMC #{selectedVetForProfile.pvmc_number || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
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
                <div className="flex items-center gap-1.5">
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
                <strong className="vet-modal-val">{selectedVetForProfile.district || 'N/A'}</strong>
              </div>

              <div className="vet-modal-box col-span-2">
                <span className="vet-modal-label">Registration Date</span>
                <strong className="vet-modal-val">
                  {selectedVetForProfile.created_at ? new Date(selectedVetForProfile.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                </strong>
              </div>
            </div>

            {/* Official Regulatory Documents & CNIC Cross-Check */}
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
                {/* Document 1: Official PVMC License */}
                <div className="verification-doc-card">
                  <div>
                    <div className="verification-doc-title-row">
                      <div className="flex items-center gap-1.5">
                        <Award size={16} color="#135431" />
                        <strong className="text-[13px] text-[#135431]">PVMC Official License</strong>
                      </div>
                      {selectedVetForProfile.license_document_url && (
                        <span className="verification-doc-badge-green">
                          Uploaded
                        </span>
                      )}
                    </div>
                    <p className="mb-1 text-[11px] text-slate-500">
                      License No: <strong className="text-slate-900 font-mono">{selectedVetForProfile.pvmc_number || 'N/A'}</strong>
                    </p>
                    <p className="m-0 text-[11px] text-slate-500">
                      Specialty: <strong>{selectedVetForProfile.specialization || 'N/A'}</strong>
                    </p>

                    {/* License Image Preview */}
                    {selectedVetForProfile.license_document_url && isImageFile(selectedVetForProfile.license_document_url) && (
                      <div onClick={() => window.open(resolveImageUrl(selectedVetForProfile.license_document_url), '_blank')} className="verification-doc-preview-box" title="Click to view full license image">
                        <img 
                          src={resolveImageUrl(selectedVetForProfile.license_document_url)} 
                          alt="PVMC License"
                          className="verification-doc-img"
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-2.5">
                    {selectedVetForProfile.license_document_url ? (
                      <button type="button" onClick={() => { const url = resolveImageUrl(selectedVetForProfile.license_document_url); window.open(url, '_blank'); }} className="verification-doc-btn-green">
                        <Download size={13} />
                        <span>View / Download License ↗</span>
                      </button>
                    ) : (
                      <span className="verification-doc-empty-hint">
                        No license document uploaded
                      </span>
                    )}
                  </div>
                </div>

                {/* Document 2: Doctor National CNIC */}
                <div className="verification-doc-card">
                  <div>
                    <div className="verification-doc-title-row">
                      <div className="flex items-center gap-1.5">
                        <UserCheck size={16} color="#007aff" />
                        <strong className="text-[13px] text-[#007aff]">Doctor National CNIC</strong>
                      </div>
                      {selectedVetForProfile.cnic_document_url && (
                        <span className="verification-doc-badge-blue">
                          Uploaded
                        </span>
                      )}
                    </div>
                    <p className="mb-1 text-[11px] text-slate-500">
                      Doctor: <strong className="text-slate-900">{selectedVetForProfile.full_name}</strong>
                    </p>
                    <p className="m-0 text-[11px] text-slate-500">
                      CNIC No: <strong className="text-slate-900 font-mono">{selectedVetForProfile.cnic || 'N/A'}</strong>
                    </p>

                    {/* CNIC Image Preview */}
                    {selectedVetForProfile.cnic_document_url && isImageFile(selectedVetForProfile.cnic_document_url) && (
                      <div onClick={() => window.open(resolveImageUrl(selectedVetForProfile.cnic_document_url), '_blank')} className="verification-doc-preview-box" title="Click to view full CNIC image">
                        <img 
                          src={resolveImageUrl(selectedVetForProfile.cnic_document_url)} 
                          alt="Doctor CNIC"
                          className="verification-doc-img"
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-2.5">
                    {selectedVetForProfile.cnic_document_url ? (
                      <button type="button" onClick={() => { const url = resolveImageUrl(selectedVetForProfile.cnic_document_url); window.open(url, '_blank'); }} className="verification-doc-btn-blue">
                        <Download size={13} />
                        <span>View / Download CNIC ↗</span>
                      </button>
                    ) : (
                      <span className="verification-doc-empty-hint">
                        No CNIC document uploaded
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Match Verification Helper Checklist */}
              <div className="verification-checklist-box">
                <span className="verification-checklist-title">
                  Verification Cross-Check Checklist:
                </span>
                <div className="verification-checklist-chips">
                  <span className="verification-checklist-chip">
                    <CheckCircle2 size={13} color="#16a34a" /> Doctor: <strong>{selectedVetForProfile.full_name}</strong>
                  </span>
                  <span className="verification-checklist-chip">
                    <CheckCircle2 size={13} color="#16a34a" /> CNIC: <strong>{selectedVetForProfile.cnic || 'N/A'}</strong>
                  </span>
                  <span className="verification-checklist-chip">
                    <CheckCircle2 size={13} color="#16a34a" /> PVMC License: <strong>{selectedVetForProfile.pvmc_number || 'N/A'}</strong>
                  </span>
                </div>

                {/* Direct Verification Action inside Modal if Pending */}
                {(selectedVetForProfile.status === 'pending' || selectedVetForProfile.status === 'info_requested') && (
                  <div className="verification-quick-actions-row">
                    <button
                      type="button"
                      onClick={() => handleAction(selectedVetForProfile.id, 'approve')}
                      className="verification-btn-approve-quick"
                    >
                      <Check size={16} />
                      <span>Verify Doctor & Grant Platform Access</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction(selectedVetForProfile.id, 'reject')}
                      className="verification-btn-reject-quick"
                    >
                      <X size={16} />
                      <span>Reject Application</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Platform Activity Stats */}
            <div className="verification-stats-summary-grid">
              <div className="verification-stat-box green">
                <span className="verification-stat-number">
                  {selectedVetForProfile.vet_consultations_count || 0}
                </span>
                <span className="verification-stat-label">Cases Handled</span>
              </div>

              <div className="verification-stat-box blue">
                <span className="verification-stat-number">
                  {selectedVetForProfile.vet_completed_consultations || 0}
                </span>
                <span className="verification-stat-label">Completed Cases</span>
              </div>

              <div className="verification-stat-box gray">
                <span className="verification-stat-number">
                  {selectedVetForProfile.vet_reviewed_cases || 0}
                </span>
                <span className="verification-stat-label">Reviewed Scans</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="vet-modal-actions justify-between border-t border-slate-100 pt-4">
              <div>
                {(selectedVetForProfile.status === 'pending' || selectedVetForProfile.status === 'info_requested') && (
                  <div className="flex gap-2">
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
