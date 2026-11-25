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
  X,
  Store,
  AlertTriangle,
  Lock,
  Unlock,
  DollarSign,
  Stethoscope
} from 'lucide-react';
import '../styles/App.css';

export default function SubscriptionsAndPayments() {
  const [activeTab, setActiveTab] = useState('subscriptions'); // 'subscriptions', 'orders', 'commissions', or 'vet-commissions'
  const [subscriptions, setSubscriptions] = useState([]);
  const [orderProofs, setOrderProofs] = useState([]);
  const [pharmacyCommissions, setPharmacyCommissions] = useState([]);
  const [pharmacySettlements, setPharmacySettlements] = useState([]);
  const [vetCommissions, setVetCommissions] = useState([]);
  const [vetSettlements, setVetSettlements] = useState([]);
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

  const fetchPharmacyCommissions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/pharmacies-commissions`);
      if (res.ok) {
        const data = await res.json();
        setPharmacyCommissions(data);
      }
    } catch (err) {
      console.error('Error fetching pharmacy commissions:', err);
    }
  };

  const fetchPharmacySettlements = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/pharmacy-settlements`);
      if (res.ok) {
        const data = await res.json();
        setPharmacySettlements(data);
      }
    } catch (err) {
      console.error('Error fetching pharmacy settlements:', err);
    }
  };

  const fetchVetCommissions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/vet-commissions`);
      if (res.ok) {
        const data = await res.json();
        setVetCommissions(data);
      }
    } catch (err) {
      console.error('Error fetching vet commissions:', err);
    }
  };

  const fetchVetSettlements = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/vet-settlements`);
      if (res.ok) {
        const data = await res.json();
        setVetSettlements(data);
      }
    } catch (err) {
      console.error('Error fetching vet settlements:', err);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchSubscriptions(),
      fetchOrderProofs(),
      fetchPharmacyCommissions(),
      fetchPharmacySettlements(),
      fetchVetCommissions(),
      fetchVetSettlements()
    ]);
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

  const handleApproveSettlement = async (id, pharmacyName, amount, isLocked) => {
    const confirmMsg = isLocked
      ? `Approve commission settlement of Rs. ${amount} from '${pharmacyName}'? This will deduct the amount from their debt and restore their store & stock.`
      : `Approve commission deposit of Rs. ${amount} from '${pharmacyName}'? This will credit their account and reduce their outstanding balance.`;
    if (!window.confirm(confirmMsg)) {
      return;
    }
    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/admin/pharmacy-settlements/${id}/approve`, {
        method: 'PUT'
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Settlement approved!');
        fetchPharmacySettlements();
        fetchPharmacyCommissions();
      } else {
        alert(data.error || 'Failed to approve settlement');
      }
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSettlement = async (id) => {
    const reason = window.prompt('Enter reason for rejecting this settlement proof:', 'TID not verified in JazzCash account');
    if (!reason) return;
    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/admin/pharmacy-settlements/${id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Settlement rejected.');
        fetchPharmacySettlements();
      } else {
        alert(data.error || 'Failed to reject settlement');
      }
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePharmacyLock = async (pharmacyId, currentLock, pharmacyName) => {
    const nextLock = !currentLock;
    const confirmMsg = nextLock
      ? `Manually lock '${pharmacyName}' store? Farmers will not be able to place orders from this pharmacy.`
      : `Unlock '${pharmacyName}' store? This will restore their store in the marketplace.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/admin/pharmacies/${pharmacyId}/toggle-lock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLocked: nextLock, reason: nextLock ? 'Manually locked by administrator' : null })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Pharmacy lock status updated.');
        fetchPharmacyCommissions();
      } else {
        alert(data.error || 'Failed to toggle lock');
      }
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveVetSettlement = async (id, amount) => {
    if (!window.confirm(`Are you sure you want to approve this Rs. ${amount} vet commission settlement and deduct it from their debt?`)) {
      return;
    }
    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/admin/vet-settlements/${id}/approve`, {
        method: 'PUT'
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Vet settlement approved successfully!');
        fetchVetSettlements();
        fetchVetCommissions();
      } else {
        alert(data.error || 'Failed to approve vet settlement');
      }
    } catch (e) {
      alert('Error approving settlement: ' + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectVetSettlement = async (id) => {
    const reason = window.prompt('Please enter the reason for rejecting this vet settlement:');
    if (reason === null) return;
    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/admin/vet-settlements/${id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Vet settlement rejected.');
        fetchVetSettlements();
      } else {
        alert(data.error || 'Failed to reject settlement');
      }
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const pendingSubsCount = subscriptions.filter(s => s.status === 'pending').length;
  const pendingOrdersCount = orderProofs.filter(o => o.payment_status === 'pending_verification').length;
  const pendingSettlementsCount = pharmacySettlements.filter(s => s.status === 'pending').length;
  const pendingVetSettlementsCount = vetSettlements.filter(s => s.status === 'pending').length;

  const filteredVetCommissions = vetCommissions.filter(v => {
    const q = searchTerm.toLowerCase();
    return (
      (v.full_name && v.full_name.toLowerCase().includes(q)) ||
      (v.specialization && v.specialization.toLowerCase().includes(q)) ||
      (v.phone_number && v.phone_number.includes(q)) ||
      (v.district && v.district.toLowerCase().includes(q))
    );
  });

  const filteredVetSettlements = vetSettlements.filter(s => {
    const q = searchTerm.toLowerCase();
    return (
      (s.vet_name && s.vet_name.toLowerCase().includes(q)) ||
      (s.sender_phone && s.sender_phone.includes(q)) ||
      (s.transaction_id && s.transaction_id.toLowerCase().includes(q)) ||
      (s.status && s.status.toLowerCase().includes(q))
    );
  });

  const filteredCommissions = pharmacyCommissions.filter(p => {
    const q = searchTerm.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.owner_name && p.owner_name.toLowerCase().includes(q)) ||
      (p.phone && p.phone.includes(q))
    );
  });

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
            Verify JazzCash payment screenshots sent to <strong>03054758667</strong> for Rs. 300 AI Subscriptions & Pharmacy Commission Settlements.
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
          Marketplace Orders (Pharmacy Handled)
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

        <button
          onClick={() => setActiveTab('commissions')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: '700',
            border: 'none',
            borderBottom: activeTab === 'commissions' ? '3px solid #059669' : '3px solid transparent',
            color: activeTab === 'commissions' ? '#059669' : '#64748B',
            backgroundColor: 'transparent',
            cursor: 'pointer'
          }}
        >
          <Store size={18} />
          Pharmacy Commissions & Settlements
          {pendingSettlementsCount > 0 && (
            <span style={{
              backgroundColor: '#EF4444',
              color: '#FFF',
              borderRadius: '12px',
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: '800'
            }}>
              {pendingSettlementsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('vet-commissions')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: '700',
            border: 'none',
            borderBottom: activeTab === 'vet-commissions' ? '3px solid #059669' : '3px solid transparent',
            color: activeTab === 'vet-commissions' ? '#059669' : '#64748B',
            backgroundColor: 'transparent',
            cursor: 'pointer'
          }}
        >
          <Stethoscope size={18} />
          Veterinarian Commissions (Rs. 300 / Case)
          {pendingVetSettlementsCount > 0 && (
            <span style={{
              backgroundColor: '#EF4444',
              color: '#FFF',
              borderRadius: '12px',
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: '800'
            }}>
              {pendingVetSettlementsCount}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Pharmacy Authority Separation Banner */}
          <div style={{
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px'
          }}>
            <Store size={22} style={{ color: '#16A34A', marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: '800', color: '#166534', fontSize: '14px', marginBottom: '4px' }}>
                Direct Pharmacy Authority Separation
              </div>
              <div style={{ color: '#15803D', fontSize: '13px', lineHeight: '1.5' }}>
                In Maveshi Sehat Marketplace, farmers submit medicine payments directly to each individual <strong>Pharmacy's JazzCash / EasyPaisa</strong> account. Therefore, <strong>the pharmacy itself verifies customer transaction receipts and approves or rejects order payments</strong> in their Pharmacy Web Portal. Platform Admin monitors order flow and tracks the accrued 10% platform commission under the <strong>Pharmacy Commissions & Settlements</strong> tab.
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            {filteredOrders.length === 0 ? (
              <div style={{ padding: '50px', textAlign: 'center', color: '#64748B' }}>
                No marketplace orders recorded yet.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: '700' }}>
                    <th style={{ padding: '14px 16px' }}>Order ID</th>
                    <th style={{ padding: '14px 16px' }}>Buyer & Contact</th>
                    <th style={{ padding: '14px 16px' }}>Gross Total</th>
                    <th style={{ padding: '14px 16px' }}>10% Platform Cut</th>
                    <th style={{ padding: '14px 16px' }}>Sender & TID</th>
                    <th style={{ padding: '14px 16px' }}>Customer Receipt</th>
                    <th style={{ padding: '14px 16px' }}>Payment Status</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center' }}>Pharmacy Verification</th>
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
                      <td style={{ padding: '14px 16px', fontWeight: '800', color: '#D97706' }}>
                        Rs. {Math.round(order.admin_commission || (order.total_price * 0.10))}
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
                        {order.payment_status === 'paid' ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#059669', fontWeight: '700', fontSize: '12px' }}>
                            <CheckCircle2 size={15} /> Approved by Pharmacy
                          </span>
                        ) : order.payment_status === 'rejected' ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#DC2626', fontWeight: '700', fontSize: '12px' }}>
                            <XCircle size={15} /> Rejected by Pharmacy
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            color: '#92400E',
                            fontWeight: '700',
                            fontSize: '11px',
                            backgroundColor: '#FEF3C7',
                            padding: '4px 10px',
                            borderRadius: '8px'
                          }}>
                            <Clock size={13} /> Awaiting Pharmacy Action
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Pharmacy Commissions & Settlements */}
      {activeTab === 'commissions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Financials KPI Header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div style={{ backgroundColor: '#FFF', padding: '18px', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748B' }}>TOTAL MARKETPLACE SALES</span>
              <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A', margin: '8px 0 0 0' }}>
                Rs. {pharmacyCommissions.reduce((acc, p) => acc + (parseFloat(p.total_gross_sales) || 0), 0).toLocaleString()}
              </h2>
            </div>

            <div style={{ backgroundColor: '#F0FDF4', padding: '18px', borderRadius: '14px', border: '1px solid #BBF7D0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#166534' }}>10% PLATFORM COMMISSION EARNED</span>
              <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#15803D', margin: '8px 0 0 0' }}>
                Rs. {pharmacyCommissions.reduce((acc, p) => acc + (parseFloat(p.total_admin_commission_earned) || 0), 0).toLocaleString()}
              </h2>
            </div>

            <div style={{ backgroundColor: '#FEF2F2', padding: '18px', borderRadius: '14px', border: '1px solid #FECACA', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#991B1B' }}>OUTSTANDING COMMISSION DUE</span>
              <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#DC2626', margin: '8px 0 0 0' }}>
                Rs. {pharmacyCommissions.reduce((acc, p) => acc + (parseFloat(p.commission_due) || 0), 0).toLocaleString()}
              </h2>
            </div>

            <div style={{ backgroundColor: '#FFFBEB', padding: '18px', borderRadius: '14px', border: '1px solid #FDE68A', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#92400E' }}>STOCK BLOCKED (&gt;= Rs. 2,000)</span>
              <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#D97706', margin: '8px 0 0 0' }}>
                {pharmacyCommissions.filter(p => p.is_locked || (parseFloat(p.commission_due) >= 2000)).length}
              </h2>
            </div>
          </div>

          {/* Section 1: Pending Settlement Proofs */}
          <div style={{ backgroundColor: '#FFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1E293B', margin: 0 }}>
                  Pharmacy Commission Settlement Proofs
                </h3>
                <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
                  Pharmacies transferring their 10% commission to Admin JazzCash (<strong>03054758667</strong>) to restore or maintain active store status.
                </p>
              </div>
            </div>

            {pharmacySettlements.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#94A3B8', fontSize: '14px' }}>
                No commission settlement proofs submitted yet.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                      <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '700' }}>Date</th>
                      <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '700' }}>Pharmacy</th>
                      <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '700' }}>Amount Settled</th>
                      <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '700' }}>Sender Phone</th>
                      <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '700' }}>TID</th>
                      <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '700' }}>Receipt Proof</th>
                      <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '700' }}>Status</th>
                      <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '700', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pharmacySettlements.map((s) => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '14px 16px', color: '#64748B' }}>
                          {new Date(s.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontWeight: '800', color: '#0F172A', display: 'block' }}>{s.pharmacy_name}</span>
                          <span style={{
                            display: 'inline-block',
                            marginTop: '3px',
                            fontSize: '10px',
                            fontWeight: '800',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: (s.pharmacy_locked || (parseFloat(s.current_pharmacy_due) >= 2000)) ? '#FEE2E2' : '#DCFCE7',
                            color: (s.pharmacy_locked || (parseFloat(s.current_pharmacy_due) >= 2000)) ? '#DC2626' : '#16A34A'
                          }}>
                            {(s.pharmacy_locked || (parseFloat(s.current_pharmacy_due) >= 2000)) ? 'Stock Blocked (Debt ≥ Rs. 2,000)' : 'Active (Under Rs. 2,000 Limit)'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontWeight: '900', color: '#059669', fontSize: '14px' }}>
                            Rs. {parseFloat(s.amount).toFixed(2)}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', fontFamily: 'monospace' }}>
                          {s.sender_phone}
                        </td>
                        <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontWeight: '700', color: '#2563EB' }}>
                          {s.transaction_id}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {s.proof_image_url ? (
                            <button
                              onClick={() => setSelectedProofImg(s.proof_image_url)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                backgroundColor: '#EFF6FF',
                                color: '#2563EB',
                                border: '1px solid #BFDBFE',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              <Eye size={14} /> View Receipt
                            </button>
                          ) : (
                            <span style={{ color: '#94A3B8' }}>No image</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: '800',
                            backgroundColor: s.status === 'approved' ? '#DCFCE7' : (s.status === 'rejected' ? '#FEE2E2' : '#FEF3C7'),
                            color: s.status === 'approved' ? '#16A34A' : (s.status === 'rejected' ? '#DC2626' : '#D97706')
                          }}>
                            {s.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          {s.status === 'pending' ? (
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button
                                onClick={() => handleApproveSettlement(s.id, s.pharmacy_name, s.amount, Boolean(s.pharmacy_locked || (parseFloat(s.current_pharmacy_due) >= 2000)))}
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
                                <Check size={14} /> {(Boolean(s.pharmacy_locked || (parseFloat(s.current_pharmacy_due) >= 2000))) ? 'Approve & Unlock' : 'Approve Settlement'}
                              </button>
                              <button
                                onClick={() => handleRejectSettlement(s.id)}
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
                            <span style={{ color: '#94A3B8', fontSize: '12px' }}>Processed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 2: All Pharmacies Commission Ledger */}
          <div style={{ backgroundColor: '#FFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1E293B', margin: 0 }}>
                  Pharmacies Commission Ledger & Store Status
                </h3>
                <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
                  Platform automatically pauses pharmacy stores and blocks stock when unpaid commission reaches or exceeds the <strong>Rs. 2,000 threshold</strong>. Pharmacies must transfer a minimum of Rs. 1,000 to restore active status.
                </p>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                    <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '700' }}>Pharmacy & Owner</th>
                    <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '700' }}>Direct Payment Account</th>
                    <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '700' }}>Gross Sales</th>
                    <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '700' }}>Platform 10%</th>
                    <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '700' }}>Commission Due</th>
                    <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '700' }}>Credit Status</th>
                    <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '700' }}>Store Status</th>
                    <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '700', textAlign: 'center' }}>Admin Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCommissions.map((p) => {
                    const due = parseFloat(p.commission_due) || 0.00;
                    const isOverdue = due >= 2000.00;
                    const isLocked = p.is_locked || isOverdue;

                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: isLocked ? '#FEF2F2' : 'transparent' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: '800', color: '#0F172A' }}>{p.name}</div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>Owner: {p.owner_name || 'N/A'} • {p.phone}</div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: '700', color: '#1E293B' }}>{p.payment_wallet_type || 'JazzCash'}: {p.payment_account_number || p.phone}</div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>Title: {p.payment_account_title || p.name}</div>
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: '700', color: '#0F172A' }}>
                          Rs. {(parseFloat(p.total_gross_sales) || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: '700', color: '#059669' }}>
                          Rs. {(parseFloat(p.total_admin_commission_earned) || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontWeight: '900', fontSize: '14px', color: isOverdue ? '#DC2626' : '#1E293B' }}>
                            Rs. {due.toFixed(2)}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: '800',
                            backgroundColor: isOverdue ? '#FEE2E2' : '#DCFCE7',
                            color: isOverdue ? '#DC2626' : '#16A34A'
                          }}>
                            {isOverdue ? '🚨 STOCK BLOCKED (Rs. 2000+)' : 'Good Standing'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: '800',
                            backgroundColor: isLocked ? '#FEF2F2' : '#F0FDF4',
                            color: isLocked ? '#B91C1C' : '#15803D',
                            border: `1px solid ${isLocked ? '#FCA5A5' : '#BBF7D0'}`
                          }}>
                            {isLocked ? 'STORE PAUSED' : 'ACTIVE'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleTogglePharmacyLock(p.id, isLocked, p.name)}
                            disabled={actionLoading}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              backgroundColor: isLocked ? '#059669' : '#F1F5F9',
                              color: isLocked ? '#FFF' : '#DC2626',
                              border: `1px solid ${isLocked ? '#059669' : '#CBD5E1'}`,
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            {isLocked ? <Unlock size={14} /> : <Lock size={14} />}
                            {isLocked ? 'Unlock Store' : 'Lock Store'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Veterinarian Commissions & Settlements */}
      {activeTab === 'vet-commissions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Financials KPI Header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
            <div style={{ backgroundColor: '#FFF', padding: '18px', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748B' }}>TOTAL VET CASES</span>
              <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A', margin: '8px 0 0 0' }}>
                {vetCommissions.reduce((acc, v) => acc + (parseInt(v.total_consultations) || 0), 0)} Cases
              </h2>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: '18px', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>GROSS FEES (Rs. 300 / Case)</span>
              <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A', margin: '8px 0 0 0' }}>
                Rs. {vetCommissions.reduce((acc, v) => acc + (parseFloat(v.total_gross_fees) || 0), 0).toLocaleString()}
              </h2>
            </div>

            <div style={{ backgroundColor: '#F0FDF4', padding: '18px', borderRadius: '14px', border: '1px solid #BBF7D0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#166534' }}>10% ADMIN COMMISSION EARNED</span>
              <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#15803D', margin: '8px 0 0 0' }}>
                Rs. {vetCommissions.reduce((acc, v) => acc + (parseFloat(v.total_admin_commission_earned) || 0), 0).toLocaleString()}
              </h2>
            </div>

            <div style={{ backgroundColor: '#EFF6FF', padding: '18px', borderRadius: '14px', border: '1px solid #BFDBFE', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#1E40AF' }}>90% VET NET EARNINGS</span>
              <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#2563EB', margin: '8px 0 0 0' }}>
                Rs. {vetCommissions.reduce((acc, v) => acc + (parseFloat(v.total_vet_earnings) || 0), 0).toLocaleString()}
              </h2>
            </div>

            <div style={{ backgroundColor: '#FEF2F2', padding: '18px', borderRadius: '14px', border: '1px solid #FECACA', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#991B1B' }}>VET COMMISSION DUE (DEBT)</span>
              <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#DC2626', margin: '8px 0 0 0' }}>
                Rs. {vetCommissions.reduce((acc, v) => acc + (parseFloat(v.commission_due) || 0), 0).toLocaleString()}
              </h2>
            </div>
          </div>

          {/* Section 1: Pending Vet Settlement Proofs */}
          <div style={{ backgroundColor: '#FFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1E293B', margin: 0 }}>
                  Veterinarian Commission Settlement Proofs
                </h3>
                <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
                  Veterinarians transferring their 10% platform commission to Admin JazzCash (<strong>03054758667</strong>) to clear consultation debt.
                </p>
              </div>
            </div>

            {filteredVetSettlements.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#94A3B8', fontSize: '14px' }}>
                No vet commission settlement proofs submitted yet.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                      <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '700' }}>Date</th>
                      <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '700' }}>Veterinarian</th>
                      <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '700' }}>Amount Settled</th>
                      <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '700' }}>Sender Phone</th>
                      <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '700' }}>TID</th>
                      <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '700' }}>Receipt Proof</th>
                      <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '700' }}>Status</th>
                      <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '700', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVetSettlements.map((s) => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '14px 16px', color: '#64748B' }}>
                          {new Date(s.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontWeight: '800', color: '#0F172A', display: 'block' }}>Dr. {s.vet_name}</span>
                          <span style={{ fontSize: '11px', color: '#64748B' }}>{s.vet_phone || 'No phone'}</span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontWeight: '900', color: '#059669', fontSize: '14px' }}>
                            Rs. {parseFloat(s.amount).toFixed(2)}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', fontFamily: 'monospace' }}>
                          {s.sender_phone}
                        </td>
                        <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontWeight: '700', color: '#2563EB' }}>
                          {s.transaction_id}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {s.proof_image_url ? (
                            <button
                              onClick={() => setSelectedProofImg(s.proof_image_url)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                backgroundColor: '#EFF6FF',
                                color: '#2563EB',
                                border: '1px solid #BFDBFE',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              <Eye size={14} /> View Receipt
                            </button>
                          ) : (
                            <span style={{ color: '#94A3B8' }}>No image</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: '800',
                            backgroundColor: s.status === 'approved' ? '#DCFCE7' : (s.status === 'rejected' ? '#FEE2E2' : '#FEF3C7'),
                            color: s.status === 'approved' ? '#16A34A' : (s.status === 'rejected' ? '#DC2626' : '#D97706')
                          }}>
                            {s.status ? s.status.toUpperCase() : 'PENDING'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          {s.status === 'pending' ? (
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button
                                onClick={() => handleApproveVetSettlement(s.id, s.amount)}
                                disabled={actionLoading}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '6px 12px',
                                  backgroundColor: '#059669',
                                  color: '#FFF',
                                  border: 'none',
                                  borderRadius: '8px',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  cursor: 'pointer'
                                }}
                              >
                                <Check size={14} /> Approve & Clear Debt
                              </button>
                              <button
                                onClick={() => handleRejectVetSettlement(s.id)}
                                disabled={actionLoading}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '6px 12px',
                                  backgroundColor: '#EF4444',
                                  color: '#FFF',
                                  border: 'none',
                                  borderRadius: '8px',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  cursor: 'pointer'
                                }}
                              >
                                <X size={14} /> Reject
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: '#94A3B8', fontSize: '12px' }}>Processed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 2: Registered Veterinarians Commission Ledger */}
          <div style={{ backgroundColor: '#FFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1E293B', margin: 0 }}>
                  Veterinarians Commission Ledger & Case Overview
                </h3>
                <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
                  Every consultation is charged at <strong>Rs. 300</strong> with a standard <strong>10% platform commission (Rs. 30 / case)</strong>.
                </p>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                    <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '700' }}>Veterinarian</th>
                    <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '700' }}>Contact / District</th>
                    <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '700' }}>Consultations</th>
                    <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '700' }}>Gross Fees (@ Rs. 300)</th>
                    <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '700' }}>10% Platform Comm.</th>
                    <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '700' }}>90% Vet Share</th>
                    <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '700' }}>Comm. Due (Debt)</th>
                    <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '700' }}>Comm. Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVetCommissions.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: '#94A3B8' }}>
                        No veterinarians found matching search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredVetCommissions.map((v) => {
                      const due = parseFloat(v.commission_due) || 0;
                      return (
                        <tr key={v.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ fontWeight: '800', color: '#0F172A', display: 'block' }}>Dr. {v.full_name}</span>
                            <span style={{ fontSize: '11px', color: '#64748B' }}>{v.specialization || 'General Vet'}</span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ display: 'block', fontWeight: '600', color: '#334155' }}>{v.phone_number || 'N/A'}</span>
                            <span style={{ fontSize: '11px', color: '#94A3B8' }}>{v.district || 'Pakistan'}</span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ fontWeight: '700', color: '#0F172A' }}>{v.total_consultations || 0} cases</span>
                            <span style={{ display: 'block', fontSize: '11px', color: '#059669' }}>
                              {v.paid_consultations || 0} paid
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', fontWeight: '700', color: '#334155' }}>
                            Rs. {(parseFloat(v.total_gross_fees) || 0).toLocaleString()}
                          </td>
                          <td style={{ padding: '14px 16px', fontWeight: '800', color: '#15803D' }}>
                            Rs. {(parseFloat(v.total_admin_commission_earned) || 0).toLocaleString()}
                          </td>
                          <td style={{ padding: '14px 16px', fontWeight: '800', color: '#2563EB' }}>
                            Rs. {(parseFloat(v.total_vet_earnings) || 0).toLocaleString()}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{
                              fontWeight: '900',
                              color: due > 0 ? '#DC2626' : '#16A34A',
                              backgroundColor: due > 0 ? '#FEE2E2' : '#DCFCE7',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              display: 'inline-block'
                            }}>
                              Rs. {due.toFixed(2)}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', fontWeight: '700', color: '#64748B' }}>
                            Rs. {(parseFloat(v.commission_paid) || 0).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
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
