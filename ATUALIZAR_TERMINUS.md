# 🔄 Comandos para Atualizar no Terminus

## 📋 Comandos Completos (Copiar e Colar)

Execute estes comandos no terminal do Terminus:

```bash
# 1. Navegar até o diretório do projeto
cd /root/pix

# 2. Atualizar código do GitHub
git pull origin main

# 3. Instalar/atualizar dependências
npm install --build-from-source

# 4. Criar admin (se necessário - será criado automaticamente, mas pode executar para garantir)
npm run create:admin

# 5. Reiniciar servidor com PM2
pm2 restart pix-system

# 6. Verificar se está rodando
pm2 status

# 7. Ver logs
pm2 logs pix-system --lines 50
```

---

## 🔍 Verificar se Atualizou

```bash
# Ver último commit
git log -1

# Verificar se o arquivo foi atualizado
grep "ensureAdminExists" server.js

# Verificar se admin foi criado
sqlite3 /root/pix/data/pix.db "SELECT email, username FROM auth_users;"
```

---

## ✅ O que Foi Atualizado

- ✅ Login e senha configurados (admin@admin.com / CeciM@042425)
- ✅ Autenticação reabilitada no frontend
- ✅ Admin criado automaticamente na inicialização
- ✅ Persistência do banco de dados garantida
- ✅ Servidor configurado para escutar em 0.0.0.0

---

## 🚨 Se Der Erro

### Erro: "Cannot find package 'better-sqlite3'"

```bash
npm install --build-from-source better-sqlite3
```

### Erro: "pm2: command not found"

```bash
npm install -g pm2
pm2 start server.js --name pix-system
pm2 save
```

### Erro: "git pull" falha

```bash
# Verificar remote
git remote -v

# Se não tiver, adicionar
git remote add origin https://github.com/01Jhenni/pix.git

# Fazer pull novamente
git pull origin main
```

---

## 📝 Após Atualizar

1. **Testar login:**
   - Acesse: `https://pix.masterclassic.com.br` (ou `http://`)
   - Email: `admin@admin.com`
   - Senha: `CeciM@042425`

2. **Verificar banco de dados:**
   ```bash
   ls -lh /root/pix/data/pix.db
   ```

3. **Verificar logs:**
   ```bash
   pm2 logs pix-system
   ```

---

## 🔄 Comando Único (Tudo de Uma Vez)

```bash
cd /root/pix && git pull origin main && npm install --build-from-source && npm run create:admin && pm2 restart pix-system && pm2 logs pix-system --lines 20
```

