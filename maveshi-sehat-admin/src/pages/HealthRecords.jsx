import React, { useState, useEffect } from 'react';
import { 
  Eye, Download, Search, FileDown, RefreshCw, X, 
  Activity, Calendar, User, Stethoscope, 
  CheckCircle2, Printer, ExternalLink, 
  FileText, Check, Image as ImageIcon
} from 'lucide-react';

export default function HealthRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [diseaseFilter, setDiseaseFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusSuccessMsg, setStatusSuccessMsg] = useState('');
  const [newStatusValue, setNewStatusValue] = useState('');

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/health-records');
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (err) {
      console.error('Error fetching health records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedRecord) {
        setSelectedRecord(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRecord]);

  const handleOpenDetails = (rec) => {
    setSelectedRecord(rec);
    setNewStatusValue(rec.status || 'Active');
    setStatusSuccessMsg('');
  };

  const handleStatusUpdate = async () => {
    if (!selectedRecord || !newStatusValue) return;
    setIsUpdatingStatus(true);
    setStatusSuccessMsg('');
    try {
      const res = await fetch(`http://localhost:5000/api/admin/health-records/${selectedRecord.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatusValue })
      });
      if (res.ok) {
        setSelectedRecord(prev => ({ ...prev, status: newStatusValue }));
        setRecords(prev => prev.map(r => r.id === selectedRecord.id ? { ...r, status: newStatusValue } : r));
        setStatusSuccessMsg('Case status updated successfully.');
        setTimeout(() => setStatusSuccessMsg(''), 3000);
      } else {
        setSelectedRecord(prev => ({ ...prev, status: newStatusValue }));
        setRecords(prev => prev.map(r => r.id === selectedRecord.id ? { ...r, status: newStatusValue } : r));
        setStatusSuccessMsg('Status updated locally.');
        setTimeout(() => setStatusSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      setSelectedRecord(prev => ({ ...prev, status: newStatusValue }));
      setRecords(prev => prev.map(r => r.id === selectedRecord.id ? { ...r, status: newStatusValue } : r));
      setStatusSuccessMsg('Status updated locally.');
      setTimeout(() => setStatusSuccessMsg(''), 3000);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleExport = () => {
    if (!filteredRecords.length) {
      alert('No records available to export.');
      return;
    }
    const headers = ['ID', 'Owner Name', 'Animal Type', 'Disease', 'Confidence (%)', 'Risk Level', 'Attending Vet', 'Status', 'Date', 'Province', 'Clinical Description'];
    const rows = filteredRecords.map(r => [
      `"${r.id}"`,
      `"${(r.owner_name || '').replace(/"/g, '""')}"`,
      `"${r.animal_type || ''}"`,
      `"${r.disease || ''}"`,
      `"${r.confidence || ''}"`,
      `"${r.risk_level || ''}"`,
      `"${r.vet_name || 'Pending'}"`,
      `"${r.status || ''}"`,
      `"${new Date(r.created_at).toISOString().split('T')[0]}"`,
      `"${r.province || ''}"`,
      `"${(r.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `maveshi_health_records_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadRecord = (rec) => {
    const firstAidList = Array.isArray(rec.first_aid) && rec.first_aid.length > 0
      ? rec.first_aid.map((item, idx) => `  ${idx + 1}. ${item}`).join('\n')
      : '  Standard monitoring and veterinary consultation recommended.';

    const reportContent = `======================================================================
MAVESHI SEHAT AI - CLINICAL DIAGNOSIS & HEALTH SUMMARY REPORT
======================================================================

CASE & RECORD IDENTIFICATION
----------------------------------------------------------------------
Case Reference ID  : ${rec.id}
Date & Time        : ${new Date(rec.created_at).toLocaleString()}
Case Status        : ${rec.status || 'Active'}
Health Risk Level  : ${rec.risk_level || 'Normal'}

LIVESTOCK & FARMER DETAILS
----------------------------------------------------------------------
Animal Specie      : ${rec.animal_type}
Owner / Farmer     : ${rec.owner_name}
Province / Region  : ${rec.province || 'Punjab'}
Attending Vet      : ${rec.vet_name || 'Pending Review'}

DIAGNOSTIC ANALYSIS
----------------------------------------------------------------------
Detected Condition : ${rec.disease}
Model Confidence   : ${rec.confidence}%
Clinical Symptoms  : ${rec.description || 'Not provided'}

RECOMMENDED PROTOCOL & FIRST AID INSTRUCTIONS
----------------------------------------------------------------------
${firstAidList}

----------------------------------------------------------------------
Document generated from Maveshi Sehat AI Administrative Console.
======================================================================`;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Diagnosis_Report_${rec.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintRecord = (rec) => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups to print the report.');
      return;
    }

    const firstAidItems = Array.isArray(rec.first_aid) && rec.first_aid.length > 0
      ? rec.first_aid.map(step => `<li style="margin-bottom: 8px;">${step}</li>`).join('')
      : '<li>Standard quarantine and veterinary observation recommended.</li>';

    const normalizedImg = rec.image_url ? rec.image_url.replace('10.0.2.2', 'localhost') : null;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Diagnosis Report - ${rec.id}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            .header { border-bottom: 2px solid #135431; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
            .title { font-size: 24px; font-weight: bold; color: #135431; }
            .subtitle { font-size: 13px; color: #64748b; }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            .badge-high { background: #ffebee; color: #d32f2f; }
            .badge-med { background: #fff3e0; color: #ff9800; }
            .badge-low { background: #eff7f2; color: #3da860; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
            .label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; }
            .value { font-size: 16px; font-weight: 600; color: #0f172a; margin-top: 4px; }
            .section-title { font-size: 16px; font-weight: bold; color: #0f172a; margin: 20px 0 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
            .scan-img { max-width: 100%; max-height: 250px; border-radius: 8px; object-fit: cover; border: 1px solid #cbd5e1; }
            .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #94a3b8; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">Maveshi Sehat AI</div>
              <div class="subtitle">Official Animal Clinical Diagnostic Report</div>
            </div>
            <div style="text-align: right;">
              <span class="badge ${rec.risk_level === 'High' ? 'badge-high' : (rec.risk_level === 'Medium' ? 'badge-med' : 'badge-low')}">${rec.risk_level || 'Low'} Risk</span>
              <div style="font-size: 12px; margin-top: 6px; font-family: monospace;">Ref: ${rec.id}</div>
            </div>
          </div>

          <div class="grid">
            <div class="card">
              <div class="label">Animal & Owner</div>
              <div class="value">${rec.animal_type} - ${rec.owner_name}</div>
              <div style="font-size: 13px; color: #64748b; margin-top: 4px;">Region: ${rec.province || 'Punjab'}</div>
            </div>
            <div class="card">
              <div class="label">Diagnosis & Confidence</div>
              <div class="value" style="color: #135431;">${rec.disease}</div>
              <div style="font-size: 13px; color: #64748b; margin-top: 4px;">Confidence: <strong>${rec.confidence}%</strong> | Status: ${rec.status || 'Active'}</div>
            </div>
          </div>

          ${normalizedImg ? `
            <div class="section-title">Clinical Photo / Scan</div>
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="${normalizedImg}" class="scan-img" alt="Diagnosis Scan" />
            </div>
          ` : ''}

          <div class="section-title">Clinical Observations & Symptoms</div>
          <p style="background: #f8fafc; border-left: 4px solid #135431; padding: 12px; border-radius: 4px; font-size: 14px;">
            ${rec.description || 'No descriptive symptoms recorded.'}
          </p>

          <div class="section-title">Recommended Treatment & First Aid Protocol</div>
          <ol style="padding-left: 20px; font-size: 14px;">
            ${firstAidItems}
          </ol>

          <div class="footer">
            Report generated on ${new Date().toLocaleString()} by Maveshi Sehat AI Administrative Platform.
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
    } else if (status === 'Reviewed') {
      bgColor = '#f3e8ff';
      color = '#7e22ce';
    } else if (status === 'Resolved' || status === 'Healthy') {
      bgColor = '#eff7f2';
      color = '#3da860';
    }
    return (
      <span className="badge" style={{ backgroundColor: bgColor, color: color, padding: '4px 12px', borderRadius: '30px', fontSize: '11px', fontWeight: '600' }}>
        {status}
      </span>
    );
  };

  return (
    <div className="health-records-view">
      
      {/* Top Filter and Search Bar */}
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
            title="Export filtered records to CSV"
          >
            <FileDown size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Health Records Table Card */}
      <div className="card">
        <div className="card-title-container">
          <div>
            <h3 className="card-title">Health History Records</h3>
            <p className="card-subtitle">Showing {filteredRecords.length} records matching search filters</p>
          </div>
          <button className="btn-icon-only" onClick={fetchRecords} title="Refresh records list">
            <RefreshCw size={16} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Loading health history records...
          </div>
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
                          title="View complete health record details"
                          style={{
                            backgroundColor: '#eff7f2',
                            color: '#135431',
                            padding: '6px',
                            borderRadius: '8px'
                          }}
                          onClick={() => handleOpenDetails(rec)}
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="btn-icon-only" 
                          style={{ 
                            color: '#3da860',
                            backgroundColor: '#f0fdf4',
                            padding: '6px',
                            borderRadius: '8px'
                          }}
                          title="Download medical report (.txt)"
                          onClick={() => handleDownloadRecord(rec)}
                        >
                          <Download size={16} />
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
            Showing {filteredRecords.length} record(s)
          </span>
        </div>

      </div>

      {/* HEALTH RECORD DETAILS MODAL */}
      {selectedRecord && (
        <div 
          className="modal-backdrop" 
          onClick={() => setSelectedRecord(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div 
            className="modal-content card" 
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '780px',
              maxHeight: '92vh',
              padding: '0',
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#fafbfc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  fontWeight: '700',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  backgroundColor: '#135431',
                  color: '#ffffff',
                  letterSpacing: '0.5px'
                }}>
                  {selectedRecord.id}
                </span>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                    Diagnosis & Clinical Report
                  </h3>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                    Complete veterinary case documentation
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {getRiskBadge(selectedRecord.risk_level)}
                {getStatusBadge(selectedRecord.status)}
                <button 
                  onClick={() => setSelectedRecord(null)}
                  style={{
                    border: 'none',
                    background: '#f1f5f9',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#64748b',
                    marginLeft: '8px'
                  }}
                  title="Close modal"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{
              padding: '24px',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              
              {/* Top Highlights Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '12px'
              }}>
                <div style={{
                  backgroundColor: '#f8fafc',
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                    <Activity size={14} color="#3da860" />
                    <span>Animal Specie</span>
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginTop: '6px' }}>
                    {selectedRecord.animal_type || 'N/A'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {selectedRecord.province || 'Punjab, Pakistan'}
                  </div>
                </div>

                <div style={{
                  backgroundColor: '#f8fafc',
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                    <User size={14} color="#007aff" />
                    <span>Farmer / Owner</span>
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginTop: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedRecord.owner_name || 'N/A'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Registered User</div>
                </div>

                <div style={{
                  backgroundColor: '#f8fafc',
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                    <Stethoscope size={14} color="#7e22ce" />
                    <span>Attending Vet</span>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: selectedRecord.vet_name ? '#0f172a' : '#ff9800', marginTop: '6px' }}>
                    {selectedRecord.vet_name || 'Pending Review'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {selectedRecord.vet_name ? 'Doctor Assigned' : 'Awaiting Review'}
                  </div>
                </div>

                <div style={{
                  backgroundColor: '#f8fafc',
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                    <Calendar size={14} color="#ea580c" />
                    <span>Date Diagnosed</span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginTop: '6px' }}>
                    {new Date(selectedRecord.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {new Date(selectedRecord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              {/* Diagnosis Main Banner */}
              <div style={{
                background: 'linear-gradient(135deg, #eff7f2 0%, #ffffff 100%)',
                border: '1px solid #c5dbd0',
                borderRadius: '14px',
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#135431', letterSpacing: '0.5px' }}>
                    Primary AI Diagnosis
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#135431', marginTop: '2px' }}>
                    {selectedRecord.disease}
                  </div>
                </div>

                <div style={{ minWidth: '180px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>
                    <span>AI Confidence</span>
                    <span>{selectedRecord.confidence}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(100, parseFloat(selectedRecord.confidence) || 0)}%`,
                      height: '100%',
                      backgroundColor: parseFloat(selectedRecord.confidence) >= 80 ? '#3da860' : (parseFloat(selectedRecord.confidence) >= 60 ? '#ff9800' : '#ef4444'),
                      borderRadius: '4px'
                    }} />
                  </div>
                </div>
              </div>

              {/* Two Column Layout: Scan Image & Clinical Details */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: selectedRecord.image_url ? '240px 1fr' : '1fr',
                gap: '20px'
              }}>
                {selectedRecord.image_url && (
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ImageIcon size={15} color="#3da860" />
                      <span>Clinical Scan Photo</span>
                    </div>
                    <div style={{
                      position: 'relative',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#f1f5f9',
                      height: '200px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <img 
                        src={selectedRecord.image_url.replace('10.0.2.2', 'localhost')} 
                        alt="Diagnosis Scan"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">Image preview unavailable</div>';
                        }}
                      />
                      <a 
                        href={selectedRecord.image_url.replace('10.0.2.2', 'localhost')} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{
                          position: 'absolute',
                          bottom: '8px',
                          right: '8px',
                          backgroundColor: 'rgba(0,0,0,0.65)',
                          color: '#fff',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          textDecoration: 'none'
                        }}
                      >
                        <ExternalLink size={12} />
                        <span>Zoom</span>
                      </a>
                    </div>
                  </div>
                )}

                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={15} color="#007aff" />
                    <span>Clinical Symptoms & Observations</span>
                  </div>
                  <div style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    color: '#334155',
                    minHeight: selectedRecord.image_url ? '170px' : 'auto'
                  }}>
                    {selectedRecord.description || 'No descriptive symptoms or additional comments were recorded for this detection.'}
                  </div>
                </div>
              </div>

              {/* Treatment Protocol */}
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} color="#3da860" />
                  <span>First Aid & Medical Protocol</span>
                </div>
                {Array.isArray(selectedRecord.first_aid) && selectedRecord.first_aid.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedRecord.first_aid.map((step, idx) => (
                      <div 
                        key={idx} 
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          backgroundColor: '#fdfdfd',
                          border: '1px solid #eef2f6',
                          borderRadius: '10px',
                          padding: '10px 14px',
                          fontSize: '13px',
                          color: '#1e293b'
                        }}
                      >
                        <span style={{
                          backgroundColor: '#eff7f2',
                          color: '#135431',
                          fontWeight: '700',
                          fontSize: '11px',
                          minWidth: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginTop: '1px'
                        }}>
                          {idx + 1}
                        </span>
                        <span style={{ flex: 1, lineHeight: '1.5' }}>{step}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '10px', fontSize: '13px', color: '#64748b' }}>
                    No specific first-aid steps recorded. Standard veterinary consult is recommended.
                  </div>
                )}
              </div>

              {/* Case Status Management */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                    Update Case Status
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Current status: <strong>{selectedRecord.status}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <select
                    value={newStatusValue}
                    onChange={(e) => setNewStatusValue(e.target.value)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Active">Active</option>
                    <option value="Pending Vet">Pending Vet</option>
                    <option value="Reviewed">Reviewed</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Healthy">Healthy</option>
                  </select>

                  <button
                    onClick={handleStatusUpdate}
                    disabled={isUpdatingStatus || newStatusValue === selectedRecord.status}
                    style={{
                      backgroundColor: newStatusValue === selectedRecord.status ? '#e2e8f0' : '#135431',
                      color: newStatusValue === selectedRecord.status ? '#94a3b8' : '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: newStatusValue === selectedRecord.status ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isUpdatingStatus ? 'Saving...' : 'Update Status'}
                  </button>
                </div>
              </div>

              {statusSuccessMsg && (
                <div style={{
                  padding: '10px 14px',
                  backgroundColor: '#eff7f2',
                  color: '#135431',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Check size={16} />
                  <span>{statusSuccessMsg}</span>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#fafbfc',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => handlePrintRecord(selectedRecord)}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '13px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                  title="Print diagnostic report"
                >
                  <Printer size={15} />
                  <span>Print Report</span>
                </button>

                <button
                  onClick={() => handleDownloadRecord(selectedRecord)}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#135431',
                    border: '1px solid #c5dbd0',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '13px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                  title="Download report text file"
                >
                  <Download size={15} />
                  <span>Download (.txt)</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedRecord(null)}
                style={{
                  backgroundColor: '#3da860',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 20px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
