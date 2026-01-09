'use client';

import { useState, useEffect } from 'react';
import { MdEdit, MdVisibility, MdClose, MdAdd } from 'react-icons/md';
import { theme } from '@/lib/theme';
import toast from 'react-hot-toast';

export default function EmployeePage() {
  const [employees, setEmployees] = useState([
    {
      id: 1,
      name: 'Ahmed Hassan',
      role: 'Delivery Driver',
      paymentType: 'Per Delivery',
      salary: 'AED 50/delivery',
      client: 'Emirates Express',
      status: 'Active',
      salaryHistory: [
        { month: 'Jan 2026', amount: 'AED 2,500', deliveries: 50 },
        { month: 'Dec 2025', amount: 'AED 2,300', deliveries: 46 },
      ],
      advances: [
        { date: '15 Jan 2026', amount: 'AED 500', status: 'Pending' },
      ],
      assets: ['Bike - Yamaha YZF', 'Delivery Bag', 'GPS Device'],
    },
    {
      id: 2,
      name: 'Fatima Al-Mansouri',
      role: 'Accountant',
      paymentType: 'Monthly',
      salary: 'AED 5,500',
      client: 'Main Office',
      status: 'Active',
      salaryHistory: [
        { month: 'Jan 2026', amount: 'AED 5,500', deliveries: '1 month' },
        { month: 'Dec 2025', amount: 'AED 5,500', deliveries: '1 month' },
      ],
      advances: [],
      assets: ['Laptop - Dell XPS'],
    },
    {
      id: 3,
      name: 'Mohammed Ali',
      role: 'Field Officer',
      paymentType: 'Weekly',
      salary: 'AED 1,200/week',
      client: 'Dubai Operations',
      status: 'Active',
      salaryHistory: [
        { month: 'Week 2 Jan', amount: 'AED 1,200', deliveries: '1 week' },
      ],
      advances: [
        { date: '10 Jan 2026', amount: 'AED 300', status: 'Paid' },
      ],
      assets: ['Mobile Phone', 'Camera', 'Uniform'],
    },
  ]);

  const [filterPaymentType, setFilterPaymentType] = useState('All');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addPaymentDropdownOpen, setAddPaymentDropdownOpen] = useState(false);
  const [newEmployeeForm, setNewEmployeeForm] = useState({
    name: '',
    role: '',
    paymentType: 'Monthly',
    salary: '',
    client: '',
    status: 'Active',
  });

  const paymentTypes = ['All', 'Weekly', 'Monthly', 'Per Delivery'];

  const filteredEmployees = filterPaymentType === 'All'
    ? employees
    : employees.filter(emp => emp.paymentType === filterPaymentType);

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

  const handleViewEmployee = (employee) => {
    setSelectedEmployee(employee);
    setShowDetailModal(true);
  };

  const handleAddEmployee = () => {
    setShowAddModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setNewEmployeeForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitEmployee = () => {
    if (!newEmployeeForm.name.trim()) {
      toast.error('Employee name is required');
      return;
    }
    if (!newEmployeeForm.role.trim()) {
      toast.error('Employee role is required');
      return;
    }
    if (!newEmployeeForm.salary.trim()) {
      toast.error('Salary/Rate is required');
      return;
    }
    if (!newEmployeeForm.client.trim()) {
      toast.error('Client name is required');
      return;
    }

    const newEmployee = {
      id: employees.length + 1,
      ...newEmployeeForm,
      salaryHistory: [],
      advances: [],
      assets: [],
    };

    setEmployees([...employees, newEmployee]);
    setShowAddModal(false);
    setNewEmployeeForm({
      name: '',
      role: '',
      paymentType: 'Monthly',
      salary: '',
      client: '',
      status: 'Active',
    });
    toast.success('Employee added successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {paymentTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilterPaymentType(type)}
              className={`px-4 py-2 rounded-lg transition ${
                filterPaymentType === type
                  ? 'text-white'
                  : 'text-gray-700 border border-gray-300 hover:border-gray-400'
              }`}
              style={{
                backgroundColor: filterPaymentType === type ? theme.colors.primary : 'transparent',
              }}
            >
              {type}
            </button>
          ))}
        </div>
        <button
          onClick={handleAddEmployee}
          className="flex items-center justify-center space-x-2 text-white px-6 py-2 rounded-lg hover:opacity-90 transition"
          style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radius.button }}
        >
          <MdAdd className="w-5 h-5" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden" style={{ backgroundColor: theme.colors.background }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: 'rgba(41, 157, 145, 0.1)' }}>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Role</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Payment Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Salary / Rate</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Client</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Status</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-800">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee, index) => (
                  <tr
                    key={employee.id}
                    className={`border-t border-gray-200 hover:bg-gray-50 transition ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{employee.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{employee.role}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold text-white whitespace-nowrap inline-block"
                        style={{
                          backgroundColor:
                            employee.paymentType === 'Weekly'
                              ? '#7FB3B0'
                              : employee.paymentType === 'Monthly'
                              ? '#5A9591'
                              : '#3D7971',
                        }}
                      >
                        {employee.paymentType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-800">{employee.salary}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{employee.client}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: 'rgba(34, 197, 94, 0.1)',
                          color: '#22C55E',
                        }}
                      >
                        {employee.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleViewEmployee(employee)}
                          className="p-2 rounded-lg transition hover:bg-gray-200"
                          title="View"
                        >
                          <MdVisibility className="w-5 h-5" style={{ color: theme.colors.primary }} />
                        </button>
                        <button
                          className="p-2 rounded-lg transition hover:bg-gray-200"
                          title="Edit"
                        >
                          <MdEdit className="w-5 h-5" style={{ color: '#666' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <p className="text-gray-500">No employees found with this filter</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Detail Modal */}
      {showDetailModal && selectedEmployee && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowDetailModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" 
            style={{ backgroundColor: theme.colors.background }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-gray-200" style={{ backgroundColor: theme.colors.background }}>
              <h2 className="text-2xl font-bold text-gray-800">{selectedEmployee.name}</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition"
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Role</label>
                  <p className="text-gray-900 font-medium">{selectedEmployee.role}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Payment Type</label>
                  <p className="text-gray-900 font-medium">{selectedEmployee.paymentType}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Salary/Rate</label>
                  <p className="text-gray-900 font-medium">{selectedEmployee.salary}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Client</label>
                  <p className="text-gray-900 font-medium">{selectedEmployee.client}</p>
                </div>
              </div>

              {/* Salary History */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Salary History</h3>
                <div className="space-y-3">
                  {selectedEmployee.salaryHistory.map((record, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-lg"
                      style={{ backgroundColor: 'rgba(41, 157, 145, 0.05)' }}
                    >
                      <div>
                        <p className="font-semibold text-gray-800">{record.month}</p>
                        <p className="text-sm text-gray-600">{record.deliveries}</p>
                      </div>
                      <p className="font-bold text-lg" style={{ color: theme.colors.primary }}>
                        {record.amount}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advances */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Advances Taken</h3>
                {selectedEmployee.advances.length > 0 ? (
                  <div className="space-y-3">
                    {selectedEmployee.advances.map((advance, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 rounded-lg border border-gray-200"
                      >
                        <div>
                          <p className="font-semibold text-gray-800">{advance.date}</p>
                          <p
                            className="text-xs font-medium px-2 py-1 rounded-full mt-1 w-fit"
                            style={{
                              backgroundColor:
                                advance.status === 'Paid'
                                  ? 'rgba(34, 197, 94, 0.1)'
                                  : 'rgba(234, 179, 8, 0.1)',
                              color:
                                advance.status === 'Paid'
                                  ? '#22C55E'
                                  : '#EAB308',
                            }}
                          >
                            {advance.status}
                          </p>
                        </div>
                        <p className="font-bold text-lg text-gray-800">{advance.amount}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No advances taken</p>
                )}
              </div>

              {/* Assigned Assets */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Assigned Assets</h3>
                {selectedEmployee.assets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedEmployee.assets.map((asset, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-lg border-2"
                        style={{ borderColor: theme.colors.primary }}
                      >
                        <p className="font-semibold text-gray-800">{asset}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No assets assigned</p>
                )}
              </div>

              {/* Modal Actions */}
              <div className="border-t border-gray-200 pt-6 flex gap-3">
                <button
                  className="flex-1 text-white px-6 py-2 rounded-lg hover:opacity-90 transition"
                  style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radius.button }}
                >
                  Edit Employee
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 text-gray-700 px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
                  style={{ borderRadius: theme.radius.button }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowAddModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" 
            style={{ backgroundColor: theme.colors.background }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-gray-200" style={{ backgroundColor: theme.colors.background }}>
              <h2 className="text-2xl font-bold text-gray-800">Add New Employee</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition"
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Employee Name *</label>
                <input
                  type="text"
                  name="name"
                  value={newEmployeeForm.name}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="Enter employee name"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Role *</label>
                <input
                  type="text"
                  name="role"
                  value={newEmployeeForm.role}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="e.g., Delivery Driver, Accountant"
                />
              </div>

              {/* Payment Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Payment Type *</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setAddPaymentDropdownOpen(!addPaymentDropdownOpen)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-gray-400 transition text-gray-700"
                  >
                    <span>{newEmployeeForm.paymentType}</span>
                    <svg
                      className="w-5 h-5 text-gray-500 transition-transform duration-200"
                      style={{
                        transform: addPaymentDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </button>
                  {addPaymentDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                      {['Weekly', 'Monthly', 'Per Delivery'].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setNewEmployeeForm({ ...newEmployeeForm, paymentType: option });
                            setAddPaymentDropdownOpen(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition first:rounded-t-lg last:rounded-b-lg text-gray-700"
                          style={{
                            backgroundColor: newEmployeeForm.paymentType === option ? theme.colors.background : 'transparent',
                          }}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Salary/Rate */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Salary / Rate *</label>
                <input
                  type="text"
                  name="salary"
                  value={newEmployeeForm.salary}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="e.g., AED 5,500 or AED 50/delivery"
                />
              </div>

              {/* Client */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Assigned Client *</label>
                <input
                  type="text"
                  name="client"
                  value={newEmployeeForm.client}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="e.g., Emirates Express"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Status</label>
                <select
                  name="status"
                  value={newEmployeeForm.status}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>

              {/* Modal Actions */}
              <div className="border-t border-gray-200 pt-6 flex gap-3">
                <button
                  onClick={handleSubmitEmployee}
                  className="flex-1 text-white px-6 py-2 rounded-lg hover:opacity-90 transition"
                  style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radius.button }}
                >
                  Add Employee
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 text-gray-700 px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
                  style={{ borderRadius: theme.radius.button }}
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
