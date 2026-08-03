import { useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import './Landing.css';

type PublicAluno = {
  id: string;
  nome: string;
  apelido?: string | null;
  foto?: string | null;
  faixaAtual?: string | null;
  graus?: number | null;
};

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

function beltColor(faixa?: string | null): string {
  if (!faixa) return '#6b7280';
  return BELT_COLORS[faixa.trim().toLowerCase()] ?? '#6b7280';
}

function beltNeedsDarkText(faixa?: string | null): boolean {
  const key = (faixa ?? '').trim().toLowerCase();
  return key === 'branca' || key === 'amarela' || key === 'cinza';
}

function displayName(aluno: PublicAluno): string {
  return aluno.apelido?.trim() || aluno.nome;
}

export function LandingPage() {
  const [alunos, setAlunos] = useState<PublicAluno[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const pauseRef = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoaded(true), 40);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/equipe/public`);
        if (!response.ok) return;
        const json = (await response.json()) as { data?: PublicAluno[] } | PublicAluno[];
        setAlunos(Array.isArray(json) ? json : json.data ?? []);
      } catch {
        // Site de divulgacao nao deve quebrar sem a API.
      }
    })();
  }, []);

  useEffect(() => {
    if (alunos.length < 2) return;

    const id = window.setInterval(() => {
      if (pauseRef.current) return;
      setActiveIndex((current) => (current + 1) % alunos.length);
    }, 3800);

    return () => window.clearInterval(id);
  }, [alunos.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || alunos.length === 0) return;
    const card = track.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    card?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeIndex, alunos.length]);

  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <div className={`landing ${loaded ? 'is-ready' : ''}`}>
      <section className="hero" aria-label="Equipe Paraba">
        <div className="hero-media" aria-hidden="true">
          <img className="hero-logo-mark" src="/logo.png" alt="" />
          <div className="hero-wash" />
        </div>

        <header className="hero-top">
          <div className="brand-lockup">
            <img src="/logo.png" alt="" />
            <span>Equipe Paraba</span>
          </div>
        </header>

        <div className="hero-copy">
          <p className="brand-title">Equipe Paraba</p>
          <h1>Jiu-Jitsu com disciplina, respeito e evolução.</h1>
          <p className="hero-lead">Treinos para kids, juvenil e adulto — uma equipe, um mat.</p>
          <div className="hero-cta">
            <a
              className="cta-primary"
              href="https://play.google.com/store/apps/details?id=br.com.equipeparaba"
              target="_blank"
              rel="noreferrer"
            >
              Baixar o app
            </a>
            <a className="cta-secondary" href="#equipe">
              Conhecer a equipe
            </a>
          </div>
        </div>
      </section>

      <section className="equipe" id="equipe">
        <div className="equipe-head">
          <h2>A equipe</h2>
          <p>Alunos ativos no tatame.</p>
        </div>

        {alunos.length === 0 ? (
          <p className="equipe-empty">Em breve, os atletas da Equipe Paraba aparecem aqui.</p>
        ) : (
          <div
            className="carousel"
            onMouseEnter={() => {
              pauseRef.current = true;
            }}
            onMouseLeave={() => {
              pauseRef.current = false;
            }}
          >
            <div className="carousel-track" ref={trackRef}>
              {alunos.map((aluno, index) => {
                const faixa = aluno.faixaAtual?.trim() || 'Sem faixa';
                const graus = aluno.graus ?? 0;
                const color = beltColor(aluno.faixaAtual);
                const darkText = beltNeedsDarkText(aluno.faixaAtual);

                return (
                  <article
                    key={aluno.id}
                    className={`member ${index === activeIndex ? 'is-active' : ''}`}
                    data-index={index}
                    onClick={() => setActiveIndex(index)}
                  >
                    <div className="member-photo">
                      <img src={aluno.foto || '/sem-foto.png'} alt={displayName(aluno)} loading="lazy" />
                    </div>
                    <div className="member-meta">
                      <h3>{displayName(aluno)}</h3>
                      <div
                        className={`belt-bar ${darkText ? 'is-light' : ''}`}
                        style={{ backgroundColor: color }}
                      >
                        <span>
                          {faixa} ({graus})
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="carousel-dots" role="tablist" aria-label="Alunos">
              {alunos.map((aluno, index) => (
                <button
                  key={aluno.id}
                  type="button"
                  className={index === activeIndex ? 'is-active' : ''}
                  aria-label={`Ver ${displayName(aluno)}`}
                  onClick={() => setActiveIndex(index)}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="close">
        <h2>Treine com a gente</h2>
        <p>Baixe o app da Equipe Paraba e fique por dentro da rotina da equipe.</p>
        <a
          className="cta-primary"
          href="https://play.google.com/store/apps/details?id=br.com.equipeparaba"
          target="_blank"
          rel="noreferrer"
        >
          Google Play
        </a>
      </section>

      <footer className="site-footer">
        <span>© {year} Equipe Paraba</span>
      </footer>
    </div>
  );
}
