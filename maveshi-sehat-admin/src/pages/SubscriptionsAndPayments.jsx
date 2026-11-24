import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  ExternalLink, 
  ShoppingBag, 
  RefreshCw,
  Search,
  Check,
  X
} from 'lucide-react';
import '../styles/App.css';

export default function SubscriptionsAndPayments() {
  const [activeTab, setActiveTab] = useState('subscriptions'); // 'subscriptions' or 'orders'
  const [subscriptions, setSubscriptions] = useState([]);
  const [orderProofs, setOrderProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProofImg, setSelectedProofImg] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/subscriptions`);
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data);
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
    }
  };

  const fetchOrderProofs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/orders/pending-proofs`);
      if (res.ok) {
        const data = await res.json();
        setOrderProofs(data);
      }
    } catch (err) {
      console.error('Error fetching order proofs:', err);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([fetchSubscriptions(), fetchOrderProofs()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleApproveSubscription = async (id) => {
    if (!window.confirm('Are you sure you want to approve this Rs. 300 subscription and grant 30 days unlimited AI scans?')) {
      return;
    }
    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/admin/subscriptions/${id}/approve`, {
        method: 'PUT'
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Subscription approved successfully!');
        fetchSubscriptions();
      } else {
        alert(data.error || 'Failed to approve subscription');
      }
    } catch (e) {
      alert('Error approving subscription: ' + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubscription = async (id) => {
    const reason = window.prompt('Enter reason for rejecting this payment proof:', 'TID could not be verified with 8558');
    if (!reason) return;
    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/admin/subscriptions/${id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Subscription rejected.');
        fetchSubscriptions();
      } else {
        alert(data.error || 'Failed to reject subscription');
      }
    } catch (e) {
      alert('Error rejecting subscription: ' + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyOrderPayment = async (orderId) => {
    if (!window.confirm(`Verify and approve payment for order #${orderId}?`)) return;
    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}/verify-payment`, {
        method: 'PUT'
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Order payment verified!');
        fetchOrderProofs();
      } else {
        alert(data.error || 'Failed to verify payment');
      }
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectOrderPayment = async (orderId) => {
    if (!window.confirm(`Reject payment and cancel order #${orderId}?`)) return;
    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}/reject-payment`, {
        method: 'PUT'
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Order payment rejected.');
        fetchOrderProofs();
      } else {
        alert(data.error || 'Failed to reject payment');
      }
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const pendingSubsCount = subscriptions.filter(s => s.status === 'pending').length;
  const pendingOrdersCount = orderProofs.filter(o => o.payment_status === 'pending_verification').length;

  const filteredSubs = subscriptions.filter(s => {
    const q = searchTerm.toLowerCase();
    return (
      (s.user_name && s.user_name.toLowerCase().includes(q)) ||
      (s.sender_phone && s.sender_phone.includes(q)) ||
      (s.transaction_id && s.transaction_id.toLowerCase().includes(q)) ||
      (s.status && s.status.toLowerCase().includes(q))
    );
  });

  const filteredOrders = orderProofs.filter(o => {
    const q = searchTerm.toLowerCase();
    return (
      (o.id && o.id.toLowerCase().includes(q)) ||
      (o.buyer_name && o.buyer_name.toLowerCase().includes(q)) ||
      (o.phone && o.phone.includes(q)) ||
      (o.transaction_id && o.transaction_id.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B', margin: '0 0 6px 0' }}>
            Subscriptions & Payment Approvals
          </h1>
          <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>
            Verify JazzCash payment screenshots sent to <strong>03054758667</strong> for Rs. 300 AI Subscriptions & Marketplace Orders.
          </p>
        </div>
        <button
          onClick={loadAll}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#F1F5F9',
            border: '1px solid #CBD5E1',
            borderRadius: '10px',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: '600',
            color: '#334155',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '2px solid #E2E8F0', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('subscriptions')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: '700',
            border: 'none',
            borderBottom: activeTab === 'subscriptions' ? '3px solid #059669' : '3px solid transparent',
            color: activeTab === 'subscriptions' ? '#059669' : '#64748B',
            backgroundColor: 'transparent',
            cursor: 'pointer'
          }}
        >
          <CreditCard size={18} />
          AI Subscriptions
          {pendingSubsCount > 0 && (
            <span style={{
              backgroundColor: '#EF4444',
              color: '#FFF',
              borderRadius: '12px',
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: '800'
            }}>
              {pendingSubsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: '700',
            border: 'none',
            borderBottom: activeTab === 'orders' ? '3px solid #059669' : '3px solid transparent',
            color: activeTab === 'orders' ? '#059669' : '#64748B',
            backgroundColor: 'transparent',
            cursor: 'pointer'
          }}
        >
          <ShoppingBag size={18} />
          Marketplace Order Payments
          {pendingOrdersCount > 0 && (
            <span style={{
              backgroundColor: '#EF4444',
              color: '#FFF',
              borderRadius: '12px',
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: '800'
            }}>
              {pendingOrdersCount}
            </span>
          )}
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '20px', position: 'relative', maxWidth: '380px' }}>
        <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
        <input
          type="text"
          placeholder="Search by name, phone, TID, or status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px 10px 36px',
            borderRadius: '10px',
            border: '1px solid #CBD5E1',
            fontSize: '13px',
            outline: 'none'
          }}
        />
      </div>

      {/* Content Area */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748B' }}>
          Loading payment requests...
        </div>
      ) : activeTab === 'subscriptions' ? (
        /* Subscriptions Table */
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          {filteredSubs.length === 0 ? (
            <div style={{ padding: '50px', textAlign: 'center', color: '#64748B' }}>
              No subscription payment proofs found.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: '700' }}>
                  <th style={{ padding: '14px 16px' }}>User / Farmer</th>
                  <th style={{ padding: '14px 16px' }}>Plan & Amount</th>
                  <th style={{ padding: '14px 16px' }}>Sender & TID</th>
                  <th style={{ padding: '14px 16px' }}>Receipt Proof</th>
                  <th style={{ padding: '14px 16px' }}>Submitted At</th>
                  <th style={{ padding: '14px 16px' }}>Status</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubs.map((sub) => (
                  <tr key={sub.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '700', color: '#1E293B' }}>{sub.user_name || 'Farmer'}</div>
                      <div style={{ color: '#64748B', fontSize: '12px' }}>{sub.user_phone || sub.sender_phone}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '700', color: '#059669' }}>
                        {sub.plan_type === 'lifetime' ? 'Lifetime Enterprise' : 'Monthly Pro'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748B' }}>Rs. {sub.amount}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '600', color: '#1E293B' }}>{sub.sender_phone}</div>
                      <div style={{ fontSize: '11px', color: '#0284C7', fontFamily: 'monospace' }}>
                        TID: {sub.transaction_id || 'N/A'}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {sub.proof_image_url ? (
                        <div
                          onClick={() => setSelectedProofImg(sub.proof_image_url)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            color: '#0284C7',
                            fontWeight: '600'
                          }}
                        >
                          <img
                            src={sub.proof_image_url}
                            alt="Receipt"
                            style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #CBD5E1' }}
                          />
                          <Eye size={14} /> View
                        </div>
                      ) : (
                        <span style={{ color: '#94A3B8' }}>No receipt</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748B', fontSize: '12px' }}>
                      {new Date(sub.created_at).toLocaleDateString()} {new Date(sub.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '800',
                        backgroundColor: sub.status === 'approved' ? '#D1FAE5' : (sub.status === 'rejected' ? '#FEE2E2' : '#FEF3C7'),
                        color: sub.status === 'approved' ? '#065F46' : (sub.status === 'rejected' ? '#991B1B' : '#92400E')
                      }}>
                        {sub.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      {sub.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleApproveSubscription(sub.id)}
                            disabled={actionLoading}
                            style={{
                              backgroundColor: '#059669',
                              color: '#FFF',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Check size={14} /> Approve
                          </button>
                          <button
                            onClick={() => handleRejectSubscription(sub.id)}
                            disabled={actionLoading}
                            style={{
                              backgroundColor: '#EF4444',
                              color: '#FFF',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <X size={14} /> Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: '#94A3B8', fontSize: '12px' }}>Resolved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        /* Orders Payment Proofs Table */
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          {filteredOrders.length === 0 ? (
            <div style={{ padding: '50px', textAlign: 'center', color: '#64748B' }}>
              No marketplace orders with JazzCash receipts found.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: '700' }}>
                  <th style={{ padding: '14px 16px' }}>Order ID</th>
                  <th style={{ padding: '14px 16px' }}>Buyer & Contact</th>
                  <th style={{ padding: '14px 16px' }}>Total Amount</th>
                  <th style={{ padding: '14px 16px' }}>Sender & TID</th>
                  <th style={{ padding: '14px 16px' }}>Receipt Proof</th>
                  <th style={{ padding: '14px 16px' }}>Payment Status</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 16px', fontWeight: '800', color: '#1E293B' }}>
                      #{order.id}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '700', color: '#1E293B' }}>{order.buyer_name}</div>
                      <div style={{ color: '#64748B', fontSize: '12px' }}>{order.phone || order.sender_phone}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: '800', color: '#059669' }}>
                      Rs. {Math.round(order.total_price)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '600', color: '#1E293B' }}>{order.sender_phone || order.phone}</div>
                      <div style={{ fontSize: '11px', color: '#0284C7', fontFamily: 'monospace' }}>
                        TID: {order.transaction_id || 'N/A'}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {order.payment_proof_url ? (
                        <div
                          onClick={() => setSelectedProofImg(order.payment_proof_url)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            color: '#0284C7',
                            fontWeight: '600'
                          }}
                        >
                          <img
                            src={order.payment_proof_url}
                            alt="Receipt"
                            style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #CBD5E1' }}
                          />
                          <Eye size={14} /> View
                        </div>
                      ) : (
                        <span style={{ color: '#94A3B8' }}>No receipt</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '800',
                        backgroundColor: order.payment_status === 'paid' ? '#D1FAE5' : (order.payment_status === 'rejected' ? '#FEE2E2' : '#FEF3C7'),
                        color: order.payment_status === 'paid' ? '#065F46' : (order.payment_status === 'rejected' ? '#991B1B' : '#92400E')
                      }}>
                        {order.payment_status ? order.payment_status.replace('_', ' ').toUpperCase() : 'PENDING'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      {order.payment_status === 'pending_verification' ? (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleVerifyOrderPayment(order.id)}
                            disabled={actionLoading}
                            style={{
                              backgroundColor: '#059669',
                              color: '#FFF',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Check size={14} /> Verify & Paid
                          </button>
                          <button
                            onClick={() => handleRejectOrderPayment(order.id)}
                            disabled={actionLoading}
                            style={{
                              backgroundColor: '#EF4444',
                              color: '#FFF',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <X size={14} /> Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: '#94A3B8', fontSize: '12px' }}>Verified</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Image Zoom Modal */}
      {selectedProofImg && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{ position: 'relative', maxWidth: '600px', width: '100%', backgroundColor: '#FFF', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ fontWeight: '800', color: '#1E293B', fontSize: '15px' }}>JazzCash Receipt Proof</div>
              <button
                onClick={() => setSelectedProofImg(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '16px', textAlign: 'center', maxHeight: '70vh', overflowY: 'auto' }}>
              <img
                src={selectedProofImg}
                alt="Full Receipt"
                style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: '8px', objectFit: 'contain' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
