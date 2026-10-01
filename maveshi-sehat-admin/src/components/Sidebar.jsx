import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BarChart3, 
  FileText, 
  Users, 
  UserCheck, 
  Store, 
  ClipboardList, 
  Bell, 
  Settings, 
  LogOut,
  Activity
} from 'lucide-react';
import logoImg from '../assets/logo.png';
import '../styles/Sidebar.css';

export default function Sidebar({ onLogout, adminUser }) {
  const [stats, setStats] = useState(null);
  const [avatar, setAvatar] = useState(() => localStorage.getItem('adminAvatar') || '');

  const displayName = adminUser?.fullName || adminUser?.full_name || 'Awais Shabbir';
  const displayRole = adminUser?.role === 'admin' ? 'Administrator' : (adminUser?.role || 'Administrator');
  const initials = displayName
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0])
    .join('')
    .toUpperCase() || 'AS';

  useEffect(() => {
    const handleAvatarUpdate = () => {
      setAvatar(localStorage.getItem('adminAvatar') || '');
    };
    window.addEventListener('adminAvatarUpdated', handleAvatarUpdate);
    return () => window.removeEventListener('adminAvatarUpdated', handleAvatarUpdate);
  }, []);

  useEffect(() => {
    const fetchSidebarStats = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/admin/dashboard-stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to load sidebar stats", err);
      }
    };

    fetchSidebarStats();
    const interval = setInterval(fetchSidebarStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const menuGroups = [
    {
      title: 'OVERVIEW',
      items: [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/analytics', label: 'Analytics', icon: BarChart3 },
        { path: '/reports', label: 'Reports', icon: FileText }
      ]
    },
    {
      title: 'USER CONTROL',
      items: [
        { path: '/users', label: 'User Management', icon: Users, badgeKey: 'users' },
        { path: '/vets', label: 'Vet Verification', icon: UserCheck, badgeKey: 'vets' },
        { path: '/pharmacy-approval', label: 'Pharmacy Approval', icon: Store, badgeKey: 'pharmacies' }
      ]
    },
    {
      title: 'HEALTH DATA',
      items: [
        { path: '/health-records', label: 'Health Records', icon: ClipboardList },
        { path: '/disease-analytics', label: 'Disease Analytics', icon: Activity }
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { path: '/notifications', label: 'Notifications', icon: Bell, badgeKey: 'notifications' },
        { path: '/settings', label: 'Settings', icon: Settings }
      ]
    }
  ];

  const badges = {
    users: stats?.totalUsers ?? 0,
    vets: stats?.pendingVetsCount ?? 0,
    pharmacies: stats?.pendingActions?.pharmacies?.length ?? 0,
    notifications: stats?.unreadNotificationsCount ?? 0
  };

  return (
    <div className="sidebar">
      
      <div className="sidebar-brand">
        <img 
          src={logoImg} 
          alt="Maveshi Sehat AI Logo" 
          className="sidebar-brand-logo" 
        />
        <div className="brand-info">
          <h2 className="brand-name">Maveshi Sehat AI</h2>
          <span className="brand-tag">Admin Panel</span>
        </div>
      </div>

      <div className="sidebar-profile">
        <div className="profile-avatar">
          {avatar ? (
            <img src={avatar} alt={displayName} className="sidebar-avatar-img" />
          ) : (
            initials
          )}
        </div>
        <div className="profile-info">
          <h3 className="profile-name">{displayName}</h3>
          <span className="profile-role">{displayRole}</span>
        </div>
      </div>

      <div className="sidebar-menu">
        {menuGroups.map((group, groupIdx) => (
          <div className="menu-group" key={groupIdx}>
            <span className="group-title">{group.title}</span>
            <ul className="group-list">
              {group.items.map((item, itemIdx) => (
                <li key={itemIdx}>
                  <NavLink 
                    to={item.path} 
                    className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
                    end={item.path === '/'}
                  >
                    <item.icon className="menu-icon" size={18} />
                    <div className="menu-labels">
                      <span className="label-en">{item.label}</span>
                    </div>
                    {item.badgeKey && badges[item.badgeKey] > 0 && (
                      <span className={`menu-badge ${item.badgeKey === 'vets' || item.badgeKey === 'pharmacies' ? 'badge-warn' : ''}`}>
                        {badges[item.badgeKey]}
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={onLogout}>
          <LogOut className="logout-icon" size={18} />
          <span className="logout-text">Logout</span>
        </button>
      </div>
    </div>
  );
}
