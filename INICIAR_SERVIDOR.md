# 🚀 Como Iniciar o Servidor no Terminus

## ⚠️ Problema Identificado

O DNS está funcionando, mas o servidor Node.js não está rodando. Siga estes passos:

---

## 📋 Passo a Passo para Iniciar

### 1. Navegar até o Diretório

```bash
cd /root/pix
```

### 2. Verificar se as Dependências Estão Instaladas

```bash
ls -la node_modules
```

Se não existir, instale:

```bash
npm install --build-from-source
```

### 3. Verificar se o Código Está Atualizado

```bash
git pull origin main
```

### 4. Iniciar o Servidor

#### Opção A: Iniciar Diretamente (Recomendado para teste)

```bash
npm start
```

O servidor deve iniciar e mostrar:
```
✅ Banco de dados local inicializado
✅ Frontend estático encontrado em public/
🚀 Servidor rodando em http://localhost:3000
```

**IMPORTANTE**: Deixe este terminal aberto enquanto o servidor estiver rodando.

#### Opção B: Usar PM2 (Para manter rodando em background)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar com PM2
pm2 start server.js --name pix-system

# Ver status
pm2 status

# Ver logs
pm2 logs pix-system

# Salvar configuração para reiniciar automaticamente
pm2 save
pm2 startup
```

---

## 🔧 Configurar Porta e Host

O servidor precisa escutar em todas as interfaces (0.0.0.0) para aceitar conexões externas.

### Verificar server.js

O servidor deve estar configurado para escutar em `0.0.0.0`:

```javascript
app.listen(PORT, '0.0.0.0', () => {
  // ...
});
```

Se não estiver, você pode iniciar assim:

```bash
PORT=3000 HOST=0.0.0.0 npm start
```

---

## ✅ Verificar se Está Funcionando

### 1. Verificar Processo

```bash
ps aux | grep node
```

Deve mostrar o processo do Node.js rodando.

### 2. Testar Localmente

```bash
curl http://localhost:3000/health
```

Deve retornar:
```json
{"status":"ok","timestamp":"...","uptime":...,"version":"2.0.0"}
```

### 3. Testar pelo Domínio

```bash
curl https://pix.masterclassic.com.br/health
```

---

## 🔍 Troubleshooting

### Erro: "Cannot find package 'better-sqlite3'"

```bash
npm install --build-from-source
```

### Erro: "Port already in use"

```bash
# Ver qual processo está usando a porta
lsof -i :3000

# Matar o processo (substitua PID pelo número do processo)
kill -9 PID
```

### Erro: "EADDRINUSE"

A porta 3000 já está em uso. Use outra porta:

```bash
PORT=3001 npm start
```

E configure no Terminus para usar a porta 3001.

### Servidor inicia mas não aceita conexões externas

Verifique se o servidor está escutando em `0.0.0.0`:

```bash
netstat -tlnp | grep 3000
```

Deve mostrar algo como:
```
tcp  0  0  0.0.0.0:3000  0.0.0.0:*  LISTEN  PID/node
```

Se mostrar `127.0.0.1:3000`, o servidor só aceita conexões locais.

---

## 🛠️ Comandos Úteis

### Ver Logs em Tempo Real

```bash
# Se usar npm start diretamente, os logs aparecem no terminal
# Se usar PM2:
pm2 logs pix-system

# Ou ver logs do sistema
journalctl -u pix-system -f
```

### Reiniciar Servidor

```bash
# Se usar PM2:
pm2 restart pix-system

# Se usar npm start:
# Pare com Ctrl+C e inicie novamente
npm start
```

### Parar Servidor

```bash
# Se usar PM2:
pm2 stop pix-system

# Se usar npm start:
# Pressione Ctrl+C no terminal
```

---

## 📝 Checklist

- [ ] Código atualizado do GitHub (`git pull`)
- [ ] Dependências instaladas (`npm install`)
- [ ] Servidor iniciado (`npm start` ou `pm2 start`)
- [ ] Processo Node.js rodando (`ps aux | grep node`)
- [ ] Health check local funcionando (`curl http://localhost:3000/health`)
- [ ] Servidor escutando em 0.0.0.0 (não apenas 127.0.0.1)
- [ ] Health check pelo domínio funcionando (`curl https://pix.masterclassic.com.br/health`)

---

## 🚀 Comando Completo (Copiar e Colar)

Execute tudo de uma vez:

```bash
cd /root/pix && \
git pull origin main && \
npm install --build-from-source && \
PORT=3000 HOST=0.0.0.0 npm start
```

Ou com PM2:

```bash
cd /root/pix && \
git pull origin main && \
npm install --build-from-source && \
npm install -g pm2 && \
pm2 start server.js --name pix-system --update-env && \
pm2 save
```

---

## ⚠️ Importante

- Se usar `npm start` diretamente, o servidor para quando você fechar o terminal
- Use PM2 para manter o servidor rodando em background
- Configure o Terminus para iniciar automaticamente na porta 3000
- Verifique se o firewall permite conexões na porta 3000

