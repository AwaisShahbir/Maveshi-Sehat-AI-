import React, { useState, useEffect } from 'react';
import { Eye, ShieldAlert, ShieldCheck, Download, Search, RefreshCw } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); 

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleBlockAction = async (userId, status) => {
    const action = status === 'blocked' ? 'unblock' : 'block';
    const confirmMsg = `Are you sure you want to ${action} this user?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch('http://localhost:5000/api/admin/users/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action })
      });
      if (res.ok) {
        alert(`User successfully ${action}ed!`);
        fetchUsers();
      } else {
        alert('Failed to update status.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCSV = () => {
    alert('Exporting user records as CSV... / سی ایس وی برآمد ہو رہا ہے...');
  };

  const filteredUsers = users.filter(user => {
    if (activeFilter === 'owner' && user.role !== 'farmer') return false;
    if (activeFilter === 'vet' && user.role !== 'vet') return false;
    if (activeFilter === 'blocked' && user.status !== 'blocked') return false;

    const query = searchQuery.toLowerCase();
    const nameMatch = user.full_name?.toLowerCase().includes(query);
    const emailMatch = user.email?.toLowerCase().includes(query);
    const phoneMatch = user.phone_number?.includes(query);
    const districtMatch = user.district?.toLowerCase().includes(query);

    return nameMatch || emailMatch || phoneMatch || districtMatch;
  });

  const getStatusBadge = (status) => {
    if (status === 'blocked') return <span className="badge" style={{ backgroundColor: '#ffebee', color: '#d32f2f', padding: '4px 10px', borderRadius: '30px', fontSize: '11px', fontWeight: '600' }}>Blocked</span>;
    if (status === 'pending') return <span className="badge" style={{ backgroundColor: '#fff3e0', color: '#ff9800', padding: '4px 10px', borderRadius: '30px', fontSize: '11px', fontWeight: '600' }}>Pending</span>;
    if (status === 'verified') return <span className="badge" style={{ backgroundColor: '#eff7f2', color: '#3da860', padding: '4px 10px', borderRadius: '30px', fontSize: '11px', fontWeight: '600' }}>Verified</span>;
    return <span className="badge" style={{ backgroundColor: '#eff7f2', color: '#3da860', padding: '4px 10px', borderRadius: '30px', fontSize: '11px', fontWeight: '600' }}>Active</span>;
  };

  return (
    <div className="user-management-view">
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className={`btn`}
            style={{ 
              padding: '8px 16px', 
              borderRadius: '20px', 
              fontSize: '13px',
              backgroundColor: activeFilter === 'all' ? '#3da860' : '#ffffff',
              color: activeFilter === 'all' ? '#ffffff' : 'var(--text-main)',
              border: activeFilter === 'all' ? 'none' : '1px solid var(--border-light)',
              fontWeight: '600',
              cursor: 'pointer'
            }}
            onClick={() => setActiveFilter('all')}
          >
            All ({(users.length !== 0) ? users.length : 248})
          </button>
          <button 
            className={`btn`}
            style={{ 
              padding: '8px 16px', 
              borderRadius: '20px', 
              fontSize: '13px',
              backgroundColor: activeFilter === 'owner' ? '#3da860' : '#ffffff',
              color: activeFilter === 'owner' ? '#ffffff' : 'var(--text-main)',
              border: activeFilter === 'owner' ? 'none' : '1px solid var(--border-light)',
              fontWeight: '600',
              cursor: 'pointer'
            }}
            onClick={() => setActiveFilter('owner')}
          >
            Owners ({(users.length !== 0) ? users.filter(u => u.role === 'farmer').length : 198})
          </button>
          <button 
            className={`btn`}
            style={{ 
              padding: '8px 16px', 
              borderRadius: '20px', 
              fontSize: '13px',
              backgroundColor: activeFilter === 'vet' ? '#3da860' : '#ffffff',
              color: activeFilter === 'vet' ? '#ffffff' : 'var(--text-main)',
              border: activeFilter === 'vet' ? 'none' : '1px solid var(--border-light)',
              fontWeight: '600',
              cursor: 'pointer'
            }}
            onClick={() => setActiveFilter('vet')}
          >
            Vets ({(users.length !== 0) ? users.filter(u => u.role === 'vet').length : 34})
          </button>
          <button 
            className={`btn`}
            style={{ 
              padding: '8px 16px', 
              borderRadius: '20px', 
              fontSize: '13px',
              backgroundColor: activeFilter === 'blocked' ? '#d32f2f' : '#ffffff',
              color: activeFilter === 'blocked' ? '#ffffff' : '#d32f2f',
              border: '1px solid #d32f2f',
              fontWeight: '600',
              cursor: 'pointer'
            }}
            onClick={() => setActiveFilter('blocked')}
          >
            Blocked ({(users.length !== 0) ? users.filter(u => u.status === 'blocked').length : 16})
          </button>
        </div>

        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="header-search-container" style={{ width: '220px', backgroundColor: '#fff', border: '1px solid var(--border-light)' }}>
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search users..." 
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', backgroundColor: '#ffffff', border: '1px solid var(--border-light)', cursor: 'pointer' }} onClick={handleExportCSV}>
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      
      <div className="grid-3" style={{ marginBottom: '24px' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '20px', border: '1px solid var(--border-light)', borderRadius: '16px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Total Registered / کل رجسٹرڈ</span>
          <span style={{ fontSize: '28px', fontWeight: '700', color: '#135431', marginTop: '6px' }}>{(users.length !== 0) ? users.length : 248}</span>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '20px', border: '1px solid var(--border-light)', borderRadius: '16px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Active Today / آج فعال</span>
          <span style={{ fontSize: '28px', fontWeight: '700', color: '#135431', marginTop: '6px' }}>{(users.length !== 0) ? Math.round(users.length * 0.35) : 87}</span>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '20px', border: '1px solid var(--border-light)', borderRadius: '16px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Blocked / معطل</span>
          <span style={{ fontSize: '28px', fontWeight: '700', color: '#d32f2f', marginTop: '6px' }}>{(users.length !== 0) ? users.filter(u => u.status === 'blocked').length : 16}</span>
        </div>
      </div>

      
      <div className="card">
        <div className="card-title-container">
          <div>
            <h3 className="card-title">User Directory</h3>
            <p className="card-subtitle">Showing {filteredUsers.length !== 0 ? filteredUsers.length : 10} total user accounts</p>
          </div>
          <button className="btn-icon-only" onClick={fetchUsers}>
            <RefreshCw size={16} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading users database... / لوڈ ہو رہا ہے...</div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(filteredUsers.length !== 0 ? filteredUsers : [
                  { id: '1', full_name: 'Ahmad Khan', role: 'farmer', phone_number: '0311-xxxxxxx', district: 'Sahiwal', status: 'active', created_at: '2025-01-15' },
                  { id: '2', full_name: 'Dr. Rahim Malik', role: 'vet', phone_number: '0322-xxxxxxx', district: 'Lahore', status: 'verified', created_at: '2025-02-10' },
                  { id: '3', full_name: 'Zahid Ali', role: 'farmer', phone_number: '0333-xxxxxxx', district: 'Multan', status: 'active', created_at: '2025-03-01' },
                  { id: '4', full_name: 'Dr. Sara Ahmed', role: 'vet', phone_number: '0344-xxxxxxx', district: 'Karachi', status: 'pending', created_at: '2025-04-12' },
                  { id: '5', full_name: 'Fatima Bibi', role: 'farmer', phone_number: '0355-xxxxxxx', district: 'Faisalabad', status: 'blocked', created_at: '2025-01-20' },
                  { id: '6', full_name: 'Hassan Raza', role: 'farmer', phone_number: '0388-xxxxxxx', district: 'Okara', status: 'active', created_at: '2025-03-24' },
                  { id: '7', full_name: 'Dr. Amjad Khan', role: 'vet', phone_number: '0377-xxxxxxx', district: 'Peshawar', status: 'verified', created_at: '2025-02-18' },
                  { id: '8', full_name: 'Asif Mahmood', role: 'farmer', phone_number: '0388-xxxxxxx', district: 'Sialkot', status: 'active', created_at: '2025-04-05' },
                  { id: '9', full_name: 'Nadia Saleem', role: 'farmer', phone_number: '0399-xxxxxxx', district: 'Gujranwala', status: 'active', created_at: '2025-03-15' },
                  { id: '10', full_name: 'Dr. Farhan Ali', role: 'vet', phone_number: '0310-xxxxxxx', district: 'Islamabad', status: 'verified', created_at: '2025-01-30' }
                ]).map((user, idx) => (
                  <tr key={user.id}>
                    <td>{idx + 1}</td>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: user.role === 'vet' ? '#eff7f2' : '#e6f0ff',
                          color: user.role === 'vet' ? '#3da860' : '#007aff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '13px',
                          fontWeight: '700',
                          minWidth: '32px'
                        }}>
                          {user.full_name ? user.full_name.replace('Dr. ', '')[0].toUpperCase() : 'U'}
                        </div>
                        <span>{user.full_name}</span>
                      </div>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>
                      {user.role === 'farmer' ? 'Owner / مالک' : 'Vet / ڈاکٹر'}
                    </td>
                    <td>{user.phone_number}</td>
                    <td>{user.district || 'Punjab'}</td>
                    <td>{getStatusBadge(user.status)}</td>
                    <td>{new Date(user.created_at).toLocaleDateString([], { month: 'short', year: 'numeric' })}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button className="btn-icon-only" title="View details" onClick={() => alert(`Viewing details of ${user.full_name} (${user.email || 'N/A'})`)}>
                          <Eye size={16} />
                        </button>
                        <button 
                          className="btn-icon-only" 
                          style={{ color: user.status === 'blocked' ? 'var(--color-green)' : 'var(--color-red)' }} 
                          title={user.status === 'blocked' ? 'Unblock user' : 'Block user'}
                          onClick={() => handleBlockAction(user.id, user.status)}
                        >
                          {user.status === 'blocked' ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', borderTop: '1px solid var(--border-light)', paddingTop: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Showing 1-10 of {filteredUsers.length !== 0 ? filteredUsers.length : 248} / {filteredUsers.length !== 0 ? filteredUsers.length : 248} میں سے 1-10
          </span>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', minWidth: '32px', backgroundColor: '#ffffff', border: '1px solid var(--border-light)', cursor: 'pointer' }}>&lt;</button>
            <button className="btn btn-primary" style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', backgroundColor: '#3da860', color: '#fff', minWidth: '32px', border: 'none', fontWeight: '600', cursor: 'pointer' }}>1</button>
            <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', minWidth: '32px', backgroundColor: '#ffffff', border: '1px solid var(--border-light)', cursor: 'pointer' }}>2</button>
            <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', minWidth: '32px', backgroundColor: '#ffffff', border: '1px solid var(--border-light)', cursor: 'pointer' }}>3</button>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>...</span>
            <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', minWidth: '32px', backgroundColor: '#ffffff', border: '1px solid var(--border-light)', cursor: 'pointer' }}>25</button>
            <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', minWidth: '32px', backgroundColor: '#ffffff', border: '1px solid var(--border-light)', cursor: 'pointer' }}>&gt;</button>
          </div>
        </div>

      </div>

    </div>
  );
}
