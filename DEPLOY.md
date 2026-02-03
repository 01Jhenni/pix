# Deploy: PC → GitHub → Servidor

## No PC (enviar pro GitHub)

```powershell
cd C:\Users\Jhennifer\Desktop\pix\pix
git add .
git commit -m "PIX: ajustes rotas, SQLite, deploy"
git push origin main
```

(Se a branch for `master`: `git push origin master`.)

---

## No servidor (atualizar e reiniciar)

```bash
cd /root/pix
git fetch origin main
git reset --hard origin/main
npm install
pm2 restart pix-system --update-env
pm2 logs pix-system --lines 20
```

(Se a branch for `master`: use `origin master` no `git fetch`.)

---

## Credenciais no servidor

No `.env` (pasta `/root/pix`):

- `BasicToken=...` e `APIKey=...` (produção, iguais ao n8n) → depois: `node scripts/set-pix-credentials.js`
- Se der **429** ou **401** no OAuth: adicione `BB_OAUTH_TOKEN=...` (token do n8n, nó "2. OAuth Token") e reinicie o PM2.

---

## Conferir se atualizou

- Abra `https://pix.masterclassic.com.br/api/version` — deve retornar JSON com `version`, `build`, `bbOAuthTokenLoaded`.
- Se retornar 404 ou 502: servidor com código antigo ou app caiu; rode de novo o bloco "No servidor" acima.

**Se o log mostrar "SyntaxError: Unexpected token '}'":** no servidor rode `node --check server.js` (na pasta `/root/pix`). Se falhar, a mensagem indica o arquivo com erro. Corrija ou atualize o código com `git fetch origin main` e `git reset --hard origin/main`.
