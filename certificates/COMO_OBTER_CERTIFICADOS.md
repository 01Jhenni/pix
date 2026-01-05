# Como Obter os Certificados que Estão Faltando

## 📋 Situação Atual

Você já tem:
- ✅ Passphrase: `CeciM@042425` (já configurada)

Você precisa:
- ❌ Certificate (cert.pem) - OBRIGATÓRIO
- ❌ Private Key (key.pem) - OBRIGATÓRIO  
- ❓ CA (ca.pem) - Opcional

## 🔍 Onde Encontrar os Certificados

### Opção 1: Credencial "SSL Certificates account 3"

No n8n:
1. Vá em **Settings** → **Credentials**
2. Procure por: **"SSL Certificates account 3"**
3. Essa credencial é usada no nó "2. OAuth Token"
4. Abra essa credencial
5. Verifique se os campos Certificate e Private Key estão preenchidos
6. Se estiverem, copie e salve:
   - Certificate → `cert.pem`
   - Private Key → `key.pem`

### Opção 2: Verificar Banco de Dados do n8n

Os certificados podem estar no banco mesmo que não apareçam na interface.

**SQLite (n8n local):**
```bash
sqlite3 ~/.n8n/database.sqlite
SELECT name, data FROM credentials WHERE type = 'httpSslAuth';
```

**PostgreSQL/MySQL:**
```sql
SELECT name, data FROM credentials WHERE type = 'httpSslAuth';
```

O campo `data` contém JSON com os certificados.

### Opção 3: Solicitar ao Banco do Brasil

Se você não tem acesso aos certificados, solicite-os diretamente ao BB.

## 📝 Formato dos Arquivos

**cert.pem:**
```
-----BEGIN CERTIFICATE-----
MIIF... (conteúdo do certificado)
...
-----END CERTIFICATE-----
```

**key.pem:**
```
-----BEGIN PRIVATE KEY-----
MIIE... (conteúdo da chave)
...
-----END PRIVATE KEY-----
```

## ✅ Após Obter

1. Salve os arquivos nesta pasta (`certificates/`)
2. Reinicie o servidor
3. Você verá: `✅ Certificados SSL encontrados!`
4. Teste criando uma recorrência PIX

