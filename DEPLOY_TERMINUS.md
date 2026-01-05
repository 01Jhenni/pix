# 🚀 Deploy no Terminus via GitHub

Este guia explica como fazer deploy do sistema PIX Jornada 3 no **Terminus** conectando diretamente ao repositório GitHub.

## ✅ Pré-requisitos

- [x] Repositório no GitHub: `https://github.com/01Jhenni/pix`
- [x] Código commitado e enviado para o GitHub
- [ ] Conta no Terminus criada
- [ ] Acesso ao painel do Terminus

---

## 📋 Passo 1: Conectar Repositório GitHub no Terminus

### 1.1 Acessar o Terminus

1. Acesse o painel do Terminus: https://terminus.com (ou URL do seu provedor)
2. Faça login na sua conta

### 1.2 Criar Novo Projeto/Site

1. No painel do Terminus, clique em **"Novo Projeto"** ou **"Add Site"**
2. Selecione a opção **"Conectar Repositório GitHub"** ou **"Deploy from Git"**

### 1.3 Autorizar GitHub

1. Se solicitado, autorize o Terminus a acessar seus repositórios GitHub
2. Selecione o repositório: **`01Jhenni/pix`**
3. Escolha a branch: **`main`**

### 1.4 Configurar Build Settings

O Terminus geralmente detecta automaticamente projetos Node.js, mas verifique:

**Build Command:**
```bash
npm install --production
```

**Start Command:**
```bash
npm start
```

**Ou usando PM2 (se disponível):**
```bash
pm2 start ecosystem.config.js
```

---

## 🔧 Passo 2: Configurar Variáveis de Ambiente

No painel do Terminus, vá em **"Environment Variables"** ou **"Config Vars"** e adicione:

### Variáveis Essenciais:

```env
NODE_ENV=production
PORT=3000
```

### Variáveis Opcionais (se necessário):

```env
# Se você usar variáveis de ambiente para configuração
API_URL=https://seu-dominio.com
```

**⚠️ IMPORTANTE:** Certificados SSL **NÃO** devem ser configurados como variáveis de ambiente. Eles devem ser enviados separadamente (veja Passo 3).

---

## 📁 Passo 3: Configurar Certificados SSL

Os certificados SSL precisam ser enviados para o servidor Terminus. Você tem algumas opções:

### Opção A: Upload via Painel (Recomendado)

1. No painel do Terminus, vá em **"Files"** ou **"File Manager"**
2. Navegue até a pasta `certificates/`
3. Faça upload dos arquivos:
   - `certificado.pem` (ou `.crt`)
   - `chave.pem` (ou `.key`)
   - `passphrase.txt` (se necessário)

### Opção B: Via SSH (Se disponível)

1. Conecte via SSH ao servidor Terminus:
```bash
terminus ssh site.env --site=seu-site
```

2. Navegue até o diretório do projeto:
```bash
cd /path/to/your/app
mkdir -p certificates
```

3. Use `scp` do seu computador local:
```bash
scp certificates/*.pem usuario@servidor-terminus:/path/to/app/certificates/
scp certificates/passphrase.txt usuario@servidor-terminus:/path/to/app/certificates/
```

### Opção C: Via Script de Deploy

Crie um script de deploy que copia os certificados. Adicione no Terminus:

**Deploy Script:**
```bash
#!/bin/bash
# Copiar certificados de um local seguro
# (ajuste os caminhos conforme necessário)
```

---

## 🚀 Passo 4: Configurar Scripts de Build

### 4.1 Verificar package.json

Certifique-se de que o `package.json` tem o script `start`:

```json
{
  "scripts": {
    "start": "node server.js"
  }
}
```

### 4.2 Configurar ecosystem.config.js (Opcional)

Se você usar PM2, o arquivo `ecosystem.config.js` já está configurado:

