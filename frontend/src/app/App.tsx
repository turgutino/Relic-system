import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/app/layout/AppShell';
import { HomeLanding } from '@/app/pages/HomeLanding';
import { CatalogPage } from '@/app/pages/CatalogPage';
import { RelicDetailPage } from '@/app/pages/RelicDetailPage';
import { StatsDashboardPage } from '@/app/pages/StatsDashboardPage';
import { ComparePage } from '@/app/pages/ComparePage';
import { LoginPage } from '@/app/pages/LoginPage';
import { RegisterPage } from '@/app/pages/RegisterPage';
import { ProfilePage } from '@/app/pages/ProfilePage';
import CollectionsPage from '@/app/pages/CollectionsPage';
import { AdminLayout } from '@/app/pages/admin/AdminLayout';
import { AdminDashboard } from '@/app/pages/admin/AdminDashboard';
import { AdminUsers } from '@/app/pages/admin/AdminUsers';
import { AdminComments } from '@/app/pages/admin/AdminComments';
import { AuthProvider } from '@/app/context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="comments" element={<AdminComments />} />
        </Route>

        <Route
          path="*"
          element={
            <AppShell>
              <Routes>
                <Route path="/" element={<HomeLanding />} />
                <Route path="/catalog" element={<CatalogPage />} />
                <Route path="/compare" element={<ComparePage />} />
                <Route path="/relics/:id" element={<RelicDetailPage />} />
                <Route path="/stats" element={<StatsDashboardPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppShell>
          }
        />
      </Routes>
    </AuthProvider>
  );
}