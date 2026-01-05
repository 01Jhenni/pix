# 🔑 Credenciais de Exemplo para Integração

## ⚠️ IMPORTANTE

Este arquivo contém **exemplos** de como usar as credenciais. **NUNCA** compartilhe suas credenciais reais!

---

## 📋 Informações Necessárias

### 1. API Key

**Como obter:**
1. Acesse: `http://localhost:3000/api-keys`
2. Selecione um usuário PIX
3. Clique em "Nova API Key"
4. Copie e salve a chave gerada

**Formato:**
```
pk_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

**Uso:**
```http
X-API-Key: pk_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

### 2. URL Base da API

**Desenvolvimento:**
```
http://localhost:3000/api/v1
```

**Produção:**
```
https://seu-dominio.com/api/v1
```

### 3. Endpoint Principal

**Criar Recorrência PIX:**
```
POST /pix/jornada3
```

**URL Completa:**
```
http://localhost:3000/api/v1/pix/jornada3
```

---

## 🚀 Exemplo Completo de Requisição

### cURL

```bash
curl -X POST http://localhost:3000/api/v1/pix/jornada3 \
  -H "X-API-Key: SUA_API_KEY_AQUI" \
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

### JavaScript

```javascript
const API_KEY = 'SUA_API_KEY_AQUI';
const API_URL = 'http://localhost:3000/api/v1';

fetch(`${API_URL}/pix/jornada3`, {
  method: 'POST',
  headers: {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    cpfDevedor: '12345678901',
    nomeDevedor: 'JOÃO DA SILVA',
    contrato: '63100555',
    dataInicial: '2025-12-01',
    periodicidade: 'MENSAL',
    politicaRetentativa: 'PERMITE_3R_7D',
    valorRec: '99.90',
    valorPrimeiroPagamento: '99.90'
  })
})
.then(res => res.json())
.then(data => console.log('Sucesso:', data))
.catch(err => console.error('Erro:', err));
```

### Python

```python
import requests

API_KEY = 'SUA_API_KEY_AQUI'
API_URL = 'http://localhost:3000/api/v1'

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

print(response.json())
```

---

## 📝 Variáveis de Ambiente Recomendadas

### .env (Node.js/Python)

```env
PIX_API_KEY=pk_sua_api_key_aqui
PIX_API_URL=http://localhost:3000/api/v1
```

### Uso

**Node.js:**
```javascript
require('dotenv').config();
const API_KEY = process.env.PIX_API_KEY;
const API_URL = process.env.PIX_API_URL;
```

**Python:**
```python
import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv('PIX_API_KEY')
API_URL = os.getenv('PIX_API_URL')
```

---

## ✅ Checklist Rápido

- [ ] API Key obtida e salva com segurança
- [ ] URL base configurada (desenvolvimento ou produção)
- [ ] Headers de autenticação implementados
- [ ] Dados de teste validados
- [ ] Tratamento de erros implementado

---

**Veja `GUIA_INTEGRACAO_EXTERNA.md` para documentação completa!**

