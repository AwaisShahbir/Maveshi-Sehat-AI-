import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Search, Bell } from 'lucide-react';
import '../styles/Header.css';

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
    '/': 'Dashboard',
    '/analytics': 'Platform Analytics',
    '/reports': 'Reports Center',
    '/users': 'User Management',
    '/vets': 'Vet Verification',
    '/pharmacy-approval': 'Pharmacy Approval',
    '/health-records': 'Health Records',
    '/disease-analytics': 'Disease Analytics',
    '/medicines': 'Medicine Catalogue',
    '/orders': 'Order Management',
    '/notifications': 'Notifications',
    '/settings': 'Settings & Configuration'
  };

  const currentTitle = routeTitles[location.pathname] || 'Admin Panel';

  return (
    <header className="main-header">
      
      <div className="header-title-container">
        <h1 className="header-title-en">{currentTitle}</h1>
      </div>

      <div className="header-actions">
        
        <div className="header-search-container">
          <Search className="search-icon" size={18} />
          <input 
            type="text" 
            placeholder="Search records, users..." 
            className="search-input"
          />
        </div>

        <Link to="/notifications" className="header-notification-btn" title="View notifications">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount}</span>
          )}
        </Link>

        <Link to="/settings" className="header-avatar-btn" title="Account settings">
          <div className="header-avatar-circle">SA</div>
          <div className="avatar-online-dot"></div>
        </Link>
      </div>
    </header>
  );
}
