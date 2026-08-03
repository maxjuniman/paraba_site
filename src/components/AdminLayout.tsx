import { useEffect, useRef, useState } from 'react';
import { Navigate, Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { canAccessAdmin, isProfessor } from '@/lib/session';
import './AdminLayout.css';

const professorLinks = [
  { to: '/admin', end: true, label: 'Home' },
  { to: '/admin/alunos', label: 'Alunos' },
  { to: '/admin/autorizacoes', label: 'Autorizações' },
  { to: '/admin/presencas', label: 'Presenças' },
  { to: '/admin/pagamentos', label: 'Pagamentos' },
  { to: '/admin/calendario', label: 'Calendário' },
  { to: '/admin/depoimentos', label: 'Depoimentos' },
  { to: '/admin/configuracoes', label: 'Configurações' },
] as const;

const alunoLinks = [
  { to: '/admin', end: true, label: 'Home' },
  { to: '/admin/equipe', label: 'Equipe' },
  { to: '/admin/calendario', label: 'Calendário' },
  { to: '/admin/depoimentos', label: 'Depoimentos' },
  { to: '/admin/configuracoes', label: 'Configurações' },
] as const;

export function RequireAuth() {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user || !canAccessAdmin(user)) return <Navigate to="/admin/login" replace />;
  return <Outlet />;
}

export function RequireProfessor() {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user || !isProfessor(user)) return <Navigate to="/admin" replace />;
  return <Outlet />;
}

function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const initial = (user?.nome?.trim().charAt(0) || '?').toUpperCase();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="admin-user-menu" ref={rootRef}>
      <button
        type="button"
        className="admin-user-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Abrir menu do usuário"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="admin-user-avatar" aria-hidden="true">
          {initial}
        </span>
      </button>

      {open ? (
        <div className="admin-user-dropdown" role="menu">
          <div className="admin-user-meta">
            <strong>{user?.nome}</strong>
            <span>{user?.email}</span>
          </div>
          <button
            type="button"
            className="admin-logout"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              logout();
              navigate('/admin/login');
            }}
          >
            Sair
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function AdminLayout() {
  const { user } = useAuth();
  const professor = isProfessor(user);
  const links = professor ? professorLinks : alunoLinks;

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <img src="/logo.png" alt="Equipe Paraba" />
          <div>
            <strong>Equipe Paraba</strong>
            <span>{professor ? 'Painel admin' : 'Área do aluno'}</span>
          </div>
        </div>
        <nav className="admin-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={'end' in link ? link.end : false}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="admin-content">
        <header className="admin-topbar">
          <div className="admin-topbar-spacer" />
          <UserMenu />
        </header>
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
