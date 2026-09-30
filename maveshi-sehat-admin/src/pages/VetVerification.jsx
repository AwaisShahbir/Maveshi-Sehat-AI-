import { useState, useEffect } from 'react';
import { Check, X, HelpCircle, Copy, Download } from 'lucide-react';

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

  const filteredVets = vets.filter(v => v.status === activeTab || (activeTab === 'pending' && v.status === 'info_requested'));

  return (
    <div className="vet-verification-view">
      
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
          Pending Verification ({vets.filter(v => v.status === 'pending' || v.status === 'info_requested').length})
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
          Approved Doctors ({vets.filter(v => v.status === 'approved' || v.status === 'verified').length})
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
          Rejected Applications ({vets.filter(v => v.status === 'rejected').length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading verification records...</div>
      ) : (
        <div className="grid-3">
          {filteredVets.map(vet => (
            <div className="card vet-card" key={vet.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-light)', backgroundColor: '#ffffff' }}>
              
              <div className="vet-card-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px', width: '100%' }}>
                <div className="vet-avatar" style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#eff7f2',
                  color: '#3da860',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: '700',
                  marginBottom: '12px'
                }}>
                  {getInitials(vet.full_name)}
                </div>
                <h3 className="vet-name" style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', margin: '0' }}>{vet.full_name}</h3>
                
                <span className="badge" style={{
                  backgroundColor: '#eff7f2',
                  color: '#3da860',
                  border: '1px solid rgba(61, 168, 96, 0.2)',
                  padding: '4px 12px',
                  borderRadius: '30px',
                  fontSize: '11px',
                  fontWeight: '600',
                  marginTop: '8px'
                }}>
                  {vet.specialization || 'Veterinary Specialist'}
                </span>

                {vet.status === 'info_requested' && (
                  <span className="badge" style={{ marginTop: '8px', backgroundColor: '#FFEBEA', color: '#FF3B30', borderColor: '#FFC7C4', border: '1px solid', padding: '2px 8px', borderRadius: '4px', fontSize: '10px' }}>
                    Information Requested
                  </span>
                )}
              </div>

              <div className="vet-details-list" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', borderTop: '1px solid var(--border-light)', paddingTop: '12px', marginBottom: '16px', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>License No.</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', fontFamily: 'monospace' }}>
                    <span className="font-mono">{vet.pvmc_number || 'N/A'}</span>
                    {vet.pvmc_number && (
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center', padding: '2px' }} onClick={() => copyToClipboard(vet.pvmc_number)}>
                        <Copy size={12} />
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Phone</span>
                  <span style={{ fontWeight: '600' }}>{vet.phone_number}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>City / District</span>
                  <span style={{ fontWeight: '600' }}>{vet.district || 'Punjab'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Joined</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {vet.created_at ? new Date(vet.created_at).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                  </span>
                </div>
              </div>

              {/* License Document Preview Box */}
              <div style={{
                width: '100%',
                backgroundColor: '#f8fafc',
                border: '1px dashed #cbd5e1',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '16px'
              }}>
                <Download size={20} style={{ color: '#94a3b8' }} />
                <a 
                  href="#view" 
                  style={{ fontSize: '12px', color: '#3da860', fontWeight: '600', textDecoration: 'none' }}
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

              <div style={{
                width: '100%',
                backgroundColor: '#e6f0ff',
                color: '#007aff',
                borderRadius: '12px',
                padding: '12px',
                fontSize: '12px',
                textAlign: 'left',
                marginBottom: '16px'
              }}>
                <strong>Experience:</strong> {vet.experience_years ? `${vet.experience_years} years practice` : 'General Clinical Practice'}
              </div>

              {activeTab === 'pending' && (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                    <button 
                      style={{ flex: 1, padding: '8px', backgroundColor: '#3da860', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                      onClick={() => handleAction(vet.id, 'approve')}
                    >
                      <Check size={14} />
                      <span>Approve</span>
                    </button>
                    <button 
                      style={{ flex: 1, padding: '8px', backgroundColor: 'transparent', color: 'var(--color-red)', border: '1px solid var(--color-red)', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                      onClick={() => handleAction(vet.id, 'reject')}
                    >
                      <X size={14} />
                      <span>Reject</span>
                    </button>
                  </div>
                  <button 
                    style={{ width: '100%', padding: '8px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
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
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              No veterinarians found in this status category.
            </div>
          )}
        </div>
      )}

      {/* Request Info Modal */}
      {selectedVetForInfo && (
        <div 
          className="modal-backdrop" 
          onClick={() => setSelectedVetForInfo(null)}
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
            zIndex: 1000
          }}
        >
          <div 
            className="modal-content card" 
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '90%',
              maxWidth: '500px',
              padding: '24px',
              backgroundColor: '#fff',
              borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              border: 'none'
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: '#0f172a' }}>
              Request Additional Information - {selectedVetForInfo.full_name}
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              Specify the clarification or document re-upload required from this veterinarian.
            </p>
            
            <textarea
              value={infoRequestMessage}
              onChange={(e) => setInfoRequestMessage(e.target.value)}
              placeholder="e.g. Please upload a clear photo of your renewed PVMC card."
              style={{
                width: '100%',
                height: '120px',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                marginBottom: '20px',
                fontFamily: 'inherit',
                fontSize: '13px',
                resize: 'none'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  setSelectedVetForInfo(null);
                  setInfoRequestMessage('');
                }}
                style={{ padding: '8px 16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', cursor: 'pointer', borderRadius: '6px', fontSize: '13px' }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={submitInfoRequest}
                disabled={!infoRequestMessage.trim()}
                style={{ padding: '8px 16px', backgroundColor: '#ff9800', cursor: 'pointer', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}
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
