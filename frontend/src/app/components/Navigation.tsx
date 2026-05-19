import { motion } from 'motion/react';
import { Menu, Shield, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/app/components/LanguageSwitcher';
import { ThemeToggle } from '@/app/components/ThemeToggle';
import { useAuth } from '@/app/context/AuthContext';

const navGrad = 'linear-gradient(135deg, var(--relic-accent-bright) 0%, var(--relic-accent-deep) 100%)';

export function Navigation() {
  const { t } = useTranslation();
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const desktopLink =
    'relative py-1 text-[0.9rem] tracking-wide transition-colors font-[family-name:Inter,sans-serif]';

  const linkInactive = `${desktopLink} text-[var(--relic-text-muted)] hover:text-[var(--relic-text-hover)]`;
  const linkActive = `${desktopLink} text-[var(--relic-accent-bright)]`;

  return (
    <motion.nav
      aria-label={t('nav.ariaLabel')}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
      className="fixed top-0 left-0 right-0 z-[60] px-1.5 py-1.5 sm:px-4 sm:py-4 min-[1360px]:px-10 min-[1360px]:py-6"
    >
      <div
        className="max-w-[1800px] mx-auto flex items-center justify-between gap-2 px-2.5 py-2 sm:px-4 sm:py-3.5 min-[1360px]:px-8 min-[1360px]:py-4 rounded-2xl sm:rounded-full backdrop-blur-xl transition-colors min-w-0"
        style={{
          background: 'var(--relic-nav-bg)',
          border: '1px solid var(--relic-nav-border)',
        }}
      >
        <NavLink
          to="/"
          className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 py-0.5 no-underline min-[1360px]:flex-initial min-[1360px]:max-w-none min-[1360px]:py-0"
        >
          <motion.div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 min-[1360px]:flex-initial" whileHover={{ scale: 1.02 }}>
            <div
              className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full flex items-center justify-center"
              style={{
                background: navGrad,
              }}
            >
              <span
                className="font-bold"
                style={{ fontFamily: "'Playfair Display', serif", color: 'var(--relic-logo-inner)' }}
              >
                O
              </span>
            </div>
            <span
              className="min-w-0 flex-1 truncate text-[0.78rem] leading-[1.2] tracking-wide sm:text-base sm:leading-snug min-[1360px]:flex-initial min-[1360px]:text-lg"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                color: 'var(--relic-text)',
              }}
            >
              {t('nav.brand')}
            </span>
          </motion.div>
        </NavLink>

        <div className="hidden min-[1360px]:flex items-center gap-5 min-[1360px]:gap-8 shrink-0">
          <NavLink to="/catalog" className={({ isActive }) => (isActive ? linkActive : linkInactive)}>
            {t('nav.catalog')}
          </NavLink>
          <NavLink to="/stats" className={({ isActive }) => (isActive ? linkActive : linkInactive)}>
            {t('nav.stats')}
          </NavLink>
          <a href="/#collections" className={linkInactive}>
            {t('nav.featured')}
          </a>
          <a href="/#about" className={linkInactive}>
            {t('nav.about')}
          </a>
        </div>

        <div className="hidden min-[1360px]:flex items-center gap-2 min-[1360px]:gap-3 shrink-0">
          <ThemeToggle />
          <LanguageSwitcher />
          {isAuthenticated ? (
            <>
              <NavLink
                to="/profile"
                className="px-4 py-2 rounded-full text-sm font-medium no-underline transition-colors"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  color: 'var(--relic-ghost-btn-text)',
                  border: '1px solid var(--relic-border-accent)',
                }}
              >
                Profile
              </NavLink>
              {user?.is_admin ? (
                <NavLink
                  to="/admin"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium no-underline transition-colors"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    color: 'var(--relic-ghost-btn-text)',
                    border: '1px solid var(--relic-border-accent)',
                  }}
                >
                  <Shield size={14} aria-hidden />
                  Admin
                </NavLink>
              ) : null}
              <span
                className="text-sm font-medium px-2"
                style={{ fontFamily: "'Inter', sans-serif", color: 'var(--relic-text)' }}
              >
                {user?.username}
              </span>
              <button
                type="button"
                onClick={() => { logout(); navigate('/', { replace: true }); }}
                className="px-4 py-2 rounded-full text-sm font-medium transition-colors"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  color: 'var(--relic-ghost-btn-text)',
                  border: '1px solid var(--relic-border-accent)',
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className="px-4 py-2 rounded-full text-sm font-medium no-underline transition-colors"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  color: 'var(--relic-ghost-btn-text)',
                  border: '1px solid var(--relic-border-accent)',
                }}
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                className="px-4 py-2 rounded-full text-sm font-medium no-underline"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  background: navGrad,
                  color: 'var(--relic-btn-primary-fg)',
                }}
              >
                Register
              </NavLink>
            </>
          )}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <NavLink
              to="/catalog"
              className="inline-block px-4 py-2 min-[1360px]:px-6 rounded-full no-underline transition-colors whitespace-nowrap"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.9rem',
                color: 'var(--relic-ghost-btn-text)',
                border: '1px solid var(--relic-border-accent)',
              }}
            >
              {t('nav.browseArchive')}
            </NavLink>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <NavLink
              to="/stats"
              className="inline-block px-4 py-2 min-[1360px]:px-6 rounded-full no-underline whitespace-nowrap"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.9rem',
                background: navGrad,
                color: 'var(--relic-btn-primary-fg)',
              }}
            >
              {t('nav.viewInsights')}
            </NavLink>
          </motion.div>
        </div>

        <button
          type="button"
          className="shrink-0 min-[1360px]:hidden min-h-10 min-w-10 inline-flex items-center justify-center rounded-lg"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          style={{ color: 'var(--relic-accent-bright)' }}
          aria-expanded={isMenuOpen}
          aria-label={t('nav.toggleMenu')}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isMenuOpen ? (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="min-[1360px]:hidden mt-3 sm:mt-4 mx-0 sm:mx-0 p-4 sm:p-6 rounded-2xl sm:rounded-3xl backdrop-blur-xl transition-colors max-h-[min(78vh,calc(100dvh_-_5rem))] overflow-y-auto overscroll-contain"
          style={{
            background: 'var(--relic-mobile-nav-bg)',
            border: '1px solid var(--relic-border)',
          }}
        >
          <div className="flex flex-col gap-4">
            <NavLink
              to="/catalog"
              className="py-2 no-underline"
              style={{ fontFamily: "'Inter', sans-serif", color: 'var(--relic-text-muted)' }}
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.catalog')}
            </NavLink>
            <NavLink
              to="/stats"
              className="py-2 no-underline"
              style={{ fontFamily: "'Inter', sans-serif", color: 'var(--relic-text-muted)' }}
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.stats')}
            </NavLink>
            <a
              href="/#collections"
              className="py-2"
              style={{ fontFamily: "'Inter', sans-serif", color: 'var(--relic-text-muted)' }}
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.featured')}
            </a>
            <a
              href="/#about"
              className="py-2"
              style={{ fontFamily: "'Inter', sans-serif", color: 'var(--relic-text-muted)' }}
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.about')}
            </a>
            <div className="flex flex-wrap items-center gap-3 py-2">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>
            <div className="py-2 border-t" style={{ borderColor: 'var(--relic-border)' }}>
              {isAuthenticated ? (
                <div className="flex flex-col gap-3">
                  <span
                    className="text-sm font-medium"
                    style={{ fontFamily: "'Inter', sans-serif", color: 'var(--relic-text)' }}
                  >
                    Signed in as <strong>{user?.username}</strong>
                  </span>
                  <NavLink
                    to="/profile"
                    className="block w-full py-3 rounded-full text-center no-underline text-sm font-medium"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      color: 'var(--relic-ghost-btn-text)',
                      border: '1px solid var(--relic-border-accent)',
                    }}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </NavLink>
                  {user?.is_admin ? (
                    <NavLink
                      to="/admin"
                      className="flex w-full items-center justify-center gap-2 py-3 rounded-full text-center no-underline text-sm font-medium"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        color: 'var(--relic-ghost-btn-text)',
                        border: '1px solid var(--relic-border-accent)',
                      }}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Shield size={16} aria-hidden />
                      Admin Panel
                    </NavLink>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => { logout(); setIsMenuOpen(false); navigate('/', { replace: true }); }}
                    className="w-full py-3 rounded-full text-center text-sm font-medium"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      color: 'var(--relic-ghost-btn-text)',
                      border: '1px solid var(--relic-border-accent)',
                    }}
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <NavLink
                    to="/login"
                    className="block w-full py-3 rounded-full text-center no-underline text-sm font-medium"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      color: 'var(--relic-ghost-btn-text)',
                      border: '1px solid var(--relic-border-accent)',
                    }}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </NavLink>
                  <NavLink
                    to="/register"
                    className="block w-full py-3 rounded-full text-center no-underline text-sm font-medium"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      background: navGrad,
                      color: 'var(--relic-btn-primary-fg)',
                    }}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Register
                  </NavLink>
                </div>
              )}
            </div>
            <div className="pt-4 border-t" style={{ borderColor: 'var(--relic-border)' }}>
              <NavLink
                to="/catalog"
                className="block w-full py-3 rounded-full mb-3 text-center no-underline"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  color: 'var(--relic-ghost-btn-text)',
                  border: '1px solid var(--relic-border-accent)',
                }}
                onClick={() => setIsMenuOpen(false)}
              >
                {t('nav.browseArchive')}
              </NavLink>
              <NavLink
                to="/stats"
                className="block w-full py-3 rounded-full text-center no-underline"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  background: navGrad,
                  color: 'var(--relic-btn-primary-fg)',
                }}
                onClick={() => setIsMenuOpen(false)}
              >
                {t('nav.viewInsights')}
              </NavLink>
            </div>
          </div>
        </motion.div>
      ) : null}
    </motion.nav>
  );
}
