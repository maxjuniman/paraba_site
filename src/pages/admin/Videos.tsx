import { FormEvent, useEffect, useRef, useState } from 'react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { apiErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { parabaService } from '@/lib/parabaService';
import { isProfessor } from '@/lib/session';
import type { VideoUpdate } from '@/lib/types';

export function AdminVideosPage() {
  const { user } = useAuth();
  const professor = isProfessor(user);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  });
  const [file, setFile] = useState<File | null>(null);

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
    if (!file) {
      setError('Selecione o arquivo de vídeo.');
      return;
    }
    try {
      setSaving(true);
      const created = await parabaService.publicarVideo({
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim() || undefined,
        file,
      });
      setVideos((prev) => [created, ...prev]);
      setForm({ titulo: '', descricao: '' });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setMessage('Vídeo enviado e publicado.');
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
              ? 'Envie vídeos para o servidor (título, descrição e arquivo) e a equipe assiste no player.'
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
            <label className="label">Vídeo</label>
            <input
              ref={fileInputRef}
              className="input"
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/*"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
              }}
              required
            />
            <p className="muted" style={{ margin: '6px 0 0', fontSize: 13 }}>
              Formatos: MP4, WebM ou MOV. Tamanho máximo: 200 MB.
              {file ? ` Selecionado: ${file.name}` : ''}
            </p>
          </div>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Enviando vídeo...' : 'Publicar vídeo'}
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
          const src = resolveMediaUrl(video.url);
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

              <video
                controls
                playsInline
                preload="metadata"
                src={src}
                style={{
                  width: '100%',
                  maxHeight: 480,
                  borderRadius: 12,
                  background: '#0f1419',
                }}
              >
                Seu navegador não reproduz este vídeo.
              </video>
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
