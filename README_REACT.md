# 🚀 Frontend React - PIX Jornada 3

## 🎨 Design

- **Tema Vermelho** - Design moderno inspirado no 21set dev
- **Dark Mode** - Interface escura com acentos vermelhos
- **Componentes Modernos** - Lucide React icons
- **Responsivo** - Funciona em desktop e mobile

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Instalar Tailwind CSS (se necessário)
npm install -D tailwindcss postcss autoprefixer
```

## 🏃 Executar

### Desenvolvimento

**Terminal 1 - Backend:**
```bash
npm start
# ou
npm run dev
```

**Terminal 2 - Frontend React:**
```bash
npm run dev:react
```

O frontend React estará disponível em: `http://localhost:5173`

### Produção

```bash
# Build do React
npm run build

# O build será gerado em public/
# O servidor Express já serve os arquivos estáticos
npm start
```

## 🎯 Funcionalidades

- ✅ Dashboard com estatísticas
- ✅ Criar recorrências PIX
- ✅ Gerenciar usuários PIX
- ✅ Visualizar transações
- ✅ Configurar White Label
- ✅ Gerenciar API Keys
- ✅ QR Code e PIX Copia e Cola

## 🎨 Tema Vermelho

O sistema usa um tema vermelho moderno com:
- Cor primária: `#dc2626` (vermelho)
- Cor secundária: `#991b1b` (vermelho escuro)
- Background: Gradiente escuro (slate-900)
- Acentos: Vermelho com transparências

## 📁 Estrutura

```
src/
├── components/     # Componentes reutilizáveis
│   ├── Layout.jsx
│   ├── Card.jsx
│   ├── Button.jsx
│   ├── Input.jsx
│   └── Toast.jsx
├── pages/         # Páginas principais
│   ├── Dashboard.jsx
│   ├── CreateRecurrence.jsx
│   ├── Users.jsx
│   ├── Transactions.jsx
│   ├── WhiteLabel.jsx
│   └── ApiKeys.jsx
├── services/      # Serviços (API)
│   └── api.js
├── App.jsx        # Componente principal
├── main.jsx       # Entry point
└── index.css      # Estilos globais
```

## 🔧 Configuração

O Vite está configurado para:
- Proxy `/api` para `http://localhost:3000`
- Build em `public/`
- HMR (Hot Module Replacement) ativo

## 🎨 Personalização

O tema pode ser personalizado em:
- `src/index.css` - Variáveis CSS
- `tailwind.config.js` - Configuração do Tailwind
- White Label - Por usuário via interface

