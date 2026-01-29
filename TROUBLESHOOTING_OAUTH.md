# 🔧 Troubleshooting: Erros OAuth ao Gerar PIX

## ❌ Erro: "Falha ao obter token OAuth"

Este erro ocorre quando o sistema não consegue obter o token de autenticação OAuth do Banco do Brasil.

## 🔍 Diagnóstico

### 1. Verificar Credenciais do Usuário PIX

Certifique-se de que o usuário PIX tem todas as credenciais configuradas:

```bash
# No Terminus, verificar dados do usuário
sqlite3 /root/pix/data/pix.db "SELECT id, nome, cnpj, ativo, oauth_url, gw_app_key, LENGTH(basic_auth_base64) as auth_len FROM pix_users WHERE id = 1;"
```

**Campos obrigatórios:**
- ✅ `oauth_url` - URL do endpoint OAuth (padrão: `https://oauth.bb.com.br/oauth/token`)
- ✅ `gw_app_key` - Chave da aplicação (GW-APP-KEY)
- ✅ `basic_auth_base64` - Credencial Basic Auth em Base64
- ✅ `ativo` - Deve ser `1` (ativo)

### 2. Verificar Certificados SSL

O Banco do Brasil requer certificados SSL do cliente. Verifique se os certificados estão presentes:

```bash
# Verificar se os certificados existem
ls -lh /root/pix/certificates/

# Deve ter:
# - cert.pem (ou certificate.pem)
# - key.pem (ou chave.pem)
# - ca.pem (opcional)
# - passphrase.txt (se necessário)
```

### 3. Testar Conexão OAuth Manualmente

```bash
# Testar requisição OAuth diretamente
curl -X POST https://oauth.bb.com.br/oauth/token \
  -H "Authorization: Basic SEU_BASIC_AUTH_BASE64" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&scope=rec.write rec.read"
```

## 🔧 Soluções Comuns

### Problema 1: Credenciais Inválidas

**Sintoma:** Erro HTTP 401 (Unauthorized)

**Solução:**
1. Verifique se o `basic_auth_base64` está correto
2. O formato deve ser: `Base64(client_id:client_secret)`
3. Verifique se as credenciais não expiraram no Banco do Brasil

**Como corrigir:**
```bash
# No painel admin, edite o usuário PIX e atualize:
# - basic_auth_base64: Base64 do client_id:client_secret
# - gw_app_key: Chave da aplicação
```

### Problema 2: Certificados SSL Ausentes

**Sintoma:** Erro "SSL", "certificate", "bad certificate", "EPROTO"

**Solução:**
1. Certificados são **OBRIGATÓRIOS** para a API do Banco do Brasil
2. Você precisa dos certificados `.pem` fornecidos pelo BB

**Como corrigir:**
```bash
# 1. Criar diretório de certificados
mkdir -p /root/pix/certificates

# 2. Copiar certificados para o diretório
# (Você precisa obter os certificados do Banco do Brasil)
cp seu-cert.pem /root/pix/certificates/cert.pem
cp sua-chave.pem /root/pix/certificates/key.pem
cp seu-ca.pem /root/pix/certificates/ca.pem  # Se tiver

# 3. Se tiver passphrase, criar arquivo
echo "sua-passphrase" > /root/pix/certificates/passphrase.txt

# 4. Reiniciar servidor
pm2 restart pix-system
```

### Problema 3: URL OAuth Incorreta

**Sintoma:** Erro HTTP 404 (Not Found)

**Solução:**
- Verifique se a URL está correta: `https://oauth.bb.com.br/oauth/token`
- Para sandbox: `https://oauth.sandbox.bb.com.br/oauth/token`

**Como corrigir:**
```bash
# Atualizar URL OAuth do usuário
sqlite3 /root/pix/data/pix.db "UPDATE pix_users SET oauth_url = 'https://oauth.bb.com.br/oauth/token' WHERE id = 1;"
```

### Problema 4: Timeout na Conexão

**Sintoma:** Erro "ETIMEDOUT" ou "ECONNREFUSED"

**Solução:**
1. Verifique conectividade com o servidor do BB
2. Verifique firewall/proxy
3. Aumente o timeout (já está em 30s)

**Como testar:**
```bash
# Testar conectividade
ping oauth.bb.com.br
curl -v https://oauth.bb.com.br/oauth/token
```

### Problema 5: Permissões Insuficientes

**Sintoma:** Erro HTTP 403 (Forbidden)

**Solução:**
- Verifique se a aplicação no Banco do Brasil tem as permissões necessárias
- Scopes necessários: `rec.write rec.read payloadlocationrec.write payloadlocationrec.read cobr.write cobr.read cob.write cob.read`

## 📋 Checklist de Verificação

Antes de gerar um PIX, verifique:

- [ ] Usuário PIX está ativo (`ativo = 1`)
- [ ] `oauth_url` está configurada corretamente
- [ ] `gw_app_key` está preenchida
- [ ] `basic_auth_base64` está preenchida e válida
- [ ] Certificados SSL estão presentes em `/root/pix/certificates/`
- [ ] Certificados não estão expirados
- [ ] Conectividade com `oauth.bb.com.br` está funcionando
- [ ] Aplicação no BB tem permissões necessárias

## 🔍 Logs Detalhados

Para ver logs detalhados do erro:

```bash
# Ver logs do servidor
pm2 logs pix-system --lines 100

# Procurar por erros OAuth
pm2 logs pix-system | grep -i "oauth\|token\|ssl\|certificate"
```

## 💡 Dicas

1. **Cache de Token:** O sistema cacheia tokens OAuth por ~55 minutos. Se você alterar credenciais, pode precisar aguardar ou limpar o cache.

2. **Ambiente Sandbox:** Para testes, use o ambiente sandbox do BB:
   - OAuth URL: `https://oauth.sandbox.bb.com.br/oauth/token`
   - Base URL: `https://api-pix-h.sandbox.bb.com.br/pix/v2`

3. **Validação de Certificados:** O sistema tenta múltiplas configurações SSL automaticamente. Se todas falharem, você precisa dos certificados corretos.

## 🆘 Ainda com Problemas?

Se o erro persistir:

1. **Verifique os logs completos:**
   ```bash
   pm2 logs pix-system --lines 200 | grep -A 10 -B 10 "OAuth"
   ```

2. **Teste manualmente:**
   ```bash
   node -e "
   const axios = require('axios');
   axios.post('https://oauth.bb.com.br/oauth/token', 
     'grant_type=client_credentials&scope=rec.write',
     { headers: { 'Authorization': 'Basic SEU_BASE64', 'Content-Type': 'application/x-www-form-urlencoded' } }
   ).then(r => console.log('OK:', r.data)).catch(e => console.error('ERRO:', e.message));
   "
   ```

3. **Contate o suporte do Banco do Brasil** se as credenciais estiverem corretas mas ainda assim falhar.

