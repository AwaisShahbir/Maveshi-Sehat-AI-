import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, BarChart3, Pill, PlusCircle, Tags, AlertTriangle, 
  ShoppingBag, Clock, Truck, CheckCircle, User, Settings, LogOut, Bell, Store, ArrowUpRight 
} from 'lucide-react';
import Medicines from './Medicines';
import Orders from './Orders';
import Profile from './Profile';

export default function Dashboard({ pharmacy, onLogout }) {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'listings', 'orders', 'profile'
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
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'New order #ORD-1045 received', time: '10m ago', unread: true },
    { id: 2, text: 'Stock warning: Deltamethrin Tick Grease is low', time: '2h ago', unread: true }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch Dashboard Stats & Listings
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
    <div className="app-container">
      {/* Sidebar navigation */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarBrand}>
          <div style={styles.brandIcon}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#10b981" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M12 8v8M8 12h8" strokeWidth="3" />
            </svg>
          </div>
          <div>
            <span style={styles.brandName}>Maveshi Sehat AI</span>
            <span style={styles.brandTag}>Pharmacy Portal / پورٹل</span>
          </div>
        </div>

        <div style={styles.sidebarProfile}>
          <div style={styles.profileAvatar}>
            <Store size={20} />
          </div>
          <div>
            <span style={styles.profileName}>{pharmacy.name}</span>
            <span style={styles.profileStatus}>Verified / تصدیق شدہ</span>
          </div>
        </div>

        <nav style={styles.sidebarMenu}>
          <div style={styles.menuGroup}>
            <span style={styles.groupTitle}>OVERVIEW</span>
            <ul style={styles.groupList}>
              <li>
                <button 
                  onClick={() => setCurrentView('dashboard')}
                  style={currentView === 'dashboard' ? styles.menuItemActive : styles.menuItem}
                >
                  <LayoutDashboard size={18} />
                  <div style={styles.menuLabelBlock}>
                    <span style={styles.menuLabelEn}>Dashboard</span>
                    <span style={styles.menuLabelUr}>ڈیش بورڈ</span>
                  </div>
                </button>
              </li>
            </ul>
          </div>

          <div style={styles.menuGroup}>
            <span style={styles.groupTitle}>MEDICINES / دوائیں</span>
            <ul style={styles.groupList}>
              <li>
                <button 
                  onClick={() => setCurrentView('listings')}
                  style={currentView === 'listings' ? styles.menuItemActive : styles.menuItem}
                >
                  <Pill size={18} />
                  <div style={styles.menuLabelBlock}>
                    <span style={styles.menuLabelEn}>My Listings</span>
                    <span style={styles.menuLabelUr}>میری فہرست</span>
                  </div>
                  <span style={styles.menuBadge}>{stats.medicineListings}</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { setCurrentView('listings'); setShowAddMedModal(true); }}
                  style={styles.menuItem}
                >
                  <PlusCircle size={18} />
                  <div style={styles.menuLabelBlock}>
                    <span style={styles.menuLabelEn}>Add Medicine</span>
                    <span style={styles.menuLabelUr}>دوائی شامل کریں</span>
                  </div>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setCurrentView('listings')}
                  style={styles.menuItem}
                >
                  <Tags size={18} />
                  <div style={styles.menuLabelBlock}>
                    <span style={styles.menuLabelEn}>Categories</span>
                    <span style={styles.menuLabelUr}>زمرہ جات</span>
                  </div>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setCurrentView('listings')}
                  style={styles.menuItem}
                >
                  <AlertTriangle size={18} />
                  <div style={styles.menuLabelBlock}>
                    <span style={styles.menuLabelEn}>Stock Alerts</span>
                    <span style={styles.menuLabelUr}>اسٹاک الرٹ</span>
                  </div>
                  {stats.stockAlerts > 0 && (
                    <span style={styles.menuBadgeWarn}>{stats.stockAlerts}</span>
                  )}
                </button>
              </li>
            </ul>
          </div>

          <div style={styles.menuGroup}>
            <span style={styles.groupTitle}>ORDERS / آرڈرز</span>
            <ul style={styles.groupList}>
              <li>
                <button 
                  onClick={() => setCurrentView('orders')}
                  style={currentView === 'orders' ? styles.menuItemActive : styles.menuItem}
                >
                  <ShoppingBag size={18} />
                  <div style={styles.menuLabelBlock}>
                    <span style={styles.menuLabelEn}>All Orders</span>
                    <span style={styles.menuLabelUr}>تمام آرڈرز</span>
                  </div>
                  {stats.activeOrders > 0 && (
                    <span style={styles.menuBadgeActive}>{stats.activeOrders}</span>
                  )}
                </button>
              </li>
            </ul>
          </div>

          <div style={styles.menuGroup}>
            <span style={styles.groupTitle}>ACCOUNT / اکاؤنٹ</span>
            <ul style={styles.groupList}>
              <li>
                <button 
                  onClick={() => setCurrentView('profile')}
                  style={currentView === 'profile' ? styles.menuItemActive : styles.menuItem}
                >
                  <User size={18} />
                  <div style={styles.menuLabelBlock}>
                    <span style={styles.menuLabelEn}>Pharmacy Profile</span>
                    <span style={styles.menuLabelUr}>فارمیسی پروفائل</span>
                  </div>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setCurrentView('profile')}
                  style={styles.menuItem}
                >
                  <Settings size={18} />
                  <div style={styles.menuLabelBlock}>
                    <span style={styles.menuLabelEn}>Settings</span>
                    <span style={styles.menuLabelUr}>ترتیبات</span>
                  </div>
                </button>
              </li>
            </ul>
          </div>
        </nav>

        <div style={styles.sidebarFooter}>
          <button style={styles.logoutBtn} onClick={onLogout}>
            <LogOut size={16} />
            <div style={styles.menuLabelBlock}>
              <span style={{ fontSize: '13px', fontWeight: '600' }}>Logout / لاگ آوٹ</span>
            </div>
          </button>
        </div>
      </aside>

      {/* Main page content area */}
      <main className="main-content">
        <header style={styles.header}>
          <div style={styles.headerTitleContainer}>
            <h2 style={styles.headerTitleEn}>
              {currentView === 'dashboard' && 'Dashboard'}
              {currentView === 'listings' && 'Medicine Listings'}
              {currentView === 'orders' && 'Orders Management'}
              {currentView === 'profile' && 'Pharmacy Profile'}
            </h2>
            <span style={styles.headerTitleUr} className="urdu">
              {currentView === 'dashboard' && 'ڈیش بورڈ'}
              {currentView === 'listings' && 'میری فرست'}
              {currentView === 'orders' && 'آرڈر مینجمنٹ'}
              {currentView === 'profile' && 'فارمیسی پروفائل'}
            </span>
          </div>

          <div style={styles.headerActions}>
            <button 
              style={styles.headerAddBtn}
              onClick={() => { setCurrentView('listings'); setShowAddMedModal(true); }}
            >
              <PlusCircle size={16} />
              <span>Add Medicine / شامل کریں</span>
            </button>

            {/* Notification Bell */}
            <div style={styles.notifWrapper}>
              <button style={styles.headerNotifBtn} onClick={() => setShowNotifications(!showNotifications)}>
                <Bell size={18} />
                {notifications.some(n => n.unread) && <span style={styles.notifBadge} />}
              </button>
              
              {showNotifications && (
                <div style={styles.notifDropdown}>
                  <h4 style={styles.notifDropHeader}>Notifications</h4>
                  {notifications.map(n => (
                    <div key={n.id} style={styles.notifItem}>
                      <p style={styles.notifItemText}>{n.text}</p>
                      <span style={styles.notifItemTime}>{n.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={styles.headerProfileBadge} onClick={() => setCurrentView('profile')}>
              <Store size={16} style={{ color: '#10b981' }} />
              <span style={styles.headerProfileName}>{pharmacy.name}</span>
            </div>
          </div>
        </header>

        <div className="page-container">
          {currentView === 'dashboard' && (
            <>
              {/* Welcome banner */}
              <div style={styles.welcomeBanner}>
                <h3 style={styles.welcomeTitle}>Welcome back, {pharmacy.name}!</h3>
                <p style={styles.welcomeSub}>Here's what's happening with your pharmacy today.</p>
                <p style={styles.welcomeUrdu} className="urdu">آج آپ کی فارمیسی کے ساتھ کیا ہو رہا ہے</p>
              </div>

              {/* Stats Row */}
              <div style={styles.statsGrid}>
                {/* 1. Revenue */}
                <div className="card" style={styles.statCard}>
                  <div style={styles.statLeft}>
                    <span style={styles.statLabel}>Total Revenue</span>
                    <span style={styles.statLabelUr}>کل آمدنی</span>
                    <h3 style={styles.statVal}>{formatPrice(stats.totalRevenue)}</h3>
                    <span style={styles.statTrendUp}>+12.5%</span>
                  </div>
                  <div style={styles.statIconContainerGreen}>
                    <BarChart3 size={24} />
                  </div>
                </div>

                {/* 2. Active Orders */}
                <div className="card" style={styles.statCard}>
                  <div style={styles.statLeft}>
                    <span style={styles.statLabel}>Active Orders</span>
                    <span style={styles.statLabelUr}>فعال آرڈرز</span>
                    <h3 style={styles.statVal}>{stats.activeOrders}</h3>
                    <span style={styles.statTrendNeutral}>+2 today</span>
                  </div>
                  <div style={styles.statIconContainerBlue}>
                    <ShoppingBag size={24} />
                  </div>
                </div>

                {/* 3. Medicine Listings */}
                <div className="card" style={styles.statCard}>
                  <div style={styles.statLeft}>
                    <span style={styles.statLabel}>Medicine Listings</span>
                    <span style={styles.statLabelUr}>دوائیں فہرست</span>
                    <h3 style={styles.statVal}>{stats.medicineListings}</h3>
                    <span style={styles.statTrendWarning}>3 low stock</span>
                  </div>
                  <div style={styles.statIconContainerOrange}>
                    <Pill size={24} />
                  </div>
                </div>

                {/* 4. Stock Alerts */}
                <div className="card" style={styles.statCard}>
                  <div style={styles.statLeft}>
                    <span style={styles.statLabel}>Stock Alerts</span>
                    <span style={styles.statLabelUr}>اسٹاک الرٹ</span>
                    <h3 style={styles.statVal}>{stats.stockAlerts}</h3>
                    <span style={styles.statTrendDanger}>Needs attention</span>
                  </div>
                  <div style={styles.statIconContainerRed}>
                    <AlertTriangle size={24} />
                  </div>
                </div>
              </div>

              {/* Main Split Grid */}
              <div className="grid-2-1">
                {/* Recent Orders Card */}
                <div className="card">
                  <div className="card-header-flex">
                    <div>
                      <h3 className="card-title">Recent Orders</h3>
                      <p className="card-subtitle">Latest incoming requests</p>
                      <p style={styles.cardHeaderUrdu} className="urdu">حالیہ آرڈرز</p>
                    </div>
                    <button style={styles.cardHeaderLink} onClick={() => setCurrentView('orders')}>
                      <span>View All</span>
                      <ArrowUpRight size={14} />
                    </button>
                  </div>

                  {loading ? (
                    <p style={styles.emptyText}>Loading recent orders...</p>
                  ) : recentOrders.length === 0 ? (
                    <p style={styles.emptyText}>No recent orders found.</p>
                  ) : (
                    <div style={styles.recentOrdersList}>
                      {recentOrders.map(order => (
                        <div key={order.id} style={styles.orderItem}>
                          <div style={styles.orderItemLeft}>
                            <span style={styles.orderId}>{order.id}</span>
                            <span style={styles.buyerName}>{order.buyer_name}</span>
                            <span style={styles.orderItemsCount}>{order.items_count} items</span>
                          </div>
                          
                          <div style={styles.orderItemMid}>
                            <span style={styles.orderPrice}>{formatPrice(order.total_price)}</span>
                            <span style={styles.paymentMethod}>{order.payment_method}</span>
                          </div>

                          <div style={styles.orderItemRight}>
                            {getStatusBadge(order.status)}
                            {order.status.toLowerCase() === 'pending' && (
                              <button 
                                className="btn btn-primary btn-sm"
                                style={{ marginTop: '8px' }}
                                onClick={() => handleOrderAction(order.id, 'processing')}
                              >
                                Accept Order
                              </button>
                            )}
                            {order.status.toLowerCase() === 'processing' && (
                              <button 
                                className="btn btn-secondary btn-sm"
                                style={{ marginTop: '8px', color: '#ffffff', backgroundColor: '#3b82f6', borderColor: 'transparent' }}
                                onClick={() => handleOrderAction(order.id, 'dispatched')}
                              >
                                Dispatch
                              </button>
                            )}
                            {order.status.toLowerCase() === 'dispatched' && (
                              <button 
                                className="btn btn-primary btn-sm"
                                style={{ marginTop: '8px' }}
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

                {/* Right Column: Stock Alerts & Quick Actions */}
                <div style={styles.rightCol}>
                  {/* Stock Alerts Card */}
                  <div className="card" style={{ marginBottom: '24px' }}>
                    <div className="card-header-flex">
                      <div>
                        <h3 className="card-title">Stock Alerts</h3>
                        <p className="card-subtitle">Items low or out of stock</p>
                        <p style={styles.cardHeaderUrdu} className="urdu">اسٹاک الرٹ</p>
                      </div>
                      <button style={styles.cardHeaderLink} onClick={() => setCurrentView('listings')}>
                        <span>View All</span>
                        <ArrowUpRight size={14} />
                      </button>
                    </div>

                    {loading ? (
                      <p style={styles.emptyText}>Loading alerts...</p>
                    ) : stockAlertsList.length === 0 ? (
                      <p style={styles.emptyText}>No stock alerts! Everything is well stocked.</p>
                    ) : (
                      <div style={styles.alertsList}>
                        {stockAlertsList.map(med => {
                          const maxStock = 20; // arbitrary baseline for progress
                          const pct = Math.min(Math.round((med.stock / maxStock) * 100), 100);
                          const barColor = med.stock === 0 ? '#ef4444' : (med.stock < 10 ? '#f59e0b' : '#3b82f6');
                          
                          return (
                            <div key={med.id} style={styles.alertItem}>
                              <div style={styles.alertItemHeader}>
                                <span style={styles.alertMedName}>{med.name}</span>
                                <span style={med.stock === 0 ? styles.stockBadgeRed : styles.stockBadgeOrange}>
                                  {med.stock} left
                                </span>
                              </div>
                              <div style={styles.progressBarBg}>
                                <div style={{
                                  ...styles.progressBarFill,
                                  width: `${pct}%`,
                                  backgroundColor: barColor
                                }} />
                              </div>
                              <span style={styles.alertMedCat}>{med.category}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Quick Actions Card */}
                  <div className="card">
                    <h3 className="card-title" style={{ marginBottom: '16px' }}>Quick Actions</h3>
                    <div style={styles.quickActionsList}>
                      <button 
                        className="btn btn-primary"
                        style={styles.quickActionBtn}
                        onClick={() => { setCurrentView('listings'); setShowAddMedModal(true); }}
                      >
                        <PlusCircle size={16} />
                        <span>Add New Medicine</span>
                      </button>

                      <button 
                        className="btn btn-secondary"
                        style={styles.quickActionBtn}
                        onClick={() => setCurrentView('orders')}
                      >
                        <ShoppingBag size={16} />
                        <span>View Pending Orders</span>
                      </button>

                      <button 
                        className="btn btn-secondary"
                        style={styles.quickActionBtn}
                        onClick={() => setCurrentView('listings')}
                      >
                        <Pill size={16} />
                        <span>Manage Stock</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {currentView === 'listings' && (
            <Medicines 
              pharmacy={pharmacy} 
              showAddModal={showAddMedModal} 
              onCloseAddModal={() => setShowAddMedModal(false)} 
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

const styles = {
  sidebar: {
    width: '280px',
    backgroundColor: '#070a0e',
    borderRight: '1px solid #1e293b',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  sidebarBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '24px',
    borderBottom: '1px solid #1e293b',
  },
  brandIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1.5px solid #10b981',
  },
  brandName: {
    fontFamily: 'Outfit, sans-serif',
    fontSize: '16px',
    fontWeight: '800',
    color: '#ffffff',
    display: 'block',
  },
  brandTag: {
    fontSize: '11px',
    color: '#10b981',
    fontWeight: '600',
    display: 'block',
  },
  sidebarProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '20px 24px',
    borderBottom: '1px solid #1e293b',
    backgroundColor: 'rgba(30, 41, 59, 0.2)',
  },
  profileAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid #10b981',
    color: '#10b981',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#ffffff',
    display: 'block',
  },
  profileStatus: {
    fontSize: '11px',
    color: '#10b981',
    fontWeight: '600',
    display: 'block',
  },
  sidebarMenu: {
    flex: '1',
    overflowY: 'auto',
    padding: '20px 0',
  },
  menuGroup: {
    marginBottom: '20px',
  },
  groupTitle: {
    display: 'block',
    fontSize: '10px',
    fontWeight: '800',
    color: '#475569',
    padding: '0 24px',
    marginBottom: '10px',
    letterSpacing: '1px',
  },
  groupList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '10px 24px',
    color: '#94a3b8',
    backgroundColor: 'transparent',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
  },
  menuItemActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '10px 24px',
    color: '#ffffff',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '14px',
    borderLeft: '4px solid #10b981',
    transition: 'all 0.2s ease',
  },
  menuLabelBlock: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
  },
  menuLabelEn: {
    fontWeight: '600',
  },
  menuLabelUr: {
    fontSize: '10px',
    opacity: '0.7',
    marginTop: '1px',
  },
  menuBadge: {
    fontSize: '10px',
    fontWeight: '700',
    backgroundColor: '#334155',
    color: '#94a3b8',
    padding: '2px 8px',
    borderRadius: '10px',
  },
  menuBadgeActive: {
    fontSize: '10px',
    fontWeight: '700',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    color: '#3b82f6',
    padding: '2px 8px',
    borderRadius: '10px',
  },
  menuBadgeWarn: {
    fontSize: '10px',
    fontWeight: '700',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    color: '#f59e0b',
    padding: '2px 8px',
    borderRadius: '10px',
  },
  sidebarFooter: {
    padding: '16px 24px',
    borderTop: '1px solid #1e293b',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 16px',
    backgroundColor: 'transparent',
    border: '1px solid #334155',
    color: '#ef4444',
    borderRadius: '8px',
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.2s ease',
  },
  header: {
    height: '80px',
    backgroundColor: '#1e293b',
    borderBottom: '1px solid #334155',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    position: 'sticky',
    top: 0,
    zIndex: 90,
  },
  headerTitleContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  headerTitleEn: {
    fontFamily: 'Outfit, sans-serif',
    fontSize: '22px',
    fontWeight: '700',
    color: '#ffffff',
  },
  headerTitleUr: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '2px',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  headerAddBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: '#10b981',
    color: '#ffffff',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  notifWrapper: {
    position: 'relative',
  },
  headerNotifBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#ef4444',
  },
  notifDropdown: {
    position: 'absolute',
    top: '50px',
    right: 0,
    width: '300px',
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '12px',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
    zIndex: 200,
    padding: '16px',
  },
  notifDropHeader: {
    fontSize: '14px',
    fontWeight: '700',
    marginBottom: '12px',
    borderBottom: '1px solid #334155',
    paddingBottom: '8px',
  },
  notifItem: {
    padding: '8px 0',
    borderBottom: '1px solid #334155',
  },
  notifItemText: {
    fontSize: '12px',
    color: '#f8fafc',
  },
  notifItemTime: {
    fontSize: '10px',
    color: '#64748b',
  },
  headerProfileBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '20px',
    cursor: 'pointer',
  },
  headerProfileName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#ffffff',
  },
  welcomeBanner: {
    backgroundColor: '#10b981',
    backgroundImage: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    borderRadius: '16px',
    padding: '24px 32px',
    marginBottom: '28px',
    color: '#ffffff',
  },
  welcomeTitle: {
    fontFamily: 'Outfit, sans-serif',
    fontSize: '24px',
    fontWeight: '700',
  },
  welcomeSub: {
    fontSize: '14px',
    opacity: '0.9',
    marginTop: '4px',
  },
  welcomeUrdu: {
    fontSize: '12px',
    opacity: '0.8',
    marginTop: '6px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
    marginBottom: '28px',
  },
  statCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '20px',
  },
  statLeft: {
    display: 'flex',
    flexDirection: 'column',
  },
  statLabel: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#94a3b8',
  },
  statLabelUr: {
    fontSize: '10px',
    color: '#64748b',
    marginTop: '1px',
  },
  statVal: {
    fontFamily: 'Outfit, sans-serif',
    fontSize: '22px',
    fontWeight: '700',
    color: '#ffffff',
    margin: '12px 0 4px 0',
  },
  statTrendUp: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#10b981',
  },
  statTrendNeutral: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#3b82f6',
  },
  statTrendWarning: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#f59e0b',
  },
  statTrendDanger: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#ef4444',
  },
  statIconContainerGreen: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    color: '#10b981',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconContainerBlue: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    color: '#3b82f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconContainerOrange: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    color: '#f59e0b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  statIconContainerRed: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: '#10b981',
    fontSize: '13px',
    fontWeight: '600',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
  cardHeaderUrdu: {
    fontSize: '11px',
    color: '#10b981',
    marginTop: '2px',
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748b',
    padding: '40px 0',
    fontSize: '14px',
  },
  recentOrdersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  orderItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: '#0f172a',
    borderRadius: '12px',
    border: '1px solid #334155',
  },
  orderItemLeft: {
    display: 'flex',
    flexDirection: 'column',
  },
  orderId: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#10b981',
  },
  buyerName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#ffffff',
    marginTop: '2px',
  },
  orderItemsCount: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '1px',
  },
  orderItemMid: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  orderPrice: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#ffffff',
  },
  paymentMethod: {
    fontSize: '11px',
    color: '#64748b',
    marginTop: '2px',
  },
  orderItemRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  alertsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  alertItem: {
    display: 'flex',
    flexDirection: 'column',
  },
  alertItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  alertMedName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#ffffff',
  },
  stockBadgeRed: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#ef4444',
  },
  stockBadgeOrange: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#f59e0b',
  },
  progressBarBg: {
    width: '100%',
    height: '6px',
    backgroundColor: '#0f172a',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  },
  alertMedCat: {
    fontSize: '11px',
    color: '#64748b',
    marginTop: '4px',
  },
  quickActionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  quickActionBtn: {
    width: '100%',
    height: '42px',
    fontSize: '13px',
    display: 'flex',
    justifyContent: 'flex-start',
    paddingLeft: '16px',
  },
};
