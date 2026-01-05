/**
 * Migrações do banco de dados
 * Adiciona suporte a perfis e API keys
 */

import { getDatabase } from './db-loader.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = path.join(__dirname, '..', 'pix_system.json');

export function runMigrations() {
  try {
    // Carregar banco atual
    let dbData = { pix_users: [], transactions: [] };
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf8');
      dbData = JSON.parse(data);
    }

    // Adicionar novas tabelas se não existirem
    if (!dbData.user_profiles) {
      dbData.user_profiles = [];
      console.log('✅ Tabela user_profiles criada');
    }

    if (!dbData.api_keys) {
      dbData.api_keys = [];
      console.log('✅ Tabela api_keys criada');
    }

    // Salvar banco atualizado
    fs.writeFileSync(DB_PATH, JSON.stringify(dbData, null, 2), 'utf8');
    console.log('✅ Migrações aplicadas com sucesso');
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao aplicar migrações:', error);
    return false;
  }
}

