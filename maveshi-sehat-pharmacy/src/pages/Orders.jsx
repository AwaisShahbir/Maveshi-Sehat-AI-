import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Clock, ShoppingBag, Truck, CheckCircle, AlertTriangle, Check, X, Eye } from 'lucide-react';
import '../styles/Orders.css';

export default function Orders({ pharmacy, onOrderAction, formatPrice, getStatusBadge, initialStatus = 'All' }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus || 'All'); 
  const [expandedOrders, setExpandedOrders] = useState({});
  const [orderDetails, setOrderDetails] = useState({});
  const [selectedProofImg, setSelectedProofImg] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (initialStatus) {
      setSelectedStatus(initialStatus);
    }
  }, [initialStatus]);

  const statusFilters = ['All', 'Pending', 'Processing', 'Dispatched', 'Completed', 'Cancelled'];

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/pharmacy/orders?pharmacyId=${pharmacy.id}`);
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
        const res = await fetch(`${API_BASE_URL}/api/pharmacy/orders/${orderId}/items`);
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

  const handleVerifyPayment = async (orderId) => {
    if (!window.confirm(`Verify that the customer payment for order #${orderId} was received in your pharmacy JazzCash/EasyPaisa account?`)) return;
    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/pharmacy/orders/${orderId}/verify-payment`, {
        method: 'PUT'
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Payment verified and marked as Paid!');
        fetchOrders();
      } else {
        alert(data.error || 'Failed to verify payment');
      }
    } catch (err) {
      alert('Error verifying payment: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectPayment = async (orderId) => {
    if (!window.confirm(`Reject customer payment for order #${orderId}? This will cancel the order.`)) return;
    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/pharmacy/orders/${orderId}/reject-payment`, {
        method: 'PUT'
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Payment rejected.');
        fetchOrders();
      } else {
        alert(data.error || 'Failed to reject payment');
      }
    } catch (err) {
      alert('Error rejecting payment: ' + err.message);
    } finally {
      setActionLoading(false);
    }
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
          <p className="text-sm font-medium text-slate-500">Loading orders...</p>
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
                      Order Items Details
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
                            </div>
                            <span className="text-xs text-slate-600 font-semibold">{item.quantity} units</span>
                            <span className="text-xs font-extrabold text-slate-900 text-right">{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Delivery & Payment Details Card */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200/70 mb-4 shadow-sm">
                      <div className="flex flex-col gap-1 text-xs">
                        <span className="text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">Delivery Information</span>
                        <div className="text-slate-800 font-semibold mt-1">
                          <span className="text-slate-500 font-normal">Recipient: </span>
                          <span className="font-bold text-slate-900">{order.buyer_name}</span>
                          {order.phone && <span className="text-slate-500 font-normal ml-2">({order.phone})</span>}
                        </div>
                        <div className="text-slate-700 font-medium">
                          <span className="text-slate-500 font-normal">Address: </span>
                          {order.delivery_address || 'Not specified'}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 text-xs md:text-right">
                        <span className="text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">Payment Summary</span>
                        <div className="flex items-center md:justify-end gap-2 mt-1">
                          <span className="text-slate-900 font-extrabold bg-slate-100 px-2.5 py-1 rounded-md">{order.payment_method}</span>
                          <span className={`px-2.5 py-1 rounded-md font-extrabold text-[10px] uppercase ${
                            (order.payment_status || '').toLowerCase() === 'paid' 
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                              : 'bg-amber-100 text-amber-700 border border-amber-200'
                          }`}>
                            {order.payment_status || (order.payment_method === 'COD' ? 'Unpaid' : 'Paid')}
                          </span>
                        </div>
                        {order.transaction_id && (
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            Txn ID: <span className="font-bold text-blue-600 font-mono">{order.transaction_id}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-t border-slate-100 pt-4 gap-4">
                      <div className="flex flex-wrap items-center gap-2.5 text-xs">
                        <span className="text-slate-500">Gross: <strong className="text-slate-900">{formatPrice(order.total_price)}</strong></span>
                        <span className="text-slate-300">|</span>
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                          Your 90%: {formatPrice(order.pharmacy_earnings || (order.total_price * 0.90))}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="text-amber-700 font-bold bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                          Platform 10%: {formatPrice(order.admin_commission || (order.total_price * 0.10))}
                        </span>

                        {order.payment_proof_url && (
                          <button 
                            type="button"
                            onClick={() => setSelectedProofImg(order.payment_proof_url)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md border border-blue-200 transition-colors ml-1 cursor-pointer"
                          >
                            <Eye size={12} /> View Customer Receipt
                          </button>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        {order.payment_status === 'pending_verification' && (
                          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 p-1.5 px-2.5 rounded-xl">
                            <span className="text-[11px] font-bold text-amber-800 whitespace-nowrap">Payment:</span>
                            <button 
                              type="button"
                              disabled={actionLoading}
                              className="px-2 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center gap-1 cursor-pointer"
                              onClick={() => handleVerifyPayment(order.id)}
                            >
                              <Check size={12} /> Verify Paid
                            </button>
                            <button 
                              type="button"
                              disabled={actionLoading}
                              className="px-2 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm flex items-center gap-1 cursor-pointer"
                              onClick={() => handleRejectPayment(order.id)}
                            >
                              <X size={12} /> Reject
                            </button>
                          </div>
                        )}
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
                            Order Processed
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

      {/* Customer Receipt Zoom Modal */}
      {selectedProofImg && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-lg w-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 bg-slate-50/80">
              <h3 className="font-extrabold text-slate-800 text-sm">Customer Payment Receipt</h3>
              <button
                type="button"
                onClick={() => setSelectedProofImg(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 text-center max-h-[70vh] overflow-y-auto bg-slate-900/5">
              <img
                src={selectedProofImg}
                alt="Payment Receipt"
                className="max-w-full max-h-[60vh] mx-auto rounded-xl object-contain shadow-sm border border-slate-200"
              />
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedProofImg(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
