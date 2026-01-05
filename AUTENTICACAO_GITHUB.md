# 🔐 Como Fazer Push para o GitHub

## Problema Resolvido ✅
- Credenciais antigas foram removidas
- Repositório remoto configurado: `https://github.com/01Jhenni/pix.git`

## 📋 Próximo Passo: Autenticação

Você precisa autenticar com a conta **01Jhenni** no GitHub. Escolha uma das opções:

---

## Opção 1: Personal Access Token (Recomendado) ⭐

### Passo 1: Criar Token
1. Acesse: https://github.com/settings/tokens
2. Clique em **"Generate new token"** → **"Generate new token (classic)"**
3. Dê um nome (ex: "PIX System Deploy")
4. Selecione a permissão: **`repo`** (acesso completo aos repositórios)
5. Clique em **"Generate token"**
6. **COPIE O TOKEN** (você só verá ele uma vez!)

### Passo 2: Usar o Token
Execute no PowerShell (substitua `SEU_TOKEN_AQUI` pelo token copiado):

```powershell
git remote set-url origin https://SEU_TOKEN_AQUI@github.com/01Jhenni/pix.git
git push -u origin main
```

**OU** quando o Git pedir credenciais:
- **Username:** `01Jhenni`
- **Password:** `SEU_TOKEN_AQUI` (cole o token aqui)

---

## Opção 2: Autenticação Interativa

Execute o push e quando pedir credenciais:

```powershell
git push -u origin main
```

Quando solicitar:
- **Username:** `01Jhenni`
- **Password:** Use um Personal Access Token (não sua senha normal)

---

## Opção 3: SSH (Alternativa)

Se preferir usar SSH:

### 1. Gerar chave SSH (se ainda não tiver):
```powershell
ssh-keygen -t ed25519 -C "seu-email@example.com"
```

### 2. Copiar chave pública:
```powershell
cat ~/.ssh/id_ed25519.pub
```

### 3. Adicionar no GitHub:
- Acesse: https://github.com/settings/keys
- Clique em **"New SSH key"**
- Cole a chave pública
- Salve

### 4. Alterar remote para SSH:
```powershell
git remote set-url origin git@github.com:01Jhenni/pix.git
git push -u origin main
```

---

## ✅ Após o Push Bem-Sucedido

Você verá algo como:
```
Enumerating objects: 76, done.
Counting objects: 100% (76/76), done.
...
To https://github.com/01Jhenni/pix.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

Seu código estará disponível em: **https://github.com/01Jhenni/pix**

---

## 🚀 Próximo: Deploy no Terminus

Após o push bem-sucedido, você pode:
1. Conectar o repositório GitHub no Terminus
2. Configurar variáveis de ambiente
3. Fazer o deploy

---

## ⚠️ Importante

- **NUNCA** compartilhe seu Personal Access Token
- Tokens têm permissões completas ao repositório
- Se suspeitar que o token foi comprometido, revogue-o em: https://github.com/settings/tokens

