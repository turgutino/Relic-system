import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/app/layout/AppShell';
import { HomeLanding } from '@/app/pages/HomeLanding';
import { CatalogPage } from '@/app/pages/CatalogPage';
import { RelicDetailPage } from '@/app/pages/RelicDetailPage';
import { StatsDashboardPage } from '@/app/pages/StatsDashboardPage';
import { ComparePage } from '@/app/pages/ComparePage';

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomeLanding />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/relics/:id" element={<RelicDetailPage />} />
        <Route path="/stats" element={<StatsDashboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
