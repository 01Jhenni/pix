# Deploy: PC → GitHub → Servidor

## No PC (enviar pro GitHub)

**Importante:** use a pasta onde está o `package.json` e o `services/pixService.js`.

```powershell
cd C:\Users\Jhennifer\Desktop\pix\pix
git status
git add .
git commit -m "Fix: SyntaxError pixService.js (remove } extra), script check-syntax"
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
node --check server.js
pm2 restart pix-system --update-env
pm2 logs pix-system --lines 20
```

(Se a branch for `master`: use `origin master` no `git fetch`.)  
Se der **SyntaxError**, rode `node scripts/check-syntax.js` no servidor para ver arquivo e linha; em geral o servidor não recebeu a correção — faça push do PC (seção "No PC").

---

## Credenciais no servidor

No `.env` (pasta `/root/pix`):

- `BasicToken=...` e `APIKey=...` (produção, iguais ao n8n) → depois: `node scripts/set-pix-credentials.js`
- Se der **429** ou **401** no OAuth: adicione `BB_OAUTH_TOKEN=...` (token do n8n, nó "2. OAuth Token") e reinicie o PM2.

---

## Conferir se atualizou

- Abra `https://pix.masterclassic.com.br/api/version` — deve retornar JSON com `version`, `build`, `bbOAuthTokenLoaded`.
- Se retornar 404 ou 502: servidor com código antigo ou app caiu; rode de novo o bloco "No servidor" acima.

**Se o log mostrar "SyntaxError: Unexpected token '}'":** o servidor não tem a correção do `pixService.js`. No PC: `git add .` → `git commit -m "Fix: SyntaxError pixService.js (remove } extra)"` → `git push origin main`. Depois no servidor: `cd /root/pix && git fetch origin main && git reset --hard origin/main && node --check server.js && pm2 restart pix-system --update-env`.
