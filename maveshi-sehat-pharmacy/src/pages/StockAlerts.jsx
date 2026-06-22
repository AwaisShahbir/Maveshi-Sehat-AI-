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
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm gap-4">
        <div className="flex flex-col">
          <h2 className="text-lg font-bold text-slate-900 font-heading">Stock Alerts / اسٹاک الرٹ</h2>
          <span className="text-xs text-[#3da860] font-semibold mt-0.5 urdu">اسٹاک کی نگرانی اور تنبیہات</span>
        </div>
        <button 
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#3da860] hover:bg-[#2e8c4e] text-white rounded-xl font-bold text-xs shadow-md shadow-[#3da860]/10 transition-all cursor-pointer" 
          onClick={onAddMedicine}
        >
          <Plus size={14} />
          <span>Add Medicine / نئی دوا شامل کریں</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-500/10 text-red-500">
            <ShieldAlert size={22} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500">Critical Stock / تشویشناک اسٹاک</span>
            <h3 className="text-2xl font-extrabold text-red-600 my-0.5">{criticalList.length}</h3>
            <span className="text-[10px] text-slate-400 font-semibold">Immediate attention needed / فوراً لوڈ کریں</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-500">
            <AlertTriangle size={22} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500">Low Stock / کم اسٹاک</span>
            <h3 className="text-2xl font-extrabold text-amber-500 my-0.5">{lowList.length}</h3>
            <span className="text-[10px] text-slate-400 font-semibold">Restock soon / اسٹاک منگوائیں</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#3da860]/10 text-[#3da860]">
            <CheckCircle2 size={22} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500">Good Stock / وافر اسٹاک</span>
            <h3 className="text-2xl font-extrabold text-[#3da860] my-0.5">{goodList.length}</h3>
            <span className="text-[10px] text-slate-400 font-semibold">Healthy inventory level / تسلی بخش اسٹاک</span>
          </div>
        </div>
      </div>

      {/* Main Levels Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6">
        <div className="mb-5">
          <h3 className="card-title text-slate-900 font-bold mb-1">Medicine Stock Levels</h3>
          <p className="text-xs text-slate-400 urdu">دوائیوں کے اسٹاک کی سطح اور صلاحیت</p>
        </div>
        
        {medicines.length === 0 ? (
          <div className="text-center text-slate-500 py-16 text-sm bg-slate-50 rounded-2xl border border-dashed border-slate-200 px-4">
            No medicines found. Seed initial listing to view alerts.
          </div>
        ) : (
          <div className="table-responsive !border-none !rounded-none">
            <table className="custom-table">
              <thead>
                <tr>
                  <th className="font-bold text-slate-500 uppercase tracking-wider text-xs">Medicine / دوا</th>
                  <th className="font-bold text-slate-500 uppercase tracking-wider text-xs">Current Stock</th>
                  <th className="font-bold text-slate-500 uppercase tracking-wider text-xs">Min / Max</th>
                  <th className="font-bold text-slate-500 uppercase tracking-wider text-xs">Stock Capacity</th>
                  <th className="font-bold text-slate-500 uppercase tracking-wider text-xs">Status</th>
                  <th className="w-[100px] font-bold text-slate-500 uppercase tracking-wider text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {medicines.map(med => {
                  const minS = med.min_stock || 10;
                  const maxS = med.max_stock || 100;
                  const capacityPct = Math.min(Math.round((med.stock / maxS) * 100), 100);
                  const pkg = getPackageLabel(med.dosage_form);
                  const restockText = getRestockTime(med.last_restocked || med.created_at);

                  let barColorClass = 'bg-[#3da860]';
                  let stockColorClass = 'text-[#3da860]';
                  let statusText = 'Good';
                  let statusBadgeClass = 'text-[#3da860] bg-[#3da860]/10 border border-[#3da860]/20';
                  
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
                    <tr key={med.id} className="hover:bg-slate-50/50 transition-colors">
                      <td>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-bold text-slate-900">{med.name}</span>
                          {med.name_urdu && <span className="text-xs text-[#3da860] font-semibold urdu">{med.name_urdu}</span>}
                          <span className="text-[10px] text-slate-400 font-medium">{restockText}</span>
                        </div>
                      </td>

                      <td>
                        <span className={`text-sm font-extrabold mr-1 ${stockColorClass}`}>{med.stock}</span>
                        <span className="text-xs text-slate-500 font-semibold">{pkg}</span>
                      </td>

                      <td className="text-slate-400 font-bold font-mono text-xs">
                        {minS} / {maxS}
                      </td>

                      <td>
                        <div className="flex flex-col gap-1.5 max-w-[160px]">
                          <span className="text-[10px] font-bold text-slate-500">{capacityPct}% capacity</span>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${barColorClass}`} style={{ width: `${capacityPct}%` }} />
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={`inline-flex items-center px-3 py-1 text-[10px] font-bold rounded-full ${statusBadgeClass}`}>
                          {statusText}
                        </span>
                      </td>

                      <td>
                        <div className="flex justify-end">
                          <button 
                            className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center cursor-pointer hover:border-[#3da860] hover:bg-[#3da860]/5 text-slate-500 hover:text-[#3da860] transition-all" 
                            onClick={() => onEditMedicine(med)}
                            title="Edit Medicine"
                          >
                            <Edit3 size={15} />
                          </button>
                        </div>
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

