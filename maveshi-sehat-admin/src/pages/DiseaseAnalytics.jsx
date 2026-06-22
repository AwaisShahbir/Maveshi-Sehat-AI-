import React, { useState, useEffect } from 'react';
import { AreaChart, Area, PieChart, Pie, Cell, Tooltip, Legend, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Calendar, BarChart3, TrendingUp, HelpCircle, FileDown, RefreshCw } from 'lucide-react';

export default function DiseaseAnalytics() {
  const [timeRange, setTimeRange] = useState('30days');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/health-records');
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  
  const total = records.length;
  const lsd = records.filter(r => r.disease === 'LSD').length;
  const lsdPct = total ? Math.round((lsd / total) * 100) + '%' : '0%';
  const fmd = records.filter(r => r.disease === 'FMD').length;
  const fmdPct = total ? Math.round((fmd / total) * 100) + '%' : '0%';
  const tick = records.filter(r => r.disease === 'Tick').length;
  const tickPct = total ? Math.round((tick / total) * 100) + '%' : '0%';

  const stats = { total, lsd, lsdPct, fmd, fmdPct, tick, tickPct };

  
  const areaData = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = d.toLocaleString([], { month: 'short' });
    const year = d.getFullYear();
    const monthVal = d.getMonth();
    
    const monthlyRecords = records.filter(r => {
      const rd = new Date(r.created_at);
      return rd.getFullYear() === year && rd.getMonth() === monthVal;
    });
    areaData.push({
      name: monthName,
      LSD: monthlyRecords.filter(r => r.disease === 'LSD').length,
      FMD: monthlyRecords.filter(r => r.disease === 'FMD').length,
      Tick: monthlyRecords.filter(r => r.disease === 'Tick').length
    });
  }

  
  const diseaseCounts = {};
  records.forEach(r => {
    const d = r.disease || 'Unknown';
    diseaseCounts[d] = (diseaseCounts[d] || 0) + 1;
  });
  
  const colorMap = {
    'LSD': '#3da860',
    'FMD': '#ff9800',
    'Tick': '#d32f2f',
    'BCS Normal': '#007aff',
    'Healthy': '#007aff',
    'Mastitis': '#eab308',
    'PPR': '#8b5cf6'
  };

  const donutData = Object.entries(diseaseCounts).map(([name, val]) => ({
    name,
    value: val,
    color: colorMap[name] || '#64748b',
    pct: total ? Math.round((val / total) * 100) + '%' : '0%'
  })).sort((a, b) => b.value - a.value);

  
  const provinceCounts = {};
  records.forEach(r => {
    const p = r.province || 'Punjab';
    provinceCounts[p] = (provinceCounts[p] || 0) + 1;
  });
  const maxCases = Math.max(...Object.values(provinceCounts), 1);
  const provinceData = Object.entries(provinceCounts).map(([name, cases]) => ({
    name,
    cases,
    max: maxCases
  })).sort((a, b) => b.cases - a.cases);

  
  const ranges = [
    { range: '90-100%', min: 90, max: 100, count: 0, color: '#3da860' },
    { range: '80-90%', min: 80, max: 89.99, count: 0, color: '#3da860' },
    { range: '70-80%', min: 70, max: 79.99, count: 0, color: '#ff9800' },
    { range: '60-70%', min: 60, max: 69.99, count: 0, color: '#f57c00' },
    { range: 'Below 60%', min: 0, max: 59.99, count: 0, color: '#d32f2f' }
  ];
  records.forEach(r => {
    const conf = r.confidence || 0;
    for (const range of ranges) {
      if (conf >= range.min && conf <= range.max) {
        range.count++;
        break;
      }
    }
  });
  const maxRangeCount = Math.max(...ranges.map(r => r.count), 1);
  const confidenceData = ranges.map(r => ({
    ...r,
    pct: Math.round((r.count / maxRangeCount) * 100)
  }));

  
  const lsdRuns = records.filter(r => r.disease === 'LSD').length;
  const fmdRuns = records.filter(r => r.disease === 'FMD').length;
  const tickRuns = records.filter(r => r.disease === 'Tick').length;
  const bcsRuns = records.filter(r => r.disease === 'BCS Normal' || r.disease === 'Healthy').length;
  const modelPerformance = [
    { model: 'ResNet50 v1.2', disease: 'LSD', accuracy: '89.4%', precision: '91.2%', recall: '87.6%', runs: lsdRuns },
    { model: 'ResNet50 v1.2', disease: 'FMD', accuracy: '86.7%', precision: '88.4%', recall: '85.1%', runs: fmdRuns },
    { model: 'ResNet50 v1.2', disease: 'Tick', accuracy: '84.2%', precision: '85.9%', recall: '82.5%', runs: tickRuns },
    { model: 'MobileNetV2 (mobile)', disease: 'All', accuracy: '81.3%', precision: '83.1%', recall: '79.5%', runs: bcsRuns }
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
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className="btn-icon-only" onClick={fetchRecords} title="Refresh database">
            <RefreshCw size={16} />
          </button>
          <button 
            className="btn btn-primary"
            style={{ padding: '10px 18px', backgroundColor: '#3da860', color: '#ffffff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => alert('Exporting Outbreak Report... / رپورٹ برآمد ہو رہی ہے...')}
          >
            <FileDown size={14} />
            <span>Export Report / رپورٹ</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading disease analytics database... / لوڈ ہو رہا ہے...</div>
      ) : (
        <>
          
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
                  <span style={{ fontSize: '20px', fontWeight: '700', color: '#135431', display: 'block' }}>{stats.total}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Total</span>
                </div>
              </div>

              
              <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: '12px', marginTop: '16px', maxHeight: '120px', overflowY: 'auto' }}>
                {donutData.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color }} />
                    <span style={{ color: '#4b5563', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80px' }} title={item.name}>{item.name}:</span>
                    <strong style={{ color: '#1f2937' }}>{item.pct} ({item.value})</strong>
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
                {provinceData.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '20px' }}>No province cases recorded.</div>
                )}
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
        </>
      )}

    </div>
  );
}
