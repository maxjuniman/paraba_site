# Equipe Paraba — Site

Site React (Vite) de **divulgação** (single page) + painel admin em `/admin`.

## Divulgação (`/`)

Landing pública com:
- Hero da marca
- Carrossel dos alunos ativos (foto + faixa com grau entre parênteses)
- CTA para o app na Google Play

Sem link para o admin na página pública. O admin continua em `/admin/login` (URL direta).

## API pública usada na landing

`GET /api/equipe/public` — lista alunos ativos (`id`, `nome`, `apelido`, `foto`, `faixaAtual`, `graus`).

## Rodar

```bash
cd Site
npm install
npm run dev
```

Abre em `http://localhost:5173`.

Configure em `.env`:

```bash
VITE_PARABA_API_URL=https://apiparaba.maxfoot.com.br
```

## Admin (`/admin`)

Login de professor + painel (alunos, autorizações, presenças, pagamentos, calendário, configurações), mesmo backend do aplicativo. Sem AdMob e sem notificações push.

## Build

```bash
npm run build
```

Gera `dist/` para hospedar em Vercel, Netlify, Cloudflare Pages, etc.
