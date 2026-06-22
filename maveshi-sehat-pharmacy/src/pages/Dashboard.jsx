import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, BarChart3, Pill, PlusCircle, Tags, AlertTriangle, 
  ShoppingBag, Clock, Truck, CheckCircle, User, Settings, LogOut, Bell, Store, ArrowUpRight 
} from 'lucide-react';
import Medicines from './Medicines';
import Orders from './Orders';
import Profile from './Profile';
import Analytics from './Analytics';
import AddMedicine from './AddMedicine';
import StockAlerts from './StockAlerts';
import logoImg from '../assets/logo.png';

export default function Dashboard({ pharmacy, onLogout }) {
  const [currentView, setCurrentView] = useState('dashboard'); 
  const [editMedId, setEditMedId] = useState(null);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeOrders: 0,
    medicineListings: 0,
    stockAlerts: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [stockAlertsList, setStockAlertsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/pharmacy/dashboard-stats?pharmacyId=${pharmacy.id}`);
      const data = await res.json();
      if (res.ok) {
        setStats(data.stats);
        setRecentOrders(data.recentOrders);
        setStockAlertsList(data.stockAlertsList);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [pharmacy.id, currentView]);

  useEffect(() => {
    const list = [];
    let notifId = 1;
    recentOrders.forEach(order => {
      if (order.status.toLowerCase() === 'pending') {
        list.push({
          id: notifId++,
          text: `New order ${order.id} received`,
          time: 'New',
          unread: true
        });
      }
    });
    stockAlertsList.forEach(med => {
      list.push({
        id: notifId++,
        text: `Stock warning: ${med.name} is low (${med.stock} left)`,
        time: 'Low Stock',
        unread: true
      });
    });
    if (list.length === 0) {
      list.push({
        id: 1,
        text: 'All stocks are healthy and orders updated.',
        time: 'Just now',
        unread: false
      });
    }
    setNotifications(list);
  }, [recentOrders, stockAlertsList]);

  const handleOrderAction = async (orderId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/pharmacy/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error updating order:', err);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(price).replace('PKR', 'PKR ');
  };

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <span className="badge badge-orange"><Clock size={12} /> Pending</span>;
      case 'processing':
        return <span className="badge badge-blue"><Clock size={12} /> Processing</span>;
      case 'dispatched':
        return <span className="badge badge-blue"><Truck size={12} /> Dispatched</span>;
      case 'delivered':
      case 'completed':
        return <span className="badge badge-green"><CheckCircle size={12} /> Completed</span>;
      case 'cancelled':
        return <span className="badge badge-red"><AlertTriangle size={12} /> Cancelled</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="app-container flex min-h-screen w-screen overflow-x-hidden bg-slate-50">
      
      <aside className="w-[280px] bg-[#135431] border-r border-[#0e3a22] flex flex-col h-screen sticky top-0 z-50">
        <div className="flex items-center gap-3 p-6 border-b border-[#0e3a22]/60">
          <img 
            src={logoImg} 
            alt="Maveshi Sehat AI Logo" 
            style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)' }} 
          />
          <div>
            <span className="font-heading text-sm font-extrabold text-white block leading-tight">Maveshi Sehat AI</span>
            <span className="text-[11px] text-[#c5dbd0] font-bold block mt-0.5">Pharmacy Portal / پورٹل</span>
          </div>
        </div>

        <div className="flex items-center gap-3 px-6 py-5 border-b border-[#0e3a22]/60 bg-black/10">
          <div className="w-10 h-10 rounded-full bg-[#3da860] text-white flex items-center justify-center">
            <Store size={20} />
          </div>
          <div>
            <span className="text-sm font-bold text-white block">{pharmacy.name}</span>
            <span className="text-[11px] text-[#c5dbd0] font-semibold block mt-0.5">Verified / تصدیق شدہ</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-5">
          <div className="mb-5">
            <span className="block text-[10px] font-extrabold text-[#c5dbd0]/75 px-6 mb-2.5 tracking-wider">OVERVIEW</span>
            <ul className="list-none flex flex-col gap-1.5">
              <li>
                <button 
                  onClick={() => setCurrentView('dashboard')}
                  className={`flex items-center gap-3.5 mx-3 px-3.5 py-2.5 w-[calc(100%-24px)] text-left cursor-pointer text-sm rounded-xl transition-all duration-200 ${
                    currentView === 'dashboard' 
                      ? 'text-white bg-[#3da860] font-bold shadow-md shadow-emerald-950/20' 
                      : 'text-[#c5dbd0] bg-transparent border-none hover:text-white hover:bg-white/5'
                  }`}
                >
                  <LayoutDashboard size={18} />
                  <div className="flex-1 flex flex-col">
                    <span className="font-semibold">Dashboard</span>
                    <span className="text-[10px] opacity-70 mt-0.5">ڈیش بورڈ</span>
                  </div>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setCurrentView('analytics')}
                  className={`flex items-center gap-3.5 mx-3 px-3.5 py-2.5 w-[calc(100%-24px)] text-left cursor-pointer text-sm rounded-xl transition-all duration-200 ${
                    currentView === 'analytics' 
                      ? 'text-white bg-[#3da860] font-bold shadow-md shadow-emerald-950/20' 
                      : 'text-[#c5dbd0] bg-transparent border-none hover:text-white hover:bg-white/5'
                  }`}
                >
                  <BarChart3 size={18} />
                  <div className="flex-1 flex flex-col">
                    <span className="font-semibold">Analytics</span>
                    <span className="text-[10px] opacity-70 mt-0.5">تجزیہ</span>
                  </div>
                </button>
              </li>
            </ul>
          </div>

          <div className="mb-5">
            <span className="block text-[10px] font-extrabold text-[#c5dbd0]/75 px-6 mb-2.5 tracking-wider">MEDICINES / دوائیں</span>
            <ul className="list-none flex flex-col gap-1.5">
              <li>
                <button 
                  onClick={() => setCurrentView('listings')}
                  className={`flex items-center gap-3.5 mx-3 px-3.5 py-2.5 w-[calc(100%-24px)] text-left cursor-pointer text-sm rounded-xl transition-all duration-200 ${
                    currentView === 'listings' 
                      ? 'text-white bg-[#3da860] font-bold shadow-md shadow-emerald-950/20' 
                      : 'text-[#c5dbd0] bg-transparent border-none hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Pill size={18} />
                  <div className="flex-1 flex flex-col">
                    <span className="font-semibold">My Listings</span>
                    <span className="text-[10px] opacity-70 mt-0.5">میری فہرست</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-[10px] ${
                    currentView === 'listings' ? 'bg-[#135431] text-[#c5dbd0]' : 'bg-[#0e3a22] text-[#c5dbd0]'
                  }`}>{stats.medicineListings}</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setCurrentView('add-medicine')}
                  className={`flex items-center gap-3.5 mx-3 px-3.5 py-2.5 w-[calc(100%-24px)] text-left cursor-pointer text-sm rounded-xl transition-all duration-200 ${
                    currentView === 'add-medicine' 
                      ? 'text-white bg-[#3da860] font-bold shadow-md shadow-emerald-950/20' 
                      : 'text-[#c5dbd0] bg-transparent border-none hover:text-white hover:bg-white/5'
                  }`}
                >
                  <PlusCircle size={18} />
                  <div className="flex-1 flex flex-col">
                    <span className="font-semibold">Add Medicine</span>
                    <span className="text-[10px] opacity-70 mt-0.5">دوائی شامل کریں</span>
                  </div>
                </button>
              </li>

              <li>
                <button 
                  onClick={() => setCurrentView('stock-alerts')}
                  className={`flex items-center gap-3.5 mx-3 px-3.5 py-2.5 w-[calc(100%-24px)] text-left cursor-pointer text-sm rounded-xl transition-all duration-200 ${
                    currentView === 'stock-alerts' 
                      ? 'text-white bg-[#3da860] font-bold shadow-md shadow-emerald-950/20' 
                      : 'text-[#c5dbd0] bg-transparent border-none hover:text-white hover:bg-white/5'
                  }`}
                >
                  <AlertTriangle size={18} />
                  <div className="flex-1 flex flex-col">
                    <span className="font-semibold">Stock Alerts</span>
                    <span className="text-[10px] opacity-70 mt-0.5">اسٹاک الرٹ</span>
                  </div>
                  {stats.stockAlerts > 0 && (
                    <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-[10px]">{stats.stockAlerts}</span>
                  )}
                </button>
              </li>
            </ul>
          </div>

          <div className="mb-5">
            <span className="block text-[10px] font-extrabold text-[#c5dbd0]/75 px-6 mb-2.5 tracking-wider">ORDERS / آرڈرز</span>
            <ul className="list-none flex flex-col gap-1.5">
              <li>
                <button 
                  onClick={() => setCurrentView('orders')}
                  className={`flex items-center gap-3.5 mx-3 px-3.5 py-2.5 w-[calc(100%-24px)] text-left cursor-pointer text-sm rounded-xl transition-all duration-200 ${
                    currentView === 'orders' 
                      ? 'text-white bg-[#3da860] font-bold shadow-md shadow-emerald-950/20' 
                      : 'text-[#c5dbd0] bg-transparent border-none hover:text-white hover:bg-white/5'
                  }`}
                >
                  <ShoppingBag size={18} />
                  <div className="flex-1 flex flex-col">
                    <span className="font-semibold">All Orders</span>
                    <span className="text-[10px] opacity-70 mt-0.5">تمام آرڈرز</span>
                  </div>
                  {stats.activeOrders > 0 && (
                    <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-[10px]">{stats.activeOrders}</span>
                  )}
                </button>
              </li>
            </ul>
          </div>

          <div className="mb-5">
            <span className="block text-[10px] font-extrabold text-[#c5dbd0]/75 px-6 mb-2.5 tracking-wider">ACCOUNT / اکاؤنٹ</span>
            <ul className="list-none flex flex-col gap-1.5">
              <li>
                <button 
                  onClick={() => setCurrentView('profile')}
                  className={`flex items-center gap-3.5 mx-3 px-3.5 py-2.5 w-[calc(100%-24px)] text-left cursor-pointer text-sm rounded-xl transition-all duration-200 ${
                    currentView === 'profile' 
                      ? 'text-white bg-[#3da860] font-bold shadow-md shadow-emerald-950/20' 
                      : 'text-[#c5dbd0] bg-transparent border-none hover:text-white hover:bg-white/5'
                  }`}
                >
                  <User size={18} />
                  <div className="flex-1 flex flex-col">
                    <span className="font-semibold">Pharmacy Profile</span>
                    <span className="text-[10px] opacity-70 mt-0.5">فارمیسی پروفائل</span>
                  </div>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setCurrentView('profile')}
                  className="flex items-center gap-3.5 mx-3 px-3.5 py-2.5 w-[calc(100%-24px)] text-left cursor-pointer text-sm text-[#c5dbd0] bg-transparent border-none hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200"
                >
                  <Settings size={18} />
                  <div className="flex flex-col">
                    <span className="font-semibold">Settings</span>
                    <span className="text-[10px] opacity-70 mt-0.5">ترتیبات</span>
                  </div>
                </button>
              </li>
            </ul>
          </div>
        </nav>

        <div className="p-4 border-t border-[#0e3a22]/60">
          <button 
            className="flex items-center gap-3.5 mx-3 px-4 py-2.5 w-[calc(100%-24px)] text-left cursor-pointer text-sm font-bold bg-transparent border border-white/15 text-[#ff5c5c] hover:text-[#ff3333] hover:bg-red-500/10 hover:border-red-500/30 rounded-full transition-all duration-200" 
            onClick={onLogout}
          >
            <LogOut size={18} className="text-[#ff5c5c] shrink-0" />
            <span>لاگ آؤٹ / Logout</span>
          </button>
        </div>
      </aside>

      
      <main className="main-content flex-1 flex flex-col h-screen overflow-y-auto bg-[#eff7f2]">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm">
          <div className="flex flex-col">
            <h2 className="font-heading text-xl font-bold text-slate-900">
              {currentView === 'dashboard' && 'Dashboard'}
              {currentView === 'analytics' && 'Analytics'}
              {currentView === 'listings' && 'Medicine Listings'}
              {currentView === 'orders' && 'Orders Management'}
              {currentView === 'profile' && 'Pharmacy Profile'}
              {currentView === 'add-medicine' && 'Add Medicine'}
              {currentView === 'stock-alerts' && 'Stock Alerts'}
            </h2>
            <span className="text-xs text-[#3da860] font-semibold mt-0.5 urdu">
              {currentView === 'dashboard' && 'ڈیش بورڈ'}
              {currentView === 'analytics' && 'تجزیہ'}
              {currentView === 'listings' && 'میری فہرست'}
              {currentView === 'orders' && 'آرڈر مینجمنٹ'}
              {currentView === 'profile' && 'فارمیسی پروفائل'}
              {currentView === 'add-medicine' && 'دوا شامل کریں'}
              {currentView === 'stock-alerts' && 'اسٹاک الرٹ'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            
            <div className="relative">
              <button 
                className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-900 flex items-center justify-center cursor-pointer relative hover:bg-slate-50 transition-colors" 
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={18} />
                {notifications.some(n => n.unread) && <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500" />}
              </button>
              
              {showNotifications && (
                <div className="absolute top-12 right-0 w-[300px] bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-4">
                  <h4 className="text-sm font-bold text-slate-900 mb-3 border-b border-slate-200 pb-2">Notifications</h4>
                  {notifications.map(n => (
                    <div key={n.id} className="py-2 border-b border-slate-100 last:border-b-0">
                      <p className="text-xs text-slate-800">{n.text}</p>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div 
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full cursor-pointer hover:bg-slate-50 transition-colors" 
              onClick={() => setCurrentView('profile')}
            >
              <Store size={16} className="text-[#3da860]" />
              <span className="text-xs font-bold text-slate-900">{pharmacy.name}</span>
            </div>
          </div>
        </header>

        <div className="page-container p-8 flex-1">
          {currentView === 'dashboard' && (
            <>
              
              <div className="bg-[#135431] bg-gradient-to-br from-[#135431] to-[#3da860] rounded-2xl p-6 md:p-8 mb-7 text-white shadow-md">
                <h3 className="font-heading text-2xl font-bold">Welcome back, {pharmacy.name}!</h3>
                <p className="text-sm opacity-90 mt-1">Here's what's happening with your pharmacy today.</p>
                <p className="text-xs opacity-80 mt-1.5 urdu">آج آپ کی فارمیسی کے ساتھ کیا ہو رہا ہے</p>
              </div>

              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-7">
                
                <div className="card flex justify-between items-start p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-500">Total Revenue</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">کل آمدنی</span>
                    <h3 className="font-heading text-xl font-bold text-slate-900 my-3">{formatPrice(stats.totalRevenue)}</h3>
                    <span className="text-[11px] font-bold text-[#3da860] bg-[#3da860]/10 px-2 py-0.5 rounded-full w-fit">Total sales</span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-[#3da860]/10 text-[#3da860] flex items-center justify-center shadow-inner">
                    <BarChart3 size={24} />
                  </div>
                </div>

                
                <div className="card flex justify-between items-start p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-500">Active Orders</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">فعال آرڈرز</span>
                    <h3 className="font-heading text-xl font-bold text-slate-900 my-3">{stats.activeOrders}</h3>
                    <span className="text-[11px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full w-fit">
                      {stats.activeOrders > 0 ? `${stats.activeOrders} active` : '0 active'}
                    </span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shadow-inner">
                    <ShoppingBag size={24} />
                  </div>
                </div>

                
                <div className="card flex justify-between items-start p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-500">Medicine Listings</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">دوائیں فہرست</span>
                    <h3 className="font-heading text-xl font-bold text-slate-900 my-3">{stats.medicineListings}</h3>
                    <span className="text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full w-fit">
                      {stats.stockAlerts > 0 ? `${stats.stockAlerts} alerts` : 'Stock normal'}
                    </span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-inner">
                    <Pill size={24} />
                  </div>
                </div>

                
                <div className="card flex justify-between items-start p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-500">Stock Alerts</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">اسٹاک الرٹ</span>
                    <h3 className="font-heading text-xl font-bold text-slate-900 my-3">{stats.stockAlerts}</h3>
                    <span className="text-[11px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full w-fit">
                      {stats.stockAlerts > 0 ? `${stats.stockAlerts} alerts` : 'Healthy stock'}
                    </span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shadow-inner">
                    <AlertTriangle size={24} />
                  </div>
                </div>
              </div>

              
              <div className="grid-2-1">
                
                <div className="card bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="card-header-flex">
                    <div>
                      <h3 className="card-title text-[#135431] font-bold">Recent Orders</h3>
                      <p className="card-subtitle text-slate-500">Latest incoming requests</p>
                      <p className="text-[11px] text-[#3da860] mt-0.5 urdu">حالیہ آرڈرز</p>
                    </div>
                    <button 
                      className="flex items-center gap-1 text-[#3da860] hover:text-[#2e8c4e] text-xs font-bold bg-transparent border-none cursor-pointer" 
                      onClick={() => setCurrentView('orders')}
                    >
                      <span>View All</span>
                      <ArrowUpRight size={14} />
                    </button>
                  </div>

                  {loading ? (
                    <p className="text-center text-slate-400 py-10 text-sm">Loading recent orders...</p>
                  ) : recentOrders.length === 0 ? (
                    <p className="text-center text-slate-400 py-10 text-sm">No recent orders found.</p>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {recentOrders.map(order => (
                        <div key={order.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-[#3da860]">{order.id}</span>
                            <span className="text-xs font-bold text-slate-900 mt-0.5">{order.buyer_name}</span>
                            <span className="text-[11px] text-slate-500 mt-0.5">{order.items_count} items</span>
                          </div>
                          
                          <div className="flex flex-col items-start">
                            <span className="text-sm font-extrabold text-slate-900">{formatPrice(order.total_price)}</span>
                            <span className="text-[10px] text-slate-400 mt-0.5">{order.payment_method}</span>
                          </div>

                          <div className="flex flex-col items-end">
                            {getStatusBadge(order.status)}
                            {order.status.toLowerCase() === 'pending' && (
                              <button 
                                className="btn btn-primary btn-sm bg-[#3da860] hover:bg-[#2e8c4e] shadow-sm mt-2"
                                onClick={() => handleOrderAction(order.id, 'processing')}
                              >
                                Accept Order
                              </button>
                            )}
                            {order.status.toLowerCase() === 'processing' && (
                              <button 
                                className="btn btn-secondary btn-sm bg-blue-500 hover:bg-blue-600 border-none text-white shadow-sm mt-2"
                                onClick={() => handleOrderAction(order.id, 'dispatched')}
                              >
                                Dispatch
                              </button>
                            )}
                            {order.status.toLowerCase() === 'dispatched' && (
                              <button 
                                className="btn btn-primary btn-sm bg-[#3da860] hover:bg-[#2e8c4e] shadow-sm mt-2"
                                onClick={() => handleOrderAction(order.id, 'completed')}
                              >
                                Complete Delivery
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                
                <div className="flex flex-col gap-6">
                  
                  <div className="card bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="card-header-flex">
                      <div>
                        <h3 className="card-title text-[#135431] font-bold">Stock Alerts</h3>
                        <p className="card-subtitle text-slate-500">Items low or out of stock</p>
                        <p className="text-[11px] text-[#3da860] mt-0.5 urdu">اسٹاک الرٹ</p>
                      </div>
                      <button 
                        className="flex items-center gap-1 text-[#3da860] hover:text-[#2e8c4e] text-xs font-bold bg-transparent border-none cursor-pointer" 
                        onClick={() => setCurrentView('stock-alerts')}
                      >
                        <span>View All</span>
                        <ArrowUpRight size={14} />
                      </button>
                    </div>

                    {loading ? (
                      <p className="text-center text-slate-400 py-10 text-sm">Loading alerts...</p>
                    ) : stockAlertsList.length === 0 ? (
                      <p className="text-center text-slate-400 py-10 text-sm">No stock alerts! Everything is well stocked.</p>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {stockAlertsList.map(med => {
                          const maxStock = 20; 
                          const pct = Math.min(Math.round((med.stock / maxStock) * 100), 100);
                          const barColor = med.stock === 0 ? '#ef4444' : (med.stock < 10 ? '#f59e0b' : '#3da860');
                          
                          return (
                            <div key={med.id} className="flex flex-col">
                              <div className="flex justify-between items-center mb-1.5">
                                <span className="text-xs font-semibold text-slate-900">{med.name}</span>
                                <span className={`text-[11px] font-bold ${med.stock === 0 ? 'text-red-500' : 'text-amber-500'}`}>
                                  {med.stock} left
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full rounded-full transition-all duration-300" 
                                  style={{
                                    width: `${pct}%`,
                                    backgroundColor: barColor
                                  }} 
                                />
                              </div>
                              <span className="text-[10px] text-slate-400 mt-1">{med.category}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  
                  <div className="card bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="card-title text-[#135431] font-bold mb-4">Quick Actions</h3>
                    <div className="flex flex-col gap-3">
                      <button 
                        className="btn btn-primary w-full h-11 text-xs font-bold bg-[#3da860] hover:bg-[#2e8c4e] shadow-md shadow-[#3da860]/10 flex justify-start items-center pl-4 gap-2.5 rounded-xl"
                        onClick={() => setCurrentView('add-medicine')}
                      >
                        <PlusCircle size={16} />
                        <span>Add New Medicine</span>
                      </button>

                      <button 
                        className="btn btn-secondary w-full h-11 text-xs font-semibold bg-[#eff7f2] hover:bg-[#c5dbd0]/30 border border-[#3da860]/20 text-slate-800 flex justify-start items-center pl-4 gap-2.5 rounded-xl"
                        onClick={() => setCurrentView('orders')}
                      >
                        <ShoppingBag size={16} className="text-[#3da860]" />
                        <span>View Pending Orders</span>
                      </button>

                      <button 
                        className="btn btn-secondary w-full h-11 text-xs font-semibold bg-[#eff7f2] hover:bg-[#c5dbd0]/30 border border-[#3da860]/20 text-slate-800 flex justify-start items-center pl-4 gap-2.5 rounded-xl"
                        onClick={() => setCurrentView('stock-alerts')}
                      >
                        <Pill size={16} className="text-[#3da860]" />
                        <span>Manage Stock</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {currentView === 'analytics' && (
            <Analytics pharmacy={pharmacy} formatPrice={formatPrice} />
          )}

          {currentView === 'listings' && (
            <Medicines 
              pharmacy={pharmacy} 
              showAddModal={showAddMedModal} 
              onCloseAddModal={() => setShowAddMedModal(false)} 
              editMedicineId={editMedId}
              onCloseEditModal={() => setEditMedId(null)}
              formatPrice={formatPrice}
            />
          )}

          {currentView === 'add-medicine' && (
            <AddMedicine 
              pharmacy={pharmacy} 
              onSaveSuccess={() => {
                setCurrentView('listings');
                fetchDashboardData();
              }}
              onCancel={() => setCurrentView('listings')} 
            />
          )}

          {currentView === 'stock-alerts' && (
            <StockAlerts 
              pharmacy={pharmacy} 
              onAddMedicine={() => setCurrentView('add-medicine')}
              onEditMedicine={(med) => {
                setEditMedId(med.id);
                setCurrentView('listings');
              }}
            />
          )}

          {currentView === 'orders' && (
            <Orders pharmacy={pharmacy} onOrderAction={handleOrderAction} formatPrice={formatPrice} getStatusBadge={getStatusBadge} />
          )}

          {currentView === 'profile' && (
            <Profile pharmacy={pharmacy} onProfileUpdate={(updated) => Object.assign(pharmacy, updated)} />
          )}
        </div>
      </main>
    </div>
  );
}
