import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Stethoscope, 
  Binary, 
  ShoppingBag, 
  ArrowUpRight, 
  Activity, 
  Check, 
  X, 
  ExternalLink 
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

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch stats from backend
  const fetchStats = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/dashboard-stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to load dashboard stats", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Approve/Reject actions
  const handleUserAction = async (userId, action) => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/users/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action })
      });
      if (res.ok) {
        alert(`Vet account ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
        fetchStats(); // refresh data
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
        alert(`Pharmacy ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
        fetchStats(); // refresh data
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div style={{ padding: '32px', textAlign: 'center' }}>Loading dashboard data... / لوڈ ہو رہا ہے...</div>;
  }

  // Fallback default mock data for the trends chart if backend has no historical data
  const trendData = [
    { name: '01 May', LSD: 12, FMD: 8, Tick: 15 },
    { name: '03 May', LSD: 15, FMD: 12, Tick: 18 },
    { name: '05 May', LSD: 25, FMD: 10, Tick: 12 },
    { name: '07 May', LSD: 18, FMD: 15, Tick: 20 },
    { name: '09 May', LSD: 30, FMD: 22, Tick: 17 },
    { name: '11 May', LSD: 22, FMD: 19, Tick: 25 },
    { name: '12 May', LSD: 28, FMD: 24, Tick: 22 }
  ];

  return (
    <div className="dashboard-view">
      
      {/* 1. KPIs Top Grid */}
      <div className="grid-4">
        {/* Total Users */}
        <div className="card kpi-card">
          <div className="kpi-icon-container blue">
            <Users size={24} />
          </div>
          <div className="kpi-details">
            <h2 className="kpi-value">{stats?.totalUsers || 248}</h2>
            <p className="kpi-label bilingual-label">
              <span>Total Users</span>
              <span className="urdu">کل صارفین</span>
            </p>
            <span className="kpi-trend text-green">↑ 12 this week</span>
          </div>
        </div>

        {/* Active Vets */}
        <div className="card kpi-card">
          <div className="kpi-icon-container green">
            <Stethoscope size={24} />
          </div>
          <div className="kpi-details">
            <h2 className="kpi-value">{stats?.activeVets || 34}</h2>
            <p className="kpi-label bilingual-label">
              <span>Active Vets</span>
              <span className="urdu">فعال ڈاکٹر</span>
            </p>
            <span className="kpi-trend text-orange">{stats?.pendingVetsCount || 6} pending approval</span>
          </div>
        </div>

        {/* AI Scans Today */}
        <div className="card kpi-card">
          <div className="kpi-icon-container yellow">
            <Binary size={24} />
          </div>
          <div className="kpi-details">
            <h2 className="kpi-value">{stats?.scansCount || 127}</h2>
            <p className="kpi-label bilingual-label">
              <span>AI Scans Today</span>
              <span className="urdu">آج کے اسکین</span>
            </p>
            <span className="kpi-trend text-green">↑ 23% vs yesterday</span>
          </div>
        </div>

        {/* Active Orders */}
        <div className="card kpi-card">
          <div className="kpi-icon-container red">
            <ShoppingBag size={24} />
          </div>
          <div className="kpi-details">
            <h2 className="kpi-value">{stats?.activeOrders || 12}</h2>
            <p className="kpi-label bilingual-label">
              <span>Active Orders</span>
              <span className="urdu">فعال آرڈر</span>
            </p>
            <span className="kpi-trend text-red">3 awaiting dispatch</span>
          </div>
        </div>
      </div>

      {/* 2. Middle Grid: Line Chart & Pending Actions */}
      <div className="grid-2-1">
        {/* Line Chart */}
        <div className="card">
          <div className="card-title-container">
            <div>
              <h3 className="card-title">Disease Detection Trends</h3>
              <p className="card-subtitle">Last 30 days • بیماری کا رجحان</p>
            </div>
            <Activity className="text-muted" size={20} />
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="LSD" stroke="#00c853" strokeWidth={3} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="FMD" stroke="#ff9500" strokeWidth={3} />
                <Line type="monotone" dataKey="Tick" stroke="#ff3b30" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pending Actions */}
        <div className="card">
          <div className="card-title-container">
            <div>
              <h3 className="card-title">Pending Actions</h3>
              <p className="card-subtitle">زیر التواء اقدامات</p>
            </div>
          </div>

          <div className="pending-section">
            <h4 className="pending-sec-title">Vets ({stats?.pendingActions?.vets?.length || 0} pending)</h4>
            <div className="pending-list">
              {stats?.pendingActions?.vets?.map((vet) => (
                <div className="pending-item" key={vet.id}>
                  <div className="pending-avatar">V</div>
                  <div className="pending-info">
                    <p className="pending-name">{vet.full_name}</p>
                    <span className="pending-desc">{vet.pvmc_number}</span>
                  </div>
                  <div className="pending-btns">
                    <button className="p-btn p-btn-approve" onClick={() => handleUserAction(vet.id, 'approve')}>
                      <Check size={14} />
                    </button>
                    <button className="p-btn p-btn-reject" onClick={() => handleUserAction(vet.id, 'reject')}>
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {(!stats?.pendingActions?.vets || stats.pendingActions.vets.length === 0) && (
                <p className="empty-msg">No pending vets</p>
              )}
            </div>
          </div>

          <div className="pending-section" style={{ marginTop: '20px' }}>
            <h4 className="pending-sec-title">Pharmacies ({stats?.pendingActions?.pharmacies?.length || 0} pending)</h4>
            <div className="pending-list">
              {stats?.pendingActions?.pharmacies?.map((ph) => (
                <div className="pending-item" key={ph.id}>
                  <div className="pending-avatar pharmacy">P</div>
                  <div className="pending-info">
                    <p className="pending-name">{ph.name}</p>
                    <span className="pending-desc">{ph.license_number}</span>
                  </div>
                  <div className="pending-btns">
                    <button className="p-btn p-btn-approve" onClick={() => handlePharmacyAction(ph.id, 'approve')}>
                      <Check size={14} />
                    </button>
                    <button className="p-btn p-btn-reject" onClick={() => handlePharmacyAction(ph.id, 'reject')}>
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {(!stats?.pendingActions?.pharmacies || stats.pendingActions.pharmacies.length === 0) && (
                <p className="empty-msg">No pending pharmacies</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Grid: Recent Detections & System Status */}
      <div className="grid-2-1">
        {/* Recent Detections */}
        <div className="card">
          <div className="card-title-container">
            <div>
              <h3 className="card-title">Recent Detections</h3>
              <p className="card-subtitle">حالیہ تشخیص</p>
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
                {stats?.recentDetections?.map((det) => (
                  <tr key={det.id}>
                    <td style={{ fontWeight: 600 }}>{det.owner_name}</td>
                    <td>{det.disease}</td>
                    <td>{det.confidence}%</td>
                    <td>
                      <span className={`badge ${
                        det.risk_level === 'High' ? 'badge-red' : 
                        det.risk_level === 'Medium' ? 'badge-orange' : 'badge-green'
                      }`}>
                        {det.risk_level}
                      </span>
                    </td>
                    <td style={{ color: det.vet_name ? 'inherit' : '#e59a18' }}>
                      {det.vet_name || 'Pending'}
                    </td>
                    <td style={{ color: '#777' }}>
                      {new Date(det.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Status */}
        <div className="card">
          <div className="card-title-container">
            <div>
              <h3 className="card-title">System Status</h3>
              <p className="card-subtitle">نظام کی حالت</p>
            </div>
          </div>
          <div className="status-list">
            {stats?.systemStatus?.map((sys, idx) => (
              <div className="status-item" key={idx}>
                <div className="status-item-name">
                  <div className={`status-dot ${sys.status === 'Operational' ? 'green' : 'orange'}`}></div>
                  <span>{sys.name}</span>
                </div>
                <div className="status-item-details">
                  <span className="status-txt">{sys.status}</span>
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
