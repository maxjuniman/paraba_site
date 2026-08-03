import { FormEvent, useState } from 'react';
import { apiErrorMessage } from '@/lib/api';
import { formatPhone, normalizePhoneWithBrazilCode } from '@/lib/formatters';
import { useAuth } from '@/lib/AuthContext';
import { parabaService } from '@/lib/parabaService';

export function AdminConfiguracoesPage() {
  const { user, setUser, logout } = useAuth();
  const [nome, setNome] = useState(user?.nome ?? '');
  const [celular, setCelular] = useState(user?.celular ? formatPhone(user.celular) : '');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [prof, setProf] = useState({
    nome: '',
    email: '',
    celular: '',
    senha: '',
    confirmacao_senha: '',
  });
  const [savingProf, setSavingProf] = useState(false);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (novaSenha || confirmacao || senhaAtual) {
      if (!senhaAtual || novaSenha.length < 6 || novaSenha !== confirmacao) {
        setError('Para alterar a senha, preencha senha atual, nova senha (6+) e confirmacao iguais.');
        return;
      }
    }
    try {
      setSaving(true);
      const updated = await parabaService.atualizarMeuPerfil({
        nome: nome.trim(),
        celular: celular.trim() || undefined,
        senhaAtual: senhaAtual || undefined,
        novaSenha: novaSenha || undefined,
      });
      setUser(updated);
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmacao('');
      setMessage('Cadastro atualizado.');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const saveProfessor = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      setSavingProf(true);
      await parabaService.cadastrarProfessor({
        nome: prof.nome.trim(),
        email: prof.email.trim().toLowerCase(),
        celular: prof.celular.trim() ? normalizePhoneWithBrazilCode(prof.celular) : undefined,
        senha: prof.senha,
        confirmacao_senha: prof.confirmacao_senha,
      });
      setProf({ nome: '', email: '', celular: '', senha: '', confirmacao_senha: '' });
      setMessage('Conta de professor criada.');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSavingProf(false);
    }
  };

  return (
    <div className="stack">
      <header className="admin-header">
        <div>
          <h1>Configurações</h1>
          <p>Perfil do professor e criação de novas contas.</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={logout}>
          Sair
        </button>
      </header>

      {error ? <div className="error-box">{error}</div> : null}
      {message ? (
        <div className="card" style={{ borderColor: 'var(--secondary)', color: 'var(--secondary)', fontWeight: 700 }}>
          {message}
        </div>
      ) : null}

      <form className="card stack" onSubmit={saveProfile}>
        <h2 style={{ margin: 0 }}>Meu cadastro</h2>
        <div>
          <label className="label">E-mail</label>
          <input className="input" value={user?.email ?? ''} disabled />
        </div>
        <div>
          <label className="label">Nome</label>
          <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} required />
        </div>
        <div>
          <label className="label">Celular</label>
          <input
            className="input"
            value={celular}
            onChange={(e) => setCelular(formatPhone(e.target.value))}
          />
        </div>
        <h3 style={{ margin: '8px 0 0' }}>Alterar senha (opcional)</h3>
        <input
          className="input"
          type="password"
          placeholder="Senha atual"
          value={senhaAtual}
          onChange={(e) => setSenhaAtual(e.target.value)}
        />
        <input
          className="input"
          type="password"
          placeholder="Nova senha"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
        />
        <input
          className="input"
          type="password"
          placeholder="Confirmar nova senha"
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
        />
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </form>

      <form className="card stack" onSubmit={saveProfessor}>
        <h2 style={{ margin: 0 }}>Criar conta de professor</h2>
        <input
          className="input"
          placeholder="Nome"
          value={prof.nome}
          onChange={(e) => setProf((p) => ({ ...p, nome: e.target.value }))}
          required
        />
        <input
          className="input"
          type="email"
          placeholder="E-mail"
          value={prof.email}
          onChange={(e) => setProf((p) => ({ ...p, email: e.target.value }))}
          required
        />
        <input
          className="input"
          placeholder="Celular (opcional)"
          value={prof.celular}
          onChange={(e) => setProf((p) => ({ ...p, celular: formatPhone(e.target.value) }))}
        />
        <input
          className="input"
          type="password"
          placeholder="Senha"
          value={prof.senha}
          onChange={(e) => setProf((p) => ({ ...p, senha: e.target.value }))}
          required
        />
        <input
          className="input"
          type="password"
          placeholder="Confirmar senha"
          value={prof.confirmacao_senha}
          onChange={(e) => setProf((p) => ({ ...p, confirmacao_senha: e.target.value }))}
          required
        />
        <button className="btn btn-primary" type="submit" disabled={savingProf}>
          {savingProf ? 'Criando...' : 'Criar conta'}
        </button>
      </form>
    </div>
  );
}
