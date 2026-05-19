import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/app/context/AuthContext';
import { ConfirmActionDialog, type ConfirmActionState } from '@/app/components/ConfirmActionDialog';
import { parseApiError } from '@/app/utils/api';

type UserRow = {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
};

const thStyle = 'text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white/50';
const tdStyle = 'px-4 py-3 text-sm text-white/80 align-top break-words';
const btnBase =
  'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

const panelBg = { background: '#1a1a2e', border: '1px solid #2a2a3d' };

export function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<ConfirmActionState | null>(null);

  const fetchUsers = useCallback(() => {
    if (!user) return;
    setLoading(true);
    fetch('/admin/users', {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          toast.error(await parseApiError(res));
          return [];
        }
        return res.json();
      })
      .then((data: unknown[]) => setUsers(Array.isArray(data) ? (data as UserRow[]) : []))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const runAction = async (
    url: string,
    method: string,
    successMessage: string,
  ) => {
    if (!user) return;
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${user.token}` },
    });
    if (!res.ok) {
      toast.error(await parseApiError(res));
      return;
    }
    toast.success(successMessage);
    fetchUsers();
  };

  const requestBan = (target: UserRow) => {
    const banning = target.is_active;
    setConfirm({
      title: banning ? 'Ban user?' : 'Unban user?',
      description: banning
        ? `${target.username} will be unable to sign in. Their existing comments will remain visible.`
        : `${target.username} will be able to sign in again.`,
      confirmLabel: banning ? 'Ban' : 'Unban',
      destructive: banning,
      onConfirm: async () => {
        setConfirm(null);
        await runAction(
          `/admin/users/${target.id}/ban`,
          'PUT',
          banning ? `${target.username} has been banned` : `${target.username} has been unbanned`,
        );
      },
    });
  };

  const requestAdminToggle = (target: UserRow) => {
    const promoting = !target.is_admin;
    setConfirm({
      title: promoting ? 'Grant admin access?' : 'Remove admin access?',
      description: promoting
        ? `${target.username} will have full admin panel access.`
        : `${target.username} will lose admin privileges.`,
      confirmLabel: promoting ? 'Make Admin' : 'Remove Admin',
      destructive: !promoting,
      onConfirm: async () => {
        setConfirm(null);
        await runAction(
          `/admin/users/${target.id}/make-admin`,
          'PUT',
          promoting ? `${target.username} is now an admin` : `Admin access removed from ${target.username}`,
        );
      },
    });
  };

  const requestDelete = (target: UserRow) => {
    setConfirm({
      title: 'Delete user permanently?',
      description: `This will delete ${target.username}'s account, comments, favorites, and history. This cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        setConfirm(null);
        await runAction(
          `/admin/users/${target.id}`,
          'DELETE',
          `${target.username} has been deleted`,
        );
      },
    });
  };

  const isSelf = (id: number) => user?.id === id;

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
        Users
      </h1>

      {loading ? (
        <p className="text-white/50 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>Loading...</p>
      ) : (
        <div className="max-w-full overflow-hidden rounded-2xl" style={panelBg}>
          <div className="max-w-full overflow-x-auto [scrollbar-gutter:stable]">
            <table className="w-full min-w-[720px]" style={{ fontFamily: "'Inter', sans-serif" }}>
              <thead style={{ background: '#151525' }}>
                <tr>
                  <th className={thStyle}>ID</th>
                  <th className={thStyle}>Username</th>
                  <th className={thStyle}>Email</th>
                  <th className={thStyle}>Active</th>
                  <th className={thStyle}>Admin</th>
                  <th className={thStyle}>Created</th>
                  <th className={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t" style={{ borderColor: '#2a2a3d' }}>
                    <td className={tdStyle}>{u.id}</td>
                    <td className={tdStyle}>
                      {u.username}
                      {isSelf(u.id) ? (
                        <span className="ml-2 text-xs text-white/40">(you)</span>
                      ) : null}
                    </td>
                    <td className={tdStyle} style={{ color: '#ffffff66' }}>{u.email}</td>
                    <td className={tdStyle}>
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {u.is_active ? 'Active' : 'Banned'}
                      </span>
                    </td>
                    <td className={tdStyle}>
                      {u.is_admin ? (
                        <span className="inline-block rounded-full px-2 py-0.5 text-xs font-medium bg-indigo-500/20 text-indigo-400">
                          Admin
                        </span>
                      ) : (
                        <span className="text-white/30 text-xs">—</span>
                      )}
                    </td>
                    <td className={tdStyle} style={{ color: '#ffffff66' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className={tdStyle}>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => requestBan(u)}
                          disabled={isSelf(u.id)}
                          title={isSelf(u.id) ? 'You cannot ban yourself' : undefined}
                          className={btnBase}
                          style={{
                            color: u.is_active ? '#f87171' : '#34d399',
                            background: u.is_active ? 'rgba(248,113,113,0.1)' : 'rgba(52,211,153,0.1)',
                            border: `1px solid ${u.is_active ? 'rgba(248,113,113,0.3)' : 'rgba(52,211,153,0.3)'}`,
                          }}
                        >
                          {u.is_active ? 'Ban' : 'Unban'}
                        </button>
                        <button
                          type="button"
                          onClick={() => requestAdminToggle(u)}
                          disabled={isSelf(u.id)}
                          title={isSelf(u.id) ? 'You cannot change your own admin role' : undefined}
                          className={btnBase}
                          style={{
                            color: u.is_admin ? '#fbbf24' : '#a78bfa',
                            background: u.is_admin ? 'rgba(251,191,36,0.1)' : 'rgba(167,139,250,0.1)',
                            border: `1px solid ${u.is_admin ? 'rgba(251,191,36,0.3)' : 'rgba(167,139,250,0.3)'}`,
                          }}
                        >
                          {u.is_admin ? 'Remove Admin' : 'Make Admin'}
                        </button>
                        <button
                          type="button"
                          onClick={() => requestDelete(u)}
                          disabled={isSelf(u.id)}
                          title={isSelf(u.id) ? 'You cannot delete your own account' : undefined}
                          className={btnBase}
                          style={{
                            color: '#f87171',
                            background: 'rgba(248,113,113,0.1)',
                            border: '1px solid rgba(248,113,113,0.3)',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 ? (
            <p className="px-4 py-8 text-center text-white/30 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
              No users found
            </p>
          ) : null}
        </div>
      )}

      <ConfirmActionDialog
        state={confirm}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
      />
    </div>
  );
}
