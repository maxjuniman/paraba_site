import { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';

const PORTFOLIO_URL = 'https://max-juniman.vercel.app/';
const NAV_LINKS = [
  { href: '#equipe', label: 'Equipe' },
  { href: '#depoimentos', label: 'Depoimentos' },
  { href: '#contato', label: 'Contato' },
] as const;

type PublicAluno = {
  id: string;
  nome: string;
  apelido?: string | null;
  foto?: string | null;
  faixaAtual?: string | null;
  graus?: number | null;
  isProfessor?: boolean;
};

type PublicDepoimento = {
  id: string;
  nome: string;
  texto: string;
  faixa?: string | null;
  foto?: string | null;
  ordem?: number;
};

const WHATSAPP_NUMBER = '51993112125';
const WHATSAPP_URL = `https://wa.me/55${WHATSAPP_NUMBER}`;
const INSTAGRAM_URL = 'https://www.instagram.com/ctequipeparaba/';
const ADDRESS = 'Rua Dr. Antônio Mazzaferro Neto, 662';
const MAPS_QUERY = encodeURIComponent(ADDRESS);
const MAPS_EMBED_URL = `https://maps.google.com/maps?q=${MAPS_QUERY}&z=16&output=embed`;
const MAPS_LINK_URL = `https://www.google.com/maps/search/?api=1&query=${MAPS_QUERY}`;

function IconWhatsApp({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function IconInstagram({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

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

const FAIXA_RANK: Record<string, number> = {
  preta: 0,
  marrom: 1,
  roxa: 2,
  azul: 3,
  verde: 4,
  laranja: 5,
  amarela: 6,
  cinza: 7,
  branca: 8,
};

function displayNick(aluno: PublicAluno): string {
  return aluno.apelido?.trim() || aluno.nome.split(/\s+/)[0] || aluno.nome;
}

function faixaRank(faixa?: string | null): number {
  if (!faixa) return 99;
  return FAIXA_RANK[faixa.trim().toLowerCase()] ?? 98;
}

function sortByFaixa(alunos: PublicAluno[]): PublicAluno[] {
  return [...alunos].sort((a, b) => {
    const byFaixa = faixaRank(a.faixaAtual) - faixaRank(b.faixaAtual);
    if (byFaixa !== 0) return byFaixa;
    const byGraus = (b.graus ?? 0) - (a.graus ?? 0);
    if (byGraus !== 0) return byGraus;
    return displayNick(a).localeCompare(displayNick(b), 'pt-BR', { sensitivity: 'base' });
  });
}

function sortEquipePublic(alunos: PublicAluno[]): PublicAluno[] {
  const professors = alunos.filter((item) => item.isProfessor || item.id.startsWith('professor-'));
  const rest = alunos.filter((item) => !item.isProfessor && !item.id.startsWith('professor-'));
  return [...professors, ...sortByFaixa(rest)];
}

function beltColor(faixa?: string | null): string {
  if (!faixa) return '#6b7280';
  return BELT_COLORS[faixa.trim().toLowerCase()] ?? '#6b7280';
}

function normalizeGraus(graus?: number | null): number {
  return Math.max(0, Math.min(4, graus ?? 0));
}

function FighterCard({ aluno }: { aluno: PublicAluno }) {
  const faixa = aluno.faixaAtual?.trim() || 'Sem faixa';
  const graus = normalizeGraus(aluno.graus);
  const color = beltColor(aluno.faixaAtual);

  return (
    <article className="group w-[170px] shrink-0 text-center sm:w-[220px]">
      <div className="relative aspect-3/4 overflow-hidden border border-white/30 bg-[#141414]">
        <img
          src={aluno.foto || '/sem-foto.png'}
          alt={displayNick(aluno)}
          loading="lazy"
          draggable={false}
          className="pointer-events-none h-full w-full object-cover grayscale contrast-110 transition-[filter] duration-300 group-hover:grayscale-0"
        />
        <div
          className="absolute right-[-4px] bottom-3 left-[-4px] flex h-3 overflow-hidden border-[1.5px] border-black bg-black"
          aria-label={`${faixa}, ${graus} grau${graus === 1 ? '' : 's'}`}
        >
          <div className="min-w-0 flex-1 self-stretch" style={{ backgroundColor: color }} />
          <div className="flex min-w-[42px] shrink-0 items-center justify-center gap-[3px] self-stretch bg-black px-1">
            {Array.from({ length: graus }).map((_, index) => (
              <span key={index} className="h-full w-[3px] bg-white" />
            ))}
          </div>
          <div className="min-w-0 flex-1 self-stretch" style={{ backgroundColor: color }} />
        </div>
      </div>
      <p className="mt-3.5 text-lg font-bold leading-tight text-white">{displayNick(aluno)}</p>
      <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-[#9a9a9a]">
        {aluno.nome}
      </p>
      <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-[#9a9a9a]">
        {faixa} ({graus})
      </p>
    </article>
  );
}

function FightersMarquee({ alunos }: { alunos: PublicAluno[] }) {
  const loopItems = useMemo(() => {
    if (alunos.length === 0) return [];
    // Duplica para o loop infinito em CSS (translateX -50%).
    return [...alunos, ...alunos];
  }, [alunos]);

  const durationSec = Math.max(28, alunos.length * 4);

  if (alunos.length === 0) return null;

  return (
    <div className="fighters-marquee overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_4%,#000_96%,transparent)]">
      <div
        className="fighters-track flex w-max gap-[18px] pl-[18px] sm:gap-7 sm:pl-7"
        style={{ animationDuration: `${durationSec}s` }}
      >
        {loopItems.map((aluno, index) => (
          <FighterCard key={`${aluno.id}-${index}`} aluno={aluno} />
        ))}
      </div>
    </div>
  );
}

function initialFromName(nome: string): string {
  const trimmed = nome.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : '?';
}

function TestimonialsSlider({ items }: { items: PublicDepoimento[] }) {
  const [index, setIndex] = useState(0);
  const total = items.length;
  const current = items[index] ?? items[0];

  useEffect(() => {
    setIndex(0);
  }, [items.length]);

  useEffect(() => {
    if (total < 2) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % total);
    }, 7000);
    return () => window.clearInterval(id);
  }, [total]);

  if (!current) return null;

  const goPrev = () => setIndex((prev) => (prev - 1 + total) % total);
  const goNext = () => setIndex((prev) => (prev + 1) % total);

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col items-center text-center">
      <span
        className="font-display text-[clamp(72px,14vw,120px)] leading-none text-[#a33c2a] select-none"
        aria-hidden="true"
      >
        ”
      </span>

      <blockquote className="m-0 mt-2">
        <p
          key={current.id}
          className="m-0 text-[clamp(18px,2.6vw,26px)] leading-relaxed font-medium text-white animate-[hero-fade-up_0.45s_ease]"
        >
          “{current.texto}”
        </p>
      </blockquote>

      <div className="mt-10 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#2a2f36] text-xl font-extrabold text-white">
        {current.foto ? (
          <img
            src={current.foto}
            alt=""
            className="h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
              const sibling = event.currentTarget.nextElementSibling as HTMLElement | null;
              if (sibling) sibling.hidden = false;
            }}
          />
        ) : null}
        <span hidden={Boolean(current.foto)}>{initialFromName(current.nome)}</span>
      </div>
      <cite className="mt-4 text-sm font-extrabold tracking-[0.14em] text-white uppercase not-italic">
        {current.nome}
      </cite>
      {current.faixa ? (
        <span className="mt-2 text-[11px] font-semibold tracking-[0.18em] text-[#8b919a] uppercase">
          {current.faixa}
        </span>
      ) : null}

      {total > 1 ? (
        <div className="mt-12 flex items-center gap-4">
          <button
            type="button"
            onClick={goPrev}
            className="inline-flex h-11 w-11 items-center justify-center border border-white/25 text-white transition hover:border-white/50 hover:bg-white/5"
            aria-label="Depoimento anterior"
          >
            ‹
          </button>

          <div className="flex items-center gap-2" role="tablist" aria-label="Depoimentos">
            {items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Depoimento ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-0.5 transition-all ${
                  i === index ? 'w-8 bg-white' : 'w-5 bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={goNext}
            className="inline-flex h-11 w-11 items-center justify-center border border-white/25 text-white transition hover:border-white/50 hover:bg-white/5"
            aria-label="Próximo depoimento"
          >
            ›
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function LandingPage() {
  const [alunos, setAlunos] = useState<PublicAluno[]>([]);
  const [depoimentos, setDepoimentos] = useState<PublicDepoimento[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoaded(true), 40);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const [equipeRes, depoRes] = await Promise.all([
          fetch(`${API_BASE_URL}/equipe/public`),
          fetch(`${API_BASE_URL}/depoimentos/public`),
        ]);

        if (equipeRes.ok) {
          const json = (await equipeRes.json()) as { data?: PublicAluno[] } | PublicAluno[];
          const list = Array.isArray(json) ? json : json.data ?? [];
          setAlunos(sortEquipePublic(list));
        }

        if (depoRes.ok) {
          const json = (await depoRes.json()) as { data?: PublicDepoimento[] } | PublicDepoimento[];
          setDepoimentos(Array.isArray(json) ? json : json.data ?? []);
        }
      } catch {
        // Site de divulgacao nao deve quebrar sem a API.
      }
    })();
  }, []);

  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <div
      className={`min-h-screen bg-paper font-sans text-ink ${loaded ? 'landing-ready' : ''}`}
    >
      <section
        className="relative isolate flex min-h-svh flex-col overflow-hidden text-cream max-md:justify-start md:justify-between"
        aria-label="Equipe Paraba"
      >
        <div
          className="absolute inset-0 z-0 bg-linear-to-br from-[#171c22] via-[#0d1116] to-[#1a1510]"
          aria-hidden="true"
        >
          <img
            className="hero-mark-enter absolute w-[min(72vw,720px)] mix-blend-soft-light grayscale contrast-105 max-md:top-[16%] max-md:left-1/2 max-md:w-[min(82vw,360px)] max-md:-translate-x-1/2 max-md:opacity-55 max-md:mix-blend-normal max-md:grayscale-0 max-md:contrast-100 md:-right-[8%] md:-bottom-[18%] max-md:right-auto max-md:bottom-auto"
            src="/logo.png"
            alt=""
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_18%_20%,rgba(196,92,38,0.28),transparent_55%),linear-gradient(180deg,rgba(13,17,22,0.15)_0%,rgba(13,17,22,0.72)_70%,#0d1116_100%)] max-md:bg-[radial-gradient(ellipse_90%_55%_at_50%_22%,rgba(196,92,38,0.32),transparent_58%),linear-gradient(180deg,rgba(13,17,22,0.12)_0%,rgba(13,17,22,0.42)_55%,rgba(13,17,22,0.88)_100%)]" />
        </div>

        <header className="hero-enter relative z-20 mx-auto flex w-[min(1120px,calc(100%-40px))] items-center justify-between gap-4 pt-5 md:pt-7">
          <a href="#" className="inline-flex items-center gap-3">
            <img src="/logo.png" alt="Equipe Paraba" className="h-11 w-11 object-contain" />
            <span className="font-extrabold tracking-wide">Equipe Paraba</span>
          </a>

          <nav className="hidden items-center gap-6 md:flex" aria-label="Menu principal">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-bold tracking-wide text-cream/80 transition hover:text-cream"
              >
                {link.label}
              </a>
            ))}
            <a
              href="/admin/login"
              className="inline-flex min-h-10 items-center rounded-[10px] border border-cream/35 px-4 text-sm font-extrabold text-cream transition hover:bg-cream/10"
            >
              Admin
            </a>
          </nav>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center border border-cream/30 text-cream md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="sr-only">{menuOpen ? 'Fechar' : 'Menu'}</span>
            <span className="flex flex-col gap-1.5">
              <span className={`block h-0.5 w-5 bg-cream transition ${menuOpen ? 'translate-y-2 rotate-45' : ''}`} />
              <span className={`block h-0.5 w-5 bg-cream transition ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 w-5 bg-cream transition ${menuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
            </span>
          </button>
        </header>

        {menuOpen ? (
          <div
            id="mobile-menu"
            className="relative z-20 mx-auto mt-4 w-[min(1120px,calc(100%-40px))] border border-cream/15 bg-black/70 p-4 backdrop-blur-md md:hidden"
          >
            <nav className="flex flex-col gap-3" aria-label="Menu mobile">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="py-2 text-sm font-bold tracking-wide text-cream"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 py-2 text-sm font-bold text-cream"
              >
                <IconInstagram className="h-4 w-4" />
                Instagram
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-[#25d366] px-4 text-sm font-extrabold text-[#062410]"
                onClick={() => setMenuOpen(false)}
              >
                <IconWhatsApp className="h-4 w-4" />
                WhatsApp
              </a>
              <a
                href="/admin/login"
                className="inline-flex min-h-11 items-center justify-center rounded-[10px] border border-cream/35 px-4 text-sm font-extrabold text-cream"
                onClick={() => setMenuOpen(false)}
              >
                Admin
              </a>
            </nav>
          </div>
        ) : null}

        <div className="hero-enter-delay relative z-1 mx-auto mt-8 w-[min(1120px,calc(100%-40px))] max-w-[720px] pb-10 max-md:mt-[min(48vh,420px)] max-md:pb-12 sm:pb-14 md:mt-0 lg:ml-[max(20px,calc((100%-1120px)/2))] lg:mr-auto">
          <p className="mb-2.5 font-display text-[clamp(40px,10vw,92px)] leading-[0.9] tracking-[0.03em] max-md:mb-2">
            Equipe Paraba
          </p>
          <h1 className="m-0 max-w-[16ch] text-[clamp(22px,4.4vw,40px)] font-bold leading-[1.15] text-[#f0ebe3]">
            Jiu-Jitsu com disciplina, respeito e evolução.
          </h1>
          <p className="mt-3 max-w-[34ch] text-[16px] leading-normal text-hero-lead md:mt-4 md:text-[17px]">
            Treinos para kids, juvenil e adulto, uma equipe, um material e um propósito.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 md:mt-7">
            <a
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-[10px] bg-[#25d366] px-[22px] font-extrabold text-[#062410] transition hover:-translate-y-px hover:bg-[#2fe075] sm:flex-none"
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
            >
              <IconWhatsApp className="h-5 w-5" />
              Falar no WhatsApp
            </a>
            <a
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-[10px] border border-cream/35 px-[22px] font-extrabold text-cream transition hover:bg-cream/10 sm:flex-none"
              href="#equipe"
            >
              Conhecer a equipe
            </a>
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-[#050505] py-18 text-[#f5f5f5]" id="equipe" aria-label="Nossos lutadores">
        <div className="mx-auto mb-9 w-[min(1200px,calc(100%-48px))]">
          <h2 className="m-0 text-xs font-semibold tracking-[0.28em] text-[#9a9a9a] uppercase">
            Nossos lutadores
          </h2>
        </div>

        {alunos.length === 0 ? (
          <p className="mx-auto w-[min(1200px,calc(100%-48px))] text-[#8a8a8a]">
            Em breve, os atletas da Equipe Paraba aparecem aqui.
          </p>
        ) : (
          <FightersMarquee alunos={alunos} />
        )}
      </section>

      <section className="bg-[#111418] py-22 text-cream" id="depoimentos" aria-label="Depoimentos">
        <div className="mx-auto w-[min(1120px,calc(100%-40px))]">
          <p className="mb-10 text-center text-xs font-bold tracking-[0.28em] text-[#8b919a] uppercase">
            Depoimentos
          </p>
          {depoimentos.length === 0 ? (
            <p className="text-center text-[#8b919a]">Os depoimentos da equipe aparecem aqui em breve.</p>
          ) : (
            <TestimonialsSlider items={depoimentos} />
          )}
        </div>
      </section>

      <section
        className="bg-[radial-gradient(ellipse_70%_80%_at_80%_20%,rgba(196,92,38,0.18),transparent_55%),linear-gradient(145deg,#171c22_0%,#0d1116_55%,#1a1510_100%)] py-22 text-cream"
        id="contato"
        aria-label="Contato"
      >
        <div className="mx-auto grid w-[min(1120px,calc(100%-40px))] gap-12 lg:grid-cols-2 lg:items-end">
          <div>
            <p className="mb-2.5 text-xs font-bold tracking-[0.22em] text-[#b8b2a8] uppercase">Contato</p>
            <h2 className="m-0 font-display text-[clamp(36px,6vw,56px)] leading-[0.95] tracking-[0.03em]">
              Fale com a Equipe Paraba
            </h2>
            <p className="mt-3.5 max-w-[36ch] text-[17px] leading-normal text-hero-lead">
              Tire dúvidas, agende uma aula experimental ou peça informações pelo WhatsApp.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[10px] bg-[#25d366] px-[26px] font-extrabold text-[#062410] transition hover:-translate-y-px hover:bg-[#2fe075]"
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
              >
                <IconWhatsApp className="h-5 w-5" />
                WhatsApp
              </a>
              <a
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[10px] border border-cream/35 px-[26px] font-extrabold text-cream transition hover:bg-cream/10"
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
              >
                <IconInstagram className="h-5 w-5" />
                Instagram
              </a>
            </div>
          </div>

          <div>
            <p className="mb-2.5 text-xs font-bold tracking-[0.22em] text-[#b8b2a8] uppercase">Localização</p>
            <a
              href={MAPS_LINK_URL}
              target="_blank"
              rel="noreferrer"
              className="block text-[17px] font-semibold leading-snug text-cream transition hover:text-white"
            >
              📍 {ADDRESS}
            </a>
            <div className="mt-4 overflow-hidden border border-white/15 bg-[#0a0d11]">
              <iframe
                title={`Mapa — ${ADDRESS}`}
                src={MAPS_EMBED_URL}
                className="h-[260px] w-full border-0 grayscale contrast-125 transition-[filter] duration-300 hover:grayscale-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </section>

      {/* <section className="mx-auto w-[min(720px,calc(100%-40px))] py-18 text-center sm:py-22">
        <h2 className="m-0 font-display text-[clamp(36px,6vw,56px)] tracking-[0.03em]">Treine com a gente</h2>
        <p className="mx-auto mt-3 mb-6 max-w-[36ch] leading-normal text-muted">
          Baixe o app da Equipe Paraba e fique por dentro da rotina da equipe.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <a
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] border border-ink/20 px-[22px] font-extrabold text-ink transition hover:bg-ink/5"
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
          >
            <IconWhatsApp className="h-5 w-5" />
            WhatsApp
          </a>
          <a
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] border border-ink/20 px-[22px] font-extrabold text-ink transition hover:bg-ink/5"
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
          >
            <IconInstagram className="h-5 w-5" />
            Instagram
          </a>
        </div>
      </section> */}

      <footer className="border-t border-white/10 bg-[#0d1116] px-5 pt-[22px] pb-7 text-[13px] text-[#9a9a9a]">
        <div className="mx-auto flex w-[min(1120px,calc(100%-0px))] flex-wrap items-center justify-center gap-x-3 gap-y-2">
          <span>© {year} Equipe Paraba</span>
          <span aria-hidden="true" className="text-white/25">
            ·
          </span>
          <span>
            Desenvolvido por{' '}
            <a
              href={PORTFOLIO_URL}
              target="_blank"
              rel="noreferrer"
              className="font-extrabold text-cream transition hover:text-accent"
            >
              Max Juniman
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
