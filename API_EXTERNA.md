# 🔌 API Externa - Integração com Sistemas Externos

Esta documentação descreve como sistemas externos podem integrar com a API PIX para gerar QR Codes e gerenciar transações.

## 📋 Visão Geral

A API permite que sistemas externos:
1. **Enviem JSON** com dados do pagamento
2. **Recebam QR Code e PIX Copia e Cola** gerados automaticamente
3. **Gerenciem transações** (consultar status, listar, obter QR Codes)

## 🔐 Autenticação

### Método 1: API Key (Recomendado)

Adicione o header `X-API-Key` em todas as requisições:

```http
X-API-Key: sua-api-key-aqui
```

**Como obter uma API Key:**
1. Acesse o painel administrativo
2. Vá em "API & Integração"
3. Clique em "Gerar Nova API Key"
4. Copie a chave gerada (ela não será exibida novamente!)

### Método 2: pixUserId no Body

Se não usar API Key, inclua `pixUserId` no body da requisição (menos seguro).

## 🌐 Base URL

```
https://pix.masterclassic.com.br/api/v1/pix
```

**Desenvolvimento:** Para testes locais, use `http://localhost:3000/api/v1/pix`

## 📡 Endpoints Disponíveis

### 1. Criar Recorrência PIX (Gerar Pagamento)

**POST** `/jornada3`

Cria uma nova recorrência PIX e retorna o QR Code e código PIX Copia e Cola.

#### Headers
```http
Content-Type: application/json
X-API-Key: sua-api-key-aqui
```

#### Request Body
```json
{
  "cpfDevedor": "12345678901",
  "nomeDevedor": "JOÃO DA SILVA",
  "contrato": "63100555",
  "dataInicial": "2024-01-15",
  "periodicidade": "MENSAL",
  "politicaRetentativa": "PERMITE_3R_7D",
  "valorRec": "99.90",
  "valorPrimeiroPagamento": "99.90",
  "chavePixRecebedor": "02429647000169",
  "nomeRecebedor": "VIDA OURO",
  "cidadeRecebedor": "BELO HORIZONTE"
}
```

**Nota:** Se usar API Key, o `pixUserId` será obtido automaticamente. Caso contrário, adicione `"pixUserId": 1` no body.

#### Campos Obrigatórios

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `cpfDevedor` | string | CPF do devedor (11 dígitos, somente números) |
| `nomeDevedor` | string | Nome completo do devedor (máx. 140 caracteres) |
| `contrato` | string | Número do contrato (máx. 35 caracteres) |
| `dataInicial` | string | Data do primeiro pagamento (formato: YYYY-MM-DD) |
| `periodicidade` | string | `DIARIA`, `SEMANAL`, `QUINZENAL`, `MENSAL` ou `ANUAL` |
| `politicaRetentativa` | string | `PERMITE_3R_7D` (padrão) ou `PADRAO` |
| `valorRec` | string | Valor da recorrência (decimal, ex: "99.90") |
| `valorPrimeiroPagamento` | string | Valor do primeiro pagamento (decimal) |
| `chavePixRecebedor` | string | Chave PIX do recebedor |
| `nomeRecebedor` | string | Nome do recebedor (máx. 140 caracteres) |
| `cidadeRecebedor` | string | Cidade do recebedor (máx. 140 caracteres) |

#### Response (Sucesso)

```json
{
  "success": true,
  "message": "Recorrência PIX criada com sucesso. QR Code gerado.",
  "data": {
    "txid": "E12345678202401151234567890123456",
    "idRec": "12345678",
    "pixCopiaECola": "00020126580014br.gov.bcb.pix...",
    "qrCodeImage": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "status": "ATIVA",
    "jornada": "JORNADA_3",
    "devedor": {
      "cpf": "12345678901",
      "nome": "JOÃO DA SILVA"
    },
    "valor": {
      "primeiroPagamento": 99.9,
      "recorrencia": 99.9,
      "primeiroPagamentoFormatado": "R$ 99,90",
      "recorrenciaFormatado": "R$ 99,90"
    },
    "periodicidade": "MENSAL",
    "dataInicial": "2024-01-15",
    "contrato": "63100555",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "metadata": {
      "txid": "E12345678202401151234567890123456",
      "idRec": "12345678"
    }
  }
}
```

#### Response (Erro)

```json
{
  "success": false,
  "error": "Campo obrigatório ausente: cpfDevedor"
}
```

