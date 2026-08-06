import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { apiErrorMessage } from '@/lib/api';
import { formatPhone, normalizePhoneWithBrazilCode } from '@/lib/formatters';
import { parabaService } from '@/lib/parabaService';
import { canAccessAdmin } from '@/lib/session';
import './Login.css';

function IconEye({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    );
  }

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function AdminRegisterPage() {
  const { user, acceptSession } = useAuth();
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [celular, setCelular] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successOpen, setSuccessOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (user && canAccessAdmin(user)) {
    return <Navigate to="/admin" replace />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (senha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (senha !== confirmacao) {
      setError('A confirmacao de senha nao confere.');
      return;
    }
    if (!celular.trim()) {
      setError('O celular é obrigatorio.');
      return;
    }

    try {
      setLoading(true);
      const response = await parabaService.cadastrarUsuario({
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        celular: normalizePhoneWithBrazilCode(celular),
        senha,
        confirmacao_senha: confirmacao,
      });

      const sessionUser = response.user ?? response.data;
      if (!response.accessToken || !sessionUser) {
        setSuccessMessage(response.message || 'Cadastro enviado. Aguarde o professor autorizar seu acesso.');
        setSuccessOpen(true);
        return;
      }

      acceptSession({ accessToken: response.accessToken, user: sessionUser });
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, 'Nao foi possivel criar a conta.'));
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    setSuccessOpen(false);
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="login-page">
      <form className="card login-card stack" onSubmit={onSubmit}>
        <div className="login-brand">
          <img src="/logo.png" alt="Equipe Paraba" />
          <h1>Criar conta</h1>
          <p className="muted">Cadastro de aluno para acessar o painel.</p>
        </div>
        {error ? <div className="error-box">{error}</div> : null}
        <div>
          <label className="label" htmlFor="nome">
            Nome
          </label>
          <input
            id="nome"
            className="input"
            autoComplete="name"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </div>
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
          <label className="label" htmlFor="celular">
            Celular
          </label>
          <input
            id="celular"
            className="input"
            inputMode="tel"
            autoComplete="tel"
            value={celular}
            onChange={(e) => setCelular(formatPhone(e.target.value))}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="senha">
            Senha
          </label>
          <div className="password-field">
            <input
              id="senha"
              className="input"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              <IconEye open={showPassword} />
            </button>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="confirmacao">
            Confirmar senha
          </label>
          <div className="password-field">
            <input
              id="confirmacao"
              className="input"
              type={showConfirmation ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmation((v) => !v)}
              aria-label={showConfirmation ? 'Ocultar confirmacao de senha' : 'Mostrar confirmacao de senha'}
            >
              <IconEye open={showConfirmation} />
            </button>
          </div>
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Criando...' : 'Criar conta'}
        </button>
        <Link className="btn btn-ghost" to="/admin/login">
          Já tenho conta
        </Link>
      </form>
      {successOpen ? (
        <div className="confirm-overlay" role="presentation" onClick={goToLogin}>
          <div
            className="confirm-dialog card stack"
            role="dialog"
            aria-modal="true"
            aria-labelledby="register-success-title"
            onClick={(event) => event.stopPropagation()}
          >
            <img src="/logo.png" alt="Equipe Paraba" className="confirm-logo" />
            <h2 id="register-success-title" style={{ margin: 0, textAlign: 'center' }}>
              Cadastro enviado
            </h2>
            <p className="muted" style={{ margin: 0, textAlign: 'center', lineHeight: 1.45 }}>
              {successMessage}
            </p>
            <button type="button" className="btn btn-primary" onClick={goToLogin}>
              Ir para login
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
