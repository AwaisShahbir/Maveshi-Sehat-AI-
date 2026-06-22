import React, { useState, useEffect } from 'react';
import { Store, Phone, MapPin, Check, X, Clipboard, ExternalLink, ShieldCheck } from 'lucide-react';

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
        alert(`Pharmacy ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
        fetchPharmacies();
      } else {
        alert('Failed to update pharmacy status.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert(`Copied: ${text}`);
  };

  const filteredPharmacies = pharmacies.filter(p => p.status === activeTab);
  const approvedPharmacies = pharmacies.filter(p => p.status === 'approved');

  const displayPharmacies = filteredPharmacies;

  return (
    <div className="pharmacy-approval-view">
      
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
          Pending ({pharmacies.filter(p => p.status === 'pending').length})
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
          Approved ({pharmacies.filter(p => p.status === 'approved').length})
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
          Rejected ({pharmacies.filter(p => p.status === 'rejected').length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading pharmacy approvals... / لوڈ ہو رہا ہے...</div>
      ) : (
        <div className="pharmacy-layout">
          
          <div className="pharmacy-cards-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
            {displayPharmacies.map(pharm => (
              <div className="pharmacy-card card" key={pharm.id} style={{ borderLeft: '4px solid var(--color-orange)', padding: '24px', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                  
                  <div style={{ display: 'flex', gap: '16px', flex: 1, minWidth: '280px' }}>
                    <div className="p-avatar-box" style={{ width: '48px', height: '48px', backgroundColor: '#fff3e0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>
                      <Store size={24} style={{ color: 'var(--color-orange)' }} />
                    </div>
                    <div>
                      <h3 className="pharmacy-name" style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>{pharm.name}</h3>
                      <span className="pharmacy-urdu-name urdu" style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '12px', marginTop: '2px' }}>
                        {pharm.name_urdu || 'فارمیسی'}
                      </span>
                      
                      <div className="pharmacy-grid-details" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px 20px', fontSize: '13px' }}>
                        <div><strong style={{ color: 'var(--text-muted)' }}>License:</strong> <span className="font-mono" style={{ fontWeight: 600 }}>{pharm.license_number}</span></div>
                        <div><strong style={{ color: 'var(--text-muted)' }}>Owner:</strong> <span style={{ fontWeight: 600 }}>{pharm.owner_name}</span></div>
                        <div><strong style={{ color: 'var(--text-muted)' }}>Address:</strong> <span style={{ fontWeight: 600 }}>{pharm.address}</span></div>
                        <div><strong style={{ color: 'var(--text-muted)' }}>Phone:</strong> <span style={{ fontWeight: 600 }}>{pharm.phone}</span></div>
                        <div><strong style={{ color: 'var(--text-muted)' }}>Submitted:</strong> <span style={{ fontWeight: 600 }}>{pharm.created_at ? new Date(pharm.created_at).toLocaleDateString([], { day: 'numeric', month: 'short' }) : '2 days ago'}</span></div>
                        <div><strong style={{ color: 'var(--text-muted)' }}>Medicines:</strong> <span style={{ fontWeight: 600 }}>Has listed {pharm.medicines_count || 0} medicines</span></div>
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
                      PENDING / زیر التواء
                    </span>
                    
                    <button className="doc-link" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'var(--color-blue)', cursor: 'pointer', fontWeight: '600' }} onClick={() => setSelectedPharmacy(pharm)}>
                      <span>View Full Profile</span>
                      <ExternalLink size={12} />
                    </button>

                    {pharm.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                        <button className="btn" style={{ padding: '8px 16px', fontSize: '13px', backgroundColor: '#3da860', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => handleAction(pharm.id, 'approve')}>
                          <Check size={14} />
                          <span>Approve / منظور کریں</span>
                        </button>
                        <button className="btn" style={{ padding: '8px 16px', fontSize: '13px', backgroundColor: 'transparent', color: 'var(--color-red)', border: '1px solid var(--color-red)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => handleAction(pharm.id, 'reject')}>
                          <X size={14} />
                          <span>Reject / مسترد کریں</span>
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            ))}

            {displayPharmacies.length === 0 && (
              <div className="empty-state card" style={{ padding: '40px', textAlign: 'center' }}>
                <Store size={48} className="text-muted" style={{ marginBottom: '16px' }} />
                <h3>No Pharmacies Found</h3>
                <p>There are no pharmacies in this category.</p>
              </div>
            )}
          </div>

          
          <div className="card">
            <div className="card-title-container">
              <div>
                <h3 className="card-title">Approved Pharmacies ({approvedPharmacies.length})</h3>
                <p className="card-subtitle">منظور شدہ فارمیسیاں</p>
              </div>
              <span className="text-green" style={{ fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#3da860' }}>View All →</span>
            </div>
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>City</th>
                    <th>License</th>
                    <th>Medicines</th>
                    <th>Orders</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedPharmacies.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                        No approved pharmacies. / کوئی منظور شدہ فارمیسی نہیں ہے۔
                      </td>
                    </tr>
                  ) : (
                    approvedPharmacies.map(pharm => (
                      <tr key={pharm.id}>
                        <td style={{ fontWeight: 600 }}>{pharm.name}</td>
                        <td>{pharm.address?.split(',')[pharm.address.split(',').length - 2]?.trim() || 'Punjab'}</td>
                        <td className="font-mono">{pharm.license_number}</td>
                        <td>{pharm.medicines_count || 0}</td>
                        <td style={{ color: 'var(--color-green)', fontWeight: 600 }}>{pharm.orders_count || 0}</td>
                        <td>
                          <span className="badge badge-green" style={{ backgroundColor: '#eff7f2', color: '#3da860', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>Active</span>
                        </td>
                        <td>
                          <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', cursor: 'pointer', backgroundColor: '#ffffff' }} onClick={() => setSelectedPharmacy(pharm)}>
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      
      {selectedPharmacy && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            color: 'var(--text-main)',
            width: '100%',
            maxWidth: '650px',
            borderRadius: '20px',
            border: '1px solid var(--border-light)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            maxHeight: '90vh'
          }}>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-light)',
              backgroundColor: '#eff7f2'
            }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#135431' }}>
                  <Store style={{ color: 'var(--color-orange)' }} size={20} />
                  {selectedPharmacy.name}
                </h3>
                <span className="urdu" style={{ fontSize: '14px', color: '#3da860', display: 'block', marginTop: '2px' }}>
                  {selectedPharmacy.name_urdu || 'فارمیسی'}
                </span>
              </div>
              <button 
                onClick={() => setSelectedPharmacy(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0,0,0,0.05)'
                }}
              >
                <X size={18} />
              </button>
            </div>

            
            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Registered on: <strong>{new Date(selectedPharmacy.created_at).toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                </span>
                <span className="badge" style={{ backgroundColor: '#fff3e0', color: '#ff9800', fontSize: '12px', padding: '6px 12px', borderRadius: '20px', fontWeight: '600' }}>
                  {selectedPharmacy.status.toUpperCase()}
                </span>
              </div>

              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '16px 24px',
                fontSize: '14px'
              }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Owner Details</span>
                  <strong>{selectedPharmacy.owner_name}</strong>
                  {selectedPharmacy.cnic && <span style={{ display: 'block', fontSize: '12px', color: '#64748b' }}>CNIC: {selectedPharmacy.cnic}</span>}
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>License Details</span>
                  <strong>{selectedPharmacy.license_number}</strong>
                  {selectedPharmacy.license_expiry && <span style={{ display: 'block', fontSize: '12px', color: '#64748b' }}>Expires: {selectedPharmacy.license_expiry}</span>}
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Contact Number</span>
                  <strong>{selectedPharmacy.phone || 'N/A'}</strong>
                  {selectedPharmacy.whatsapp && <span style={{ display: 'block', fontSize: '12px', color: 'var(--color-green)' }}>WhatsApp: {selectedPharmacy.whatsapp}</span>}
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Email Address</span>
                  <strong>{selectedPharmacy.email || 'admin@maveshisehat.pk'}</strong>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Location</span>
                  <strong>{selectedPharmacy.address}</strong>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Business Hours</span>
                  <strong>{selectedPharmacy.business_hours || '9:00 AM - 9:00 PM'}</strong>
                </div>
              </div>

              
              <div style={{ fontSize: '14px', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Full Address</span>
                <p style={{ margin: 0, lineHeight: 1.5 }}>{selectedPharmacy.address}</p>
              </div>

              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '16px',
                backgroundColor: '#eff7f2',
                border: '1px solid var(--border-light)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center'
              }}>
                <div>
                  <span style={{ display: 'block', fontSize: '24px', fontWeight: 700, color: 'var(--color-orange)' }}>
                    {selectedPharmacy.medicines_count || 0}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Medicines Listed</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '24px', fontWeight: 700, color: 'var(--color-green)' }}>
                    {selectedPharmacy.orders_count || 0}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Orders Received</span>
                </div>
              </div>

              
              {selectedPharmacy.description && (
                <div style={{ fontSize: '14px', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Description</span>
                  <p style={{ margin: 0, lineHeight: 1.5, color: 'var(--text-muted)', fontStyle: 'italic' }}>"{selectedPharmacy.description}"</p>
                </div>
              )}

            </div>

            
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-light)',
              backgroundColor: '#f8fafc',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button 
                onClick={() => setSelectedPharmacy(null)}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '13px', backgroundColor: '#ffffff', border: '1px solid var(--border-light)', cursor: 'pointer', borderRadius: '6px' }}
              >
                Close
              </button>
              {selectedPharmacy.status === 'pending' && (
                <>
                  <button 
                    onClick={() => {
                      handleAction(selectedPharmacy.id, 'approve');
                      setSelectedPharmacy(null);
                    }}
                    className="btn btn-primary"
                    style={{ padding: '8px 16px', fontSize: '13px', backgroundColor: '#3da860', color: '#ffffff', border: 'none', cursor: 'pointer', borderRadius: '6px', fontWeight: '600' }}
                  >
                    <Check size={14} style={{ marginRight: '4px' }} />
                    <span>Approve</span>
                  </button>
                  <button 
                    onClick={() => {
                      handleAction(selectedPharmacy.id, 'reject');
                      setSelectedPharmacy(null);
                    }}
                    className="btn btn-danger"
                    style={{ padding: '8px 16px', fontSize: '13px', backgroundColor: 'transparent', color: 'var(--color-red)', border: '1px solid var(--color-red)', cursor: 'pointer', borderRadius: '6px', fontWeight: '600' }}
                  >
                    <X size={14} style={{ marginRight: '4px' }} />
                    <span>Reject</span>
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
