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
node scripts/fix-pixservice-syntax.js
node --check server.js
pm2 restart pix-system --update-env
pm2 logs pix-system --lines 20
```

(Se a branch for `master`: use `origin master` no `git fetch`.)  
O script `fix-pixservice-syntax.js` remove a linha `};` extra que causa o SyntaxError. Se o script não existir no servidor, faça primeiro o push do PC (seção "No PC") e depois o pull.

---

## Credenciais no servidor

No `.env` (pasta `/root/pix`):

- `BasicToken=...` e `APIKey=...` (produção, iguais ao n8n) → depois: `node scripts/set-pix-credentials.js`
- Se der **429** ou **401** no OAuth: adicione `BB_OAUTH_TOKEN=...` (token do n8n, nó "2. OAuth Token") e reinicie o PM2.

---

## Conferir se atualizou

- Abra `https://pix.masterclassic.com.br/api/version` — deve retornar JSON com `version`, `build`, `bbOAuthTokenLoaded`.
- Se retornar 404 ou 502: servidor com código antigo ou app caiu; rode de novo o bloco "No servidor" acima.

**Se o log mostrar "SyntaxError: Unexpected token '}'":** no servidor rode: `cd /root/pix && node scripts/fix-pixservice-syntax.js && node --check server.js && pm2 restart pix-system --update-env`. Se o script disser "Arquivo ja esta correto", edite manualmente: `nano /root/pix/services/pixService.js`, vá até a linha após `throw new Error(finalErrorMsg);` e apague a linha que contém só `};`.
