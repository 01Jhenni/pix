
 Deploy no Terminus - Guia Completo

## 📋 Pré-requisitos

1. Conta no Terminus
2. Git configurado
3. Certificados SSL do Banco do Brasil (cert.pem, key.pem)

## 🚀 Passo a Passo

### 1. Preparar o Repositório Git

```bash
# Se ainda não tiver git inicializado
cd pix
git init
git add .
git commit -m "Preparando para deploy no Terminus"
```

### 2. Criar Repositório no GitHub/GitLab/Bitbucket

1. Crie um repositório no GitHub (ou GitLab/Bitbucket)
2. Faça push do código:

```bash
git remote add origin https://github.com/01Jhenni/pix.git
git branch -M main
git push -u origin main
```

### 3. Configurar no Terminus

#### Opção A: Via Dashboard do Terminus

1. Acesse o dashboard do Terminus
2. Clique em "Novo Projeto" ou "Criar Aplicação"
3. Selecione "Deploy via Git"
4. Conecte seu repositório (GitHub/GitLab/Bitbucket)
5. Configure:
   - **Nome do projeto**: `pix-jornada3`
   - **Branch**: `main` ou `master`
   - **Build Command**: `npm install` (ou `npm ci` para instalação limpa)
   - **Start Command**: `npm start`
   - **Porta**: Deixe vazio (Terminus usa variável PORT automaticamente)
   
   **IMPORTANTE**: O `better-sqlite3` precisa ser compilado. Se o build falhar, adicione no Build Command:
   ```
   npm install --build-from-source
   ```
   
   Ou configure variáveis de ambiente no Terminus:
   ```
   npm_config_build_from_source=true
   ```

#### Opção B: Via CLI do Terminus (se disponível)

```bash
# Instalar CLI do Terminus (se disponível)
npm install -g @terminus/cli

# Login
terminus login

# Criar projeto
terminus project create pix-jornada3

# Deploy
terminus deploy
```

### 4. Configurar Variáveis de Ambiente

No dashboard do Terminus, vá em **Configurações > Variáveis de Ambiente** e adicione:

```
NODE_ENV=production
PORT=3000
```

### 5. Configurar Certificados SSL

**IMPORTANTE**: Os certificados SSL do Banco do Brasil precisam estar no servidor.

#### Opção 1: Via Variáveis de Ambiente (Recomendado)

No Terminus, adicione as variáveis:

```
SSL_CERT=<conteúdo completo do cert.pem>
SSL_KEY=<conteúdo completo do key.pem>
SSL_CA=<conteúdo do ca.pem> (opcional)
SSL_PASSPHRASE=<senha> (se necessário)
```

E modifique o código para ler dessas variáveis (veja abaixo).

#### Opção 2: Via Volume/Storage

Se o Terminus suportar volumes persistentes:

1. Faça upload dos certificados via dashboard
2. Configure o caminho no código

### 6. Modificar Código para Ler Certificados de Variáveis de Ambiente

Atualize `services/pixService.js` para ler certificados de variáveis de ambiente:

```javascript
function loadSSLCertificates() {
  // Tentar ler de variáveis de ambiente primeiro (Terminus)
  if (process.env.SSL_CERT && process.env.SSL_KEY) {
    console.log('✅ Certificados SSL encontrados nas variáveis de ambiente!');
    return {
      cert: process.env.SSL_CERT,
      key: process.env.SSL_KEY,
      ca: process.env.SSL_CA,
      passphrase: process.env.SSL_PASSPHRASE,
      rejectUnauthorized: !!process.env.SSL_CA
    };
  }
  
  // Fallback: ler de arquivos locais
  const certsDir = path.join(__dirname, '..', 'certificates');
  // ... resto do código existente
}
```

### 7. Fazer Deploy

1. No dashboard do Terminus, clique em **Deploy**
2. Ou faça push para o repositório (se configurou auto-deploy)

```bash
git add .
git commit -m "Preparado para deploy"
git push origin main
```

### 8. Configurar Domínio

No dashboard do Terminus, configure o domínio personalizado:

1. Vá em **Configurações > Domínios**
2. Adicione o domínio: `pix.masterclassic.com.br`
3. Configure o DNS apontando para o Terminus
4. Aguarde a propagação DNS

### 9. Verificar Logs

No dashboard do Terminus, vá em **Logs** e verifique:

- ✅ `✅ Certificados SSL encontrados!`
- ✅ `🚀 Servidor rodando em http://localhost:3000`
- ✅ `✅ Banco de dados local inicializado`
- ✅ Sem erros de certificado SSL

### 10. Acessar o Sistema

Após o deploy, acesse:
- **Painel Admin:** https://pix.masterclassic.com.br
- **API Externa:** https://pix.masterclassic.com.br/api/v1/pix
- **Health Check:** https://pix.masterclassic.com.br/health

## 🔧 Configurações Adicionais

### Health Check

O Terminus pode precisar de um endpoint de health check. Adicione em `server.js`:

```javascript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

### PM2 (Opcional)

Se quiser usar PM2 no Terminus, o arquivo `ecosystem.config.js` já está configurado:

```bash
npm install -g pm2
pm2 start ecosystem.config.js
```

## 📝 Checklist Final

- [ ] Código commitado e no Git
- [ ] Repositório conectado no Terminus
- [ ] Variáveis de ambiente configuradas
- [ ] Certificados SSL configurados (via env ou arquivos)
- [ ] Build command configurado
- [ ] Start command configurado
- [ ] Deploy realizado
- [ ] Logs verificados
- [ ] Aplicação acessível

## 🆘 Troubleshooting

### Erro: "Cannot find module"
- Verifique se `npm install` está sendo executado no build
- Adicione `npm ci` no build command

### Erro: "Port already in use"
- Remova a porta fixa do código
- Use `process.env.PORT || 3000`

### Erro: "SSL Certificate error"
- Verifique se os certificados estão nas variáveis de ambiente
- Confirme que o conteúdo está completo (incluindo `-----BEGIN CERTIFICATE-----`)

### Erro: "Build failed"
- Verifique os logs de build no Terminus
- Confirme que todas as dependências estão em `dependencies` (não `devDependencies`)
- Se o erro for com `better-sqlite3`, tente adicionar no Build Command: `npm install --build-from-source`
- Ou configure a variável de ambiente: `npm_config_build_from_source=true`

### Erro: "Cannot find package 'better-sqlite3'"
- Execute `npm install` novamente no servidor
- Verifique se o Build Command está configurado corretamente: `npm install`
- Se persistir, tente: `npm install --build-from-source better-sqlite3`

## 📞 Suporte

Se tiver problemas, verifique:
1. Logs no dashboard do Terminus
2. Documentação do Terminus
3. Status da aplicação no dashboard

