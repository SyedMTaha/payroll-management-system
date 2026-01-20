import CaptainsPage from '@/components/dashboard/CaptainsPage';
import ProtectedRoute from '@/components/ProtectedRoute';

export const metadata = {
  title: 'Captains Management - Payroll Dashboard',
  description: 'Manage captain and driver data',
};

export default function Captains() {
  return (
    <ProtectedRoute>
      <CaptainsPage />
    </ProtectedRoute>
  );
}
