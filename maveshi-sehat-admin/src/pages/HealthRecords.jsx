import React, { useState, useEffect } from 'react';
import { 
  Eye, Download, Search, FileDown, RefreshCw, X, 
  Activity, Calendar, User, Stethoscope, 
  CheckCircle2, Printer, ExternalLink, 
  FileText, Check, Image as ImageIcon
} from 'lucide-react';
import './HealthRecords.css';

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
    if (risk === 'High') return <span className="badge badge-red">{risk}</span>;
    if (risk === 'Medium') return <span className="badge badge-orange">{risk}</span>;
    return <span className="badge badge-green">{risk || 'Low'}</span>;
  };

  const getStatusBadge = (status) => {
    if (status === 'Pending Vet' || status === 'Pending') return <span className="badge badge-orange">{status}</span>;
    if (status === 'Active/Unresolved' || status === 'Active') return <span className="badge badge-blue">{status}</span>;
    if (status === 'Reviewed') return <span className="badge badge-blue">{status}</span>;
    return <span className="badge badge-green">{status || 'Active'}</span>;
  };

  return (
    <div className="health-records-view">
      
      {/* Top Filter and Search Bar */}
      <div className="hr-top-bar">
        
        <div className="hr-filter-group">
          <select 
            value={diseaseFilter} 
            onChange={(e) => setDiseaseFilter(e.target.value)}
            className="hr-filter-select"
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
            className="hr-filter-select"
          >
            <option value="all">All Risk levels</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <div className="hr-date-wrapper">
            <input 
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="hr-date-input"
            />
          </div>
        </div>

        <div className="hr-search-export">
          <div className="header-search-container hr-search-wrapper">
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
            className="btn btn-primary hr-export-btn" 
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
          <div className="hr-loading-msg">
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((rec) => (
                  <tr key={rec.id}>
                    <td className="font-mono hr-record-id">{rec.id}</td>
                    <td className="hr-record-id">{rec.owner_name}</td>
                    <td>{rec.animal_type}</td>
                    <td className="hr-disease-name">{rec.disease}</td>
                    <td>{rec.confidence}%</td>
                    <td>{getRiskBadge(rec.risk_level)}</td>
                    <td className={!rec.vet_name ? 'hr-vet-pending' : ''}>
                      {rec.vet_name || (rec.status === 'Active' ? 'Pending' : '—')}
                    </td>
                    <td>{getStatusBadge(rec.status)}</td>
                    <td>{new Date(rec.created_at).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td>
                      <div className="hr-action-btns">
                        <button 
                          className="btn-icon-only btn-action-view" 
                          title="View complete health record details"
                          onClick={() => handleOpenDetails(rec)}
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="btn-icon-only btn-action-download" 
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
                    <td colSpan="10" className="hr-empty-table-msg">
                      No diagnosis records match the selected options.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="table-footer-count">
          <span className="table-footer-text">
            Showing {filteredRecords.length} record(s)
          </span>
        </div>

      </div>

      {/* HEALTH RECORD DETAILS MODAL */}
      {selectedRecord && (
        <div 
          className="hr-modal-backdrop" 
          onClick={() => setSelectedRecord(null)}
        >
          <div 
            className="hr-modal-content card" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="hr-modal-header">
              <div className="hr-modal-header-left">
                <span className="hr-modal-id-badge">
                  {selectedRecord.id}
                </span>
                <div>
                  <h3 className="hr-modal-title">
                    Diagnosis & Clinical Report
                  </h3>
                  <p className="hr-modal-subtitle">
                    Complete veterinary case documentation
                  </p>
                </div>
              </div>

              <div className="hr-modal-header-actions">
                {getRiskBadge(selectedRecord.risk_level)}
                {getStatusBadge(selectedRecord.status)}
                <button 
                  onClick={() => setSelectedRecord(null)}
                  className="hr-modal-close-icon"
                  title="Close modal"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="hr-modal-body">
              
              {/* Top Highlights Grid */}
              <div className="hr-highlights-grid">
                <div className="hr-highlight-card">
                  <div className="hr-highlight-header">
                    <Activity size={14} color="#3da860" />
                    <span>Animal Specie</span>
                  </div>
                  <div className="hr-highlight-title">
                    {selectedRecord.animal_type || 'N/A'}
                  </div>
                  <div className="hr-highlight-sub">
                    {selectedRecord.province || 'Punjab, Pakistan'}
                  </div>
                </div>

                <div className="hr-highlight-card">
                  <div className="hr-highlight-header">
                    <User size={14} color="#007aff" />
                    <span>Farmer / Owner</span>
                  </div>
                  <div className="hr-highlight-title">
                    {selectedRecord.owner_name || 'N/A'}
                  </div>
                  <div className="hr-highlight-sub">Registered User</div>
                </div>

                <div className="hr-highlight-card">
                  <div className="hr-highlight-header">
                    <Stethoscope size={14} color="#7e22ce" />
                    <span>Attending Vet</span>
                  </div>
                  <div className={`hr-highlight-title ${!selectedRecord.vet_name ? 'hr-vet-pending' : ''}`}>
                    {selectedRecord.vet_name || 'Pending Review'}
                  </div>
                  <div className="hr-highlight-sub">
                    {selectedRecord.vet_name ? 'Doctor Assigned' : 'Awaiting Review'}
                  </div>
                </div>

                <div className="hr-highlight-card">
                  <div className="hr-highlight-header">
                    <Calendar size={14} color="#ea580c" />
                    <span>Date Diagnosed</span>
                  </div>
                  <div className="hr-highlight-title">
                    {new Date(selectedRecord.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="hr-highlight-sub">
                    {new Date(selectedRecord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              {/* Diagnosis Main Banner */}
              <div className="hr-diagnosis-banner">
                <div>
                  <div className="hr-diagnosis-label">
                    Primary AI Diagnosis
                  </div>
                  <div className="hr-diagnosis-name">
                    {selectedRecord.disease}
                  </div>
                </div>

                <div className="hr-confidence-box">
                  <div className="hr-confidence-labels">
                    <span>AI Confidence</span>
                    <span>{selectedRecord.confidence}%</span>
                  </div>
                  <div className="hr-confidence-bar-bg">
                    <div 
                      className="hr-confidence-bar-fill"
                      style={{
                        width: `${Math.min(100, parseFloat(selectedRecord.confidence) || 0)}%`,
                        backgroundColor: parseFloat(selectedRecord.confidence) >= 80 ? '#3da860' : (parseFloat(selectedRecord.confidence) >= 60 ? '#ff9800' : '#ef4444')
                      }} 
                    />
                  </div>
                </div>
              </div>

              {/* Two Column Layout: Scan Image & Clinical Details */}
              <div className={`hr-details-grid ${selectedRecord.image_url ? 'has-image' : ''}`}>
                {selectedRecord.image_url && (
                  <div>
                    <div className="hr-section-header">
                      <ImageIcon size={15} color="#3da860" />
                      <span>Clinical Scan Photo</span>
                    </div>
                    <div className="hr-scan-img-box">
                      <img 
                        src={selectedRecord.image_url.replace('10.0.2.2', 'localhost')} 
                        alt="Diagnosis Scan"
                        className="hr-scan-img"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <a 
                        href={selectedRecord.image_url.replace('10.0.2.2', 'localhost')} 
                        target="_blank" 
                        rel="noreferrer"
                        className="hr-scan-zoom-link"
                      >
                        <ExternalLink size={12} />
                        <span>Zoom</span>
                      </a>
                    </div>
                  </div>
                )}

                <div>
                  <div className="hr-section-header">
                    <FileText size={15} color="#007aff" />
                    <span>Clinical Symptoms & Observations</span>
                  </div>
                  <div className="hr-symptoms-box">
                    {selectedRecord.description || 'No descriptive symptoms or additional comments were recorded for this detection.'}
                  </div>
                </div>
              </div>

              {/* Treatment Protocol */}
              <div>
                <div className="hr-section-header">
                  <CheckCircle2 size={16} color="#3da860" />
                  <span>First Aid & Medical Protocol</span>
                </div>
                {Array.isArray(selectedRecord.first_aid) && selectedRecord.first_aid.length > 0 ? (
                  <div className="hr-first-aid-list">
                    {selectedRecord.first_aid.map((step, idx) => (
                      <div key={idx} className="hr-first-aid-step">
                        <span className="hr-step-number">
                          {idx + 1}
                        </span>
                        <span className="hr-step-text">{step}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="hr-first-aid-empty">
                    No specific first-aid steps recorded. Standard veterinary consult is recommended.
                  </div>
                )}
              </div>

              {/* Case Status Management */}
              <div className="hr-status-updater">
                <div>
                  <div className="hr-status-title">
                    Update Case Status
                  </div>
                  <div className="hr-status-sub">
                    Current status: <strong>{selectedRecord.status}</strong>
                  </div>
                </div>

                <div className="hr-status-actions">
                  <select
                    value={newStatusValue}
                    onChange={(e) => setNewStatusValue(e.target.value)}
                    className="hr-status-select"
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
                    className="hr-status-btn"
                  >
                    {isUpdatingStatus ? 'Saving...' : 'Update Status'}
                  </button>
                </div>
              </div>

              {statusSuccessMsg && (
                <div className="hr-status-success">
                  <Check size={16} />
                  <span>{statusSuccessMsg}</span>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="hr-modal-footer">
              <div className="hr-footer-actions-left">
                <button
                  onClick={() => handlePrintRecord(selectedRecord)}
                  className="hr-secondary-btn"
                  title="Print diagnostic report"
                >
                  <Printer size={15} />
                  <span>Print Report</span>
                </button>

                <button
                  onClick={() => handleDownloadRecord(selectedRecord)}
                  className="hr-secondary-btn"
                  title="Download report text file"
                >
                  <Download size={15} />
                  <span>Download (.txt)</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedRecord(null)}
                className="hr-close-btn-main"
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
