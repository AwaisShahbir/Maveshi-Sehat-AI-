import React, { useState, useEffect } from 'react';
import { AreaChart, Area, PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { FileDown, RefreshCw } from 'lucide-react';
import '../styles/DiseaseAnalytics.css';

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
    const conf = parseFloat(r.confidence) || 0;
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
    { model: 'MobileNetV2 (Edge)', disease: 'Healthy / BCS', accuracy: '81.3%', precision: '83.1%', recall: '79.5%', runs: bcsRuns }
  ];

  const handleExportReport = () => {
    if (!records.length) {
      alert('No records available to export.');
      return;
    }
    const headers = ['Case ID', 'Animal Specie', 'Disease Detected', 'Confidence', 'Risk Level', 'Province', 'Recorded Date'];
    const rows = records.map(r => [
      `"${r.id}"`,
      `"${r.animal_type || ''}"`,
      `"${r.disease || ''}"`,
      `"${r.confidence}%"`,
      `"${r.risk_level || ''}"`,
      `"${r.province || ''}"`,
      `"${new Date(r.created_at).toISOString().split('T')[0]}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encodedUri;
    link.download = `Disease_Outbreak_Analytics_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="disease-analytics-view">
      
      <div className="da-top-controls">
        <div className="da-timerange-group">
          <button 
            onClick={() => setTimeRange('7days')}
            className={`da-timerange-btn ${timeRange === '7days' ? 'active' : ''}`}
          >
            Last 7 days
          </button>
          <button 
            onClick={() => setTimeRange('30days')}
            className={`da-timerange-btn ${timeRange === '30days' ? 'active' : ''}`}
          >
            Last 30 days
          </button>
          <button 
            onClick={() => setTimeRange('3months')}
            className={`da-timerange-btn ${timeRange === '3months' ? 'active' : ''}`}
          >
            Last 3 months
          </button>
        </div>

        <div className="da-action-group">
          <button className="btn-icon-only" onClick={fetchRecords} title="Refresh database">
            <RefreshCw size={16} />
          </button>
          <button 
            className="btn btn-primary da-export-btn"
            onClick={handleExportReport}
          >
            <FileDown size={14} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="da-loading-state">Loading disease analytics database...</div>
      ) : (
        <>
          <div className="grid-4">
            <div className="card da-stat-card">
              <span className="da-stat-num total">{stats.total.toLocaleString()}</span>
              <span className="da-stat-label">Total Detections</span>
            </div>
            <div className="card da-stat-card">
              <span className="da-stat-num lsd">{stats.lsd}</span>
              <div className="da-stat-subrow">
                <span className="da-stat-label">LSD Cases</span>
                <span className="da-stat-pct lsd">{stats.lsdPct} of total</span>
              </div>
            </div>
            <div className="card da-stat-card">
              <span className="da-stat-num fmd">{stats.fmd}</span>
              <div className="da-stat-subrow">
                <span className="da-stat-label">FMD Cases</span>
                <span className="da-stat-pct fmd">{stats.fmdPct} of total</span>
              </div>
            </div>
            <div className="card da-stat-card">
              <span className="da-stat-num tick">{stats.tick}</span>
              <div className="da-stat-subrow">
                <span className="da-stat-label">Tick Cases</span>
                <span className="da-stat-pct tick">{stats.tickPct} of total</span>
              </div>
            </div>
          </div>

          <div className="grid-2-1">
            <div className="card">
              <div className="card-title-container">
                <div>
                  <h3 className="card-title">Monthly Detection Trends</h3>
                  <p className="card-subtitle">Last 6 months trend analysis</p>
                </div>
              </div>
              <div className="da-chart-area-box">
                <ResponsiveContainer>
                  <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorLSD" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3da860" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3da860" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorFMD" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff9800" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ff9800" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorTick" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d32f2f" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#d32f2f" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="LSD" stroke="#3da860" fillOpacity={1} fill="url(#colorLSD)" strokeWidth={3} />
                    <Area type="monotone" dataKey="FMD" stroke="#ff9800" fillOpacity={1} fill="url(#colorFMD)" strokeWidth={3} />
                    <Area type="monotone" dataKey="Tick" stroke="#d32f2f" fillOpacity={1} fill="url(#colorTick)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card da-donut-card">
              <div className="da-donut-card-header">
                <h3 className="card-title">Disease Distribution</h3>
                <p className="card-subtitle">Breakdown by condition</p>
              </div>
              
              <div className="da-donut-chart-box">
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
                
                <div className="da-donut-center">
                  <span className="da-donut-center-total">{stats.total}</span>
                  <span className="da-donut-center-label">Total</span>
                </div>
              </div>

              <div className="da-donut-legend-grid">
                {donutData.map((item, idx) => (
                  <div key={idx} className="da-donut-legend-item">
                    <div className="da-legend-color-dot" style={{ backgroundColor: item.color }} />
                    <span className="da-legend-name" title={item.name}>{item.name}:</span>
                    <strong className="da-legend-val">{item.pct} ({item.value})</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid-2-1">
            <div className="card">
              <div className="card-title-container">
                <div>
                  <h3 className="card-title">Cases by Province</h3>
                  <p className="card-subtitle">Geographic distribution of scans</p>
                </div>
              </div>
              <div className="da-progress-list">
                {provinceData.map((item, idx) => {
                  const percentage = (item.cases / item.max) * 100;
                  return (
                    <div key={idx} className="da-progress-item">
                      <div className="da-progress-header">
                        <span className="da-progress-label">{item.name}</span>
                        <strong className="da-progress-count">{item.cases}</strong>
                      </div>
                      <div className="da-progress-bar-bg">
                        <div className="da-progress-bar-fill" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
                {provinceData.length === 0 && (
                  <div className="da-empty-state-text">No province cases recorded.</div>
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
              <div className="da-conf-list">
                {confidenceData.map((item, idx) => {
                  return (
                    <div key={idx} className="da-conf-item">
                      <div className="da-conf-header">
                        <span className="da-conf-range">{item.range}</span>
                        <strong style={{ color: item.color }}>{item.count}</strong>
                      </div>
                      <div className="da-progress-bar-bg">
                        <div className="da-progress-bar-fill" style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="card da-model-card">
            <div className="card-title-container">
              <div>
                <h3 className="card-title">AI Model Architecture & Accuracy</h3>
                <p className="card-subtitle">Computer vision diagnostic benchmarks</p>
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
                      <td className="da-progress-label">{item.model}</td>
                      <td className="da-model-disease">{item.disease}</td>
                      <td>{item.accuracy}</td>
                      <td>{item.precision}</td>
                      <td>{item.recall}</td>
                      <td>
                        <span className="badge da-model-runs-badge">
                          {item.runs}
                        </span>
                      </td>
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
