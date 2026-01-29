# 🚀 Deploy Rápido no Terminus

## Passos Essenciais

### 1️⃣ Preparar Certificados SSL

**Opção A: Via Variáveis de Ambiente (Recomendado)**

No dashboard do Terminus, adicione estas variáveis de ambiente:

```
SSL_CERT=<cole aqui o conteúdo completo do cert.pem>
SSL_KEY=<cole aqui o conteúdo completo do key.pem>
SSL_CA=<cole aqui o conteúdo do ca.pem> (opcional)
SSL_PASSPHRASE=<senha se necessário> (opcional)
```

**Como obter os certificados:**
1. No n8n, vá em Credenciais > SSL Certificates
2. Copie o conteúdo do **Certificate** (incluindo `-----BEGIN CERTIFICATE-----` e `-----END CERTIFICATE-----`)
3. Copie o conteúdo do **Private Key** (incluindo `-----BEGIN PRIVATE KEY-----` e `-----END PRIVATE KEY-----`)

### 2️⃣ Configurar Build no Terminus

No dashboard do Terminus, configure:

- **Build Command**: `npm install` (ou `npm install --build-from-source` se houver erro com better-sqlite3)
- **Start Command**: `npm start`
- **Porta**: Deixe vazio (usa PORT automático)

**IMPORTANTE**: Se o build falhar com erro de `better-sqlite3`, adicione a variável de ambiente:
```
npm_config_build_from_source=true
```

### 3️⃣ Fazer Deploy

1. Faça commit e push do código:
```bash
git add .
git commit -m "Preparado para Terminus"
git push origin main
```

2. No Terminus, clique em **Deploy** ou configure auto-deploy

### 4️⃣ Configurar Domínio

No dashboard do Terminus:
1. Vá em **Configurações > Domínios**
2. Adicione: `pix.masterclassic.com.br`
3. Configure o DNS apontando para o Terminus

### 5️⃣ Verificar

Acesse:
- **Health Check:** https://pix.masterclassic.com.br/health
- **Painel Admin:** https://pix.masterclassic.com.br
- **API Externa:** https://pix.masterclassic.com.br/api/v1/pix

Deve retornar: `{"status":"ok","timestamp":"..."}`

## ✅ Checklist

- [ ] Certificados SSL configurados (via env ou arquivos)
- [ ] Variáveis de ambiente configuradas no Terminus
- [ ] Build command: `npm install`
- [ ] Start command: `npm start`
- [ ] Código commitado e no Git
- [ ] Deploy realizado
- [ ] Health check funcionando

## 🔍 Verificar Logs

No dashboard do Terminus, verifique os logs:

✅ Deve aparecer:
- `✅ Certificados SSL encontrados nas variáveis de ambiente!`
- `🚀 Servidor rodando em http://localhost:3000` (ou porta configurada)
- `✅ Banco de dados local inicializado`
- `✅ Frontend estático encontrado em public/`

❌ Se aparecer erro de certificado SSL:
- Verifique se copiou os certificados completos (com BEGIN/END)
- Confirme que não há espaços extras nas variáveis de ambiente
- Tente colar novamente os certificados

❌ Se aparecer erro "Cannot find package 'better-sqlite3'":
- Verifique se o Build Command está configurado: `npm install`
- Tente usar: `npm install --build-from-source`
- Ou adicione variável de ambiente: `npm_config_build_from_source=true`
- Verifique os logs de build no Terminus

## 📞 Suporte

Se tiver problemas, verifique:
1. Logs no dashboard do Terminus
2. Arquivo `DEPLOY_TERMINUS.md` para guia completo
3. Certificados estão corretos e completos

