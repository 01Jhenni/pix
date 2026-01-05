# 🔐 Como Configurar os Certificados

## 📋 Você tem:

- **cadeia_completa.pem** (linhas 1-172) - Certificado completo/cadeia
- **chave.pem** (linhas 1-36) - Chave privada

## 🚀 Opção 1: Script Interativo (Recomendado)

```bash
npm run setup-ssl
```

O script vai pedir para você colar o conteúdo de cada arquivo.

## 📝 Opção 2: Manual

### 1. Certificado (cadeia_completa.pem)

Crie o arquivo `certificates/cert.pem` com o conteúdo completo:

```pem
-----BEGIN CERTIFICATE-----
[conteúdo das linhas 1-172 do cadeia_completa.pem]
-----END CERTIFICATE-----
```

**Importante:** 
- Inclua as linhas `-----BEGIN CERTIFICATE-----` e `-----END CERTIFICATE-----`
- Se o arquivo tiver múltiplos certificados (cadeia), inclua todos

### 2. Chave Privada (chave.pem)

Crie o arquivo `certificates/key.pem` com o conteúdo completo:

```pem
-----BEGIN PRIVATE KEY-----
[conteúdo das linhas 1-36 do chave.pem]
-----END PRIVATE KEY-----
```

**Importante:**
- Inclua as linhas `-----BEGIN PRIVATE KEY-----` e `-----END PRIVATE KEY-----`
- Ou `-----BEGIN RSA PRIVATE KEY-----` se for RSA

### 3. Passphrase (já configurada)

O arquivo `certificates/passphrase.txt` já existe com: `CeciM@042425`

## ✅ Verificar

Após configurar, reinicie o servidor. Você deve ver:

```
✅ Certificados SSL encontrados! Usando certificados do cliente.
```

## 📁 Estrutura Final

```
certificates/
├── cert.pem          ← cadeia_completa.pem (1-172)
├── key.pem           ← chave.pem (1-36)
└── passphrase.txt    ← CeciM@042425 (já existe)
```

## ⚠️ Formato

Os arquivos devem estar no formato PEM:

- Começar com `-----BEGIN CERTIFICATE-----` ou `-----BEGIN PRIVATE KEY-----`
- Terminar com `-----END CERTIFICATE-----` ou `-----END PRIVATE KEY-----`
- Conteúdo entre as tags

## 🔄 Após Configurar

1. Reinicie o servidor: `npm start`
2. Teste criando uma recorrência PIX
3. O erro SSL deve desaparecer!

