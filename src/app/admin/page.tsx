// Server component - forces dynamic rendering
export const dynamic = 'force-dynamic';

import AdminDashboard from './admin-dashboard';

export default function AdminPage() {
  return <AdminDashboard />;
}
