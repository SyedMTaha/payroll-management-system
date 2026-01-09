'use client';

import { useAuth } from '@/context/AuthContext';

export default function Header() {
  const { user, userRole } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
          <p className="text-sm text-gray-600 mt-1">
            Welcome back, {user?.displayName || 'User'}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Role Badge */}
          <div className="hidden sm:block">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              userRole === 'owner' 
                ? 'bg-purple-100 text-purple-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {userRole?.toUpperCase() || 'USER'}
            </span>
          </div>

          {/* Current Date */}
          <div className="hidden md:flex items-center text-sm text-gray-600">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{new Date().toLocaleDateString('en-AE', { 
              weekday: 'short', 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            })}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
