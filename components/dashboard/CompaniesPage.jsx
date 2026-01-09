'use client';

import { useState, useEffect } from 'react';
import { MdAdd, MdClose, MdVisibility, MdBusiness } from 'react-icons/md';
import { theme } from '@/lib/theme';
import toast from 'react-hot-toast';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([
    {
      id: 1,
      name: 'Emirates Express',
      serviceType: 'Delivery Services',
      monthlyCharge: 15000,
      assignedEmployees: ['Ahmed Hassan', 'Mohammed Ali'],
      paymentStatus: 'Paid',
      invoices: [
        { month: 'Jan 2026', amount: 15000, status: 'Paid', paidDate: '2026-01-05' },
        { month: 'Dec 2025', amount: 15000, status: 'Paid', paidDate: '2025-12-05' },
      ],
      paymentHistory: [
        { date: '2026-01-05', amount: 15000, method: 'Bank Transfer' },
        { date: '2025-12-05', amount: 15000, method: 'Bank Transfer' },
      ],
    },
    {
      id: 2,
      name: 'Dubai Logistics',
      serviceType: 'Fleet Management',
      monthlyCharge: 22000,
      assignedEmployees: ['Ali Khan', 'Omar Khalid'],
      paymentStatus: 'Pending',
      invoices: [
        { month: 'Jan 2026', amount: 22000, status: 'Pending', paidDate: null },
        { month: 'Dec 2025', amount: 22000, status: 'Paid', paidDate: '2025-12-08' },
      ],
      paymentHistory: [
        { date: '2025-12-08', amount: 22000, method: 'Cheque' },
        { date: '2025-11-10', amount: 22000, method: 'Bank Transfer' },
      ],
    },
    {
      id: 3,
      name: 'Abu Dhabi Transport',
      serviceType: 'Staff Management',
      monthlyCharge: 18000,
      assignedEmployees: ['Fatima Al-Mansouri', 'Sara Ahmed'],
      paymentStatus: 'Paid',
      invoices: [
        { month: 'Jan 2026', amount: 18000, status: 'Paid', paidDate: '2026-01-03' },
        { month: 'Dec 2025', amount: 18000, status: 'Paid', paidDate: '2025-12-03' },
      ],
      paymentHistory: [
        { date: '2026-01-03', amount: 18000, method: 'Bank Transfer' },
        { date: '2025-12-03', amount: 18000, method: 'Bank Transfer' },
      ],
    },
  ]);

  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCompanyForm, setNewCompanyForm] = useState({
    name: '',
    serviceType: '',
    monthlyCharge: '',
    assignedEmployees: '',
  });

  const handleViewCompany = (company) => {
    setSelectedCompany(company);
    setShowDetailModal(true);
  };

  const handleAddCompany = () => {
    setShowAddModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setNewCompanyForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitCompany = () => {
    if (!newCompanyForm.name.trim()) {
      toast.error('Company name is required');
      return;
    }
    if (!newCompanyForm.monthlyCharge || parseFloat(newCompanyForm.monthlyCharge) <= 0) {
      toast.error('Please enter a valid monthly charge');
      return;
    }

    const newCompany = {
      id: companies.length + 1,
      name: newCompanyForm.name.trim(),
      serviceType: newCompanyForm.serviceType.trim() || 'General Services',
      monthlyCharge: parseFloat(newCompanyForm.monthlyCharge),
      assignedEmployees: newCompanyForm.assignedEmployees.split(',').map(e => e.trim()).filter(e => e),
      paymentStatus: 'Pending',
      invoices: [],
      paymentHistory: [],
    };

    setCompanies([...companies, newCompany]);
    setShowAddModal(false);
    setNewCompanyForm({
      name: '',
      serviceType: '',
      monthlyCharge: '',
      assignedEmployees: '',
    });
    toast.success('Company added successfully!');
  };

  const getTotalRevenue = () => {
    return companies.reduce((sum, company) => sum + company.monthlyCharge, 0);
  };

  const getPaidRevenue = () => {
    return companies
      .filter(company => company.paymentStatus === 'Paid')
      .reduce((sum, company) => sum + company.monthlyCharge, 0);
  };

  const getPendingRevenue = () => {
    return companies
      .filter(company => company.paymentStatus === 'Pending')
      .reduce((sum, company) => sum + company.monthlyCharge, 0);
  };

  const totalRevenue = getTotalRevenue();
  const paidRevenue = getPaidRevenue();
  const pendingRevenue = getPendingRevenue();

  // Handle Escape key to close modals
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showDetailModal) setShowDetailModal(false);
        if (showAddModal) setShowAddModal(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showDetailModal, showAddModal]);

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Client Companies</h2>
        <button
          onClick={handleAddCompany}
          className="flex items-center justify-center space-x-2 text-white px-6 py-2 rounded-lg hover:opacity-90 transition"
          style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radius.button }}
        >
          <MdAdd className="w-5 h-5" />
          <span>Add Company</span>
        </button>
      </div>

      {/* Revenue Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 w-full">
        <div className="bg-white rounded-xl shadow-md p-3 sm:p-4" style={{ backgroundColor: theme.colors.background }}>
          <p className="text-gray-600 text-xs font-medium mb-1">Total Monthly Revenue</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-800">AED {totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-3 sm:p-4" style={{ backgroundColor: theme.colors.background }}>
          <p className="text-gray-600 text-xs font-medium mb-1">Paid This Month</p>
          <p className="text-lg sm:text-2xl font-bold text-green-500">AED {paidRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-3 sm:p-4" style={{ backgroundColor: theme.colors.background }}>
          <p className="text-gray-600 text-xs font-medium mb-1">Pending Payment</p>
          <p className="text-lg sm:text-2xl font-bold" style={{ color: '#EAB308' }}>AED {pendingRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden" style={{ backgroundColor: theme.colors.background }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: 'rgba(41, 157, 145, 0.1)' }}>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Company Name</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Service Type</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Monthly Charge</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Assigned Employees</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Payment Status</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-gray-800">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.length > 0 ? (
                companies.map((company, index) => (
                  <tr
                    key={company.id}
                    className={`border-t border-gray-200 hover:bg-gray-50 transition ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-800">
                      <div className="flex items-center gap-2">
                        <MdBusiness className="w-5 h-5" style={{ color: theme.colors.primary }} />
                        {company.name}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{company.serviceType}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold" style={{ color: theme.colors.primary }}>
                      AED {company.monthlyCharge.toLocaleString()}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">
                      {company.assignedEmployees.length} Employee{company.assignedEmployees.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                      <span
                        className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                          company.paymentStatus === 'Paid'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {company.paymentStatus}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => handleViewCompany(company)}
                          className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition text-white text-xs font-semibold hover:opacity-90 whitespace-nowrap"
                          style={{ backgroundColor: theme.colors.primary }}
                        >
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <p className="text-gray-500">No companies added yet</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Company Detail Modal */}
      {showDetailModal && selectedCompany && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm  "
          onClick={() => setShowDetailModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-lg max-w-3xl w-full max-h-[90vh] overflow-hidden" 
            style={{ backgroundColor: theme.colors.background }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10" style={{ backgroundColor: theme.colors.background }}>
              <h2 className="text-xl font-bold text-gray-800">{selectedCompany.name}</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition"
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Company Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Company Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Service Type</p>
                    <p className="font-semibold text-gray-900">{selectedCompany.serviceType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monthly Charge</p>
                    <p className="font-semibold" style={{ color: theme.colors.primary }}>
                      AED {selectedCompany.monthlyCharge.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Assigned Employees */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Assigned Employees</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  {selectedCompany.assignedEmployees.length > 0 ? (
                    <ul className="space-y-2">
                      {selectedCompany.assignedEmployees.map((employee, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-gray-700">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.colors.primary }}></span>
                          {employee}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">No employees assigned</p>
                  )}
                </div>
              </div>

              {/* Monthly Invoices */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Monthly Invoices</h3>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">Month</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">Amount</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">Status</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">Paid Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCompany.invoices.length > 0 ? (
                        selectedCompany.invoices.map((invoice, idx) => (
                          <tr key={idx} className="border-t border-gray-200">
                            <td className="px-4 py-2 text-sm text-gray-700">{invoice.month}</td>
                            <td className="px-4 py-2 text-sm font-semibold" style={{ color: theme.colors.primary }}>
                              AED {invoice.amount.toLocaleString()}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  invoice.status === 'Paid'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}
                              >
                                {invoice.status}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {invoice.paidDate || 'N/A'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="px-4 py-4 text-center text-gray-500">
                            No invoices yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment History */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Payment History</h3>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">Date</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">Amount</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">Payment Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCompany.paymentHistory.length > 0 ? (
                        selectedCompany.paymentHistory.map((payment, idx) => (
                          <tr key={idx} className="border-t border-gray-200">
                            <td className="px-4 py-2 text-sm text-gray-700">{payment.date}</td>
                            <td className="px-4 py-2 text-sm font-semibold text-green-600">
                              AED {payment.amount.toLocaleString()}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">{payment.method}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="px-4 py-4 text-center text-gray-500">
                            No payment history yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Company Modal */}
      {showAddModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm "
          onClick={() => setShowAddModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-lg max-w-md w-full my-8 max-h-[90vh] overflow-y-auto" 
            style={{ backgroundColor: theme.colors.background }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Add New Company</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition"
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                <input
                  type="text"
                  name="name"
                  value={newCompanyForm.name}
                  onChange={handleFormChange}
                  placeholder="Enter company name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
                <input
                  type="text"
                  name="serviceType"
                  value={newCompanyForm.serviceType}
                  onChange={handleFormChange}
                  placeholder="e.g., Delivery Services"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Charge (AED) *</label>
                <input
                  type="number"
                  name="monthlyCharge"
                  value={newCompanyForm.monthlyCharge}
                  onChange={handleFormChange}
                  placeholder="Enter amount"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Employees</label>
                <input
                  type="text"
                  name="assignedEmployees"
                  value={newCompanyForm.assignedEmployees}
                  onChange={handleFormChange}
                  placeholder="Employee1, Employee2, ..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Separate multiple names with commas</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSubmitCompany}
                  className="flex-1 text-white px-6 py-2 rounded-lg hover:opacity-90 transition font-medium"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  Add Company
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
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
