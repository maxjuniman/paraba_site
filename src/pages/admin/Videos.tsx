import { FormEvent, useEffect, useState } from 'react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { apiErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { parabaService } from '@/lib/parabaService';
import { isProfessor } from '@/lib/session';
import type { VideoUpdate } from '@/lib/types';
import { toVideoEmbedUrl } from '@/lib/videoEmbed';

export function AdminVideosPage() {
  const { user } = useAuth();
  const professor = isProfessor(user);
  const [videos, setVideos] = useState<VideoUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<VideoUpdate | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    url: '',
  });

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      setVideos(await parabaService.listarVideos());
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!form.titulo.trim()) {
      setError('Informe o título do vídeo.');
      return;
    }
    if (!form.url.trim().startsWith('http')) {
      setError('Informe uma URL válida do vídeo.');
      return;
    }
    try {
      setSaving(true);
      const created = await parabaService.publicarVideo({
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim() || undefined,
        url: form.url.trim(),
      });
      setVideos((prev) => [created, ...prev]);
      setForm({ titulo: '', descricao: '', url: '' });
      setMessage('Vídeo publicado.');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      setBusyId(toDelete.id);
      setError('');
      await parabaService.excluirVideo(toDelete.id);
      setVideos((prev) => prev.filter((item) => item.id !== toDelete.id));
      setToDelete(null);
      setMessage('Vídeo excluído.');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="stack">
      <header className="admin-header">
        <div>
          <h1>Vídeos</h1>
          <p>
            {professor
              ? 'Publique vídeos com título, descrição e link para a equipe.'
              : 'Assista aos vídeos publicados pelos professores.'}
          </p>
        </div>
      </header>

      {error ? <div className="error-box">{error}</div> : null}
      {message ? (
        <div className="card" style={{ borderColor: 'var(--secondary)', color: 'var(--secondary)', fontWeight: 700 }}>
          {message}
        </div>
      ) : null}

      {professor ? (
        <form className="card stack" onSubmit={submit} autoComplete="off">
          <h2 style={{ margin: 0 }}>Novo vídeo</h2>
          <div>
            <label className="label">Título</label>
            <input
              className="input"
              value={form.titulo}
              onChange={(e) => setForm((prev) => ({ ...prev, titulo: e.target.value }))}
              placeholder="Ex.: Treino de passagem de guarda"
              required
            />
          </div>
          <div>
            <label className="label">Descrição</label>
            <textarea
              className="input"
              style={{ minHeight: 100, paddingTop: 12, paddingBottom: 12, resize: 'vertical' }}
              value={form.descricao}
              onChange={(e) => setForm((prev) => ({ ...prev, descricao: e.target.value }))}
              placeholder="Contexto do vídeo, detalhes do treino..."
              maxLength={2000}
            />
          </div>
          <div>
            <label className="label">Vídeo (URL)</label>
            <input
              className="input"
              type="url"
              value={form.url}
              onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
              placeholder="https://www.youtube.com/watch?v=..."
              required
            />
            <p className="muted" style={{ margin: '6px 0 0', fontSize: 13 }}>
              Cole o link do YouTube, Vimeo ou outro vídeo online.
            </p>
          </div>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Publicando...' : 'Publicar vídeo'}
          </button>
        </form>
      ) : null}

      <section className="stack">
        <h2 style={{ margin: 0 }}>{professor ? 'Vídeos publicados' : 'Biblioteca de vídeos'}</h2>
        {loading ? <p className="muted">Carregando...</p> : null}
        {!loading && videos.length === 0 ? (
          <p className="empty">Nenhum vídeo publicado ainda.</p>
        ) : null}

        {videos.map((video) => {
          const embed = toVideoEmbedUrl(video.url);
          return (
            <article key={video.id} className="card stack">
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h3 style={{ margin: 0 }}>{video.titulo}</h3>
                  {video.descricao ? <p style={{ margin: '8px 0 0' }}>{video.descricao}</p> : null}
                </div>
                {professor ? (
                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={busyId === video.id}
                    onClick={() => setToDelete(video)}
                  >
                    Excluir
                  </button>
                ) : null}
              </div>

              {embed ? (
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    paddingTop: '56.25%',
                    overflow: 'hidden',
                    borderRadius: 12,
                    background: '#0f1419',
                  }}
                >
                  <iframe
                    title={video.titulo}
                    src={embed}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      border: 0,
                    }}
                  />
                </div>
              ) : (
                <a className="btn btn-secondary" href={video.url} target="_blank" rel="noreferrer">
                  Abrir vídeo
                </a>
              )}
            </article>
          );
        })}
      </section>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Excluir vídeo?"
        description={
          toDelete ? (
            <>
              O vídeo <strong>{toDelete.titulo}</strong> será removido permanentemente.
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
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
