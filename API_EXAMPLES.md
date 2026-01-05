# Exemplos de Uso da API

## Criar Usuário PIX

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "cnpj": "02429647000169",
    "nome": "VIDA OURO",
    "gw_app_key": "42783cd412f343e8acb3d42219c1d9bf",
    "basic_auth_base64": "ZXlKcFpDSTZJbUptT1RRMk1tUXROekU0T1MwME5UZ3dMV0ZrT0RndFlXRmpZMll4SWl3aVkyOWthV2R2VUhWaWJHbGpZV1J2Y2lJNk1Dd2lZMjlrYVdkdlUyOW1kSGRoY21VaU9qRXlPRGc0TXl3aWMyVnhkV1Z1WTJsaGJFbHVjM1JoYkdGallXOGlPakY5OmV5SnBaQ0k2SWpCbFlXTTJaV0V0TkdVM01DMDBJaXdpWTI5a2FXZHZVSFZpYkdsallXUnZjaUk2TUN3aVkyOWthV2R2VTI5bWRIZGhjbVVpT2pFeU9EZzRNeXdpYzJWeGRXVnVZMmxoYkVsdWMzUmhiR0ZqWVc4aU9qRXNJbk5sY1hWbGJtTnBZV3hEY21Wa1pXNWphV0ZzSWpveExDSmhiV0pwWlc1MFpTSTZJbkJ5YjJSMVkyRnZJaXdpYVdGMElqb3hOelUzTkRNNU9EY3pNVFl5ZlE=",
    "chave_pix_recebedor": "02429647000169",
    "nome_recebedor": "VIDA OURO",
    "cidade_recebedor": "BELO HORIZONTE"
  }'
```

## Criar Recorrência PIX

```bash
curl -X POST http://localhost:3000/api/pix/jornada3 \
  -H "Content-Type: application/json" \
  -d '{
    "pixUserId": 1,
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

## Listar Usuários

```bash
curl http://localhost:3000/api/users
```

## Listar Transações

```bash
curl "http://localhost:3000/api/transactions?pixUserId=1&status=ATIVA"
```

## Obter QR Code

```bash
curl http://localhost:3000/api/pix/qrcode/{txid}
```

## Exemplo JavaScript (Fetch API)

```javascript
// Criar recorrência
async function criarRecorrencia() {
  const response = await fetch('http://localhost:3000/api/pix/jornada3', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      pixUserId: 1,
      cpfDevedor: '12345678901',
      nomeDevedor: 'JOÃO DA SILVA',
      contrato: '63100555',
      dataInicial: '2025-12-01',
      periodicidade: 'MENSAL',
      politicaRetentativa: 'PERMITE_3R_7D',
      valorRec: '99.90',
      valorPrimeiroPagamento: '99.90'
    })
  });
  
  const data = await response.json();
  console.log(data);
}
```

## Exemplo Python (requests)

```python
import requests

# Criar recorrência
url = 'http://localhost:3000/api/pix/jornada3'
data = {
    'pixUserId': 1,
    'cpfDevedor': '12345678901',
    'nomeDevedor': 'JOÃO DA SILVA',
    'contrato': '63100555',
    'dataInicial': '2025-12-01',
    'periodicidade': 'MENSAL',
    'politicaRetentativa': 'PERMITE_3R_7D',
    'valorRec': '99.90',
    'valorPrimeiroPagamento': '99.90'
}

response = requests.post(url, json=data)
print(response.json())
```

