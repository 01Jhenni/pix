# 🔧 Solução para Problema de Autenticação

## ❌ Erro Atual:
```
remote: Permission to 01Jhenni/pix.git denied to 01Jhenni.
fatal: unable to access 'https://github.com/01Jhenni/pix.git/': The requested URL returned error: 403
```

## 🔍 Possíveis Causas:

### 1. Token sem Permissão `repo` ⚠️
O token precisa ter a permissão **`repo`** (acesso completo aos repositórios).

**Solução:**
1. Acesse: https://github.com/settings/tokens
2. Encontre o token que você está usando
3. Verifique se tem a permissão **`repo`** marcada
4. Se não tiver, **crie um novo token** com a permissão `repo`

### 2. Token Expirado ou Revogado ⏰
Tokens podem expirar ou ser revogados.

**Solução:** Crie um novo token.

### 3. Repositório com Restrições 🔒
O repositório pode ter branch protection ou outras restrições.

**Solução:** Verifique as configurações do repositório em: https://github.com/01Jhenni/pix/settings

---

## ✅ Solução Recomendada: Criar Novo Token

### Passo 1: Criar Token com Permissões Corretas

1. Acesse: https://github.com/settings/tokens
2. Clique em **"Generate new token"** → **"Generate new token (classic)"**
3. Configure:
   - **Note:** "PIX System Deploy"
   - **Expiration:** Escolha um prazo (ex: 90 dias)
   - **Select scopes:** Marque **`repo`** (isso dá acesso completo)
4. Clique em **"Generate token"**
5. **COPIE O NOVO TOKEN** (você só verá uma vez!)

### Passo 2: Usar o Novo Token

Execute no PowerShell (substitua `NOVO_TOKEN`):

```powershell
git remote set-url origin https://NOVO_TOKEN@github.com/01Jhenni/pix.git
git push -u origin main
```

**OU** com username explícito:

```powershell
git remote set-url origin https://01Jhenni:NOVO_TOKEN@github.com/01Jhenni/pix.git
git push -u origin main
```

---

## 🔄 Alternativa: Usar SSH

Se o token continuar dando problema, use SSH:

### 1. Gerar Chave SSH:
```powershell
ssh-keygen -t ed25519 -C "seu-email@example.com"
# Pressione Enter para aceitar o local padrão
# Pressione Enter para senha vazia (ou defina uma)
```

### 2. Copiar Chave Pública:
```powershell
cat ~/.ssh/id_ed25519.pub
# OU no Windows:
Get-Content ~/.ssh/id_ed25519.pub
```

### 3. Adicionar no GitHub:
1. Acesse: https://github.com/settings/keys
2. Clique em **"New SSH key"**
3. **Title:** "PIX System Deploy"
4. **Key:** Cole a chave pública
5. Clique em **"Add SSH key"**

### 4. Configurar Git para SSH:
```powershell
git remote set-url origin git@github.com:01Jhenni/pix.git
git push -u origin main
```

---

## 🧪 Testar Token

Para testar se o token funciona, você pode usar:

```powershell
# Testar acesso ao repositório
curl -H "Authorization: token SEU_TOKEN" https://api.github.com/repos/01Jhenni/pix
```

Se retornar informações do repositório, o token está funcionando.

---

## 📝 Checklist

- [ ] Token tem permissão `repo`?
- [ ] Token não está expirado?
- [ ] Repositório existe e você tem acesso?
- [ ] Branch `main` existe no repositório remoto?
- [ ] Não há branch protection ativa?

---

## 🆘 Se Nada Funcionar

1. **Verifique o repositório:** https://github.com/01Jhenni/pix
   - O repositório existe?
   - Você tem acesso de escrita?

2. **Crie o repositório se não existir:**
   - Acesse: https://github.com/new
   - Nome: `pix`
   - **NÃO** inicialize com README
   - Clique em "Create repository"

3. **Use GitHub CLI (se instalado):**
   ```powershell
   gh auth login
   gh repo create 01Jhenni/pix --public --source=. --remote=origin --push
   ```

---

## ⚠️ Segurança

**IMPORTANTE:** Após fazer o push com sucesso, considere:
- Remover o token da URL do remote (por segurança)
- Usar SSH ou credential helper
- Revogar tokens antigos não utilizados

Para remover o token da URL:
```powershell
git remote set-url origin https://github.com/01Jhenni/pix.git
```

E configure credential helper para armazenar o token de forma segura.

