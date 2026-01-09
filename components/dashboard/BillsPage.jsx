'use client';

import { theme } from '@/lib/theme';

export default function BillsPage() {
  return (
    <div>
      <div className="bg-white rounded-xl shadow-md p-8" style={{ backgroundColor: theme.colors.background }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Bills List</h2>
          <button className="text-white px-6 py-2 rounded-lg hover:opacity-90 transition" style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radius.button }}>
            + Create Bill
          </button>
        </div>
        
        <div className="text-center py-12 text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>No bills created yet</p>
          <p className="text-sm mt-2">Create your first bill to get started</p>
        </div>
      </div>
    </div>
  );
}
