'use client';

export default function PayrollPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Payroll & Salary</h1>
        <p className="text-gray-600 mt-2">Manage employee salaries and payment records</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Payroll History</h2>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            + Process Payroll
          </button>
        </div>
        
        <div className="text-center py-12 text-gray-500">
          <p>No payroll records yet</p>
          <p className="text-sm mt-2">Process your first payroll to get started</p>
        </div>
      </div>
    </div>
  );
}
