import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Stethoscope, 
  Brain, 
  ShoppingCart, 
  Activity, 
  Store,
  DollarSign,
  Pill,
  Syringe,
  MessageSquare,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  Package,
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
import '../styles/Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
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
      
      {/* 4 Primary High-Level KPIs */}
      <div className="grid-4">
        
        {/* User Ecosystem */}
        <div className="card dashboard-kpi-card">
          <div className="kpi-icon-wrapper blue">
            <Users size={24} />
          </div>
          <div className="kpi-card-details">
            <h2 className="kpi-card-value">{stats?.totalUsers ?? 0}</h2>
            <p className="kpi-card-label">User Ecosystem</p>
            <span className="kpi-card-trend trend-green">
              {stats?.totalFarmers ?? 0} Farmers • {stats?.activeVets ?? 0} Vets
            </span>
          </div>
        </div>

        {/* Telehealth & Care */}
        <div className="card dashboard-kpi-card">
          <div className="kpi-icon-wrapper green">
            <Stethoscope size={24} />
          </div>
          <div className="kpi-card-details">
            <h2 className="kpi-card-value">{stats?.totalConsultations ?? 0}</h2>
            <p className="kpi-card-label">Telehealth Consultations</p>
            <span className="kpi-card-trend trend-orange">
              {stats?.urgentConsultations ?? 0} Urgent • {stats?.completedConsultations ?? 0} Resolved
            </span>
          </div>
        </div>

        {/* Clinical AI Diagnostics */}
        <div className="card dashboard-kpi-card">
          <div className="kpi-icon-wrapper orange">
            <Brain size={24} />
          </div>
          <div className="kpi-card-details">
            <h2 className="kpi-card-value">{stats?.scansCount ?? 0}</h2>
            <p className="kpi-card-label">Clinical AI Scans</p>
            <span className="kpi-card-trend trend-green">
              {stats?.avgConfidence ?? 91.5}% Avg Confidence • {stats?.highRiskScansCount ?? 0} High Risk
            </span>
          </div>
        </div>

        {/* Marketplace & Platform GMV */}
        <div className="card dashboard-kpi-card">
          <div className="kpi-icon-wrapper red">
            <ShoppingCart size={24} />
          </div>
          <div className="kpi-card-details">
            <h2 className="kpi-card-value">
              Rs. {(stats?.totalRevenue || 0).toLocaleString()}
            </h2>
            <p className="kpi-card-label">Platform Sales (GMV)</p>
            <span className="kpi-card-trend trend-red">
              {stats?.totalOrders ?? 0} Orders ({stats?.activeOrders ?? 0} Active)
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Operational Stats Ribbon */}
      <div className="secondary-stats-grid">
        <div 
          className="secondary-stat-card" 
          onClick={() => navigate('/pharmacy-approval?tab=approved')} 
          style={{ cursor: 'pointer' }}
          title="Click to view all registered pharmacies"
        >
          <div className="sec-stat-icon-wrap purple">
            <Store size={20} />
          </div>
          <div className="sec-stat-info">
            <span className="sec-stat-val">{stats?.approvedPharmacies ?? 0}</span>
            <span className="sec-stat-label">Active Pharmacies</span>
            <span className="sec-stat-sub warn">
              {stats?.pendingPharmaciesCount ?? 0} pending review
            </span>
          </div>
        </div>

        <div 
          className="secondary-stat-card" 
          onClick={() => navigate('/pharmacy-approval?tab=medicines')} 
          style={{ cursor: 'pointer' }}
          title="Click to view all cataloged medicines and stock status across pharmacies"
        >
          <div className="sec-stat-icon-wrap cyan">
            <Pill size={20} />
          </div>
          <div className="sec-stat-info">
            <span className="sec-stat-val">{stats?.totalMedicines ?? 0}</span>
            <span className="sec-stat-label">Cataloged Medicines</span>
            <span className="sec-stat-sub warn">
              {stats?.lowStockMedsCount ?? 0} low stock alerts
            </span>
          </div>
        </div>

        <div className="secondary-stat-card">
          <div className="sec-stat-icon-wrap emerald">
            <Syringe size={20} />
          </div>
          <div className="sec-stat-info">
            <span className="sec-stat-val">{stats?.totalVaccinations ?? 0}</span>
            <span className="sec-stat-label">Herd Vaccinations</span>
            <span className="sec-stat-sub">Immunization logged</span>
          </div>
        </div>

        <div 
          className="secondary-stat-card"
          onClick={() => navigate('/community-forum')}
          style={{ cursor: 'pointer' }}
          title="Click to inspect and moderate Community Forum discussions & replies"
        >
          <div className="sec-stat-icon-wrap indigo">
            <MessageSquare size={20} />
          </div>
          <div className="sec-stat-info">
            <span className="sec-stat-val">{stats?.totalForumPosts ?? 0}</span>
            <span className="sec-stat-label">Community Forum</span>
            <span className="sec-stat-sub">Farmer-Vet Q&A</span>
          </div>
        </div>
      </div>

      {/* Live Outbreak Surveillance & Disease Incidence */}
      <div className="outbreak-surveillance-banner">
        <div className="outbreak-left">
          <div className="outbreak-pulse-icon">
            <AlertTriangle size={22} />
          </div>
          <div>
            <h4 className="outbreak-title">Livestock Disease Surveillance & Early Warning</h4>
            <p className="outbreak-desc">
              Live disease incidence tracking across active diagnostic scans in Punjab farming districts
            </p>
          </div>
        </div>

        <div className="disease-chips-row">
          {(stats?.topDiseases && stats.topDiseases.length > 0) ? (
            stats.topDiseases.map((d, i) => (
              <div className="disease-chip" key={i}>
                <span>{d.disease}</span>
                <span className="disease-chip-count">{d.count} cases</span>
              </div>
            ))
          ) : (
            <div className="disease-chip">
              <span>Lumpy Skin Disease (LSD)</span>
              <span className="disease-chip-count">Active Alert</span>
            </div>
          )}
        </div>
      </div>

      {/* Detection Trends & Pending Approvals */}
      <div className="grid-2-1">
        
        <div>
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

          {/* Top Demanded Medicines */}
          <div className="card top-meds-card">
            <div className="card-title-container">
              <div>
                <h3 className="card-title">Top Demanded Livestock Medicines</h3>
                <p className="card-subtitle">Most frequently purchased pharmaceutical products across pharmacies</p>
              </div>
              <Pill className="text-muted" size={20} />
            </div>
            <div className="table-responsive">
              <table className="custom-table top-meds-table">
                <thead>
                  <tr>
                    <th>Medicine Name</th>
                    <th>Manufacturer</th>
                    <th>Dosage Form</th>
                    <th>Orders</th>
                    <th>Units Sold</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats?.topMedicines || []).length === 0 ? (
                    <tr>
                      <td colSpan="5" className="table-empty-row">
                        No medicine orders recorded yet.
                      </td>
                    </tr>
                  ) : (
                    (stats?.topMedicines || []).map((med, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: '700', color: '#135431' }}>{med.name}</td>
                        <td>{med.manufacturer || 'General'}</td>
                        <td>
                          <span className="badge-risk low" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                            {med.dosage_form || 'Injectable'}
                          </span>
                        </td>
                        <td>{med.order_count || 1} orders</td>
                        <td style={{ fontWeight: '700' }}>{med.units_sold || 1} units</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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

      {/* Top Demanded Livestock Medicines & Pharmacy Ownership */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-title-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Pill size={18} style={{ color: '#3da860' }} />
              Top Demanded Livestock Medicines by Pharmacy
            </h3>
            <p className="card-subtitle">
              Most ordered veterinary pharmaceuticals across registered pharmacies
            </p>
          </div>
          <button 
            className="pharmacy-view-meds-btn"
            onClick={() => navigate('/pharmacy-approval?tab=medicines')}
            style={{ cursor: 'pointer' }}
          >
            <span>View All Catalog & Stock</span>
            <ExternalLink size={13} />
          </button>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Medicine Name</th>
                <th>Formulation / Dosage</th>
                <th>Dispensing Pharmacy</th>
                <th>Units Sold</th>
                <th>Demand Status</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.topMedicines || []).length === 0 ? (
                <tr>
                  <td colSpan="6" className="table-empty-row">
                    No medicine orders recorded yet.
                  </td>
                </tr>
              ) : (
                stats.topMedicines.map((med, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: '700', color: '#94a3b8' }}>{idx + 1}</td>
                    <td>
                      <span style={{ fontWeight: '700', color: '#0f172a' }}>{med.name}</span>
                      {med.manufacturer && <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>{med.manufacturer}</span>}
                    </td>
                    <td>
                      <span className="top-med-badge">{med.dosage_form || 'Standard'}</span>
                    </td>
                    <td>
                      <span className="pharmacy-store-badge">
                        <Store size={12} />
                        <span>{med.pharmacy_name || 'AI-shefa'}</span>
                      </span>
                    </td>
                    <td style={{ fontWeight: '700', color: '#0f172a' }}>
                      {med.units_sold || med.order_count || 1} units
                    </td>
                    <td>
                      <span className="badge badge-green">High Demand</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
