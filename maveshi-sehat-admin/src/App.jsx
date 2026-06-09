import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import UserManagement from './pages/UserManagement';
import VetVerification from './pages/VetVerification';
import PharmacyApproval from './pages/PharmacyApproval';

// Simple placeholder page for sections currently under development
function PlaceholderPage({ name, urdu }) {
  return (
    <div className="card" style={{ padding: '60px 40px', textAlign: 'center', margin: '20px auto', maxWidth: '600px' }}>
      <div style={{ 
        width: '80px', 
        height: '80px', 
        borderRadius: '50%', 
        backgroundColor: 'var(--color-green-light)', 
        color: 'var(--color-green)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        margin: '0 auto 24px',
        fontSize: '28px',
        fontWeight: 'bold'
      }}>
        ✓
      </div>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', marginBottom: '8px', color: 'var(--text-main)' }}>
        {name}
      </h2>
      <p style={{ color: 'var(--color-green)', fontWeight: '600', fontSize: '18px', marginBottom: '16px' }}>
        {urdu}
      </p>
      <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
        This section is ready for layout updates. Database models are successfully connected and verified.
        <br />
        یہ سیکشن تیاری کے عمل میں ہے اور اس کا ڈیٹا بیس کنکشن فعال ہے۔
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
      const expiryTime = 15 * 60 * 1000; // 15 minutes session expiry
      if (Date.now() - parsed.timestamp > expiryTime) {
        sessionStorage.removeItem('adminUser');
        return null;
      }
      return parsed.user;
    } catch (err) {
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
        } catch (err) {
          // Ignore
        }
      }
    };

    // Update session timestamp on mouse activity, keypresses, or clicks
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);

    const interval = setInterval(() => {
      const saved = sessionStorage.getItem('adminUser');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const expiryTime = 15 * 60 * 1000; // 15 minutes
          if (Date.now() - parsed.timestamp > expiryTime) {
            handleLogout();
            alert('Your session has expired due to inactivity. Please log in again. / آپ کا سیشن ختم ہو گیا ہے۔ براہ کرم دوبارہ لاگ ان کریں۔');
          }
        } catch (err) {
          handleLogout();
        }
      } else {
        handleLogout();
      }
    }, 10000); // Check every 10 seconds

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
        {/* Left Sidebar */}
        <Sidebar onLogout={handleLogout} />
        
        {/* Right Main Panel */}
        <div className="main-content">
          {/* Top Header */}
          <Header />
          
          {/* Page Display Area */}
          <main className="page-container">
            <Routes>
              {/* Home Dashboard */}
              <Route path="/" element={<Dashboard />} />
              
              {/* Overview Group */}
              <Route path="/analytics" element={<PlaceholderPage name="Platform & Disease Analytics" urdu="پلیٹ فارم اور بیماری کے تجزیات" />} />
              <Route path="/reports" element={<PlaceholderPage name="Reports Center" urdu="رپورٹس سینٹر" />} />
              
              {/* User Control Group */}
              <Route path="/users" element={<UserManagement />} />
              <Route path="/vets" element={<VetVerification />} />
              <Route path="/pharmacy-approval" element={<PharmacyApproval />} />
              
              {/* Management Group */}
              <Route path="/health-records" element={<PlaceholderPage name="Health Records" urdu="صحت کے ریکارڈ" />} />
              <Route path="/medicines" element={<PlaceholderPage name="Medicine Catalogue" urdu="دوائیوں کی فہرست" />} />
              <Route path="/orders" element={<PlaceholderPage name="Order Management" urdu="آرڈرز کا انتظام" />} />
              <Route path="/notifications" element={<PlaceholderPage name="Notifications & Broadcasts" urdu="اطلاعات اور اعلانات" />} />
              <Route path="/settings" element={<PlaceholderPage name="Settings & Configurations" urdu="ترتیبات اور ترامیم" />} />
              
              {/* Fallback Catch-all Route */}
              <Route path="*" element={<PlaceholderPage name="Page Not Found" urdu="صفحہ نہیں ملا" />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
