# 🌐 Como Configurar o Domínio pix.masterclassic.com.br no Terminus

## 📋 Passo a Passo Completo

### 1️⃣ Configurar Domínio no Dashboard do Terminus

1. **Acesse o Dashboard do Terminus**
   - Faça login no painel do Terminus
   - Vá até o seu projeto/aplicação

2. **Configurar Domínio Personalizado**
   - Vá em **Configurações** ou **Settings**
   - Procure por **Domínios** ou **Custom Domain**
   - Clique em **Adicionar Domínio** ou **Add Domain**

3. **Adicionar o Domínio**
   - Digite: `pix.masterclassic.com.br`
   - Salve as configurações

4. **Anotar Informações de DNS**
   - O Terminus vai mostrar as informações de DNS necessárias
   - Anote o **IP** ou **CNAME** que precisa ser configurado

---

### 2️⃣ Configurar DNS no Provedor de Domínio

Você precisa configurar o DNS no provedor onde o domínio `masterclassic.com.br` está registrado.

#### Opção A: Usando CNAME (Recomendado)

No painel de DNS do seu provedor (Registro.br, GoDaddy, etc.), adicione:

```
Tipo: CNAME
Nome: pix
Valor: [o CNAME fornecido pelo Terminus]
TTL: 3600 (ou padrão)
```

#### Opção B: Usando Registro A (IP)

Se o Terminus fornecer um IP:

```
Tipo: A
Nome: pix
Valor: [IP fornecido pelo Terminus]
TTL: 3600 (ou padrão)
```

---

### 3️⃣ Verificar Configuração do Servidor

No terminal do Terminus, verifique se o servidor está rodando:

```bash
# Verificar se o servidor está rodando
ps aux | grep node

# Verificar logs
tail -f /var/log/pix.log
# ou
pm2 logs
```

---

### 4️⃣ Configurar Variáveis de Ambiente (se necessário)

No dashboard do Terminus, em **Variáveis de Ambiente**, certifique-se de ter:

```
NODE_ENV=production
PORT=3000
SSL_CERT=[conteúdo do cert.pem]
SSL_KEY=[conteúdo do chave.pem]
```

---

### 5️⃣ Aguardar Propagação DNS

Após configurar o DNS:
- **TTL padrão**: 1-4 horas
- **Pode levar até 48 horas** em alguns casos
- Use ferramentas para verificar: https://dnschecker.org

Verificar propagação:
```bash
# No terminal local
nslookup pix.masterclassic.com.br
# ou
dig pix.masterclassic.com.br
```

---

### 6️⃣ Testar o Domínio

Após a propagação DNS, teste:

```bash
# Health check
curl https://pix.masterclassic.com.br/health

# Deve retornar:
# {"status":"ok","timestamp":"...","uptime":...,"version":"2.0.0"}
```

---

## ✅ Verificações Finais

### Testar no Navegador

1. **Painel Admin:**
   ```
   https://pix.masterclassic.com.br
   ```

2. **API Externa:**
   ```
   https://pix.masterclassic.com.br/api/v1/pix
   ```

3. **Health Check:**
   ```
   https://pix.masterclassic.com.br/health
   ```

---

## 🔧 Troubleshooting

### Erro: "Site não encontrado" ou "DNS não resolve"

1. **Verificar DNS:**
   ```bash
   nslookup pix.masterclassic.com.br
   ```

2. **Verificar se o DNS está correto:**
   - Confirme que o registro está apontando para o Terminus
   - Aguarde mais tempo para propagação

3. **Verificar no Terminus:**
   - Confirme que o domínio está adicionado
   - Verifique se há erros nos logs

### Erro: "Certificado SSL inválido"

O Terminus geralmente fornece SSL automático. Se não funcionar:

1. Verifique se o domínio está configurado corretamente
2. Aguarde alguns minutos para o certificado ser gerado
3. Entre em contato com o suporte do Terminus

### Erro: "502 Bad Gateway" ou "Servidor não responde"

1. **Verificar se o servidor está rodando:**
   ```bash
   ps aux | grep node
   ```

2. **Reiniciar o servidor:**
   ```bash
   cd /root/pix
   npm start
   # ou
   pm2 restart all
   ```

3. **Verificar logs:**
   ```bash
   tail -f /var/log/pix.log
   ```

### O domínio não carrega o frontend

1. Verifique se a pasta `public/` existe:
   ```bash
   ls -la /root/pix/public
   ```

2. Verifique se o `index.html` existe:
   ```bash
   ls -la /root/pix/public/index.html
   ```

3. Reinicie o servidor após verificar

---

## 📝 Checklist Completo

- [ ] Domínio adicionado no dashboard do Terminus
- [ ] DNS configurado no provedor (CNAME ou A)
- [ ] Aguardou propagação DNS (verificar com nslookup)
- [ ] Servidor rodando no Terminus
- [ ] Variáveis de ambiente configuradas
- [ ] Certificados SSL configurados
- [ ] Health check funcionando
- [ ] Frontend acessível via domínio
- [ ] API acessível via domínio

---

## 🚀 Comandos Rápidos

### Verificar Status Completo

```bash
# 1. Verificar se servidor está rodando
ps aux | grep node

# 2. Verificar DNS localmente
nslookup pix.masterclassic.com.br

# 3. Testar health check
curl https://pix.masterclassic.com.br/health

# 4. Ver logs do servidor
tail -f /var/log/pix.log
```

---

## 📞 Suporte

Se tiver problemas:

1. Verifique os logs no dashboard do Terminus
2. Verifique a configuração de DNS
3. Entre em contato com o suporte do Terminus
4. Verifique se o servidor está rodando corretamente

---

## 🔗 Links Úteis

- **Verificar DNS:** https://dnschecker.org
- **Testar SSL:** https://www.ssllabs.com/ssltest/
- **Documentação Terminus:** Consulte a documentação oficial do Terminus

