import React, { useState, useEffect } from 'react';
import { Bell, ShieldAlert, Store, ShoppingBag, CheckCircle, AlertTriangle, Send, Eye, RefreshCw } from 'lucide-react';

export default function Notifications() {
  const [filter, setFilter] = useState('all');
  const [sendToOwners, setSendToOwners] = useState(false);
  const [sendToVets, setSendToVets] = useState(false);
  const [notifType, setNotifType] = useState('general');
  const [title, setTitle] = useState('');
  const [messageEn, setMessageEn] = useState('');
  const [messageUr, setMessageUr] = useState('');
  
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotificationsData = async () => {
    setLoading(true);
    try {
      const resNotifs = await fetch('http://localhost:5000/api/admin/notifications');
      const resUsers = await fetch('http://localhost:5000/api/admin/users');
      if (resNotifs.ok) {
        const notifs = await resNotifs.json();
        setNotifications(notifs);
      }
      if (resUsers.ok) {
        const usersData = await resUsers.json();
        setUsers(usersData);
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
      alert('Please fill out the announcement fields.');
      return;
    }
    const targetAudience = sendToOwners && sendToVets ? 'all' : sendToOwners ? 'farmers' : sendToVets ? 'vets' : 'all';
    try {
      const res = await fetch('http://localhost:5000/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetAudience,
          type: notifType,
          title,
          messageEn,
          messageUr
        })
      });
      if (res.ok) {
        alert(`Announcement "${title}" sent successfully!`);
        setTitle('');
        setMessageEn('');
        setMessageUr('');
        setSendToOwners(false);
        setSendToVets(false);
      } else {
        alert('Failed to send announcement.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getNotifDetails = (n) => {
    let color = '#3da860';
    let bgColor = '#eff7f2';
    let icon = <Bell size={18} />;
    let actionText = 'View →';
    let actionLink = '/';

    if (n.type === 'vet_application') {
      color = '#3da860';
      bgColor = '#eff7f2';
      icon = <Bell size={18} />;
      actionText = 'View →';
      actionLink = '/vets';
    } else if (n.type === 'high_risk_case') {
      color = '#d32f2f';
      bgColor = '#ffebee';
      icon = <ShieldAlert size={18} />;
      actionText = 'Assign Vet →';
      actionLink = '/';
    } else if (n.type === 'pharmacy_approval') {
      color = '#ff9800';
      bgColor = '#fff3e0';
      icon = <Store size={18} />;
      actionText = 'Review →';
      actionLink = '/pharmacy-approval';
    } else if (n.type === 'alert') {
      color = '#ff9800';
      bgColor = '#fff3e0';
      icon = <AlertTriangle size={18} />;
      actionText = '→';
      actionLink = '/';
    }

    return { color, bgColor, icon, actionText, actionLink };
  };

  const filteredNotifs = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    if (filter === 'alert') return n.type === 'high_risk_case' || n.type === 'alert';
    if (filter === 'system') return n.type !== 'high_risk_case' && n.type !== 'pharmacy_approval' && n.type !== 'vet_application';
    return true;
  });

  const ownersCount = users.filter(u => u.role === 'farmer').length;
  const vetsCount = users.filter(u => u.role === 'vet').length;

  return (
    <div className="notifications-view">
      
      <div className="grid-2-1" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '4px', alignItems: 'center' }}>
            <button 
              onClick={() => setFilter('all')}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '600',
                backgroundColor: filter === 'all' ? '#3da860' : '#ffffff',
                color: filter === 'all' ? '#ffffff' : 'var(--text-muted)',
                border: filter === 'all' ? 'none' : '1px solid var(--border-light)',
                cursor: 'pointer'
              }}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('unread')}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '600',
                backgroundColor: filter === 'unread' ? '#3da860' : '#ffffff',
                color: filter === 'unread' ? '#ffffff' : 'var(--text-muted)',
                border: filter === 'unread' ? 'none' : '1px solid var(--border-light)',
                cursor: 'pointer'
              }}
            >
              Unread ({notifications.filter(n => !n.read).length})
            </button>
            <button 
              onClick={() => setFilter('alert')}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '600',
                backgroundColor: filter === 'alert' ? '#3da860' : '#ffffff',
                color: filter === 'alert' ? '#ffffff' : 'var(--text-muted)',
                border: filter === 'alert' ? 'none' : '1px solid var(--border-light)',
                cursor: 'pointer'
              }}
            >
              Alerts
            </button>
            <button 
              onClick={() => setFilter('system')}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '600',
                backgroundColor: filter === 'system' ? '#3da860' : '#ffffff',
                color: filter === 'system' ? '#ffffff' : 'var(--text-muted)',
                border: filter === 'system' ? 'none' : '1px solid var(--border-light)',
                cursor: 'pointer'
              }}
            >
              System
            </button>
            <button className="btn-icon-only" onClick={fetchNotificationsData} title="Refresh database" style={{ marginLeft: 'auto' }}>
              <RefreshCw size={16} />
            </button>
          </div>

          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Loading notifications... / لوڈ ہو رہا ہے...</div>
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
                      <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#1f2937', margin: '0 0 2px 0' }}>
                        {n.type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </h4>
                      <p style={{ fontSize: '13px', color: '#4b5563', margin: '0 0 4px 0' }}>{n.message_en}</p>
                      <p className="urdu" style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 8px 0', fontWeight: '500' }}>{n.message_ur}</p>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                        {new Date(n.created_at).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <button 
                      style={{
                        alignSelf: 'center',
                        background: 'none',
                        border: 'none',
                        color: '#3da860',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                      onClick={() => alert(`Redirecting to details page...`)}
                    >
                      {details.actionText}
                    </button>
                  </div>
                );
              })}
              {filteredNotifs.length === 0 && (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }} className="card">
                  No notifications found. / کوئی اطلاع نہیں ملی۔
                </div>
              )}
            </div>
          )}

        </div>

        
        
        <div className="card" style={{ padding: '24px', borderRadius: '16px', height: 'fit-content' }}>
          <h3 className="card-title" style={{ fontSize: '18px', fontWeight: '700', color: '#135431', marginBottom: '2px' }}>Send Announcement</h3>
          <p className="card-subtitle" style={{ marginBottom: '20px' }}>اعلان بھیجیں</p>
          
          <form onSubmit={handleSendAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '8px' }}>Send to / بھیجیں:</span>
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
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '8px' }}>Notification Type:</span>
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
              <label className="form-label" style={{ fontSize: '12px', fontWeight: '700' }}>Title / عنوان</label>
              <input 
                type="text" 
                className="form-control"
                placeholder="Notification title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ height: '42px', borderRadius: '10px' }}
              />
            </div>

            
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: '700' }}>Message (EN) / پیغام انگریزی</label>
              <textarea 
                className="form-control"
                placeholder="Write message in English..."
                value={messageEn}
                onChange={(e) => setMessageEn(e.target.value)}
                style={{ height: '80px', borderRadius: '10px', resize: 'none' }}
              />
            </div>

            
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: '700' }}>Message (UR) / پیغام اردو</label>
              <textarea 
                className="form-control urdu"
                placeholder="اردو میں پیغام لکھیں..."
                value={messageUr}
                onChange={(e) => setMessageUr(e.target.value)}
                style={{ height: '80px', borderRadius: '10px', resize: 'none', textAlign: 'right' }}
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
                <span>Send Now / ابھی بھیجیں</span>
              </button>
            </div>

          </form>
        </div>

      </div>

    </div>
  );
}
