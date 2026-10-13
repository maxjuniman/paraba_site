import { FormEvent, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { apiErrorMessage } from '@/lib/api';
import { brDateToIso, formatDate, formatPhone, isValidBrazilMobile, normalizePhoneWithBrazilCode } from '@/lib/formatters';
import { parabaService } from '@/lib/parabaService';
import { canAccessAdmin } from '@/lib/session';
import type { TipoAula } from '@/lib/types';
import './Login.css';

const FAIXAS = ['Branca', 'Cinza', 'Amarela', 'Laranja', 'Verde', 'Azul', 'Roxa', 'Marrom', 'Preta'];
const GRAUS = [0, 1, 2, 3, 4];

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
  const [tipos, setTipos] = useState<TipoAula[]>([]);
  const [nome, setNome] = useState('');
  const [apelido, setApelido] = useState('');
  const [email, setEmail] = useState('');
  const [celular, setCelular] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [nomeResponsavel, setNomeResponsavel] = useState('');
  const [emailResponsavel, setEmailResponsavel] = useState('');
  const [faixaAtual, setFaixaAtual] = useState('');
  const [graus, setGraus] = useState(0);
  const [tiposAulaIds, setTiposAulaIds] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successOpen, setSuccessOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        setTipos(await parabaService.listarTiposAula());
      } catch {
        // Sem tipos o form ainda abre; a API valida no envio.
      }
    })();
  }, []);

  if (user && canAccessAdmin(user)) {
    return <Navigate to="/admin" replace />;
  }

  const toggleTipo = (tipoId: string) => {
    setTiposAulaIds((current) =>
      current.includes(tipoId) ? current.filter((id) => id !== tipoId) : [...current, tipoId]
    );
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (!isValidBrazilMobile(celular)) {
      setError('Informe um celular valido com DDD.');
      return;
    }
    const birthIso = brDateToIso(dataNascimento);
    if (!birthIso) {
      setError('Informe a data de nascimento no formato DD/MM/AAAA.');
      return;
    }
    if (tiposAulaIds.length === 0) {
      setError('Selecione ao menos um tipo de aula.');
      return;
    }
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
      const response = await parabaService.cadastrarUsuario({
        nome: nome.trim(),
        apelido: apelido.trim() || undefined,
        email: email.trim().toLowerCase(),
        celular: normalizePhoneWithBrazilCode(celular),
        senha,
        confirmacao_senha: confirmacao,
        dataNascimento: birthIso,
        nomeResponsavel: nomeResponsavel.trim() || undefined,
        emailResponsavel: emailResponsavel.trim() || undefined,
        faixaAtual: faixaAtual || undefined,
        graus,
        tiposAulaIds,
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
          <p className="muted">Cadastro de conta e aluno juntos. O professor só aprova o acesso.</p>
        </div>
        {error ? <div className="error-box">{error}</div> : null}

        <h2 style={{ margin: 0, fontSize: 18 }}>Conta de acesso</h2>
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
          <label className="label" htmlFor="apelido">
            Apelido (opcional)
          </label>
          <input
            id="apelido"
            className="input"
            value={apelido}
            onChange={(e) => setApelido(e.target.value)}
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

        <h2 style={{ margin: 0, fontSize: 18 }}>Dados do aluno</h2>
        <div>
          <label className="label" htmlFor="nascimento">
            Data de nascimento
          </label>
          <input
            id="nascimento"
            className="input"
            placeholder="DD/MM/AAAA"
            value={dataNascimento}
            onChange={(e) => setDataNascimento(formatDate(e.target.value))}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="responsavel">
            Nome do responsável (opcional)
          </label>
          <input
            id="responsavel"
            className="input"
            value={nomeResponsavel}
            onChange={(e) => setNomeResponsavel(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="emailResponsavel">
            E-mail do responsável (opcional)
          </label>
          <input
            id="emailResponsavel"
            className="input"
            type="email"
            value={emailResponsavel}
            onChange={(e) => setEmailResponsavel(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Tipo de aula</label>
          {tipos.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>
              Nenhum tipo cadastrado. Fale com o professor.
            </p>
          ) : (
            <div className="row">
              {tipos.map((tipo) => (
                <button
                  key={tipo.id}
                  type="button"
                  className={`chip ${tiposAulaIds.includes(tipo.id) ? 'active' : ''}`}
                  onClick={() => toggleTipo(tipo.id)}
                >
                  {tipo.nome}
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="label">Faixa atual (opcional)</label>
          <div className="row">
            {FAIXAS.map((faixa) => (
              <button
                key={faixa}
                type="button"
                className={`chip ${faixaAtual === faixa ? 'active' : ''}`}
                onClick={() => setFaixaAtual((current) => (current === faixa ? '' : faixa))}
              >
                {faixa}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Graus</label>
          <div className="row">
            {GRAUS.map((grau) => (
              <button
                key={grau}
                type="button"
                className={`chip ${graus === grau ? 'active' : ''}`}
                onClick={() => setGraus(grau)}
              >
                {grau}
              </button>
            ))}
          </div>
        </div>

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar cadastro'}
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
