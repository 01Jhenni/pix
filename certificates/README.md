# Certificados SSL do Banco do Brasil

## 📁 Arquivos Necessários

Coloque aqui os seguintes arquivos de certificado:

- **cert.pem** - Certificado público do cliente
- **key.pem** - Chave privada do cliente  
- **ca.pem** - Certificado da CA (opcional, mas recomendado)

## 🔍 Como Obter os Certificados

### Opção 1: Do n8n (Interface Web)

1. Acesse o n8n → Settings → Credentials
2. Encontre a credencial SSL (ex: "SSL Certificates account 3" ou "Vida Ouro")
3. Copie o conteúdo de:
   - Certificate → salve como `cert.pem`
   - Private Key → salve como `key.pem`
   - CA Certificate → salve como `ca.pem` (se disponível)

### Opção 2: Do Banco de Dados do n8n

```sql
-- SQLite
SELECT data FROM credentials WHERE type = 'httpSslAuth' AND name LIKE '%SSL%';

-- O campo 'data' contém JSON com os certificados
-- Extraia e salve nos arquivos .pem
```

### Opção 3: Solicitar ao Banco do Brasil

Se você não tem acesso ao n8n, solicite os certificados diretamente ao BB.

## 📝 Formato dos Arquivos

Os arquivos devem estar no formato PEM:

```
-----BEGIN CERTIFICATE-----
MIIF...
...
-----END CERTIFICATE-----
```

```
-----BEGIN PRIVATE KEY-----
MIIE...
...
-----END PRIVATE KEY-----
```

## ⚠️ Segurança

- **NUNCA** commite estes arquivos no Git
- Mantenha permissões restritas (chmod 600)
- Não compartilhe os certificados
- Faça backup seguro

## ✅ Verificar se Funcionou

Após adicionar os certificados, reinicie o servidor. Você verá:

```
✅ Certificados SSL encontrados! Usando certificados do cliente.
```

Se não encontrar:

```
⚠️  Certificados SSL não encontrados. Usando modo sem certificado (pode falhar).
```

