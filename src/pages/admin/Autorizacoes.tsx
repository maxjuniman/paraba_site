import { useEffect, useState } from 'react';
import { apiErrorMessage } from '@/lib/api';
import { parabaService } from '@/lib/parabaService';
import type { PendingUser } from '@/lib/types';

function formatBirth(value?: string | null): string {
  if (!value) return '—';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function AdminAutorizacoesPage() {
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      setPending(await parabaService.listarUsuariosPendentes());
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const approve = async (user: PendingUser) => {
    if (!user.alunos?.length) {
      setError('Este cadastro antigo nao tem aluno vinculado. Oriente a pessoa a se cadastrar de novo.');
      return;
    }

    try {
      setSavingId(user.id);
      setError('');
      await parabaService.autorizarUsuario(user.id);
      setPending((previous) => previous.filter((item) => item.id !== user.id));
    } catch (err) {
      setError(apiErrorMessage(err));
      await load();
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="stack">
      <header className="admin-header">
        <div>
          <h1>Autorizações</h1>
          <p>Cadastros enviados pelo app. Revise e aprove para liberar o acesso.</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => void load()}>
          Atualizar
        </button>
      </header>

      {error ? <div className="error-box">{error}</div> : null}
      {loading ? <p className="muted">Carregando...</p> : null}
      {!loading && pending.length === 0 ? <p className="empty">Nenhum cadastro pendente.</p> : null}

      {pending.map((user) => {
        const aluno = user.alunos?.[0];
        const tipos = aluno?.tiposAula?.map((tipo) => tipo.nome).join(', ') || '—';
        const saving = savingId === user.id;

        return (
          <article key={user.id} className="card stack">
            <div>
              <p className="muted" style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: 0.6 }}>
                CADASTRO PENDENTE
              </p>
              <h2 style={{ margin: '4px 0 0' }}>{user.nome}</h2>
              <p className="muted" style={{ margin: '4px 0 0' }}>
                {user.email}
                {user.celular ? ` · ${user.celular}` : ''}
              </p>
            </div>

            {aluno ? (
              <div className="stack" style={{ gap: 4 }}>
                <strong>Aluno</strong>
                <p style={{ margin: 0 }}>
                  {aluno.apelido ? `${aluno.nome} (${aluno.apelido})` : aluno.nome}
                </p>
                <p className="muted" style={{ margin: 0 }}>
                  Nascimento: {formatBirth(aluno.dataNascimento)}
                </p>
                <p className="muted" style={{ margin: 0 }}>
                  Tipos: {tipos}
                </p>
                {aluno.faixaAtual ? (
                  <p className="muted" style={{ margin: 0 }}>
                    Faixa: {aluno.faixaAtual}
                  </p>
                ) : null}
                {aluno.nomeResponsavel ? (
                  <p className="muted" style={{ margin: 0 }}>
                    Responsável: {aluno.nomeResponsavel}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="error-box" style={{ margin: 0 }}>
                Cadastro antigo sem aluno. Oriente a pessoa a se cadastrar novamente.
              </p>
            )}

            <button
              type="button"
              className="btn btn-primary"
              disabled={saving || !aluno || Boolean(savingId)}
              onClick={() => void approve(user)}
            >
              {saving ? 'Aprovando...' : 'Aprovar cadastro'}
            </button>
          </article>
        );
      })}
    </div>
  );
}
