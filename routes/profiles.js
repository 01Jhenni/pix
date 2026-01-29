import express from 'express';
import { getUserProfile, createOrUpdateUserProfile } from '../database/sqlite-db.js';

const router = express.Router();

/**
 * GET /api/profiles/:userId
 * Obtém perfil white label de um usuário
 */
router.get('/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    
    const profile = getUserProfile(userId);
    
    // Perfil padrão se não existir
    const defaultProfile = {
      pix_user_id: parseInt(userId),
      brand_name: null,
      brand_logo: null,
      primary_color: '#667eea',
      secondary_color: '#764ba2',
      success_color: '#10b981',
      danger_color: '#ef4444',
      warning_color: '#f59e0b',
      info_color: '#3b82f6',
      custom_css: null,
      custom_js: null,
      footer_text: null,
      header_text: null,
      favicon: null,
      metadata: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: profile || defaultProfile
    });
  } catch (error) {
    console.error('Erro ao obter perfil:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/profiles/:userId
 * Atualiza ou cria perfil white label
 */
router.put('/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    
    const {
      brand_name,
      brand_logo,
      primary_color,
      secondary_color,
      success_color,
      danger_color,
      warning_color,
      info_color,
      custom_css,
      custom_js,
      footer_text,
      header_text,
      favicon,
      metadata
    } = req.body;
    
    const existing = getUserProfile(userId);
    const profile = createOrUpdateUserProfile(userId, {
      brand_name,
      brand_logo,
      primary_color,
      secondary_color,
      success_color,
      danger_color,
      warning_color,
      info_color,
      custom_css,
      custom_js,
      footer_text,
      header_text,
      favicon,
      metadata,
    });
    
    res.json({
      success: true,
      message: existing ? 'Perfil atualizado com sucesso' : 'Perfil criado com sucesso',
      data: profile
    });
  } catch (error) {
    console.error('Erro ao salvar perfil:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

