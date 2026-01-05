import express from 'express';
import { getDatabase } from '../database/db-loader.js';

const router = express.Router();

/**
 * GET /api/profiles/:userId
 * Obtém perfil white label de um usuário
 */
router.get('/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const db = getDatabase();
    
    // Buscar perfil existente ou retornar padrão
    const profiles = db.prepare(`
      SELECT * FROM user_profiles WHERE pix_user_id = ?
    `).all(userId);
    
    const profile = profiles.length > 0 ? profiles[0] : null;
    
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
    const db = getDatabase();
    
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
    
    // Verificar se perfil existe
    const existing = db.prepare(`
      SELECT id FROM user_profiles WHERE pix_user_id = ?
    `).get(userId);
    
    if (existing) {
      // Atualizar
      const profile = {
        id: existing.id,
        pix_user_id: parseInt(userId),
        brand_name: brand_name || null,
        brand_logo: brand_logo || null,
        primary_color: primary_color || '#667eea',
        secondary_color: secondary_color || '#764ba2',
        success_color: success_color || '#10b981',
        danger_color: danger_color || '#ef4444',
        warning_color: warning_color || '#f59e0b',
        info_color: info_color || '#3b82f6',
        custom_css: custom_css || null,
        custom_js: custom_js || null,
        footer_text: footer_text || null,
        header_text: header_text || null,
        favicon: favicon || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        updated_at: new Date().toISOString()
      };
      
      // Atualizar usando Supabase
      db.prepare(`
        UPDATE user_profiles SET
          brand_name = ?, brand_logo = ?, primary_color = ?, secondary_color = ?,
          success_color = ?, danger_color = ?, warning_color = ?, info_color = ?,
          custom_css = ?, custom_js = ?, footer_text = ?, header_text = ?,
          favicon = ?, metadata = ?, updated_at = ?
        WHERE id = ?
      `).run(
        profile.brand_name, profile.brand_logo, profile.primary_color, profile.secondary_color,
        profile.success_color, profile.danger_color, profile.warning_color, profile.info_color,
        profile.custom_css, profile.custom_js, profile.footer_text, profile.header_text,
        profile.favicon, profile.metadata, profile.updated_at, existing.id
      );
      
      res.json({
        success: true,
        message: 'Perfil atualizado com sucesso',
        data: profile
      });
    } else {
      // Criar novo usando Supabase
      const result = db.prepare(`
        INSERT INTO user_profiles (
          pix_user_id, brand_name, brand_logo, primary_color, secondary_color,
          success_color, danger_color, warning_color, info_color,
          custom_css, custom_js, footer_text, header_text, favicon, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        parseInt(userId), brand_name || null, brand_logo || null,
        primary_color || '#667eea', secondary_color || '#764ba2',
        success_color || '#10b981', danger_color || '#ef4444',
        warning_color || '#f59e0b', info_color || '#3b82f6',
        custom_css || null, custom_js || null, footer_text || null,
        header_text || null, favicon || null,
        metadata ? JSON.stringify(metadata) : null
      );
      
      const profile = {
        id: result.lastInsertRowid,
        pix_user_id: parseInt(userId),
        brand_name: brand_name || null,
        brand_logo: brand_logo || null,
        primary_color: primary_color || '#667eea',
        secondary_color: secondary_color || '#764ba2',
        success_color: success_color || '#10b981',
        danger_color: danger_color || '#ef4444',
        warning_color: warning_color || '#f59e0b',
        info_color: info_color || '#3b82f6',
        custom_css: custom_css || null,
        custom_js: custom_js || null,
        footer_text: footer_text || null,
        header_text: header_text || null,
        favicon: favicon || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      res.json({
        success: true,
        message: 'Perfil criado com sucesso',
        data: profile
      });
    }
  } catch (error) {
    console.error('Erro ao salvar perfil:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

