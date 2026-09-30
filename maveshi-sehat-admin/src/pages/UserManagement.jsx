import React, { useState, useEffect } from 'react';
import { Eye, ShieldAlert, ShieldCheck, Download, Search, RefreshCw, X, Mail, Phone, MapPin, Calendar, Award } from 'lucide-react';
import '../styles/UserManagement.css';

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
    if (status === 'blocked') return <span className="badge badge-red">Blocked</span>;
    if (status === 'pending') return <span className="badge badge-orange">Pending</span>;
    if (status === 'verified') return <span className="badge badge-green">Verified</span>;
    return <span className="badge badge-green">Active</span>;
  };

  return (
    <div className="user-management-view">
      
      {/* Top Filter & Search Controls */}
      <div className="user-top-controls">
        
        <div className="filter-btn-group">
          <button 
            className={`btn filter-pill-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All ({users.length})
          </button>
          <button 
            className={`btn filter-pill-btn ${activeFilter === 'owner' ? 'active' : ''}`}
            onClick={() => setActiveFilter('owner')}
          >
            Owners ({users.filter(u => u.role === 'farmer').length})
          </button>
          <button 
            className={`btn filter-pill-btn ${activeFilter === 'vet' ? 'active' : ''}`}
            onClick={() => setActiveFilter('vet')}
          >
            Vets ({users.filter(u => u.role === 'vet').length})
          </button>
          <button 
            className={`btn filter-pill-btn ${activeFilter === 'blocked' ? 'blocked-active' : ''}`}
            onClick={() => setActiveFilter('blocked')}
          >
            Blocked ({users.filter(u => u.status === 'blocked').length})
          </button>
        </div>

        <div className="search-export-group">
          <div className="header-search-container user-search-wrapper">
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
            className="btn btn-secondary export-csv-btn" 
            onClick={handleExportCSV}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid-3">
        <div className="card um-kpi-card">
          <span className="um-kpi-label">Total Registered</span>
          <span className="um-kpi-value">{users.length}</span>
        </div>
        <div className="card um-kpi-card">
          <span className="um-kpi-label">Active Accounts</span>
          <span className="um-kpi-value">
            {users.filter(u => u.status !== 'blocked').length}
          </span>
        </div>
        <div className="card um-kpi-card">
          <span className="um-kpi-label">Blocked Accounts</span>
          <span className="um-kpi-value danger">
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
          <div className="um-loading-state">Loading users database...</div>
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="um-empty-state">
                      No user accounts found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, idx) => (
                    <tr key={user.id}>
                      <td>{idx + 1}</td>
                      <td>
                        <div className="user-cell-wrapper">
                          <div className={`user-table-avatar ${user.role === 'vet' ? 'vet' : 'owner'}`}>
                            {user.full_name ? user.full_name.replace('Dr. ', '')[0].toUpperCase() : 'U'}
                          </div>
                          <span className="user-table-name">{user.full_name}</span>
                        </div>
                      </td>
                      <td>
                        {user.role === 'farmer' ? 'Livestock Owner' : 'Veterinary Doctor'}
                      </td>
                      <td>{user.phone_number}</td>
                      <td>{user.district || 'Punjab'}</td>
                      <td>{getStatusBadge(user.status)}</td>
                      <td>{new Date(user.created_at).toLocaleDateString([], { month: 'short', year: 'numeric' })}</td>
                      <td>
                        <div className="action-cell-buttons">
                          <button className="btn-icon-only" title="View details" onClick={() => setSelectedUser(user)}>
                            <Eye size={16} />
                          </button>
                          <button 
                            className={`btn-icon-only btn-action-shield ${user.status === 'blocked' ? 'unblock' : 'block'}`}
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

        <div className="table-footer-count">
          <span className="table-footer-text">
            Showing {filteredUsers.length} user account(s)
          </span>
        </div>

      </div>

      {/* USER DETAILS MODAL */}
      {selectedUser && (
        <div 
          className="um-modal-backdrop" 
          onClick={() => setSelectedUser(null)}
        >
          <div 
            className="um-modal-content card" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="um-modal-header">
              <div>
                <h3 className="um-modal-title">
                  User Profile Details
                </h3>
                <p className="um-modal-subtitle">
                  Account reference #{selectedUser.id}
                </p>
              </div>

              <div className="um-modal-header-actions">
                {getStatusBadge(selectedUser.status)}
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="um-modal-close-btn"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="um-modal-body">
              <div className="um-profile-header">
                <div className={`um-avatar-large ${selectedUser.role === 'vet' ? 'vet' : 'owner'}`}>
                  {selectedUser.full_name ? selectedUser.full_name.replace('Dr. ', '')[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <h4 className="um-user-fullname">
                    {selectedUser.full_name}
                  </h4>
                  <span className={`um-role-badge ${selectedUser.role === 'vet' ? 'vet' : 'owner'}`}>
                    {selectedUser.role === 'farmer' ? 'Livestock Owner' : 'Veterinary Doctor'}
                  </span>
                </div>
              </div>

              <div className="um-info-grid">
                <div className="um-info-box">
                  <div className="um-info-box-header">
                    <Mail size={13} color="#007aff" />
                    <span>Email Address</span>
                  </div>
                  <div className="um-info-box-value">
                    {selectedUser.email || 'N/A'}
                  </div>
                </div>

                <div className="um-info-box">
                  <div className="um-info-box-header">
                    <Phone size={13} color="#3da860" />
                    <span>Phone Number</span>
                  </div>
                  <div className="um-info-box-value">
                    {selectedUser.phone_number || 'N/A'}
                  </div>
                </div>

                <div className="um-info-box">
                  <div className="um-info-box-header">
                    <MapPin size={13} color="#ea580c" />
                    <span>District / Region</span>
                  </div>
                  <div className="um-info-box-value">
                    {selectedUser.district || 'Punjab, Pakistan'}
                  </div>
                </div>

                <div className="um-info-box">
                  <div className="um-info-box-header">
                    <Calendar size={13} color="#7e22ce" />
                    <span>Joined Date</span>
                  </div>
                  <div className="um-info-box-value">
                    {new Date(selectedUser.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {selectedUser.role === 'vet' && (
                <div className="um-credentials-card">
                  <div className="um-credentials-header">
                    <Award size={15} />
                    <span>Veterinary Credentials</span>
                  </div>
                  <div className="um-credentials-body">
                    PVMC Reg: <strong>{selectedUser.pvmc_number || 'PVMC-VERIFIED'}</strong> | Specialization: <strong>{selectedUser.specialization || 'Livestock & Ruminants'}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="um-modal-footer">
              <button
                onClick={() => handleBlockAction(selectedUser.id, selectedUser.status)}
                className={`um-block-btn ${selectedUser.status === 'blocked' ? 'unblock' : 'block'}`}
              >
                {selectedUser.status === 'blocked' ? <ShieldCheck size={15} /> : <ShieldAlert size={15} />}
                <span>{selectedUser.status === 'blocked' ? 'Unblock User' : 'Block User'}</span>
              </button>

              <button
                onClick={() => setSelectedUser(null)}
                className="um-close-btn"
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
