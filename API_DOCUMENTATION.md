# 📚 Documentação Completa da API

## 🔐 Autenticação

### API Keys

Para usar a API pública, você precisa de uma API Key. Crie uma através do frontend ou da API:

```bash
POST /api/api-keys
Content-Type: application/json

{
  "pixUserId": 1,
  "name": "Minha Integração"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "API Key criada com sucesso",
  "data": {
    "id": 1,
    "name": "Minha Integração",
    "key": "pk_abc123...",
    "active": true,
    "created_at": "2025-01-20T10:00:00.000Z"
  }
}
```

### Usando a API Key

Envie a API Key em um dos seguintes formatos:

1. **Header X-API-Key:**
```bash
X-API-Key: pk_abc123...
```

2. **Header Authorization:**
```bash
Authorization: Bearer pk_abc123...
```

3. **Query Parameter:**
```bash
?api_key=pk_abc123...
```

## 📋 Endpoints

### PIX - Recorrências

#### Criar Recorrência PIX (Jornada 3)

**Endpoint:** `POST /api/v1/pix/jornada3` (público com API Key)  
**Endpoint:** `POST /api/pix/jornada3` (interno)

**Headers:**
```
X-API-Key: pk_abc123...
Content-Type: application/json
```

**Body:**
```json
{
  "cpfDevedor": "12345678901",
  "nomeDevedor": "JOÃO DA SILVA",
  "contrato": "63100555",
  "dataInicial": "2025-12-01",
  "periodicidade": "MENSAL",
  "politicaRetentativa": "PERMITE_3R_7D",
  "valorRec": "99.90",
  "valorPrimeiroPagamento": "99.90",
  "chavePixRecebedor": "02429647000169"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "txid": "abc123...",
    "idRec": "rec123...",
    "pixCopiaECola": "00020126...",
    "qrCodeImage": "data:image/png;base64,...",
    "status": "ATIVA",
    "metadata": { ... }
  }
}
```

#### Consultar Recorrência

**Endpoint:** `GET /api/pix/recorrencia/:idRec`

**Query Parameters:**
- `pixUserId` (obrigatório)
- `txid` (obrigatório)

**Exemplo:**
```bash
GET /api/pix/recorrencia/rec123?pixUserId=1&txid=abc123
```

#### Obter QR Code

**Endpoint:** `GET /api/pix/qrcode/:txid`

**Resposta:**
```json
{
  "success": true,
  "data": {
    "txid": "abc123",
    "pixCopiaECola": "00020126...",
    "qrCodeImage": "data:image/png;base64,...",
    "status": "ATIVA"
  }
}
```

### Usuários PIX

#### Listar Usuários

**Endpoint:** `GET /api/users`

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "cnpj": "02429647000169",
      "nome": "VIDA OURO",
      "chave_pix_recebedor": "02429647000169",
      "ativo": true
    }
  ]
}
```

#### Criar Usuário

**Endpoint:** `POST /api/users`

**Body:**
```json
{
  "cnpj": "02429647000169",
  "nome": "VIDA OURO",
  "gw_app_key": "42783cd412f343e8acb3d42219c1d9bf",
  "basic_auth_base64": "ZXlKcFpDSTZJbUpt...",
  "chave_pix_recebedor": "02429647000169",
  "nome_recebedor": "VIDA OURO",
  "cidade_recebedor": "BELO HORIZONTE"
}
```

### Perfis White Label

#### Obter Perfil

**Endpoint:** `GET /api/profiles/:userId`

**Resposta:**
```json
{
  "success": true,
  "data": {
    "pix_user_id": 1,
    "brand_name": "Minha Empresa",
    "brand_logo": "https://exemplo.com/logo.png",
    "primary_color": "#667eea",
    "secondary_color": "#764ba2",
    "success_color": "#10b981",
    "danger_color": "#ef4444",
    "custom_css": null,
    "custom_js": null,
    "header_text": null,
    "footer_text": null
  }
}
```

#### Atualizar Perfil

**Endpoint:** `PUT /api/profiles/:userId`

**Body:**
```json
{
  "brand_name": "Minha Empresa",
  "brand_logo": "https://exemplo.com/logo.png",
  "primary_color": "#667eea",
  "secondary_color": "#764ba2",
  "success_color": "#10b981",
  "danger_color": "#ef4444",
  "custom_css": "body { background: red; }",
  "custom_js": "console.log('custom');",
  "header_text": "Sistema Personalizado",
  "footer_text": "© 2025 Minha Empresa"
}
```

### API Keys

#### Listar API Keys

**Endpoint:** `GET /api/api-keys?userId=1`

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Minha Integração",
      "key": "pk_abc123...",
      "active": true,
      "last_used": "2025-01-20T10:00:00.000Z",
      "created_at": "2025-01-20T09:00:00.000Z"
    }
  ]
}
```

