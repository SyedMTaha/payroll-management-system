'use client';

export default function ExpensesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Expenses</h1>
        <p className="text-gray-600 mt-2">Track and manage business expenses</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Expense Records</h2>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            + Add Expense
          </button>
        </div>
        
        <div className="text-center py-12 text-gray-500">
          <p>No expenses recorded yet</p>
          <p className="text-sm mt-2">Add your first expense to start tracking</p>
        </div>
      </div>
    </div>
  );
}
