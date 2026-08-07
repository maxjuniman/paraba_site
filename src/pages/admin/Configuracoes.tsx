import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { apiErrorMessage } from '@/lib/api';
import { formatPhone, normalizePhoneWithBrazilCode } from '@/lib/formatters';
import { useAuth } from '@/lib/AuthContext';
import { parabaService } from '@/lib/parabaService';
import { isAluno, isProfessor } from '@/lib/session';
import type { Aluno, UsuarioAtivoComVinculos, VinculoAlunoResumo } from '@/lib/types';

export function AdminConfiguracoesPage() {
  const { user, setUser, logout } = useAuth();
  const professor = isProfessor(user);
  const aluno = isAluno(user);
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

  const [usuariosAtivos, setUsuariosAtivos] = useState<UsuarioAtivoComVinculos[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedAlunoId, setSelectedAlunoId] = useState('');
  const [vinculados, setVinculados] = useState<VinculoAlunoResumo[]>([]);
  const [alunoPrimarioId, setAlunoPrimarioId] = useState<string | null>(null);
  const [maxAlunos, setMaxAlunos] = useState(2);
  const [loadingVinculos, setLoadingVinculos] = useState(false);
  const [savingVinculo, setSavingVinculo] = useState(false);

  const [meusVinculos, setMeusVinculos] = useState<VinculoAlunoResumo[]>([]);
  const [meuPrimarioId, setMeuPrimarioId] = useState<string | null>(null);

  const loadProfessorVinculos = useCallback(async () => {
    if (!professor) return;
    try {
      setLoadingVinculos(true);
      const [users, list] = await Promise.all([
        parabaService.listarUsuariosAtivos(),
        parabaService.listarAlunos(),
      ]);
      setUsuariosAtivos(users);
      setAlunos(list);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoadingVinculos(false);
    }
  }, [professor]);

  const loadMeusVinculos = useCallback(async () => {
    if (!aluno) return;
    try {
      const detail = await parabaService.listarMeusAlunosVinculados();
      setMeusVinculos(detail.alunos);
      setMeuPrimarioId(detail.alunoPrimarioId);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }, [aluno]);

  useEffect(() => {
    void loadProfessorVinculos();
  }, [loadProfessorVinculos]);

  useEffect(() => {
    void loadMeusVinculos();
  }, [loadMeusVinculos]);

  useEffect(() => {
    if (!selectedUserId) {
      setVinculados([]);
      setAlunoPrimarioId(null);
      return;
    }
    void (async () => {
      try {
        const detail = await parabaService.listarAlunosDoUsuario(selectedUserId);
        setVinculados(detail.alunos);
        setAlunoPrimarioId(detail.alunoPrimarioId);
        setMaxAlunos(detail.maxAlunos);
      } catch (err) {
        setError(apiErrorMessage(err));
      }
    })();
  }, [selectedUserId]);

  const semVinculo = useMemo(
    () =>
      alunos
        .filter((item) => !item.userId && item.ativo !== false)
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [alunos]
  );

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
    if (!prof.celular.trim()) {
      setError('O celular é obrigatorio.');
      return;
    }
    try {
      setSavingProf(true);
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
      setSavingProf(false);
    }
  };

  const vincular = async () => {
    if (!selectedUserId || !selectedAlunoId) {
      setError('Selecione o usuario e o aluno para vincular.');
      return;
    }
    try {
      setSavingVinculo(true);
      setError('');
      await parabaService.vincularAlunoUser(selectedAlunoId, selectedUserId);
      setSelectedAlunoId('');
      setMessage('Aluno vinculado ao usuario.');
      await loadProfessorVinculos();
      const detail = await parabaService.listarAlunosDoUsuario(selectedUserId);
      setVinculados(detail.alunos);
      setAlunoPrimarioId(detail.alunoPrimarioId);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSavingVinculo(false);
    }
  };

  const desvincular = async (alunoId: string) => {
    try {
      setSavingVinculo(true);
      setError('');
      await parabaService.desvincularAlunoUser(alunoId);
      setMessage('Vinculo removido.');
      await loadProfessorVinculos();
      if (selectedUserId) {
        const detail = await parabaService.listarAlunosDoUsuario(selectedUserId);
        setVinculados(detail.alunos);
        setAlunoPrimarioId(detail.alunoPrimarioId);
      }
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSavingVinculo(false);
    }
  };

  const setPrimario = async (alunoId: string) => {
    if (!selectedUserId) return;
    try {
      setSavingVinculo(true);
      setError('');
      const detail = await parabaService.definirAlunoPrimario(selectedUserId, alunoId);
      setVinculados(detail.alunos);
      setAlunoPrimarioId(detail.alunoPrimarioId);
      setMessage('Aluno primario atualizado.');
      await loadProfessorVinculos();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSavingVinculo(false);
    }
  };

  const setMeuPrimario = async (alunoId: string) => {
    try {
      setSavingVinculo(true);
      setError('');
      const detail = await parabaService.definirMeuAlunoPrimario(alunoId);
      setMeusVinculos(detail.alunos);
      setMeuPrimarioId(detail.alunoPrimarioId);
      if (detail.user) setUser(detail.user);
      setMessage('Aluno primario atualizado.');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSavingVinculo(false);
    }
  };

  return (
    <div className="stack">
      <header className="admin-header">
        <div>
          <h1>Configurações</h1>
          <p>
            {professor
              ? 'Perfil, vínculos usuário ↔ alunos e criação de contas.'
              : 'Edite seu cadastro, senha e alunos vinculados.'}
          </p>
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

      {aluno ? (
        <section className="card stack">
          <h2 style={{ margin: 0 }}>Alunos vinculados</h2>
          <p style={{ margin: 0, opacity: 0.8 }}>
            Sua conta pode estar ligada a até 2 alunos. O aluno primário é usado na home e no pagamento.
          </p>
          {meusVinculos.length === 0 ? (
            <p style={{ margin: 0 }}>Nenhum aluno vinculado à sua conta.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {meusVinculos.map((item) => (
                <li key={item.id} style={{ marginBottom: 8 }}>
                  <strong>{item.nome}</strong>
                  {meuPrimarioId === item.id ? ' · primário' : ''}
                  {meusVinculos.length > 1 && meuPrimarioId !== item.id ? (
                    <>
                      {' '}
                      <button
                        type="button"
                        className="btn btn-ghost"
                        disabled={savingVinculo}
                        onClick={() => void setMeuPrimario(item.id)}
                      >
                        Definir como primário
                      </button>
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {professor ? (
        <section className="card stack">
          <h2 style={{ margin: 0 }}>Vínculos usuário ↔ alunos</h2>
          <p style={{ margin: 0, opacity: 0.8 }}>
            Cada usuário aluno pode ter até {maxAlunos} cadastros de aluno (ex.: dois filhos na mesma conta).
          </p>

          <div>
            <label className="label">Usuário</label>
            <select
              className="input"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              disabled={loadingVinculos}
            >
              <option value="">Selecione um usuário ativo</option>
              {usuariosAtivos.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome} ({item.email}) — {item.alunosCount}/{item.maxAlunos}
                </option>
              ))}
            </select>
          </div>

          {selectedUserId ? (
            <>
              <div>
                <h3 style={{ margin: '4px 0' }}>Alunos vinculados ({vinculados.length}/{maxAlunos})</h3>
                {vinculados.length === 0 ? (
                  <p style={{ margin: 0 }}>Nenhum aluno vinculado.</p>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {vinculados.map((item) => (
                      <li key={item.id} style={{ marginBottom: 10 }}>
                        <strong>{item.nome}</strong>
                        {alunoPrimarioId === item.id ? ' · primário' : ''}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                          {alunoPrimarioId !== item.id ? (
                            <button
                              type="button"
                              className="btn btn-ghost"
                              disabled={savingVinculo}
                              onClick={() => void setPrimario(item.id)}
                            >
                              Primário
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="btn btn-ghost"
                            disabled={savingVinculo}
                            onClick={() => void desvincular(item.id)}
                          >
                            Desvincular
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {vinculados.length < maxAlunos ? (
                <div className="stack" style={{ gap: 8 }}>
                  <label className="label">Vincular outro aluno</label>
                  <select
                    className="input"
                    value={selectedAlunoId}
                    onChange={(e) => setSelectedAlunoId(e.target.value)}
                  >
                    <option value="">Aluno sem usuário</option>
                    {semVinculo.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nome}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={savingVinculo || !selectedAlunoId}
                    onClick={() => void vincular()}
                  >
                    {savingVinculo ? 'Salvando...' : 'Vincular aluno'}
                  </button>
                </div>
              ) : (
                <p style={{ margin: 0, opacity: 0.8 }}>Limite de {maxAlunos} alunos atingido para este usuário.</p>
              )}
            </>
          ) : null}
        </section>
      ) : null}

      {professor ? (
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
          <button className="btn btn-primary" type="submit" disabled={savingProf}>
            {savingProf ? 'Criando...' : 'Criar conta'}
          </button>
        </form>
      ) : null}
    </div>
  );
}
