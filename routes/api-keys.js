import express from 'express';
import { getDatabase } from '../database/db-loader.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = path.join(__dirname, '..', 'pix_system.json');

const router = express.Router();

/**
 * Middleware para autenticação por API Key
 */
export function authenticateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '') || req.query.api_key;
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API Key não fornecida. Use o header X-API-Key ou Authorization: Bearer <key>'
    });
  }

  try {
    const db = getDatabase();
    const keyData = db.prepare(`
      SELECT * FROM api_keys WHERE key = ? AND active = 1
    `).get(apiKey);

    if (!keyData) {
      return res.status(401).json({
        success: false,
        error: 'API Key inválida ou inativa'
      });
    }

    // Atualizar último uso
    const dbData = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    const keyIndex = dbData.api_keys.findIndex(k => k.id === keyData.id);
    if (keyIndex >= 0) {
      dbData.api_keys[keyIndex].last_used = new Date().toISOString();
      fs.writeFileSync(DB_PATH, JSON.stringify(dbData, null, 2));
    }

    // Adicionar informações do usuário à requisição
    req.pixUserId = keyData.pix_user_id;
    req.apiKey = keyData;
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao autenticar API Key'
    });
  }
}

/**
 * GET /api/api-keys
 * Lista API keys de um usuário (requer autenticação ou userId na query)
 */
router.get('/', (req, res) => {
  try {
    const userId = req.query.userId || req.pixUserId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId é obrigatório'
      });
    }

    const db = getDatabase();
    const keys = db.prepare(`
      SELECT id, name, key, active, last_used, created_at
      FROM api_keys
      WHERE pix_user_id = ?
      ORDER BY created_at DESC
    `).all(userId);

    res.json({
      success: true,
      data: keys
    });
  } catch (error) {
    console.error('Erro ao listar API keys:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/api-keys
 * Cria nova API key
 */
router.post('/', (req, res) => {
  try {
    const { pixUserId, name } = req.body;

    if (!pixUserId) {
      return res.status(400).json({
        success: false,
        error: 'pixUserId é obrigatório'
      });
    }

    // Verificar se usuário existe
    const db = getDatabase();
    const userId = parseInt(pixUserId);
    
    // Acessar o banco diretamente através do objeto db interno
    // O getDatabase() retorna um objeto com métodos prepare(), mas também precisamos acessar os dados
    const dbData = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    const user = dbData.pix_users.find(u => u.id === userId && (u.ativo === 1 || u.ativo === true));
    
    if (!user) {
      console.error('Usuário não encontrado ou inativo:', {
        pixUserId,
        userId,
        usuarios: dbData.pix_users.map(u => ({ id: u.id, nome: u.nome, ativo: u.ativo }))
      });
      return res.status(404).json({
        success: false,
        error: 'Usuário PIX não encontrado ou inativo'
      });
    }

    // Gerar API key
    const apiKey = 'pk_' + crypto.randomBytes(32).toString('hex');

    // Usar db.prepare() para inserir (sincroniza automaticamente)
    const result = db.prepare(`
      INSERT INTO api_keys (pix_user_id, key, name, active, created_at, updated_at)
      VALUES (?, ?, ?, 1, ?, ?)
    `).run(
      parseInt(pixUserId),
      apiKey,
      name || `API Key ${new Date().toLocaleDateString('pt-BR')}`,
      new Date().toISOString(),
      new Date().toISOString()
    );

    const keyData = {
      id: result.lastInsertRowid,
      pix_user_id: parseInt(pixUserId),
      key: apiKey,
      name: name || `API Key ${new Date().toLocaleDateString('pt-BR')}`,
      active: 1,
      last_used: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'API Key criada com sucesso',
      data: {
        id: keyData.id,
        name: keyData.name,
        key: apiKey, // Mostrar apenas na criação
        active: keyData.active,
        created_at: keyData.created_at
      }
    });
  } catch (error) {
    console.error('Erro ao criar API key:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/api-keys/:id
 * Remove ou desativa API key
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    const keyData = db.prepare('SELECT * FROM api_keys WHERE id = ?').get(id);
    
    if (!keyData) {
      return res.status(404).json({
        success: false,
        error: 'API Key não encontrada'
      });
    }

    // Desativar ao invés de deletar usando db.prepare()
    db.prepare(`
      UPDATE api_keys SET active = 0, updated_at = ? WHERE id = ?
    `).run(
      new Date().toISOString(),
      parseInt(id)
    );

    res.json({
      success: true,
      message: 'API Key desativada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover API key:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

