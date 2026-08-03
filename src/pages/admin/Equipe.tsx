import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { apiErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { fileToCompressedDataUrl } from '@/lib/imageUpload';
import { parabaService } from '@/lib/parabaService';
import { isAluno } from '@/lib/session';
import {
  getStudentCategoryByBirthDate,
  STUDENT_CATEGORY_FILTERS,
  type StudentCategoryId,
} from '@/lib/studentCategories';
import type { EquipeAluno } from '@/lib/types';
import './Equipe.css';

const BELT_COLORS: Record<string, string> = {
  branca: '#f4f4f5',
  cinza: '#9ca3af',
  amarela: '#eab308',
  laranja: '#ea580c',
  verde: '#16a34a',
  azul: '#1d4ed8',
  roxa: '#7c3aed',
  marrom: '#78350f',
  preta: '#111111',
};

const FAIXA_RANK: Record<string, string> = {
  preta: '0',
  marrom: '1',
  roxa: '2',
  azul: '3',
  verde: '4',
  laranja: '5',
  amarela: '6',
  cinza: '7',
  branca: '8',
};

function beltColor(faixa?: string | null): string {
  if (!faixa) return '#6b7280';
  return BELT_COLORS[faixa.trim().toLowerCase()] ?? '#6b7280';
}

function faixaRank(faixa?: string | null): number {
  if (!faixa) return 99;
  const key = faixa.trim().toLowerCase();
  return FAIXA_RANK[key] != null ? Number(FAIXA_RANK[key]) : 98;
}

function normalizeGraus(graus?: number | null): number {
  return Math.max(0, Math.min(4, graus ?? 0));
}

function displayName(membro: EquipeAluno): string {
  return membro.apelido?.trim() || membro.nome;
}

function formatBirthDateWithAge(iso?: string | null): string | null {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  const birth = new Date(y, m - 1, d);
  const now = new Date();
  let age = now.getFullYear() - y;
  const hadBirthday = now.getMonth() > m - 1 || (now.getMonth() === m - 1 && now.getDate() >= d);
  if (!hadBirthday) age -= 1;
  const label = birth.toLocaleDateString('pt-BR');
  return `${label} · ${age} anos`;
}

function EquipeMemberCard({
  membro,
  savingPhoto,
  onChangePhoto,
}: {
  membro: EquipeAluno;
  savingPhoto?: boolean;
  onChangePhoto?: (file: File) => void;
}) {
  const faixa = membro.faixaAtual?.trim() || 'Sem faixa';
  const graus = normalizeGraus(membro.graus);
  const color = beltColor(membro.faixaAtual);
  const birth = formatBirthDateWithAge(membro.dataNascimento);
  const category = getStudentCategoryByBirthDate(membro.dataNascimento);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMe = Boolean(membro.isMe);

  return (
    <article className={`equipe-card card${isMe ? ' is-me' : ''}`}>
      <div className="equipe-card-info">
        <strong>
          {displayName(membro)}
          {isMe ? ' · você' : ''}
        </strong>
        {membro.apelido && membro.apelido !== membro.nome ? (
          <span className="muted">{membro.nome}</span>
        ) : null}
        {birth ? <span className="muted">{birth}</span> : null}
        {category ? <span className="muted">Categoria: {category.label}</span> : null}
        <span className="equipe-faixa-label">
          {faixa}
          {graus > 0 ? ` · ${graus} grau${graus === 1 ? '' : 's'}` : ''}
        </span>
        {isMe ? (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (file && onChangePhoto) onChangePhoto(file);
              }}
            />
            <button
              type="button"
              className="equipe-photo-btn"
              disabled={savingPhoto}
              onClick={() => inputRef.current?.click()}
            >
              {savingPhoto ? 'Salvando foto...' : membro.foto ? 'Trocar minha foto' : 'Adicionar minha foto'}
            </button>
          </>
        ) : null}
      </div>

      <button
        type="button"
        className={`equipe-photo-wrap${isMe ? ' is-editable' : ''}`}
        disabled={!isMe || savingPhoto}
        onClick={() => {
          if (isMe) inputRef.current?.click();
        }}
        aria-label={isMe ? 'Trocar minha foto' : undefined}
      >
        <img
          src={membro.foto || '/sem-foto.png'}
          alt={displayName(membro)}
          className="equipe-photo"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src = '/sem-foto.png';
          }}
        />
        <div
          className="equipe-belt"
          aria-label={`${faixa}, ${graus} grau${graus === 1 ? '' : 's'}`}
        >
          <span className="equipe-belt-end" style={{ backgroundColor: color }} />
          <span className="equipe-belt-center">
            {Array.from({ length: graus }).map((_, index) => (
              <span key={index} className="equipe-degree" />
            ))}
          </span>
          <span className="equipe-belt-end" style={{ backgroundColor: color }} />
        </div>
        {isMe ? <span className="equipe-photo-badge">✎</span> : null}
      </button>
    </article>
  );
}

