import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { parabaService } from '@/lib/parabaService';
import { isAluno, isProfessor } from '@/lib/session';
import type { Aluno, UsuarioAtivoComVinculos, VinculoAlunoResumo } from '@/lib/types';
import './Configuracoes.css';

export function AdminConfiguracoesVinculosPage() {
  const { user, setUser } = useAuth();
  const professor = isProfessor(user);
  const aluno = isAluno(user);

  const [usuariosAtivos, setUsuariosAtivos] = useState<UsuarioAtivoComVinculos[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedAlunoId, setSelectedAlunoId] = useState('');
  const [vinculados, setVinculados] = useState<VinculoAlunoResumo[]>([]);
  const [alunoPrimarioId, setAlunoPrimarioId] = useState<string | null>(null);
  const [maxAlunos, setMaxAlunos] = useState(2);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [meusVinculos, setMeusVinculos] = useState<VinculoAlunoResumo[]>([]);
  const [meuPrimarioId, setMeuPrimarioId] = useState<string | null>(null);

  const loadProfessor = useCallback(async () => {
    if (!professor) return;
    const [users, list] = await Promise.all([
      parabaService.listarUsuariosAtivos(),
      parabaService.listarAlunos(),
    ]);
    setUsuariosAtivos(users);
    setAlunos(list);
  }, [professor]);

  const loadMeus = useCallback(async () => {
    if (!aluno) return;
    const detail = await parabaService.listarMeusAlunosVinculados();
    setMeusVinculos(detail.alunos);
    setMeuPrimarioId(detail.alunoPrimarioId);
  }, [aluno]);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setError('');
        await Promise.all([loadProfessor(), loadMeus()]);
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [loadProfessor, loadMeus]);

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

  const vincular = async () => {
    if (!selectedUserId || !selectedAlunoId) {
      setError('Selecione o usuário e o aluno para vincular.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      await parabaService.vincularAlunoUser(selectedAlunoId, selectedUserId);
      setSelectedAlunoId('');
      setMessage('Aluno vinculado ao usuário.');
      await loadProfessor();
      const detail = await parabaService.listarAlunosDoUsuario(selectedUserId);
      setVinculados(detail.alunos);
      setAlunoPrimarioId(detail.alunoPrimarioId);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const desvincular = async (alunoId: string) => {
    try {
      setSaving(true);
      setError('');
      await parabaService.desvincularAlunoUser(alunoId);
      setMessage('Vínculo removido.');
      await loadProfessor();
      if (selectedUserId) {
        const detail = await parabaService.listarAlunosDoUsuario(selectedUserId);
        setVinculados(detail.alunos);
        setAlunoPrimarioId(detail.alunoPrimarioId);
      }
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const setPrimario = async (alunoId: string) => {
    if (!selectedUserId) return;
    try {
      setSaving(true);
      setError('');
      const detail = await parabaService.definirAlunoPrimario(selectedUserId, alunoId);
      setVinculados(detail.alunos);
      setAlunoPrimarioId(detail.alunoPrimarioId);
      setMessage('Aluno primário atualizado.');
      await loadProfessor();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const setMeuPrimario = async (alunoId: string) => {
    try {
      setSaving(true);
      setError('');
      const detail = await parabaService.definirMeuAlunoPrimario(alunoId);
      setMeusVinculos(detail.alunos);
      setMeuPrimarioId(detail.alunoPrimarioId);
      if (detail.user) setUser(detail.user);
      setMessage('Aluno primário atualizado.');
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
          <h1>Alunos vinculados</h1>
          <p>
            {professor
              ? `Cada usuário aluno pode ter até ${maxAlunos} cadastros de aluno.`
              : 'Sua conta pode estar ligada a até 2 alunos. O primário é usado na home e no pagamento.'}
          </p>
        </div>
      </header>

      {error ? <div className="error-box">{error}</div> : null}
      {message ? (
        <div className="card" style={{ borderColor: 'var(--secondary)', color: 'var(--secondary)', fontWeight: 700 }}>
          {message}
        </div>
      ) : null}
      {loading ? <p className="muted">Carregando...</p> : null}

      {aluno ? (
        <section className="card stack">
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
                        disabled={saving}
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
          <div>
            <label className="label">Usuário</label>
            <select
              className="input"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              disabled={loading}
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
                <h3 style={{ margin: '4px 0' }}>
                  Alunos vinculados ({vinculados.length}/{maxAlunos})
                </h3>
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
                              disabled={saving}
                              onClick={() => void setPrimario(item.id)}
                            >
                              Primário
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="btn btn-ghost"
                            disabled={saving}
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
                    disabled={saving || !selectedAlunoId}
                    onClick={() => void vincular()}
                  >
                    {saving ? 'Salvando...' : 'Vincular aluno'}
                  </button>
                </div>
              ) : (
                <p style={{ margin: 0, opacity: 0.8 }}>
                  Limite de {maxAlunos} alunos atingido para este usuário.
                </p>
              )}
            </>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
