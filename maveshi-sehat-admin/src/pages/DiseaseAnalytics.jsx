import React, { useState } from 'react';
import { AreaChart, Area, PieChart, Pie, Cell, Tooltip, Legend, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Calendar, BarChart3, TrendingUp, HelpCircle, FileDown } from 'lucide-react';

export default function DiseaseAnalytics() {
  const [timeRange, setTimeRange] = useState('30days');

  const stats = {
    total: 1847,
    lsd: 634,
    lsdPct: '34%',
    fmd: 521,
    fmdPct: '28%',
    tick: 412,
    tickPct: '22%'
  };

  const areaData = [
    { name: 'Jan', LSD: 45, FMD: 30, Tick: 25 },
    { name: 'Feb', Owners: 65, LSD: 58, FMD: 35, Tick: 20 },
    { name: 'Mar', LSD: 72, FMD: 50, Tick: 38 },
    { name: 'Apr', LSD: 90, FMD: 42, Tick: 45 },
    { name: 'May', LSD: 120, FMD: 65, Tick: 50 },
    { name: 'Jun', LSD: 145, FMD: 78, Tick: 62 }
  ];

  const donutData = [
    { name: 'LSD', value: 634, color: '#3da860', pct: '34%' },
    { name: 'FMD', value: 521, color: '#ff9800', pct: '28%' },
    { name: 'Tick', value: 412, color: '#d32f2f', pct: '22%' },
    { name: 'BCS Normal', value: 280, color: '#007aff', pct: '16%' }
  ];

  const provinceData = [
    { name: 'Punjab', cases: 834, max: 1000 },
    { name: 'Sindh', cases: 412, max: 1000 },
    { name: 'KPK', cases: 287, max: 1000 },
    { name: 'Balochistan', cases: 198, max: 1000 },
    { name: 'Others', cases: 116, max: 1000 }
  ];

  const confidenceData = [
    { range: '90-100%', count: 312, color: '#3da860', pct: 25 },
    { range: '80-90%', count: 416, color: '#3da860', pct: 33 },
    { range: '70-80%', count: 921, color: '#ff9800', pct: 74 },
    { range: '60-70%', count: 289, color: '#f57c00', pct: 23 },
    { range: 'Below 60%', count: 12, color: '#d32f2f', pct: 1 }
  ];

  const modelPerformance = [
    { model: 'ResNet50 v1.2', disease: 'LSD', accuracy: '89.4%', precision: '91.2%', recall: '87.6%', runs: 634 },
    { model: 'ResNet50 v1.2', disease: 'FMD', accuracy: '86.7%', precision: '88.4%', recall: '85.1%', runs: 521 },
    { model: 'ResNet50 v1.2', disease: 'Tick', accuracy: '84.2%', precision: '85.9%', recall: '82.5%', runs: 412 },
    { model: 'MobileNetV2 (mobile)', disease: 'All', accuracy: '81.3%', precision: '83.1%', recall: '79.5%', runs: 280 }
  ];

  return (
    <div className="disease-analytics-view">
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', backgroundColor: '#ffffff', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
          <button 
            onClick={() => setTimeRange('7days')}
            style={{ padding: '6px 12px', fontSize: '13px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', backgroundColor: timeRange === '7days' ? '#3da860' : 'transparent', color: timeRange === '7days' ? '#ffffff' : 'var(--text-muted)' }}
          >
            Last 7 days
          </button>
          <button 
            onClick={() => setTimeRange('30days')}
            style={{ padding: '6px 12px', fontSize: '13px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', backgroundColor: timeRange === '30days' ? '#3da860' : 'transparent', color: timeRange === '30days' ? '#ffffff' : 'var(--text-muted)' }}
          >
            Last 30 days
          </button>
          <button 
            onClick={() => setTimeRange('3months')}
            style={{ padding: '6px 12px', fontSize: '13px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', backgroundColor: timeRange === '3months' ? '#3da860' : 'transparent', color: timeRange === '3months' ? '#ffffff' : 'var(--text-muted)' }}
          >
            Last 3 months
          </button>
          <button 
            onClick={() => setTimeRange('custom')}
            style={{ padding: '6px 12px', fontSize: '13px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', backgroundColor: timeRange === 'custom' ? '#3da860' : 'transparent', color: timeRange === 'custom' ? '#ffffff' : 'var(--text-muted)' }}
          >
            Custom Range
          </button>
        </div>

        <button 
          className="btn btn-primary"
          style={{ padding: '10px 18px', backgroundColor: '#3da860', color: '#ffffff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          onClick={() => alert('Exporting Outbreak Report... / رپورٹ برآمد ہو رہی ہے...')}
        >
          <FileDown size={14} />
          <span>Export Report / رپورٹ</span>
        </button>
      </div>

      
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', borderRadius: '16px' }}>
          <span style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937', display: 'block', lineHeight: 1.2 }}>{stats.total.toLocaleString()}</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Total Detections</span>
        </div>
        <div className="card" style={{ padding: '20px', borderRadius: '16px' }}>
          <span style={{ fontSize: '28px', fontWeight: '700', color: '#3da860', display: 'block', lineHeight: 1.2 }}>{stats.lsd}</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>LSD Cases</span>
            <span style={{ fontSize: '11px', color: '#3da860', fontWeight: '700' }}>{stats.lsdPct} of total</span>
          </div>
        </div>
        <div className="card" style={{ padding: '20px', borderRadius: '16px' }}>
          <span style={{ fontSize: '28px', fontWeight: '700', color: '#ff9800', display: 'block', lineHeight: 1.2 }}>{stats.fmd}</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>FMD Cases</span>
            <span style={{ fontSize: '11px', color: '#ff9800', fontWeight: '700' }}>{stats.fmdPct} of total</span>
          </div>
        </div>
        <div className="card" style={{ padding: '20px', borderRadius: '16px' }}>
          <span style={{ fontSize: '28px', fontWeight: '700', color: '#d32f2f', display: 'block', lineHeight: 1.2 }}>{stats.tick}</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Tick Cases</span>
            <span style={{ fontSize: '11px', color: '#d32f2f', fontWeight: '700' }}>{stats.tickPct} of total</span>
          </div>
        </div>
      </div>

      
      <div className="grid-2-1" style={{ marginBottom: '24px' }}>
        
        <div className="card">
          <div className="card-title-container">
            <div>
              <h3 className="card-title">Monthly Detection Trends</h3>
              <p className="card-subtitle">Last 6 months trend data • بیماری کا رجحان</p>
            </div>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLSD" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3da860" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3da860" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFMD" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff9800" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ff9800" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTick" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d32f2f" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#d32f2f" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Area type="monotone" dataKey="LSD" stroke="#3da860" fillOpacity={1} fill="url(#colorLSD)" strokeWidth={3} />
                <Area type="monotone" dataKey="FMD" stroke="#ff9800" fillOpacity={1} fill="url(#colorFMD)" strokeWidth={3} />
                <Area type="monotone" dataKey="Tick" stroke="#d32f2f" fillOpacity={1} fill="url(#colorTick)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
          <div style={{ alignSelf: 'flex-start', width: '100%' }}>
            <h3 className="card-title">Disease Distribution</h3>
            <p className="card-subtitle">بیماری تقسیم</p>
          </div>
          
          <div style={{ width: '100%', height: 200, position: 'relative' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none'
            }}>
              <span style={{ fontSize: '20px', fontWeight: '700', color: '#135431', display: 'block' }}>1,847</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Total</span>
            </div>
          </div>

          
          <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: '12px', marginTop: '16px' }}>
            {donutData.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color }} />
                <span style={{ color: '#4b5563', fontWeight: '500' }}>{item.name}:</span>
                <strong style={{ color: '#1f2937' }}>{item.pct}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      
      <div className="grid-2-1" style={{ marginBottom: '24px' }}>
        
        <div className="card">
          <div className="card-title-container">
            <div>
              <h3 className="card-title">Cases by Province</h3>
              <p className="card-subtitle">صوبائی وار کیسز</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {provinceData.map((item, idx) => {
              const percentage = (item.cases / item.max) * 100;
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{item.name}</span>
                    <strong style={{ color: '#135431' }}>{item.cases}</strong>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: '#3da860', borderRadius: '4px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        
        <div className="card">
          <div className="card-title-container">
            <div>
              <h3 className="card-title">AI Confidence Distribution</h3>
              <p className="card-subtitle">Cases below 70% flagged for vet review</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {confidenceData.map((item, idx) => {
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ fontWeight: '500', color: 'var(--text-main)' }}>{item.range}</span>
                    <strong style={{ color: item.color }}>{item.count}</strong>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${item.pct}%`, height: '100%', backgroundColor: item.color, borderRadius: '4px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-title-container">
          <div>
            <h3 className="card-title">AI Model Performance</h3>
            <p className="card-subtitle">اے آئی کارکردگی</p>
          </div>
        </div>
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Model</th>
                <th>Disease</th>
                <th>Accuracy</th>
                <th>Precision</th>
                <th>Recall</th>
                <th>Total Runs</th>
              </tr>
            </thead>
            <tbody>
              {modelPerformance.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: '600' }}>{item.model}</td>
                  <td style={{ fontWeight: '600', color: '#135431' }}>{item.disease}</td>
                  <td style={{ color: '#3da860', fontWeight: '700' }}>{item.accuracy}</td>
                  <td style={{ color: '#3da860', fontWeight: '700' }}>{item.precision}</td>
                  <td style={{ color: '#3da860', fontWeight: '700' }}>{item.recall}</td>
                  <td>{item.runs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
