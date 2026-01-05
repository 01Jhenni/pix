import express from 'express';
import { getDatabase } from '../database/db-loader.js';

const router = express.Router();

/**
 * GET /api/users
 * Lista todos os usuários PIX
 */
router.get('/', (req, res) => {
  try {
    const db = getDatabase();
    const users = db.prepare(`
      SELECT 
        id, cnpj, nome, chave_pix_recebedor, nome_recebedor,
        cidade_recebedor, ativo, created_at, updated_at
      FROM pix_users
      ORDER BY created_at DESC
    `).all();

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
    const db = getDatabase();
    const user = db.prepare(`
      SELECT 
        id, cnpj, nome, chave_pix_recebedor, nome_recebedor,
        cidade_recebedor, ativo, created_at, updated_at
      FROM pix_users
      WHERE id = ?
    `).get(id);

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

    const db = getDatabase();

    // Verificar se CNPJ já existe
    const existing = db.prepare('SELECT id FROM pix_users WHERE cnpj = ?').get(cnpj);
    if (existing) {
      return res.status(400).json({ 
        error: 'CNPJ já cadastrado' 
      });
    }

    // Inserir usuário
    const result = db.prepare(`
      INSERT INTO pix_users (
        cnpj, nome, gw_app_key, basic_auth_base64, base_url, oauth_url,
        chave_pix_recebedor, nome_recebedor, cidade_recebedor
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      cnpj, nome, gw_app_key, basic_auth_base64, base_url, oauth_url,
      chave_pix_recebedor, nome_recebedor, cidade_recebedor
    );

    const newUser = db.prepare(`
      SELECT 
        id, cnpj, nome, chave_pix_recebedor, nome_recebedor,
        cidade_recebedor, ativo, created_at, updated_at
      FROM pix_users
      WHERE id = ?
    `).get(result.lastInsertRowid);

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

    const db = getDatabase();

    // Verificar se usuário existe
    const existing = db.prepare('SELECT id FROM pix_users WHERE id = ?').get(id);
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

    db.prepare(`
      UPDATE pix_users 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...values);

    const updatedUser = db.prepare(`
      SELECT 
        id, cnpj, nome, chave_pix_recebedor, nome_recebedor,
        cidade_recebedor, ativo, created_at, updated_at
      FROM pix_users
      WHERE id = ?
    `).get(id);

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
    const db = getDatabase();

    const result = db.prepare('UPDATE pix_users SET ativo = 0 WHERE id = ?').run(id);

    if (result.changes === 0) {
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

