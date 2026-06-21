import React, { useState } from 'react';
import { Bell, ShieldAlert, Store, ShoppingBag, CheckCircle, AlertTriangle, Send, Eye } from 'lucide-react';

export default function Notifications() {
  const [filter, setFilter] = useState('all');
  const [sendToOwners, setSendToOwners] = useState(false);
  const [sendToVets, setSendToVets] = useState(false);
  const [notifType, setNotifType] = useState('general');
  const [title, setTitle] = useState('');
  const [messageEn, setMessageEn] = useState('');
  const [messageUr, setMessageUr] = useState('');

  const notifications = [
    {
      id: 1,
      type: 'unread',
      title: 'New vet application submitted',
      desc: 'Dr. Amjad Khan submitted verification — Lahore',
      urduDesc: 'ڈاکٹر امجد خان نے تصدیق جمع کرائی — لاہور',
      time: '5 minutes ago',
      color: '#3da860',
      bgColor: '#eff7f2',
      icon: <Bell size={18} />,
      actionText: 'View →',
      actionLink: '/vets'
    },
    {
      id: 2,
      type: 'alert',
      title: 'High risk case unattended — 6 hours',
      desc: 'FMD case by Fatima Bibi has no vet assigned',
      urduDesc: 'فاطمہ بی بی کا ایف ایم ڈی کیس — ڈاکٹر نہیں ملا',
      time: '1 hour ago',
      color: '#d32f2f',
      bgColor: '#ffebee',
      icon: <ShieldAlert size={18} />,
      actionText: 'Assign Vet →',
      actionLink: '/'
    },
    {
      id: 3,
      type: 'unread',
      title: 'New pharmacy approval request',
      desc: 'Al-Noor Medical Store — Multan',
      urduDesc: 'النور میڈیکل اسٹور — ملتان',
      time: '3 hours ago',
      color: '#ff9800',
      bgColor: '#fff3e0',
      icon: <Store size={18} />,
      actionText: 'Review →',
      actionLink: '/pharmacy-approval'
    },
    {
      id: 4,
      type: 'system',
      title: 'Order dispatched successfully',
      desc: 'Order #ORD-1047 dispatched to Ahmad Khan',
      urduDesc: 'آرڈر احمد خان کو بھیج دیا گیا',
      time: '5 hours ago',
      color: '#007aff',
      bgColor: '#e6f0ff',
      icon: <ShoppingBag size={18} />,
      actionText: '→',
      actionLink: '/'
    },
    {
      id: 5,
      type: 'system',
      title: 'Vet verification approved',
      desc: 'Dr. Sara Ahmed has been verified and activated',
      urduDesc: 'ڈاکٹر سارہ احمد کی تصدیق ہو گئی',
      time: '1 day ago',
      color: '#3da860',
      bgColor: '#eff7f2',
      icon: <CheckCircle size={18} />,
      actionText: '→',
      actionLink: '/vets'
    },
    {
      id: 6,
      type: 'alert',
      title: 'Low stock alert',
      desc: 'Deltamethrin Tick Grease — only 12 units left',
      urduDesc: 'ٹک گریس کم ہو گئی — صرف 12 یونٹ باقی',
      time: '1 day ago',
      color: '#ff9800',
      bgColor: '#fff3e0',
      icon: <AlertTriangle size={18} />,
      actionText: '→',
      actionLink: '/'
    }
  ];

  const handleSendAnnouncement = (e) => {
    e.preventDefault();
    if (!title || !messageEn) {
      alert('Please fill out the announcement fields.');
      return;
    }
    alert(`Announcement "${title}" sent successfully!`);
    setTitle('');
    setMessageEn('');
    setMessageUr('');
    setSendToOwners(false);
    setSendToVets(false);
  };

  const filteredNotifs = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return n.type === 'unread';
    if (filter === 'alert') return n.type === 'alert';
    if (filter === 'system') return n.type === 'system';
    return true;
  });

  return (
    <div className="notifications-view">
      
      <div className="grid-2-1" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '4px' }}>
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
              Unread (5)
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
          </div>

          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredNotifs.map((n) => (
              <div 
                key={n.id} 
                className="card"
                style={{ 
                  display: 'flex', 
                  gap: '16px', 
                  padding: '20px', 
                  borderRadius: '16px', 
                  borderLeft: `5px solid ${n.color}`,
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
                  backgroundColor: n.bgColor,
                  color: n.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '36px'
                }}>
                  {n.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#1f2937', margin: '0 0 2px 0' }}>{n.title}</h4>
                  <p style={{ fontSize: '13px', color: '#4b5563', margin: '0 0 4px 0' }}>{n.desc}</p>
                  <p className="urdu" style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 8px 0', fontWeight: '500' }}>{n.urduDesc}</p>
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>{n.time}</span>
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
                  {n.actionText}
                </button>
              </div>
            ))}
          </div>

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
                  <span>All Owners (198)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', color: '#4b5563' }}>
                  <input 
                    type="checkbox" 
                    checked={sendToVets} 
                    onChange={(e) => setSendToVets(e.target.checked)}
                    style={{ accentColor: '#3da860' }}
                  />
                  <span>All Vets (34)</span>
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
