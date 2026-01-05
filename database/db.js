import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db;

export function initDatabase() {
  const dbPath = path.join(__dirname, '..', 'pix_system.db');
  db = new Database(dbPath);
  
  // Criar tabela de usuários PIX
  db.exec(`
    CREATE TABLE IF NOT EXISTS pix_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cnpj TEXT UNIQUE NOT NULL,
      nome TEXT NOT NULL,
      gw_app_key TEXT NOT NULL,
      basic_auth_base64 TEXT NOT NULL,
      base_url TEXT DEFAULT 'https://api-pix.bb.com.br/pix/v2',
      oauth_url TEXT DEFAULT 'https://oauth.bb.com.br/oauth/token',
      chave_pix_recebedor TEXT,
      nome_recebedor TEXT,
      cidade_recebedor TEXT,
      ativo INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Criar tabela de transações/recorrências
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pix_user_id INTEGER NOT NULL,
      txid TEXT NOT NULL,
      id_rec TEXT,
      contrato TEXT,
      cpf_devedor TEXT,
      nome_devedor TEXT,
      valor_primeiro_pagamento TEXT,
      valor_recorrencia TEXT,
      data_inicial TEXT,
      periodicidade TEXT,
      politica_retentativa TEXT,
      status TEXT,
      pix_copia_e_cola TEXT,
      qr_code_image TEXT,
      jornada TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pix_user_id) REFERENCES pix_users(id)
    )
  `);

  // Criar índices
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_transactions_pix_user ON transactions(pix_user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_txid ON transactions(txid);
    CREATE INDEX IF NOT EXISTS idx_transactions_id_rec ON transactions(id_rec);
  `);

  console.log('✅ Banco de dados inicializado');
  return db;
}

export function getDatabase() {
  if (!db) {
    initDatabase();
  }
  return db;
}

