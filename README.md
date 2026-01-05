# Sistema PIX Jornada 3

Sistema completo para gerenciamento de recorrências PIX (Jornada 3) com suporte a múltiplos usuários/CNPJs.

## 🚀 Funcionalidades

- ✅ Criação de recorrências PIX Jornada 3
- ✅ Gerenciamento de múltiplos usuários PIX (CNPJs)
- ✅ Geração automática de QR Code e código PIX copia e cola
- ✅ Monitoramento de todas as transações
- ✅ API REST completa para integração externa
- ✅ Frontend web HTML/JS puro para testes e gerenciamento
- ✅ Sistema de API Keys para autenticação
- ✅ White Label (personalização por usuário)
- ✅ Banco de dados JSON para persistência

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Certificados SSL do Banco do Brasil (para produção)

## 🔧 Instalação Local

1. Clone o repositório:
```bash
git clone https://github.com/SEU_USUARIO/pix-jornada3-system.git
cd pix-jornada3-system
```

2. Instale as dependências:
```bash
npm install
```

3. Configure os certificados SSL:
   - Coloque os certificados na pasta `certificates/`
   - Arquivos necessários: `cert.pem`, `key.pem`, `ca.pem` (opcional)
   - Crie `certificates/passphrase.txt` com a senha do certificado

4. Inicie o servidor:
```bash
npm start
```

Para desenvolvimento com auto-reload:
```bash
npm run dev
```

## 📖 Uso

### Acessar o Frontend

Abra seu navegador em: `http://localhost:3000`

### Páginas Disponíveis

- **Dashboard**: Visão geral do sistema
- **Criar Recorrência**: Formulário para criar novas recorrências PIX
- **Usuários PIX**: Gerenciar usuários/CNPJs
- **Transações**: Histórico de todas as transações
- **White Label**: Personalizar aparência por usuário
- **API Keys**: Gerar e gerenciar chaves de API para integração

### API REST

#### Criar Recorrência PIX (com API Key)

```bash
POST /api/v1/pix/jornada3
Content-Type: application/json
X-API-Key: sua_api_key_aqui

{
  "cpfDevedor": "12345678900",
  "nomeDevedor": "João Silva",
  "contrato": "CONTRATO123",
  "dataInicial": "2025-01-15",
  "periodicidade": "MENSAL",
  "politicaRetentativa": "PERMITE_3R_7D",
  "valorRec": "100.00",
  "valorPrimeiroPagamento": "100.00",
  "chavePixRecebedor": "chave@exemplo.com"
}
```

#### Resposta

```json
{
  "success": true,
  "data": {
    "txid": "E12345678202501151234567890123456789012345",
    "idRec": "rec123456789012345678901234567890",
    "pixCopiaECola": "00020126...",
    "qrCodeImage": "data:image/png;base64,iVBORw0KGgo...",
    "status": "ATIVA"
  }
}
```

## 🔐 Autenticação API

O sistema suporta autenticação via API Key:

1. Acesse a página "API Keys" no frontend
2. Selecione um usuário PIX
3. Crie uma nova API Key
4. Use a API Key no header `X-API-Key` nas requisições

## 📚 Documentação Completa

- [Guia de Integração Externa](GUIA_INTEGRACAO_EXTERNA.md)
- [Documentação da API](API_DOCUMENTATION.md)
- [Exemplos de Código](API_EXAMPLES.md)
- [Guia de Deploy](DEPLOY.md)

## 🛠️ Estrutura do Projeto

```
pix-jornada3-system/
├── public/              # Frontend HTML/JS
│   ├── index.html
│   ├── styles.css
│   └── js/
│       ├── api.js
│       ├── app.js
│       ├── utils.js
│       └── pages/
├── routes/             # Rotas da API
├── services/           # Serviços (PIX, etc)
├── database/           # Banco de dados e migrações
├── certificates/       # Certificados SSL (não commitado)
└── server.js          # Servidor principal
```

## 🔒 Segurança

- ⚠️ **NUNCA** commite certificados SSL ou senhas
- ⚠️ Use variáveis de ambiente para dados sensíveis
- ⚠️ Mantenha as API Keys seguras
- ⚠️ Configure firewall no servidor de produção

## 🚀 Deploy

Veja o guia completo de deploy em [DEPLOY.md](DEPLOY.md)

### Deploy Rápido com PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 📝 Scripts Disponíveis

- `npm start` - Inicia o servidor
- `npm run dev` - Modo desenvolvimento com auto-reload
- `npm run setup-ssl-quick` - Configuração rápida de certificados

## 🐛 Troubleshooting

### Erro de certificados SSL

1. Verifique se os certificados estão na pasta `certificates/`
2. Verifique se o `passphrase.txt` contém a senha correta
3. Verifique as permissões dos arquivos

### Porta já em uso

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill
```

## 📄 Licença

ISC

## 👥 Contribuição

Contribuições são bem-vindas! Por favor, abra uma issue ou pull request.

## 📞 Suporte

Para suporte, abra uma issue no GitHub.
