import { Navigate, Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { isProfessor } from '@/lib/session';
import './AdminLayout.css';

const links = [
  { to: '/admin', end: true, label: 'Home' },
  { to: '/admin/alunos', label: 'Alunos' },
  { to: '/admin/autorizacoes', label: 'Autorizações' },
  { to: '/admin/presencas', label: 'Presenças' },
  { to: '/admin/pagamentos', label: 'Pagamentos' },
  { to: '/admin/calendario', label: 'Calendário' },
  { to: '/admin/depoimentos', label: 'Depoimentos' },
  { to: '/admin/configuracoes', label: 'Configurações' },
];

export function RequireProfessor() {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user || !isProfessor(user)) return <Navigate to="/admin/login" replace />;
  return <Outlet />;
}

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <img src="/logo.png" alt="Equipe Paraba" />
          <div>
            <strong>Equipe Paraba</strong>
            <span>Painel admin</span>
          </div>
        </div>
        <nav className="admin-nav">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => (isActive ? 'active' : '')}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-user">
          <div>
            <strong>{user?.nome}</strong>
            <span className="muted">{user?.email}</span>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              logout();
              navigate('/admin/login');
            }}
          >
            Sair
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
