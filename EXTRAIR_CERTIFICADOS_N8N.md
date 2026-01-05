# Como Extrair Certificados SSL do n8n - Guia Passo a Passo

## 📸 Baseado na Tela do n8n

Você está na tela de configuração de credenciais SSL "Vida Ouro" no n8n.

## 🔍 Passo a Passo

### 1. Campo CA (Certificate Authority)
- **Localização**: Primeiro campo na tela
- **Ação**: 
  - Clique no campo "CA"
  - Se estiver mascarado (pontos), clique no ícone de "olho" para revelar
  - **Copie TODO o conteúdo** (incluindo `-----BEGIN CERTIFICATE-----` e `-----END CERTIFICATE-----`)
  - Salve como: `certificates/ca.pem`

### 2. Campo Certificate (Certificado)
- **Localização**: Segundo campo na tela
- **Observação**: Pode estar mostrando `__n8n_BLANK_VALUE_...` ou estar vazio
- **Ação**:
  - Clique no campo "Certificate"
  - Se estiver vazio, você precisa obter de outra fonte (veja alternativas abaixo)
  - Se tiver conteúdo, copie TODO (incluindo `-----BEGIN CERTIFICATE-----` e `-----END CERTIFICATE-----`)
  - Salve como: `certificates/cert.pem`

### 3. Campo Private Key (Chave Privada)
- **Localização**: Terceiro campo na tela
- **Observação**: Pode estar mostrando `__n8n_BLANK_VALUE_...` ou estar vazio
- **Ação**:
  - Clique no campo "Private Key"
  - Se estiver vazio, você precisa obter de outra fonte
  - Se tiver conteúdo, copie TODO (incluindo `-----BEGIN PRIVATE KEY-----` e `-----END PRIVATE KEY-----`)
  - Salve como: `certificates/key.pem`

### 4. Campo Passphrase (Senha)
- **Localização**: Quarto campo na tela
- **Valor visto**: `CeciM@042425`
- **Ação**: 
  - Anote esta senha (pode ser necessária se os certificados estiverem criptografados)
  - Se os certificados precisarem de senha, você precisará configurar isso no código

## ⚠️ Se os Campos Certificate/Private Key Estiverem Vazios

Se os campos Certificate e Private Key mostram `__n8n_BLANK_VALUE_...` ou estão vazios, você precisa:

### Opção A: Verificar Outra Credencial SSL
1. Volte para a lista de credenciais
2. Procure por "SSL Certificates account 3" (usada no OAuth)
3. Essa pode ter os certificados preenchidos

### Opção B: Verificar no Banco de Dados do n8n
Os certificados podem estar armazenados no banco de dados do n8n, mesmo que não apareçam na interface.

### Opção C: Solicitar ao Banco do Brasil
Se você não tem acesso aos certificados, solicite-os diretamente ao BB.

## 📝 Formato dos Arquivos

Cada arquivo deve ter este formato:

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

**ca.pem:**
```
-----BEGIN CERTIFICATE-----
MIIF... (conteúdo da CA)
...
-----END CERTIFICATE-----
```

## 🔧 Após Extrair

1. Crie a pasta `certificates/` (se não existir)
2. Salve os arquivos:
   - `certificates/ca.pem`
   - `certificates/cert.pem`
   - `certificates/key.pem`
3. Reinicie o servidor
4. Verifique os logs - deve aparecer: `✅ Certificados SSL encontrados!`

## 🧪 Testar

Após configurar, teste criando uma recorrência PIX no frontend. O erro SSL deve desaparecer!

