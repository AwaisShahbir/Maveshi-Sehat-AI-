import React, { useState, useEffect } from 'react';
import { Shield, Phone, MapPin, Award, Check, X, FileText, HelpCircle, Copy } from 'lucide-react';

export default function VetVerification() {
  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'verified', 'rejected'

  const fetchVets = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/users');
      if (res.ok) {
        const users = await res.json();
        // Filter only vets
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
        alert(`Vet successfully ${action === 'approve' ? 'verified' : 'rejected'}!`);
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
    return name
      .replace('Dr.', '')
      .trim()
      .split(' ')
      .slice(0, 2)
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };  const [selectedVetForInfo, setSelectedVetForInfo] = useState(null);
  const [infoRequestMessage, setInfoRequestMessage] = useState('');

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
        alert('Request for information sent successfully!');
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

  const getSpecializationClass = (spec) => {
    if (!spec) return 'badge-blue';
    const s = spec.toLowerCase();
    if (s.includes('dairy') || s.includes('cattle')) return 'badge-blue';
    if (s.includes('large')) return 'badge-green';
    if (s.includes('surgical') || s.includes('procedures')) return 'badge-red';
    return 'badge-orange';
  };

  return (
    <div className="vet-verification-view">
      
      {/* Tabs */}
      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending ({vets.filter(v => v.status === 'pending' || v.status === 'info_requested').length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'verified' ? 'active' : ''}`}
          onClick={() => setActiveTab('verified')}
        >
          Verified ({vets.filter(v => v.status === 'verified').length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'rejected' ? 'active' : ''}`}
          onClick={() => setActiveTab('rejected')}
        >
          Rejected ({vets.filter(v => v.status === 'rejected').length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading verification data... / لوڈ ہو رہا ہے...</div>
      ) : (
        <div className="vet-grid">
          {filteredVets.map(vet => (
            <div className="vet-card card" key={vet.id}>
              {/* Profile Header */}
              <div className="vet-card-header">
                <div className="vet-avatar">{getInitials(vet.full_name)}</div>
                <h3 className="vet-name">{vet.full_name}</h3>
                <span className="vet-urdu-name">ڈاکٹر</span>
                
                {/* Specialization Badge */}
                <span className={`badge ${getSpecializationClass(vet.specialization)}`} style={{ marginTop: '8px' }}>
                  {vet.specialization || 'Livestock Generalist'}
                </span>

                {vet.status === 'info_requested' && (
                  <span className="badge badge-orange" style={{ marginTop: '8px', backgroundColor: '#FFEBEA', color: '#FF3B30', borderColor: '#FFC7C4', border: '1px solid' }}>
                    Info Requested / معلومات طلب کی گئی
                  </span>
                )}
              </div>

              {/* Vet Details */}
              <div className="vet-details-list">
                {/* License */}
                <div className="vet-detail-item">
                  <span className="vd-label">License No.</span>
                  <div className="vd-license-box">
                    <span className="vd-value font-mono">{vet.pvmc_number || 'N/A'}</span>
                    {vet.pvmc_number && (
                      <button className="vd-copy-btn" onClick={() => copyToClipboard(vet.pvmc_number)}>
                        <Copy size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Phone */}
                <div className="vet-detail-item">
                  <span className="vd-label">Phone</span>
                  <span className="vd-value">{vet.phone_number}</span>
                </div>

                {/* City */}
                <div className="vet-detail-item">
                  <span className="vd-label">City</span>
                  <span className="vd-value">{vet.district || 'Pakistan'}</span>
                </div>

                {/* Submitted date */}
                <div className="vet-detail-item">
                  <span className="vd-label">Submitted</span>
                  <span className="vd-value text-muted" style={{ fontSize: '12px' }}>
                    {new Date(vet.created_at).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* License Document Preview Box */}
              <div className="license-doc-box">
                <FileText size={24} className="doc-icon" />
                <div className="doc-info">
                  <span className="doc-title">License Document</span>
                  <a 
                    href="#view" 
                    className="doc-link" 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      if (vet.license_document_url) {
                        const url = vet.license_document_url.replace('10.0.2.2', 'localhost');
                        window.open(url, '_blank');
                      } else {
                        alert('No document uploaded');
                      }
                    }}
                  >
                    View License Document
                  </a>
                </div>
              </div>

              {/* Experience Info */}
              <div className="experience-box">
                <Award size={16} style={{ color: 'var(--color-blue)' }} />
                <span className="exp-text">
                  <strong>{vet.experience_years || 2} years experience</strong>
                  <br />
                  <span style={{ fontSize: '11px', opacity: 0.8 }}>Specializes in {vet.specialization || 'cattle & buffalo'}</span>
                </span>
              </div>

              {/* Action Buttons (Show for pending or info_requested status) */}
              {(vet.status === 'pending' || vet.status === 'info_requested') && (
                <div className="vet-card-actions">
                  <button className="btn btn-primary approve-btn" onClick={() => handleAction(vet.id, 'approve')}>
                    <Check size={16} />
                    <span>Approve Vet / منظور کریں</span>
                  </button>
                  <button className="btn btn-danger reject-btn" onClick={() => handleAction(vet.id, 'reject')}>
                    <X size={16} />
                    <span>Reject Application / مسترد کریں</span>
                  </button>
                  <button className="btn btn-secondary info-btn" onClick={() => setSelectedVetForInfo(vet)}>
                    <HelpCircle size={16} />
                    <span>Request More Info / مزید معلومات</span>
                  </button>
                </div>
              )}
            </div>
          ))}

          {filteredVets.length === 0 && (
            <div className="empty-state card">
              <Shield size={48} className="text-muted" style={{ marginBottom: '16px' }} />
              <h3>No Veterinarians Found</h3>
              <p>There are no vet profiles in this category.</p>
            </div>
          )}
        </div>
      )}

      {/* Info Request Modal Overlay */}
      {selectedVetForInfo && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="modal-content card" style={{
            width: '90%',
            maxWidth: '500px',
            padding: '24px',
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Request More Info - {selectedVetForInfo.full_name}</h3>
            <p style={{ fontSize: '14px', color: '#555', marginBottom: '8px' }}>Enter what details or documents you need from the Vet. They will receive an email request.</p>
            
            <textarea
              value={infoRequestMessage}
              onChange={(e) => setInfoRequestMessage(e.target.value)}
              placeholder="e.g. Please upload a clearer scan of your PVMC card. / برائے مہربانی اپنے پی وی ایم سی کارڈ کی واضح تصویر اپ لوڈ کریں۔"
              style={{
                width: '100%',
                height: '120px',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #ccc',
                marginBottom: '20px',
                fontFamily: 'inherit',
                fontSize: '14px',
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
                style={{ padding: '8px 16px' }}
              >
                Cancel / منسوخ
              </button>
              <button 
                className="btn btn-primary" 
                onClick={submitInfoRequest}
                disabled={!infoRequestMessage.trim()}
                style={{ padding: '8px 16px', backgroundColor: 'var(--color-orange)', borderColor: 'var(--color-orange)' }}
              >
                Send Request / بھیجیں
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
