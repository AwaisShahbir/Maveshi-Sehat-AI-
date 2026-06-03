import React, { useState, useEffect } from 'react';
import { Store, Phone, MapPin, Check, X, Clipboard, ExternalLink, ShieldCheck } from 'lucide-react';

export default function PharmacyApproval() {
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'approved', 'rejected'

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

  return (
    <div className="pharmacy-approval-view">
      
      {/* Tabs */}
      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending ({pharmacies.filter(p => p.status === 'pending').length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          Approved ({pharmacies.filter(p => p.status === 'approved').length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'rejected' ? 'active' : ''}`}
          onClick={() => setActiveTab('rejected')}
        >
          Rejected ({pharmacies.filter(p => p.status === 'rejected').length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading pharmacy approvals... / لوڈ ہو رہا ہے...</div>
      ) : (
        <div className="pharmacy-layout">
          {/* Main Card List */}
          <div className="pharmacy-cards-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
            {filteredPharmacies.map(pharm => (
              <div className="pharmacy-card card" key={pharm.id} style={{ borderLeft: '4px solid var(--color-orange)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                  
                  {/* Left content details */}
                  <div style={{ display: 'flex', gap: '16px', flex: 1, minWidth: '280px' }}>
                    <div className="p-avatar-box">
                      <Store size={24} style={{ color: 'var(--color-orange)' }} />
                    </div>
                    <div>
                      <h3 className="pharmacy-name" style={{ fontSize: '18px', fontWeight: 700 }}>{pharm.name}</h3>
                      <span className="pharmacy-urdu-name" style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '12px' }}>
                        فارمیسی
                      </span>
                      
                      <div className="pharmacy-grid-details" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', fontSize: '13px' }}>
                        <div><strong>License:</strong> {pharm.license_number}</div>
                        <div><strong>Owner:</strong> {pharm.owner_name}</div>
                        <div><strong>Address:</strong> {pharm.address}</div>
                        <div><strong>Phone:</strong> {pharm.phone}</div>
                        <div><strong>Submitted:</strong> {new Date(pharm.created_at).toLocaleDateString([], { day: 'numeric', month: 'short' })}</div>
                        <div><strong>Medicines:</strong> Has listed {(pharm.id * 7 % 30) + 15} medicines</div>
                      </div>
                    </div>
                  </div>

                  {/* Right Action buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <span className="badge badge-orange" style={{ marginBottom: '8px' }}>
                      {pharm.status.toUpperCase()} / زیر التواء
                    </span>
                    
                    <button className="doc-link" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'var(--color-blue)', cursor: 'pointer' }} onClick={() => alert('Viewing complete pharmacy document details...')}>
                      <span>View Full Profile</span>
                      <ExternalLink size={12} />
                    </button>

                    {pharm.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                        <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={() => handleAction(pharm.id, 'approve')}>
                          <Check size={14} />
                          <span>Approve / منظور کریں</span>
                        </button>
                        <button className="btn btn-danger" style={{ padding: '8px 16px', fontSize: '13px', backgroundColor: 'transparent', color: 'var(--color-red)', border: '1px solid var(--color-red)' }} onClick={() => handleAction(pharm.id, 'reject')}>
                          <X size={14} />
                          <span>Reject / مسترد کریں</span>
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            ))}

            {filteredPharmacies.length === 0 && (
              <div className="empty-state card" style={{ padding: '40px', textAlign: 'center' }}>
                <Store size={48} className="text-muted" style={{ marginBottom: '16px' }} />
                <h3>No Pharmacies Found</h3>
                <p>There are no pharmacies in this category.</p>
              </div>
            )}
          </div>

          {/* Bottom Table: Approved Pharmacies */}
          <div className="card">
            <div className="card-title-container">
              <div>
                <h3 className="card-title">Approved Pharmacies ({approvedPharmacies.length})</h3>
                <p className="card-subtitle">منظور شدہ فارمیسیاں</p>
              </div>
              <span className="text-green" style={{ fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>View All →</span>
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
                  {approvedPharmacies.map(pharm => (
                    <tr key={pharm.id}>
                      <td style={{ fontWeight: 600 }}>{pharm.name}</td>
                      <td>{pharm.address?.split(',')[1]?.trim() || 'Punjab'}</td>
                      <td className="font-mono">{pharm.license_number}</td>
                      <td>{(pharm.id * 7 % 30) + 35}</td>
                      <td style={{ color: 'var(--color-green)', fontWeight: 600 }}>{100 + (pharm.id * 35)}</td>
                      <td>
                        <span className="badge badge-green">Active</span>
                      </td>
                      <td>
                        <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '4px', border: '1px solid #ddd', cursor: 'pointer' }} onClick={() => alert(`Viewing details of ${pharm.name}`)}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {approvedPharmacies.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                        No approved pharmacies in the database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
