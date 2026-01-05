# Como Extrair e Configurar Certificados SSL do n8n

## 📋 Pré-requisitos

- Acesso ao n8n onde o workflow está funcionando
- Acesso às credenciais SSL configuradas no n8n
- Permissão para exportar/visualizar credenciais

## 🔍 Método 1: Extrair do n8n via Interface Web

### Passo 1: Acessar Credenciais no n8n

1. Abra o n8n no navegador
2. Vá em **Settings** → **Credentials** (ou **Configurações** → **Credenciais**)
3. Procure pela credencial SSL chamada:
   - `SSL Certificates account 3` (para OAuth)
   - `Vida Ouro` (para requisições PIX)

### Passo 2: Visualizar/Exportar Certificados

1. Clique na credencial SSL
2. Procure pelos campos:
   - **Certificate** (certificado público)
   - **Private Key** (chave privada)
   - **CA Certificate** (certificado da CA, se houver)

3. Copie o conteúdo de cada campo

### Passo 3: Salvar os Certificados

Crie os seguintes arquivos na pasta `certificates/`:

- `cert.pem` - Certificado público
- `key.pem` - Chave privada
- `ca.pem` - Certificado da CA (se disponível)

## 🔍 Método 2: Extrair do Banco de Dados do n8n

Se você tem acesso ao banco de dados do n8n:

### SQLite (n8n local)

```sql
-- Conectar ao banco do n8n
sqlite3 ~/.n8n/database.sqlite

-- Buscar credenciais SSL
SELECT name, data FROM credentials WHERE type = 'httpSslAuth';

-- O campo 'data' contém JSON com os certificados
```

### PostgreSQL/MySQL (n8n em produção)

```sql
SELECT name, data FROM credentials WHERE type = 'httpSslAuth';
```

### Estrutura do JSON

O campo `data` contém algo como:

```json
{
  "certificate": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
  "privateKey": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----",
  "caCertificate": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
}
```

## 🔍 Método 3: Via API do n8n (se habilitada)

```bash
# Obter token de autenticação
curl -X POST http://seu-n8n.com/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"email": "seu-email", "password": "sua-senha"}'

# Listar credenciais
curl -X GET http://seu-n8n.com/api/v1/credentials \
  -H "Authorization: Bearer SEU_TOKEN"

# Obter credencial específica
curl -X GET http://seu-n8n.com/api/v1/credentials/ID_DA_CREDENCIAL \
  -H "Authorization: Bearer SEU_TOKEN"
```

## 📁 Estrutura de Arquivos

Após extrair, organize assim:

```
pixteste/
├── certificates/
│   ├── cert.pem          # Certificado público
│   ├── key.pem           # Chave privada
│   └── ca.pem            # CA (opcional)
└── ...
```

## ⚙️ Configuração no Sistema

Após ter os certificados, configure no sistema:

1. Coloque os arquivos na pasta `certificates/`
2. O sistema detectará automaticamente
3. Ou configure manualmente no banco de dados do usuário PIX

## 🔐 Segurança

⚠️ **IMPORTANTE:**
- Nunca compartilhe os certificados
- Não commite os certificados no Git
- Mantenha os arquivos seguros
- Use permissões restritas (chmod 600)

## 🧪 Testar Certificados

Após configurar, teste com:

```bash
curl -X POST https://oauth.bb.com.br/oauth/token \
  --cert certificates/cert.pem \
  --key certificates/key.pem \
  -H "Authorization: Basic SEU_BASIC_AUTH" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&scope=..."
```

## 📝 Notas

- Os certificados são específicos por ambiente (homologação/produção)
- Certificados expiram periodicamente - renove quando necessário
- Mantenha backup seguro dos certificados

