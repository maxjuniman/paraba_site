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
  const [editing, setEditing] = useState<DepoimentoAdmin | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editTexto, setEditTexto] = useState('');
  const [editFaixa, setEditFaixa] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

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

  const openEdit = (item: DepoimentoAdmin) => {
    setError('');
    setEditing(item);
    setEditNome(item.nome);
    setEditTexto(item.texto);
    setEditFaixa(item.faixa ?? '');
  };

  const closeEdit = () => {
    if (savingEdit) return;
    setEditing(null);
    setEditNome('');
    setEditTexto('');
    setEditFaixa('');
  };

  const saveEdit = async () => {
    if (!editing) return;
    const texto = editTexto.trim();
    const nome = editNome.trim();
    if (nome.length < 1) {
      setError('Informe o nome.');
      return;
    }
    if (texto.length < 10) {
      setError('O depoimento deve ter pelo menos 10 caracteres.');
      return;
    }
    if (texto.length > 800) {
      setError('O depoimento deve ter no maximo 800 caracteres.');
      return;
    }
    try {
      setSavingEdit(true);
      setError('');
      const updated = await parabaService.atualizarDepoimento(editing.id, {
        nome,
        texto,
        faixa: editFaixa.trim() || null,
      });
      setLista((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
      if (updated.id === meuId || updated.userId === user?.id) {
        setMeuTexto(updated.texto);
      }
      setMessage('Depoimento atualizado.');
      setEditing(null);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSavingEdit(false);
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
              ? `Aprove e edite depoimentos dos alunos. Só os aprovados aparecem no site.${
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
                    className="btn btn-secondary"
                    disabled={busyId === item.id}
                    onClick={() => openEdit(item)}
                  >
                    Editar
                  </button>
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

      {editing ? (
        <div className="confirm-overlay" role="presentation" onClick={closeEdit}>
          <div
            className="confirm-dialog card stack"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-depoimento-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="edit-depoimento-title" style={{ margin: 0, textAlign: 'center' }}>
              Editar depoimento
            </h2>
            <div>
              <label className="label">Nome</label>
              <input
                className="input"
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Faixa (opcional)</label>
              <input
                className="input"
                value={editFaixa}
                onChange={(e) => setEditFaixa(e.target.value)}
                placeholder="Ex.: Azul"
              />
            </div>
            <div>
              <label className="label">Texto</label>
              <textarea
                className="input"
                style={{ minHeight: 140, paddingTop: 12, paddingBottom: 12, resize: 'vertical' }}
                value={editTexto}
                onChange={(e) => setEditTexto(e.target.value)}
                minLength={10}
                maxLength={800}
                required
              />
              <p className="muted" style={{ margin: '6px 0 0', fontSize: 13 }}>
                {editTexto.trim().length}/800
              </p>
            </div>
            <div className="row" style={{ justifyContent: 'center', marginTop: 4 }}>
              <button type="button" className="btn btn-ghost" disabled={savingEdit} onClick={closeEdit}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={savingEdit}
                onClick={() => void saveEdit()}
              >
                {savingEdit ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
