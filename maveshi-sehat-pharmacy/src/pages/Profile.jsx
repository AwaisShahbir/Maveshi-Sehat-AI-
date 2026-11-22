import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { Store, ShieldCheck, Mail, Phone, Check } from 'lucide-react';
import '../styles/Profile.css';

export default function Profile({ pharmacy, onProfileUpdate }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    name: '',
    nameUrdu: '',
    ownerName: '',
    phone: '',
    whatsapp: '',
    address: '',
    province: '',
    city: '',
    businessHours: '',
    description: ''
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/pharmacy/profile?pharmacyId=${pharmacy.id}`);
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
          province: data.province || '',
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
      const res = await fetch(`${API_BASE_URL}/api/pharmacy/profile`, {
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

  if (loading) return <div className="text-center text-slate-500 py-10 text-sm font-medium">Loading profile details...</div>;

  return (
    <div className="flex flex-col gap-6">
      {successMsg && (
        <div className="bg-[#3da860]/10 text-[#3da860] p-4 rounded-2xl border border-[#3da860]/20 font-bold text-sm">
          {successMsg}
        </div>
      )}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 font-bold text-sm">
          {error}
        </div>
      )}
      
      {/* Profile Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Side: Store Card */}
        <div className="lg:col-span-1">
          <div className="profile-store-side-card">
            <div className="profile-store-icon-circle">
              <Store size={36} />
            </div>
            <h3 className="profile-store-title">{profile.name}</h3>
            <div className="profile-store-badge-wrap">
              <span className="profile-store-badge">
                <ShieldCheck size={14} /> Approved Portal
              </span>
            </div>
            
            <div className="profile-contact-list">
              <div className="profile-contact-item">
                <Mail size={16} className="profile-contact-icon" />
                <span className="truncate font-semibold">{profile.email}</span>
              </div>
              <div className="profile-contact-item">
                <Phone size={16} className="profile-contact-icon" />
                <span className="font-semibold">{profile.phone || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Details View / Form */}
        <div className="lg:col-span-2">
          <div className="profile-main-card">
            <div className="card-header-flex border-b border-slate-50 pb-4 mb-6">
              <div>
                <h3 className="card-title text-slate-900 font-bold">Pharmacy Details</h3>
                <p className="text-xs text-slate-400 mt-0.5">Profile and store information</p>
              </div>
              {!isEditing ? (
                <button 
                  type="button"
                  className="btn btn-secondary btn-sm bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer font-bold" 
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </button>
              ) : (
                <button 
                  type="button"
                  className="btn btn-danger btn-sm rounded-xl hover:bg-red-600 transition-all cursor-pointer font-bold" 
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
              )}
            </div>

            {!isEditing ? (
              <div className="profile-details-grid">
                <div className="profile-field-item full-width">
                  <span className="profile-field-label">Pharmacy Name</span>
                  <span className="profile-field-value">{profile.name}</span>
                </div>
                <div className="profile-field-item">
                  <span className="profile-field-label">Owner Name</span>
                  <span className="profile-field-value">{profile.owner_name}</span>
                </div>
                <div className="profile-field-item">
                  <span className="profile-field-label">CNIC</span>
                  <span className="profile-field-value mono">{profile.cnic || 'N/A'}</span>
                </div>

                <div className="profile-field-item">
                  <span className="profile-field-label">Phone Number</span>
                  <span className="profile-field-value">{profile.phone || 'N/A'}</span>
                </div>
                <div className="profile-field-item">
                  <span className="profile-field-label">WhatsApp Number</span>
                  <span className="profile-field-value">{profile.whatsapp || 'N/A'}</span>
                </div>
                <div className="profile-field-item">
                  <span className="profile-field-label">Email Address</span>
                  <span className="profile-field-value">{profile.email}</span>
                </div>
                <div className="profile-field-item">
                  <span className="profile-field-label">Business Hours</span>
                  <span className="profile-field-value">{profile.business_hours || 'N/A'}</span>
                </div>

                <div className="profile-field-item">
                  <span className="profile-field-label">Province</span>
                  <span className="profile-field-value">{profile.province || 'N/A'}</span>
                </div>
                <div className="profile-field-item">
                  <span className="profile-field-label">City</span>
                  <span className="profile-field-value">{profile.city || 'N/A'}</span>
                </div>
                <div className="profile-field-item full-width">
                  <span className="profile-field-label">Full Address</span>
                  <span className="profile-field-value">{profile.address || 'N/A'}</span>
                </div>

                <div className="profile-field-item">
                  <span className="profile-field-label">DRAP License Number</span>
                  <span className="profile-field-value highlight">
                    {profile.license_number}
                  </span>
                </div>
                <div className="profile-field-item">
                  <span className="profile-field-label">License Expiry Date</span>
                  <span className="profile-field-value mono">{profile.license_expiry || 'N/A'}</span>
                </div>

                <div className="profile-field-item full-width">
                  <span className="profile-field-label">Description</span>
                  <span className="profile-field-value description">{profile.description || 'N/A'}</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group mb-0 md:col-span-2">
                    <label className="form-label">Pharmacy Name</label>
                    <input 
                      type="text" 
                      name="name" 
                      required
                      className="form-control profile-input" 
                      value={form.name} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label">Owner Name</label>
                    <input 
                      type="text" 
                      name="ownerName" 
                      required
                      className="form-control profile-input" 
                      value={form.ownerName} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label">Business Hours</label>
                    <input 
                      type="text" 
                      name="businessHours" 
                      required
                      className="form-control profile-input" 
                      value={form.businessHours} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label">Phone Number</label>
                    <input 
                      type="text" 
                      name="phone" 
                      required
                      className="form-control profile-input font-mono" 
                      value={form.phone} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label">WhatsApp Number</label>
                    <input 
                      type="text" 
                      name="whatsapp" 
                      className="form-control profile-input font-mono" 
                      value={form.whatsapp} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label">Province</label>
                    <select 
                      name="province" 
                      required
                      className="form-control profile-input bg-white cursor-pointer" 
                      value={form.province} 
                      onChange={handleChange}
                    >
                      <option value="" disabled>Select Province</option>
                      <option value="Punjab">Punjab</option>
                      <option value="Sindh">Sindh</option>
                      <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa (KPK)</option>
                      <option value="Balochistan">Balochistan</option>
                      <option value="Islamabad Capital Territory">Islamabad Capital Territory</option>
                      <option value="Gilgit-Baltistan">Gilgit-Baltistan</option>
                      <option value="Azad Jammu & Kashmir">Azad Jammu & Kashmir (AJK)</option>
                    </select>
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label">City</label>
                    <input 
                      type="text" 
                      name="city" 
                      required
                      className="form-control profile-input" 
                      value={form.city} 
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-group mb-0">
                  <label className="form-label">Full Address</label>
                  <textarea 
                    name="address" 
                    required
                    className="form-control profile-input min-h-[70px]" 
                    value={form.address} 
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group mb-0">
                  <label className="form-label">Description</label>
                  <textarea 
                    name="description" 
                    className="form-control profile-input min-h-[70px]" 
                    value={form.description} 
                    onChange={handleChange}
                  />
                </div>

                <button 
                  type="submit" 
                  className="profile-save-btn"
                >
                  <Check size={16} />
                  <span>Save Changes</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
