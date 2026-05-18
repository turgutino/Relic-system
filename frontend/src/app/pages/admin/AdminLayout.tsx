import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/context/AuthContext';
import { ArrowLeft, LayoutDashboard, Users, MessageSquare, LogOut } from 'lucide-react';

const sidebarLink = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors no-underline ${
    isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white/80'
  }`;

const links = [
  { to: '/admin', end: true, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', end: false, label: 'Users', icon: Users },
  { to: '/admin/comments', end: false, label: 'Comments', icon: MessageSquare },
];

export function AdminLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: '/admin' }} />;
  }

  if (!user?.is_admin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#0f0f1a' }}>
      <aside
        className="fixed top-0 left-0 bottom-0 z-40 hidden w-64 flex-col border-r lg:flex"
        style={{ background: '#151525', borderColor: '#2a2a3d' }}
      >
        <div className="border-b px-6 py-6" style={{ borderColor: '#2a2a3d' }}>
          <h1 className="text-lg font-bold tracking-wide text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
            Admin Panel
          </h1>
          <p className="mt-1 text-xs text-white/40" style={{ fontFamily: "'Inter', sans-serif" }}>
            {user.username}
          </p>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-4 py-4">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={sidebarLink}>
              <link.icon size={18} />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex flex-col gap-1 border-t px-4 py-4" style={{ borderColor: '#2a2a3d' }}>
          <NavLink
            to="/"
            className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-white/60 transition-colors no-underline hover:bg-white/5 hover:text-white/80"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <ArrowLeft size={18} />
            Back to site
          </NavLink>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/', { replace: true });
            }}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white/80"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 lg:ml-64">
        <div className="border-b px-4 py-3 lg:hidden" style={{ background: '#151525', borderColor: '#2a2a3d' }}>
          <div className="flex flex-wrap items-center gap-2">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-xs font-medium no-underline ${
                    isActive ? 'bg-white/10 text-white' : 'text-white/60'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <NavLink to="/" className="ml-auto text-xs text-white/50 no-underline hover:text-white/80">
              Site
            </NavLink>
          </div>
        </div>
        <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
