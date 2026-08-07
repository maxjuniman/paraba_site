import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiErrorMessage } from '@/lib/api';
import { formatPhone } from '@/lib/formatters';
import { useAuth } from '@/lib/AuthContext';
import { parabaService } from '@/lib/parabaService';
import './Configuracoes.css';

export function AdminConfiguracoesEditarPage() {
  const { user, setUser } = useAuth();
  const [nome, setNome] = useState(user?.nome ?? '');
  const [celular, setCelular] = useState(user?.celular ? formatPhone(user.celular) : '');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (novaSenha || confirmacao || senhaAtual) {
      if (!senhaAtual || novaSenha.length < 6 || novaSenha !== confirmacao) {
        setError('Para alterar a senha, preencha senha atual, nova senha (6+) e confirmação iguais.');
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

  return (
    <div className="stack">
      <header className="admin-header">
        <div>
          <Link className="settings-back" to="/admin/configuracoes">
            ‹ Voltar
          </Link>
          <h1>Editar cadastro</h1>
          <p>Atualize nome, celular e senha.</p>
        </div>
      </header>

      {error ? <div className="error-box">{error}</div> : null}
      {message ? (
        <div className="card" style={{ borderColor: 'var(--secondary)', color: 'var(--secondary)', fontWeight: 700 }}>
          {message}
        </div>
      ) : null}

      <form className="card stack" onSubmit={saveProfile}>
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
          autoComplete="current-password"
        />
        <input
          className="input"
          type="password"
          placeholder="Nova senha"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
          autoComplete="new-password"
        />
        <input
          className="input"
          type="password"
          placeholder="Confirmar nova senha"
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
          autoComplete="new-password"
        />
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </form>
    </div>
  );
}
