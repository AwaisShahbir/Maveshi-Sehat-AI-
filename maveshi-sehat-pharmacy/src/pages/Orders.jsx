import React, { useState, useEffect } from 'react';
import { 
  Clock, Truck, CheckCircle, AlertTriangle, 
  ChevronDown, ChevronRight, ShoppingBag 
} from 'lucide-react';

export default function Orders({ pharmacy, onOrderAction, formatPrice, getStatusBadge }) {
  const [orders, setOrders] = useState([]);
  const [orderDetails, setOrderDetails] = useState({}); // Stores items per order ID
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [expandedOrders, setExpandedOrders] = useState({}); // Map of orderId -> boolean

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/pharmacy/orders?pharmacyId=${pharmacy.id}`);
      if (res.ok) {
        const data = await res.json();
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

  const toggleExpand = async (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));

    // Fetch details/items for this order if not loaded already
    if (!orderDetails[orderId]) {
      try {
        const res = await fetch(`http://localhost:5000/api/forum/posts/${orderId}`); // Or mock query, wait, let's see how order items are fetched
        // Wait, does the backend have an API to fetch order items for an order?
        // Let's write an endpoint in server.js or fetch it from pool.query
        // Since we are running in the frontend, let's query a new endpoint GET /api/pharmacy/orders/:id/items
        const itemsRes = await fetch(`http://localhost:5000/api/pharmacy/orders/${orderId}/items`);
        if (itemsRes.ok) {
          const items = await itemsRes.json();
          setOrderDetails(prev => ({
            ...prev,
            [orderId]: items
          }));
        }
      } catch (err) {
        console.error('Error fetching order items:', err);
      }
    }
  };

  // Compute status counts for filter pills
  const getCounts = (status) => {
    if (status === 'All') return orders.length;
    return orders.filter(o => {
      const s = o.status.toLowerCase();
      if (status === 'Pending') return s === 'pending';
      if (status === 'Processing') return s === 'processing';
      if (status === 'Dispatched') return s === 'dispatched';
      if (status === 'Completed') return s === 'completed' || s === 'delivered';
      return false;
    }).length;
  };

  const statusFilters = ['All', 'Pending', 'Processing', 'Dispatched', 'Completed'];

  const filteredOrders = orders.filter(order => {
    const s = order.status.toLowerCase();
    if (selectedStatus === 'All') return true;
    if (selectedStatus === 'Pending') return s === 'pending';
    if (selectedStatus === 'Processing') return s === 'processing';
    if (selectedStatus === 'Dispatched') return s === 'dispatched';
    if (selectedStatus === 'Completed') return s === 'completed' || s === 'delivered';
    return false;
  });

  const getUrduStatus = (status) => {
    switch(status.toLowerCase()) {
      case 'pending': return 'زیر التواء';
      case 'processing': return 'پروسیسنگ';
      case 'dispatched': return 'روانہ کیا گیا';
      case 'completed':
      case 'delivered': return 'مکمل';
      case 'cancelled': return 'منسوخ';
      default: return '';
    }
  };

  const getCleanStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <span style={{ ...styles.badge, color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.12)' }}>Pending</span>;
      case 'processing':
        return <span style={{ ...styles.badge, color: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.12)' }}>Processing</span>;
      case 'dispatched':
        return <span style={{ ...styles.badge, color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.12)' }}>Dispatched</span>;
      case 'delivered':
      case 'completed':
        return <span style={{ ...styles.badge, color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.12)' }}>Completed</span>;
      case 'cancelled':
        return <span style={{ ...styles.badge, color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.12)' }}>Cancelled</span>;
      default:
        return <span style={styles.badge}>{status}</span>;
    }
  };

  return (
    <div style={styles.container}>
      {/* Top Filter pills matching Screenshot 3 */}
      <div style={styles.filterBar}>
        {statusFilters.map(status => {
          const count = getCounts(status);
          const isActive = selectedStatus === status;
          
          return (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              style={isActive ? styles.filterBtnActive : styles.filterBtn}
            >
              <span>{status === 'All' ? 'All Orders' : status}</span>
              <span style={isActive ? styles.badgeCountActive : styles.badgeCount}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Card lists */}
      {loading ? (
        <div style={styles.loading}>Loading orders... / لوڈ ہو رہا ہے...</div>
      ) : filteredOrders.length === 0 ? (
        <div style={styles.empty}>No orders found matching the filter.</div>
      ) : (
        <div style={styles.ordersList}>
          {filteredOrders.map(order => {
            const isExpanded = expandedOrders[order.id];
            const items = orderDetails[order.id] || [];
            
            return (
              <div key={order.id} style={styles.orderCard}>
                <div style={styles.cardHeader} onClick={() => toggleExpand(order.id)}>
                  <div style={styles.leftSec}>
                    {isExpanded ? (
                      <ChevronDown size={18} style={styles.arrowIcon} />
                    ) : (
                      <ChevronRight size={18} style={styles.arrowIcon} />
                    )}
                    <div style={styles.orderIdBlock}>
                      <span style={styles.orderIdText}>{order.id}</span>
                      {getCleanStatusBadge(order.status)}
                    </div>
                    <span style={styles.orderDate}>
                      {new Date(order.created_at).toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', '')}
                    </span>
                  </div>

                  <div style={styles.midSec}>
                    <span style={styles.buyerNameText}>{order.buyer_name}</span>
                    {order.buyer_name_urdu && (
                      <span style={styles.buyerNameUrdu} className="urdu">{order.buyer_name_urdu}</span>
                    )}
                  </div>

                  <div style={styles.rightSec}>
                    <span style={styles.orderPriceText}>{formatPrice(order.total_price)}</span>
                    <span style={styles.itemsCountText}>{order.items_count} items</span>
                  </div>
                </div>

                {/* Expanded Details section */}
                {isExpanded && (
                  <div style={styles.cardDetails}>
                    <h4 style={styles.detailsTitle}>Order Items Details / آرڈر کی تفصیلات</h4>
                    
                    {items.length === 0 ? (
                      <p style={styles.detailsLoading}>Loading items list...</p>
                    ) : (
                      <div style={styles.detailsTable}>
                        <div style={styles.tableHeaderRow}>
                          <span style={styles.thLabel}>Medicine Name</span>
                          <span style={styles.thLabel}>Quantity</span>
                          <span style={styles.thLabel} style={{ textAlign: 'right' }}>Price</span>
                        </div>
                        {items.map((item, idx) => (
                          <div key={idx} style={styles.tableBodyRow}>
                            <div style={styles.medCol}>
                              <span style={styles.medNameText}>{item.name}</span>
                              {item.name_urdu && <span style={styles.medUrduText}>{item.name_urdu}</span>}
                            </div>
                            <span style={styles.qtyText}>{item.quantity} units</span>
                            <span style={styles.priceColText}>{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={styles.actionRow}>
                      <div style={styles.paymentMethodBlock}>
                        <span style={styles.methodLabel}>Payment Method:</span>
                        <span style={styles.methodVal}>{order.payment_method}</span>
                      </div>
                      
                      <div style={styles.actionBtns}>
                        {order.status.toLowerCase() === 'pending' && (
                          <>
                            <button 
                              className="btn btn-primary"
                              onClick={() => handleAction(order.id, 'processing')}
                            >
                              Accept Order
                            </button>
                            <button 
                              className="btn btn-danger"
                              onClick={() => handleAction(order.id, 'cancelled')}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {order.status.toLowerCase() === 'processing' && (
                          <>
                            <button 
                              className="btn btn-primary"
                              style={{ backgroundColor: '#3b82f6' }}
                              onClick={() => handleAction(order.id, 'dispatched')}
                            >
                              Dispatch Order
                            </button>
                            <button 
                              className="btn btn-danger"
                              onClick={() => handleAction(order.id, 'cancelled')}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {order.status.toLowerCase() === 'dispatched' && (
                          <button 
                            className="btn btn-primary"
                            onClick={() => handleAction(order.id, 'completed')}
                          >
                            Complete Delivery
                          </button>
                        )}
                        {(order.status.toLowerCase() === 'completed' || order.status.toLowerCase() === 'delivered' || order.status.toLowerCase() === 'cancelled') && (
                          <span style={styles.noActionRequiredText}>Order Processed</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  filterBar: {
    display: 'flex',
    gap: '12px',
    backgroundColor: '#ffffff',
    padding: '6px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    overflowX: 'auto',
    width: 'fit-content'
  },
  filterBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#475569',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
  },
  filterBtnActive: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
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
  badgeCount: {
    fontSize: '10px',
    fontWeight: '700',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    padding: '2px 8px',
    borderRadius: '10px',
  },
  badgeCountActive: {
    fontSize: '10px',
    fontWeight: '700',
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: '#ffffff',
    padding: '2px 8px',
    borderRadius: '10px',
  },
  loading: {
    textAlign: 'center',
    color: '#64748b',
    padding: '40px 0',
  },
  empty: {
    textAlign: 'center',
    color: '#64748b',
    padding: '60px 0',
    fontSize: '15px',
    backgroundColor: '#ffffff',
    border: '1px dashed #cbd5e1',
    borderRadius: '12px',
  },
  ordersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  orderCard: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-light)',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-sm)',
    transition: 'all 0.2s ease'
  },
  cardHeader: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr 1fr',
    alignItems: 'center',
    padding: '20px 24px',
    cursor: 'pointer',
    userSelect: 'none'
  },
  leftSec: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px'
  },
  arrowIcon: {
    color: '#64748b',
    flexShrink: 0
  },
  orderIdBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  orderIdText: {
    fontWeight: '700',
    fontSize: '15px',
    color: '#0f172a'
  },
  badge: {
    display: 'inline-flex',
    padding: '3px 8px',
    fontSize: '10px',
    fontWeight: '700',
    borderRadius: '20px'
  },
  orderDate: {
    fontSize: '12px',
    color: '#64748b',
    fontWeight: '600'
  },
  midSec: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  buyerNameText: {
    fontWeight: '700',
    fontSize: '14px',
    color: '#0f172a'
  },
  buyerNameUrdu: {
    fontSize: '12px',
    color: '#64748b',
    fontWeight: '600'
  },
  rightSec: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '2px'
  },
  orderPriceText: {
    fontWeight: '800',
    fontSize: '16px',
    color: '#0f172a',
    fontFamily: 'Outfit, sans-serif'
  },
  itemsCountText: {
    fontSize: '12px',
    color: '#475569',
    fontWeight: '600'
  },
  cardDetails: {
    borderTop: '1.5px solid #e2e8f0',
    padding: '24px',
    backgroundColor: '#f8fafc'
  },
  detailsTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#10b981',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '16px'
  },
  detailsLoading: {
    color: '#64748b',
    fontSize: '13px'
  },
  detailsTable: {
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    overflow: 'hidden',
    marginBottom: '20px'
  },
  tableHeaderRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr',
    backgroundColor: '#f1f5f9',
    padding: '10px 16px',
    borderBottom: '1px solid #e2e8f0'
  },
  thLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase'
  },
  tableBodyRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr',
    padding: '12px 16px',
    borderBottom: '1px solid #e2e8f0',
    alignItems: 'center'
  },
  medCol: {
    display: 'flex',
    flexDirection: 'column'
  },
  medNameText: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#0f172a'
  },
  medUrduText: {
    fontSize: '11px',
    color: '#10b981',
    fontWeight: '500'
  },
  qtyText: {
    fontSize: '13px',
    color: '#475569',
    fontWeight: '500'
  },
  priceColText: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'right'
  },
  actionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '16px'
  },
  paymentMethodBlock: {
    display: 'flex',
    gap: '8px',
    fontSize: '13px'
  },
  methodLabel: {
    color: '#64748b',
    fontWeight: '500'
  },
  methodVal: {
    color: '#0f172a',
    fontWeight: '700'
  },
  actionBtns: {
    display: 'flex',
    gap: '10px'
  },
  noActionRequiredText: {
    fontSize: '12px',
    color: '#64748b',
    fontWeight: '600',
    border: '1px solid #cbd5e1',
    padding: '6px 12px',
    borderRadius: '6px'
  }
};
