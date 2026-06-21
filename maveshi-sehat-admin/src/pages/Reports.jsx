import React, { useState } from 'react';
import { FileText, Download, Calendar, HardDrive, FileSpreadsheet } from 'lucide-react';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('available');

  const availableReports = [
    {
      id: 1,
      title: 'Monthly Disease Detection Report',
      urduTitle: 'مویشی بیماری کی تشخیص کی رپورٹ',
      desc: 'Comprehensive disease analysis with AI accuracy metrics',
      date: 'May 2025',
      size: '2.4 MB',
      format: 'PDF',
      iconColor: '#e6f0ff',
      textColor: '#007aff'
    },
    {
      id: 2,
      title: 'User Activity Report',
      urduTitle: 'صارف کی سرگرمی کی رپورٹ',
      desc: 'Registration trends, active users, and engagement analytics',
      date: 'May 2025',
      size: '1.8 MB',
      format: 'PDF',
      iconColor: '#e6f0ff',
      textColor: '#007aff'
    },
    {
      id: 3,
      title: 'Vet Performance Report',
      urduTitle: 'ڈاکٹر کی کارکردگی کی رپورٹ',
      desc: 'Response times, case load, and rating statistics',
      date: 'May 2025',
      size: '1.2 MB',
      format: 'PDF',
      iconColor: '#e6f0ff',
      textColor: '#007aff'
    },
    {
      id: 4,
      title: 'Pharmacy Sales Report',
      urduTitle: 'فارمیسی فروخت کی رپورٹ',
      desc: 'Medicine orders, revenue, and inventory turnover',
      date: 'May 2025',
      size: '3.1 MB',
      format: 'XLSX',
      iconColor: '#fff3e0',
      textColor: '#ff9800'
    },
    {
      id: 5,
      title: 'Province-wise Disease Distribution',
      urduTitle: 'صوبائی بنیاد پر بیماری کی تقسیم',
      desc: 'Regional outbreak patterns and risk zones',
      date: 'Q1 2025',
      size: '1.9 MB',
      format: 'PDF',
      iconColor: '#e6f0ff',
      textColor: '#007aff'
    },
    {
      id: 6,
      title: 'AI Model Accuracy Report',
      urduTitle: 'ماڈل کی درستگی کی رپورٹ',
      desc: 'Precision, recall, and false positive analysis',
      date: 'May 2025',
      size: '4.7 MB',
      format: 'PDF',
      iconColor: '#e6f0ff',
      textColor: '#007aff'
    }
  ];

  const handleDownload = (title) => {
    alert(`Downloading ${title}... / ڈاؤن لوڈ ہو رہا ہے...`);
  };

  return (
    <div className="reports-view">
      
      
      <div className="tabs-container" style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--border-light)', marginBottom: '24px' }}>
        <button 
          className={`tab-btn ${activeTab === 'available' ? 'active' : ''}`}
          style={{
            padding: '12px 4px',
            fontSize: '15px',
            fontWeight: '600',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: '2px solid',
            borderBottomColor: activeTab === 'available' ? '#3da860' : 'transparent',
            color: activeTab === 'available' ? '#3da860' : 'var(--text-muted)',
            cursor: 'pointer'
          }}
          onClick={() => setActiveTab('available')}
        >
          Available Reports
        </button>
        <button 
          className={`tab-btn ${activeTab === 'scheduled' ? 'active' : ''}`}
          style={{
            padding: '12px 4px',
            fontSize: '15px',
            fontWeight: '600',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: '2px solid',
            borderBottomColor: activeTab === 'scheduled' ? '#3da860' : 'transparent',
            color: activeTab === 'scheduled' ? '#3da860' : 'var(--text-muted)',
            cursor: 'pointer'
          }}
          onClick={() => setActiveTab('scheduled')}
        >
          Scheduled Reports
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          style={{
            padding: '12px 4px',
            fontSize: '15px',
            fontWeight: '600',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: '2px solid',
            borderBottomColor: activeTab === 'history' ? '#3da860' : 'transparent',
            color: activeTab === 'history' ? '#3da860' : 'var(--text-muted)',
            cursor: 'pointer'
          }}
          onClick={() => setActiveTab('history')}
        >
          Download History
        </button>
      </div>

      {activeTab === 'available' ? (
        <div className="grid-2-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {availableReports.map((report) => (
            <div className="card" key={report.id} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: report.iconColor,
                color: report.textColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '48px'
              }}>
                {report.format === 'XLSX' ? <FileSpreadsheet size={24} /> : <FileText size={24} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#1f2937', margin: '0 0 4px 0' }}>{report.title}</h4>
                <p className="urdu" style={{ fontSize: '12px', color: '#3da860', fontWeight: '500', margin: '0 0 8px 0' }}>{report.urduTitle}</p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px 0', lineHeight: 1.4 }}>{report.desc}</p>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <Calendar size={12} />
                      {report.date}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <HardDrive size={12} />
                      {report.size}
                    </span>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: report.format === 'XLSX' ? '#fff3e0' : '#e6f0ff',
                      color: report.format === 'XLSX' ? '#ff9800' : '#007aff'
                    }}>{report.format}</span>
                  </div>
                  <button 
                    onClick={() => handleDownload(report.title)}
                    className="btn btn-primary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: '600',
                      backgroundColor: '#3da860',
                      borderColor: '#3da860',
                      color: '#ffffff',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <Download size={14} />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: '60px 40px', textAlign: 'center' }}>
          <FileText size={48} className="text-muted" style={{ marginBottom: '16px' }} />
          <h3>No records found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '8px' }}>This section has no data to display under the selected tab.</p>
        </div>
      )}

    </div>
  );
}
