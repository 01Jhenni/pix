# 💾 Garantir Persistência do Banco de Dados no Terminus

## ⚠️ Problema

Após o deploy, os dados do banco de dados podem ser perdidos se o arquivo `data/pix.db` não for preservado.

## ✅ Solução

### 1. O Banco de Dados Já Está Configurado para Persistir

O banco de dados SQLite está configurado para salvar em:
```
/root/pix/data/pix.db
```

Este arquivo **não é apagado** quando você reinicia o servidor, apenas quando:
- O diretório é deletado
- O arquivo é removido manualmente
- Um novo deploy apaga o diretório

### 2. Garantir Persistência no Terminus

#### Opção A: Usar Volume Persistente (Recomendado)

No Terminus, configure um volume persistente para o diretório `data/`:

1. **No dashboard do Terminus:**
   - Vá em **Configurações > Volumes/Storage**
   - Adicione um volume persistente apontando para: `/root/pix/data`
   - Ou configure o caminho do banco para um diretório persistente

#### Opção B: Usar Variável de Ambiente para Caminho do Banco

Você pode configurar o caminho do banco via variável de ambiente:

```bash
# No Terminus, adicione variável de ambiente:
DB_PATH=/persistent/data/pix.db
```

E modifique o código para usar essa variável (já está implementado).

#### Opção C: Backup Automático

Crie um script de backup que salva o banco periodicamente:

```bash
# Criar script de backup
cat > /root/pix/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/root/pix/backups"
DB_PATH="/root/pix/data/pix.db"
mkdir -p $BACKUP_DIR
cp $DB_PATH "$BACKUP_DIR/pix-$(date +%Y%m%d-%H%M%S).db"
# Manter apenas últimos 7 backups
ls -t $BACKUP_DIR/pix-*.db | tail -n +8 | xargs rm -f
EOF

chmod +x /root/pix/backup-db.sh

# Adicionar ao crontab (backup a cada 6 horas)
(crontab -l 2>/dev/null; echo "0 */6 * * * /root/pix/backup-db.sh") | crontab -
```

### 3. Verificar se o Banco Está Sendo Salvo

```bash
# Verificar se o arquivo existe
ls -lh /root/pix/data/pix.db

# Ver tamanho do arquivo
du -h /root/pix/data/pix.db

# Verificar permissões
ls -la /root/pix/data/
```

### 4. Após Deploy, Restaurar Banco (se necessário)

Se o banco foi perdido após deploy:

```bash
# Se tiver backup
cp /root/pix/backups/pix-YYYYMMDD-HHMMSS.db /root/pix/data/pix.db

# Ou criar admin novamente
cd /root/pix
npm run create:admin
```

## 🔧 Configuração Recomendada no Terminus

### Variáveis de Ambiente

```
NODE_ENV=production
PORT=3000
DB_PATH=/root/pix/data/pix.db
```

### Volume Persistente

Configure um volume persistente para:
- **Caminho:** `/root/pix/data`
- **Tipo:** Persistent Volume
- **Backup:** Habilitado (se disponível)

## 📝 Checklist

- [ ] Banco de dados está em `/root/pix/data/pix.db`
- [ ] Volume persistente configurado no Terminus (se disponível)
- [ ] Script de backup configurado (opcional mas recomendado)
- [ ] Após deploy, verificar se o banco ainda existe
- [ ] Se banco foi perdido, executar `npm run create:admin` para recriar admin

## 🚨 Importante

- O arquivo `data/pix.db` está no `.gitignore` e **não será commitado**
- Isso é **correto** - cada servidor tem seu próprio banco
- Mas você precisa garantir que o Terminus **não apague** o diretório `data/` no deploy
- Configure volumes persistentes ou backups automáticos

## 💡 Dica

Se o Terminus apagar o diretório no deploy, você pode:

1. **Mover o banco para fora do diretório do projeto:**
   ```bash
   # Criar diretório persistente
   mkdir -p /persistent/pix-data
   
   # Mover banco
   mv /root/pix/data/pix.db /persistent/pix-data/pix.db
   
   # Criar symlink
   ln -s /persistent/pix-data/pix.db /root/pix/data/pix.db
   ```

2. **Ou modificar o código para usar caminho absoluto persistente**

