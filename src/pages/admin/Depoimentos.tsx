import { FormEvent, useEffect, useState } from 'react';
import { apiErrorMessage } from '@/lib/api';
import { parabaService } from '@/lib/parabaService';
import type { DepoimentoAdmin } from '@/lib/types';

export function AdminDepoimentosPage() {
  const [meuTexto, setMeuTexto] = useState('');
  const [meuId, setMeuId] = useState<string | null>(null);
  const [lista, setLista] = useState<DepoimentoAdmin[]>([]);
  const [manual, setManual] = useState({ nome: '', texto: '', faixa: '' });
  const [loading, setLoading] = useState(true);
  const [savingMe, setSavingMe] = useState(false);
  const [savingManual, setSavingManual] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const [mine, all] = await Promise.all([
        parabaService.obterMeuDepoimento(),
        parabaService.listarDepoimentos(),
      ]);
      setMeuId(mine?.id ?? null);
      setMeuTexto(mine?.texto ?? '');
      setLista(all);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const saveMine = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      setSavingMe(true);
      const saved = await parabaService.salvarMeuDepoimento(meuTexto.trim());
      setMeuId(saved.id);
      setMeuTexto(saved.texto);
      setMessage('Seu depoimento foi salvo e aparece no site.');
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSavingMe(false);
    }
  };

  const saveManual = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      setSavingManual(true);
      await parabaService.criarDepoimento({
        nome: manual.nome.trim() || undefined,
        texto: manual.texto.trim(),
        faixa: manual.faixa.trim() || null,
        ativo: true,
      });
      setManual({ nome: '', texto: '', faixa: '' });
      setMessage('Depoimento cadastrado.');
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSavingManual(false);
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
          <h1>Depoimentos</h1>
          <p>Deixe seu depoimento e gerencie os textos exibidos no site.</p>
        </div>
      </header>

      {error ? <div className="error-box">{error}</div> : null}
      {message ? (
        <div className="card" style={{ borderColor: 'var(--secondary)', color: 'var(--secondary)', fontWeight: 700 }}>
          {message}
        </div>
      ) : null}
      {loading ? <p className="muted">Carregando...</p> : null}

      <form className="card stack" onSubmit={saveMine}>
        <h2 style={{ margin: 0 }}>{meuId ? 'Meu depoimento' : 'Deixar depoimento'}</h2>
        <p className="muted" style={{ margin: 0 }}>
          Seu nome e faixa entram automaticamente. O texto aparece na landing pública.
        </p>
        <textarea
          className="input"
          style={{ minHeight: 120, paddingTop: 12, paddingBottom: 12, resize: 'vertical' }}
          value={meuTexto}
          onChange={(e) => setMeuTexto(e.target.value)}
          placeholder="Escreva seu depoimento sobre a Equipe Paraba..."
          required
          minLength={10}
          maxLength={800}
        />
        <button className="btn btn-primary" type="submit" disabled={savingMe}>
          {savingMe ? 'Salvando...' : meuId ? 'Atualizar depoimento' : 'Publicar depoimento'}
        </button>
      </form>

      <form className="card stack" onSubmit={saveManual}>
        <h2 style={{ margin: 0 }}>Cadastrar depoimento manual</h2>
        <input
          className="input"
          placeholder="Nome"
          value={manual.nome}
          onChange={(e) => setManual((p) => ({ ...p, nome: e.target.value }))}
        />
        <input
          className="input"
          placeholder="Faixa (opcional)"
          value={manual.faixa}
          onChange={(e) => setManual((p) => ({ ...p, faixa: e.target.value }))}
        />
        <textarea
          className="input"
          style={{ minHeight: 120, paddingTop: 12, paddingBottom: 12, resize: 'vertical' }}
          placeholder="Texto do depoimento"
          value={manual.texto}
          onChange={(e) => setManual((p) => ({ ...p, texto: e.target.value }))}
          required
          minLength={10}
          maxLength={800}
        />
        <button className="btn btn-primary" type="submit" disabled={savingManual}>
          {savingManual ? 'Salvando...' : 'Cadastrar'}
        </button>
      </form>

      <section className="card stack">
        <h2 style={{ margin: 0 }}>Todos os depoimentos</h2>
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
                <div className="muted" style={{ fontSize: 13 }}>
                  {item.ativo ? 'Visível no site' : 'Oculto'}
                </div>
              </div>
              <button
                type="button"
                className={`btn ${item.ativo ? 'btn-ghost' : 'btn-secondary'}`}
                disabled={busyId === item.id}
                onClick={() => void toggleAtivo(item)}
              >
                {busyId === item.id ? '...' : item.ativo ? 'Ocultar' : 'Publicar'}
              </button>
            </div>
            <p style={{ margin: 0 }}>{item.texto}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
