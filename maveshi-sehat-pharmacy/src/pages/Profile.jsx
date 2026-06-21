import React, { useState, useEffect } from 'react';
import { Store, ShieldCheck, Mail, Phone, Clock, FileText, Check } from 'lucide-react';

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

  if (loading) return <div className="text-center text-slate-500 py-10 text-sm font-medium">Loading profile details... / لوڈ ہو رہا ہے...</div>;

  return (
    <div className="flex flex-col gap-6">
      {successMsg && <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl border border-emerald-100 font-semibold text-sm">{successMsg}</div>}
      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 font-semibold text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        <div className="lg:col-span-1">
          <div className="card flex flex-col items-center text-center p-8 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <div className="w-[72px] h-[72px] rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border-2 border-emerald-500 mb-4">
              <Store size={36} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">{profile.name}</h3>
            <p className="text-xs text-emerald-600 font-semibold mt-1 urdu">{profile.name_urdu}</p>
            <div className="mt-3 mb-6">
              <span className="badge badge-green">
                <ShieldCheck size={14} /> Approved Portal
              </span>
            </div>
            
            <div className="flex flex-col gap-3 w-full border-t border-slate-100 pt-5">
              <div className="flex items-center gap-3 text-slate-600 text-xs">
                <Mail size={16} className="text-slate-400" />
                <span className="truncate">{profile.email}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 text-xs">
                <Phone size={16} className="text-slate-400" />
                <span>{profile.phone}</span>
              </div>
            </div>
          </div>
        </div>

        
        <div className="lg:col-span-2">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-5">
                
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Pharmacy Name (English)</span>
                  <span className="text-sm font-semibold text-slate-800">{profile.name}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Pharmacy Name (Urdu)</span>
                  <span className="text-sm font-semibold text-slate-800 urdu">{profile.name_urdu || 'N/A'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Owner Name</span>
                  <span className="text-sm font-semibold text-slate-800">{profile.owner_name}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">CNIC</span>
                  <span className="text-sm font-semibold text-slate-800">{profile.cnic || 'N/A'}</span>
                </div>

                
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Phone Number</span>
                  <span className="text-sm font-semibold text-slate-800">{profile.phone || 'N/A'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">WhatsApp Number</span>
                  <span className="text-sm font-semibold text-slate-800">{profile.whatsapp || 'N/A'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Email Address</span>
                  <span className="text-sm font-semibold text-slate-800">{profile.email}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Business Hours</span>
                  <span className="text-sm font-semibold text-slate-800">{profile.business_hours || 'N/A'}</span>
                </div>

                
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Province</span>
                  <span className="text-sm font-semibold text-slate-800">{profile.province || 'N/A'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">City</span>
                  <span className="text-sm font-semibold text-slate-800">{profile.city || 'N/A'}</span>
                </div>
                <div className="flex flex-col md:col-span-2">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Full Address</span>
                  <span className="text-sm font-semibold text-slate-800">{profile.address || 'N/A'}</span>
                </div>

                
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">DRAP License Number</span>
                  <span className="text-sm font-bold text-emerald-500">
                    {profile.license_number}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">License Expiry Date</span>
                  <span className="text-sm font-semibold text-slate-800">{profile.license_expiry || 'N/A'}</span>
                </div>

                
                <div className="flex flex-col md:col-span-2">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Description</span>
                  <span className="text-sm font-semibold text-slate-800">{profile.description || 'N/A'}</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      className="form-control text-right" 
                      value={form.nameUrdu} 
                      onChange={handleChange}
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

                <button type="submit" className="btn btn-primary mt-3 flex items-center gap-2 justify-center w-fit">
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

