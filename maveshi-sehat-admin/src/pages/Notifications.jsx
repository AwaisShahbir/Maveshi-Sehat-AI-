import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Send, 
  RefreshCw, 
  UserCheck, 
  Store, 
  Activity,
  Eye,
  CheckCircle2,
  Users,
  Calendar,
  Tag
} from 'lucide-react';
import '../styles/Notifications.css';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); 
  
  const [notifType, setNotifType] = useState('general');
  const [title, setTitle] = useState('');
  const [messageEn, setMessageEn] = useState('');
  const [sendToOwners, setSendToOwners] = useState(true);
  const [sendToVets, setSendToVets] = useState(true);
  const [sendToPharmacies, setSendToPharmacies] = useState(true);
  const [ownersCount, setOwnersCount] = useState(0);
  const [vetsCount, setVetsCount] = useState(0);
  const [pharmaciesCount, setPharmaciesCount] = useState(0);

  const fetchNotificationsData = async () => {
    setLoading(true);
    try {
      const [notifsRes, usersRes, pharmaciesRes] = await Promise.all([
        fetch('http://localhost:5000/api/admin/notifications'),
        fetch('http://localhost:5000/api/admin/users'),
        fetch('http://localhost:5000/api/admin/pharmacies')
      ]);
      
      if (notifsRes.ok) {
        const notifsData = await notifsRes.json();
        setNotifications(notifsData);
      }
      
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setOwnersCount(usersData.filter(u => u.role === 'farmer' || u.role === 'user').length);
        setVetsCount(usersData.filter(u => u.role === 'vet' || u.role === 'veterinarian').length);
      }

      if (pharmaciesRes.ok) {
        const pharmaciesData = await pharmaciesRes.json();
        const approvedCount = pharmaciesData.filter(p => p.status === 'approved').length;
        setPharmaciesCount(approvedCount || pharmaciesData.length);
      }
    } catch (err) {
      console.error('Error loading notification data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotificationsData();
  }, []);

  const handleSendAnnouncement = async (e) => {
    e.preventDefault();
    if (!title.trim() || !messageEn.trim()) {
      alert('Please fill out the announcement title and message.');
      return;
    }

    const audiences = [];
    if (sendToOwners) audiences.push('owners');
    if (sendToVets) audiences.push('vets');
    if (sendToPharmacies) audiences.push('pharmacies');

    if (audiences.length === 0) {
      alert('Please select at least one recipient audience (Owners, Vets, or Pharmacies).');
      return;
    }

    const target = audiences.length === 3 ? 'all' : audiences.join(',');

    try {
      const res = await fetch('http://localhost:5000/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetAudience: target,
          type: notifType,
          title: title.trim(),
          messageEn: messageEn.trim(),
          messageUr: messageEn.trim()
        })
      });

      if (res.ok) {
        alert('Announcement broadcasted successfully to selected recipients.');
        setTitle('');
        setMessageEn('');
        fetchNotificationsData();
      } else {
        alert('Failed to send announcement.');
      }
    } catch (err) {
      console.error('Error dispatching announcement:', err);
      alert('Failed to connect to backend server.');
    }
  };

  const getRecipientSummary = () => {
    const list = [];
    if (sendToOwners) list.push(`Farmers (${ownersCount})`);
    if (sendToVets) list.push(`Vets (${vetsCount})`);
    if (sendToPharmacies) list.push(`Pharmacies (${pharmaciesCount})`);
    return list.length > 0 ? list.join(', ') : 'None selected';
  };

  const filteredNotifs = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'broadcasts') return n.source === 'announcement';
    if (filter === 'vet') {
      return (n.type && n.type.includes('vet')) || (n.target_audience && n.target_audience.includes('vet'));
    }
    if (filter === 'outbreak') {
      return (n.type && (n.type.includes('outbreak') || n.type.includes('disease')));
    }
    if (filter === 'pharmacy') {
      return (n.type && n.type.includes('pharmacy')) || (n.target_audience && n.target_audience.includes('pharmac'));
    }
    return true;
  });

  const getNotifDetails = (n) => {
    const type = (n.type || 'general').toLowerCase();
    if (type.includes('vet')) {
      return {
        icon: <UserCheck size={18} />,
        itemClass: 'type-vet',
        iconClass: 'icon-vet',
        actionText: 'Review Vet'
      };
    }
    if (type.includes('outbreak') || type.includes('disease')) {
      return {
        icon: <Activity size={18} />,
        itemClass: 'type-outbreak',
        iconClass: 'icon-outbreak',
        actionText: 'View Outbreak'
      };
    }
    if (type.includes('pharmacy') || (n.target_audience && n.target_audience === 'pharmacies')) {
      return {
        icon: <Store size={18} />,
        itemClass: 'type-pharmacy',
        iconClass: 'icon-pharmacy',
        actionText: 'Review Pharmacy'
      };
    }
    if (type.includes('maintenance')) {
      return {
        icon: <RefreshCw size={18} />,
        itemClass: 'type-maintenance',
        iconClass: 'icon-maintenance',
        actionText: 'View Details'
      };
    }
    return {
      icon: <Bell size={18} />,
      itemClass: 'type-general',
      iconClass: 'icon-general',
      actionText: 'View Details'
    };
  };

  const getCategoryDetails = (type) => {
    const t = (type || 'general').toLowerCase();
    switch (t) {
      case 'outbreak':
      case 'disease_outbreak':
        return { label: 'Disease Outbreak', badgeClass: 'cat-outbreak' };
      case 'maintenance':
        return { label: 'System Maintenance', badgeClass: 'cat-maintenance' };
      case 'campaign':
        return { label: 'Vaccination Campaign', badgeClass: 'cat-campaign' };
      case 'vet_pending':
      case 'vet_verification':
        return { label: 'Vet Verification', badgeClass: 'cat-vet' };
      case 'pharmacy_approval':
      case 'pharmacy_pending':
        return { label: 'Pharmacy Approval', badgeClass: 'cat-pharmacy' };
      case 'general':
      default:
        return { label: 'General Alert', badgeClass: 'cat-general' };
    }
  };

  const renderAudienceBadge = (targetAudience, source) => {
    if (source === 'system') {
      return (
        <span className="badge-audience audience-system">
          🛡️ Inbound System Alert
        </span>
      );
    }

    const aud = String(targetAudience || 'all').toLowerCase();
    if (aud === 'all') {
      return (
        <span className="badge-audience audience-all">
          🌐 Sent to: All Platform Users (Farmers, Vets & Pharmacies)
        </span>
      );
    }

    const includesOwners = aud.includes('owner') || aud.includes('farmer');
    const includesVets = aud.includes('vet');
    const includesPharmacies = aud.includes('pharmac');

    if (includesOwners && includesVets && includesPharmacies) {
      return (
        <span className="badge-audience audience-all">
          🌐 Sent to: All Users (Farmers, Vets & Pharmacies)
        </span>
      );
    }

    const recipients = [];
    if (includesOwners) recipients.push('Farmers');
    if (includesVets) recipients.push('Veterinarians');
    if (includesPharmacies) recipients.push('Pharmacies');

    return (
      <span className="badge-audience audience-targeted">
        📢 Sent to: {recipients.join(' & ')}
      </span>
    );
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
              className={`notifications-tab-btn ${filter === 'broadcasts' ? 'active' : ''}`}
              onClick={() => setFilter('broadcasts')}
            >
              Broadcasts Sent ({notifications.filter(n => n.source === 'announcement').length})
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
                const category = getCategoryDetails(n.type);
                return (
                  <div 
                    key={n.id} 
                    className={`card notifications-card-item ${details.itemClass}`}
                  >
                    <div className={`notifications-icon-box ${details.iconClass}`}>
                      {details.icon}
                    </div>
                    <div className="notifications-content">
                      <div className="notifications-header-row">
                        <h4 className="notifications-title">
                          {n.title || (n.type ? n.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Notification')}
                        </h4>
                        <span className={`notifications-category-pill ${category.badgeClass}`}>
                          {category.label}
                        </span>
                      </div>

                      <p className="notifications-text">{n.message_en}</p>

                      <div className="notifications-footer-row">
                        <div className="notifications-audience-container">
                          {renderAudienceBadge(n.target_audience, n.source)}
                        </div>

                        <span className="notifications-timestamp" title={new Date(n.created_at).toISOString()}>
                          <Calendar size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                          {new Date(n.created_at).toLocaleString('en-US', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric',
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredNotifs.length === 0 && (
                <div className="card notifications-empty">
                  No notifications recorded for this filter.
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
                <label className="announcement-check-label">
                  <input 
                    type="checkbox" 
                    checked={sendToPharmacies} 
                    onChange={(e) => setSendToPharmacies(e.target.checked)}
                    className="announcement-check-input"
                  />
                  <span>All Pharmacies ({pharmaciesCount})</span>
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
                onClick={() => alert(`📢 Announcement Preview\n\n🎯 Target Audience: ${getRecipientSummary()}\n📂 Category: ${notifType.toUpperCase()}\n\n📝 Title: ${title || '(No title)'}\n💬 Message: ${messageEn || '(No message)'}`)}
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
