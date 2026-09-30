import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Stethoscope, 
  Brain, 
  ShoppingCart, 
  Activity, 
  Store
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/dashboard-stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to load dashboard stats", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleUserAction = async (userId, action) => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/users/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action })
      });
      if (res.ok) {
        alert(`Vet account ${action === 'approve' ? 'approved' : 'rejected'} successfully.`);
        fetchStats(); 
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePharmacyAction = async (pharmacyId, action) => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/pharmacies/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pharmacyId, action })
      });
      if (res.ok) {
        alert(`Pharmacy ${action === 'approve' ? 'approved' : 'rejected'} successfully.`);
        fetchStats(); 
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'V';
    return name
      .replace('Dr.', '')
      .trim()
      .split(' ')
      .slice(0, 2)
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  if (loading) {
    return <div className="dashboard-loading">Loading dashboard metrics...</div>;
  }

  const trendData = stats?.trendData || [];

  return (
    <div className="dashboard-view">
      
      {/* 4 Primary KPIs */}
      <div className="grid-4">
        
        <div className="card dashboard-kpi-card">
          <div className="kpi-icon-wrapper blue">
            <Users size={24} />
          </div>
          <div className="kpi-card-details">
            <h2 className="kpi-card-value">{stats?.totalUsers ?? 0}</h2>
            <p className="kpi-card-label">Total Users</p>
            <span className="kpi-card-trend trend-green">Registered user accounts</span>
          </div>
        </div>

        <div className="card dashboard-kpi-card">
          <div className="kpi-icon-wrapper green">
            <Stethoscope size={24} />
          </div>
          <div className="kpi-card-details">
            <h2 className="kpi-card-value">{stats?.activeVets ?? 0}</h2>
            <p className="kpi-card-label">Active Veterinarians</p>
            <span className="kpi-card-trend trend-orange">{stats?.pendingVetsCount ?? 0} pending review</span>
          </div>
        </div>

        <div className="card dashboard-kpi-card">
          <div className="kpi-icon-wrapper orange">
            <Brain size={24} />
          </div>
          <div className="kpi-card-details">
            <h2 className="kpi-card-value">{stats?.scansCount ?? 0}</h2>
            <p className="kpi-card-label">Total AI Scans</p>
            <span className="kpi-card-trend trend-green">Clinical diagnoses run</span>
          </div>
        </div>

        <div className="card dashboard-kpi-card">
          <div className="kpi-icon-wrapper red">
            <ShoppingCart size={24} />
          </div>
          <div className="kpi-card-details">
            <h2 className="kpi-card-value">{stats?.activeOrders ?? 0}</h2>
            <p className="kpi-card-label">Active Pharmacy Orders</p>
            <span className="kpi-card-trend trend-red">Orders in progress</span>
          </div>
        </div>
      </div>

      {/* Detection Trends & Pending Approvals */}
      <div className="grid-2-1">
        
        <div className="card">
          <div className="card-title-container">
            <div>
              <h3 className="card-title">Disease Detection Trends</h3>
              <p className="card-subtitle">Last 30 days clinical scan history</p>
            </div>
            <Activity className="text-muted" size={20} />
          </div>
          <div className="chart-container-300">
            <ResponsiveContainer>
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Line type="monotone" dataKey="LSD" stroke="#3da860" strokeWidth={3} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="FMD" stroke="#ff9800" strokeWidth={3} />
                <Line type="monotone" dataKey="Tick" stroke="#d32f2f" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card pending-actions-card">
          <div>
            <h3 className="card-title">Pending Actions</h3>
            <p className="card-subtitle">Approvals requiring administrator review</p>
          </div>

          <div className="pending-section bordered">
            <h4 className="pending-sec-title">
              Veterinarians ({stats?.pendingActions?.vets?.length || 0} pending)
            </h4>
            <div className="pending-list">
              {(stats?.pendingActions?.vets || []).map((vet) => (
                <div className="pending-item" key={vet.id}>
                  <div className="pending-avatar">
                    {getInitials(vet.full_name)}
                  </div>
                  <div className="pending-info">
                    <p className="pending-name">{vet.full_name}</p>
                    <span className="pending-desc">{vet.pvmc_number || 'PVMC Verified'}</span>
                  </div>
                  <div className="pending-btns">
                    <button className="p-btn-rect-approve" onClick={() => handleUserAction(vet.id, 'approve')}>
                      Approve
                    </button>
                    <button className="p-btn-rect-reject" onClick={() => handleUserAction(vet.id, 'reject')}>
                      Reject
                    </button>
                  </div>
                </div>
              ))}
              {(stats?.pendingActions?.vets || []).length === 0 && (
                <div className="pending-empty-msg">
                  No pending veterinarian applications.
                </div>
              )}
            </div>
          </div>

          <div className="pending-section">
            <h4 className="pending-sec-title">
              Pharmacies ({stats?.pendingActions?.pharmacies?.length || 0} pending)
            </h4>
            <div className="pending-list">
              {(stats?.pendingActions?.pharmacies || []).map((ph) => (
                <div className="pending-item" key={ph.id}>
                  <div className="pending-avatar pharmacy">
                    <Store size={16} />
                  </div>
                  <div className="pending-info">
                    <p className="pending-name">{ph.name}</p>
                    <span className="pending-desc">{ph.license_number}</span>
                  </div>
                  <div className="pending-btns">
                    <button className="p-btn-rect-approve" onClick={() => handlePharmacyAction(ph.id, 'approve')}>
                      Approve
                    </button>
                    <button className="p-btn-rect-reject" onClick={() => handlePharmacyAction(ph.id, 'reject')}>
                      Reject
                    </button>
                  </div>
                </div>
              ))}
              {(stats?.pendingActions?.pharmacies || []).length === 0 && (
                <div className="pending-empty-msg">
                  No pending pharmacy applications.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Detections & System Status */}
      <div className="grid-2-1">
        
        <div className="card">
          <div className="card-title-container">
            <div>
              <h3 className="card-title">Recent Detections</h3>
              <p className="card-subtitle">Live clinical diagnosis activity</p>
            </div>
          </div>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Owner</th>
                  <th>Disease</th>
                  <th>Confidence</th>
                  <th>Risk</th>
                  <th>Vet Assigned</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.recentDetections || []).length === 0 ? (
                  <tr>
                    <td colSpan="6" className="table-empty-row">
                      No recent scans recorded.
                    </td>
                  </tr>
                ) : (
                  (stats?.recentDetections || []).map((det) => (
                    <tr key={det.id}>
                      <td className="table-owner-name">{det.owner_name}</td>
                      <td>{det.disease}</td>
                      <td>{det.confidence}%</td>
                      <td>
                        <span className={`badge-risk ${det.risk_level === 'High' ? 'high' : det.risk_level === 'Medium' ? 'medium' : 'low'}`}>
                          {det.risk_level}
                        </span>
                      </td>
                      <td className={det.vet_name && det.vet_name !== '—' ? '' : 'table-vet-pending'}>
                        {det.vet_name || 'Pending'}
                      </td>
                      <td className="table-time-muted">
                        {det.created_at ? (
                          new Date(det.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        ) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-title-container">
            <div>
              <h3 className="card-title">System Status</h3>
              <p className="card-subtitle">Infrastructure & API service availability</p>
            </div>
          </div>
          <div className="status-list">
            {(stats?.systemStatus || []).map((sys, idx) => (
              <div className="status-item" key={idx}>
                <div className="status-item-name">
                  <div className={`status-dot ${sys.status === 'Operational' ? 'green' : 'orange'}`}></div>
                  <span>{sys.name}</span>
                </div>
                <div className="status-item-details">
                  <span className={`status-txt ${sys.status === 'Operational' ? 'operational' : 'degraded'}`}>{sys.status}</span>
                  <span className="status-uptime">{sys.uptime}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
