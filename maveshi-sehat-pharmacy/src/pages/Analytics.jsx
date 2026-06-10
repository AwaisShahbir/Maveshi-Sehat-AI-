import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, BarChart3, Users, DollarSign, 
  ShoppingBag, Star, RefreshCw, ChevronRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';

export default function Analytics({ pharmacy, formatPrice }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/pharmacy/analytics?pharmacyId=${pharmacy.id}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [pharmacy.id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', color: '#94a3b8' }}>
        <p>Loading analytics data... / لوڈ ہو رہا ہے...</p>
      </div>
    );
  }

  const kpis = data?.kpis || { totalRevenue: 0, totalOrders: 0, activeCustomers: 0, avgOrderValue: 0 };
  const revenueOverview = data?.revenueOverview || [];
  const topMedicines = data?.topMedicines || [];
  const distribution = data?.distribution || { completed: 0, processing: 0, cancelled: 0 };
  const retention = data?.customerRetention || 0;
  const satisfaction = data?.customerSatisfaction || 4.8;

  // Custom tool tip for Recharts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={styles.tooltip}>
          <p style={styles.tooltipLabel}>{label}</p>
          <p style={{ color: '#10b981', margin: 0 }}>Revenue: {formatPrice(payload[0].value)}</p>
          <p style={{ color: '#60a5fa', margin: 0 }}>Orders: {payload[1].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={styles.container}>
      {/* Top row: 4 KPI Cards */}
      <div style={styles.kpiGrid}>
        {/* KPI 1: Revenue */}
        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <div style={{ ...styles.kpiIconBox, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <DollarSign size={22} />
            </div>
            <span style={styles.kpiPercentage}>+18.2%</span>
          </div>
          <div style={styles.kpiBody}>
            <h3 style={styles.kpiValue}>{formatPrice(kpis.totalRevenue)}</h3>
            <p style={styles.kpiTitleEn}>Total Revenue</p>
            <p style={styles.kpiTitleUr}>کل آمدنی</p>
          </div>
          <div style={styles.kpiFooter}>
            <TrendingUp size={12} style={{ color: '#10b981', marginRight: '4px' }} />
            <span style={styles.kpiFooterText}>+18.2% vs last month</span>
          </div>
        </div>

        {/* KPI 2: Total Orders */}
        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <div style={{ ...styles.kpiIconBox, backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <ShoppingBag size={22} />
            </div>
            <span style={styles.kpiPercentage}>+12.5%</span>
          </div>
          <div style={styles.kpiBody}>
            <h3 style={styles.kpiValue}>{kpis.totalOrders}</h3>
            <p style={styles.kpiTitleEn}>Total Orders</p>
            <p style={styles.kpiTitleUr}>کل آرڈرز</p>
          </div>
          <div style={styles.kpiFooter}>
            <TrendingUp size={12} style={{ color: '#10b981', marginRight: '4px' }} />
            <span style={styles.kpiFooterText}>+12.5% vs last month</span>
          </div>
        </div>

        {/* KPI 3: Active Customers */}
        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <div style={{ ...styles.kpiIconBox, backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Users size={22} />
            </div>
            <span style={styles.kpiPercentage}>+5</span>
          </div>
          <div style={styles.kpiBody}>
            <h3 style={styles.kpiValue}>{kpis.activeCustomers}</h3>
            <p style={styles.kpiTitleEn}>Active Customers</p>
            <p style={styles.kpiTitleUr}>فعال صارفین</p>
          </div>
          <div style={styles.kpiFooter}>
            <TrendingUp size={12} style={{ color: '#10b981', marginRight: '4px' }} />
            <span style={styles.kpiFooterText}>+5 new this month</span>
          </div>
        </div>

        {/* KPI 4: Avg. Order Value */}
        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <div style={{ ...styles.kpiIconBox, backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
              <TrendingUp size={22} />
            </div>
            <span style={styles.kpiPercentage}>+4.8%</span>
          </div>
          <div style={styles.kpiBody}>
            <h3 style={styles.kpiValue}>{formatPrice(kpis.avgOrderValue)}</h3>
            <p style={styles.kpiTitleEn}>Avg. Order Value</p>
            <p style={styles.kpiTitleUr}>اوسط آرڈر ویلیو</p>
          </div>
          <div style={styles.kpiFooter}>
            <TrendingUp size={12} style={{ color: '#10b981', marginRight: '4px' }} />
            <span style={styles.kpiFooterText}>+4.8% vs last month</span>
          </div>
        </div>
      </div>

      {/* Middle row: Revenue Overview chart & Top Medicines list */}
      <div style={styles.chartMedGrid}>
        {/* Left Side: Revenue Overview */}
        <div className="card" style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
          <div style={styles.cardHeaderFlex}>
            <div>
              <h3 className="card-title">Revenue Overview</h3>
              <p className="card-subtitle">Monthly sales tracking • آمدنی کا جائزہ</p>
            </div>
            <div style={styles.legendWrapper}>
              <div style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: '#10b981' }}></span> Revenue (PKR)</div>
              <div style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: '#3b82f6' }}></span> Order Count</div>
            </div>
          </div>
          <div style={{ width: '100%', height: 350, flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueOverview} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} />
                <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(51, 65, 85, 0.3)' }} />
                <Bar yAxisId="left" dataKey="Revenue" radius={[4, 4, 0, 0]}>
                  {revenueOverview.map((entry, index) => (
                    <Cell key={`cell-rev-${index}`} fill="#10b981" />
                  ))}
                </Bar>
                <Bar yAxisId="right" dataKey="Orders" radius={[4, 4, 0, 0]}>
                  {revenueOverview.map((entry, index) => (
                    <Cell key={`cell-ord-${index}`} fill="#3b82f6" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Side: Top Medicines */}
        <div className="card" style={{ flex: 1.2 }}>
          <div style={styles.cardHeaderFlex}>
            <div>
              <h3 className="card-title">Top Medicines</h3>
              <p className="card-subtitle">Most selling products • اعلیٰ دوائیں</p>
            </div>
          </div>
          
          <div style={styles.topMedList}>
            {topMedicines.map((med, idx) => {
              const maxSales = Math.max(...topMedicines.map(m => m.sales), 1);
              const percent = Math.round((med.sales / maxSales) * 100);
              
              // Colors for top rank badges
              const badgeColors = [
                { bg: '#10b981', text: '#ffffff' },
                { bg: 'rgba(16, 185, 129, 0.2)', text: '#10b981' },
                { bg: '#1e293b', text: '#94a3b8' },
                { bg: '#1e293b', text: '#94a3b8' },
                { bg: '#1e293b', text: '#94a3b8' }
              ];
              const badgeStyle = badgeColors[idx] || badgeColors[4];

              return (
                <div key={idx} style={styles.medItem}>
                  <div style={styles.medRankRow}>
                    <div style={{ ...styles.rankBadge, backgroundColor: badgeStyle.bg, color: badgeStyle.text }}>
                      {idx + 1}
                    </div>
                    <div style={styles.medInfo}>
                      <span style={styles.medNameEn}>{med.name}</span>
                      {med.nameUrdu && <span style={styles.medNameUr}>{med.nameUrdu}</span>}
                    </div>
                    <div style={styles.medSales}>
                      <span style={styles.medOrderCount}>{med.orders} orders</span>
                      <span style={styles.medSalesPrice}>{formatPrice(med.sales)}</span>
                    </div>
                  </div>
                  <div style={styles.medProgressBg}>
                    <div style={{ ...styles.medProgressFill, width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}

            {topMedicines.length === 0 && (
              <p style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', marginTop: '40px' }}>
                No medicine sales recorded yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom row: Order Distribution, Customer Retention & Satisfaction */}
      <div style={styles.bottomGrid}>
        {/* Card 1: Order Status Distribution */}
        <div className="card" style={{ flex: 1 }}>
          <h3 className="card-title" style={{ marginBottom: '18px' }}>Order Status Distribution</h3>
          
          <div style={styles.distList}>
            <div style={styles.distItem}>
              <div style={styles.distLabelRow}>
                <span>Completed</span>
                <span>{distribution.completed}%</span>
              </div>
              <div style={styles.distBarBg}>
                <div style={{ ...styles.distBarFill, width: `${distribution.completed}%`, backgroundColor: '#10b981' }} />
              </div>
            </div>

            <div style={styles.distItem}>
              <div style={styles.distLabelRow}>
                <span>Processing</span>
                <span>{distribution.processing}%</span>
              </div>
              <div style={styles.distBarBg}>
                <div style={{ ...styles.distBarFill, width: `${distribution.processing}%`, backgroundColor: '#3b82f6' }} />
              </div>
            </div>

            <div style={styles.distItem}>
              <div style={styles.distLabelRow}>
                <span>Cancelled</span>
                <span>{distribution.cancelled}%</span>
              </div>
              <div style={styles.distBarBg}>
                <div style={{ ...styles.distBarFill, width: `${distribution.cancelled}%`, backgroundColor: '#ef4444' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Customer Retention */}
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h3 className="card-title" style={{ width: '100%', marginBottom: '12px' }}>Customer Retention</h3>
          <div style={styles.circleContainer}>
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="transparent" stroke="#1e293b" strokeWidth="8" />
              <circle cx="60" cy="60" r="50" fill="transparent" stroke="#10b981" strokeWidth="8" 
                strokeDasharray="314.15" 
                strokeDashoffset={314.15 - (314.15 * retention) / 100} 
                strokeLinecap="round" 
                transform="rotate(-90 60 60)" 
              />
              <text x="60" y="66" textAnchor="middle" fill="#ffffff" fontSize="22" fontWeight="bold" fontFamily="Outfit">
                {retention}%
              </text>
            </svg>
          </div>
          <p style={styles.retentionLabel}>Customers who ordered more than once</p>
        </div>

        {/* Card 3: Customer Satisfaction */}
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h3 className="card-title" style={{ width: '100%', marginBottom: '12px' }}>Customer Satisfaction</h3>
          <div style={styles.circleContainer}>
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="transparent" stroke="#1e293b" strokeWidth="8" />
              <circle cx="60" cy="60" r="50" fill="transparent" stroke="#eab308" strokeWidth="8" 
                strokeDasharray="314.15" 
                strokeDashoffset={314.15 - (314.15 * (satisfaction * 20)) / 100} 
                strokeLinecap="round" 
                transform="rotate(-90 60 60)" 
              />
              <text x="60" y="66" textAnchor="middle" fill="#ffffff" fontSize="22" fontWeight="bold" fontFamily="Outfit">
                {satisfaction.toFixed(1)}
              </text>
            </svg>
          </div>
          <p style={styles.retentionLabel}>Average rating from farmers</p>
        </div>
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
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px'
  },
  kpiCard: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-light)',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxShadow: 'var(--shadow-md)'
  },
  kpiHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px'
  },
  kpiIconBox: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  kpiPercentage: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: '2px 8px',
    borderRadius: '20px'
  },
  kpiBody: {
    marginBottom: '14px'
  },
  kpiValue: {
    fontFamily: 'Outfit, sans-serif',
    fontSize: '22px',
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: '1.2',
    marginBottom: '4px'
  },
  kpiTitleEn: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#94a3b8'
  },
  kpiTitleUr: {
    fontFamily: 'Noto Nastaliq Urdu, sans-serif',
    fontSize: '10px',
    color: '#64748b',
    marginTop: '1px'
  },
  kpiFooter: {
    display: 'flex',
    alignItems: 'center',
    borderTop: '1px solid #334155',
    paddingTop: '10px',
    fontSize: '11px',
    color: '#64748b'
  },
  kpiFooterText: {
    fontWeight: '500'
  },
  chartMedGrid: {
    display: 'grid',
    gridTemplateColumns: '1.7fr 1fr',
    gap: '24px'
  },
  legendWrapper: {
    display: 'flex',
    gap: '16px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#94a3b8'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  legendDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    display: 'inline-block'
  },
  tooltip: {
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    padding: '12px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
  },
  tooltipLabel: {
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: '6px',
    fontSize: '13px'
  },
  topMedList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginTop: '10px'
  },
  medItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  medRankRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  rankBadge: {
    width: '24px',
    height: '24px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '700'
  },
  medInfo: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column'
  },
  medNameEn: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#ffffff'
  },
  medNameUr: {
    fontSize: '11px',
    color: '#10b981',
    fontWeight: '500'
  },
  medSales: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end'
  },
  medOrderCount: {
    fontSize: '11px',
    color: '#94a3b8'
  },
  medSalesPrice: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#10b981'
  },
  medProgressBg: {
    height: '4px',
    backgroundColor: '#334155',
    borderRadius: '2px',
    overflow: 'hidden'
  },
  medProgressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: '2px'
  },
  bottomGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px'
  },
  distList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  distItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  distLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    fontWeight: '600',
    color: '#94a3b8'
  },
  distBarBg: {
    height: '6px',
    backgroundColor: '#334155',
    borderRadius: '3px',
    overflow: 'hidden'
  },
  distBarFill: {
    height: '100%',
    borderRadius: '3px'
  },
  circleContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '16px 0 12px'
  },
  retentionLabel: {
    fontSize: '13px',
    color: '#94a3b8',
    textAlign: 'center',
    fontWeight: '500',
    maxWidth: '220px'
  }
};