export function AdminEquipePage() {
  const { user } = useAuth();
  const aluno = isAluno(user);
  const [equipe, setEquipe] = useState<EquipeAluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<StudentCategoryId>('all');

  useEffect(() => {
    if (!aluno) return;
    void (async () => {
      try {
        setLoading(true);
        setError('');
        setEquipe(await parabaService.listarEquipe());
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [aluno]);

  const filtered = useMemo(() => {
    const list = [...equipe].sort((a, b) => {
      const byFaixa = faixaRank(a.faixaAtual) - faixaRank(b.faixaAtual);
      if (byFaixa !== 0) return byFaixa;
      const byGraus = normalizeGraus(b.graus) - normalizeGraus(a.graus);
      if (byGraus !== 0) return byGraus;
      return displayName(a).localeCompare(displayName(b), 'pt-BR', { sensitivity: 'base' });
    });

    if (categoryFilter === 'all') return list;
    return list.filter((membro) => getStudentCategoryByBirthDate(membro.dataNascimento)?.id === categoryFilter);
  }, [equipe, categoryFilter]);

  const updateMyPhoto = async (file: File) => {
    try {
      setSavingPhoto(true);
      setError('');
      setMessage('');
      const foto = await fileToCompressedDataUrl(file);
      const updated = await parabaService.atualizarMinhaFotoEquipe(foto);
      setEquipe((prev) =>
        prev.map((item) => (item.isMe || item.id === updated.id ? { ...item, ...updated, isMe: true } : item))
      );
      setMessage('Foto atualizada.');
    } catch (err) {
      setError(apiErrorMessage(err, 'Nao foi possivel atualizar a foto.'));
    } finally {
      setSavingPhoto(false);
    }
  };

  if (!aluno) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="stack">
      <header className="admin-header">
        <div>
          <h1>Equipe</h1>
          <p>Lutadores ativos da Equipe Paraba.</p>
        </div>
      </header>

      <div className="card stack" style={{ gap: 10 }}>
        <strong style={{ fontSize: 14 }}>Filtrar por categoria</strong>
        <div className="row" style={{ gap: 8 }}>
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

      {error ? <div className="error-box">{error}</div> : null}
      {message ? (
        <div className="card" style={{ borderColor: 'var(--secondary)', color: 'var(--secondary)', fontWeight: 700 }}>
          {message}
        </div>
      ) : null}
      {loading ? <p className="muted">Carregando...</p> : null}
      {!loading && filtered.length === 0 ? (
        <p className="empty">
          {equipe.length === 0 ? 'Nenhum aluno na equipe.' : 'Nenhum aluno nesta categoria.'}
        </p>
      ) : null}

      <div className="equipe-grid">
        {filtered.map((membro) => (
          <EquipeMemberCard
            key={membro.id}
            membro={membro}
            savingPhoto={membro.isMe ? savingPhoto : false}
            onChangePhoto={membro.isMe ? (file) => void updateMyPhoto(file) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
