import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/app/context/AuthContext';
import { ConfirmActionDialog, type ConfirmActionState } from '@/app/components/ConfirmActionDialog';
import { parseApiError } from '@/app/utils/api';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

const panelStyle = {
  background: 'var(--relic-panel-bg)',
  border: '1px solid var(--relic-border)',
  backdropFilter: 'blur(12px)',
} as const;

const cardStyle = {
  background: 'var(--relic-card-grid)',
  border: '1px solid var(--relic-card-grid-border)',
} as const;

const inputStyle =
  'w-full rounded-xl px-4 py-3 text-sm bg-[var(--relic-input-bg)] border border-[var(--relic-border)] text-[var(--relic-text)] placeholder:text-[var(--relic-text-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--relic-accent-bright)] transition-shadow';

const btnGrad = 'linear-gradient(135deg, var(--relic-accent-bright) 0%, var(--relic-accent-deep) 100%)';

type RelicEntry = {
  id: number;
  relic_id: string;
  relic_name: string;
  relic_image_url: string | null;
  created_at: string;
};

type Tab = 'favorites' | 'history' | 'settings';

export function ProfilePage() {
  const { user, isAuthenticated } = useAuth();

  const [tab, setTab] = useState<Tab>('favorites');
  const [confirm, setConfirm] = useState<ConfirmActionState | null>(null);
  const [favorites, setFavorites] = useState<RelicEntry[]>([]);
  const [history, setHistory] = useState<RelicEntry[]>([]);
  const [favLoading, setFavLoading] = useState(true);
  const [histLoading, setHistLoading] = useState(true);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMsg, setPwMsg] = useState<string | null>(null);

  const fetchFavorites = useCallback(() => {
    if (!user) return;
    setFavLoading(true);
    fetch('/users/me/favorites', {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: unknown[]) => setFavorites(Array.isArray(data) ? (data as RelicEntry[]) : []))
      .catch(() => {})
      .finally(() => setFavLoading(false));
  }, [user]);

  const fetchHistory = useCallback(() => {
    if (!user) return;
    setHistLoading(true);
    fetch('/users/me/history', {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: unknown[]) => setHistory(Array.isArray(data) ? (data as RelicEntry[]) : []))
      .catch(() => {})
      .finally(() => setHistLoading(false));
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchFavorites();
      fetchHistory();
    }
  }, [user, fetchFavorites, fetchHistory]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const removeFavorite = (relicId: string, relicName: string) => {
    setConfirm({
      title: 'Remove favorite?',
      description: `Remove "${relicName}" from your favorites?`,
      confirmLabel: 'Remove',
      destructive: true,
      onConfirm: async () => {
        if (!user) return;
        setConfirm(null);
        try {
          const res = await fetch(`/users/me/favorites/${encodeURIComponent(relicId)}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${user.token}` },
          });
          if (!res.ok) {
            toast.error(await parseApiError(res));
            return;
          }
          setFavorites((prev) => prev.filter((f) => f.relic_id !== relicId));
          toast.success('Removed from favorites');
        } catch {
          toast.error('Failed to remove favorite');
        }
      },
    });
  };

  const clearHistory = () => {
    setConfirm({
      title: 'Clear all history?',
      description: 'This will remove your entire browsing history. This cannot be undone.',
      confirmLabel: 'Clear all',
      destructive: true,
      onConfirm: async () => {
        if (!user) return;
        setConfirm(null);
        try {
          const res = await fetch('/users/me/history', {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${user.token}` },
          });
          if (!res.ok) {
            toast.error(await parseApiError(res));
            return;
          }
          setHistory([]);
          toast.success('History cleared');
        } catch {
          toast.error('Failed to clear history');
        }
      },
    });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setPwMsg(null);
    try {
      const res = await fetch('/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setPwMsg(data.detail || 'Failed to change password');
        return;
      }
      setPwMsg('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setPwMsg('Failed to change password');
    }
  };

  const tabLabel = (t: Tab) => {
    if (t === 'favorites') return 'Favorites';
    if (t === 'history') return 'History';
    return 'Settings';
  };

  const tabBtnStyle = (t: Tab) =>
    `px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
      tab === t ? '' : ''
    }`;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  return (
    <div
      className="min-h-screen pt-24 sm:pt-28 pb-20 sm:pb-24 px-3 sm:px-4 md:px-10 max-w-[1100px] w-full min-w-0 mx-auto"
      style={{ background: 'var(--relic-page)' }}
    >
      <div className="rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 mb-10" style={panelStyle}>
        <h1
          className="text-2xl sm:text-3xl lg:text-4xl mb-2"
          style={{ fontFamily: "'Playfair Display', serif", color: 'var(--relic-text)' }}
        >
          My Profile
        </h1>
        <p
          className="text-sm sm:text-base mb-8"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: 'var(--relic-text-muted)' }}
        >
          Signed in as <strong>{user?.username}</strong>
        </p>

        <div className="grid grid-cols-1 gap-2 mb-8 min-[420px]:flex min-[420px]:flex-wrap">
          {(['favorites', 'history', 'settings'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={tabBtnStyle(t)}
              style={{
                fontFamily: "'Inter', sans-serif",
                color: tab === t ? 'var(--relic-btn-primary-fg)' : 'var(--relic-ghost-btn-text)',
                background:
                  tab === t
                    ? btnGrad
                    : 'transparent',
                border: tab === t ? 'none' : '1px solid var(--relic-border-accent)',
              }}
            >
              {tabLabel(t)}
            </button>
          ))}
        </div>

        {tab === 'favorites' ? (
          <section>
            {favLoading ? (
              <p className="text-sm" style={{ fontFamily: "'Inter', sans-serif", color: 'var(--relic-text-muted)' }}>
                Loading...
              </p>
            ) : favorites.length === 0 ? (
              <p className="text-sm" style={{ fontFamily: "'Inter', sans-serif", color: 'var(--relic-text-subtle)' }}>
                No favorites yet
              </p>
            ) : (
              <ul className="grid min-w-0 gap-5 sm:gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {favorites.map((f) => (
                  <li key={f.id} className="flex flex-col">
                    <Link
                      to={`/relics/${encodeURIComponent(f.relic_id)}`}
                      className="flex-1 rounded-2xl overflow-hidden transition-transform duration-200 hover:-translate-y-1 no-underline"
                      style={cardStyle}
                    >
                      <div className="h-36 overflow-hidden">
                        <ImageWithFallback
                          src={f.relic_image_url || ''}
                          alt={f.relic_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <p
                          className="font-semibold line-clamp-2 mb-1"
                          style={{ fontFamily: "'Playfair Display', serif", color: 'var(--relic-text)', fontSize: '0.95rem' }}
                        >
                          {f.relic_name}
                        </p>
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeFavorite(f.relic_id, f.relic_name)}
                      className="mt-2 w-full rounded-full py-2 text-xs font-medium transition-colors"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        color: 'var(--relic-ghost-btn-text)',
                        border: '1px solid var(--relic-border-accent)',
                      }}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : tab === 'history' ? (
          <section>
            {histLoading ? (
              <p className="text-sm" style={{ fontFamily: "'Inter', sans-serif", color: 'var(--relic-text-muted)' }}>
                Loading...
              </p>
            ) : history.length === 0 ? (
              <p className="text-sm" style={{ fontFamily: "'Inter', sans-serif", color: 'var(--relic-text-subtle)' }}>
                No history yet
              </p>
            ) : (
              <>
                <div className="mb-4 flex justify-end">
                  <button
                    type="button"
                    onClick={clearHistory}
                    className="rounded-full px-4 py-2 text-xs font-medium transition-colors"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      color: 'var(--relic-ghost-btn-text)',
                      border: '1px solid var(--relic-border-accent)',
                    }}
                  >
                    Clear All History
                  </button>
                </div>
                <ul className="grid min-w-0 gap-5 sm:gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {history.map((h) => (
                    <li key={h.id}>
                      <Link
                        to={`/relics/${encodeURIComponent(h.relic_id)}`}
                        className="block rounded-2xl overflow-hidden transition-transform duration-200 hover:-translate-y-1 no-underline"
                        style={cardStyle}
                      >
                        <div className="h-36 overflow-hidden">
                          <ImageWithFallback
                            src={h.relic_image_url || ''}
                            alt={h.relic_name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-4">
                          <p
                            className="font-semibold line-clamp-2 mb-1"
                            style={{ fontFamily: "'Playfair Display', serif", color: 'var(--relic-text)', fontSize: '0.95rem' }}
                          >
                            {h.relic_name}
                          </p>
                          <p
                            className="text-xs"
                            style={{ fontFamily: "'Inter', sans-serif", color: 'var(--relic-text-subtle)' }}
                          >
                            Viewed on {formatDate(h.created_at)}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        ) : (
          <section>
            <div className="max-w-md min-w-0">
              <div className="mb-6">
                <label
                  className="block mb-1.5 text-sm font-medium"
                  style={{ fontFamily: "'Inter', sans-serif", color: 'var(--relic-text)' }}
                >
                  Username
                </label>
                <input
                  type="text"
                  className={inputStyle}
                  value={user?.username || ''}
                  disabled
                />
              </div>
              <form onSubmit={handleChangePassword} className="flex flex-col gap-5 pt-6 border-t" style={{ borderColor: 'var(--relic-border)' }}>
                <h2
                  className="text-lg"
                  style={{ fontFamily: "'Playfair Display', serif", color: 'var(--relic-text)' }}
                >
                  Change Password
                </h2>
                <div>
                  <label
                    className="block mb-1.5 text-sm font-medium"
                    style={{ fontFamily: "'Inter', sans-serif", color: 'var(--relic-text)' }}
                    htmlFor="pw-current"
                  >
                    Current Password
                  </label>
                  <input
                    id="pw-current"
                    type="password"
                    className={inputStyle}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    autoComplete="current-password"
                  />
                </div>
                <div>
                  <label
                    className="block mb-1.5 text-sm font-medium"
                    style={{ fontFamily: "'Inter', sans-serif", color: 'var(--relic-text)' }}
                    htmlFor="pw-new"
                  >
                    New Password
                  </label>
                  <input
                    id="pw-new"
                    type="password"
                    className={inputStyle}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label
                    className="block mb-1.5 text-sm font-medium"
                    style={{ fontFamily: "'Inter', sans-serif", color: 'var(--relic-text)' }}
                    htmlFor="pw-confirm"
                  >
                    Confirm New Password
                  </label>
                  <input
                    id="pw-confirm"
                    type="password"
                    className={inputStyle}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    autoComplete="new-password"
                  />
                </div>
                {pwMsg ? (
                  <p
                    className="text-sm"
                    style={{ fontFamily: "'Inter', sans-serif", color: 'var(--relic-accent-bright)' }}
                  >
                    {pwMsg}
                  </p>
                ) : null}
                <button
                  type="submit"
                  className="w-full rounded-full py-3 text-base font-medium transition-opacity"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    background: btnGrad,
                    color: 'var(--relic-btn-primary-fg)',
                  }}
                >
                  Save Changes
                </button>
              </form>
            </div>
          </section>
        )}
      </div>

      <ConfirmActionDialog
        state={confirm}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
      />
    </div>
  );
}