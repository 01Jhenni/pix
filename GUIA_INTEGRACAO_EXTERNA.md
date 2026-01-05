# 🚀 Guia Completo de Integração Externa - API PIX Jornada 3

Este guia fornece todas as informações necessárias para conectar sistemas externos à API PIX Jornada 3 e gerar recorrências PIX.

## 📋 Índice

1. [Autenticação](#autenticação)
2. [Endpoints Disponíveis](#endpoints-disponíveis)
3. [Exemplos de Código](#exemplos-de-código)
4. [Estrutura de Dados](#estrutura-de-dados)
5. [Tratamento de Erros](#tratamento-de-erros)
6. [Testes](#testes)

---

## 🔐 Autenticação

### 1. Obter API Key

1. Acesse o sistema em: `http://localhost:3000` (ou seu domínio)
2. Vá para a aba **"API Keys"**
3. Selecione um usuário PIX
4. Clique em **"Nova API Key"**
5. Digite um nome descritivo (ex: "Sistema ERP")
6. Clique em **"Gerar API Key"**
7. **IMPORTANTE**: Copie e salve a API Key imediatamente, ela não será exibida novamente!

### 2. Usar API Key

A API Key deve ser enviada em **um dos seguintes formatos**:

#### Opção 1: Header X-API-Key (Recomendado)
```http
X-API-Key: pk_abc123def456...
```

#### Opção 2: Header Authorization
```http
Authorization: Bearer pk_abc123def456...
```

#### Opção 3: Query Parameter
```
?api_key=pk_abc123def456...
```

---

## 📡 Endpoints Disponíveis

### Base URL
```
http://localhost:3000/api/v1
```
(Em produção, substitua `localhost:3000` pelo seu domínio)

### 1. Criar Recorrência PIX (Jornada 3)

**Endpoint:** `POST /pix/jornada3`

**Headers:**
```http
X-API-Key: pk_sua_api_key_aqui
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

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "txid": "E12345678202501101234567890123456789012345",
    "idRec": "rec123456789012345678901234567890",
    "pixCopiaECola": "00020126...",
    "qrCodeImage": "data:image/png;base64,iVBORw0KGgo...",
    "status": "ATIVA",
    "metadata": {
      "jornada": "JORNADA_3",
      "created_at": "2025-01-20T10:00:00.000Z"
    }
  }
}
```

**Campos Obrigatórios:**
- `cpfDevedor`: CPF do devedor (11 dígitos, apenas números)
- `nomeDevedor`: Nome do devedor (máximo 140 caracteres)
- `contrato`: Código do contrato (máximo 35 caracteres)
- `dataInicial`: Data inicial no formato `YYYY-MM-DD` (hoje ou futura)
- `periodicidade`: `DIARIA`, `SEMANAL`, `MENSAL` ou `ANUAL`
- `politicaRetentativa`: `PERMITE_3R_7D`, `PERMITE_3R_15D` ou `PERMITE_3R_30D`
- `valorRec`: Valor da recorrência (formato: "99.90")
- `valorPrimeiroPagamento`: Valor do primeiro pagamento (formato: "99.90")

**Campos Opcionais:**
- `chavePixRecebedor`: Chave PIX do recebedor (se não informado, usa a padrão do usuário)

### 2. Obter QR Code de uma Transação

**Endpoint:** `GET /pix/qrcode/:txid`

**Headers:**
```http
X-API-Key: pk_sua_api_key_aqui
```

**Resposta (200):**
```json
{
  "success": true,
  "data": {
    "txid": "E12345678202501101234567890123456789012345",
    "pixCopiaECola": "00020126...",
    "qrCodeImage": "data:image/png;base64,iVBORw0KGgo...",
    "status": "ATIVA"
  }
}
```

### 3. Consultar Recorrência

**Endpoint:** `GET /pix/recorrencia/:idRec?txid=:txid`

**Headers:**
```http
X-API-Key: pk_sua_api_key_aqui
```

**Resposta (200):**
```json
{
  "success": true,
  "data": {
    "idRec": "rec123456789012345678901234567890",
    "txid": "E12345678202501101234567890123456789012345",
    "status": "ATIVA",
    "valor": "99.90",
    "periodicidade": "MENSAL",
    "metadata": { ... }
  }
}
```

---

## 💻 Exemplos de Código

### JavaScript/Node.js (Axios)

```javascript
const axios = require('axios');

const API_KEY = 'pk_sua_api_key_aqui';
const API_URL = 'http://localhost:3000/api/v1';

async function criarRecorrenciaPIX() {
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
    
    console.log('✅ Recorrência criada:', response.data);
    console.log('📱 QR Code:', response.data.data.qrCodeImage);
    console.log('📋 Copia e Cola:', response.data.data.pixCopiaECola);
    
    return response.data;
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
    throw error;
  }
}

// Usar
criarRecorrenciaPIX();
```

### Python (requests)

```python
import requests

API_KEY = 'pk_sua_api_key_aqui'
API_URL = 'http://localhost:3000/api/v1'

def criar_recorrencia_pix():
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
    
    if response.status_code == 200:
        data = response.json()
        print('✅ Recorrência criada:', data)
        print('📱 QR Code:', data['data']['qrCodeImage'][:50] + '...')
        print('📋 Copia e Cola:', data['data']['pixCopiaECola'][:50] + '...')
        return data
    else:
        print('❌ Erro:', response.json())
        return None

# Usar
criar_recorrencia_pix()
```

### PHP (cURL)

```php
<?php

$apiKey = 'pk_sua_api_key_aqui';
$apiUrl = 'http://localhost:3000/api/v1';

function criarRecorrenciaPIX($apiKey, $apiUrl) {
    $ch = curl_init($apiUrl . '/pix/jornada3');
    
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'X-API-Key: ' . $apiKey,
            'Content-Type: application/json'
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'cpfDevedor' => '12345678901',
            'nomeDevedor' => 'JOÃO DA SILVA',
            'contrato' => '63100555',
            'dataInicial' => '2025-12-01',
            'periodicidade' => 'MENSAL',
            'politicaRetentativa' => 'PERMITE_3R_7D',
            'valorRec' => '99.90',
            'valorPrimeiroPagamento' => '99.90'
        ])
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        $data = json_decode($response, true);
        echo "✅ Recorrência criada!\n";
        echo "📱 TXID: " . $data['data']['txid'] . "\n";
        echo "📋 Copia e Cola: " . substr($data['data']['pixCopiaECola'], 0, 50) . "...\n";
        return $data;
    } else {
        $error = json_decode($response, true);
        echo "❌ Erro: " . ($error['error'] ?? 'Erro desconhecido') . "\n";
        return null;
    }
}

// Usar
criarRecorrenciaPIX($apiKey, $apiUrl);
```

### cURL (Terminal)

```bash
curl -X POST http://localhost:3000/api/v1/pix/jornada3 \
  -H "X-API-Key: pk_sua_api_key_aqui" \
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

### C# (.NET)

```csharp
using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

class Program
{
    private static readonly string API_KEY = "pk_sua_api_key_aqui";
    private static readonly string API_URL = "http://localhost:3000/api/v1";
    
    static async Task Main(string[] args)
    {
        await CriarRecorrenciaPIX();
    }
    
    static async Task CriarRecorrenciaPIX()
    {
        using (var client = new HttpClient())
        {
            client.DefaultRequestHeaders.Add("X-API-Key", API_KEY);
            
            var payload = new
            {
                cpfDevedor = "12345678901",
                nomeDevedor = "JOÃO DA SILVA",
                contrato = "63100555",
                dataInicial = "2025-12-01",
                periodicidade = "MENSAL",
                politicaRetentativa = "PERMITE_3R_7D",
                valorRec = "99.90",
                valorPrimeiroPagamento = "99.90"
            };
            
            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            
            var response = await client.PostAsync($"{API_URL}/pix/jornada3", content);
            var responseBody = await response.Content.ReadAsStringAsync();
            
            if (response.IsSuccessStatusCode)
            {
                Console.WriteLine("✅ Recorrência criada!");
                Console.WriteLine(responseBody);
            }
            else
            {
                Console.WriteLine($"❌ Erro: {response.StatusCode}");
                Console.WriteLine(responseBody);
            }
        }
    }
}
```

---

## 📊 Estrutura de Dados

### Periodicidade
- `DIARIA`: Recorrência diária
- `SEMANAL`: Recorrência semanal
- `MENSAL`: Recorrência mensal
- `ANUAL`: Recorrência anual

### Política de Retentativa
- `PERMITE_3R_7D`: Permite 3 retentativas em 7 dias
- `PERMITE_3R_15D`: Permite 3 retentativas em 15 dias
- `PERMITE_3R_30D`: Permite 3 retentativas em 30 dias

### Status da Recorrência
- `ATIVA`: Recorrência ativa e funcionando
- `PENDENTE`: Aguardando processamento
- `REJEITADA`: Recorrência rejeitada
- `CANCELADA`: Recorrência cancelada

---

## ⚠️ Tratamento de Erros

### Códigos HTTP

- `200`: Sucesso
- `400`: Requisição inválida (campos obrigatórios faltando ou formato incorreto)
- `401`: Não autenticado (API Key inválida ou ausente)
- `404`: Recurso não encontrado
- `500`: Erro interno do servidor

### Exemplo de Resposta de Erro

```json
{
  "success": false,
  "error": "cpfDevedor é obrigatório"
}
```

### Tratamento em JavaScript

```javascript
try {
  const response = await axios.post(...);
  // Sucesso
} catch (error) {
  if (error.response) {
    // Erro da API
    console.error('Erro da API:', error.response.data.error);
    console.error('Status:', error.response.status);
  } else if (error.request) {
    // Erro de rede
    console.error('Erro de rede:', error.message);
  } else {
    // Outro erro
    console.error('Erro:', error.message);
  }
}
```

---

## 🧪 Testes

### 1. Teste de Autenticação

```bash
curl -X GET http://localhost:3000/api/v1/pix/qrcode/test \
  -H "X-API-Key: pk_sua_api_key_aqui"
```

### 2. Teste de Criação de Recorrência

Use os exemplos acima com dados de teste válidos.

### 3. Validação de Dados

- CPF deve ter exatamente 11 dígitos
- Data inicial deve ser hoje ou futura
- Valores devem estar no formato "99.90" (2 casas decimais)
- Nome do devedor máximo 140 caracteres

---

## 🔒 Segurança

1. **Nunca compartilhe sua API Key**
2. **Use HTTPS em produção**
3. **Rotacione API Keys periodicamente**
4. **Monitore o uso através do campo `last_used`**
5. **Armazene API Keys em variáveis de ambiente**

### Exemplo: Variáveis de Ambiente

**Node.js (.env)**
```
API_KEY=pk_sua_api_key_aqui
API_URL=http://localhost:3000/api/v1
```

**Python (.env)**
```
API_KEY=pk_sua_api_key_aqui
API_URL=http://localhost:3000/api/v1
```

---

## 📞 Suporte

Para mais informações:
- Documentação completa: `/API_DOCUMENTATION.md`
- Exemplos adicionais: `/API_EXAMPLES.md`
- Problemas com certificados: `/CERTIFICADOS_SSL.md`

---

## ✅ Checklist de Integração

- [ ] API Key criada e salva com segurança
- [ ] Base URL configurada corretamente
- [ ] Headers de autenticação implementados
- [ ] Validação de dados implementada
- [ ] Tratamento de erros implementado
- [ ] Testes realizados com sucesso
- [ ] HTTPS configurado em produção
- [ ] Logs de erro implementados

---

**Última atualização:** Janeiro 2025

