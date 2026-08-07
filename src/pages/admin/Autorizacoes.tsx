import { FormEvent, useEffect, useMemo, useState } from 'react';
import { apiErrorMessage } from '@/lib/api';
import { brDateToIso, formatDate, formatPhone, isValidBrazilMobile } from '@/lib/formatters';
import { parabaService } from '@/lib/parabaService';
import type { Aluno, PendingUser } from '@/lib/types';

const MAX_ALUNOS = 2;

export function AdminAutorizacoesPage() {
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedAlunoIds, setSelectedAlunoIds] = useState<string[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [newAluno, setNewAluno] = useState({
    nome: '',
    apelido: '',
    nomeResponsavel: '',
    emailResponsavel: '',
    celular: '',
    dataNascimento: '',
    dataPagamento: '',
  });

  const load = async () => {
    try {
      setLoading(true);
      const [users, list] = await Promise.all([
        parabaService.listarUsuariosPendentes(),
        parabaService.listarAlunos(),
      ]);
      setPending(users);
      setAlunos(list);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const semVinculo = useMemo(
    () =>
      alunos
        .filter((aluno) => !aluno.userId && aluno.ativo !== false)
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [alunos]
  );

  const toggleAluno = (alunoId: string) => {
    setSelectedAlunoIds((current) => {
      if (current.includes(alunoId)) {
        return current.filter((id) => id !== alunoId);
      }
      if (current.length >= MAX_ALUNOS) {
        return current;
      }
      return [...current, alunoId];
    });
  };

  const authorizeExisting = async () => {
    if (!selectedUserId || selectedAlunoIds.length === 0) {
      setError('Selecione o cadastro pendente e 1 ou 2 alunos.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      for (const alunoId of selectedAlunoIds) {
        await parabaService.autorizarUsuario(selectedUserId, { aluno_id: alunoId });
      }
      setSelectedUserId('');
      setSelectedAlunoIds([]);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const authorizeNew = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedUserId) {
      setError('Selecione um usuario pendente.');
      return;
    }
    const dataNascimento = brDateToIso(newAluno.dataNascimento);
    if (!newAluno.nome.trim() || !dataNascimento || !isValidBrazilMobile(newAluno.celular)) {
      setError('Preencha nome, celular com DDD e nascimento.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      await parabaService.autorizarUsuario(selectedUserId, {
        aluno: {
          nome: newAluno.nome.trim(),
          apelido: newAluno.apelido.trim() || undefined,
          nomeResponsavel: newAluno.nomeResponsavel.trim() || undefined,
          emailResponsavel: newAluno.emailResponsavel.trim() || undefined,
          celular: newAluno.celular.trim(),
          dataNascimento,
          dataPagamento: newAluno.dataPagamento.replace(/\D/g, '').slice(0, 2) || undefined,
        },
      });
      setShowNew(false);
      setSelectedUserId('');
      setSelectedAlunoIds([]);
      setNewAluno({
        nome: '',
        apelido: '',
        nomeResponsavel: '',
        emailResponsavel: '',
        celular: '',
        dataNascimento: '',
        dataPagamento: '',
      });
      await load();
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
          <h1>Autorizações</h1>
          <p>Vincule cadastros pendentes do app a até 2 alunos.</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => void load()}>
          Atualizar
        </button>
      </header>

      {error ? <div className="error-box">{error}</div> : null}
      {loading ? <p className="muted">Carregando...</p> : null}

      <div className="card stack">
        <h2 style={{ margin: 0 }}>Cadastro pendente</h2>
        {pending.length === 0 ? <p className="muted">Nenhum usuario pendente.</p> : null}
        <div className="row">
          {pending.map((user) => (
            <button
              key={user.id}
              type="button"
              className={`chip ${selectedUserId === user.id ? 'active' : ''}`}
              onClick={() => setSelectedUserId(user.id)}
            >
              {user.nome} · {user.email}
            </button>
          ))}
        </div>
      </div>

      <div className="card stack">
        <h2 style={{ margin: 0 }}>Alunos sem vínculo</h2>
        <p className="muted" style={{ margin: 0 }}>
          Clique em 1 ou 2 alunos ({selectedAlunoIds.length}/{MAX_ALUNOS} selecionados).
        </p>
        <div className="row">
          {semVinculo.map((aluno) => {
            const selected = selectedAlunoIds.includes(aluno.id);
            const blocked = !selected && selectedAlunoIds.length >= MAX_ALUNOS;
            return (
              <button
                key={aluno.id}
                type="button"
                className={`chip ${selected ? 'active' : ''}`}
                disabled={blocked}
                onClick={() => toggleAluno(aluno.id)}
                style={blocked ? { opacity: 0.45 } : undefined}
              >
                {aluno.apelido ? `${aluno.nome} (${aluno.apelido})` : aluno.nome}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="btn btn-primary"
          disabled={saving || !selectedUserId || selectedAlunoIds.length === 0}
          onClick={() => void authorizeExisting()}
        >
          {saving
            ? 'Autorizando...'
            : selectedAlunoIds.length > 1
              ? `Autorizar vínculo (${selectedAlunoIds.length} alunos)`
              : 'Autorizar vínculo'}
        </button>
      </div>

      <button type="button" className="btn btn-ghost" onClick={() => setShowNew((v) => !v)}>
        {showNew ? 'Ocultar novo aluno' : 'Não achou o aluno? Cadastrar agora'}
      </button>

      {showNew ? (
        <form className="card stack" onSubmit={authorizeNew}>
          <h2 style={{ margin: 0 }}>Novo aluno + autorização</h2>
          <input
            className="input"
            placeholder="Nome"
            value={newAluno.nome}
            onChange={(e) => setNewAluno((p) => ({ ...p, nome: e.target.value }))}
            required
          />
          <input
            className="input"
            placeholder="Apelido (opcional)"
            value={newAluno.apelido}
            onChange={(e) => setNewAluno((p) => ({ ...p, apelido: e.target.value }))}
          />
          <input
            className="input"
            placeholder="Nome do responsavel (opcional)"
            value={newAluno.nomeResponsavel}
            onChange={(e) => setNewAluno((p) => ({ ...p, nomeResponsavel: e.target.value }))}
          />
          <input
            className="input"
            placeholder="Celular com DDD"
            value={newAluno.celular}
            onChange={(e) => setNewAluno((p) => ({ ...p, celular: formatPhone(e.target.value) }))}
            required
          />
          <input
            className="input"
            placeholder="Nascimento DD/MM/AAAA"
            value={newAluno.dataNascimento}
            onChange={(e) => setNewAluno((p) => ({ ...p, dataNascimento: formatDate(e.target.value) }))}
            required
          />
          <button className="btn btn-primary" type="submit" disabled={saving || !selectedUserId}>
            Cadastrar e autorizar
          </button>
        </form>
      ) : null}
    </div>
  );
}
