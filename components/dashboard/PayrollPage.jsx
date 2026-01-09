'use client';

import { useState } from 'react';
import { MdCheck, MdClose, MdCheckCircle, MdPendingActions } from 'react-icons/md';
import { theme } from '@/lib/theme';
import toast from 'react-hot-toast';

export default function PayrollPage() {
  const [activeTab, setActiveTab] = useState('weekly');
  const [payments, setPayments] = useState({
    weekly: [
      {
        id: 1,
        employeeName: 'Mohammed Ali',
        paymentType: 'Weekly',
        calculatedAmount: 1200,
        advanceDeduction: 300,
        finalPayable: 900,
        status: 'Pending',
      },
      {
        id: 2,
        employeeName: 'Ahmed Hassan',
        paymentType: 'Weekly',
        calculatedAmount: 1500,
        advanceDeduction: 0,
        finalPayable: 1500,
        status: 'Approved',
      },
      {
        id: 3,
        employeeName: 'Ali Khan',
        paymentType: 'Weekly',
        calculatedAmount: 1100,
        advanceDeduction: 200,
        finalPayable: 900,
        status: 'Paid',
      },
    ],
    monthly: [
      {
        id: 4,
        employeeName: 'Fatima Al-Mansouri',
        paymentType: 'Monthly',
        calculatedAmount: 5500,
        advanceDeduction: 500,
        finalPayable: 5000,
        status: 'Pending',
      },
      {
        id: 5,
        employeeName: 'Sara Ahmed',
        paymentType: 'Monthly',
        calculatedAmount: 4800,
        advanceDeduction: 0,
        finalPayable: 4800,
        status: 'Approved',
      },
    ],
    perDelivery: [
      {
        id: 6,
        employeeName: 'Ahmed Hassan',
        paymentType: 'Per Delivery',
        calculatedAmount: 2500,
        advanceDeduction: 500,
        finalPayable: 2000,
        status: 'Pending',
      },
      {
        id: 7,
        employeeName: 'Omar Khalid',
        paymentType: 'Per Delivery',
        calculatedAmount: 1800,
        advanceDeduction: 0,
        finalPayable: 1800,
        status: 'Paid',
      },
    ],
  });

  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showPaidModal, setShowPaidModal] = useState(false);

  const tabConfig = {
    weekly: { label: 'Weekly Payments', key: 'weekly' },
    monthly: { label: 'Monthly Payments', key: 'monthly' },
    perDelivery: { label: 'Per Delivery Payments', key: 'perDelivery' },
  };

  const currentPayments = payments[activeTab];

  const handleApprovePayment = (payment) => {
    setSelectedPayment(payment);
    setShowApproveModal(true);
  };

  const confirmApprovePayment = () => {
    setPayments(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].map(p =>
        p.id === selectedPayment.id ? { ...p, status: 'Approved' } : p
      ),
    }));
    setShowApproveModal(false);
    toast.success('Payment approved successfully!');
  };

  const handleMarkAsPaid = (payment) => {
    setSelectedPayment(payment);
    setShowPaidModal(true);
  };

  const confirmMarkAsPaid = () => {
    setPayments(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].map(p =>
        p.id === selectedPayment.id ? { ...p, status: 'Paid' } : p
      ),
    }));
    setShowPaidModal(false);
    toast.success('Payment marked as paid!');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return { bg: 'rgba(234, 179, 8, 0.1)', color: '#EAB308', icon: MdPendingActions };
      case 'Approved':
        return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', icon: MdCheckCircle };
      case 'Paid':
        return { bg: 'rgba(34, 197, 94, 0.1)', color: '#22C55E', icon: MdCheckCircle };
      default:
        return { bg: 'rgba(107, 114, 128, 0.1)', color: '#6B7280', icon: MdPendingActions };
    }
  };

  const getTotalStats = () => {
    const stats = {
      total: currentPayments.reduce((sum, p) => sum + p.finalPayable, 0),
      approved: currentPayments.filter(p => p.status === 'Approved' || p.status === 'Paid').reduce((sum, p) => sum + p.finalPayable, 0),
      pending: currentPayments.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.finalPayable, 0),
    };
    return stats;
  };

  const stats = getTotalStats();

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <div className="flex space-x-8 whitespace-nowrap">
          {Object.entries(tabConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`pb-4 font-semibold text-lg transition-all ${
                activeTab === key
                  ? 'text-gray-800 border-b-2'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              style={{
                borderBottomColor: activeTab === key ? theme.colors.primary : 'transparent',
              }}
            >
              {config.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 w-full">
        <div className="bg-white rounded-xl shadow-md p-3 sm:p-4" style={{ backgroundColor: theme.colors.background }}>
          <p className="text-gray-600 text-xs font-medium mb-1">Total Payable</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-800">AED {stats.total.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-3 sm:p-4" style={{ backgroundColor: theme.colors.background }}>
          <p className="text-gray-600 text-xs font-medium mb-1">Pending Approval</p>
          <p className="text-lg sm:text-2xl font-bold" style={{ color: '#EAB308' }}>AED {stats.pending.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-3 sm:p-4" style={{ backgroundColor: theme.colors.background }}>
          <p className="text-gray-600 text-xs font-medium mb-1">Approved/Paid</p>
          <p className="text-lg sm:text-2xl font-bold text-green-500">AED {stats.approved.toLocaleString()}</p>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden" style={{ backgroundColor: theme.colors.background }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: 'rgba(41, 157, 145, 0.1)' }}>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Employee Name</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Payment Type</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Calculated Amount</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Advance Deduction</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Final Payable</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Status</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-gray-800">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentPayments.length > 0 ? (
                currentPayments.map((payment, index) => {
                  const statusBadge = getStatusBadge(payment.status);
                  const StatusIcon = statusBadge.icon;
                  return (
                    <tr
                      key={payment.id}
                      className={`border-t border-gray-200 hover:bg-gray-50 transition ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-800">{payment.employeeName}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">
                        <span
                          className="px-2 sm:px-3 py-1 rounded-full text-xs font-semibold text-white whitespace-nowrap inline-block"
                          style={{
                            backgroundColor:
                              payment.paymentType === 'Weekly'
                                ? '#7FB3B0'
                                : payment.paymentType === 'Monthly'
                                ? '#5A9591'
                                : '#3D7971',
                          }}
                        >
                          {payment.paymentType}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-800">AED {payment.calculatedAmount.toLocaleString()}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-red-600">- AED {payment.advanceDeduction.toLocaleString()}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold text-gray-800" style={{ color: theme.colors.primary, fontSize: '1em' }}>
                        AED {payment.finalPayable.toLocaleString()}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                        <span
                          className="px-2 sm:px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"
                          style={{
                            backgroundColor: statusBadge.bg,
                            color: statusBadge.color,
                          }}
                        >
                          <StatusIcon className="w-4 h-4" />
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center justify-center gap-1 sm:gap-2">
                          {payment.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => handleApprovePayment(payment)}
                                className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition text-white text-xs font-semibold hover:opacity-90 whitespace-nowrap"
                                style={{ backgroundColor: theme.colors.primary }}
                              >
                                Approve
                                </button>
                              <button
                                onClick={() => handleMarkAsPaid(payment)}
                                className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition text-xs font-semibold whitespace-nowrap hover:opacity-80"
                                style={{
                                  backgroundColor: 'transparent',
                                  color: theme.colors.primary,
                                  border: `1.5px solid ${theme.colors.primary}`,
                                }}
                              >
                                Mark as Paid
                              </button>
                            </>
                          )}
                          {payment.status === 'Approved' && (
                            <button
                              onClick={() => handleMarkAsPaid(payment)}
                              className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition text-xs font-semibold whitespace-nowrap hover:opacity-80"
                              style={{
                                backgroundColor: 'transparent',
                                color: theme.colors.primary,
                                border: `1.5px solid ${theme.colors.primary}`,
                              }}
                            >
                              Mark as Paid
                            </button>
                          )}
                          {payment.status === 'Paid' && (
                            <span className="px-3 py-1.5 text-green-600 text-xs font-semibold flex items-center gap-1 whitespace-nowrap">
                              <MdCheckCircle className="w-4 h-4" />
                              Completed
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center">
                  <p className="text-gray-500">No payment records for this period</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Approve Payment Modal */}
      {showApproveModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full" style={{ backgroundColor: theme.colors.background }}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Approve Payment</h2>
              <button
                onClick={() => setShowApproveModal(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition"
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-gray-600 text-sm">Employee</p>
                  <p className="text-gray-900 font-semibold">{selectedPayment.employeeName}</p>
                </div>
                <div className="flex justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Calculated Amount</p>
                    <p className="text-gray-900 font-semibold">AED {selectedPayment.calculatedAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Advance Deduction</p>
                    <p className="text-red-600 font-semibold">- AED {selectedPayment.advanceDeduction.toLocaleString()}</p>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <p className="text-gray-600 text-sm">Final Payable Amount</p>
                  <p className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                    AED {selectedPayment.finalPayable.toLocaleString()}
                  </p>
                </div>
              </div>

              <p className="text-gray-600 text-sm">Are you sure you want to approve this payment?</p>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={confirmApprovePayment}
                  className="flex-1 text-white px-6 py-2 rounded-lg hover:opacity-90 transition font-medium flex items-center justify-center gap-2"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  {/* <MdCheck className="w-5 h-5" /> */}
                  Approve Payment
                </button>
                <button
                  onClick={() => setShowApproveModal(false)}
                  className="flex-1 text-gray-700 px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mark as Paid Modal */}
      {showPaidModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full" style={{ backgroundColor: theme.colors.background }}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Mark as Paid</h2>
              <button
                onClick={() => setShowPaidModal(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition"
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-gray-600 text-sm">Employee</p>
                  <p className="text-gray-900 font-semibold">{selectedPayment.employeeName}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Payment Amount</p>
                  <p className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                    AED {selectedPayment.finalPayable.toLocaleString()}
                  </p>
                </div>
              </div>

              <p className="text-gray-600 text-sm">Confirm that this payment has been transferred to the employee?</p>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={confirmMarkAsPaid}
                  className="flex-1 text-white px-6 py-2 rounded-lg hover:opacity-90 transition font-medium flex items-center justify-center gap-2"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  <MdCheck className="w-5 h-5" />
                  Mark as Paid
                </button>
                <button
                  onClick={() => setShowPaidModal(false)}
                  className="flex-1 text-gray-700 px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
