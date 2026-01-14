'use client';

import { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdDelete, MdVisibility, MdClose } from 'react-icons/md';
import { theme } from '@/lib/theme';
import toast from 'react-hot-toast';

export default function BillsPage() {
  const [bills, setBills] = useState([
    {
      id: 1,
      billNumber: 'BILL-2026-001',
      client: 'Emirates Express',
      amount: 15000,
      issueDate: '2026-01-05',
      dueDate: '2026-01-20',
      description: 'Monthly Service Charge',
      status: 'Paid',
      paymentDate: '2026-01-15',
    },
    {
      id: 2,
      billNumber: 'BILL-2026-002',
      client: 'Dubai Logistics',
      amount: 22000,
      issueDate: '2026-01-08',
      dueDate: '2026-01-25',
      description: 'Fleet Management Services',
      status: 'Pending',
      paymentDate: null,
    },
    {
      id: 3,
      billNumber: 'BILL-2026-003',
      client: 'Abu Dhabi Transport',
      amount: 18000,
      issueDate: '2026-01-03',
      dueDate: '2026-01-18',
      description: 'Staff Management Services',
      status: 'Paid',
      paymentDate: '2026-01-10',
    },
  ]);

  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedBill, setSelectedBill] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [billToDelete, setBillToDelete] = useState(null);
  const [newBillForm, setNewBillForm] = useState({
    billNumber: '',
    client: '',
    amount: '',
    issueDate: '',
    dueDate: '',
    description: '',
    status: 'Pending',
  });

  const statusOptions = ['All', 'Pending', 'Paid', 'Overdue'];
  
  const filteredBills = filterStatus === 'All'
    ? bills
    : bills.filter(bill => bill.status === filterStatus);

  // Handle Escape key to close modals
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showDetailModal) setShowDetailModal(false);
        if (showAddModal) setShowAddModal(false);
        if (showDeleteConfirm) setShowDeleteConfirm(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showDetailModal, showAddModal, showDeleteConfirm]);

  const handleViewBill = (bill) => {
    setSelectedBill(bill);
    setShowDetailModal(true);
  };

  const handleAddBill = () => {
    setShowAddModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setNewBillForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitBill = () => {
    if (!newBillForm.billNumber.trim()) {
      toast.error('Bill number is required');
      return;
    }
    if (!newBillForm.client.trim()) {
      toast.error('Client name is required');
      return;
    }
    if (!newBillForm.amount || parseFloat(newBillForm.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!newBillForm.issueDate) {
      toast.error('Issue date is required');
      return;
    }

    const newBill = {
      id: bills.length + 1,
      billNumber: newBillForm.billNumber.trim(),
      client: newBillForm.client.trim(),
      amount: parseFloat(newBillForm.amount),
      issueDate: newBillForm.issueDate,
      dueDate: newBillForm.dueDate || newBillForm.issueDate,
      description: newBillForm.description.trim() || 'Service Charge',
      status: newBillForm.status,
      paymentDate: newBillForm.status === 'Paid' ? new Date().toISOString().split('T')[0] : null,
    };

    setBills([...bills, newBill]);
    setShowAddModal(false);
    setNewBillForm({
      billNumber: '',
      client: '',
      amount: '',
      issueDate: '',
      dueDate: '',
      description: '',
      status: 'Pending',
    });
    toast.success('Bill created successfully');
  };

  const handleDeleteBill = (bill) => {
    setBillToDelete(bill);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteBill = () => {
    if (!billToDelete) return;
    setBills(prev => prev.filter(b => b.id !== billToDelete.id));
    setShowDeleteConfirm(false);
    setBillToDelete(null);
    toast.success('Bill deleted successfully');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid':
        return { bg: '#D1FAE5', text: '#047857', border: '#6EE7B7' };
      case 'Pending':
        return { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' };
      case 'Overdue':
        return { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' };
      default:
        return { bg: '#E5E7EB', text: '#374151', border: '#D1D5DB' };
    }
  };

  return (
    <div>
      {/* Header (separate, consistent with other pages) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Bills</h2>
        <button
          onClick={handleAddBill}
          className="flex items-center space-x-2 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition"
          style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radius.button }}
        >
          <MdAdd className="w-5 h-5" />
          <span>Create Bill</span>
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden" style={{ backgroundColor: theme.colors.background }}>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 p-4 sm:p-6 border-b" style={{ borderColor: theme.colors.border.light }}>
          {statusOptions.map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === status
                  ? 'text-white'
                  : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
              }`}
              style={filterStatus === status ? { backgroundColor: theme.colors.primary } : {}}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Bills Table */}
        {filteredBills.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: theme.colors.border.light }}>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Bill Number</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Client</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Due Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map(bill => {
                  const statusColor = getStatusColor(bill.status);
                  return (
                    <tr
                      key={bill.id}
                      className="border-b hover:bg-gray-50 transition"
                      style={{ borderColor: theme.colors.border.light }}
                    >
                      <td className="py-4 px-4 text-gray-800 font-medium">{bill.billNumber}</td>
                      <td className="py-4 px-4 text-gray-700">{bill.client}</td>
                      <td className="py-4 px-4 text-gray-600">{bill.description}</td>
                      <td className="py-4 px-4 text-gray-800 font-semibold">AED {bill.amount.toLocaleString()}</td>
                      <td className="py-4 px-4 text-gray-700">{bill.dueDate}</td>
                      <td className="py-4 px-4">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: statusColor.bg,
                            color: statusColor.text,
                            border: `1px solid ${statusColor.border}`,
                          }}
                        >
                          {bill.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 flex justify-center items-center space-x-2">
                        <button
                          onClick={() => handleViewBill(bill)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition "
                          title="View Bill"
                        >
                          <MdVisibility className="w-5 h-5" style={{ color: theme.colors.primary }}  />
                        </button>
                        <button
                          onClick={() => handleDeleteBill(bill)}
                          className="p-2 hover:bg-red-100 rounded-lg transition text-red-600"
                          title="Delete Bill"
                        >
                          <MdDelete className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="font-medium">No bills found</p>
            <p className="text-sm mt-2">Create your first bill to get started</p>
          </div>
        )}
      </div>

      {/* Bill Detail Modal */}
      {showDetailModal && selectedBill && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-lg w-full max-w-[90vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6"
            style={{ backgroundColor: theme.colors.background }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6 pb-4 border-b" style={{ borderColor: theme.colors.border.light }}>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Bill Details</h3>
                <p className="text-gray-500 text-sm mt-1">{selectedBill.billNumber}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="text-gray-600 text-sm font-medium">Bill Number</label>
                <p className="text-gray-800 font-semibold mt-1">{selectedBill.billNumber}</p>
              </div>
              <div>
                <label className="text-gray-600 text-sm font-medium">Client</label>
                <p className="text-gray-800 font-semibold mt-1">{selectedBill.client}</p>
              </div>
              <div>
                <label className="text-gray-600 text-sm font-medium">Amount</label>
                <p className="text-gray-800 font-semibold mt-1">AED {selectedBill.amount.toLocaleString()}</p>
              </div>
              <div>
                <label className="text-gray-600 text-sm font-medium">Status</label>
                <div className="mt-1">
                  {(() => {
                    const statusColor = getStatusColor(selectedBill.status);
                    return (
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold inline-block"
                        style={{
                          backgroundColor: statusColor.bg,
                          color: statusColor.text,
                          border: `1px solid ${statusColor.border}`,
                        }}
                      >
                        {selectedBill.status}
                      </span>
                    );
                  })()}
                </div>
              </div>
              <div>
                <label className="text-gray-600 text-sm font-medium">Issue Date</label>
                <p className="text-gray-800 font-semibold mt-1">{selectedBill.issueDate}</p>
              </div>
              <div>
                <label className="text-gray-600 text-sm font-medium">Due Date</label>
                <p className="text-gray-800 font-semibold mt-1">{selectedBill.dueDate}</p>
              </div>
              <div className="col-span-2">
                <label className="text-gray-600 text-sm font-medium">Description</label>
                <p className="text-gray-800 mt-1">{selectedBill.description}</p>
              </div>
              {selectedBill.paymentDate && (
                <div className="col-span-2">
                  <label className="text-gray-600 text-sm font-medium">Payment Date</label>
                  <p className="text-gray-800 font-semibold mt-1">{selectedBill.paymentDate}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t" style={{ borderColor: theme.colors.border.light }}>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
                style={{ borderRadius: theme.radius.button }}
              >
                Close
              </button>
              <button
                className="px-6 py-2 rounded-lg font-medium text-white hover:opacity-90 transition"
                style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radius.button }}
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && billToDelete && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-white rounded-xl shadow-lg w-full max-w-[90vw] sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6"
            style={{ backgroundColor: theme.colors.background }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6 pb-4 border-b" style={{ borderColor: theme.colors.border.light }}>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Delete Bill</h3>
                <p className="text-gray-500 text-sm mt-1">This action cannot be undone.</p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>

            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <span className="font-semibold">{billToDelete.billNumber}</span> for
              <span className="font-semibold"> {billToDelete.client}</span>?
            </p>

            <div className="flex justify-end space-x-3 pt-4 border-t" style={{ borderColor: theme.colors.border.light }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-6 py-2 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
                style={{ borderRadius: theme.radius.button }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteBill}
                className="px-6 py-2 rounded-lg font-medium text-white hover:opacity-90 transition"
                style={{ backgroundColor: theme.colors.error, borderRadius: theme.radius.button }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Bill Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-lg w-full max-w-[90vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6"
            style={{ backgroundColor: theme.colors.background }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6 pb-4 border-b" style={{ borderColor: theme.colors.border.light }}>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Create New Bill</h3>
                <p className="text-gray-500 text-sm mt-1">Fill in the details below</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="col-span-1">
                <label className="block text-gray-700 font-medium mb-2">Bill Number *</label>
                <input
                  type="text"
                  name="billNumber"
                  value={newBillForm.billNumber}
                  onChange={handleFormChange}
                  placeholder="e.g., BILL-2026-001"
                  className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition"
                  style={{ borderColor: theme.colors.input.border, borderRadius: theme.radius.input }}
                  onFocus={(e) => (e.target.style.borderColor = theme.colors.input.focus)}
                  onBlur={(e) => (e.target.style.borderColor = theme.colors.input.border)}
                />
              </div>
              <div className="col-span-1">
                <label className="block text-gray-700 font-medium mb-2">Client *</label>
                <input
                  type="text"
                  name="client"
                  value={newBillForm.client}
                  onChange={handleFormChange}
                  placeholder="Client name"
                  className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition"
                  style={{ borderColor: theme.colors.input.border, borderRadius: theme.radius.input }}
                  onFocus={(e) => (e.target.style.borderColor = theme.colors.input.focus)}
                  onBlur={(e) => (e.target.style.borderColor = theme.colors.input.border)}
                />
              </div>
              <div className="col-span-1">
                <label className="block text-gray-700 font-medium mb-2">Amount (AED) *</label>
                <input
                  type="number"
                  name="amount"
                  value={newBillForm.amount}
                  onChange={handleFormChange}
                  placeholder="0.00"
                  className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition"
                  style={{ borderColor: theme.colors.input.border, borderRadius: theme.radius.input }}
                  onFocus={(e) => (e.target.style.borderColor = theme.colors.input.focus)}
                  onBlur={(e) => (e.target.style.borderColor = theme.colors.input.border)}
                />
              </div>
              <div className="col-span-1">
                <label className="block text-gray-700 font-medium mb-2">Status</label>
                <select
                  name="status"
                  value={newBillForm.status}
                  onChange={handleFormChange}
                  className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition"
                  style={{ borderColor: theme.colors.input.border, borderRadius: theme.radius.input }}
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
              <div className="col-span-1">
                <label className="block text-gray-700 font-medium mb-2">Issue Date *</label>
                <input
                  type="date"
                  name="issueDate"
                  value={newBillForm.issueDate}
                  onChange={handleFormChange}
                  className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition"
                  style={{ borderColor: theme.colors.input.border, borderRadius: theme.radius.input }}
                  onFocus={(e) => (e.target.style.borderColor = theme.colors.input.focus)}
                  onBlur={(e) => (e.target.style.borderColor = theme.colors.input.border)}
                />
              </div>
              <div className="col-span-1">
                <label className="block text-gray-700 font-medium mb-2">Due Date</label>
                <input
                  type="date"
                  name="dueDate"
                  value={newBillForm.dueDate}
                  onChange={handleFormChange}
                  className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition"
                  style={{ borderColor: theme.colors.input.border, borderRadius: theme.radius.input }}
                  onFocus={(e) => (e.target.style.borderColor = theme.colors.input.focus)}
                  onBlur={(e) => (e.target.style.borderColor = theme.colors.input.border)}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-gray-700 font-medium mb-2">Description</label>
                <textarea
                  name="description"
                  value={newBillForm.description}
                  onChange={handleFormChange}
                  placeholder="Bill description (e.g., Monthly Service Charge)"
                  rows="3"
                  className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition"
                  style={{ borderColor: theme.colors.input.border, borderRadius: theme.radius.input }}
                  onFocus={(e) => (e.target.style.borderColor = theme.colors.input.focus)}
                  onBlur={(e) => (e.target.style.borderColor = theme.colors.input.border)}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t" style={{ borderColor: theme.colors.border.light }}>
              <button
                onClick={() => setShowAddModal(false)}
                className="px-6 py-2 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
                style={{ borderRadius: theme.radius.button }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitBill}
                className="px-6 py-2 rounded-lg font-medium text-white hover:opacity-90 transition"
                style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radius.button }}
              >
                Create Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