#### Exemplo cURL

```bash
curl -X POST https://pix.masterclassic.com.br/api/v1/pix/jornada3 \
  -H "X-API-Key: sua-api-key-aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "cpfDevedor": "12345678901",
    "nomeDevedor": "JOÃO DA SILVA",
    "contrato": "63100555",
    "dataInicial": "2024-01-15",
    "periodicidade": "MENSAL",
    "politicaRetentativa": "PERMITE_3R_7D",
    "valorRec": "99.90",
    "valorPrimeiroPagamento": "99.90",
    "chavePixRecebedor": "02429647000169",
    "nomeRecebedor": "VIDA OURO",
    "cidadeRecebedor": "BELO HORIZONTE"
  }'
```

---

### 2. Obter QR Code de uma Transação

**GET** `/qrcode/:txid`

Recupera o QR Code e código PIX Copia e Cola de uma transação existente.

#### Headers
```http
X-API-Key: sua-api-key-aqui
```

#### Parâmetros

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `txid` | string | TXID da transação (obtido ao criar a recorrência) |

#### Response (Sucesso)

```json
{
  "success": true,
  "data": {
    "txid": "E12345678202401151234567890123456",
    "idRec": "12345678",
    "pixCopiaECola": "00020126580014br.gov.bcb.pix...",
    "qrCodeImage": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "status": "ATIVA",
    "jornada": "JORNADA_3",
    "devedor": {
      "cpf": "12345678901",
      "nome": "JOÃO DA SILVA"
    },
    "valor": {
      "primeiroPagamento": 99.9,
      "recorrencia": 99.9,
      "primeiroPagamentoFormatado": "R$ 99,90",
      "recorrenciaFormatado": "R$ 99,90"
    },
    "periodicidade": "MENSAL",
    "dataInicial": "2024-01-15",
    "contrato": "63100555",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:35:00.000Z"
  }
}
```

#### Exemplo cURL

```bash
curl -X GET https://pix.masterclassic.com.br/api/v1/pix/qrcode/E12345678202401151234567890123456 \
  -H "X-API-Key: sua-api-key-aqui"
```

---

### 3. Listar Transações

**GET** `/transactions`

Lista todas as transações do usuário PIX vinculado à API Key.

#### Headers
```http
X-API-Key: sua-api-key-aqui
```

#### Query Parameters

| Parâmetro | Tipo | Descrição | Padrão |
|-----------|------|-----------|--------|
| `status` | string | Filtrar por status (`ATIVA`, `PENDENTE`, `CONCLUIDA`, etc.) | - |
| `limit` | number | Número máximo de resultados | 100 |
| `offset` | number | Número de resultados para pular (paginação) | 0 |

#### Response (Sucesso)

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "txid": "E12345678202401151234567890123456",
      "idRec": "12345678",
      "status": "ATIVA",
      "jornada": "JORNADA_3",
      "devedor": {
        "cpf": "12345678901",
        "nome": "JOÃO DA SILVA"
      },
      "valor": {
        "primeiroPagamento": 99.9,
        "recorrencia": 99.9,
        "primeiroPagamentoFormatado": "R$ 99,90",
        "recorrenciaFormatado": "R$ 99,90"
      },
      "periodicidade": "MENSAL",
      "dataInicial": "2024-01-15",
      "contrato": "63100555",
      "hasQrCode": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:35:00.000Z"
    }
  ],
  "pagination": {
    "total": 50,
    "limit": 100,
    "offset": 0,
    "hasMore": false
  }
}
```

#### Exemplo cURL

```bash
# Listar todas as transações
curl -X GET https://pix.masterclassic.com.br/api/v1/pix/transactions \
  -H "X-API-Key: sua-api-key-aqui"

# Filtrar por status
curl -X GET "https://pix.masterclassic.com.br/api/v1/pix/transactions?status=ATIVA" \
  -H "X-API-Key: sua-api-key-aqui"

# Com paginação
curl -X GET "https://pix.masterclassic.com.br/api/v1/pix/transactions?limit=10&offset=0" \
  -H "X-API-Key: sua-api-key-aqui"
