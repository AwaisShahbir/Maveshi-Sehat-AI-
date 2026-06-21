import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [currentView, setCurrentView] = useState('login'); 
  const [pharmacy, setPharmacy] = useState(null);

  
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
    <div className="min-h-screen w-screen bg-slate-50 flex flex-col overflow-x-hidden">
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

