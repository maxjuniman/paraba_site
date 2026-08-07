import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiErrorMessage } from '@/lib/api';
import { formatPhone } from '@/lib/formatters';
import { useAuth } from '@/lib/AuthContext';
import { fileToCompressedDataUrl } from '@/lib/imageUpload';
import { parabaService } from '@/lib/parabaService';
import { isProfessor } from '@/lib/session';
import './Configuracoes.css';

const FAIXAS = ['Branca', 'Cinza', 'Amarela', 'Laranja', 'Verde', 'Azul', 'Roxa', 'Marrom', 'Preta'];
const GRAUS = [0, 1, 2, 3, 4];

export function AdminConfiguracoesEditarPage() {
  const { user, setUser } = useAuth();
  const professor = isProfessor(user);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [nome, setNome] = useState(user?.nome ?? '');
  const [celular, setCelular] = useState(user?.celular ? formatPhone(user.celular) : '');
  const [foto, setFoto] = useState<string | null>(user?.foto ?? null);
  const [faixaAtual, setFaixaAtual] = useState(user?.faixaAtual ?? 'Preta');
  const [graus, setGraus] = useState(user?.graus ?? 0);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        const profile = await parabaService.obterMeuPerfil();
        setUser(profile);
        setNome(profile.nome);
        setCelular(profile.celular ? formatPhone(profile.celular) : '');
        setFoto(profile.foto ?? null);
        setFaixaAtual(profile.faixaAtual?.trim() || 'Preta');
        setGraus(Math.max(0, Math.min(4, profile.graus ?? 0)));
      } catch {
        // Mantém dados da sessao local.
      }
    })();
  }, [setUser]);

  const onPickPhoto = async (file: File) => {
    try {
      setError('');
      setFoto(await fileToCompressedDataUrl(file, { maxSide: 480, quality: 0.7 }));
    } catch (err) {
      setError(apiErrorMessage(err, 'Nao foi possivel processar a foto.'));
    }
  };

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (novaSenha || confirmacao) {
      if (novaSenha.length < 6 || novaSenha !== confirmacao) {
        setError('Para alterar a senha, preencha nova senha (6+) e confirmação iguais.');
        return;
      }
    }
    try {
      setSaving(true);
      const updated = await parabaService.atualizarMeuPerfil({
        nome: nome.trim(),
        celular: celular.trim() || undefined,
        foto,
        ...(professor
          ? {
              faixaAtual: faixaAtual.trim() || null,
              graus,
            }
          : {}),
        novaSenha: novaSenha || undefined,
      });
      setUser(updated);
      setFoto(updated.foto ?? null);
      setFaixaAtual(updated.faixaAtual?.trim() || 'Preta');
      setGraus(Math.max(0, Math.min(4, updated.graus ?? 0)));
      setNovaSenha('');
      setConfirmacao('');
      setMessage('Cadastro atualizado.');
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
          <h1>Editar cadastro</h1>
          <p>
            {professor
              ? 'Atualize nome, celular, foto, faixa, graus e senha.'
              : 'Atualize nome, celular, foto e senha.'}
          </p>
        </div>
      </header>

      {error ? <div className="error-box">{error}</div> : null}
      {message ? (
        <div className="card" style={{ borderColor: 'var(--secondary)', color: 'var(--secondary)', fontWeight: 700 }}>
          {message}
        </div>
      ) : null}

      <form className="card stack" onSubmit={saveProfile}>
        <div className="row" style={{ alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 999,
              overflow: 'hidden',
              background: '#2a2f36',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: 24,
              flexShrink: 0,
            }}
          >
            {foto ? (
              <img src={foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              (nome.trim().charAt(0) || user?.nome?.trim().charAt(0) || '?').toUpperCase()
            )}
          </div>
          <div className="stack" style={{ gap: 8, flex: 1 }}>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (file) void onPickPhoto(file);
              }}
            />
            <button
              type="button"
              className="btn btn-secondary"
              disabled={saving}
              onClick={() => photoInputRef.current?.click()}
            >
              {foto ? 'Trocar foto' : 'Adicionar foto'}
            </button>
            {foto ? (
              <button type="button" className="btn btn-ghost" disabled={saving} onClick={() => setFoto(null)}>
                Remover foto
              </button>
            ) : null}
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              {professor
                ? 'A foto, faixa e graus aparecem em Nossos lutadores e no carrossel de depoimentos.'
                : 'A foto aparece no carrossel de depoimentos do site, se você tiver depoimento publicado.'}
            </p>
          </div>
        </div>

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

        {professor ? (
          <>
            <div>
              <label className="label">Faixa</label>
              <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
                {FAIXAS.map((faixa) => (
                  <button
                    key={faixa}
                    type="button"
                    className={`chip ${faixaAtual === faixa ? 'active' : ''}`}
                    onClick={() => setFaixaAtual(faixa)}
                  >
                    {faixa}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Graus</label>
              <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
                {GRAUS.map((grau) => (
                  <button
                    key={grau}
                    type="button"
                    className={`chip ${graus === grau ? 'active' : ''}`}
                    onClick={() => setGraus(grau)}
                  >
                    {grau}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : null}

        <h3 style={{ margin: '8px 0 0' }}>Alterar senha (opcional)</h3>
        <input
          className="input"
          type="password"
          placeholder="Nova senha"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
          autoComplete="new-password"
        />
        <input
          className="input"
          type="password"
          placeholder="Confirmar nova senha"
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
          autoComplete="new-password"
        />
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </form>
    </div>
  );
}
