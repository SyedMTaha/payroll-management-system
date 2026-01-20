'use client';

import { useAuth } from '@/context/AuthContext';
import { theme } from '@/lib/theme';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function DashboardHome() {
  const { user, userRole } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalCaptains: 0,
    totalFleetPayments: 0,
    totalPayments: 0,
    totalTips: 0,
    activeCaptains: 0,
  });
  const [loading, setLoading] = useState(true);

  // Fetch real data from Firestore
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        // Fetch captains
        const captainsSnapshot = await getDocs(collection(db, 'captains'));
        const captainsData = captainsSnapshot.docs.map(doc => doc.data());
        const activeCaptains = captainsData.filter(c => c.qualificationStatus === 'Active').length;

        // Fetch fleet payments
        const fleetSnapshot = await getDocs(collection(db, 'fleet'));
        const fleetData = fleetSnapshot.docs.map(doc => doc.data());
        
        // Calculate totals
        const totalPayments = fleetData.reduce((sum, f) => sum + (f.totalDriverPayment || 0), 0);
        const totalTips = fleetData.reduce((sum, f) => sum + (f.tips || 0), 0);

        setStats({
          totalCaptains: captainsData.length,
          totalFleetPayments: fleetData.length,
          totalPayments: totalPayments,
          totalTips: totalTips,
          activeCaptains: activeCaptains,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statsCards = [
    {
      title: 'Total Captains',
      value: loading ? '...' : stats.totalCaptains.toString(),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      bgColor: theme.colors.primary,
    },
    {
      title: 'Active Captains',
      value: loading ? '...' : stats.activeCaptains.toString(),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: theme.colors.primary,
    },
    {
      title: 'Fleet Payments',
      value: loading ? '...' : stats.totalFleetPayments.toString(),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      bgColor: theme.colors.primary,
    },
    {
      title: 'Total Payments',
      value: loading ? '...' : `AED ${stats.totalPayments.toFixed(2)}`,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: theme.colors.primary,
    },
  ];

  return (
    <div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
            style={{ backgroundColor: theme.colors.background }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
              </div>
              <div className="p-3 rounded-lg text-white" style={{ backgroundColor: stat.bgColor }}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8" style={{ backgroundColor: theme.colors.background }}>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => router.push('/dashboard/employees')}
            className="flex items-center justify-center space-x-2 text-white px-6 py-4 rounded-lg hover:opacity-90 transition" 
            style={{ backgroundColor: theme.colors.primary }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Employee</span>
          </button>
          <button 
            onClick={() => router.push('/dashboard/captains')}
            className="flex items-center justify-center space-x-2 text-white px-6 py-4 rounded-lg hover:opacity-90 transition" 
            style={{ backgroundColor: theme.colors.primary }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Captain</span>
          </button>
          <button 
            onClick={() => router.push('/dashboard/fleet')}
            className="flex items-center justify-center space-x-2 text-white px-6 py-4 rounded-lg hover:opacity-90 transition" 
            style={{ backgroundColor: theme.colors.primary }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Fleet Payment</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-md p-6" style={{ backgroundColor: theme.colors.background }}>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
        <div className="text-center py-12 text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>No recent activity yet</p>
          <p className="text-sm mt-2">Start by adding employees or clients</p>
        </div>
      </div>
    </div>
  );
}
