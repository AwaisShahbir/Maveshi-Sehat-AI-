import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Send, 
  RefreshCw, 
  UserCheck, 
  Store, 
  Activity,
  Eye
} from 'lucide-react';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); 
  
  const [notifType, setNotifType] = useState('general');
  const [title, setTitle] = useState('');
  const [messageEn, setMessageEn] = useState('');
  const [sendToOwners, setSendToOwners] = useState(true);
  const [sendToVets, setSendToVets] = useState(true);
  const [ownersCount, setOwnersCount] = useState(0);
  const [vetsCount, setVetsCount] = useState(0);

  const fetchNotificationsData = async () => {
    setLoading(true);
    try {
      const notifsRes = await fetch('http://localhost:5000/api/admin/notifications');
      const usersRes = await fetch('http://localhost:5000/api/admin/users');
      
      if (notifsRes.ok) {
        const notifsData = await notifsRes.json();
        setNotifications(notifsData);
      }
      
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setOwnersCount(usersData.filter(u => u.role === 'farmer').length);
        setVetsCount(usersData.filter(u => u.role === 'vet').length);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotificationsData();
  }, []);

  const handleSendAnnouncement = async (e) => {
    e.preventDefault();
    if (!title || !messageEn) {
      alert('Please fill out the announcement title and message.');
      return;
    }

    let target = 'all';
    if (sendToOwners && !sendToVets) target = 'owners';
    if (!sendToOwners && sendToVets) target = 'vets';
    if (!sendToOwners && !sendToVets) {
      alert('Please select at least one recipient audience.');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetAudience: target,
          type: notifType,
          title,
          messageEn,
          messageUr: messageEn
        })
      });

      if (res.ok) {
        alert('Announcement broadcasted successfully.');
        setTitle('');
        setMessageEn('');
        fetchNotificationsData();
      } else {
        alert('Failed to send announcement.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredNotifs = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'vet') return n.type.includes('vet');
    if (filter === 'outbreak') return n.type.includes('outbreak') || n.type.includes('disease');
    if (filter === 'pharmacy') return n.type.includes('pharmacy');
    if (filter === 'system') return n.type.includes('system') || n.type.includes('alert');
    return true;
  });

  const getNotifDetails = (n) => {
    switch (n.type) {
      case 'vet_pending':
      case 'vet_verification':
        return {
          icon: <UserCheck size={18} />,
          color: '#ff9800',
          bgColor: '#fff3e0',
          actionText: 'Review Vet'
        };
      case 'disease_outbreak':
      case 'outbreak':
        return {
          icon: <Activity size={18} />,
          color: '#d32f2f',
          bgColor: '#ffebee',
          actionText: 'View Outbreak'
        };
      case 'pharmacy_approval':
      case 'pharmacy_pending':
        return {
          icon: <Store size={18} />,
          color: '#007aff',
          bgColor: '#e6f0ff',
          actionText: 'Review Pharmacy'
        };
      default:
        return {
          icon: <Bell size={18} />,
          color: '#3da860',
          bgColor: '#eff7f2',
          actionText: 'View Details'
        };
    }
  };

  return (
    <div className="notifications-view">
      
      <div className="grid-2-1" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        
        <div>
          
          <div className="tabs-container" style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-light)', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button 
              className={`tab-btn ${filter === 'all' ? 'active' : ''}`}
              style={{
                padding: '8px 12px',
                fontSize: '13px',
                fontWeight: '600',
                backgroundColor: filter === 'all' ? '#eff7f2' : 'transparent',
                color: filter === 'all' ? '#3da860' : 'var(--text-muted)',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer'
              }}
              onClick={() => setFilter('all')}
            >
              All Notifications ({notifications.length})
            </button>
            <button 
              className={`tab-btn ${filter === 'vet' ? 'active' : ''}`}
              style={{
                padding: '8px 12px',
                fontSize: '13px',
                fontWeight: '600',
                backgroundColor: filter === 'vet' ? '#eff7f2' : 'transparent',
                color: filter === 'vet' ? '#3da860' : 'var(--text-muted)',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer'
              }}
              onClick={() => setFilter('vet')}
            >
              Vet Approvals
            </button>
            <button 
              className={`tab-btn ${filter === 'outbreak' ? 'active' : ''}`}
              style={{
                padding: '8px 12px',
                fontSize: '13px',
                fontWeight: '600',
                backgroundColor: filter === 'outbreak' ? '#eff7f2' : 'transparent',
                color: filter === 'outbreak' ? '#3da860' : 'var(--text-muted)',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer'
              }}
              onClick={() => setFilter('outbreak')}
            >
              Disease Alerts
            </button>
            <button 
              className={`tab-btn ${filter === 'pharmacy' ? 'active' : ''}`}
              style={{
                padding: '8px 12px',
                fontSize: '13px',
                fontWeight: '600',
                backgroundColor: filter === 'pharmacy' ? '#eff7f2' : 'transparent',
                color: filter === 'pharmacy' ? '#3da860' : 'var(--text-muted)',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer'
              }}
              onClick={() => setFilter('pharmacy')}
            >
              Pharmacy
            </button>
            <button className="btn-icon-only" onClick={fetchNotificationsData} title="Refresh notifications" style={{ marginLeft: 'auto' }}>
              <RefreshCw size={16} />
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading notifications...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredNotifs.map((n) => {
                const details = getNotifDetails(n);
                return (
                  <div 
                    key={n.id} 
                    className="card"
                    style={{ 
                      display: 'flex', 
                      gap: '16px', 
                      padding: '20px', 
                      borderRadius: '16px', 
                      borderLeft: `5px solid ${details.color}`,
                      borderTop: '1px solid var(--border-light)',
                      borderRight: '1px solid var(--border-light)',
                      borderBottom: '1px solid var(--border-light)',
                      alignItems: 'flex-start',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: details.bgColor,
                      color: details.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '36px'
                    }}>
                      {details.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#1f2937', margin: '0 0 4px 0' }}>
                        {n.type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </h4>
                      <p style={{ fontSize: '13px', color: '#4b5563', margin: '0 0 6px 0' }}>{n.message_en}</p>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                        {new Date(n.created_at).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              {filteredNotifs.length === 0 && (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }} className="card">
                  No notifications recorded.
                </div>
              )}
            </div>
          )}

        </div>

        {/* Announcement Dispatch Form */}
        <div className="card" style={{ padding: '24px', borderRadius: '16px', height: 'fit-content', backgroundColor: '#ffffff' }}>
          <h3 className="card-title" style={{ fontSize: '18px', fontWeight: '700', color: '#135431', marginBottom: '2px' }}>Send Announcement</h3>
          <p className="card-subtitle" style={{ marginBottom: '20px' }}>Broadcast notifications to platform users</p>
          
          <form onSubmit={handleSendAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '8px' }}>Send to:</span>
              <div style={{ display: 'flex', gap: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', color: '#4b5563' }}>
                  <input 
                    type="checkbox" 
                    checked={sendToOwners} 
                    onChange={(e) => setSendToOwners(e.target.checked)}
                    style={{ accentColor: '#3da860' }}
                  />
                  <span>All Owners ({ownersCount})</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', color: '#4b5563' }}>
                  <input 
                    type="checkbox" 
                    checked={sendToVets} 
                    onChange={(e) => setSendToVets(e.target.checked)}
                    style={{ accentColor: '#3da860' }}
                  />
                  <span>All Vets ({vetsCount})</span>
                </label>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '8px' }}>Notification Category:</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                {[
                  { id: 'general', label: 'General Alert' },
                  { id: 'outbreak', label: 'Disease Outbreak Warning' },
                  { id: 'maintenance', label: 'System Maintenance' },
                  { id: 'campaign', label: 'Vaccination Campaign' }
                ].map((type) => (
                  <label key={type.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#374151' }}>
                    <input 
                      type="radio" 
                      name="notifType" 
                      value={type.id} 
                      checked={notifType === type.id}
                      onChange={() => setNotifType(type.id)}
                      style={{ accentColor: '#3da860' }}
                    />
                    <span>{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: '700' }}>Announcement Title</label>
              <input 
                type="text" 
                className="form-control"
                placeholder="e.g. Critical Vaccination Notice"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ height: '42px', borderRadius: '10px' }}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: '700' }}>Broadcast Message</label>
              <textarea 
                className="form-control"
                placeholder="Enter announcement details..."
                value={messageEn}
                onChange={(e) => setMessageEn(e.target.value)}
                style={{ height: '110px', borderRadius: '10px', resize: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => alert(`Announcement Preview:\n\nTitle: ${title}\nMessage: ${messageEn}`)}
                style={{ flex: 1, height: '42px', border: '1px solid var(--border-light)', backgroundColor: '#ffffff', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Eye size={14} />
                <span>Preview</span>
              </button>
              <button 
                type="submit" 
                className="btn" 
                style={{ flex: 1.2, height: '42px', backgroundColor: '#3da860', color: '#ffffff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Send size={14} />
                <span>Send Broadcast</span>
              </button>
            </div>

          </form>
        </div>

      </div>

    </div>
  );
}
