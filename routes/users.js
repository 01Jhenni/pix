import express from 'express';
import {
  listPixUsers,
  getPixUserById,
  getPixUserByCnpj,
  createPixUser,
  updatePixUser,
  softDeletePixUser,
} from '../database/sqlite-db.js';

const router = express.Router();

/**
 * GET /api/users
 * Lista todos os usuários PIX
 */
router.get('/', (req, res) => {
  try {
    const users = listPixUsers();

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ 
      error: error.message || 'Erro ao listar usuários' 
    });
  }
});

/**
 * GET /api/users/:id
 * Obtém um usuário PIX específico (sem dados sensíveis)
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const user = getPixUserById(id);

    if (!user) {
      return res.status(404).json({ 
        error: 'Usuário não encontrado' 
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Erro ao obter usuário:', error);
    res.status(500).json({ 
      error: error.message || 'Erro ao obter usuário' 
    });
  }
});

/**
 * POST /api/users
 * Cria um novo usuário PIX
 */
router.post('/', (req, res) => {
  try {
    const {
      cnpj,
      nome,
      gw_app_key,
      basic_auth_base64,
      base_url = 'https://api-pix.bb.com.br/pix/v2',
      oauth_url = 'https://oauth.bb.com.br/oauth/token',
      chave_pix_recebedor,
      nome_recebedor,
      cidade_recebedor
    } = req.body;

    // Validações
    if (!cnpj || !nome || !gw_app_key || !basic_auth_base64) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: cnpj, nome, gw_app_key, basic_auth_base64' 
      });
    }

    // Verificar se CNPJ já existe
    const existing = getPixUserByCnpj(cnpj);
    if (existing) {
      return res.status(400).json({ 
        error: 'CNPJ já cadastrado' 
      });
    }

    const newUser = createPixUser({
      cnpj,
      nome,
      gw_app_key,
      basic_auth_base64,
      base_url,
      oauth_url,
      chave_pix_recebedor,
      nome_recebedor,
      cidade_recebedor,
    });

    res.status(201).json({
      success: true,
      message: 'Usuário PIX criado com sucesso',
      data: newUser
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ 
      error: error.message || 'Erro ao criar usuário' 
    });
  }
});

/**
 * PUT /api/users/:id
 * Atualiza um usuário PIX
 */
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome,
      gw_app_key,
      basic_auth_base64,
      base_url,
      oauth_url,
      chave_pix_recebedor,
      nome_recebedor,
      cidade_recebedor,
      ativo
    } = req.body;

    // Verificar se usuário existe
    const existing = getPixUserById(id);
    if (!existing) {
      return res.status(404).json({ 
        error: 'Usuário não encontrado' 
      });
    }

    // Construir query de atualização dinamicamente
    const updates = [];
    const values = [];

    if (nome !== undefined) {
      updates.push('nome = ?');
      values.push(nome);
    }
    if (gw_app_key !== undefined) {
      updates.push('gw_app_key = ?');
      values.push(gw_app_key);
    }
    if (basic_auth_base64 !== undefined) {
      updates.push('basic_auth_base64 = ?');
      values.push(basic_auth_base64);
    }
    if (base_url !== undefined) {
      updates.push('base_url = ?');
      values.push(base_url);
    }
    if (oauth_url !== undefined) {
      updates.push('oauth_url = ?');
      values.push(oauth_url);
    }
    if (chave_pix_recebedor !== undefined) {
      updates.push('chave_pix_recebedor = ?');
      values.push(chave_pix_recebedor);
    }
    if (nome_recebedor !== undefined) {
      updates.push('nome_recebedor = ?');
      values.push(nome_recebedor);
    }
    if (cidade_recebedor !== undefined) {
      updates.push('cidade_recebedor = ?');
      values.push(cidade_recebedor);
    }
    if (ativo !== undefined) {
      updates.push('ativo = ?');
      values.push(ativo);
    }

    if (updates.length === 0) {
      return res.status(400).json({ 
        error: 'Nenhum campo para atualizar' 
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const updatedUser = updatePixUser(id, Object.fromEntries(updates.map((u, idx) => [u.split(' = ')[0], values[idx]])));

    res.json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      data: updatedUser
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ 
      error: error.message || 'Erro ao atualizar usuário' 
    });
  }
});

/**
 * DELETE /api/users/:id
 * Remove um usuário PIX (soft delete)
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const ok = softDeletePixUser(id);

    if (!ok) {
      return res.status(404).json({ 
        error: 'Usuário não encontrado' 
      });
    }

    res.json({
      success: true,
      message: 'Usuário removido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover usuário:', error);
    res.status(500).json({ 
      error: error.message || 'Erro ao remover usuário' 
    });
  }
});

export default router;

