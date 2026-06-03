import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Search, Bell } from 'lucide-react';

export default function Header() {
  const location = useLocation();

  // Page title mappings based on current route path
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
      {/* Dynamic Bilingual Titles */}
      <div className="header-title-container">
        <h1 className="header-title-en">{currentTitle.en}</h1>
        <span className="header-title-ur">{currentTitle.ur}</span>
      </div>

      {/* Right Side Actions */}
      <div className="header-actions">
        {/* Bilingual Search Box */}
        <div className="header-search-container">
          <Search className="search-icon" size={18} />
          <input 
            type="text" 
            placeholder="تلاش کریں / Search..." 
            className="search-input"
          />
        </div>

        {/* Notifications Shortcut */}
        <Link to="/notifications" className="header-notification-btn">
          <Bell size={20} />
          <span className="notification-badge">5</span>
        </Link>

        {/* Admin Quick Profile Avatar */}
        <Link to="/settings" className="header-avatar-btn">
          <div className="header-avatar-circle">SA</div>
          <div className="avatar-online-dot"></div>
        </Link>
      </div>
    </header>
  );
}
