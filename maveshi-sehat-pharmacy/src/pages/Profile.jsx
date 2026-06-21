import React, { useState, useEffect } from 'react';
import { Store, ShieldCheck, Mail, Phone, Clock, FileText, Check } from 'lucide-react';

export default function Profile({ pharmacy, onProfileUpdate }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editable Form state
  const [form, setForm] = useState({
    name: '',
    nameUrdu: '',
    ownerName: '',
    phone: '',
    whatsapp: '',
    address: '',
    province: 'Punjab',
    city: '',
    businessHours: '',
    description: ''
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/pharmacy/profile?pharmacyId=${pharmacy.id}`);
      const data = await res.json();
      if (res.ok) {
        setProfile(data);
        setForm({
          name: data.name,
          nameUrdu: data.name_urdu || '',
          ownerName: data.owner_name,
          phone: data.phone || '',
          whatsapp: data.whatsapp || '',
          address: data.address || '',
          province: data.province || 'Punjab',
          city: data.city || '',
          businessHours: data.business_hours || '',
          description: data.description || ''
        });
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [pharmacy.id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('http://localhost:5000/api/pharmacy/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          pharmacyId: pharmacy.id
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile.');

      setProfile(data);
      onProfileUpdate(data);
      setIsEditing(false);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div style={styles.loading}>Loading profile details...</div>;

  return (
    <div style={styles.container}>
      {successMsg && <div style={styles.successAlert}>{successMsg}</div>}
      {error && <div style={styles.errorAlert}>{error}</div>}

      <div style={styles.layout}>
        {/* Left Side: Summary Card */}
        <div style={styles.leftCol}>
          <div className="card" style={styles.summaryCard}>
            <div style={styles.avatar}>
              <Store size={36} />
            </div>
            <h3 style={styles.summaryName}>{profile.name}</h3>
            <p style={styles.summaryUrdu} className="urdu">{profile.name_urdu}</p>
            <div style={styles.statusBadgeBlock}>
              <span className="badge badge-green">
                <ShieldCheck size={14} /> Approved Portal
              </span>
            </div>
            
            <div style={styles.quickContactBlock}>
              <div style={styles.quickContactItem}>
                <Mail size={16} />
                <span>{profile.email}</span>
              </div>
              <div style={styles.quickContactItem}>
                <Phone size={16} />
                <span>{profile.phone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Detailed Profile Information */}
        <div style={styles.rightCol}>
          <div className="card">
            <div className="card-header-flex">
              <h3 className="card-title">Pharmacy Details / معلومات</h3>
              {!isEditing ? (
                <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(true)}>
                  Edit Profile / ترمیم کریں
                </button>
              ) : (
                <button className="btn btn-danger btn-sm" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
              )}
            </div>

            {!isEditing ? (
              <div style={styles.detailsGrid}>
                {/* 1. Basic */}
                <div style={styles.detailBlock}>
                  <span style={styles.detailLabel}>Pharmacy Name (English)</span>
                  <span style={styles.detailValue}>{profile.name}</span>
                </div>
                <div style={styles.detailBlock}>
                  <span style={styles.detailLabel}>Pharmacy Name (Urdu)</span>
                  <span style={styles.detailValue} className="urdu">{profile.name_urdu || 'N/A'}</span>
                </div>
                <div style={styles.detailBlock}>
                  <span style={styles.detailLabel}>Owner Name</span>
                  <span style={styles.detailValue}>{profile.owner_name}</span>
                </div>
                <div style={styles.detailBlock}>
                  <span style={styles.detailLabel}>CNIC</span>
                  <span style={styles.detailValue}>{profile.cnic || 'N/A'}</span>
                </div>

                {/* 2. Contact */}
                <div style={styles.detailBlock}>
                  <span style={styles.detailLabel}>Phone Number</span>
                  <span style={styles.detailValue}>{profile.phone || 'N/A'}</span>
                </div>
                <div style={styles.detailBlock}>
                  <span style={styles.detailLabel}>WhatsApp Number</span>
                  <span style={styles.detailValue}>{profile.whatsapp || 'N/A'}</span>
                </div>
                <div style={styles.detailBlock}>
                  <span style={styles.detailLabel}>Email Address</span>
                  <span style={styles.detailValue}>{profile.email}</span>
                </div>
                <div style={styles.detailBlock}>
                  <span style={styles.detailLabel}>Business Hours</span>
                  <span style={styles.detailValue}>{profile.business_hours || 'N/A'}</span>
                </div>

                {/* 3. Location */}
                <div style={styles.detailBlock}>
                  <span style={styles.detailLabel}>Province</span>
                  <span style={styles.detailValue}>{profile.province || 'N/A'}</span>
                </div>
                <div style={styles.detailBlock}>
                  <span style={styles.detailLabel}>City</span>
                  <span style={styles.detailValue}>{profile.city || 'N/A'}</span>
                </div>
                <div style={styles.detailBlockFull}>
                  <span style={styles.detailLabel}>Full Address</span>
                  <span style={styles.detailValue}>{profile.address || 'N/A'}</span>
                </div>

                {/* 4. License */}
                <div style={styles.detailBlock}>
                  <span style={styles.detailLabel}>DRAP License Number</span>
                  <span style={{ ...styles.detailValue, color: '#10b981', fontWeight: '700' }}>
                    {profile.license_number}
                  </span>
                </div>
                <div style={styles.detailBlock}>
                  <span style={styles.detailLabel}>License Expiry Date</span>
                  <span style={styles.detailValue}>{profile.license_expiry || 'N/A'}</span>
                </div>

                {/* 5. Business */}
                <div style={styles.detailBlockFull}>
                  <span style={styles.detailLabel}>Description</span>
                  <span style={styles.detailValue}>{profile.description || 'N/A'}</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={styles.editForm}>
                <div style={styles.formGrid}>
                  <div className="form-group">
                    <label className="form-label">Pharmacy Name (English)</label>
                    <input 
                      type="text" 
                      name="name" 
                      required
                      className="form-control" 
                      value={form.name} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pharmacy Name (Urdu)</label>
                    <input 
                      type="text" 
                      name="nameUrdu" 
                      className="form-control" 
                      value={form.nameUrdu} 
                      onChange={handleChange}
                      style={{ textAlign: 'right' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Owner Name</label>
                    <input 
                      type="text" 
                      name="ownerName" 
                      required
                      className="form-control" 
                      value={form.ownerName} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Business Hours</label>
                    <input 
                      type="text" 
                      name="businessHours" 
                      required
                      className="form-control" 
                      value={form.businessHours} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input 
                      type="text" 
                      name="phone" 
                      required
                      className="form-control" 
                      value={form.phone} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">WhatsApp Number</label>
                    <input 
                      type="text" 
                      name="whatsapp" 
                      className="form-control" 
                      value={form.whatsapp} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Province</label>
                    <input 
                      type="text" 
                      name="province" 
                      required
                      className="form-control" 
                      value={form.province} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input 
                      type="text" 
                      name="city" 
                      required
                      className="form-control" 
                      value={form.city} 
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Full Address</label>
                  <textarea 
                    name="address" 
                    required
                    className="form-control" 
                    value={form.address} 
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea 
                    name="description" 
                    className="form-control" 
                    value={form.description} 
                    onChange={handleChange}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ marginTop: '12px' }}>
                  <Check size={16} />
                  <span>Save Changes / محفوظ کریں</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  layout: {
    display: 'flex',
    gap: '24px',
    alignItems: 'flex-start',
  },
  leftCol: {
    flex: '0.8',
  },
  rightCol: {
    flex: '2.2',
  },
  summaryCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '32px 24px',
  },
  avatar: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    color: '#10b981',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #10b981',
    marginBottom: '16px',
  },
  summaryName: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0f172a',
  },
  summaryUrdu: {
    fontSize: '13px',
    color: '#10b981',
    marginTop: '4px',
  },
  statusBadgeBlock: {
    marginTop: '12px',
    marginBottom: '24px',
  },
  quickContactBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
    borderTop: '1px solid #e2e8f0',
    paddingTop: '20px',
  },
  quickContactItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#475569',
    fontSize: '13px',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px 20px',
  },
  detailBlock: {
    display: 'flex',
    flexDirection: 'column',
  },
  detailBlockFull: {
    display: 'flex',
    flexDirection: 'column',
    gridColumn: '1 / span 2',
  },
  detailLabel: {
    fontSize: '12px',
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '4px',
  },
  detailValue: {
    fontSize: '15px',
    color: '#0f172a',
    fontWeight: '500',
  },
  editForm: {
    display: 'flex',
    flexDirection: 'column',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  loading: {
    textAlign: 'center',
    color: '#64748b',
    padding: '40px 0',
  },
  successAlert: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    color: '#10b981',
    padding: '14px 18px',
    borderRadius: '12px',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    fontWeight: '600',
    fontSize: '14px',
  },
  errorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    padding: '14px 18px',
    borderRadius: '12px',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    fontWeight: '600',
    fontSize: '14px',
  },
};
