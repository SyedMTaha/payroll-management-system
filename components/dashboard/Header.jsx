'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { theme } from '@/lib/theme';
import { IoNotificationsOutline } from 'react-icons/io5';
import { CiSearch } from 'react-icons/ci';

export default function Header() {
  const { user, userRole } = useAuth();
  const [hasUnread, setHasUnread] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="bg-white border-b px-6 py-4 lg:px-8" style={{ borderColor: theme.colors.secondary, backgroundColor: theme.colors.background }}>
      <div className="flex items-center justify-between gap-4">
        {/* Left Section: Welcome & Date */}
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold text-gray-800">Welcome back, {user?.displayName || 'User'}</h2>
          <div className="flex items-center text-sm text-gray-600 mt-1">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* Right Section: Search, Notifications, Role Badge */}
        <div className="flex items-center space-x-4">
          {/* Search Bar */}
          <div className="hidden md:flex items-center bg-white rounded-lg px-4 py-2 border border-gray-300 focus-within:border-teal-500 transition">
            <CiSearch className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="ml-2 bg-transparent outline-none text-sm w-40 placeholder-gray-400"
            />
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button className="relative p-2 text-gray-600 hover:text-gray-800 transition">
              <IoNotificationsOutline className="w-6 h-6" />
              {hasUnread && (
                <span 
                  className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: theme.colors.primary }}
                />
              )}
            </button>
          </div>

          {/* Role Badge */}
          <div className="hidden sm:block">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              userRole === 'owner' 
                ? 'bg-teal-100 text-teal-800' 
                : 'bg-teal-50 text-teal-700'
            }`} style={{
              backgroundColor: userRole === 'owner' ? 'rgba(41, 157, 145, 0.15)' : 'rgba(41, 157, 145, 0.08)',
              color: userRole === 'owner' ? theme.colors.primary : 'rgba(41, 157, 145, 0.8)',
            }}>
              {userRole?.toUpperCase() || 'USER'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
