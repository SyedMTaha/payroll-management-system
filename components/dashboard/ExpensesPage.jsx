'use client';

import { useState, useEffect } from 'react';
import { MdAdd, MdClose, MdEdit, MdDelete } from 'react-icons/md';
import { theme } from '@/lib/theme';
import toast from 'react-hot-toast';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([
    {
      id: 1,
      date: '2026-01-08',
      category: 'Office',
      amount: 1500,
      notes: 'Office supplies and stationery',
    },
    {
      id: 2,
      date: '2026-01-07',
      category: 'Fuel',
      amount: 800,
      notes: 'Fuel for delivery vehicles',
    },
    {
      id: 3,
      date: '2026-01-06',
      category: 'Bikes',
      amount: 2500,
      notes: 'Bike maintenance and repairs',
    },
    {
      id: 4,
      date: '2026-01-05',
      category: 'Staff',
      amount: 1200,
      notes: 'Staff lunch and refreshments',
    },
    {
      id: 5,
      date: '2026-01-04',
      category: 'Miscellaneous',
      amount: 600,
      notes: 'Miscellaneous office expenses',
    },
  ]);

  const [filterCategory, setFilterCategory] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [newExpenseForm, setNewExpenseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Office',
    amount: '',
    notes: '',
  });

  const categories = ['All', 'Office', 'Fuel', 'Bikes', 'Staff', 'Miscellaneous'];

  const categoryColors = {
    Office: '#7FB3B0',
    Fuel: '#5A9591',
    Bikes: '#3D7971',
    Staff: '#299D91',
    Miscellaneous: '#1F7A71',
  };

  const filteredExpenses = filterCategory === 'All'
    ? expenses
    : expenses.filter(exp => exp.category === filterCategory);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showAddModal) {
        setShowAddModal(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showAddModal]);

  const handleAddExpense = () => {
    setShowAddModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setNewExpenseForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitExpense = () => {
    if (!newExpenseForm.amount.trim() || parseFloat(newExpenseForm.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const newExpense = {
      id: expenses.length + 1,
      date: newExpenseForm.date,
      category: newExpenseForm.category,
      amount: parseFloat(newExpenseForm.amount),
      notes: newExpenseForm.notes.trim() || 'No notes',
    };

    setExpenses([newExpense, ...expenses]);
    setShowAddModal(false);
    setNewExpenseForm({
      date: new Date().toISOString().split('T')[0],
      category: 'Office',
      amount: '',
      notes: '',
    });
    toast.success('Expense added successfully!');
  };

  const getCategoryStats = () => {
    const stats = {};
    categories.slice(1).forEach(cat => {
      const total = expenses
        .filter(exp => exp.category === cat)
        .reduce((sum, exp) => sum + exp.amount, 0);
      stats[cat] = total;
    });
    return stats;
  };

  const getTotalExpenses = () => {
    return filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  };

  const categoryStats = getCategoryStats();
  const totalExpenses = getTotalExpenses();

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Header with Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setFilterCategory(category)}
              className={`px-4 py-2 rounded-lg transition ${
                filterCategory === category
                  ? 'text-white'
                  : 'text-gray-700 border border-gray-300 hover:border-gray-400'
              }`}
              style={{
                backgroundColor: filterCategory === category ? theme.colors.primary : 'transparent',
              }}
            >
              {category}
            </button>
          ))}
        </div>
        <button
          onClick={handleAddExpense}
          className="flex items-center justify-center space-x-2 text-white px-6 py-2 rounded-lg hover:opacity-90 transition"
          style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radius.button }}
        >
          <MdAdd className="w-5 h-5" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Stats Cards - Expense Distribution */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 w-full">
        {categories.slice(1).map((category) => (
          <div
            key={category}
            className="bg-white rounded-xl shadow-md p-3 sm:p-4"
            style={{ backgroundColor: theme.colors.background }}
          >
            <p className="text-gray-600 text-xs font-medium mb-1">{category}</p>
            <p className="text-lg sm:text-xl font-bold" style={{ color: categoryColors[category] }}>
              AED {categoryStats[category].toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Total Expenses Card */}
      <div className="bg-white rounded-xl shadow-md p-4" style={{ backgroundColor: theme.colors.background }}>
        <p className="text-gray-600 text-sm font-medium mb-1">Total Expenses (Filtered)</p>
        <p className="text-3xl font-bold" style={{ color: theme.colors.primary }}>
          AED {totalExpenses.toLocaleString()}
        </p>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden" style={{ backgroundColor: theme.colors.background }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: 'rgba(41, 157, 145, 0.1)' }}>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Date</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Category</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Amount</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Notes</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-gray-800">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((expense, index) => (
                  <tr
                    key={expense.id}
                    className={`border-t border-gray-200 hover:bg-gray-50 transition ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-800">
                      {new Date(expense.date).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">
                      <span
                        className="px-2 sm:px-3 py-1 rounded-full text-xs font-semibold text-white whitespace-nowrap inline-block"
                        style={{
                          backgroundColor: categoryColors[expense.category],
                        }}
                      >
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold" style={{ color: theme.colors.primary }}>
                      AED {expense.amount.toLocaleString()}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600">
                      {expense.notes}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center justify-center gap-1 sm:gap-2">
                        <button
                          className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-lg transition"
                          title="Edit"
                        >
                          <MdEdit className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          className="p-1.5 sm:p-2 hover:bg-red-100 rounded-lg transition"
                          title="Delete"
                        >
                          <MdDelete className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <p className="text-gray-500">No expenses in this category</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
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
              <h2 className="text-xl font-bold text-gray-800">Add New Expense</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition"
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  name="date"
                  value={newExpenseForm.date}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-left flex items-center justify-between bg-white hover:bg-gray-50 transition"
                  >
                    <span className="text-gray-900">{newExpenseForm.category}</span>
                    <svg
                      className="w-5 h-5 text-gray-500 transition-transform duration-200"
                      style={{
                        transform: categoryDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </button>
                  {categoryDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                      {categories.slice(1).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setNewExpenseForm({ ...newExpenseForm, category: cat });
                            setCategoryDropdownOpen(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition first:rounded-t-lg last:rounded-b-lg text-gray-700"
                          style={{
                            backgroundColor: newExpenseForm.category === cat ? theme.colors.background : 'transparent',
                          }}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (AED)</label>
                <input
                  type="number"
                  name="amount"
                  value={newExpenseForm.amount}
                  onChange={handleFormChange}
                  placeholder="Enter amount"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  name="notes"
                  value={newExpenseForm.notes}
                  onChange={handleFormChange}
                  placeholder="Enter notes (optional)"
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSubmitExpense}
                  className="flex-1 text-white px-6 py-2 rounded-lg hover:opacity-90 transition font-medium"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  Add Expense
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
