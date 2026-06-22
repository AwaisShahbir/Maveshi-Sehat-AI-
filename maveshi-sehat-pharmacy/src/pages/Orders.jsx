import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Clock, ShoppingBag, Truck, CheckCircle, AlertTriangle } from 'lucide-react';

export default function Orders({ pharmacy, onOrderAction, formatPrice, getStatusBadge }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('All'); 
  const [expandedOrders, setExpandedOrders] = useState({});
  const [orderDetails, setOrderDetails] = useState({});

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

  const toggleExpand = async (orderId) => {
    const nextState = !expandedOrders[orderId];
    setExpandedOrders({ ...expandedOrders, [orderId]: nextState });

    if (nextState && !orderDetails[orderId]) {
      try {
        const res = await fetch(`http://localhost:5000/api/pharmacy/orders/${orderId}/items`);
        const data = await res.json();
        if (res.ok) {
          setOrderDetails({ ...orderDetails, [orderId]: data });
        }
      } catch (err) {
        console.error('Failed to fetch order details:', err);
      }
    }
  };

  const handleAction = async (orderId, status) => {
    await onOrderAction(orderId, status);
    fetchOrders();
  };

  const getCounts = (status) => {
    if (status === 'All') return orders.length;
    return orders.filter(o => o.status.toLowerCase() === status.toLowerCase()).length;
  };

  const filteredOrders = orders.filter(o => {
    if (selectedStatus === 'All') return true;
    return o.status.toLowerCase() === selectedStatus.toLowerCase();
  });

  const getCleanStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <span className="inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full text-amber-500 bg-amber-500/10">Pending</span>;
      case 'processing':
        return <span className="inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full text-blue-500 bg-blue-500/10">Processing</span>;
      case 'dispatched':
        return <span className="inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full text-amber-500 bg-amber-500/10">Dispatched</span>;
      case 'delivered':
      case 'completed':
        return <span className="inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full text-emerald-500 bg-emerald-500/10">Completed</span>;
      case 'cancelled':
        return <span className="inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full text-red-500 bg-red-500/10">Cancelled</span>;
      default:
        return <span className="inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full">{status}</span>;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Top Status Tabs */}
      <div className="flex gap-2.5 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto w-full sm:w-fit">
        {statusFilters.map(status => {
          const count = getCounts(status);
          const isActive = selectedStatus === status;
          
          return (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold border-none cursor-pointer rounded-xl transition-all whitespace-nowrap ${
                isActive 
                  ? 'text-white bg-[#3da860] shadow-md shadow-[#3da860]/10' 
                  : 'text-slate-600 bg-transparent hover:bg-slate-50'
              }`}
            >
              <span>{status === 'All' ? 'All Orders' : status}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-[10px] transition-all ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Orders List Container */}
      {loading ? (
        <div className="text-center text-slate-500 py-16 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-[#3da860] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Loading orders... / آرڈرز لوڈ ہو رہے ہیں...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center text-slate-500 py-16 text-sm bg-white border border-dashed border-slate-200 rounded-2xl">
          No orders found matching the filter.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredOrders.map(order => {
            const isExpanded = expandedOrders[order.id];
            const items = orderDetails[order.id] || [];
            
            return (
              <div key={order.id} className={`bg-white rounded-2xl border ${isExpanded ? 'border-[#3da860]' : 'border-slate-100'} overflow-hidden shadow-sm hover:shadow-md transition-all duration-200`}>
                
                {/* Accordion Toggle Header */}
                <div className="grid grid-cols-1 md:grid-cols-3 items-center p-5 cursor-pointer select-none gap-3" onClick={() => toggleExpand(order.id)}>
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown size={18} className="text-[#3da860] shrink-0" />
                    ) : (
                      <ChevronRight size={18} className="text-slate-400 shrink-0" />
                    )}
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900 font-mono">{order.id}</span>
                      {getCleanStatusBadge(order.status)}
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                      {new Date(order.created_at).toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', '')}
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-slate-900">{order.buyer_name}</span>
                    {order.buyer_name_urdu && (
                      <span className="text-xs text-slate-400 font-semibold urdu mt-0.5">{order.buyer_name_urdu}</span>
                    )}
                  </div>

                  <div className="flex flex-col items-start md:items-end">
                    <span className="font-extrabold text-base text-slate-900 font-heading">{formatPrice(order.total_price)}</span>
                    <span className="text-[11px] text-slate-400 font-bold mt-0.5">{order.items_count} items</span>
                  </div>
                </div>

                {/* Accordion Expanded Drawer */}
                {isExpanded && (
                  <div className="border-t border-slate-100 p-6 bg-slate-50/50">
                    <h4 className="text-xs font-bold text-[#135431] uppercase tracking-wider mb-4 font-heading">
                      Order Items Details / آرڈر کی تفصیلات
                    </h4>
                    
                    {items.length === 0 ? (
                      <p className="text-slate-400 text-xs">Loading items list...</p>
                    ) : (
                      <div className="flex flex-col border border-slate-200/60 rounded-xl overflow-hidden mb-5 bg-white">
                        <div className="grid grid-cols-3 bg-slate-50/80 p-3 px-4 border-b border-slate-200/60">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Medicine Name</span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quantity</span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Price</span>
                        </div>
                        {items.map((item, idx) => (
                          <div key={idx} className="grid grid-cols-3 p-3 px-4 border-b border-slate-100 last:border-b-0 items-center">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-900">{item.name}</span>
                              {item.name_urdu && <span className="text-xs text-[#3da860] font-semibold urdu mt-0.5">{item.name_urdu}</span>}
                            </div>
                            <span className="text-xs text-slate-600 font-semibold">{item.quantity} units</span>
                            <span className="text-xs font-extrabold text-slate-900 text-right">{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-t border-slate-100 pt-4 gap-4">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500 font-semibold">Payment Method:</span>
                        <span className="text-slate-900 font-extrabold bg-slate-100 px-2 py-0.5 rounded-md">{order.payment_method}</span>
                      </div>
                      
                      <div className="flex gap-2 w-full sm:w-auto">
                        {order.status.toLowerCase() === 'pending' && (
                          <>
                            <button 
                              className="btn btn-primary bg-[#3da860] hover:bg-[#2e8c4e] shadow-md shadow-[#3da860]/10 flex-1 sm:flex-initial"
                              onClick={() => handleAction(order.id, 'processing')}
                            >
                              Accept Order
                            </button>
                            <button 
                              className="btn btn-danger flex-1 sm:flex-initial"
                              onClick={() => handleAction(order.id, 'cancelled')}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {order.status.toLowerCase() === 'processing' && (
                          <>
                            <button 
                              className="btn btn-primary bg-blue-500 hover:bg-blue-600 border-none shadow-md shadow-blue-500/10 flex-1 sm:flex-initial"
                              onClick={() => handleAction(order.id, 'dispatched')}
                            >
                              Dispatch Order
                            </button>
                            <button 
                              className="btn btn-danger flex-1 sm:flex-initial"
                              onClick={() => handleAction(order.id, 'cancelled')}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {order.status.toLowerCase() === 'dispatched' && (
                          <button 
                            className="btn btn-primary bg-[#3da860] hover:bg-[#2e8c4e] shadow-md shadow-[#3da860]/10 w-full sm:w-auto"
                            onClick={() => handleAction(order.id, 'completed')}
                          >
                            Complete Delivery
                          </button>
                        )}
                        {(order.status.toLowerCase() === 'completed' || order.status.toLowerCase() === 'delivered' || order.status.toLowerCase() === 'cancelled') && (
                          <span className="text-xs text-slate-500 font-semibold border border-slate-200 bg-slate-100 px-3 py-1.5 rounded-xl w-full sm:w-auto text-center">
                            Order Processed / آرڈر مکمل ہو گیا
                          </span>
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
