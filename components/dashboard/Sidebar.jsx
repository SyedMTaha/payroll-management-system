'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { MdDashboard, MdPeople, MdAttachMoney, MdReceiptLong, MdReceipt, MdBusiness, MdSettings, MdLogout } from 'react-icons/md';
import { theme } from '@/lib/theme';

const navItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: MdDashboard,
  },
  {
    name: 'Employees',
    href: '/dashboard/employees',
    icon: MdPeople,
  },
  {
    name: 'Payroll',
    href: '/dashboard/payroll',
    icon: MdAttachMoney,
  },
  {
    name: 'Companies',
    href: '/dashboard/companies',
    icon: MdBusiness,
  },
  {
    name: 'Bills',
    href: '/dashboard/bills',
    icon: MdReceiptLong,
  },
  {
    name: 'Expenses',
    href: '/dashboard/expenses',
    icon: MdReceipt,
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: MdSettings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 text-white shadow-xl z-40 transform transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 overflow-hidden flex flex-col`}
        style={{ backgroundColor: '#191919' }}
      >
        <div className="flex flex-col h-screen">
          {/* Logo/Brand */}
          <div className="shrink-0 p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
            <div className="flex items-center gap-3">
              <img src="/assets/logo/logo.png" alt="Logo" className="h-10 w-auto" />
              <span className="text-lg font-bold text-white">Pak Emirates</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 min-h-0 px-4 py-6 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'text-white shadow-md'
                      : 'text-white text-opacity-75 hover:text-opacity-100'
                  }`}
                  style={{
                    backgroundColor: isActive ? theme.colors.primary : 'transparent'
                  }}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info & logout */}
          <div className="shrink-0 p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
            <div className="flex items-center space-x-3 mb-3 px-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <span className="text-lg font-bold">
                  {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user?.displayName || 'User'}</p>
                <p className="text-xs text-white text-opacity-75 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition text-white"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#444444'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            >
              <MdLogout className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
        />
      )}
    </>
  );
}
