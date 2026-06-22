import React, { useState, useEffect } from 'react';
import { Shield, Phone, MapPin, Award, Check, X, FileText, HelpCircle, Copy, Download } from 'lucide-react';

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

  const displayVets = filteredVets;

  return (
    <div className="vet-verification-view">
      
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
          Pending ({vets.filter(v => v.status === 'pending' || v.status === 'info_requested').length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'verified' ? 'active' : ''}`}
          style={{
            padding: '12px 4px',
            fontSize: '15px',
            fontWeight: '600',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: '2px solid',
            borderBottomColor: activeTab === 'verified' ? '#3da860' : 'transparent',
            color: activeTab === 'verified' ? '#3da860' : 'var(--text-muted)',
            cursor: 'pointer'
          }}
          onClick={() => setActiveTab('verified')}
        >
          Verified ({vets.filter(v => v.status === 'verified').length})
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
          Rejected ({vets.filter(v => v.status === 'rejected').length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading verification data... / لوڈ ہو رہا ہے...</div>
      ) : (
        <div className="vet-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {displayVets.map(vet => (
            <div className="vet-card card" key={vet.id} style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid var(--border-light)',
              backgroundColor: '#ffffff',
              alignItems: 'center',
              textAlign: 'center'
            }}>
              
              <div className="vet-card-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', marginBottom: '16px' }}>
                <div className="vet-avatar" style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#3da860',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '20px',
                  marginBottom: '12px'
                }}>
                  {getInitials(vet.full_name)}
                </div>
                <h3 className="vet-name" style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', margin: '0' }}>{vet.full_name}</h3>
                <span className="vet-urdu-name urdu" style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginTop: '2px', marginBottom: '8px' }}>
                  {vet.role_urdu || 'ڈاکٹر'}
                </span>
                
                <span className="badge" style={{
                  backgroundColor: '#eff7f2',
                  color: '#3da860',
                  border: '1px solid rgba(61, 168, 96, 0.2)',
                  padding: '4px 12px',
                  borderRadius: '30px',
                  fontSize: '11px',
                  fontWeight: '600'
                }}>
                  {vet.specialization || 'Livestock Generalist'}
                </span>

                {vet.status === 'info_requested' && (
                  <span className="badge badge-orange" style={{ marginTop: '8px', backgroundColor: '#FFEBEA', color: '#FF3B30', borderColor: '#FFC7C4', border: '1px solid', padding: '2px 8px', borderRadius: '4px', fontSize: '10px' }}>
                    Info Requested / معلومات طلب کی گئی
                  </span>
                )}
              </div>

              
              <div className="vet-details-list" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', borderTop: '1px solid var(--border-light)', paddingTop: '12px', marginBottom: '16px', textAlign: 'left' }}>
                <div className="vet-detail-item" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="vd-label" style={{ color: 'var(--text-muted)' }}>License No.</span>
                  <div className="vd-license-box" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', fontFamily: 'monospace' }}>
                    <span className="vd-value font-mono">{vet.pvmc_number || 'N/A'}</span>
                    {vet.pvmc_number && (
                      <button className="vd-copy-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center', padding: '2px' }} onClick={() => copyToClipboard(vet.pvmc_number)}>
                        <Copy size={12} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="vet-detail-item" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="vd-label" style={{ color: 'var(--text-muted)' }}>Phone</span>
                  <span className="vd-value" style={{ fontWeight: '600' }}>{vet.phone_number}</span>
                </div>

                <div className="vet-detail-item" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="vd-label" style={{ color: 'var(--text-muted)' }}>City</span>
                  <span className="vd-value" style={{ fontWeight: '600' }}>{vet.district || 'Pakistan'}</span>
                </div>

                <div className="vet-detail-item" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="vd-label" style={{ color: 'var(--text-muted)' }}>Submitted</span>
                  <span className="vd-value text-muted" style={{ fontSize: '12px' }}>
                    {vet.created_at ? new Date(vet.created_at).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) : '3 days ago'}
                  </span>
                </div>
              </div>

              
              <div className="license-doc-box" style={{
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
                  className="doc-link" 
                  style={{ fontSize: '12px', color: '#3da860', fontWeight: '600', textDecoration: 'none' }}
                  onClick={(e) => { 
                    e.preventDefault(); 
                    if (vet.license_document_url) {
                      const url = vet.license_document_url.replace('10.0.2.2', 'localhost');
                      window.open(url, '_blank');
                    } else {
                      alert('Viewing license document... / لائسنس دستاویزی تصویر');
                    }
                  }}
                >
                  View License Document
                </a>
              </div>

              
              <div className="experience-box" style={{
                width: '100%',
                backgroundColor: '#e6f0ff',
                color: '#007aff',
                borderRadius: '12px',
                padding: '12px',
                fontSize: '12px',
                textAlign: 'left',
                marginBottom: '16px',
                lineHeight: '1.4'
              }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <Award size={16} style={{ color: '#007aff', flexShrink: 0, marginTop: '2px' }} />
                  <span>
                    <strong>{vet.experience_years || 8} years experience</strong>
                    <span style={{ display: 'block', fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>Specializes in cattle & buffalo</span>
                  </span>
                </div>
              </div>

              
              {(vet.status === 'pending' || vet.status === 'info_requested' || filteredVets.length === 0) && (
                <div className="vet-card-actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                  <button className="btn btn-primary approve-btn" style={{ width: '100%', height: '40px', backgroundColor: '#3da860', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={() => handleAction(vet.id, 'approve')}>
                    <Check size={14} />
                    <span>Approve Vet / منظور کریں</span>
                  </button>
                  <button className="btn btn-danger reject-btn" style={{ width: '100%', height: '40px', backgroundColor: '#d32f2f', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={() => handleAction(vet.id, 'reject')}>
                    <X size={14} />
                    <span>Reject Application / مسترد کریں</span>
                  </button>
                  <button className="btn btn-secondary info-btn" style={{ width: '100%', height: '40px', backgroundColor: '#ffffff', color: 'var(--text-main)', border: '1px solid var(--border-light)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={() => setSelectedVetForInfo(vet)}>
                    <HelpCircle size={14} />
                    <span>Request More Info / مزید معلومات</span>
                  </button>
                </div>
              )}
            </div>
          ))}

          {displayVets.length === 0 && (
            <div className="empty-state card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 40px', textAlign: 'center', width: '100%' }}>
              <Shield size={48} className="text-muted" style={{ marginBottom: '16px' }} />
              <h3>No Veterinarians Found</h3>
              <p>There are no vet profiles in this category.</p>
            </div>
          )}
        </div>
      )}

      
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
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            border: 'none'
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
                style={{ padding: '8px 16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', cursor: 'pointer', borderRadius: '6px' }}
              >
                Cancel / منسوخ
              </button>
              <button 
                className="btn btn-primary" 
                onClick={submitInfoRequest}
                disabled={!infoRequestMessage.trim()}
                style={{ padding: '8px 16px', backgroundColor: 'var(--color-orange)', borderColor: 'var(--color-orange)', cursor: 'pointer', color: '#ffffff', border: 'none', borderRadius: '6px' }}
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
