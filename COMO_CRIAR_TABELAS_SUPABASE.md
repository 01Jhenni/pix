# Como Criar as Tabelas no Supabase

## 📋 Passo a Passo

### 1. Acesse o Supabase Dashboard
- Vá para: https://supabase.com/dashboard
- Faça login na sua conta

### 2. Selecione seu Projeto
- Clique no projeto: `joksegwuxhqgoigvhebb` (ou o nome do seu projeto)

### 3. Abra o SQL Editor
- No menu lateral esquerdo, clique em **"SQL Editor"** (ícone de banco de dados)
- Ou acesse diretamente: https://supabase.com/dashboard/project/joksegwuxhqgoigvhebb/sql/new

### 4. Crie uma Nova Query
- Clique no botão **"New query"** ou **"Nova consulta"**

### 5. Copie o SQL
- Abra o arquivo `database/supabase-schema.sql` no seu editor
- Selecione **TODO o conteúdo** do arquivo (Ctrl+A)
- Copie (Ctrl+C)

### 6. Cole no SQL Editor
- Cole o conteúdo no editor SQL do Supabase (Ctrl+V)

### 7. Execute o SQL
- Clique no botão **"Run"** (ou pressione **Ctrl+Enter**)
- Aguarde alguns segundos

### 8. Verifique o Resultado
- Você deve ver uma mensagem de sucesso
- Se houver erros, verifique se as tabelas já existem (isso é normal)

## ✅ Verificação

Após criar as tabelas, você pode verificar executando:

```bash
npm run check:tables
```

Ou reinicie o servidor:

```bash
npm start
```

O servidor deve iniciar sem avisos sobre tabelas não encontradas.

## 🔍 Tabelas que Serão Criadas

- `auth_users` - Usuários do sistema
- `sessions` - Sessões de autenticação
- `pix_users` - Usuários PIX (credenciais BB)
- `transactions` - Transações/Recorrências
- `user_profiles` - Perfis white label
- `api_keys` - Chaves de API

## ⚠️ Importante

- As tabelas precisam ser criadas **apenas uma vez**
- Se você já criou antes, pode ignorar os erros de "já existe"
- O servidor continuará funcionando mesmo se algumas tabelas não existirem inicialmente

