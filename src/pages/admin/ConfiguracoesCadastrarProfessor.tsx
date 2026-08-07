import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiErrorMessage } from '@/lib/api';
import { formatPhone, normalizePhoneWithBrazilCode } from '@/lib/formatters';
import { parabaService } from '@/lib/parabaService';
import './Configuracoes.css';

export function AdminConfiguracoesCadastrarProfessorPage() {
  const [prof, setProf] = useState({
    nome: '',
    email: '',
    celular: '',
    senha: '',
    confirmacao_senha: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const saveProfessor = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!prof.celular.trim()) {
      setError('O celular é obrigatório.');
      return;
    }
    try {
      setSaving(true);
      await parabaService.cadastrarProfessor({
        nome: prof.nome.trim(),
        email: prof.email.trim().toLowerCase(),
        celular: normalizePhoneWithBrazilCode(prof.celular),
        senha: prof.senha,
        confirmacao_senha: prof.confirmacao_senha,
      });
      setProf({ nome: '', email: '', celular: '', senha: '', confirmacao_senha: '' });
      setMessage('Conta de professor criada.');
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
          <h1>Cadastrar professor</h1>
          <p>Crie um usuário para outro professor.</p>
        </div>
      </header>

      {error ? <div className="error-box">{error}</div> : null}
      {message ? (
        <div className="card" style={{ borderColor: 'var(--secondary)', color: 'var(--secondary)', fontWeight: 700 }}>
          {message}
        </div>
      ) : null}

      <form className="card stack" onSubmit={saveProfessor}>
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
          placeholder="Celular"
          value={prof.celular}
          onChange={(e) => setProf((p) => ({ ...p, celular: formatPhone(e.target.value) }))}
          required
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
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? 'Criando...' : 'Criar conta'}
        </button>
      </form>
    </div>
  );
}
