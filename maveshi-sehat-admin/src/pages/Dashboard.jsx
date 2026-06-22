import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Stethoscope, 
  Brain, 
  ShoppingCart, 
  ArrowUpRight, 
  Activity, 
  Check, 
  X, 
  ExternalLink,
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

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const handleUserAction = async (userId, action) => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/users/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action })
      });
      if (res.ok) {
        alert(`Vet account ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
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
        alert(`Pharmacy ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
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
    return <div style={{ padding: '32px', textAlign: 'center' }}>Loading dashboard data... / لوڈ ہو رہا ہے...</div>;
  }

  const trendData = stats?.trendData || [];

  return (
    <div className="dashboard-view">
      
      <div className="grid-4">
        
        <div className="card kpi-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '24px', border: '1px solid var(--border-light)', borderRadius: '16px' }}>
          <div className="kpi-icon-container" style={{ width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e6f0ff', color: '#007aff' }}>
            <Users size={24} />
          </div>
          <div className="kpi-details">
            <h2 className="kpi-value" style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: '#135431' }}>{stats?.totalUsers ?? 0}</h2>
            <p className="kpi-label bilingual-label" style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              <span style={{ fontWeight: 600, display: 'block' }}>Total Users / کل صارفین</span>
            </p>
            <span className="kpi-trend text-green" style={{ fontSize: '11px', fontWeight: '600', color: '#3da860', marginTop: '4px', display: 'block' }}>Registered users</span>
          </div>
        </div>

        
        <div className="card kpi-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '24px', border: '1px solid var(--border-light)', borderRadius: '16px' }}>
          <div className="kpi-icon-container" style={{ width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eff7f2', color: '#3da860' }}>
            <Stethoscope size={24} />
          </div>
          <div className="kpi-details">
            <h2 className="kpi-value" style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: '#135431' }}>{stats?.activeVets ?? 0}</h2>
            <p className="kpi-label bilingual-label" style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              <span style={{ fontWeight: 600, display: 'block' }}>Active Vets / فعال ڈاکٹر</span>
            </p>
            <span className="kpi-trend text-orange" style={{ fontSize: '11px', fontWeight: '600', color: '#ff9800', marginTop: '4px', display: 'block' }}>{stats?.pendingVetsCount ?? 0} pending approval</span>
          </div>
        </div>

        
        <div className="card kpi-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '24px', border: '1px solid var(--border-light)', borderRadius: '16px' }}>
          <div className="kpi-icon-container" style={{ width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff3e0', color: '#ff9800' }}>
            <Brain size={24} />
          </div>
          <div className="kpi-details">
            <h2 className="kpi-value" style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: '#135431' }}>{stats?.scansCount ?? 0}</h2>
            <p className="kpi-label bilingual-label" style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              <span style={{ fontWeight: 600, display: 'block' }}>AI Scans Today / آج کے اسکین</span>
            </p>
            <span className="kpi-trend text-green" style={{ fontSize: '11px', fontWeight: '600', color: '#3da860', marginTop: '4px', display: 'block' }}>All AI scans</span>
          </div>
        </div>

        
        <div className="card kpi-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '24px', border: '1px solid var(--border-light)', borderRadius: '16px' }}>
          <div className="kpi-icon-container" style={{ width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffebee', color: '#d32f2f' }}>
            <ShoppingCart size={24} />
          </div>
          <div className="kpi-details">
            <h2 className="kpi-value" style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: '#135431' }}>{stats?.activeOrders ?? 0}</h2>
            <p className="kpi-label bilingual-label" style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              <span style={{ fontWeight: 600, display: 'block' }}>Active Orders / فعال آرڈر</span>
            </p>
            <span className="kpi-trend text-red" style={{ fontSize: '11px', fontWeight: '600', color: '#d32f2f', marginTop: '4px', display: 'block' }}>Pending fulfillment</span>
          </div>
        </div>
      </div>

      
      <div className="grid-2-1">
        
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

        
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 className="card-title">Pending Actions</h3>
            <p className="card-subtitle">زیر التواء اقدامات</p>
          </div>

          <div className="pending-section" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '20px' }}>
            <h4 className="pending-sec-title" style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>Vets ({stats?.pendingActions?.vets?.length || 0} pending)</h4>
            <div className="pending-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(stats?.pendingActions?.vets || []).map((vet) => (
                <div className="pending-item" key={vet.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#f8fafc', padding: '12px 14px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                  <div className="pending-avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#eff7f2', color: '#3da860', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px', minWidth: '36px' }}>
                    {getInitials(vet.full_name)}
                  </div>
                  <div className="pending-info" style={{ flex: 1, minWidth: 0 }}>
                    <p className="pending-name" style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937', margin: 0 }}>{vet.full_name}</p>
                    <span className="pending-desc" style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>{vet.pvmc_number}</span>
                  </div>
                  <div className="pending-btns" style={{ display: 'flex', gap: '6px' }}>
                    <button className="p-btn-rect-approve" style={{ backgroundColor: '#3da860', color: '#ffffff', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', border: 'none', cursor: 'pointer' }} onClick={() => handleUserAction(vet.id, 'approve')}>
                      Approve
                    </button>
                    <button className="p-btn-rect-reject" style={{ backgroundColor: '#d32f2f', color: '#ffffff', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', border: 'none', cursor: 'pointer' }} onClick={() => handleUserAction(vet.id, 'reject')}>
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pending-section">
            <h4 className="pending-sec-title" style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>Pharmacies ({stats?.pendingActions?.pharmacies?.length || 0} pending)</h4>
            <div className="pending-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(stats?.pendingActions?.pharmacies || []).map((ph) => (
                <div className="pending-item" key={ph.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#f8fafc', padding: '12px 14px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                  <div className="pending-avatar pharmacy" style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#fff3e0', color: '#ff9800', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '36px' }}>
                    <Store size={16} />
                  </div>
                  <div className="pending-info" style={{ flex: 1, minWidth: 0 }}>
                    <p className="pending-name" style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937', margin: 0 }}>{ph.name}</p>
                    <span className="pending-desc" style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>{ph.license_number}</span>
                  </div>
                  <div className="pending-btns" style={{ display: 'flex', gap: '6px' }}>
                    <button className="p-btn-rect-approve" style={{ backgroundColor: '#3da860', color: '#ffffff', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', border: 'none', cursor: 'pointer' }} onClick={() => handlePharmacyAction(ph.id, 'approve')}>
                      Approve
                    </button>
                    <button className="p-btn-rect-reject" style={{ backgroundColor: '#d32f2f', color: '#ffffff', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', border: 'none', cursor: 'pointer' }} onClick={() => handlePharmacyAction(ph.id, 'reject')}>
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      
      <div className="grid-2-1">
        
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
                {(stats?.recentDetections || []).length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                      No recent scans. / کوئی حالیہ تشخیص نہیں ملا۔
                    </td>
                  </tr>
                ) : (
                  (stats?.recentDetections || []).map((det) => (
                    <tr key={det.id}>
                      <td style={{ fontWeight: 600 }}>{det.owner_name}</td>
                      <td>{det.disease}</td>
                      <td>{det.confidence}%</td>
                      <td>
                        <span className={`badge`} style={{
                          color: '#ffffff',
                          backgroundColor: det.risk_level === 'High' ? '#d32f2f' : det.risk_level === 'Medium' ? '#ff9800' : '#3da860',
                          padding: '4px 10px',
                          borderRadius: '30px',
                          fontSize: '11px',
                          fontWeight: '600',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {det.risk_level}
                        </span>
                      </td>
                      <td style={{ color: det.vet_name && det.vet_name !== '—' ? 'inherit' : '#e59a18', fontWeight: det.vet_name ? '500' : 'normal' }}>
                        {det.vet_name || 'Pending'}
                      </td>
                      <td style={{ color: '#777' }}>
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
              <p className="card-subtitle">نظام کی حالت</p>
            </div>
          </div>
          <div className="status-list">
            {(stats?.systemStatus || []).map((sys, idx) => (
              <div className="status-item" key={idx}>
                <div className="status-item-name">
                  <div className={`status-dot ${sys.status === 'Operational' ? 'green' : 'orange'}`}></div>
                  <span style={{ fontWeight: 500 }}>{sys.name}</span>
                </div>
                <div className="status-item-details">
                  <span className="status-txt" style={{ color: sys.status === 'Operational' ? '#3da860' : '#ff9800', fontWeight: '600' }}>{sys.status}</span>
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
