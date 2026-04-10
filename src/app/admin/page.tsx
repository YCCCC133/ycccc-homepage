// Server component - forces dynamic rendering
export const dynamic = 'force-dynamic';

import AdminLoginPage from './admin-login-page';

export default function AdminPage() {
  return <AdminLoginPage />;
}
