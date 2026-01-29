# Banco de Dados SQLite Local

## 📋 Visão Geral

O sistema agora usa **SQLite** como banco de dados local persistente. Todos os dados são salvos em um único arquivo (`data/pix.db`) e **não são perdidos** ao reiniciar o servidor.

## ✅ Vantagens

- ✅ **Persistente**: Dados salvos em arquivo, não perde nada ao reiniciar
- ✅ **Local**: Não precisa de servidor externo (como Supabase)
- ✅ **Fácil manutenção**: Um único arquivo `.db`
- ✅ **Backup simples**: Basta copiar o arquivo `data/pix.db`
- ✅ **Performance**: Muito rápido para operações locais
- ✅ **Confiável**: SQLite é usado em produção por grandes empresas

## 📁 Localização

O banco de dados é salvo em:
```
pix/data/pix.db
```

## 🔧 Manutenção

### Backup
Para fazer backup, simplesmente copie o arquivo:
```bash
cp data/pix.db data/pix.db.backup
```

### Restaurar
Para restaurar um backup:
```bash
cp data/pix.db.backup data/pix.db
```

### Visualizar Dados
Você pode usar ferramentas como:
- **DB Browser for SQLite** (grátis): https://sqlitebrowser.org/
- **SQLite CLI**: `sqlite3 data/pix.db`

### Limpar Banco
Se precisar resetar tudo (CUIDADO: apaga todos os dados):
```bash
rm data/pix.db
# O banco será recriado automaticamente na próxima inicialização
```

## 📊 Estrutura das Tabelas

- **pix_users**: Usuários PIX cadastrados
- **transactions**: Transações e recorrências PIX
- **api_keys**: Chaves de API geradas
- **user_profiles**: Perfis white label dos usuários
- **auth_users**: Usuários de autenticação (se usar login)
- **sessions**: Sessões de autenticação

## ⚠️ Importante

- O arquivo `data/pix.db` está no `.gitignore` e **não será commitado** no Git
- Sempre faça backup antes de atualizações importantes
- O banco é criado automaticamente na primeira execução
- Não precisa de configuração adicional

## 🚀 Migração de Dados

Se você tinha dados no banco em memória anterior, eles foram perdidos. Para migrar dados manualmente:

1. Use a interface web para recadastrar usuários PIX
2. As transações serão criadas automaticamente ao usar o sistema

