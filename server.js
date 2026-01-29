import './init-ssl.js';
import dotenv from 'dotenv';
dotenv.config();

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Função para criar admin automaticamente se não existir
async function ensureAdminExists() {
  try {
    const { getAuthUserByEmail, getAuthUserByUsername, createAuthUser } = await import('./database/sqlite-db.js');
    const bcrypt = (await import('bcryptjs')).default;
    
    const ADMIN_EMAIL = 'admin@admin.com';
    const ADMIN_USERNAME = 'admin';
    const ADMIN_PASSWORD = 'CeciM@042425';
    const ADMIN_NAME = 'Administrador';
    
    // Verificar se admin já existe
    const existingByEmail = getAuthUserByEmail(ADMIN_EMAIL);
    const existingByUsername = getAuthUserByUsername(ADMIN_USERNAME);
    
    if (!existingByEmail && !existingByUsername) {
      console.log('👤 Criando usuário admin padrão...');
      const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
      createAuthUser({
        username: ADMIN_USERNAME,
        email: ADMIN_EMAIL,
        password_hash: passwordHash,
        name: ADMIN_NAME,
        role: 'admin',
      });
      console.log('✅ Usuário admin criado: admin@admin.com');
    } else {
      console.log('✅ Usuário admin já existe');
    }
  } catch (error) {
    console.warn('⚠️  Não foi possível criar usuário admin automaticamente:', error.message);
  }
}

try {
  await loadDatabase();
  initDatabase();
  console.log('✅ Banco de dados local inicializado');
  
  // Criar admin se não existir
  await ensureAdminExists();
} catch (error) {
  console.error('❌ Erro ao inicializar banco de dados:', error.message);
  process.exit(1);
}

import profileRoutes from './routes/profiles.js';
import apiKeyRoutes from './routes/api-keys.js';
import { publicRouter as pixPublicRoutes } from './routes/pix.js';

app.use('/api/auth', authRoutes);
app.use('/api/pix', pixRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);

app.use('/api/profiles', profileRoutes);
app.use('/api/api-keys', apiKeyRoutes);

app.use('/api/v1/pix', pixPublicRoutes);

const publicPath = path.join(__dirname, 'public');
const publicIndexPath = path.join(__dirname, 'public', 'index.html');
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath, {
    index: 'index.html',
    maxAge: '1h' // Cache estático por 1 hora
  }));
  console.log('✅ Frontend estático encontrado em public/');
} else {
  console.warn('⚠️  Pasta public/ não encontrada. Apenas API estará disponível.');
}

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ error: 'API endpoint not found' });
    return;
  }
  if (fs.existsSync(publicIndexPath)) {
    res.sendFile('index.html', { root: publicPath });
    return;
  }
  res.json({ message: 'API PIX', version: '2.0.0' });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.0.0'
  });
});

const HOST = process.env.HOST || '0.0.0.0'; // Escutar em todas as interfaces para aceitar conexões externas

app.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor rodando em http://${HOST}:${PORT}`);
  console.log(`📱 Frontend disponível em http://${HOST}:${PORT}`);
  console.log(`🔌 API disponível em http://${HOST}:${PORT}/api`);
  console.log(`💚 Health check: http://${HOST}:${PORT}/health`);
  
  // Mostrar também URLs externas se HOST for 0.0.0.0
  if (HOST === '0.0.0.0') {
    const externalUrl = process.env.EXTERNAL_URL || `http://localhost:${PORT}`;
    console.log(`🌐 Acesse externamente: ${externalUrl}`);
  }
});

