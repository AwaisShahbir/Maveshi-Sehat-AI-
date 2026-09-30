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
import './Notifications.css';

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
          itemClass: 'type-vet',
          iconClass: 'icon-vet',
          actionText: 'Review Vet'
        };
      case 'disease_outbreak':
      case 'outbreak':
        return {
          icon: <Activity size={18} />,
          itemClass: 'type-outbreak',
          iconClass: 'icon-outbreak',
          actionText: 'View Outbreak'
        };
      case 'pharmacy_approval':
      case 'pharmacy_pending':
        return {
          icon: <Store size={18} />,
          itemClass: 'type-pharmacy',
          iconClass: 'icon-pharmacy',
          actionText: 'Review Pharmacy'
        };
      default:
        return {
          icon: <Bell size={18} />,
          itemClass: 'type-general',
          iconClass: 'icon-general',
          actionText: 'View Details'
        };
    }
  };

  return (
    <div className="notifications-view">
      
      <div className="notifications-grid">
        
        <div>
          
          <div className="notifications-tabs">
            <button 
              className={`notifications-tab-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All Notifications ({notifications.length})
            </button>
            <button 
              className={`notifications-tab-btn ${filter === 'vet' ? 'active' : ''}`}
              onClick={() => setFilter('vet')}
            >
              Vet Approvals
            </button>
            <button 
              className={`notifications-tab-btn ${filter === 'outbreak' ? 'active' : ''}`}
              onClick={() => setFilter('outbreak')}
            >
              Disease Alerts
            </button>
            <button 
              className={`notifications-tab-btn ${filter === 'pharmacy' ? 'active' : ''}`}
              onClick={() => setFilter('pharmacy')}
            >
              Pharmacy
            </button>
            <button 
              className="btn-icon-only notifications-refresh-btn" 
              onClick={fetchNotificationsData} 
              title="Refresh notifications"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {loading ? (
            <div className="notifications-loading">Loading notifications...</div>
          ) : (
            <div className="notifications-list">
              {filteredNotifs.map((n) => {
                const details = getNotifDetails(n);
                return (
                  <div 
                    key={n.id} 
                    className={`card notifications-card-item ${details.itemClass}`}
                  >
                    <div className={`notifications-icon-box ${details.iconClass}`}>
                      {details.icon}
                    </div>
                    <div className="notifications-content">
                      <h4 className="notifications-title">
                        {n.type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </h4>
                      <p className="notifications-text">{n.message_en}</p>
                      <span className="notifications-timestamp">
                        {new Date(n.created_at).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              {filteredNotifs.length === 0 && (
                <div className="card notifications-empty">
                  No notifications recorded.
                </div>
              )}
            </div>
          )}

        </div>

        {/* Announcement Dispatch Form */}
        <div className="card announcement-card">
          <h3 className="announcement-title">Send Announcement</h3>
          <p className="card-subtitle announcement-subtitle">Broadcast notifications to platform users</p>
          
          <form onSubmit={handleSendAnnouncement} className="announcement-form">
            
            <div>
              <span className="announcement-label">Send to:</span>
              <div className="announcement-check-group">
                <label className="announcement-check-label">
                  <input 
                    type="checkbox" 
                    checked={sendToOwners} 
                    onChange={(e) => setSendToOwners(e.target.checked)}
                    className="announcement-check-input"
                  />
                  <span>All Owners ({ownersCount})</span>
                </label>
                <label className="announcement-check-label">
                  <input 
                    type="checkbox" 
                    checked={sendToVets} 
                    onChange={(e) => setSendToVets(e.target.checked)}
                    className="announcement-check-input"
                  />
                  <span>All Vets ({vetsCount})</span>
                </label>
              </div>
            </div>

            <div>
              <span className="announcement-label">Notification Category:</span>
              <div className="announcement-radio-group">
                {[
                  { id: 'general', label: 'General Alert' },
                  { id: 'outbreak', label: 'Disease Outbreak Warning' },
                  { id: 'maintenance', label: 'System Maintenance' },
                  { id: 'campaign', label: 'Vaccination Campaign' }
                ].map((type) => (
                  <label key={type.id} className="announcement-radio-label">
                    <input 
                      type="radio" 
                      name="notifType" 
                      value={type.id} 
                      checked={notifType === type.id}
                      onChange={() => setNotifType(type.id)}
                      className="announcement-radio-input"
                    />
                    <span>{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Announcement Title</label>
              <input 
                type="text" 
                className="form-control announcement-input"
                placeholder="e.g. Critical Vaccination Notice"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Broadcast Message</label>
              <textarea 
                className="form-control announcement-textarea"
                placeholder="Enter announcement details..."
                value={messageEn}
                onChange={(e) => setMessageEn(e.target.value)}
              />
            </div>

            <div className="announcement-actions">
              <button 
                type="button" 
                className="announcement-preview-btn" 
                onClick={() => alert(`Announcement Preview:\n\nTitle: ${title}\nMessage: ${messageEn}`)}
              >
                <Eye size={14} />
                <span>Preview</span>
              </button>
              <button 
                type="submit" 
                className="announcement-submit-btn" 
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
