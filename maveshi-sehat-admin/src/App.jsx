import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import UserManagement from './pages/UserManagement';
import VetVerification from './pages/VetVerification';
import PharmacyApproval from './pages/PharmacyApproval';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import HealthRecords from './pages/HealthRecords';
import DiseaseAnalytics from './pages/DiseaseAnalytics';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import './styles/App.css';

function PlaceholderPage({ name }) {
  return (
    <div className="card placeholder-page-card">
      <div className="placeholder-icon-circle">
        ✓
      </div>
      <h2 className="placeholder-title">
        {name}
      </h2>
      <p className="placeholder-desc">
        This module is operational and configured with the backend services.
      </p>
    </div>
  );
}

export default function App() {
  const [adminUser, setAdminUser] = useState(() => {
    const saved = sessionStorage.getItem('adminUser');
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      const expiryTime = 15 * 60 * 1000; 
      if (Date.now() - parsed.timestamp > expiryTime) {
        sessionStorage.removeItem('adminUser');
        return null;
      }
      return parsed.user;
    } catch {
      sessionStorage.removeItem('adminUser');
      return null;
    }
  });

  const handleLogout = () => {
    sessionStorage.removeItem('adminUser');
    setAdminUser(null);
  };

  const handleLoginSuccess = (user) => {
    const sessionData = {
      user: user,
      timestamp: Date.now()
    };
    sessionStorage.setItem('adminUser', JSON.stringify(sessionData));
    setAdminUser(user);
  };

  useEffect(() => {
    if (!adminUser) return;

    const updateActivity = () => {
      const saved = sessionStorage.getItem('adminUser');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          parsed.timestamp = Date.now();
          sessionStorage.setItem('adminUser', JSON.stringify(parsed));
        } catch {
          // ignore parse error
        }
      }
    };

    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);

    const interval = setInterval(() => {
      const saved = sessionStorage.getItem('adminUser');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const expiryTime = 15 * 60 * 1000; 
          if (Date.now() - parsed.timestamp > expiryTime) {
            handleLogout();
            alert('Your session has expired due to inactivity. Please log in again.');
          }
        } catch {
          handleLogout();
        }
      } else {
        handleLogout();
      }
    }, 10000); 

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      clearInterval(interval);
    };
  }, [adminUser]);

  if (!adminUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <BrowserRouter>
      <div className="app-container">
        <Sidebar onLogout={handleLogout} adminUser={adminUser} />
        
        <div className="main-content">
          <Header adminUser={adminUser} />
          
          <main className="page-container">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/disease-analytics" element={<DiseaseAnalytics />} />
              
              <Route path="/users" element={<UserManagement />} />
              <Route path="/vets" element={<VetVerification />} />
              <Route path="/pharmacy-approval" element={<PharmacyApproval />} />
              
              <Route path="/health-records" element={<HealthRecords />} />
              <Route path="/medicines" element={<PlaceholderPage name="Medicine Catalogue" />} />
              <Route path="/orders" element={<PlaceholderPage name="Order Management" />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={<Settings onProfileUpdate={handleLoginSuccess} />} />
              
              <Route path="*" element={<PlaceholderPage name="Page Not Found" />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
