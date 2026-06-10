import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2, Edit3, Plus } from 'lucide-react';

export default function StockAlerts({ pharmacy, onEditMedicine, onAddMedicine }) {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/pharmacy/medicines?pharmacyId=${pharmacy.id}`);
      if (res.ok) {
        const data = await res.json();
        setMedicines(data);
      }
    } catch (err) {
      console.error('Failed to fetch medicines for stock alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, [pharmacy.id]);

  // Derived package label based on dosage form
  const getPackageLabel = (dosageForm) => {
    const form = (dosageForm || '').toLowerCase();
    if (form.includes('tablet') || form.includes('bolus') || form.includes('capsule')) return 'boxes';
    if (form.includes('injection') || form.includes('vial') || form.includes('ampoule')) return 'vials';
    if (form.includes('syrup') || form.includes('suspension') || form.includes('bottle') || form.includes('liquid')) return 'bottles';
    return 'units';
  };

  // Restock date formatter
  const getRestockTime = (dateString) => {
    if (!dateString) return 'Restock date unknown';
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    let interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `Last restocked: ${interval} ${interval === 1 ? 'day' : 'days'} ago`;
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `Last restocked: ${interval} ${interval === 1 ? 'hour' : 'hours'} ago`;
    return 'Last restocked: Just now';
  };

  // Classify stocks
  const criticalList = [];
  const lowList = [];
  const goodList = [];

  medicines.forEach(med => {
    const minS = med.min_stock || 10;
    const maxS = med.max_stock || 100;
    const capacityPct = Math.round((med.stock / maxS) * 100);

    if (med.stock === 0 || capacityPct <= 8) {
      criticalList.push(med);
    } else if (med.stock < minS) {
      lowList.push(med);
    } else if (med.status !== 'inactive') {
      goodList.push(med);
    }
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', color: '#94a3b8' }}>
        <p>Loading inventory metrics... / لوڈ ہو رہا ہے...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Top action bar */}
      <div style={styles.headerBar}>
        <div style={styles.titleArea}>
          <h2 style={styles.titleEn}>Stock Alerts</h2>
          <span style={styles.titleUr} className="urdu">اسٹاک الرٹ</span>
        </div>
        <button style={styles.addMedBtn} onClick={onAddMedicine}>
          <Plus size={16} />
          <span>Add Medicine</span>
        </button>
      </div>

      {/* Top 3 KPI Summary Cards */}
      <div style={styles.kpiGrid}>
        {/* KPI 1: Critical */}
        <div style={styles.kpiCard}>
          <div style={{ ...styles.iconBox, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <ShieldAlert size={22} />
          </div>
          <div style={styles.kpiText}>
            <span style={styles.kpiLabel}>Critical Stock</span>
            <h3 style={styles.kpiValue}>{criticalList.length}</h3>
            <span style={styles.kpiSubText}>Needs immediate attention</span>
          </div>
        </div>

        {/* KPI 2: Low */}
        <div style={styles.kpiCard}>
          <div style={{ ...styles.iconBox, backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <AlertTriangle size={22} />
          </div>
          <div style={styles.kpiText}>
            <span style={styles.kpiLabel}>Low Stock</span>
            <h3 style={styles.kpiValue}>{lowList.length}</h3>
            <span style={styles.kpiSubText}>Restock soon</span>
          </div>
        </div>

        {/* KPI 3: Good */}
        <div style={styles.kpiCard}>
          <div style={{ ...styles.iconBox, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <CheckCircle2 size={22} />
          </div>
          <div style={styles.kpiText}>
            <span style={styles.kpiLabel}>Good Stock</span>
            <h3 style={styles.kpiValue}>{goodList.length}</h3>
            <span style={styles.kpiSubText}>Healthy levels</span>
          </div>
        </div>
      </div>

      {/* Table listings */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 className="card-title" style={{ marginBottom: '4px' }}>Medicine Stock Levels</h3>
        <p className="card-subtitle" style={{ marginBottom: '20px' }}>دوائیوں کے اسٹاک کی سطح</p>
        
        {medicines.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>No medicines found. Seed initial listing to view alerts.</p>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Medicine / دوا</th>
                  <th>Current Stock</th>
                  <th>Min / Max</th>
                  <th>Stock Level</th>
                  <th>Status</th>
                  <th style={{ width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {medicines.map(med => {
                  const minS = med.min_stock || 10;
                  const maxS = med.max_stock || 100;
                  const capacityPct = Math.min(Math.round((med.stock / maxS) * 100), 100);
                  const pkg = getPackageLabel(med.dosage_form);
                  const restockText = getRestockTime(med.last_restocked || med.created_at);

                  // Colors
                  let barColor = '#10b981';
                  let stockColor = '#10b981';
                  let statusText = 'Good';
                  let statusBg = 'rgba(16, 185, 129, 0.1)';
                  
                  if (med.stock === 0 || capacityPct <= 8) {
                    barColor = '#ef4444';
                    stockColor = '#ef4444';
                    statusText = 'Critical';
                    statusBg = 'rgba(239, 68, 68, 0.15)';
                  } else if (med.stock < minS) {
                    barColor = '#f59e0b';
                    stockColor = '#f59e0b';
                    statusText = 'Low';
                    statusBg = 'rgba(245, 158, 11, 0.15)';
                  }

                  return (
                    <tr key={med.id}>
                      {/* Name / دوا */}
                      <td>
                        <div style={styles.medBlock}>
                          <span style={styles.medNameEn}>{med.name}</span>
                          {med.name_urdu && <span style={styles.medNameUr}>{med.name_urdu}</span>}
                          <span style={styles.medRestock}>{restockText}</span>
                        </div>
                      </td>

                      {/* Current Stock */}
                      <td>
                        <span style={{ ...styles.stockCount, color: stockColor }}>{med.stock}</span>
                        <span style={styles.pkgText}>{pkg}</span>
                      </td>

                      {/* Min / Max */}
                      <td style={{ color: '#94a3b8', fontWeight: '600' }}>
                        {minS} / {maxS}
                      </td>

                      {/* Stock Level Capacity Bar */}
                      <td>
                        <div style={styles.levelBlock}>
                          <span style={styles.capacityText}>{capacityPct}% capacity</span>
                          <div style={styles.barBg}>
                            <div style={{ ...styles.barFill, width: `${capacityPct}%`, backgroundColor: barColor }} />
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <span style={{
                          ...styles.statusBadge,
                          color: stockColor,
                          backgroundColor: statusBg,
                          border: `1px solid ${stockColor}22`
                        }}>
                          {statusText}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <button style={styles.editActionBtn} onClick={() => onEditMedicine(med)}>
                          <Edit3 size={15} style={{ color: '#10b981' }} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  headerBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #1e293b',
    paddingBottom: '16px'
  },
  titleArea: {
    display: 'flex',
    flexDirection: 'column'
  },
  titleEn: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'Outfit, sans-serif'
  },
  titleUr: {
    fontSize: '13px',
    color: '#10b981',
    marginTop: '2px'
  },
  addMedBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: '#10b981',
    color: '#ffffff',
    borderRadius: '30px',
    fontSize: '13px',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px'
  },
  kpiCard: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-light)',
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    boxShadow: 'var(--shadow-md)'
  },
  iconBox: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  kpiText: {
    display: 'flex',
    flexDirection: 'column'
  },
  kpiLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#94a3b8'
  },
  kpiValue: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: 'Outfit, sans-serif',
    margin: '2px 0'
  },
  kpiSubText: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: '600'
  },
  medBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  medNameEn: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#ffffff'
  },
  medNameUr: {
    fontSize: '12px',
    color: '#10b981',
    fontWeight: '600'
  },
  medRestock: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: '500'
  },
  stockCount: {
    fontSize: '15px',
    fontWeight: '800',
    marginRight: '4px'
  },
  pkgText: {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: '600'
  },
  levelBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    maxWidth: '160px'
  },
  capacityText: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#94a3b8'
  },
  barBg: {
    height: '6px',
    backgroundColor: '#334155',
    borderRadius: '3px',
    overflow: 'hidden'
  },
  barFill: {
    height: '100%',
    borderRadius: '3px'
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 12px',
    fontSize: '11px',
    fontWeight: '700',
    borderRadius: '20px'
  },
  editActionBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: '1px solid #334155',
    backgroundColor: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  }
};
