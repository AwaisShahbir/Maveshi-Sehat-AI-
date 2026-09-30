import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Scan, 
  Stethoscope, 
  TrendingUp, 
  RefreshCw
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import './Analytics.css';

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('30days');
  const [users, setUsers] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const usersRes = await fetch('http://localhost:5000/api/admin/users');
      const recordsRes = await fetch('http://localhost:5000/api/admin/health-records');
      
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }
      if (recordsRes.ok) {
        const recordsData = await recordsRes.json();
        setRecords(recordsData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const nowTime = React.useMemo(() => Date.now(), []);
  const ms30d = 30 * 24 * 60 * 60 * 1000;
  
  const newUsersLast30 = users.filter(u => (nowTime - new Date(u.created_at).getTime()) <= ms30d).length;
  const newUsersPrev30 = users.filter(u => {
    const diff = nowTime - new Date(u.created_at).getTime();
    return diff > ms30d && diff <= (ms30d * 2);
  }).length;
  const usersTrendVal = newUsersPrev30 ? Math.round(((newUsersLast30 - newUsersPrev30) / newUsersPrev30) * 100) : newUsersLast30 * 10;
  const newUsersTrend = (usersTrendVal >= 0 ? '+' : '') + usersTrendVal + '%';

  const scansLast30 = records.filter(r => (nowTime - new Date(r.created_at).getTime()) <= ms30d).length;
  const scansPrev30 = records.filter(r => {
    const diff = nowTime - new Date(r.created_at).getTime();
    return diff > ms30d && diff <= (ms30d * 2);
  }).length;
  const scansTrendVal = scansPrev30 ? Math.round(((scansLast30 - scansPrev30) / scansPrev30) * 100) : scansLast30 * 10;
  const scansTrend = (scansTrendVal >= 0 ? '+' : '') + scansTrendVal + '%';

  const consultations = records.filter(r => r.disease !== 'Healthy' && r.disease !== 'BCS Normal').length;
  const consultationsTrend = '+12.5%';

  const avgConf = records.length ? Math.round(records.reduce((sum, r) => sum + (parseFloat(r.confidence) || 0), 0) / records.length) : 0;
  const avgResponse = avgConf ? avgConf + '%' : '0%';
  const avgResponseTrend = 'Avg. Confidence';

  const stats = {
    newUsers: newUsersLast30.toLocaleString(),
    newUsersTrend,
    scans: scansLast30.toLocaleString(),
    scansTrend,
    consultations: consultations.toLocaleString(),
    consultationsTrend,
    avgResponse,
    avgResponseTrend
  };

  const chartData = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = d.toLocaleString([], { month: 'short' });
    const year = d.getFullYear();
    const monthVal = d.getMonth();

    const monthlyUsers = users.filter(u => {
      const ud = new Date(u.created_at);
      return ud.getFullYear() === year && ud.getMonth() === monthVal;
    });

    chartData.push({
      name: monthName,
      Owners: monthlyUsers.filter(u => u.role === 'farmer').length,
      Veterinarians: monthlyUsers.filter(u => u.role === 'vet').length
    });
  }

  const successRate = records.length ? Math.round((records.filter(r => (parseFloat(r.confidence) || 0) >= 75).length / records.length) * 100) : 94;
  const responseRate = records.length ? Math.round((records.filter(r => r.vet_name).length / records.length) * 100) : 88;

  const engagementMetrics = [
    { name: 'Active User Ratio', value: users.length ? `${Math.round((users.filter(u => u.status !== 'blocked').length / users.length) * 100)}%` : '100%', trend: '+4.2%', isPositive: true },
    { name: 'Monthly Registered Accounts', value: users.length.toString(), trend: '+12.3%', isPositive: true },
    { name: 'Scan Success Rate (Conf >= 75%)', value: successRate + '%', trend: '+2.1%', isPositive: true },
    { name: 'Veterinary Assignment Rate', value: responseRate + '%', trend: '+3.5%', isPositive: true }
  ];

  const vetCases = {};
  records.forEach(r => {
    if (r.vet_name) {
      vetCases[r.vet_name] = (vetCases[r.vet_name] || 0) + 1;
    }
  });

  const vetsList = users.filter(u => u.role === 'vet');
  const topVets = vetsList.map(v => {
    const cases = vetCases[v.full_name] || 0;
    return {
      name: v.full_name,
      city: v.district || 'Punjab',
      cases: cases,
      specialization: v.specialization || 'Livestock Specialist'
    };
  }).sort((a, b) => b.cases - a.cases).slice(0, 5).map((v, index) => ({
    rank: index + 1,
    ...v
  }));

  return (
    <div className="analytics-view">
      
      <div className="analytics-top-bar">
        <button className="btn-icon-only" onClick={fetchAnalyticsData} title="Refresh database">
          <RefreshCw size={16} />
        </button>
        <div className="analytics-time-selector">
          <button 
            onClick={() => setTimeRange('7days')}
            className={`analytics-time-btn ${timeRange === '7days' ? 'active' : ''}`}
          >
            Last 7 Days
          </button>
          <button 
            onClick={() => setTimeRange('30days')}
            className={`analytics-time-btn ${timeRange === '30days' ? 'active' : ''}`}
          >
            Last 30 Days
          </button>
          <button 
            onClick={() => setTimeRange('90days')}
            className={`analytics-time-btn ${timeRange === '90days' ? 'active' : ''}`}
          >
            Last 90 Days
          </button>
        </div>
      </div>

      {loading ? (
        <div className="analytics-loading">Loading platform analytics...</div>
      ) : (
        <>
          <div className="grid-4 analytics-stats-grid">
            <div className="card analytics-stat-card">
              <div className="analytics-stat-icon-wrapper icon-blue">
                <Users size={20} />
              </div>
              <div className="analytics-stat-info">
                <span className="analytics-stat-value">{stats.newUsers}</span>
                <span className="analytics-stat-label">New Users (30d)</span>
              </div>
              <span className="analytics-stat-trend">{stats.newUsersTrend}</span>
            </div>

            <div className="card analytics-stat-card">
              <div className="analytics-stat-icon-wrapper icon-green">
                <Scan size={20} />
              </div>
              <div className="analytics-stat-info">
                <span className="analytics-stat-value">{stats.scans}</span>
                <span className="analytics-stat-label">AI Scans (30d)</span>
              </div>
              <span className="analytics-stat-trend">{stats.scansTrend}</span>
            </div>

            <div className="card analytics-stat-card">
              <div className="analytics-stat-icon-wrapper icon-orange">
                <Stethoscope size={20} />
              </div>
              <div className="analytics-stat-info">
                <span className="analytics-stat-value">{stats.consultations}</span>
                <span className="analytics-stat-label">Clinical Cases</span>
              </div>
              <span className="analytics-stat-trend">{stats.consultationsTrend}</span>
            </div>

            <div className="card analytics-stat-card">
              <div className="analytics-stat-icon-wrapper icon-red">
                <TrendingUp size={20} />
              </div>
              <div className="analytics-stat-info">
                <span className="analytics-stat-value">{stats.avgResponse}</span>
                <span className="analytics-stat-label">{stats.avgResponseTrend}</span>
              </div>
              <span className="analytics-stat-trend trend-subtle">Scans average</span>
            </div>
          </div>

          <div className="grid-2-1">
            <div className="card">
              <div className="card-title-container">
                <div>
                  <h3 className="card-title">User Growth Trend</h3>
                  <p className="card-subtitle">Monthly registration distribution</p>
                </div>
              </div>
              <div className="analytics-chart-wrapper">
                <ResponsiveContainer>
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                    <Bar dataKey="Owners" fill="#3da860" name="Livestock Owners" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Veterinarians" fill="#007aff" name="Veterinarians" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="card-title-container">
                <div>
                  <h3 className="card-title">Engagement Metrics</h3>
                  <p className="card-subtitle">Platform activity indicators</p>
                </div>
              </div>
              <div className="analytics-metric-list">
                {engagementMetrics.map((metric, idx) => (
                  <div key={idx} className="analytics-metric-item">
                    <div>
                      <span className="analytics-metric-title">{metric.name}</span>
                    </div>
                    <div className="analytics-metric-data">
                      <span className="analytics-metric-val">{metric.value}</span>
                      <span className={`analytics-metric-trend ${metric.isPositive ? 'positive' : 'negative'}`}>
                        {metric.trend}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card analytics-vets-card">
            <div className="card-title-container">
              <div>
                <h3 className="card-title">Top Registered Veterinarians</h3>
                <p className="card-subtitle">Active verified veterinary specialists</p>
              </div>
            </div>
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th className="analytics-col-rank">Rank</th>
                    <th>Veterinarian</th>
                    <th>City</th>
                    <th>Specialization</th>
                    <th>Cases Assigned</th>
                  </tr>
                </thead>
                <tbody>
                  {topVets.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="analytics-empty-row">
                        No veterinary doctors registered yet.
                      </td>
                    </tr>
                  ) : (
                    topVets.map((vet) => (
                      <tr key={vet.rank}>
                        <td>
                          <span className={`analytics-rank-badge ${vet.rank === 1 ? 'rank-first' : ''}`}>
                            {vet.rank}
                          </span>
                        </td>
                        <td className="analytics-vet-name">{vet.name}</td>
                        <td>{vet.city}</td>
                        <td>{vet.specialization}</td>
                        <td>
                          <span className="analytics-vet-cases-count">{vet.cases}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
