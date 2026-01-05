# Configuração do Supabase

## 1. Criar as Tabelas

Acesse o Supabase Dashboard: https://supabase.com/dashboard

1. Vá em **SQL Editor**
2. Cole o conteúdo do arquivo `supabase-schema.sql`
3. Execute o SQL

OU execute diretamente no terminal do Supabase:

```bash
# No Supabase CLI (se tiver instalado)
supabase db push
```

## 2. Variáveis de Ambiente (Opcional)

Se quiser usar variáveis de ambiente ao invés de valores hardcoded:

Crie um arquivo `.env`:

```env
SUPABASE_URL=https://joksegwuxhqgoigvhebb.supabase.co
SUPABASE_KEY=sb_publishable_PYm4oqLlgttAQAFmo10dVQ_o6FIW96r
```

O sistema já está configurado para usar essas variáveis se existirem.

## 3. Verificar Conexão

Após criar as tabelas, reinicie o servidor:

```bash
npm start
```

Você deve ver:
```
✅ Cliente Supabase inicializado
✅ Banco de dados Supabase inicializado
```

## 4. Migrar Dados Existentes (Se necessário)

Se você tem dados no banco JSON atual e quer migrar:

1. Exporte os dados do `pix_system.json`
2. Use o Supabase Dashboard para importar
3. Ou crie um script de migração

