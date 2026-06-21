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
    if (status === 'blocked') return <span className="badge badge-red">Blocked / معطل</span>;
    if (status === 'pending') return <span className="badge badge-orange">Pending / زیر التواء</span>;
    if (status === 'verified') return <span className="badge badge-green">Verified / تصدیق شدہ</span>;
    return <span className="badge badge-green">Active / فعال</span>;
  };

  return (
    <div className="user-management-view">
      
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className={`btn ${activeFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '13px' }}
            onClick={() => setActiveFilter('all')}
          >
            All ({users.length})
          </button>
          <button 
            className={`btn ${activeFilter === 'owner' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '13px' }}
            onClick={() => setActiveFilter('owner')}
          >
            Owners ({users.filter(u => u.role === 'farmer').length})
          </button>
          <button 
            className={`btn ${activeFilter === 'vet' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '13px' }}
            onClick={() => setActiveFilter('vet')}
          >
            Vets ({users.filter(u => u.role === 'vet').length})
          </button>
          <button 
            className={`btn ${activeFilter === 'blocked' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '13px', border: activeFilter === 'blocked' ? 'none' : '1px solid var(--color-red)', color: activeFilter === 'blocked' ? '#fff' : 'var(--color-red)' }}
            onClick={() => setActiveFilter('blocked')}
          >
            Blocked ({users.filter(u => u.status === 'blocked').length})
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
          <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }} onClick={handleExportCSV}>
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      
      <div className="card">
        <div className="card-title-container">
          <div>
            <h3 className="card-title">User Directory</h3>
            <p className="card-subtitle">Showing {filteredUsers.length} total user accounts</p>
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
                {filteredUsers.map((user, idx) => (
                  <tr key={user.id}>
                    <td>{idx + 1}</td>
                    <td style={{ fontWeight: 600 }}>{user.full_name}</td>
                    <td style={{ textTransform: 'capitalize' }}>
                      {user.role === 'farmer' ? 'Owner / مالک' : 'Vet / ڈاکٹر'}
                    </td>
                    <td>{user.phone_number}</td>
                    <td>{user.district || 'Punjab'}</td>
                    <td>{getStatusBadge(user.status)}</td>
                    <td>{new Date(user.created_at).toLocaleDateString([], { month: 'short', year: 'numeric' })}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        
                        <button className="btn-icon-only" title="View details" onClick={() => alert(`Viewing details of ${user.full_name} (${user.email})`)}>
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
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: '#999' }}>
                      No user accounts match the selected filters or search queries.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
