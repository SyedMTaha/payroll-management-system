import FleetPage from '@/components/dashboard/FleetPage';
import ProtectedRoute from '@/components/ProtectedRoute';

export const metadata = {
  title: 'Fleet Management - Payroll Dashboard',
  description: 'Manage fleet payment data',
};

export default function Fleet() {
  return (
    <ProtectedRoute>
      <FleetPage />
    </ProtectedRoute>
  );
}
