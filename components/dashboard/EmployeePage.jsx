'use client';

export default function EmployeePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Employees</h1>
        <p className="text-gray-600 mt-2">Manage your employee records and information</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Employee List</h2>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            + Add Employee
          </button>
        </div>
        
        <div className="text-center py-12 text-gray-500">
          <p>No employees added yet</p>
          <p className="text-sm mt-2">Click "Add Employee" to get started</p>
        </div>
      </div>
    </div>
  );
}
