# 🚀 Guia Rápido - Extrair Certificados do n8n

## 📸 Baseado na Sua Tela

Você está vendo a tela de credenciais SSL "Vida Ouro" no n8n.

## ⚡ Passo a Passo Rápido

### 1. Campo CA (se tiver conteúdo)
- Clique no campo "CA"
- Clique no ícone de "olho" 👁️ para revelar (se estiver mascarado)
- **Copie TODO o texto** (do `-----BEGIN` até `-----END`)
- Salve como: `certificates/ca.pem`

### 2. Campo Certificate ⚠️ OBRIGATÓRIO
- Clique no campo "Certificate"
- Se estiver vazio ou mostrando `__n8n_BLANK_VALUE_...`:
  - Tente a credencial "SSL Certificates account 3" (usada no OAuth)
  - Ou verifique o banco de dados do n8n
- Se tiver conteúdo:
  - **Copie TODO o texto** (do `-----BEGIN` até `-----END`)
  - Salve como: `certificates/cert.pem`

### 3. Campo Private Key ⚠️ OBRIGATÓRIO
- Clique no campo "Private Key"
- Se estiver vazio ou mostrando `__n8n_BLANK_VALUE_...`:
  - Tente a credencial "SSL Certificates account 3"
  - Ou verifique o banco de dados do n8n
- Se tiver conteúdo:
  - **Copie TODO o texto** (do `-----BEGIN` até `-----END`)
  - Salve como: `certificates/key.pem`

### 4. Passphrase (senha)
- Valor visto: `CeciM@042425`
- Anote esta senha (pode ser necessária)

## 🛠️ Usar o Script de Configuração

Para facilitar, use o script interativo:

```bash
npm run setup-certs
```

O script vai perguntar cada campo e você pode colar o conteúdo diretamente.

## 📁 Estrutura Final

Após extrair, você deve ter:

```
certificates/
├── ca.pem           (opcional)
├── cert.pem         (obrigatório)
├── key.pem          (obrigatório)
└── passphrase.txt   (opcional - apenas se certificados criptografados)
```

## ✅ Verificar

Após salvar os arquivos, reinicie o servidor. Você deve ver:

```
✅ Certificados SSL encontrados! Usando certificados do cliente.
```

## 🔍 Se os Campos Estiverem Vazios

Se Certificate e Private Key estiverem vazios na tela "Vida Ouro":

1. **Tente outra credencial**: "SSL Certificates account 3"
2. **Verifique o banco de dados do n8n** (veja CERTIFICADOS_SSL.md)
3. **Solicite ao Banco do Brasil** se não tiver acesso

## 🎯 Próximo Passo

Depois de configurar os certificados, teste criando uma recorrência PIX. O erro SSL deve desaparecer e o QR Code será gerado! 🎉

