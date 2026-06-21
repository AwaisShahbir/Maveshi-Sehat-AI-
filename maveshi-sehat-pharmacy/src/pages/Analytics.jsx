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

  
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-md">
          <p className="font-bold text-slate-800 mb-1.5 text-xs">{label}</p>
          <p className="text-emerald-500 text-xs m-0">Revenue: {formatPrice(payload[0].value)}</p>
          <p className="text-blue-500 text-xs m-0">Orders: {payload[1].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-6">
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-center mb-3.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-500">
              <DollarSign size={22} />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">+18.2%</span>
          </div>
          <div className="mb-3.5">
            <h3 className="text-xl font-extrabold text-slate-800 mb-1 leading-tight">{formatPrice(kpis.totalRevenue)}</h3>
            <p className="text-xs font-semibold text-slate-600">Total Revenue</p>
            <p className="text-[10px] text-slate-400 mt-0.5 urdu">کل آمدنی</p>
          </div>
          <div className="flex items-center border-t border-slate-100 pt-2.5 text-[11px] text-slate-400">
            <TrendingUp size={12} className="text-emerald-500 mr-1" />
            <span className="font-medium">+18.2% vs last month</span>
          </div>
        </div>

        
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-center mb-3.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-500">
              <ShoppingBag size={22} />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">+12.5%</span>
          </div>
          <div className="mb-3.5">
            <h3 className="text-xl font-extrabold text-slate-800 mb-1 leading-tight">{kpis.totalOrders}</h3>
            <p className="text-xs font-semibold text-slate-600">Total Orders</p>
            <p className="text-[10px] text-slate-400 mt-0.5 urdu">کل آرڈرز</p>
          </div>
          <div className="flex items-center border-t border-slate-100 pt-2.5 text-[11px] text-slate-400">
            <TrendingUp size={12} className="text-emerald-500 mr-1" />
            <span className="font-medium">+12.5% vs last month</span>
          </div>
        </div>

        
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-center mb-3.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-500">
              <Users size={22} />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">+5</span>
          </div>
          <div className="mb-3.5">
            <h3 className="text-xl font-extrabold text-slate-800 mb-1 leading-tight">{kpis.activeCustomers}</h3>
            <p className="text-xs font-semibold text-slate-600">Active Customers</p>
            <p className="text-[10px] text-slate-400 mt-0.5 urdu">فعال صارفین</p>
          </div>
          <div className="flex items-center border-t border-slate-100 pt-2.5 text-[11px] text-slate-400">
            <TrendingUp size={12} className="text-emerald-500 mr-1" />
            <span className="font-medium">+5 new this month</span>
          </div>
        </div>

        
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-center mb-3.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/10 text-purple-500">
              <TrendingUp size={22} />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">+4.8%</span>
          </div>
          <div className="mb-3.5">
            <h3 className="text-xl font-extrabold text-slate-800 mb-1 leading-tight">{formatPrice(kpis.avgOrderValue)}</h3>
            <p className="text-xs font-semibold text-slate-600">Avg. Order Value</p>
            <p className="text-[10px] text-slate-400 mt-0.5 urdu">اوسط آرڈر ویلیو</p>
          </div>
          <div className="flex items-center border-t border-slate-100 pt-2.5 text-[11px] text-slate-400">
            <TrendingUp size={12} className="text-emerald-500 mr-1" />
            <span className="font-medium">+4.8% vs last month</span>
          </div>
        </div>
      </div>

      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="card lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="card-title">Revenue Overview</h3>
              <p className="card-subtitle">Monthly sales tracking • آمدنی کا جائزہ</p>
            </div>
            <div className="flex gap-4 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full inline-block bg-emerald-500"></span> Revenue (PKR)</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full inline-block bg-blue-500"></span> Order Count</div>
            </div>
          </div>
          <div className="w-full h-[350px] flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueOverview} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} />
                <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} />
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

        
        <div className="card lg:col-span-1">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="card-title">Top Medicines</h3>
              <p className="card-subtitle">Most selling products • اعلیٰ دوائیں</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-4 mt-2.5">
            {topMedicines.map((med, idx) => {
              const maxSales = Math.max(...topMedicines.map(m => m.sales), 1);
              const percent = Math.round((med.sales / maxSales) * 100);
              
              
              const badgeColors = [
                { bg: '#10b981', text: '#ffffff' },
                { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981' },
                { bg: '#f1f5f9', text: '#64748b' },
                { bg: '#f1f5f9', text: '#64748b' },
                { bg: '#f1f5f9', text: '#64748b' }
              ];
              const badgeStyle = badgeColors[idx] || badgeColors[4];

              return (
                <div key={idx} className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold" style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.text }}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 flex flex-col">
                      <span className="text-sm font-semibold text-slate-800">{med.name}</span>
                      {med.nameUrdu && <span className="text-[10px] text-emerald-500 font-semibold urdu">{med.nameUrdu}</span>}
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-slate-400">{med.orders} orders</span>
                      <span className="text-xs font-bold text-emerald-600">{formatPrice(med.sales)}</span>
                    </div>
                  </div>
                  <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}

            {topMedicines.length === 0 && (
              <p className="text-slate-400 text-xs text-center mt-10">
                No medicine sales recorded yet.
              </p>
            )}
          </div>
        </div>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="card">
          <h3 className="card-title mb-4.5">Order Status Distribution</h3>
          
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>Completed</span>
                <span>{distribution.completed}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${distribution.completed}%` }} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>Processing</span>
                <span>{distribution.processing}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-blue-500" style={{ width: `${distribution.processing}%` }} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>Cancelled</span>
                <span>{distribution.cancelled}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-red-500" style={{ width: `${distribution.cancelled}%` }} />
              </div>
            </div>
          </div>
        </div>

        
        <div className="card flex flex-col items-center justify-center p-6 text-center">
          <h3 className="card-title w-full mb-3 text-left">Customer Retention</h3>
          <div className="flex justify-center items-center my-4">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
              <circle cx="60" cy="60" r="50" fill="transparent" stroke="#10b981" strokeWidth="8" 
                strokeDasharray="314.15" 
                strokeDashoffset={314.15 - (314.15 * retention) / 100} 
                strokeLinecap="round" 
                transform="rotate(-90 60 60)" 
              />
              <text x="60" y="66" textAnchor="middle" fill="#0f172a" fontSize="22" fontWeight="bold" fontFamily="Outfit">
                {retention}%
              </text>
            </svg>
          </div>
          <p className="text-xs text-slate-500 text-center font-medium max-w-[220px]">Customers who ordered more than once</p>
        </div>

        
        <div className="card flex flex-col items-center justify-center p-6 text-center">
          <h3 className="card-title w-full mb-3 text-left">Customer Satisfaction</h3>
          <div className="flex justify-center items-center my-4">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
              <circle cx="60" cy="60" r="50" fill="transparent" stroke="#eab308" strokeWidth="8" 
                strokeDasharray="314.15" 
                strokeDashoffset={314.15 - (314.15 * (satisfaction * 20)) / 100} 
                strokeLinecap="round" 
                transform="rotate(-90 60 60)" 
              />
              <text x="60" y="66" textAnchor="middle" fill="#0f172a" fontSize="22" fontWeight="bold" fontFamily="Outfit">
                {satisfaction.toFixed(1)}
              </text>
            </svg>
          </div>
          <p className="text-xs text-slate-500 text-center font-medium max-w-[220px]">Average rating from farmers</p>
        </div>
      </div>
    </div>
  );
}

