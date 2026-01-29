#!/usr/bin/env node

/**
 * Script para criar usuário admin
 * Uso: node scripts/create-admin.js
 */

import bcrypt from 'bcryptjs';
import { initDatabase, createAuthUser, getAuthUserByEmail, getAuthUserByUsername } from '../database/sqlite-db.js';
import { loadDatabase } from '../database/db-loader.js';

const ADMIN_EMAIL = 'admin@admin.com';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'CeciM@042425';
const ADMIN_NAME = 'Administrador';

async function createAdmin() {
  try {
    console.log('🔄 Inicializando banco de dados...');
    await loadDatabase();
    initDatabase();
    console.log('✅ Banco de dados inicializado');

    // Verificar se usuário já existe
    const existingByEmail = getAuthUserByEmail(ADMIN_EMAIL);
    const existingByUsername = getAuthUserByUsername(ADMIN_USERNAME);

    if (existingByEmail || existingByUsername) {
      console.log('⚠️  Usuário admin já existe!');
      console.log('   Email:', ADMIN_EMAIL);
      console.log('   Username:', ADMIN_USERNAME);
      console.log('\n💡 Para alterar a senha, delete o usuário e execute este script novamente.');
      process.exit(0);
    }

    // Gerar hash da senha
    console.log('🔐 Gerando hash da senha...');
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    // Criar usuário admin
    console.log('👤 Criando usuário admin...');
    const admin = createAuthUser({
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      password_hash: passwordHash,
      name: ADMIN_NAME,
      role: 'admin',
    });

    if (admin) {
      console.log('\n✅ Usuário admin criado com sucesso!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 Email:', ADMIN_EMAIL);
      console.log('👤 Username:', ADMIN_USERNAME);
      console.log('🔑 Senha:', ADMIN_PASSWORD);
      console.log('👑 Role: admin');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n💡 Agora você pode fazer login no sistema!');
    } else {
      throw new Error('Falha ao criar usuário admin');
    }
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error);
    process.exit(1);
  }
}

createAdmin();

