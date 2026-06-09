import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [currentView, setCurrentView] = useState('login'); // 'login', 'register', 'dashboard'
  const [pharmacy, setPharmacy] = useState(null);

  // Check for saved session on load
  useEffect(() => {
    const savedSession = localStorage.getItem('maveshi_sehat_pharmacy_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setPharmacy(parsed);
        setCurrentView('dashboard');
      } catch (err) {
        localStorage.removeItem('maveshi_sehat_pharmacy_session');
      }
    }
  }, []);

  const handleLoginSuccess = (pharmacyData) => {
    setPharmacy(pharmacyData);
    localStorage.setItem('maveshi_sehat_pharmacy_session', JSON.stringify(pharmacyData));
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setPharmacy(null);
    localStorage.removeItem('maveshi_sehat_pharmacy_session');
    setCurrentView('login');
  };

  return (
    <div style={styles.app}>
      {currentView === 'login' && (
        <Login 
          onLoginSuccess={handleLoginSuccess} 
          onViewChange={setCurrentView} 
        />
      )}
      
      {currentView === 'register' && (
        <Register 
          onViewChange={setCurrentView} 
        />
      )}
      
      {currentView === 'dashboard' && pharmacy && (
        <Dashboard 
          pharmacy={pharmacy} 
          onLogout={handleLogout} 
        />
      )}
    </div>
  );
}

const styles = {
  app: {
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#0f172a',
    display: 'flex',
    flexDirection: 'column',
    overflowX: 'hidden',
  }
};
