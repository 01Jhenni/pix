# 🔧 Comandos para Atualizar Código no Terminus

## 📋 Atualizar Código do GitHub

Se o Terminus usa Git e você precisa atualizar o código manualmente:

### 1. Acessar o Servidor via SSH/Terminal

No dashboard do Terminus, abra o terminal/SSH do servidor.

### 2. Navegar até o Diretório do Projeto

```bash
cd /root/pix
# ou o caminho onde o projeto está instalado
```

### 3. Verificar Status do Git

```bash
git status
```

### 4. Atualizar do GitHub

```bash
# Buscar atualizações do GitHub
git fetch origin

# Ver diferenças
git log HEAD..origin/main

# Fazer pull das atualizações
git pull origin main
```

### 5. Reinstalar Dependências (se necessário)

```bash
npm install --build-from-source
```

### 6. Reiniciar o Servidor

```bash
# Se usar PM2
pm2 restart all

# Ou reinicie pelo dashboard do Terminus
```

---

## 🔄 Atualização Completa (Recomendado)

Execute todos os comandos em sequência:

```bash
cd /root/pix
git fetch origin
git pull origin main
npm install --build-from-source
pm2 restart all
```

---

## 🚨 Se o Git não estiver configurado

Se o repositório não estiver conectado ao GitHub:

### 1. Verificar Remote

```bash
git remote -v
```

### 2. Adicionar Remote (se não existir)

```bash
git remote add origin https://github.com/01Jhenni/pix.git
```

### 3. Fazer Pull

```bash
git pull origin main
```

---

## 📝 Comandos Alternativos

### Forçar Atualização (cuidado!)

```bash
git fetch origin
git reset --hard origin/main
npm install --build-from-source
```

### Verificar Último Commit

```bash
git log -1
```

### Ver Diferenças

```bash
git diff HEAD origin/main
```

---

## ✅ Verificar se Atualizou

Após atualizar, verifique:

```bash
# Ver último commit
git log -1

# Verificar se o arquivo foi atualizado
cat DEPLOY_TERMINUS.md | head -20
```

---

## 🔍 Troubleshooting

### Erro: "fatal: not a git repository"

O diretório não é um repositório Git. Você precisa clonar:

```bash
cd /root
git clone https://github.com/01Jhenni/pix.git
cd pix
npm install --build-from-source
```

### Erro: "Your branch is behind"

Execute:

```bash
git pull origin main
```

### Erro: "Cannot find package 'better-sqlite3'"

Execute:

```bash
npm install --build-from-source
```

---

## 📞 Próximos Passos

Após atualizar:
1. Verifique os logs: `pm2 logs` ou logs no dashboard
2. Teste o health check: `curl https://pix.masterclassic.com.br/health`
3. Verifique se o servidor está rodando: `pm2 status`

