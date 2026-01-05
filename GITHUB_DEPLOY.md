# Guia para Deploy no GitHub e Terminus

## ✅ Passo 1: Repositório Local Preparado

O repositório Git local já foi inicializado e o commit inicial foi feito com sucesso!

## 📤 Passo 2: Criar Repositório no GitHub

1. Acesse: https://github.com/new
2. Escolha um nome para o repositório (ex: `pix-jornada3-system`)
3. **NÃO** inicialize com README, .gitignore ou licença (já temos tudo)
4. Clique em "Create repository"

## 🔗 Passo 3: Conectar e Fazer Push

### Opção A: Usando o Script Automático

```powershell
.\push-to-github.ps1 -GitHubUrl "https://github.com/SEU-USUARIO/SEU-REPO.git"
```

### Opção B: Comandos Manuais

```powershell
# Adicionar o repositório remoto
git remote add origin https://github.com/SEU-USUARIO/SEU-REPO.git

# Renomear branch para main (se necessário)
git branch -M main

# Fazer push
git push -u origin main
```

## 🔐 Autenticação no GitHub

Se você receber erro de autenticação:

1. **Usando Personal Access Token (recomendado):**
   - Vá em: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Crie um novo token com permissão `repo`
   - Use o token como senha quando solicitado

2. **Ou configure SSH:**
   ```powershell
   # Gerar chave SSH (se ainda não tiver)
   ssh-keygen -t ed25519 -C "seu-email@example.com"
   
   # Copiar chave pública
   cat ~/.ssh/id_ed25519.pub
   
   # Adicionar em: GitHub → Settings → SSH and GPG keys
   ```

## 🚀 Passo 4: Deploy no Terminus

Após o push para o GitHub, você pode fazer deploy no Terminus:

1. Acesse o painel do Terminus
2. Conecte seu repositório GitHub
3. Configure as variáveis de ambiente necessárias
4. Faça o deploy

### Variáveis de Ambiente Importantes:

- `NODE_ENV=production`
- Variáveis de certificados SSL (se necessário)
- Configurações de banco de dados
- Chaves de API

## 📝 Próximos Passos

Após o push, você terá:
- ✅ Código versionado no GitHub
- ✅ Histórico de commits
- ✅ Pronto para CI/CD
- ✅ Pronto para deploy no Terminus

## ⚠️ Importante

- Certificados SSL (`*.pem`, `*.key`, `*.p12`) estão no `.gitignore` e **NÃO** serão enviados
- Configure as variáveis de ambiente no Terminus após o deploy
- O arquivo `pix_system.json` (banco de dados) também está ignorado

