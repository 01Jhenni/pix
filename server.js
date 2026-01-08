// Importar primeiro para desabilitar SSL
import './init-ssl.js';

// Carregar variáveis de ambiente
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
import { seedDefaultUser } from './database/seed.js';
import { seedAuthUser } from './database/seed-auth.js';
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
try {
  await loadDatabase();
  initDatabase();
  
  // Criar usuário admin de autenticação se não existir
  try {
    await seedAuthUser();
  } catch (authError) {
    // Não bloquear se der erro, apenas avisar
    console.warn('⚠️  Aviso ao criar usuário admin de autenticação:', authError.message);
  }
  
  // Criar usuário PIX padrão se não existir (com tratamento de erro separado)
  try {
    await seedDefaultUser();
  } catch (seedError) {
    const errorMsg = seedError.message || String(seedError);
    if (errorMsg.includes('Tabela') && errorMsg.includes('não encontrada')) {
      console.warn('');
      console.warn('⚠️  ═══════════════════════════════════════════════════════════');
      console.warn('   TABELAS NÃO ENCONTRADAS NO SUPABASE');
      console.warn('   ═══════════════════════════════════════════════════════════');
      console.warn('');
      console.warn('📋 PARA CRIAR AS TABELAS:');
      console.warn('');
      console.warn('   1. Acesse: https://supabase.com/dashboard');
      console.warn('   2. Selecione seu projeto');
      console.warn('   3. Vá em "SQL Editor" (ícone de banco de dados no menu)');
      console.warn('   4. Clique em "New query"');
      console.warn('   5. Abra o arquivo: database/supabase-schema.sql');
      console.warn('   6. Copie TODO o conteúdo do arquivo');
      console.warn('   7. Cole no SQL Editor do Supabase');
      console.warn('   8. Clique em "Run" ou pressione Ctrl+Enter');
      console.warn('   9. Aguarde a confirmação de sucesso');
      console.warn('');
      console.warn('   OU execute: npm run check:tables');
      console.warn('');
      console.warn('⚠️  O servidor continuará rodando, mas algumas funcionalidades');
      console.warn('   podem não funcionar até as tabelas serem criadas.');
      console.warn('   ═══════════════════════════════════════════════════════════');
      console.warn('');
    } else {
      console.warn('⚠️  Aviso ao criar usuário padrão:', errorMsg);
    }
  }
} catch (error) {
  const errorMsg = error.message || String(error);
  if (errorMsg.includes('Tabela') && errorMsg.includes('não encontrada')) {
    // Não bloquear se for apenas tabela não encontrada
    console.warn('⚠️  Tabelas não encontradas. Veja instruções acima.');
  } else {
    console.error('❌ Erro crítico ao inicializar banco de dados:', errorMsg);
    console.error('');
    console.error('📝 VERIFIQUE:');
    console.error('   1. As variáveis de ambiente SUPABASE_URL e SUPABASE_KEY estão configuradas?');
    console.error('   2. O arquivo .env existe com as credenciais corretas?');
    console.error('   3. A conexão com o Supabase está funcionando? (verifique firewall/rede)');
    console.error('');
    process.exit(1);
  }
}

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
const distPath = path.join(__dirname, 'dist');
const distIndexPath = path.join(__dirname, 'dist', 'index.html');
const publicPath = path.join(__dirname, 'public');
const publicIndexPath = path.join(__dirname, 'public', 'index.html');

// Verificar se dist existe e tem index.html
const distExists = fs.existsSync(distIndexPath);
const distDirExists = fs.existsSync(distPath);

// Debug: mostrar caminhos
if (process.env.NODE_ENV !== 'production') {
  console.log(`📂 __dirname: ${__dirname}`);
  console.log(`📂 distPath: ${distPath}`);
  console.log(`📂 distIndexPath: ${distIndexPath}`);
  console.log(`📂 distExists: ${distExists}`);
  console.log(`📂 distDirExists: ${distDirExists}`);
}

if (distExists) {
  // Servir arquivos estáticos do dist com headers para evitar cache
  app.use(express.static(distPath, { 
    index: 'index.html',
    extensions: ['html', 'js', 'css', 'json', 'png', 'jpg', 'svg'],
    setHeaders: (res, path) => {
      // Não cachear index.html
      if (path.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }
  }));
  console.log('✅ Frontend React encontrado em dist/');
} else if (fs.existsSync(publicPath)) {
  // Fallback: servir public se dist não existir
  app.use(express.static(publicPath, { 
    index: 'index.html'
  }));
  console.log('⚠️  Frontend não encontrado, usando página de fallback');
}

// Rota para o frontend - DEVE SER A ÚLTIMA ROTA
app.get('*', (req, res) => {
  // Se for uma rota de API, retornar 404
  if (req.path.startsWith('/api')) {
    res.status(404).json({ error: 'API endpoint not found' });
    return;
  }
  
  // Verificar dinamicamente se dist existe (pode ter sido criado após o servidor iniciar)
  const distExistsNow = fs.existsSync(distIndexPath);
  
  // Prioridade 1: dist/index.html (frontend construído)
  if (distExistsNow) {
    // Headers para evitar cache
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(distIndexPath);
    return;
  }
  
  // Prioridade 2: public/index.html (página de fallback)
  if (fs.existsSync(publicIndexPath)) {
    res.sendFile(publicIndexPath);
    return;
  }
  
  // Fallback final: JSON
  res.json({
    message: 'API PIX Jornada 3',
    version: '1.0.0',
    docs: '/api',
    frontend: 'Frontend React disponível após build',
    instructions: 'Execute: npm run build && npm start'
  });
});

// Verificar se o frontend foi construído (verificação dinâmica)
const checkFrontend = () => {
  return fs.existsSync(path.join(__dirname, 'dist', 'index.html'));
};

// Iniciar servidor
app.listen(PORT, () => {
  const distExists = checkFrontend();
  
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  
  if (distExists) {
    console.log(`📱 Frontend disponível em http://localhost:${PORT}`);
  } else {
    console.log('');
    console.log('⚠️  ═══════════════════════════════════════════════════════════');
    console.log('   FRONTEND NÃO FOI CONSTRUÍDO');
    console.log('   ═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('📋 PARA CONSTRUIR O FRONTEND:');
    console.log('');
    console.log('   Execute no servidor:');
    console.log('   npm install');
    console.log('   npm run build');
    console.log('   npm start');
    console.log('');
    console.log('   OU use: npm run build:start');
    console.log('');
    console.log('⚠️  O servidor continuará rodando, mas o frontend');
    console.log('   não estará disponível até o build ser executado.');
    console.log('   ═══════════════════════════════════════════════════════════');
    console.log('');
    console.log(`📱 Frontend: Execute 'npm run build' para construir`);
  }
  
  console.log(`🔌 API disponível em http://localhost:${PORT}/api`);
});

