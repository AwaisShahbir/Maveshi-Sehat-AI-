import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Clock, Truck, CheckCircle, AlertTriangle } from 'lucide-react';

export default function Orders({ pharmacy, onOrderAction, formatPrice, getStatusBadge }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const statusFilters = ['All', 'Pending', 'Processing', 'Dispatched', 'Completed', 'Cancelled'];

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/pharmacy/orders?pharmacyId=${pharmacy.id}`);
      const data = await res.json();
      if (res.ok) {
        setOrders(data);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [pharmacy.id]);

  const handleAction = async (orderId, newStatus) => {
    await onOrderAction(orderId, newStatus);
    fetchOrders();
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(search.toLowerCase()) || 
                          order.buyer_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || 
                          order.status.toLowerCase() === selectedStatus.toLowerCase() || 
                          (selectedStatus === 'Completed' && order.status.toLowerCase() === 'delivered');
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={styles.container}>
      {/* Search and stats bar */}
      <div style={styles.actionBar}>
        <div style={styles.searchWrapper}>
          <Search size={18} style={styles.searchIcon} />
          <input 
            type="text"
            placeholder="Search orders by ID or buyer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {statusFilters.map(status => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            style={selectedStatus === status ? styles.tabBtnActive : styles.tabBtn}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      {loading ? (
        <div style={styles.loading}>Loading orders list...</div>
      ) : filteredOrders.length === 0 ? (
        <div style={styles.empty}>No orders found matching the filters.</div>
      ) : (
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Order Date / تاریخ</th>
                <th>Buyer Name / کسان کا نام</th>
                <th>Items / اشیاء</th>
                <th>Total Price / کل قیمت</th>
                <th>Payment / ادائیگی</th>
                <th>Status / حیثیت</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id}>
                  <td style={{ fontWeight: '700', color: '#10b981' }}>{order.id}</td>
                  <td>{new Date(order.created_at).toLocaleString()}</td>
                  <td style={{ fontWeight: '600' }}>{order.buyer_name}</td>
                  <td>{order.items_count} items</td>
                  <td style={{ fontWeight: '700' }}>{formatPrice(order.total_price)}</td>
                  <td>{order.payment_method}</td>
                  <td>{getStatusBadge(order.status)}</td>
                  <td>
                    <div style={styles.actionBlock}>
                      {order.status.toLowerCase() === 'pending' && (
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => handleAction(order.id, 'processing')}
                        >
                          Accept Order
                        </button>
                      )}
                      {order.status.toLowerCase() === 'processing' && (
                        <button 
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#ffffff', backgroundColor: '#3b82f6', borderColor: 'transparent' }}
                          onClick={() => handleAction(order.id, 'dispatched')}
                        >
                          Dispatch
                        </button>
                      )}
                      {order.status.toLowerCase() === 'dispatched' && (
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => handleAction(order.id, 'completed')}
                        >
                          Complete Delivery
                        </button>
                      )}
                      {(order.status.toLowerCase() === 'pending' || order.status.toLowerCase() === 'processing') && (
                        <button 
                          className="btn btn-danger btn-sm"
                          style={{ marginLeft: '8px' }}
                          onClick={() => handleAction(order.id, 'cancelled')}
                        >
                          Cancel
                        </button>
                      )}
                      {(order.status.toLowerCase() === 'completed' || order.status.toLowerCase() === 'delivered' || order.status.toLowerCase() === 'cancelled') && (
                        <span style={{ fontSize: '12px', color: '#64748b' }}>No Action Required</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  actionBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
  },
  searchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    flex: '1',
    maxWidth: '400px',
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    color: '#64748b',
  },
  searchInput: {
    width: '100%',
    height: '42px',
    paddingLeft: '44px',
    paddingRight: '16px',
    border: '1px solid #334155',
    borderRadius: '10px',
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    fontSize: '14px',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    borderBottom: '1px solid #334155',
    paddingBottom: '12px',
    overflowX: 'auto',
  },
  tabBtn: {
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#94a3b8',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
  },
  tabBtnActive: {
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#10b981',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
  },
  loading: {
    textAlign: 'center',
    color: '#94a3b8',
    padding: '40px 0',
  },
  empty: {
    textAlign: 'center',
    color: '#64748b',
    padding: '60px 0',
    fontSize: '15px',
    backgroundColor: '#1e293b',
    border: '1px dashed #334155',
    borderRadius: '12px',
  },
  actionBlock: {
    display: 'flex',
    alignItems: 'center',
  },
};
