import jwt from 'jsonwebtoken';
import { getSessionByToken, getAuthUserById } from '../database/sqlite-db.js';

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

    // Verificar sessão
    const session = getSessionByToken(token);

    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Sessão expirada'
      });
    }

    // Buscar usuário
    const user = getAuthUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não encontrado ou inativo'
      });
    }

    // Adicionar usuário ao request
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      active: user.active,
    };
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    res.status(401).json({
      success: false,
      error: 'Token inválido'
    });
  }
}

