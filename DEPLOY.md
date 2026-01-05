# 🚀 Guia de Deploy - GitHub e Hetzner

Este guia explica como fazer deploy do sistema PIX Jornada 3 no GitHub e depois no servidor Hetzner.

## 📦 Preparação para GitHub

### 1. Verificar arquivos sensíveis

Certifique-se de que os seguintes arquivos NÃO serão commitados:
- `pix_system.json` (banco de dados)
- `certificates/*.pem`, `certificates/*.key` (certificados SSL)
- `certificates/passphrase.txt` (senha dos certificados)
- `.env` (variáveis de ambiente)

### 2. Inicializar repositório Git (se ainda não foi feito)

```bash
git init
git add .
git commit -m "Initial commit: Sistema PIX Jornada 3"
```

### 3. Criar repositório no GitHub

1. Acesse https://github.com
2. Clique em "New repository"
3. Escolha um nome (ex: `pix-jornada3-system`)
4. NÃO marque "Initialize with README"
5. Clique em "Create repository"

### 4. Conectar e fazer push

```bash
# Adicionar remote
git remote add origin https://github.com/SEU_USUARIO/pix-jornada3-system.git

# Renomear branch principal (se necessário)
git branch -M main

# Fazer push
git push -u origin main
```

## 🖥️ Deploy no Servidor Hetzner

### Pré-requisitos no servidor

- Ubuntu 20.04+ ou Debian 11+
- Node.js 18+ instalado
- Git instalado
- PM2 instalado (gerenciador de processos)

### 1. Conectar ao servidor

```bash
ssh root@SEU_IP_HETZNER
```

### 2. Instalar dependências no servidor

```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Instalar PM2 globalmente
npm install -g pm2

# Instalar Git (se não estiver instalado)
apt install -y git
```

### 3. Clonar repositório

```bash
# Criar diretório para aplicação
mkdir -p /var/www
cd /var/www

# Clonar repositório
git clone https://github.com/SEU_USUARIO/pix-jornada3-system.git
cd pix-jornada3-system
```

### 4. Instalar dependências do projeto

```bash
npm install --production
```

### 5. Configurar certificados SSL

```bash
# Criar diretório de certificados
mkdir -p certificates

# Copiar certificados (use scp do seu computador local)
# No seu computador local, execute:
# scp certificates/*.pem root@SEU_IP_HETZNER:/var/www/pix-jornada3-system/certificates/
# scp certificates/passphrase.txt root@SEU_IP_HETZNER:/var/www/pix-jornada3-system/certificates/
```

### 6. Configurar variáveis de ambiente (opcional)

```bash
# Criar arquivo .env se necessário
nano .env
```

Exemplo de `.env`:
```
PORT=3000
NODE_ENV=production
```

### 7. Iniciar aplicação com PM2

```bash
# Iniciar aplicação
pm2 start server.js --name "pix-jornada3"

# Salvar configuração do PM2
pm2 save

# Configurar PM2 para iniciar no boot
pm2 startup
```

### 8. Configurar Nginx (Recomendado)

```bash
# Instalar Nginx
apt install -y nginx

# Criar configuração
nano /etc/nginx/sites-available/pix-jornada3
```

Conteúdo do arquivo:
```nginx
server {
    listen 80;
    server_name SEU_DOMINIO.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Ativar site
ln -s /etc/nginx/sites-available/pix-jornada3 /etc/nginx/sites-enabled/

# Testar configuração
nginx -t

# Reiniciar Nginx
systemctl restart nginx
```

### 9. Configurar SSL com Let's Encrypt (Opcional mas recomendado)

```bash
# Instalar Certbot
apt install -y certbot python3-certbot-nginx

# Obter certificado
certbot --nginx -d SEU_DOMINIO.com

# Renovação automática
certbot renew --dry-run
```

## 🔄 Atualizar Aplicação

Para atualizar a aplicação quando houver mudanças no GitHub:

```bash
# No servidor
cd /var/www/pix-jornada3-system
git pull origin main
npm install --production
pm2 restart pix-jornada3
```

## 📊 Monitoramento

### Ver logs

```bash
# Logs em tempo real
pm2 logs pix-jornada3

# Últimas 100 linhas
pm2 logs pix-jornada3 --lines 100
```

### Status da aplicação

```bash
pm2 status
pm2 info pix-jornada3
```

### Reiniciar aplicação

```bash
pm2 restart pix-jornada3
```

### Parar aplicação

```bash
pm2 stop pix-jornada3
```

## 🔒 Segurança

1. **Firewall**: Configure UFW
```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

2. **Usuário não-root**: Crie um usuário específico para a aplicação
```bash
adduser pixuser
usermod -aG sudo pixuser
```

3. **Permissões**: Ajuste permissões dos arquivos
```bash
chown -R pixuser:pixuser /var/www/pix-jornada3-system
```

## 📝 Checklist de Deploy

- [ ] Repositório criado no GitHub
- [ ] Código commitado e enviado para GitHub
- [ ] Servidor Hetzner configurado
- [ ] Node.js instalado no servidor
- [ ] PM2 instalado e configurado
- [ ] Repositório clonado no servidor
- [ ] Dependências instaladas
- [ ] Certificados SSL copiados
- [ ] Aplicação iniciada com PM2
- [ ] Nginx configurado (opcional)
- [ ] SSL configurado (opcional)
- [ ] Firewall configurado
- [ ] Aplicação testada e funcionando

## 🆘 Troubleshooting

### Aplicação não inicia

```bash
# Verificar logs
pm2 logs pix-jornada3

# Verificar se porta está em uso
netstat -tulpn | grep 3000

# Verificar permissões
ls -la /var/www/pix-jornada3-system
```

### Erro de certificados SSL

```bash
# Verificar se certificados existem
ls -la certificates/

# Verificar permissões
chmod 600 certificates/*.pem
chmod 600 certificates/*.key
```

### Porta 3000 não acessível

```bash
# Verificar firewall
ufw status

# Verificar se aplicação está rodando
pm2 status
```

## 📞 Suporte

Em caso de problemas, verifique:
1. Logs do PM2: `pm2 logs pix-jornada3`
2. Logs do Nginx: `tail -f /var/log/nginx/error.log`
3. Status do sistema: `pm2 status` e `systemctl status nginx`

