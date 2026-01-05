# 🔧 Solução para Certificados SSL Vazios no n8n

## 📋 Situação

Os campos **Certificate** e **Private Key** estão vazios (`__n8n_BLANK_VALUE_...`) tanto na credencial "Vida Ouro" quanto em "SSL Certificates account 3".

## 🔍 Por Que Isso Acontece?

1. **Certificados em Vault Externo** (Enterprise): Se você usa n8n Enterprise, os certificados podem estar em um vault externo
2. **Certificados Criptografados**: Podem estar armazenados de forma criptografada no banco
3. **Certificados Não Configurados**: Podem não ter sido configurados ainda

## ✅ Soluções (Tente nesta ordem)

### 1. Extrair do Banco de Dados do n8n

```bash
npm run configurar-certs
```

Este script:
- Procura automaticamente o banco do n8n
- Extrai certificados de todas as credenciais SSL
- Configura automaticamente

### 2. Verificar Vault Externo (Enterprise)

Se você usa n8n Enterprise:
1. Verifique se há integração com vault externo (HashiCorp Vault, AWS Secrets, etc.)
2. Os certificados podem estar lá
3. Exporte e configure manualmente

### 3. Solicitar ao Banco do Brasil

Se você não tem acesso aos certificados:
1. Entre em contato com o Banco do Brasil
2. Solicite os certificados SSL (.pem ou .crt)
3. Configure manualmente em `certificates/`

### 4. Usar n8n Original

Se o workflow no n8n está funcionando:
- Os certificados estão configurados lá
- Use o n8n para criar as recorrências
- Ou extraia os certificados do n8n que está funcionando

## 🛠️ Configuração Manual

Se você conseguir os certificados de qualquer fonte:

1. Crie a pasta `certificates/` (se não existir)
2. Salve os arquivos:
   - `cert.pem` - Certificate
   - `key.pem` - Private Key
   - `ca.pem` - CA (opcional)
   - `passphrase.txt` - Senha (já configurada: CeciM@042425)
3. Reinicie o servidor

## 📝 Formato dos Arquivos

**cert.pem:**
```
-----BEGIN CERTIFICATE-----
MIIF... (conteúdo)
...
-----END CERTIFICATE-----
```

**key.pem:**
```
-----BEGIN PRIVATE KEY-----
MIIE... (conteúdo)
...
-----END PRIVATE KEY-----
```

## ⚠️ Importante

**Sem os certificados Certificate e Private Key, não é possível conectar à API do Banco do Brasil.**

O erro "bad certificate (alert 42)" indica que o servidor está rejeitando a conexão porque não estamos enviando o certificado cliente correto.

## 🎯 Próximos Passos

1. Execute `npm run configurar-certs` para tentar extrair automaticamente
2. Se não funcionar, verifique outras fontes (vault, BB, etc.)
3. Configure manualmente quando obtiver os certificados
4. Reinicie o servidor e teste

