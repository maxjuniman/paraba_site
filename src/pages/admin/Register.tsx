import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { apiErrorMessage } from '@/lib/api';
import { formatPhone, normalizePhoneWithBrazilCode } from '@/lib/formatters';
import { parabaService } from '@/lib/parabaService';
import { isProfessor } from '@/lib/session';
import './Login.css';

export function AdminRegisterPage() {
  const { user, acceptSession } = useAuth();
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [celular, setCelular] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (user && isProfessor(user)) {
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

    try {
      setLoading(true);
      const response = await parabaService.cadastrarProfessor({
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        celular: celular.trim() ? normalizePhoneWithBrazilCode(celular) : undefined,
        senha,
        confirmacao_senha: confirmacao,
      });

      const sessionUser = response.user ?? response.data;
      if (!response.accessToken || !sessionUser) {
        navigate('/admin/login', { replace: true });
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

  return (
    <div className="login-page">
      <form className="card login-card stack" onSubmit={onSubmit}>
        <div className="login-brand">
          <img src="/logo.png" alt="Equipe Paraba" />
          <h1>Criar conta</h1>
          <p className="muted">Cadastro de professor para o painel admin.</p>
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
            Celular (opcional)
          </label>
          <input
            id="celular"
            className="input"
            inputMode="tel"
            autoComplete="tel"
            value={celular}
            onChange={(e) => setCelular(formatPhone(e.target.value))}
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
            autoComplete="new-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="confirmacao">
            Confirmar senha
          </label>
          <input
            id="confirmacao"
            className="input"
            type="password"
            autoComplete="new-password"
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
            required
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Criando...' : 'Criar conta'}
        </button>
        <Link className="btn btn-ghost" to="/admin/login">
          Já tenho conta
        </Link>
      </form>
    </div>
  );
}
