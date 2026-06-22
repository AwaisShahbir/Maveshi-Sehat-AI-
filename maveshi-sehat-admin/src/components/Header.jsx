import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Search, Bell } from 'lucide-react';

export default function Header() {
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/admin/notifications');
        if (res.ok) {
          const data = await res.json();
          const unread = data.filter(n => !n.read).length;
          setUnreadCount(unread);
        }
      } catch (err) {
        console.error('Failed to fetch notification count', err);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, []);

  const routeTitles = {
    '/': { en: 'Dashboard', ur: 'ڈیش بورڈ' },
    '/analytics': { en: 'Platform Analytics', ur: 'پلیٹ فارم تجزیات' },
    '/reports': { en: 'Reports Center', ur: 'رپورٹس سینٹر' },
    '/users': { en: 'User Management', ur: 'صارف انتظام' },
    '/vets': { en: 'Vet Verification', ur: 'ڈاکٹر تصدیق' },
    '/pharmacy-approval': { en: 'Pharmacy Approval', ur: 'فارمیسی منظوری' },
    '/health-records': { en: 'Health Records', ur: 'صحت کے ریکارڈ' },
    '/medicines': { en: 'Medicine Catalogue', ur: 'دوائی فہرست' },
    '/orders': { en: 'Order Management', ur: 'آرڈر انتظام' },
    '/notifications': { en: 'Notifications', ur: 'اطلاعات' },
    '/settings': { en: 'Settings & Configuration', ur: 'ترتیبات' }
  };

  const currentTitle = routeTitles[location.pathname] || { en: 'Admin Panel', ur: 'ایڈمن پینل' };

  return (
    <header className="main-header">
      
      <div className="header-title-container">
        <h1 className="header-title-en">{currentTitle.en}</h1>
        <span className="header-title-ur">{currentTitle.ur}</span>
      </div>

      
      <div className="header-actions">
        
        <div className="header-search-container">
          <Search className="search-icon" size={18} />
          <input 
            type="text" 
            placeholder="تلاش کریں / Search..." 
            className="search-input"
          />
        </div>

        
        <Link to="/notifications" className="header-notification-btn">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount}</span>
          )}
        </Link>

        
        <Link to="/settings" className="header-avatar-btn">
          <div className="header-avatar-circle">SA</div>
          <div className="avatar-online-dot"></div>
        </Link>
      </div>
    </header>
  );
}
