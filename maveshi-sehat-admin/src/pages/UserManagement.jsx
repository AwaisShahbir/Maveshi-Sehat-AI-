import React, { useState, useEffect } from 'react';
import { Eye, ShieldAlert, ShieldCheck, Download, Search, RefreshCw, X, Mail, Phone, MapPin, Calendar, Award } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); 
  const [selectedUser, setSelectedUser] = useState(null);

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
        alert(`User successfully ${action}ed.`);
        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser(prev => ({ ...prev, status: action === 'unblock' ? 'approved' : 'blocked' }));
        }
        fetchUsers();
      } else {
        alert('Failed to update user status.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCSV = () => {
    if (!filteredUsers.length) {
      alert('No user records found to export.');
      return;
    }
    const headers = ['ID', 'Full Name', 'Role', 'Email', 'Phone', 'District', 'Status', 'Joined Date'];
    const rows = filteredUsers.map(u => [
      `"${u.id}"`,
      `"${(u.full_name || '').replace(/"/g, '""')}"`,
      `"${u.role || ''}"`,
      `"${u.email || ''}"`,
      `"${u.phone_number || ''}"`,
      `"${u.district || 'Punjab'}"`,
      `"${u.status || ''}"`,
      `"${new Date(u.created_at).toISOString().split('T')[0]}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `maveshi_users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      
      {/* Top Filter & Search Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn"
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
            All ({users.length})
          </button>
          <button 
            className="btn"
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
            Owners ({users.filter(u => u.role === 'farmer').length})
          </button>
          <button 
            className="btn"
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
            Vets ({users.filter(u => u.role === 'vet').length})
          </button>
          <button 
            className="btn"
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
          <button 
            className="btn btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', backgroundColor: '#ffffff', border: '1px solid var(--border-light)', cursor: 'pointer' }} 
            onClick={handleExportCSV}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid-3" style={{ marginBottom: '24px' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '20px', border: '1px solid var(--border-light)', borderRadius: '16px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Total Registered</span>
          <span style={{ fontSize: '28px', fontWeight: '700', color: '#135431', marginTop: '6px' }}>{users.length}</span>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '20px', border: '1px solid var(--border-light)', borderRadius: '16px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Active Accounts</span>
          <span style={{ fontSize: '28px', fontWeight: '700', color: '#135431', marginTop: '6px' }}>
            {users.filter(u => u.status !== 'blocked').length}
          </span>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '20px', border: '1px solid var(--border-light)', borderRadius: '16px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Blocked Accounts</span>
          <span style={{ fontSize: '28px', fontWeight: '700', color: '#d32f2f', marginTop: '6px' }}>
            {users.filter(u => u.status === 'blocked').length}
          </span>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="card-title-container">
          <div>
            <h3 className="card-title">User Directory</h3>
            <p className="card-subtitle">Showing {filteredUsers.length} total user accounts</p>
          </div>
          <button className="btn-icon-only" onClick={fetchUsers} title="Refresh users list">
            <RefreshCw size={16} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading users database...</div>
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
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                      No user accounts found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, idx) => (
                    <tr key={user.id}>
                      <td style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                      <td>
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
                          <span style={{ fontWeight: '600' }}>{user.full_name}</span>
                        </div>
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>
                        {user.role === 'farmer' ? 'Livestock Owner' : 'Veterinary Doctor'}
                      </td>
                      <td>{user.phone_number}</td>
                      <td>{user.district || 'Punjab'}</td>
                      <td>{getStatusBadge(user.status)}</td>
                      <td>{new Date(user.created_at).toLocaleDateString([], { month: 'short', year: 'numeric' })}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                          <button className="btn-icon-only" title="View details" onClick={() => setSelectedUser(user)}>
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', borderTop: '1px solid var(--border-light)', paddingTop: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Showing {filteredUsers.length} user account(s)
          </span>
        </div>

      </div>

      {/* USER DETAILS MODAL */}
      {selectedUser && (
        <div 
          className="modal-backdrop" 
          onClick={() => setSelectedUser(null)}
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
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div 
            className="modal-content card" 
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '560px',
              padding: '0',
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#fafbfc'
            }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  User Profile Details
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                  Account reference #{selectedUser.id}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {getStatusBadge(selectedUser.status)}
                <button 
                  onClick={() => setSelectedUser(null)}
                  style={{
                    border: 'none',
                    background: '#f1f5f9',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#64748b'
                  }}
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  backgroundColor: selectedUser.role === 'vet' ? '#eff7f2' : '#e6f0ff',
                  color: selectedUser.role === 'vet' ? '#3da860' : '#007aff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  fontWeight: '700'
                }}>
                  {selectedUser.full_name ? selectedUser.full_name.replace('Dr. ', '')[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                    {selectedUser.full_name}
                  </h4>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: selectedUser.role === 'vet' ? '#135431' : '#007aff',
                    backgroundColor: selectedUser.role === 'vet' ? '#eff7f2' : '#e6f0ff',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    display: 'inline-block',
                    marginTop: '4px'
                  }}>
                    {selectedUser.role === 'farmer' ? 'Livestock Owner' : 'Veterinary Doctor'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                    <Mail size={13} color="#007aff" />
                    <span>Email Address</span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', marginTop: '4px', wordBreak: 'break-all' }}>
                    {selectedUser.email || 'N/A'}
                  </div>
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                    <Phone size={13} color="#3da860" />
                    <span>Phone Number</span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', marginTop: '4px' }}>
                    {selectedUser.phone_number || 'N/A'}
                  </div>
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                    <MapPin size={13} color="#ea580c" />
                    <span>District / Region</span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', marginTop: '4px' }}>
                    {selectedUser.district || 'Punjab, Pakistan'}
                  </div>
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                    <Calendar size={13} color="#7e22ce" />
                    <span>Joined Date</span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', marginTop: '4px' }}>
                    {new Date(selectedUser.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {selectedUser.role === 'vet' && (
                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: '#166534' }}>
                    <Award size={15} />
                    <span>Veterinary Credentials</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#15803d', marginTop: '4px' }}>
                    PVMC Reg: <strong>{selectedUser.pvmc_number || 'PVMC-VERIFIED'}</strong> | Specialization: <strong>{selectedUser.specialization || 'Livestock & Ruminants'}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#fafbfc'
            }}>
              <button
                onClick={() => handleBlockAction(selectedUser.id, selectedUser.status)}
                style={{
                  backgroundColor: selectedUser.status === 'blocked' ? '#eff7f2' : '#ffebee',
                  color: selectedUser.status === 'blocked' ? '#3da860' : '#d32f2f',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {selectedUser.status === 'blocked' ? <ShieldCheck size={15} /> : <ShieldAlert size={15} />}
                <span>{selectedUser.status === 'blocked' ? 'Unblock User' : 'Block User'}</span>
              </button>

              <button
                onClick={() => setSelectedUser(null)}
                style={{
                  backgroundColor: '#3da860',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 20px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