#### Criar API Key

**Endpoint:** `POST /api/api-keys`

**Body:**
```json
{
  "pixUserId": 1,
  "name": "Minha Integração"
}
```

#### Remover API Key

**Endpoint:** `DELETE /api/api-keys/:id`

### Transações

#### Listar Transações

**Endpoint:** `GET /api/transactions`

**Query Parameters:**
- `pixUserId` (opcional)
- `status` (opcional: ATIVA, PENDENTE, REJEITADA, CANCELADA)
- `limit` (opcional, padrão: 100)
- `offset` (opcional, padrão: 0)

**Exemplo:**
```bash
GET /api/transactions?pixUserId=1&status=ATIVA&limit=50
```

## 🔄 Exemplos de Integração

### JavaScript/Node.js

```javascript
const axios = require('axios');

const API_KEY = 'pk_abc123...';
const API_URL = 'http://localhost:3000/api/v1';

async function criarRecorrencia() {
  try {
    const response = await axios.post(
      `${API_URL}/pix/jornada3`,
      {
        cpfDevedor: '12345678901',
        nomeDevedor: 'JOÃO DA SILVA',
        contrato: '63100555',
        dataInicial: '2025-12-01',
        periodicidade: 'MENSAL',
        politicaRetentativa: 'PERMITE_3R_7D',
        valorRec: '99.90',
        valorPrimeiroPagamento: '99.90'
      },
      {
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Recorrência criada:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erro:', error.response?.data || error.message);
  }
}
```

### cURL

```bash
curl -X POST http://localhost:3000/api/v1/pix/jornada3 \
  -H "X-API-Key: pk_abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "cpfDevedor": "12345678901",
    "nomeDevedor": "JOÃO DA SILVA",
    "contrato": "63100555",
    "dataInicial": "2025-12-01",
    "periodicidade": "MENSAL",
    "politicaRetentativa": "PERMITE_3R_7D",
    "valorRec": "99.90",
    "valorPrimeiroPagamento": "99.90"
  }'
```

### Python

```python
import requests

API_KEY = 'pk_abc123...'
API_URL = 'http://localhost:3000/api/v1'

def criar_recorrencia():
    response = requests.post(
        f'{API_URL}/pix/jornada3',
        json={
            'cpfDevedor': '12345678901',
            'nomeDevedor': 'JOÃO DA SILVA',
            'contrato': '63100555',
            'dataInicial': '2025-12-01',
            'periodicidade': 'MENSAL',
            'politicaRetentativa': 'PERMITE_3R_7D',
            'valorRec': '99.90',
            'valorPrimeiroPagamento': '99.90'
        },
        headers={
            'X-API-Key': API_KEY,
            'Content-Type': 'application/json'
        }
    )
    
    return response.json()
```

## 📝 Códigos de Status HTTP

- `200` - Sucesso
- `400` - Requisição inválida (campos obrigatórios faltando)
- `401` - Não autenticado (API Key inválida ou ausente)
- `404` - Recurso não encontrado
- `500` - Erro interno do servidor

## ⚠️ Limitações

- API Keys são específicas por usuário PIX
- Cada API Key pode ser desativada individualmente
- Rate limiting pode ser implementado no futuro
- Certificados SSL são obrigatórios para produção

## 🔒 Segurança

- Nunca compartilhe suas API Keys
- Use HTTPS em produção
- Rotacione API Keys periodicamente
- Monitore o uso das API Keys através do campo `last_used`

