# PIX – Sistema de Recorrências (Banco do Brasil)

Painel admin, geração de QR Code e PIX Copia e Cola, API para integração externa.

---

## Acesso

- **Produção:** https://pix.masterclassic.com.br  
- **API:** https://pix.masterclassic.com.br/api/v1/pix  

```bash
npm install
npm start
```

Local: `http://localhost:3000` — Login: `admin` / `CeciM@042425`

---

## Certificados SSL (BB)

Coloque em **`certificates/`**: `cert.pem` e `key.pem` (ou use variáveis `SSL_CERT` e `SSL_KEY`). Use os mesmos certificados do n8n (Vida Ouro).

---

## API

- `POST /api/pix/jornada3` – Criar recorrência (body: `pixUserId`, dados do devedor/recebedor; opcional `oauthToken`)
- `GET /api/pix/qrcode/:txid` – Obter QR Code
- `GET /api/version` – Versão e build
- `GET /health` – Health check

Integração externa: header `X-API-Key`; `POST /api/v1/pix/jornada3`, `GET /api/v1/pix/qrcode/:txid`, etc.

---

## Credenciais BB (produção)

No servidor, no `.env`: `BasicToken=...` e `APIKey=...` (iguais ao n8n Jornada 3 - Produção). Depois:

```bash
node scripts/set-pix-credentials.js
```

Se der **429** ou **401** no OAuth: adicione no `.env` a linha `BB_OAUTH_TOKEN=...` (token do n8n, nó "2. OAuth Token") e reinicie o PM2. Ou use o campo "Token OAuth BB (opcional)" no formulário de Teste PIX.

---

## Erros comuns

- **429 / 401 OAuth:** Use `BB_OAUTH_TOKEN` no `.env` ou cole o token no campo "Token OAuth BB (opcional)" no painel.
- **502 (Nginx):** Confira se o PM2 está online (`pm2 status`) e se o app sobe sem erro (`pm2 logs pix-system`).
- **Certificado:** `cert.pem` e `key.pem` em `certificates/` (ou SSL_CERT/SSL_KEY).

---

## Deploy

Ver **DEPLOY.md**: no PC `git push origin main`; no servidor `git fetch` + `git reset --hard origin/main` + `npm install` + `pm2 restart pix-system --update-env`.
