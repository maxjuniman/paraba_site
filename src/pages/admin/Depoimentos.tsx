import { FormEvent, useEffect, useState } from 'react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { apiErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { parabaService } from '@/lib/parabaService';
import { isProfessor } from '@/lib/session';
import type { DepoimentoAdmin } from '@/lib/types';

export function AdminDepoimentosPage() {
  const { user } = useAuth();
  const professor = isProfessor(user);
  const [meuTexto, setMeuTexto] = useState('');
  const [meuId, setMeuId] = useState<string | null>(null);
  const [meuAtivo, setMeuAtivo] = useState(false);
  const [lista, setLista] = useState<DepoimentoAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingMe, setSavingMe] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [toDelete, setToDelete] = useState<DepoimentoAdmin | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const mine = await parabaService.obterMeuDepoimento();

      if (professor) {
        setLista(await parabaService.listarDepoimentos());
        // Só preenche o formulário do professor com depoimento já publicado.
        // Pendentes ficam apenas em "Aprovar / gerenciar".
        if (mine?.ativo) {
          setMeuId(mine.id);
          setMeuTexto(mine.texto);
          setMeuAtivo(true);
        } else {
          setMeuId(null);
          setMeuTexto('');
          setMeuAtivo(false);
        }
      } else {
        setLista([]);
        setMeuId(mine?.id ?? null);
        setMeuTexto(mine?.texto ?? '');
        setMeuAtivo(Boolean(mine?.ativo));
      }
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [professor]);

  const saveMine = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      setSavingMe(true);
      const saved = await parabaService.salvarMeuDepoimento(meuTexto.trim());
      setMeuId(saved.id);
      setMeuTexto(saved.texto);
      setMeuAtivo(Boolean(saved.ativo));
      setMessage(
        saved.ativo
          ? 'Seu depoimento foi publicado no site.'
          : 'Depoimento enviado. Aguarde a aprovação de um professor para aparecer no site.'
      );
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSavingMe(false);
    }
  };

  const toggleAtivo = async (item: DepoimentoAdmin) => {
    try {
      setBusyId(item.id);
      setError('');
      const updated = item.ativo
        ? await parabaService.desativarDepoimento(item.id)
        : await parabaService.atualizarDepoimento(item.id, { ativo: true });
      setLista((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
      if (updated.id === meuId || updated.userId === user?.id) {
        if (updated.ativo) {
          setMeuId(updated.id);
          setMeuTexto(updated.texto);
          setMeuAtivo(true);
        } else if (professor) {
          setMeuId(null);
          setMeuTexto('');
          setMeuAtivo(false);
        }
      }
      setMessage(updated.ativo ? 'Depoimento aprovado e visível no site.' : 'Depoimento ocultado do site.');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const confirmExcluir = async () => {
    if (!toDelete) return;
    const item = toDelete;
    try {
      setBusyId(item.id);
      setError('');
      setMessage('');
      await parabaService.excluirDepoimento(item.id);
      setLista((prev) => prev.filter((row) => row.id !== item.id));
      if (meuId === item.id || item.userId === user?.id) {
        setMeuId(null);
        setMeuTexto('');
        setMeuAtivo(false);
      }
      setToDelete(null);
      setMessage('Depoimento excluído.');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const pendentes = lista.filter((item) => !item.ativo).length;

  return (
    <div className="stack">
      <header className="admin-header">
        <div>
          <h1>Depoimentos</h1>
          <p>
            {professor
              ? `Aprove depoimentos dos alunos. Só os aprovados aparecem no site.${
                  pendentes > 0 ? ` ${pendentes} pendente${pendentes === 1 ? '' : 's'}.` : ''
                }`
              : 'Envie seu depoimento. Ele aparece no site após aprovação de um professor.'}
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

      <form className="card stack" onSubmit={saveMine} autoComplete="off">
        <h2 style={{ margin: 0 }}>{meuId ? 'Meu depoimento' : 'Deixar depoimento'}</h2>
        <p className="muted" style={{ margin: 0 }}>
          {professor
            ? 'Como professor, seu depoimento é publicado direto no site.'
            : meuId
              ? meuAtivo
                ? 'Seu depoimento está aprovado e visível no site.'
                : 'Seu depoimento está pendente de aprovação.'
              : 'Seu texto fica pendente até um professor aprovar.'}
        </p>
        <textarea
          className="input"
          name="meu-depoimento"
          autoComplete="off"
          style={{ minHeight: 120, paddingTop: 12, paddingBottom: 12, resize: 'vertical' }}
          value={meuTexto}
          onChange={(e) => setMeuTexto(e.target.value)}
          placeholder="Escreva seu depoimento sobre a Equipe Paraba..."
          required
          minLength={10}
          maxLength={800}
        />
        <button className="btn btn-primary" type="submit" disabled={savingMe}>
          {savingMe
            ? 'Salvando...'
            : meuId
              ? 'Atualizar depoimento'
              : professor
                ? 'Publicar depoimento'
                : 'Enviar depoimento'}
        </button>
      </form>

      {professor ? (
        <section className="card stack">
          <h2 style={{ margin: 0 }}>Aprovar / gerenciar</h2>
          {lista.length === 0 ? <p className="empty">Nenhum depoimento cadastrado.</p> : null}
          {lista.map((item) => (
            <article
              key={item.id}
              className="stack"
              style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}
            >
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div>
                  <strong>{item.nome}</strong>
                  {item.faixa ? <span className="muted"> · {item.faixa}</span> : null}
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: item.ativo ? 'var(--secondary)' : 'var(--warning)',
                    }}
                  >
                    {item.ativo ? 'Aprovado · visível no site' : 'Pendente de aprovação'}
                  </div>
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <button
                    type="button"
                    className={`btn ${item.ativo ? 'btn-ghost' : 'btn-primary'}`}
                    disabled={busyId === item.id}
                    onClick={() => void toggleAtivo(item)}
                  >
                    {busyId === item.id ? '...' : item.ativo ? 'Ocultar' : 'Aprovar'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={busyId === item.id}
                    onClick={() => setToDelete(item)}
                  >
                    Excluir
                  </button>
                </div>
              </div>
              <p style={{ margin: 0 }}>{item.texto}</p>
            </article>
          ))}
        </section>
      ) : null}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Excluir depoimento?"
        description={
          toDelete ? (
            <>
              O depoimento de <strong>{toDelete.nome}</strong> será removido permanentemente.
              <br />
              <span style={{ display: 'block', marginTop: 8, fontStyle: 'italic' }}>
                “{toDelete.texto.length > 120 ? `${toDelete.texto.slice(0, 120)}…` : toDelete.texto}”
              </span>
            </>
          ) : null
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        danger
        busy={busyId === toDelete?.id}
        onCancel={() => {
          if (busyId) return;
          setToDelete(null);
        }}
        onConfirm={() => void confirmExcluir()}
      />
    </div>
  );
}
