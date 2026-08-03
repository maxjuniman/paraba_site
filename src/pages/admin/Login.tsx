import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { apiErrorMessage } from '@/lib/api';
import { isProfessor } from '@/lib/session';
import './Login.css';

export function AdminLoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (user && isProfessor(user)) {
    return <Navigate to="/admin" replace />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      setLoading(true);
      await login(email, senha);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, 'Nao foi possivel entrar.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="card login-card stack" onSubmit={onSubmit}>
        <div className="login-brand">
          <img src="/logo.png" alt="Equipe Paraba" />
          <h1>Admin</h1>
          <p className="muted">Acesso exclusivo para professores.</p>
        </div>
        {error ? <div className="error-box">{error}</div> : null}
        <div>
          <label className="label" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            className="input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="senha">
            Senha
          </label>
          <input
            id="senha"
            className="input"
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
        <p className="muted" style={{ margin: 0, textAlign: 'center' }}>
          Ainda não tem conta?{' '}
          <Link to="/admin/register" style={{ fontWeight: 800 }}>
            Criar conta
          </Link>
        </p>
        <Link className="btn btn-ghost" to="/">
          Voltar ao site
        </Link>
      </form>
    </div>
  );
}
