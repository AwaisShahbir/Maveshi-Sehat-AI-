import React, { useState, useEffect } from 'react';
import { Eye, Download, Search, FileDown, RefreshCw } from 'lucide-react';

export default function HealthRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [diseaseFilter, setDiseaseFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

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

  const handleExport = () => {
    alert('Exporting health records database... / ریکارڈز برآمد ہو رہے ہیں...');
  };

  const filteredRecords = records.filter(rec => {
    if (diseaseFilter !== 'all' && rec.disease !== diseaseFilter) return false;
    if (riskFilter !== 'all' && rec.risk_level !== riskFilter) return false;
    if (dateFilter && new Date(rec.created_at).toISOString().split('T')[0] !== dateFilter) return false;

    const query = searchQuery.toLowerCase();
    const ownerMatch = rec.owner_name?.toLowerCase().includes(query);
    const diseaseMatch = rec.disease?.toLowerCase().includes(query);
    const animalMatch = rec.animal_type?.toLowerCase().includes(query);
    const idMatch = String(rec.id).toLowerCase().includes(query);

    return ownerMatch || diseaseMatch || animalMatch || idMatch;
  });

  const getRiskBadge = (risk) => {
    let bgColor = '#eff7f2';
    let color = '#3da860';
    if (risk === 'High') {
      bgColor = '#ffebee';
      color = '#d32f2f';
    } else if (risk === 'Medium') {
      bgColor = '#fff3e0';
      color = '#ff9800';
    }
    return (
      <span className="badge" style={{ backgroundColor: bgColor, color: color, padding: '4px 12px', borderRadius: '30px', fontSize: '11px', fontWeight: '600' }}>
        {risk}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    let bgColor = '#eff7f2';
    let color = '#3da860';
    if (status === 'Pending Vet' || status === 'Pending') {
      bgColor = '#fff3e0';
      color = '#ff9800';
    } else if (status === 'Active/Unresolved' || status === 'Active') {
      bgColor = '#e6f0ff';
      color = '#007aff';
    }
    return (
      <span className="badge" style={{ backgroundColor: bgColor, color: color, padding: '4px 12px', borderRadius: '30px', fontSize: '11px', fontWeight: '600' }}>
        {status}
      </span>
    );
  };

  return (
    <div className="health-records-view">
      
      <div style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        justifyContent: 'space-between'
      }}>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          
          <select 
            value={diseaseFilter} 
            onChange={(e) => setDiseaseFilter(e.target.value)}
            style={{
              padding: '8px 16px',
              borderRadius: '12px',
              border: '1px solid var(--border-light)',
              backgroundColor: '#ffffff',
              fontSize: '13px',
              fontWeight: '600',
              color: 'var(--text-main)',
              cursor: 'pointer'
            }}
          >
            <option value="all">All diseases</option>
            <option value="LSD">LSD</option>
            <option value="FMD">FMD</option>
            <option value="Tick">Tick</option>
            <option value="Mastitis">Mastitis</option>
            <option value="PPR">PPR</option>
            <option value="BCS Normal">BCS Normal</option>
            <option value="Healthy">Healthy</option>
          </select>

          
          <select 
            value={riskFilter} 
            onChange={(e) => setRiskFilter(e.target.value)}
            style={{
              padding: '8px 16px',
              borderRadius: '12px',
              border: '1px solid var(--border-light)',
              backgroundColor: '#ffffff',
              fontSize: '13px',
              fontWeight: '600',
              color: 'var(--text-main)',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Risk levels</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input 
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                padding: '8px 16px',
                borderRadius: '12px',
                border: '1px solid var(--border-light)',
                backgroundColor: '#ffffff',
                fontSize: '13px',
                fontWeight: '600',
                color: 'var(--text-main)',
                cursor: 'pointer'
              }}
            />
          </div>
        </div>

        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="header-search-container" style={{ width: '260px', backgroundColor: '#ffffff', border: '1px solid var(--border-light)' }}>
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by owner, disease..." 
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button 
            className="btn btn-primary" 
            style={{ 
              backgroundColor: '#3da860', 
              color: '#ffffff', 
              border: 'none', 
              borderRadius: '12px', 
              padding: '10px 18px', 
              fontSize: '13px', 
              fontWeight: '600', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              cursor: 'pointer'
            }}
            onClick={handleExport}
          >
            <FileDown size={14} />
            <span>Export</span>
          </button>
        </div>
      </div>

      
      <div className="card">
        <div className="card-title-container">
          <div>
            <h3 className="card-title">Health History Records</h3>
            <p className="card-subtitle">Showing {filteredRecords.length} records matching search filters</p>
          </div>
          <button className="btn-icon-only" onClick={fetchRecords}>
            <RefreshCw size={16} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading health history database... / لوڈ ہو رہا ہے...</div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Owner</th>
                  <th>Animal</th>
                  <th>Disease</th>
                  <th>Confidence</th>
                  <th>Risk</th>
                  <th>Vet</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((rec) => (
                  <tr key={rec.id}>
                    <td className="font-mono" style={{ fontWeight: '600' }}>{rec.id}</td>
                    <td style={{ fontWeight: '600' }}>{rec.owner_name}</td>
                    <td>{rec.animal_type}</td>
                    <td style={{ fontWeight: '600', color: '#135431' }}>{rec.disease}</td>
                    <td>{rec.confidence}%</td>
                    <td>{getRiskBadge(rec.risk_level)}</td>
                    <td style={{ 
                      color: !rec.vet_name ? '#ff9800' : 'inherit',
                      fontWeight: rec.vet_name ? '600' : 'normal'
                    }}>
                      {rec.vet_name || (rec.status === 'Active' ? 'Pending' : '—')}
                    </td>
                    <td>{getStatusBadge(rec.status)}</td>
                    <td>{new Date(rec.created_at).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button 
                          className="btn-icon-only" 
                          title="View diagnosis details"
                          onClick={() => alert(`Viewing details of diagnosis ${rec.id}`)}
                        >
                          <Eye size={15} />
                        </button>
                        <button 
                          className="btn-icon-only" 
                          style={{ color: '#3da860' }}
                          title="Download PDF report"
                          onClick={() => alert(`Downloading PDF report for ${rec.id}`)}
                        >
                          <Download size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                      No diagnosis records match the selected options.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', borderTop: '1px solid var(--border-light)', paddingTop: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Showing {filteredRecords.length} record(s) / {filteredRecords.length} تشخیص
          </span>
          {filteredRecords.length > 10 && (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', minWidth: '32px', backgroundColor: '#ffffff', border: '1px solid var(--border-light)', cursor: 'pointer' }}>&lt;</button>
              <button className="btn btn-primary" style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', backgroundColor: '#3da860', color: '#fff', minWidth: '32px', border: 'none', fontWeight: '600', cursor: 'pointer' }}>1</button>
              <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', minWidth: '32px', backgroundColor: '#ffffff', border: '1px solid var(--border-light)', cursor: 'pointer' }}>&gt;</button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
