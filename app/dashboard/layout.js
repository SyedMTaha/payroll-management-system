import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';

export default function DashboardLayout({ children }) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50 w-screen overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col ml-0 lg:ml-64 w-full">
          <Header />
          
          <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 w-full">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
