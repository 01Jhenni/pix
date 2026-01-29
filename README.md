# PIX - Sistema de Recorrências PIX

Sistema completo para gerenciamento de recorrências PIX do Banco do Brasil.

## 🌐 Acesso

**Produção:** https://pix.masterclassic.com.br

**API Externa:** https://pix.masterclassic.com.br/api/v1/pix

## 📦 Instalação

```bash
npm install
```

## 🚀 Executar

```bash
npm start
```

O sistema estará disponível em `http://localhost:3000`

## 🔐 Certificados SSL

Coloque `cert.pem` e `chave.pem` (ou `key.pem`) na pasta `certificates/` ou configure variáveis de ambiente:
- `SSL_CERT`
- `SSL_KEY`
- `SSL_CA` (opcional)
- `SSL_PASSPHRASE` (opcional)

## 📡 API

### API Interna (Painel Admin)
- `POST /api/pix/jornada3` - Criar recorrência PIX
- `GET /api/pix/qrcode/:txid` - Obter QR Code
- `GET /api/users` - Listar usuários
- `POST /api/users` - Criar usuário
- `GET /health` - Health check

### API Externa (Integração)
- `POST /api/v1/pix/jornada3` - Criar recorrência PIX (requer API Key)
- `GET /api/v1/pix/qrcode/:txid` - Obter QR Code (requer API Key)
- `GET /api/v1/pix/transactions` - Listar transações (requer API Key)
- `GET /api/v1/pix/recorrencia/:idRec` - Consultar recorrência (requer API Key)

Veja `API_EXTERNA.md` para documentação completa da API externa.

## 📚 Documentação

- `API_EXTERNA.md` - Documentação completa da API externa
- `DEPLOY_TERMINUS.md` - Guia de deploy no Terminus
- `TERMINUS_QUICK_START.md` - Deploy rápido no Terminus
- `DATABASE.md` - Informações sobre o banco de dados
