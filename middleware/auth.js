import jwt from 'jsonwebtoken';
import { getDatabase } from '../database/db-loader.js';

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-super-segura-aqui-mude-em-producao';

export function authenticate(req, res, next) {
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
      SELECT id, username, email, name, role, active
      FROM auth_users WHERE id = ? AND active = 1
    `).get(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não encontrado ou inativo'
      });
    }

    // Adicionar usuário ao request
    req.user = user;
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    res.status(401).json({
      success: false,
      error: 'Token inválido'
    });
  }
}

