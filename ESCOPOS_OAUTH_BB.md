# 🔐 Escopos OAuth Necessários - API Pix Automático BB

## 📋 Escopos Obrigatórios

Conforme o [Guia Técnico da API Pix Automático do Banco do Brasil](file://Guia%20Técnico_%20API%20Pix%20Automático%20Banco%20do%20Brasil.pdf), os seguintes escopos são necessários:

### Escopos para Recorrências (Jornadas 1-4)

| Escopo | Descrição | Endpoint |
|--------|-----------|----------|
| `rec.write` | Criar e alterar recorrências | POST /rec, PATCH /rec |
| `rec.read` | Consultar recorrências | GET /rec/{idRec} |

### Escopos para Location (QR Code)

| Escopo | Descrição | Endpoint |
|--------|-----------|----------|
| `payloadlocationrec.write` | Criar location para recorrência | POST /locrec |
| `payloadlocationrec.read` | Consultar location | GET /locrec/{locId} |

### Escopos para Cobrança Imediata (Jornada 3)

| Escopo | Descrição | Endpoint |
|--------|-----------|----------|
| `cob.write` | Criar cobrança imediata | PUT /cob/{txid} |
| `cob.read` | Consultar cobrança imediata | GET /cob/{txid} |

### Escopos para Cobrança com Vencimento (Jornada 4)

| Escopo | Descrição | Endpoint |
|--------|-----------|----------|
| `cobr.write` | Criar cobrança com vencimento | PUT /cobv/{txid} |
| `cobr.read` | Consultar cobrança com vencimento | GET /cobv/{txid} |

### Escopos para Solicitação Push (Jornada 1)

| Escopo | Descrição | Endpoint |
|--------|-----------|----------|
| `solicrec.write` | Criar solicitação push | POST /solicrec |
| `solicrec.read` | Consultar solicitação push | GET /solicrec/{idSolic} |

## 🔧 String Completa de Escopos

Para usar todas as funcionalidades (todas as jornadas):

```
rec.write rec.read payloadlocationrec.write payloadlocationrec.read cobr.write cobr.read cob.write cob.read solicrec.write solicrec.read
```

**Escopos atualmente solicitados no código:**
```
rec.write rec.read payloadlocationrec.write payloadlocationrec.read cobr.write cobr.read cob.write cob.read
```

**Nota:** O escopo `solicrec` não está sendo solicitado porque a Jornada 1 (Push) não está implementada. Se precisar, adicione `solicrec.write solicrec.read`.

## 📝 Como Habilitar no Portal do BB

1. Acesse: https://developers.bb.com.br/
2. Vá em "Minhas Aplicações"
3. Selecione sua aplicação (correspondente ao `gw_app_key`)
4. Procure por "Permissões", "Scopes" ou "APIs Habilitadas"
5. Habilite todos os escopos listados acima
6. Salve e aguarde 5-10 minutos para propagação

## 🧪 Testar com Escopos Mínimos

Se não conseguir todos os escopos, você pode testar com escopos mínimos por jornada:

### Para Jornada 2 (QR Só Autorização):
```
rec.write rec.read payloadlocationrec.write payloadlocationrec.read
```

### Para Jornada 3 (QR + Pagamento Imediato):
```
rec.write rec.read payloadlocationrec.write payloadlocationrec.read cob.write cob.read
```

### Para Jornada 4 (QR + Pagamento com Vencimento):
```
rec.write rec.read payloadlocationrec.write payloadlocationrec.read cobr.write cobr.read
```

## 🔍 Verificar Escopos no Token

Após obter o token, você pode decodificar o JWT para verificar quais escopos foram concedidos:

```bash
# O token JWT tem 3 partes separadas por ponto
# A segunda parte (payload) contém os escopos
echo "SEU_TOKEN_AQUI" | cut -d. -f2 | base64 -d | jq
```

## ⚠️ Erro 403 - Acesso Negado

Se receber erro 403 ao solicitar o token, significa:

1. ✅ Credenciais (`basic_auth_base64` e `gw_app_key`) estão corretas
2. ❌ Um ou mais escopos solicitados não estão habilitados no Portal do BB

**Solução:**
- Verifique quais escopos estão habilitados no portal
- Compare com os escopos solicitados no código
- Habilite os escopos faltantes
- Aguarde propagação (5-10 minutos)
- Teste novamente

## 📚 Referência

- [Guia Técnico: API Pix Automático Banco do Brasil](file://Guia%20Técnico_%20API%20Pix%20Automático%20Banco%20do%20Brasil.pdf)
- Portal do Desenvolvedor BB: https://developers.bb.com.br/

