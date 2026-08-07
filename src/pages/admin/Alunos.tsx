import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { apiErrorMessage } from '@/lib/api';
import { isoToBrDate } from '@/lib/formatters';
import { parabaService } from '@/lib/parabaService';
import { getStudentCategoryByBirthDate, STUDENT_CATEGORY_FILTERS, type StudentCategoryId } from '@/lib/studentCategories';
import type { Aluno } from '@/lib/types';

type PendingToggle = {
  aluno: Aluno;
  nextAtivo: boolean;
};

function IconEdit() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function IconBan() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M5.5 5.5 18.5 18.5" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16 9" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function IconKey() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="8" cy="15" r="4" />
      <path d="M11.5 12.5 20 4" />
      <path d="M16 4h4v4" />
    </svg>
  );
}

export function AdminAlunosPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<StudentCategoryId>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingToggle, setPendingToggle] = useState<PendingToggle | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Aluno | null>(null);
  const [pendingPassword, setPendingPassword] = useState<Aluno | null>(null);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setAlunos(await parabaService.listarAlunos());
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const activeCount = useMemo(() => alunos.filter((a) => a.ativo !== false).length, [alunos]);

  const filtered = useMemo(() => {
    const q = nameFilter.trim().toLowerCase();
    return alunos
      .filter((aluno) => {
        const matchesName =
          !q ||
          aluno.nome.toLowerCase().includes(q) ||
          (aluno.apelido ?? '').toLowerCase().includes(q);
        const category = getStudentCategoryByBirthDate(aluno.dataNascimento);
        const matchesCategory = categoryFilter === 'all' || category?.id === categoryFilter;
        return matchesName && matchesCategory;
      })
      .sort((a, b) => {
        const aActive = a.ativo !== false ? 0 : 1;
        const bActive = b.ativo !== false ? 0 : 1;
        if (aActive !== bActive) return aActive - bActive;
        return a.nome.localeCompare(b.nome, 'pt-BR');
      });
  }, [alunos, categoryFilter, nameFilter]);

  const confirmToggleAtivo = async () => {
    if (!pendingToggle) return;
    const { aluno, nextAtivo } = pendingToggle;
    try {
      setBusyId(aluno.id);
      setError('');
      const updated = await parabaService.atualizarStatusAluno(aluno.id, nextAtivo);
      setAlunos((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setPendingToggle(null);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      setBusyId(pendingDelete.id);
      setError('');
      await parabaService.excluirAluno(pendingDelete.id);
      setAlunos((prev) => prev.filter((item) => item.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const openPasswordModal = (aluno: Aluno) => {
    setError('');
    setPasswordMessage('');
    setNovaSenha('');
    setConfirmacaoSenha('');
    setPendingPassword(aluno);
  };

  const closePasswordModal = () => {
    if (busyId) return;
    setPendingPassword(null);
    setNovaSenha('');
    setConfirmacaoSenha('');
    setPasswordMessage('');
  };

  const confirmPasswordChange = async () => {
    if (!pendingPassword) return;
    if (novaSenha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmacaoSenha) {
      setError('A confirmacao de senha nao confere.');
      return;
    }
    try {
      setBusyId(pendingPassword.id);
      setError('');
      setPasswordMessage('');
      await parabaService.alterarSenhaAluno(pendingPassword.id, {
        senha: novaSenha,
        confirmacao_senha: confirmacaoSenha,
      });
      setPasswordMessage(`Senha de ${pendingPassword.nome} atualizada.`);
      setPendingPassword(null);
      setNovaSenha('');
      setConfirmacaoSenha('');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const isDeactivating = pendingToggle ? !pendingToggle.nextAtivo : false;

  return (
    <div className="stack">
      <header className="admin-header">
        <div>
          <h1>Alunos</h1>
          <p>
            {activeCount} ativo{activeCount === 1 ? '' : 's'}
            {alunos.length !== activeCount ? ` · ${alunos.length} no total` : ''}
          </p>
        </div>
        <Link className="btn btn-primary" to="/admin/alunos/novo">
          + Novo aluno
        </Link>
      </header>

      {error ? <div className="error-box">{error}</div> : null}
      {passwordMessage ? (
        <div className="card" style={{ borderColor: 'var(--secondary)', color: 'var(--secondary)', fontWeight: 700 }}>
          {passwordMessage}
        </div>
      ) : null}

      <div className="card stack">
        <input
          className="input"
          placeholder="Filtrar por nome ou apelido"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
        />
        <div className="row">
          {STUDENT_CATEGORY_FILTERS.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`chip ${categoryFilter === category.id ? 'active' : ''}`}
              onClick={() => setCategoryFilter(category.id)}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card table-wrap">
        {loading ? <p className="muted">Carregando...</p> : null}
        {!loading && filtered.length === 0 ? <p className="empty">Nenhum aluno encontrado.</p> : null}
        {filtered.length > 0 ? (
          <table className="data">
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Categoria</th>
                <th>Celular</th>
                <th>Status</th>
                <th>App</th>
                <th className="actions" aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((aluno) => {
                const category = getStudentCategoryByBirthDate(aluno.dataNascimento);
                const active = aluno.ativo !== false;
                return (
                  <tr key={aluno.id} style={{ opacity: active ? 1 : 0.65 }}>
                    <td>
                      <strong>{aluno.nome}</strong>
                      <div className="muted" style={{ fontSize: 13 }}>
                        {aluno.apelido ? `${aluno.apelido} · ` : ''}
                        Nasc. {isoToBrDate(aluno.dataNascimento) || '—'}
                        {aluno.nomeResponsavel ? ` · Resp. ${aluno.nomeResponsavel}` : ''}
                      </div>
                    </td>
                    <td>{category?.label ?? '—'}</td>
                    <td>{aluno.celular || '—'}</td>
                    <td>{active ? 'Ativo' : 'Inativo'}</td>
                    <td>{aluno.userId ? 'Vinculado' : 'Sem usuário'}</td>
                    <td className="actions">
                      <div className="row">
                        <Link
                          className="btn btn-secondary btn-icon"
                          to={`/admin/alunos/${aluno.id}`}
                          title="Editar"
                          aria-label={`Editar ${aluno.nome}`}
                        >
                          <IconEdit />
                        </Link>
                        {aluno.userId ? (
                          <button
                            type="button"
                            className="btn btn-secondary btn-icon"
                            disabled={busyId === aluno.id}
                            title="Trocar senha"
                            aria-label={`Trocar senha de ${aluno.nome}`}
                            onClick={() => openPasswordModal(aluno)}
                          >
                            <IconKey />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className={`btn btn-icon ${active ? 'btn-danger' : 'btn-primary'}`}
                          disabled={busyId === aluno.id}
                          title={active ? 'Desativar' : 'Reativar'}
                          aria-label={`${active ? 'Desativar' : 'Reativar'} ${aluno.nome}`}
                          onClick={() =>
                            setPendingToggle({
                              aluno,
                              nextAtivo: !active,
                            })
                          }
                        >
                          {active ? <IconBan /> : <IconCheck />}
                        </button>
                        {!active ? (
                          <button
                            type="button"
                            className="btn btn-danger btn-icon"
                            disabled={busyId === aluno.id}
                            title="Excluir"
                            aria-label={`Excluir ${aluno.nome}`}
                            onClick={() => setPendingDelete(aluno)}
                          >
                            <IconTrash />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : null}
      </div>

      <ConfirmDialog
        open={Boolean(pendingToggle)}
        title={isDeactivating ? 'Desativar aluno?' : 'Reativar aluno?'}
        description={
          pendingToggle ? (
            isDeactivating ? (
              <>
                Desativar <strong>{pendingToggle.aluno.nome}</strong>? O aluno sai das listas ativas.
                {pendingToggle.aluno.userId
                  ? ' Se for o único aluno ativo da conta, o acesso ao app também será bloqueado.'
                  : null}
              </>
            ) : (
              <>
                Reativar <strong>{pendingToggle.aluno.nome}</strong>? O aluno volta a aparecer nas
                listas ativas.
              </>
            )
          ) : null
        }
        confirmLabel={isDeactivating ? 'Desativar' : 'Reativar'}
        cancelLabel="Cancelar"
        danger={isDeactivating}
        busy={busyId === pendingToggle?.aluno.id}
        onCancel={() => {
          if (busyId) return;
          setPendingToggle(null);
        }}
        onConfirm={() => {
          void confirmToggleAtivo();
        }}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Excluir aluno?"
        description={
          pendingDelete ? (
            <>
              Excluir <strong>{pendingDelete.nome}</strong> permanentemente?
              <br />
              Presenças desse aluno serão removidas. Esta ação não pode ser desfeita.
              {pendingDelete.userId
                ? ' Se for o único aluno da conta, o usuário do app volta a ficar pendente.'
                : null}
            </>
          ) : null
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        danger
        busy={busyId === pendingDelete?.id}
        onCancel={() => {
          if (busyId) return;
          setPendingDelete(null);
        }}
        onConfirm={() => {
          void confirmDelete();
        }}
      />

      {pendingPassword ? (
        <div className="confirm-overlay" role="presentation" onClick={closePasswordModal}>
          <div
            className="confirm-dialog card stack"
            role="dialog"
            aria-modal="true"
            aria-labelledby="password-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="password-dialog-title" style={{ margin: 0, textAlign: 'center' }}>
              Trocar senha
            </h2>
            <p className="muted" style={{ margin: 0, textAlign: 'center' }}>
              Nova senha para <strong>{pendingPassword.nome}</strong>
              {pendingPassword.user?.email ? ` (${pendingPassword.user.email})` : ''}.
            </p>
            <input
              className="input"
              type="password"
              placeholder="Nova senha (6+)"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              autoComplete="new-password"
            />
            <input
              className="input"
              type="password"
              placeholder="Confirmar senha"
              value={confirmacaoSenha}
              onChange={(e) => setConfirmacaoSenha(e.target.value)}
              autoComplete="new-password"
            />
            <div className="row" style={{ justifyContent: 'center', marginTop: 4 }}>
              <button type="button" className="btn btn-ghost" disabled={Boolean(busyId)} onClick={closePasswordModal}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={busyId === pendingPassword.id}
                onClick={() => void confirmPasswordChange()}
              >
                {busyId === pendingPassword.id ? 'Salvando...' : 'Salvar senha'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