```

---

### 4. Consultar Recorrência

**GET** `/recorrencia/:idRec`

Consulta o status e detalhes de uma recorrência específica.

#### Headers
```http
X-API-Key: sua-api-key-aqui
```

#### Parâmetros

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `idRec` | string | ID da recorrência (obtido ao criar) |

#### Query Parameters

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `txid` | string | TXID da transação (obrigatório) |

#### Response (Sucesso)

```json
{
  "success": true,
  "data": {
    "idRec": "12345678",
    "status": "ATIVA",
    "dadosQR": {
      "pixCopiaECola": "00020126580014br.gov.bcb.pix...",
      "jornada": "JORNADA_3"
    },
    "metadata": {
      "txid": "E12345678202401151234567890123456"
    }
  }
}
```

#### Exemplo cURL

```bash
curl -X GET "https://pix.masterclassic.com.br/api/v1/pix/recorrencia/12345678?txid=E12345678202401151234567890123456" \
  -H "X-API-Key: sua-api-key-aqui"
```

---

## 🔄 Fluxo Completo de Integração

### Passo 1: Criar Recorrência

```javascript
const response = await fetch('https://pix.masterclassic.com.br/api/v1/pix/jornada3', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'sua-api-key-aqui'
  },
  body: JSON.stringify({
    cpfDevedor: "12345678901",
    nomeDevedor: "JOÃO DA SILVA",
    contrato: "63100555",
    dataInicial: "2024-01-15",
    periodicidade: "MENSAL",
    politicaRetentativa: "PERMITE_3R_7D",
    valorRec: "99.90",
    valorPrimeiroPagamento: "99.90",
    chavePixRecebedor: "02429647000169",
    nomeRecebedor: "VIDA OURO",
    cidadeRecebedor: "BELO HORIZONTE"
  })
});

const result = await response.json();

if (result.success) {
  const { txid, pixCopiaECola, qrCodeImage } = result.data;
  
  // Usar o QR Code ou código PIX Copia e Cola
  console.log('TXID:', txid);
  console.log('PIX Copia e Cola:', pixCopiaECola);
  console.log('QR Code (base64):', qrCodeImage);
  
  // Exibir QR Code em uma imagem
  // <img src={qrCodeImage} alt="QR Code PIX" />
}
```

### Passo 2: Consultar Status

```javascript
// Consultar status da transação
const statusResponse = await fetch(
  `https://pix.masterclassic.com.br/api/v1/pix/qrcode/${txid}`,
  {
    headers: {
      'X-API-Key': 'sua-api-key-aqui'
    }
  }
);

const statusResult = await statusResponse.json();
console.log('Status:', statusResult.data.status);
```

### Passo 3: Listar Transações

```javascript
// Listar todas as transações
const listResponse = await fetch(
  'https://pix.masterclassic.com.br/api/v1/pix/transactions?status=ATIVA',
  {
    headers: {
      'X-API-Key': 'sua-api-key-aqui'
    }
  }
);

const listResult = await listResponse.json();
console.log('Transações:', listResult.data);
```

---

## ⚠️ Tratamento de Erros

Todos os endpoints retornam erros no formato:

```json
{
  "success": false,
  "error": "Mensagem de erro descritiva"
}
```

### Códigos HTTP

- `200` - Sucesso
- `400` - Erro de validação (campos obrigatórios ausentes, formato inválido)
- `403` - Acesso negado (transação não pertence ao usuário)
- `404` - Recurso não encontrado
- `500` - Erro interno do servidor

---

## 💡 Dicas Importantes

1. **Guarde o TXID**: Sempre salve o `txid` retornado ao criar uma recorrência. Ele é necessário para consultas futuras.

2. **QR Code em Base64**: O campo `qrCodeImage` retorna uma imagem PNG em formato base64 (data URL). Use diretamente em tags `<img>` ou converta para arquivo.

3. **PIX Copia e Cola**: O campo `pixCopiaECola` contém o código completo para copiar e colar em apps de pagamento.

4. **Status das Transações**: 
   - `PENDENTE` - Recorrência criada, aguardando processamento
   - `ATIVA` - Recorrência ativa e funcionando
   - `CONCLUIDA` - Recorrência finalizada
   - `REJEITADA` - Recorrência rejeitada

5. **Rate Limiting**: Em produção, considere implementar rate limiting para evitar abuso.

6. **HTTPS**: Sempre use HTTPS em produção para proteger as requisições.

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte a documentação completa no painel administrativo
2. Verifique os logs do servidor
3. Teste os endpoints usando a aba "Teste PIX" no painel

---

**Versão da API:** 2.0.0  
**Última atualização:** 2024

