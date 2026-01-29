# 🔐 Resolver Problema de Permissões no Banco do Brasil

## ❌ Erro: "Acesso negado" (HTTP 403)

Este erro indica que as credenciais estão corretas, mas a aplicação não tem as permissões (scopes) necessárias no Banco do Brasil.

## 🔍 Diagnóstico

O erro HTTP 403 (Forbidden) geralmente significa:
- ✅ Credenciais (`basic_auth_base64` e `gw_app_key`) estão corretas
- ❌ Aplicação não tem permissões necessárias configuradas no BB
- ❌ Scopes solicitados não estão habilitados para a aplicação

## 🔧 Solução: Verificar e Configurar Permissões

### 1. Verificar Scopes Solicitados

O sistema solicita os seguintes scopes:
```
rec.write rec.read payloadlocationrec.write payloadlocationrec.read cobr.write cobr.read cob.write cob.read
```

### 2. Configurar no Portal do Banco do Brasil

1. **Acesse o Portal do Desenvolvedor do Banco do Brasil:**
   - https://developers.bb.com.br/
   - Ou o portal específico do seu ambiente (sandbox/produção)

2. **Localize sua aplicação:**
   - Vá em "Minhas Aplicações" ou "Aplicações"
   - Encontre a aplicação que corresponde ao `gw_app_key` configurado

3. **Verifique as permissões (Scopes):**
   - Procure por "Permissões", "Scopes", "OAuth Scopes" ou "APIs Habilitadas"
   - Verifique se os seguintes estão habilitados:
     - ✅ `rec.write` - Criar recorrências
     - ✅ `rec.read` - Consultar recorrências
     - ✅ `payloadlocationrec.write` - Criar localização de recorrência
     - ✅ `payloadlocationrec.read` - Consultar localização de recorrência
     - ✅ `cobr.write` - Criar cobrança
     - ✅ `cobr.read` - Consultar cobrança
     - ✅ `cob.write` - Criar cobrança imediata
     - ✅ `cob.read` - Consultar cobrança imediata

4. **Habilite as permissões necessárias:**
   - Se alguma permissão estiver desabilitada, habilite
   - Salve as alterações
   - Aguarde alguns minutos para a propagação

### 3. Verificar Ambiente (Sandbox vs Produção)

**IMPORTANTE:** Certifique-se de usar as URLs corretas para o ambiente:

#### Ambiente Sandbox (Teste):
- OAuth URL: `https://oauth.sandbox.bb.com.br/oauth/token`
- Base URL: `https://api-pix-h.sandbox.bb.com.br/pix/v2`

#### Ambiente Produção:
- OAuth URL: `https://oauth.bb.com.br/oauth/token`
- Base URL: `https://api-pix.bb.com.br/pix/v2`

**Verificar qual ambiente está configurado:**
```bash
# No Terminus
sqlite3 /root/pix/data/pix.db "SELECT id, nome, oauth_url, base_url FROM pix_users WHERE id = 1;"
```

### 4. Testar com Scopes Mínimos (Alternativa)

Se não conseguir todas as permissões, você pode tentar com scopes mínimos:

**Scopes mínimos para recorrência:**
```
rec.write rec.read payloadlocationrec.write payloadlocationrec.read
```

**Scopes mínimos para cobrança:**
```
cob.write cob.read cobr.write cobr.read
```

**Como testar com scopes diferentes:**

1. Edite o arquivo `pix/services/pixService.js`
2. Localize a linha com os scopes (linha ~252)
3. Modifique temporariamente para testar:
   ```javascript
   scope: 'rec.write rec.read'  // Teste apenas recorrência
   ```

## 📋 Checklist de Verificação

Antes de tentar novamente, verifique:

- [ ] Aplicação está cadastrada no Portal do BB
- [ ] `gw_app_key` corresponde à aplicação no portal
- [ ] `basic_auth_base64` corresponde às credenciais da aplicação
- [ ] Todas as permissões (scopes) estão habilitadas no portal
- [ ] Ambiente (sandbox/produção) está correto
- [ ] Aguardou alguns minutos após habilitar permissões
- [ ] Aplicação não está bloqueada ou suspensa

## 🔄 Testar Novamente

Após configurar as permissões:

```bash
# No Terminus
cd /root/pix
npm run test:oauth
```

Se ainda der erro 403, verifique:
1. Se as permissões foram realmente salvas no portal
2. Se está usando o ambiente correto (sandbox vs produção)
3. Se a aplicação não está com restrições adicionais

## 💡 Dicas Importantes

1. **Ambiente Sandbox:**
   - Geralmente tem menos restrições
   - Use para testes iniciais
   - Permissões podem ser diferentes do ambiente de produção

2. **Tempo de Propagação:**
   - Alterações de permissões podem levar alguns minutos para propagar
   - Aguarde 5-10 minutos após alterar permissões antes de testar novamente

3. **Contato com Suporte BB:**
   - Se as permissões estão habilitadas mas ainda dá erro 403
   - Entre em contato com o suporte do Banco do Brasil
   - Informe o `gw_app_key` e o erro específico

## 🆘 Se Nada Funcionar

1. **Verificar logs detalhados:**
   ```bash
   pm2 logs pix-system | grep -i "403\|forbidden\|permission"
   ```

2. **Testar manualmente com curl:**
   ```bash
   curl -X POST https://oauth.bb.com.br/oauth/token \
     -H "Authorization: Basic SEU_BASIC_AUTH_BASE64" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=client_credentials&scope=rec.write rec.read"
   ```

3. **Verificar resposta do BB:**
   - Se retornar erro específico sobre scopes, ajuste conforme necessário
   - Se retornar erro genérico, pode ser problema de configuração da aplicação no portal

## 📞 Contato

Se precisar de ajuda adicional:
- Portal do Desenvolvedor BB: https://developers.bb.com.br/
- Suporte BB: Verifique no portal as opções de contato
- Documentação API PIX BB: https://developers.bb.com.br/docs/pix

