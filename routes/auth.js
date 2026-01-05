import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../database/db-loader.js';
import crypto from 'crypto';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-super-segura-aqui-mude-em-producao';

// Helper para gerar token
function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

// Helper para gerar hash de senha
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

// Helper para verificar senha
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * POST /api/auth/login
 * Login do usuário
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username e senha são obrigatórios'
      });
    }

    const db = getDatabase();
    
    // Buscar usuário por username
    let user = db.prepare(`
      SELECT * FROM auth_users 
      WHERE username = ? AND active = 1
    `).get(username);
    
    // Se não encontrou, buscar por email
    if (!user) {
      user = db.prepare(`
        SELECT * FROM auth_users 
        WHERE email = ? AND active = 1
      `).get(username);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas'
      });
    }

    // Verificar senha
    const isValid = await verifyPassword(password, user.password_hash);
    
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas'
      });
    }

    // Gerar token
    const token = generateToken(user.id);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

    // Salvar sessão
    db.prepare(`
      INSERT INTO sessions (user_id, token, expires_at)
      VALUES (?, ?, ?)
    `).run(user.id, token, expiresAt.toISOString());

    // Atualizar último login
    db.prepare(`
      UPDATE auth_users SET last_login = ? WHERE id = ?
    `).run(new Date().toISOString(), user.id);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao fazer login'
    });
  }
});

/**
 * POST /api/auth/register
 * Registrar novo usuário (apenas admin)
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, name, role = 'admin' } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username, email e senha são obrigatórios'
      });
    }

    const db = getDatabase();
    
    // Verificar se usuário já existe
    const existing = db.prepare(`
      SELECT id FROM auth_users WHERE username = ? OR email = ?
    `).get(username, email);

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Username ou email já cadastrado'
      });
    }

    // Hash da senha
    const passwordHash = await hashPassword(password);

    // Criar usuário
    const result = db.prepare(`
      INSERT INTO auth_users (username, email, password_hash, name, role, active)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(username, email, passwordHash, name || username, role);

    res.json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        username,
        email,
        name: name || username,
        role
      }
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao registrar usuário'
    });
  }
});

/**
 * GET /api/auth/me
 * Obter informações do usuário logado
 */
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token não fornecido'
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = getDatabase();

    // Verificar sessão
    const session = db.prepare(`
      SELECT * FROM sessions 
      WHERE token = ? AND expires_at > ?
    `).get(token, new Date().toISOString());

    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Sessão expirada'
      });
    }

    // Buscar usuário
    const user = db.prepare(`
      SELECT id, username, email, name, role, active, last_login, created_at
      FROM auth_users WHERE id = ?
    `).get(decoded.userId);

    if (!user || !user.active) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não encontrado ou inativo'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    res.status(401).json({
      success: false,
      error: 'Token inválido'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout do usuário
 */
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      const db = getDatabase();
      db.prepare(`
        DELETE FROM sessions WHERE token = ?
      `).run(token);
    }

    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao fazer logout'
    });
  }
});

export default router;