```javascript
module.exports = {
  apps: [{
    name: 'pix-jornada3',
    script: './server.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

---

## 🔄 Passo 5: Fazer Deploy

### 5.1 Deploy Automático

Se configurado, o Terminus fará deploy automaticamente quando você fizer push para a branch `main` no GitHub.

### 5.2 Deploy Manual

1. No painel do Terminus, vá em **"Deployments"**
2. Clique em **"Deploy Now"** ou **"Redeploy"**
3. Aguarde o processo de build e deploy

### 5.3 Verificar Logs

Durante o deploy, monitore os logs:
- **Build Logs:** Mostram a instalação de dependências
- **Deploy Logs:** Mostram o processo de deploy
- **Application Logs:** Mostram os logs da aplicação em execução

---

## ✅ Passo 6: Verificar se Está Funcionando

### 6.1 Verificar Status

1. No painel do Terminus, verifique o status do site
2. Deve mostrar como **"Running"** ou **"Active"**

### 6.2 Testar Endpoints

Teste os endpoints da API:

```bash
# Health check (se disponível)
curl https://seu-dominio.com/

# API endpoint
curl https://seu-dominio.com/api/v1/users
```

### 6.3 Verificar Logs da Aplicação

No painel do Terminus, vá em **"Logs"** e verifique:
- Não há erros de inicialização
- A aplicação está escutando na porta correta
- Certificados SSL estão sendo carregados corretamente

---

## 🔧 Configurações Adicionais

### Configurar Domínio Personalizado

1. No painel do Terminus, vá em **"Domains"**
2. Adicione seu domínio personalizado
3. Configure os registros DNS conforme instruções

### Configurar SSL/HTTPS

1. No painel do Terminus, vá em **"SSL"**
2. Se disponível, ative **"Let's Encrypt"** para SSL automático
3. Ou configure SSL manualmente com seus certificados

### Configurar Banco de Dados

Se você usar banco de dados externo:
1. Configure as variáveis de ambiente com as credenciais
2. Ou use o banco de dados oferecido pelo Terminus (se disponível)

---

## 🔄 Atualizações Futuras

### Deploy Automático

Quando você fizer push para o GitHub:
```bash
git add .
git commit -m "Sua mensagem"
git push origin main
```

O Terminus detectará automaticamente e fará o deploy.

### Deploy Manual

1. No painel do Terminus
2. Vá em **"Deployments"**
3. Clique em **"Redeploy"**

---

## 📊 Monitoramento

### Ver Logs em Tempo Real

No painel do Terminus:
- **Application Logs:** Logs da aplicação
- **Build Logs:** Logs do processo de build
- **Error Logs:** Logs de erros

### Métricas

- **Uptime:** Tempo de atividade do site
- **Response Time:** Tempo de resposta
- **Traffic:** Tráfego e requisições

---

## 🆘 Troubleshooting

### Erro: "Cannot find module"

**Solução:**
- Verifique se o `package.json` está correto
- Certifique-se de que `npm install` está sendo executado no build

### Erro: "Port already in use"

**Solução:**
- Verifique a variável de ambiente `PORT`
- Certifique-se de que não há outro processo usando a porta

### Erro: "Certificate not found"

**Solução:**
- Verifique se os certificados foram enviados corretamente
- Confirme os caminhos dos certificados no código
- Verifique permissões dos arquivos

### Aplicação não inicia

**Solução:**
1. Verifique os logs de erro no painel
2. Confirme que todas as variáveis de ambiente estão configuradas
3. Verifique se os certificados estão no local correto
4. Teste localmente primeiro

---

## 📝 Checklist Final

- [ ] Repositório GitHub conectado no Terminus
- [ ] Branch `main` selecionada
- [ ] Build command configurado: `npm install --production`
- [ ] Start command configurado: `npm start`
- [ ] Variáveis de ambiente configuradas (`NODE_ENV=production`, `PORT=3000`)
- [ ] Certificados SSL enviados para `certificates/`
- [ ] Deploy realizado com sucesso
- [ ] Aplicação rodando e acessível
- [ ] Endpoints testados e funcionando
- [ ] Logs verificados (sem erros)

---

## 🔗 Links Úteis

- **Repositório GitHub:** https://github.com/01Jhenni/pix
- **Documentação da API:** Veja `API_DOCUMENTATION.md`
- **Guia de Integração:** Veja `GUIA_INTEGRACAO_EXTERNA.md`

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs no painel do Terminus
2. Consulte a documentação do Terminus
3. Verifique os arquivos de documentação do projeto:
   - `README.md`
   - `API_DOCUMENTATION.md`
   - `DEPLOY.md`

---

**✅ Pronto! Seu sistema PIX Jornada 3 está no ar via Terminus!**

