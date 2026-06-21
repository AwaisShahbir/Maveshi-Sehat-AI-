import React, { useState } from 'react';
import { 
  Users, 
  Scan, 
  Stethoscope, 
  TrendingUp, 
  Star,
  Activity
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

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('30days');

  const stats = {
    newUsers: '1,247',
    newUsersTrend: '+18.2%',
    scans: '4,892',
    scansTrend: '+23.7%',
    consultations: '1,834',
    consultationsTrend: '+12.5%',
    avgResponse: '1.8 hrs',
    avgResponseTrend: '-9.3%'
  };

  const chartData = [
    { name: 'Jan', Owners: 120, Veterinarians: 40 },
    { name: 'Feb', Owners: 180, Veterinarians: 55 },
    { name: 'Mar', Owners: 240, Veterinarians: 75 },
    { name: 'Apr', Owners: 320, Veterinarians: 90 },
    { name: 'May', Owners: 410, Veterinarians: 110 },
    { name: 'Jun', Owners: 530, Veterinarians: 140 }
  ];

  const engagementMetrics = [
    { name: 'Daily Active Users (DAU)', value: '487', trend: '+5.2%', isPositive: true },
    { name: 'Weekly Active Users (WAU)', value: '1,203', trend: '+8.7%', isPositive: true },
    { name: 'Monthly Active Users (MAU)', value: '2,847', trend: '+12.3%', isPositive: true },
    { name: 'Avg. Session Duration', value: '8.4 min', trend: '+1.8%', isPositive: true },
    { name: 'Scan Success Rate', value: '94.2%', trend: '+2.1%', isPositive: true },
    { name: 'Vet Response Rate', value: '87.5%', trend: '-3.2%', isPositive: false }
  ];

  const topVets = [
    { rank: 1, name: 'Dr. Sara Ahmed', city: 'Lahore', cases: 147, rating: 4.9 },
    { rank: 2, name: 'Dr. Khalid Mahmood', city: 'Karachi', cases: 132, rating: 4.8 },
    { rank: 3, name: 'Dr. Amina Khan', city: 'Faisalabad', cases: 118, rating: 4.7 },
    { rank: 4, name: 'Dr. Hassan Ali', city: 'Multan', cases: 104, rating: 4.7 },
    { rank: 5, name: 'Dr. Fatima Noor', city: 'Islamabad', cases: 96, rating: 4.6 }
  ];

  return (
    <div className="analytics-view">
      
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px', backgroundColor: '#ffffff', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
          <button 
            onClick={() => setTimeRange('7days')}
            style={{ padding: '6px 12px', fontSize: '13px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', backgroundColor: timeRange === '7days' ? '#3da860' : 'transparent', color: timeRange === '7days' ? '#ffffff' : 'var(--text-muted)' }}
          >
            Last 7 Days
          </button>
          <button 
            onClick={() => setTimeRange('30days')}
            style={{ padding: '6px 12px', fontSize: '13px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', backgroundColor: timeRange === '30days' ? '#3da860' : 'transparent', color: timeRange === '30days' ? '#ffffff' : 'var(--text-muted)' }}
          >
            Last 30 Days
          </button>
          <button 
            onClick={() => setTimeRange('90days')}
            style={{ padding: '6px 12px', fontSize: '13px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', backgroundColor: timeRange === '90days' ? '#3da860' : 'transparent', color: timeRange === '90days' ? '#ffffff' : 'var(--text-muted)' }}
          >
            Last 90 Days
          </button>
          <button 
            onClick={() => setTimeRange('year')}
            style={{ padding: '6px 12px', fontSize: '13px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', backgroundColor: timeRange === 'year' ? '#3da860' : 'transparent', color: timeRange === 'year' ? '#ffffff' : 'var(--text-muted)' }}
          >
            Last Year
          </button>
        </div>
      </div>

      
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', borderRadius: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#e6f0ff', color: '#007aff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '24px', fontWeight: '700', color: '#135431', display: 'block', lineHeight: 1.2 }}>{stats.newUsers}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>New Users (30d)</span>
          </div>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#3da860' }}>{stats.newUsersTrend}</span>
        </div>

        
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', borderRadius: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#eff7f2', color: '#3da860', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Scan size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '24px', fontWeight: '700', color: '#135431', display: 'block', lineHeight: 1.2 }}>{stats.scans}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>AI Scans (30d)</span>
          </div>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#3da860' }}>{stats.scansTrend}</span>
        </div>

        
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', borderRadius: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#fff3e0', color: '#ff9800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Stethoscope size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '24px', fontWeight: '700', color: '#135431', display: 'block', lineHeight: 1.2 }}>{stats.consultations}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Vet Consultations</span>
          </div>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#3da860' }}>{stats.consultationsTrend}</span>
        </div>

        
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', borderRadius: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#ffebee', color: '#d32f2f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '24px', fontWeight: '700', color: '#135431', display: 'block', lineHeight: 1.2 }}>{stats.avgResponse}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Avg. Response Time</span>
          </div>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#3da860' }}>{stats.avgResponseTrend}</span>
        </div>
      </div>

      
      <div className="grid-2-1">
        
        <div className="card">
          <div className="card-title-container">
            <div>
              <h3 className="card-title">User Growth Trend</h3>
              <p className="card-subtitle">Monthly registration statistics • رجسٹریشن اعداد و شمار</p>
            </div>
          </div>
          <div style={{ width: '100%', height: 300 }}>
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
              <p className="card-subtitle">Platform activity indicators • سرگرمی انڈیکیٹرز</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {engagementMetrics.map((metric, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: idx !== engagementMetrics.length - 1 ? '1px solid #f1f5f9' : 'none', paddingBottom: idx !== engagementMetrics.length - 1 ? '12px' : '0' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>{metric.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#135431' }}>{metric.value}</span>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: metric.isPositive ? '#3da860' : '#d32f2f' }}>
                    {metric.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-title-container">
          <div>
            <h3 className="card-title">Top Performing Vets</h3>
            <p className="card-subtitle">Based on cases handled and ratings • ڈاکٹروں کی کارکردگی کی درجہ بندی</p>
          </div>
        </div>
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Rank</th>
                <th>Veterinarian</th>
                <th>City</th>
                <th>Cases Handled</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {topVets.map((vet) => (
                <tr key={vet.rank}>
                  <td>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: vet.rank === 1 ? '#ffeb3b' : vet.rank === 2 ? '#e0e0e0' : vet.rank === 3 ? '#ffe0b2' : '#f1f5f9',
                      color: vet.rank <= 3 ? '#5d4037' : 'var(--text-main)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '13px'
                    }}>
                      {vet.rank}
                    </div>
                  </td>
                  <td style={{ fontWeight: '600' }}>{vet.name}</td>
                  <td>{vet.city}</td>
                  <td>{vet.cases}</td>
                  <td style={{ fontWeight: '700', color: '#ff9800' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Star size={14} fill="#ff9800" stroke="none" />
                      <span>{vet.rating}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
