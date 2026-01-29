import express from 'express';
import crypto from 'crypto';
import {
  getApiKeyByKey,
  listApiKeys,
  createApiKey,
  updateApiKeyLastUsed,
  deleteApiKey,
} from '../database/sqlite-db.js';
import { getPixUserById } from '../database/sqlite-db.js';

const router = express.Router();

/**
 * Middleware para autenticação por API Key
 */
export function authenticateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'] 
    || req.headers['X-API-Key']
    || (req.headers['authorization'] || req.headers['Authorization'])?.replace(/^Bearer\s+/i, '')
    || req.query.api_key;
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API Key não fornecida. Use o header X-API-Key ou Authorization: Bearer <key>'
    });
  }

  try {
    const keyData = getApiKeyByKey(apiKey);

    if (!keyData) {
      return res.status(401).json({
        success: false,
        error: 'API Key inválida ou inativa'
      });
    }

    // Atualizar último uso
    updateApiKeyLastUsed(keyData.id);

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

    const keys = listApiKeys(userId).map((k) => ({
      id: k.id,
      name: k.name,
      key: k.key,
      active: k.active,
      last_used: k.last_used,
      created_at: k.created_at,
    }));

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
    const user = getPixUserById(pixUserId);
    
    if (!user || !user.ativo) {
      return res.status(404).json({
        success: false,
        error: 'Usuário PIX não encontrado ou inativo'
      });
    }

    // Gerar API key
    const apiKey = 'pk_' + crypto.randomBytes(32).toString('hex');

    const keyData = createApiKey({
      pixUserId,
      name: name || `API Key ${new Date().toLocaleDateString('pt-BR')}`,
      key: apiKey,
    });

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
    
    const ok = deleteApiKey(id);
    
    if (!ok) {
      return res.status(404).json({
        success: false,
        error: 'API Key não encontrada'
      });
    }

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

