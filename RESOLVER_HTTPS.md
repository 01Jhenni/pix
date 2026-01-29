# 🔒 Resolver Problema de HTTPS no Terminus

## ⚠️ Problema

O servidor está rodando, mas não está acessível via HTTPS (porta 443). O Terminus precisa rotear o tráfego HTTPS para a porta do seu servidor.

---

## 🔍 Verificações Iniciais

### 1. Verificar se o Servidor Está Rodando

```bash
pm2 status
```

Deve mostrar o processo `pix-system` como `online`.

### 2. Verificar se Está Escutando na Porta Correta

```bash
netstat -tlnp | grep 3000
# ou
ss -tlnp | grep 3000
```

Deve mostrar algo como:
```
tcp  0  0  0.0.0.0:3000  0.0.0.0:*  LISTEN  PID/node
```

### 3. Testar Localmente

```bash
curl http://localhost:3000/health
```

Deve retornar:
```json
{"status":"ok","timestamp":"...","uptime":...,"version":"2.0.0"}
```

---

## 🔧 Soluções

### Solução 1: Configurar Proxy Reverso no Terminus

O Terminus geralmente usa Nginx ou Caddy como proxy reverso. Você precisa configurar:

#### No Dashboard do Terminus:

1. **Vá em Configurações > Nginx/Caddy/Proxy**
2. **Configure o proxy reverso:**

```nginx
server {
    listen 443 ssl;
    server_name pix.masterclassic.com.br;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Ou se o Terminus tiver interface gráfica:

- **Domínio:** `pix.masterclassic.com.br`
- **Porta Backend:** `3000`
- **Protocolo:** `HTTP` (interno)
- **SSL:** Habilitado (Terminus geralmente gerencia automaticamente)

---

### Solução 2: Verificar Configuração de Porta no Terminus

No dashboard do Terminus:

1. **Vá em Configurações do Projeto**
2. **Verifique a porta configurada:**
   - Deve estar configurado para usar a porta `3000`
   - Ou deixe vazio para usar `PORT` do ambiente

3. **Verifique variáveis de ambiente:**
   ```
   PORT=3000
   NODE_ENV=production
   ```

---

### Solução 3: Usar Porta Padrão do Terminus

Alguns Terminus usam portas específicas. Verifique qual porta o Terminus espera:

```bash
# Verificar variável PORT
echo $PORT

# Verificar processos escutando
netstat -tlnp
```

Se o Terminus usar outra porta (ex: 8080, 5000), atualize o código:

```bash
cd /root/pix
# Editar server.js ou usar variável de ambiente
PORT=${PORT:-3000} npm start
```

---

### Solução 4: Configurar Nginx Manualmente (se tiver acesso)

Se você tiver acesso root e o Terminus não configurar automaticamente:

```bash
# Instalar Nginx (se não estiver instalado)
apt update
apt install -y nginx

# Criar configuração
nano /etc/nginx/sites-available/pix.masterclassic.com.br
```

Cole:

```nginx
server {
    listen 80;
    server_name pix.masterclassic.com.br;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name pix.masterclassic.com.br;

    # SSL (Terminus geralmente gerencia isso)
    # ssl_certificate /etc/ssl/certs/pix.masterclassic.com.br.crt;
    # ssl_certificate_key /etc/ssl/private/pix.masterclassic.com.br.key;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Ativar:

```bash
ln -s /etc/nginx/sites-available/pix.masterclassic.com.br /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## 🔍 Diagnóstico Avançado

### Verificar Logs do PM2

```bash
pm2 logs pix-system
```

Procure por:
- `🚀 Servidor rodando em http://0.0.0.0:3000`
- Erros de conexão
- Erros de porta

### Verificar Firewall

```bash
# Verificar regras do firewall
ufw status
# ou
iptables -L -n

# Se necessário, permitir porta 3000
ufw allow 3000/tcp
```

### Testar Conexão Interna

```bash
# Do próprio servidor
curl http://localhost:3000/health
curl http://127.0.0.1:3000/health
curl http://0.0.0.0:3000/health
```

Todos devem funcionar.

### Verificar se o Terminus Está Roteando

```bash
# Verificar se há processo escutando na porta 443
netstat -tlnp | grep 443
ss -tlnp | grep 443
```

Se não houver nada na 443, o Terminus não está configurado para rotear HTTPS.

---

## ✅ Checklist de Resolução

- [ ] Servidor rodando e acessível em `http://localhost:3000/health`
- [ ] Servidor escutando em `0.0.0.0:3000` (não apenas 127.0.0.1)
- [ ] Domínio configurado no dashboard do Terminus
- [ ] Proxy reverso configurado (Nginx/Caddy) no Terminus
- [ ] Porta 3000 configurada nas variáveis de ambiente
- [ ] SSL/HTTPS habilitado no Terminus
- [ ] Firewall permitindo conexões
- [ ] Teste local funcionando
- [ ] Teste externo funcionando

---

## 🚀 Comandos Rápidos para Testar

```bash
# 1. Verificar status
pm2 status
pm2 logs pix-system --lines 50

# 2. Testar localmente
curl http://localhost:3000/health

# 3. Verificar porta
netstat -tlnp | grep 3000

# 4. Reiniciar se necessário
pm2 restart pix-system

# 5. Verificar logs em tempo real
pm2 logs pix-system
```

---

## 📞 Próximos Passos

1. **Verifique no dashboard do Terminus:**
   - Configurações de domínio
   - Configurações de proxy/nginx
   - Porta configurada

2. **Se o Terminus não tiver interface para proxy:**
   - Entre em contato com suporte do Terminus
   - Ou configure Nginx manualmente (se tiver acesso)

3. **Verifique documentação do Terminus:**
   - Como configurar domínios personalizados
   - Como configurar proxy reverso
   - Como configurar SSL/HTTPS

---

## 💡 Dica Importante

O Terminus geralmente gerencia o proxy reverso e SSL automaticamente. O problema pode ser:
- Domínio não totalmente configurado
- Porta não mapeada corretamente
- SSL ainda sendo gerado (pode levar alguns minutos)

Aguarde alguns minutos após configurar o domínio e tente novamente.

