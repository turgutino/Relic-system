import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/app/context/AuthContext';
import { parseApiError } from '@/app/utils/api';

type AdminStats = {
  total_users: number;
  total_favorites: number;
  total_history: number;
  total_comments: number;
  total_subscribers: number;
};

const cardBg = { background: '#1a1a2e', border: '1px solid #2a2a3d' };

const cards: { key: keyof AdminStats; label: string; color: string }[] = [
  { key: 'total_users', label: 'Total Users', color: '#6366f1' },
  { key: 'total_favorites', label: 'Total Favorites', color: '#f59e0b' },
  { key: 'total_history', label: 'Total History', color: '#10b981' },
  { key: 'total_comments', label: 'Total Comments', color: '#ec4899' },
  { key: 'total_subscribers', label: 'Total Subscribers', color: '#06b6d4' },
];

export function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(() => {
    if (!user) return;
    setLoading(true);
    fetch('/admin/stats', {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          toast.error(await parseApiError(res));
          return null;
        }
        return res.json();
      })
      .then((data) => setStats(data as AdminStats | null))
      .catch(() => {
        toast.error('Failed to load stats');
        setStats(null);
      })
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
        Dashboard
      </h1>

      {!user ? (
        <p className="text-white/50 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>Not authenticated</p>
      ) : loading ? (
        <p className="text-white/50 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>Loading...</p>
      ) : !stats ? (
        <p className="text-red-400 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>Failed to load stats</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div key={card.key} className="rounded-2xl p-6" style={cardBg}>
              <p className="text-xs uppercase tracking-wide text-white/40 mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                {card.label}
              </p>
              <p className="text-3xl font-bold" style={{ fontFamily: "'Inter', sans-serif", color: card.color }}>
                {(stats[card.key] ?? 0).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}