import bcrypt from 'bcryptjs';
import { getDatabase } from '../database/db-loader.js';
import { loadDatabase, initDatabase } from '../database/db-loader.js';
import dotenv from 'dotenv';

dotenv.config();

async function createAdminUser() {
  try {
    await loadDatabase();
    initDatabase();
    
    const db = getDatabase();
    
    // Verificar se usuário já existe
    const existing = db.prepare(`
      SELECT id FROM auth_users WHERE email = ? OR username = ?
    `).get('admin@admin.com', 'admin');
    
    if (existing) {
      console.log('✅ Usuário admin já existe na tabela auth_users');
      return;
    }
    
    // Gerar hash da senha
    const password = '123456';
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Inserir usuário
    const result = db.prepare(`
      INSERT INTO auth_users (username, email, password_hash, name, role, active)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run('admin', 'admin@admin.com', passwordHash, 'Administrador', 'admin');
    
    console.log('✅ Usuário admin criado com sucesso!');
    console.log(`   Email: admin@admin.com`);
    console.log(`   Senha: 123456`);
    console.log(`   ID: ${result.lastInsertRowid}`);
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error.message);
    if (error.message.includes('Tabela') && error.message.includes('não encontrada')) {
      console.error('\n⚠️  Execute primeiro o arquivo database/supabase-schema.sql no Supabase SQL Editor');
    }
    process.exit(1);
  }
}

createAdminUser();

