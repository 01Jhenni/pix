# PIX Jornada 3 - Sistema Completo

Sistema completo de gerenciamento de recorrências PIX Jornada 3 com interface moderna e integração Supabase.

## 🚀 Tecnologias

- **Backend:** Node.js + Express
- **Frontend:** React + Vite + Tailwind CSS
- **Banco de Dados:** Supabase (PostgreSQL)
- **Autenticação:** JWT

## 📋 Pré-requisitos

- Node.js 18+
- Conta Supabase
- Certificados SSL do Banco do Brasil

## ⚙️ Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Configure o Supabase:
   - Execute o SQL em `database/supabase-schema.sql` no Supabase SQL Editor
   - Copie o arquivo `.env.example` para `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edite o arquivo `.env` e configure suas credenciais do Supabase

4. Configure os certificados SSL:
   - Coloque `cert.pem` e `key.pem` na pasta `certificates/`

5. Build do frontend:
```bash
npm run build
```

6. Inicie o servidor:
```bash
npm start
```

## 🔐 Login Padrão

- **Username:** admin
- **Senha:** admin123

**⚠️ IMPORTANTE:** Altere a senha após o primeiro login!

## 📡 API Pública

A API pública está disponível em `/api/v1/pix` e requer API Key:

```bash
curl -X POST http://localhost:3000/api/v1/pix/jornada3 \
  -H "X-API-Key: sua-api-key" \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

## 🗄️ Estrutura do Banco de Dados

- `auth_users` - Usuários do sistema
- `sessions` - Sessões de autenticação
- `pix_users` - Usuários PIX (credenciais BB)
- `transactions` - Transações/Recorrências
- `user_profiles` - Perfis white label
- `api_keys` - Chaves de API

## 📁 Estrutura do Projeto

```
├── src/              # Frontend React
├── routes/           # Rotas da API
├── services/         # Serviços (PIX)
├── database/         # Integração com banco
├── middleware/       # Middlewares (auth)
└── certificates/     # Certificados SSL
```

## 🔧 Scripts

- `npm start` - Inicia o servidor
- `npm run dev` - Modo desenvolvimento
- `npm run build` - Build do frontend

## 📝 Licença

ISC
