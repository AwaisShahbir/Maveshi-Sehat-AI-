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

  
  const getPackageLabel = (dosageForm) => {
    const form = (dosageForm || '').toLowerCase();
    if (form.includes('tablet') || form.includes('bolus') || form.includes('capsule')) return 'boxes';
    if (form.includes('injection') || form.includes('vial') || form.includes('ampoule')) return 'vials';
    if (form.includes('syrup') || form.includes('suspension') || form.includes('bottle') || form.includes('liquid')) return 'bottles';
    return 'units';
  };

  
  const getRestockTime = (dateString) => {
    if (!dateString) return 'Restock date unknown';
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    let interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `Last restocked: ${interval} ${interval === 1 ? 'day' : 'days'} ago`;
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `Last restocked: ${interval} ${interval === 1 ? 'hour' : 'hours'} ago`;
    return 'Last restocked: Just now';
  };

  
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
      <div className="flex justify-center items-center min-h-[300px] text-slate-400 text-sm font-medium">
        <p>Loading inventory metrics... / لوڈ ہو رہا ہے...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-slate-800">Stock Alerts</h2>
          <span className="text-xs text-emerald-600 font-semibold mt-0.5 urdu">اسٹاک الرٹ</span>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-full font-semibold text-xs hover:bg-emerald-600 transition-colors" onClick={onAddMedicine}>
          <Plus size={16} />
          <span>Add Medicine</span>
        </button>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-500/10 text-red-500">
            <ShieldAlert size={22} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500">Critical Stock</span>
            <h3 className="text-2xl font-extrabold text-slate-800 my-0.5">{criticalList.length}</h3>
            <span className="text-[10px] text-slate-400 font-semibold">Needs immediate attention</span>
          </div>
        </div>

        
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-500">
            <AlertTriangle size={22} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500">Low Stock</span>
            <h3 className="text-2xl font-extrabold text-slate-800 my-0.5">{lowList.length}</h3>
            <span className="text-[10px] text-slate-400 font-semibold">Restock soon</span>
          </div>
        </div>

        
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 size={22} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500">Good Stock</span>
            <h3 className="text-2xl font-extrabold text-slate-800 my-0.5">{goodList.length}</h3>
            <span className="text-[10px] text-slate-400 font-semibold">Healthy levels</span>
          </div>
        </div>
      </div>

      
      <div className="card p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
        <h3 className="card-title mb-1">Medicine Stock Levels</h3>
        <p className="card-subtitle mb-5">دوائیوں کے اسٹاک کی سطح</p>
        
        {medicines.length === 0 ? (
          <p className="text-center text-slate-500 py-10 text-sm">No medicines found. Seed initial listing to view alerts.</p>
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
                  <th className="w-[100px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {medicines.map(med => {
                  const minS = med.min_stock || 10;
                  const maxS = med.max_stock || 100;
                  const capacityPct = Math.min(Math.round((med.stock / maxS) * 100), 100);
                  const pkg = getPackageLabel(med.dosage_form);
                  const restockText = getRestockTime(med.last_restocked || med.created_at);

                  
                  let barColorClass = 'bg-emerald-500';
                  let stockColorClass = 'text-emerald-600';
                  let statusText = 'Good';
                  let statusBadgeClass = 'text-emerald-700 bg-emerald-50 border border-emerald-100';
                  
                  if (med.stock === 0 || capacityPct <= 8) {
                    barColorClass = 'bg-red-500';
                    stockColorClass = 'text-red-600';
                    statusText = 'Critical';
                    statusBadgeClass = 'text-red-700 bg-red-50 border border-red-100';
                  } else if (med.stock < minS) {
                    barColorClass = 'bg-amber-500';
                    stockColorClass = 'text-amber-600';
                    statusText = 'Low';
                    statusBadgeClass = 'text-amber-700 bg-amber-50 border border-amber-100';
                  }

                  return (
                    <tr key={med.id}>
                      
                      <td>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-semibold text-slate-800">{med.name}</span>
                          {med.name_urdu && <span className="text-xs text-emerald-500 font-semibold urdu">{med.name_urdu}</span>}
                          <span className="text-[10px] text-slate-400 font-medium">{restockText}</span>
                        </div>
                      </td>

                      
                      <td>
                        <span className={`text-sm font-extrabold mr-1 ${stockColorClass}`}>{med.stock}</span>
                        <span className="text-xs text-slate-500 font-semibold">{pkg}</span>
                      </td>

                      
                      <td className="text-slate-400 font-semibold">
                        {minS} / {maxS}
                      </td>

                      
                      <td>
                        <div className="flex flex-col gap-1.5 max-w-[160px]">
                          <span className="text-[10px] font-semibold text-slate-500">{capacityPct}% capacity</span>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${barColorClass}`} style={{ width: `${capacityPct}%` }} />
                          </div>
                        </div>
                      </td>

                      
                      <td>
                        <span className={`inline-flex items-center px-3 py-1 text-[10px] font-bold rounded-full ${statusBadgeClass}`}>
                          {statusText}
                        </span>
                      </td>

                      
                      <td>
                        <button className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition-all" onClick={() => onEditMedicine(med)}>
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

