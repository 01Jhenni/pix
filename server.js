// Importar primeiro para desabilitar SSL
import './init-ssl.js';

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pixRoutes from './routes/pix.js';
import userRoutes from './routes/users.js';
import transactionRoutes from './routes/transactions.js';
import { loadDatabase, initDatabase } from './database/db-loader.js';
import { seedDefaultUser } from './database/seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Inicializar banco de dados
await loadDatabase();
initDatabase();

// Criar usuário padrão se não existir
seedDefaultUser();

// Rotas da API
app.use('/api/pix', pixRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);

// Executar migrações
import { runMigrations } from './database/migrations.js';
runMigrations();

// Importar e usar rotas de perfis e API keys
import profileRoutes from './routes/profiles.js';
import apiKeyRoutes from './routes/api-keys.js';
import { publicRouter as pixPublicRoutes } from './routes/pix.js';

app.use('/api/profiles', profileRoutes);
app.use('/api/api-keys', apiKeyRoutes);

// Rotas públicas da API (com suporte a API keys) - para integração externa
app.use('/api/v1/pix', pixPublicRoutes);

// Rota para o frontend HTML
app.get('/', (req, res) => {
  const htmlIndex = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(htmlIndex)) {
    res.sendFile(htmlIndex);
  } else {
    res.json({
      message: 'API PIX Jornada 3',
      version: '1.0.0',
      docs: '/api',
      frontend: 'Frontend HTML disponível em /public/index.html'
    });
  }
});

// Catch-all para rotas não-API (servir index.html para SPA)
app.get('*', (req, res) => {
  // Se não for uma rota de API, servir o index.html
  if (!req.path.startsWith('/api')) {
    const htmlIndex = path.join(__dirname, 'public', 'index.html');
    if (fs.existsSync(htmlIndex)) {
      res.sendFile(htmlIndex);
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📱 Frontend disponível em http://localhost:${PORT}`);
  console.log(`🔌 API disponível em http://localhost:${PORT}/api`);
});

