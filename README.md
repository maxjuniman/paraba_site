# Equipe Paraba — Site

Site React (Vite) de **divulgação** (single page) + painel admin em `/admin`.

Estilização com **Tailwind CSS v4** (`@tailwindcss/vite`). Tokens da marca em `src/styles/global.css` (`@theme`).

## Deploy automático (GitHub Actions → VPS)

Push em `main` (ou `workflow_dispatch`) faz build e publica em `167.233.239.13`.

### Secrets no GitHub (`paraba_site` → Settings → Secrets → Actions)

| Secret | Valor |
|--------|--------|
| `VPS_SSH_KEY` | Chave privada SSH do usuário `maxfoot` (mesma da API, se já usa) |
| `VITE_PARABA_API_URL` | URL da API, ex: `https://apiparaba.maxfoot.com.br` |

### O que configurar na VPS

1. **Usuário e pasta**
   ```bash
   sudo mkdir -p /opt/paraba-site/dist
   sudo chown -R maxfoot:maxfoot /opt/paraba-site
   ```

2. **Nginx** (arquivo de exemplo em `deploy/nginx.conf`)
   ```bash
   sudo apt update
   sudo apt install -y nginx
   # cole o conteudo de deploy/nginx.conf em:
   sudo nano /etc/nginx/sites-available/paraba-site
   sudo ln -sf /etc/nginx/sites-available/paraba-site /etc/nginx/sites-enabled/paraba-site
   sudo rm -f /etc/nginx/sites-enabled/default   # se conflitar na porta 80
   sudo nginx -t
   sudo systemctl enable --now nginx
   ```

3. **Permissão de reload sem senha** (para o Action)
   ```bash
   sudo visudo
   # adicione:
   maxfoot ALL=(ALL) NOPASSWD: /usr/sbin/nginx, /bin/systemctl reload nginx
   ```

4. **Firewall**
   ```bash
   sudo ufw allow OpenSSH
   sudo ufw allow 'Nginx Full'
   sudo ufw enable
   ```

5. **DNS** — registro A do domínio apontando para `167.233.239.13`

6. **HTTPS (opcional, recomendado)**
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d seudominio.com.br
   ```

7. **Chave SSH** — a pública correspondente a `VPS_SSH_KEY` deve estar em `~/.ssh/authorized_keys` do usuário `maxfoot`.

Após o primeiro push em `main`, os arquivos ficam em `/opt/paraba-site/dist`.

## Divulgação (`/`)

Landing pública com hero, carrossel da equipe, depoimentos, contato WhatsApp e Instagram. Admin em `/admin/login` (sem link na landing).

## API pública

- `GET /api/equipe/public`
- `GET /api/depoimentos/public`

## Rodar local

```bash
npm install
npm run dev
```

`.env` / produção:

```bash
VITE_PARABA_API_URL=https://apiparaba.maxfoot.com.br
```

## Build

```bash
npm run build
```
