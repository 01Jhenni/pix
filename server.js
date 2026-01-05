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
import authRoutes from './routes/auth.js';
import { loadDatabase, initDatabase } from './database/db-loader.js';
import { seedDefaultUser } from './database/seed.js';
import { authenticate } from './middleware/auth.js';

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

// Rotas públicas
app.use('/api/auth', authRoutes);

// Rotas protegidas (requerem autenticação)
app.use('/api/pix', authenticate, pixRoutes);
app.use('/api/users', authenticate, userRoutes);
app.use('/api/transactions', authenticate, transactionRoutes);

// Migrações não são mais necessárias com Supabase (tabelas criadas via SQL)

// Importar e usar rotas de perfis e API keys
import profileRoutes from './routes/profiles.js';
import apiKeyRoutes from './routes/api-keys.js';
import { publicRouter as pixPublicRoutes } from './routes/pix.js';

app.use('/api/profiles', authenticate, profileRoutes);
app.use('/api/api-keys', authenticate, apiKeyRoutes);

// Rotas públicas da API (com suporte a API keys) - para integração externa
app.use('/api/v1/pix', pixPublicRoutes);

// Servir frontend React (Vite)
app.use(express.static(path.join(__dirname, 'dist')));

// Rota para o frontend
app.get('*', (req, res) => {
  // Se não for uma rota de API, servir o index.html do React
  if (!req.path.startsWith('/api')) {
    const htmlIndex = path.join(__dirname, 'dist', 'index.html');
    if (fs.existsSync(htmlIndex)) {
      res.sendFile(htmlIndex);
    } else {
      // Fallback para public/index.html se dist não existir
      const publicIndex = path.join(__dirname, 'public', 'index.html');
      if (fs.existsSync(publicIndex)) {
        res.sendFile(publicIndex);
      } else {
        res.json({
          message: 'API PIX Jornada 3',
          version: '1.0.0',
          docs: '/api',
          frontend: 'Frontend React disponível após build'
        });
      }
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

