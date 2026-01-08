import { getDatabase } from './db-loader.js';
import bcrypt from 'bcryptjs';

/**
 * Cria usuário admin de autenticação se não existir
 */
export async function seedAuthUser() {
  try {
    const db = getDatabase();
    
    // Verificar se usuário já existe
    const existing = db.prepare(`
      SELECT id FROM auth_users WHERE email = ? OR username = ?
    `).get('admin@admin.com', 'admin');
    
    if (existing) {
      console.log('✅ Usuário admin de autenticação já existe');
      return existing.id;
    }
    
    // Gerar hash da senha
    const password = '123456';
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Inserir usuário
    const result = db.prepare(`
      INSERT INTO auth_users (username, email, password_hash, name, role, active)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run('admin', 'admin@admin.com', passwordHash, 'Administrador', 'admin');
    
    console.log('✅ Usuário admin de autenticação criado com sucesso!');
    console.log(`   Email: admin@admin.com`);
    console.log(`   Senha: 123456`);
    console.log(`   ID: ${result.lastInsertRowid}`);
    
    return result.lastInsertRowid;
  } catch (error) {
    const errorMsg = error.message || String(error);
    if (errorMsg.includes('Tabela') && errorMsg.includes('não encontrada')) {
      console.warn('⚠️  Tabela auth_users não encontrada. Execute database/supabase-schema.sql no Supabase SQL Editor.');
      return null;
    }
    console.warn('⚠️  Não foi possível criar usuário admin de autenticação:', errorMsg);
    return null;
  }
}

