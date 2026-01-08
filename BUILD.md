# Como Construir o Frontend

## Problema: Frontend não aparece

Se você está vendo apenas uma mensagem JSON ou uma página de aviso, significa que o frontend React não foi construído ainda.

## Solução Rápida

No servidor, execute:

```bash
# 1. Fazer pull das últimas alterações
git pull

# 2. Instalar dependências (se necessário)
npm install

# 3. Construir o frontend
npm run build

# 4. Reiniciar o servidor
npm start
```

## Comando Único

Ou use o comando combinado:

```bash
npm run build:start
```

Este comando faz o build e inicia o servidor automaticamente.

## Verificação

Após o build, você deve ver:
- ✅ Diretório `dist/` criado
- ✅ Arquivo `dist/index.html` existe
- ✅ Frontend funcionando em `http://seu-ip:3000`

## Desenvolvimento

Para desenvolvimento com hot-reload:

```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend (Vite)
npm run build -- --watch
```

Ou use o Vite dev server diretamente (porta 5173).

