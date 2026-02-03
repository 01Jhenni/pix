// Banco de dados SQLite local persistente
// Os dados são salvos em um arquivo .db e não são perdidos ao reiniciar

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho do banco de dados
const DB_PATH = path.join(__dirname, '..', 'data', 'pix.db');
const DB_DIR = path.dirname(DB_PATH);

// Garantir que o diretório existe
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Inicializar banco de dados
let db = null;

export function initDatabase() {
  try {
    // Criar conexão com o banco
    db = new Database(DB_PATH);
    
    // Habilitar foreign keys
    db.pragma('foreign_keys = ON');
    
    // Criar tabelas
    createTables();
    
    console.log(`✅ Banco de dados SQLite inicializado: ${DB_PATH}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados SQLite:', error);
    throw error;
  }
}

function createTables() {
  // Tabela de usuários PIX
  db.exec(`
    CREATE TABLE IF NOT EXISTS pix_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cnpj TEXT NOT NULL UNIQUE,
      nome TEXT NOT NULL,
      gw_app_key TEXT NOT NULL,
      basic_auth_base64 TEXT NOT NULL,
      base_url TEXT DEFAULT 'https://api-pix.bb.com.br/pix/v2',
      oauth_url TEXT DEFAULT 'https://oauth.bb.com.br/oauth/token',
      chave_pix_recebedor TEXT,
      nome_recebedor TEXT,
      cidade_recebedor TEXT,
      ativo INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Tabela de transações
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pix_user_id INTEGER NOT NULL,
      txid TEXT NOT NULL UNIQUE,
      id_rec TEXT,
      contrato TEXT,
      cpf_devedor TEXT,
      nome_devedor TEXT,
      valor_primeiro_pagamento TEXT,
      valor_recorrencia TEXT,
      data_inicial TEXT,
      periodicidade TEXT,
      politica_retentativa TEXT,
      status TEXT DEFAULT 'PENDENTE',
      jornada TEXT DEFAULT 'JORNADA_3',
      pix_copia_e_cola TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (pix_user_id) REFERENCES pix_users(id)
    )
  `);

  // Tabela de API Keys
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pix_user_id INTEGER NOT NULL,
      key TEXT NOT NULL UNIQUE,
      name TEXT,
      active INTEGER DEFAULT 1,
      last_used TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (pix_user_id) REFERENCES pix_users(id)
    )
  `);

  // Tabela de perfis de usuário (white label)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pix_user_id INTEGER NOT NULL UNIQUE,
      brand_name TEXT,
      brand_logo TEXT,
      primary_color TEXT DEFAULT '#667eea',
      secondary_color TEXT DEFAULT '#764ba2',
      success_color TEXT DEFAULT '#10b981',
      danger_color TEXT DEFAULT '#ef4444',
      warning_color TEXT DEFAULT '#f59e0b',
      info_color TEXT DEFAULT '#3b82f6',
      custom_css TEXT,
      custom_js TEXT,
      footer_text TEXT,
      header_text TEXT,
      favicon TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (pix_user_id) REFERENCES pix_users(id)
    )
  `);

  // Tabela de usuários de autenticação
  db.exec(`
    CREATE TABLE IF NOT EXISTS auth_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT,
      role TEXT DEFAULT 'admin',
      active INTEGER DEFAULT 1,
      last_login TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Tabela de sessões
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES auth_users(id)
    )
  `);

  // Criar índices para melhor performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_transactions_pix_user_id ON transactions(pix_user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_txid ON transactions(txid);
    CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
    CREATE INDEX IF NOT EXISTS idx_api_keys_pix_user_id ON api_keys(pix_user_id);
    CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);
    CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(active);
  `);

  console.log('✅ Tabelas criadas/verificadas com sucesso');
}

export function getDatabase() {
  if (!db) {
    throw new Error('Banco de dados não inicializado. Chame initDatabase() primeiro.');
  }
  return db;
}

// ==== PIX USERS ==========================================================

export function listPixUsers() {
  const stmt = db.prepare('SELECT * FROM pix_users WHERE ativo = 1 ORDER BY created_at DESC');
  return stmt.all();
}

export function getPixUserById(id) {
  const stmt = db.prepare('SELECT * FROM pix_users WHERE id = ? AND ativo = 1');
  return stmt.get(Number(id)) || null;
}

export function getPixUserByCnpj(cnpj) {
  const stmt = db.prepare('SELECT * FROM pix_users WHERE cnpj = ? AND ativo = 1');
  return stmt.get(cnpj) || null;
}

export function createPixUser(input) {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO pix_users (
      cnpj, nome, gw_app_key, basic_auth_base64, base_url, oauth_url,
      chave_pix_recebedor, nome_recebedor, cidade_recebedor, ativo, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `);
  
  const result = stmt.run(
    input.cnpj,
    input.nome,
    input.gw_app_key,
    input.basic_auth_base64,
    input.base_url || 'https://api-pix.bb.com.br/pix/v2',
    input.oauth_url || 'https://oauth.bb.com.br/oauth/token',
    input.chave_pix_recebedor || '',
    input.nome_recebedor || '',
    input.cidade_recebedor || '',
    now,
    now
  );

  const user = getPixUserById(result.lastInsertRowid);
  // Retornar visão pública (sem campos sensíveis)
  const { id, cnpj, nome, chave_pix_recebedor, nome_recebedor, cidade_recebedor, ativo, created_at, updated_at } = user;
  return { id, cnpj, nome, chave_pix_recebedor, nome_recebedor, cidade_recebedor, ativo, created_at, updated_at };
}

export function updatePixUser(id, updates) {
  const now = new Date().toISOString();
  const fields = [];
  const values = [];

  if (updates.nome !== undefined) {
    fields.push('nome = ?');
    values.push(updates.nome);
  }
  if (updates.gw_app_key !== undefined) {
    fields.push('gw_app_key = ?');
    values.push(updates.gw_app_key);
  }
  if (updates.basic_auth_base64 !== undefined) {
    fields.push('basic_auth_base64 = ?');
    values.push(updates.basic_auth_base64);
  }
  if (updates.chave_pix_recebedor !== undefined) {
    fields.push('chave_pix_recebedor = ?');
    values.push(updates.chave_pix_recebedor);
  }
  if (updates.nome_recebedor !== undefined) {
    fields.push('nome_recebedor = ?');
    values.push(updates.nome_recebedor);
  }
  if (updates.cidade_recebedor !== undefined) {
    fields.push('cidade_recebedor = ?');
    values.push(updates.cidade_recebedor);
  }
  if (updates.oauth_url !== undefined) {
    fields.push('oauth_url = ?');
    values.push(updates.oauth_url);
  }
  if (updates.base_url !== undefined) {
    fields.push('base_url = ?');
    values.push(updates.base_url);
  }

  fields.push('updated_at = ?');
  values.push(now);
  values.push(Number(id));

  if (fields.length === 1) return getPixUserById(id);

  const stmt = db.prepare(`UPDATE pix_users SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);
  return getPixUserById(id);
}

export function softDeletePixUser(id) {
  const now = new Date().toISOString();
  const stmt = db.prepare('UPDATE pix_users SET ativo = 0, updated_at = ? WHERE id = ?');
  stmt.run(now, Number(id));
  return true;
}

// ==== TRANSACTIONS ======================================================

export function createTransaction(input) {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO transactions (
      pix_user_id, txid, id_rec, contrato, cpf_devedor, nome_devedor,
      valor_primeiro_pagamento, valor_recorrencia, data_inicial, periodicidade,
      politica_retentativa, status, jornada, pix_copia_e_cola, metadata, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    Number(input.pix_user_id),
    input.txid,
    input.id_rec || null,
    input.contrato || '',
    input.cpf_devedor || '',
    input.nome_devedor || '',
    String(input.valor_primeiro_pagamento || '0'),
    String(input.valor_recorrencia || '0'),
    input.data_inicial || null,
    input.periodicidade || '',
    input.politica_retentativa || '',
    input.status || 'PENDENTE',
    input.jornada || 'JORNADA_3',
    input.pix_copia_e_cola || null,
    input.metadata ? JSON.stringify(input.metadata) : null,
    now,
    now
  );

  return result.lastInsertRowid;
}

export function updateTransactionByTxid(txid, updates) {
  const now = new Date().toISOString();
  const fields = [];
  const values = [];

  if (updates.status !== undefined) {
    fields.push('status = ?');
    values.push(updates.status);
  }
  if (updates.pix_copia_e_cola !== undefined) {
    fields.push('pix_copia_e_cola = ?');
    values.push(updates.pix_copia_e_cola);
  }
  if (updates.id_rec !== undefined) {
    fields.push('id_rec = ?');
    values.push(updates.id_rec);
  }
  if (updates.metadata !== undefined) {
    fields.push('metadata = ?');
    values.push(typeof updates.metadata === 'string' ? updates.metadata : JSON.stringify(updates.metadata));
  }

  fields.push('updated_at = ?');
  values.push(now);
  values.push(txid);

  if (fields.length === 1) return getTransactionByTxid(txid);

  const stmt = db.prepare(`UPDATE transactions SET ${fields.join(', ')} WHERE txid = ?`);
  stmt.run(...values);
  return getTransactionByTxid(txid);
}

export function listTransactions({ pixUserId, status, limit = 100, offset = 0 } = {}) {
  let query = 'SELECT * FROM transactions WHERE 1=1';
  const params = [];

  if (pixUserId) {
    query += ' AND pix_user_id = ?';
    params.push(Number(pixUserId));
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const stmt = db.prepare(query);
  const rows = stmt.all(...params);

  // Contar total
  let countQuery = 'SELECT COUNT(*) as total FROM transactions WHERE 1=1';
  const countParams = [];
  if (pixUserId) {
    countQuery += ' AND pix_user_id = ?';
    countParams.push(Number(pixUserId));
  }
  if (status) {
    countQuery += ' AND status = ?';
    countParams.push(status);
  }
  const countStmt = db.prepare(countQuery);
  const total = countStmt.get(...countParams).total;

  // Juntar com usuário PIX
  const withUser = rows.map((t) => {
    const user = getPixUserById(t.pix_user_id) || {};
    return {
      ...t,
      usuario_id: user.id,
      usuario_cnpj: user.cnpj,
      usuario_nome: user.nome,
    };
  });

  return { rows: withUser, total };
}

export function getTransactionById(id) {
  const stmt = db.prepare('SELECT * FROM transactions WHERE id = ?');
  const tx = stmt.get(Number(id));
  if (!tx) return null;
  const user = getPixUserById(tx.pix_user_id) || {};
  return {
    ...tx,
    usuario_id: user.id,
    usuario_cnpj: user.cnpj,
    usuario_nome: user.nome,
  };
}

export function getTransactionByTxid(txid) {
  const stmt = db.prepare('SELECT * FROM transactions WHERE txid = ?');
  const tx = stmt.get(txid);
  if (!tx) return null;
  const user = getPixUserById(tx.pix_user_id) || {};
  return {
    ...tx,
    usuario_id: user.id,
    usuario_cnpj: user.cnpj,
    usuario_nome: user.nome,
  };
}

export function getTransactionsStats({ pixUserId } = {}) {
  let query = 'SELECT COUNT(*) as total, SUM(CASE WHEN status = "ATIVA" THEN 1 ELSE 0 END) as ativas, SUM(CASE WHEN status = "PENDENTE" THEN 1 ELSE 0 END) as pendentes, SUM(CASE WHEN status IN ("REJEITADA", "CANCELADA", "EXPIRADA") THEN 1 ELSE 0 END) as canceladas, SUM(CAST(valor_recorrencia AS REAL)) as valor_total FROM transactions';
  const params = [];

  if (pixUserId) {
    query += ' WHERE pix_user_id = ?';
    params.push(Number(pixUserId));
  }

  const stmt = db.prepare(query);
  const result = stmt.get(...params);
  return {
    total: result.total || 0,
    ativas: result.ativas || 0,
    pendentes: result.pendentes || 0,
    canceladas: result.canceladas || 0,
    valor_total: result.valor_total || 0,
  };
}

// ==== API KEYS ==========================================================

export function listApiKeys(pixUserId) {
  const stmt = db.prepare('SELECT * FROM api_keys WHERE pix_user_id = ? ORDER BY created_at DESC');
  return stmt.all(Number(pixUserId));
}

export function getApiKeyByKey(key) {
  const stmt = db.prepare('SELECT * FROM api_keys WHERE key = ? AND active = 1');
  return stmt.get(key) || null;
}

export function createApiKey({ pixUserId, name, key }) {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO api_keys (pix_user_id, key, name, active, created_at, updated_at)
    VALUES (?, ?, ?, 1, ?, ?)
  `);
  const result = stmt.run(Number(pixUserId), key, name || `API Key ${new Date().toLocaleDateString('pt-BR')}`, now, now);
  return getApiKeyByKey(key);
}

export function updateApiKeyLastUsed(id) {
  const now = new Date().toISOString();
  const stmt = db.prepare('UPDATE api_keys SET last_used = ?, updated_at = ? WHERE id = ?');
  stmt.run(now, now, Number(id));
}

export function deleteApiKey(id) {
  const now = new Date().toISOString();
  const stmt = db.prepare('UPDATE api_keys SET active = 0, updated_at = ? WHERE id = ?');
  stmt.run(now, Number(id));
  return true;
}

// ==== USER PROFILES =====================================================

export function getUserProfile(pixUserId) {
  const stmt = db.prepare('SELECT * FROM user_profiles WHERE pix_user_id = ?');
  return stmt.get(Number(pixUserId)) || null;
}

export function createOrUpdateUserProfile(pixUserId, data) {
  const existing = getUserProfile(pixUserId);
  const now = new Date().toISOString();

  if (existing) {
    const stmt = db.prepare(`
      UPDATE user_profiles SET
        brand_name = ?, brand_logo = ?, primary_color = ?, secondary_color = ?,
        success_color = ?, danger_color = ?, warning_color = ?, info_color = ?,
        custom_css = ?, custom_js = ?, footer_text = ?, header_text = ?,
        favicon = ?, metadata = ?, updated_at = ?
      WHERE pix_user_id = ?
    `);
    stmt.run(
      data.brand_name || null,
      data.brand_logo || null,
      data.primary_color || '#667eea',
      data.secondary_color || '#764ba2',
      data.success_color || '#10b981',
      data.danger_color || '#ef4444',
      data.warning_color || '#f59e0b',
      data.info_color || '#3b82f6',
      data.custom_css || null,
      data.custom_js || null,
      data.footer_text || null,
      data.header_text || null,
      data.favicon || null,
      data.metadata ? JSON.stringify(data.metadata) : null,
      now,
      Number(pixUserId)
    );
    return getUserProfile(pixUserId);
  } else {
    const stmt = db.prepare(`
      INSERT INTO user_profiles (
        pix_user_id, brand_name, brand_logo, primary_color, secondary_color,
        success_color, danger_color, warning_color, info_color,
        custom_css, custom_js, footer_text, header_text, favicon, metadata, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      Number(pixUserId),
      data.brand_name || null,
      data.brand_logo || null,
      data.primary_color || '#667eea',
      data.secondary_color || '#764ba2',
      data.success_color || '#10b981',
      data.danger_color || '#ef4444',
      data.warning_color || '#f59e0b',
      data.info_color || '#3b82f6',
      data.custom_css || null,
      data.custom_js || null,
      data.footer_text || null,
      data.header_text || null,
      data.favicon || null,
      data.metadata ? JSON.stringify(data.metadata) : null,
      now,
      now
    );
    return getUserProfile(pixUserId);
  }
}

// ==== AUTH USERS & SESSIONS ============================================

export function getAuthUserByUsername(username) {
  const stmt = db.prepare('SELECT * FROM auth_users WHERE username = ? AND active = 1');
  return stmt.get(username) || null;
}

export function getAuthUserByEmail(email) {
  const stmt = db.prepare('SELECT * FROM auth_users WHERE email = ? AND active = 1');
  return stmt.get(email) || null;
}

export function getAuthUserByUsernameOrEmail(identifier) {
  const stmt = db.prepare('SELECT * FROM auth_users WHERE (username = ? OR email = ?) AND active = 1');
  return stmt.get(identifier, identifier) || null;
}

export function getAuthUserById(id) {
  const stmt = db.prepare('SELECT * FROM auth_users WHERE id = ? AND active = 1');
  return stmt.get(Number(id)) || null;
}

export function createAuthUser({ username, email, password_hash, name, role = 'admin' }) {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO auth_users (username, email, password_hash, name, role, active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?)
  `);
  const result = stmt.run(username, email, password_hash, name || username, role, now, now);
  return getAuthUserById(result.lastInsertRowid);
}

export function updateAuthUser(id, updates) {
  const now = new Date().toISOString();
  const fields = [];
  const values = [];

  if (updates.password_hash !== undefined) {
    fields.push('password_hash = ?');
    values.push(updates.password_hash);
  }
  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.email !== undefined) {
    fields.push('email = ?');
    values.push(updates.email);
  }

  fields.push('updated_at = ?');
  values.push(now);
  values.push(Number(id));

  if (fields.length === 1) return getAuthUserById(id);

  const stmt = db.prepare(`UPDATE auth_users SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);
  return getAuthUserById(id);
}

export function softDeleteAuthUser(id) {
  const now = new Date().toISOString();
  const stmt = db.prepare('UPDATE auth_users SET active = 0, updated_at = ? WHERE id = ?');
  stmt.run(now, Number(id));
  return true;
}

export function updateAuthUserLastLogin(id) {
  const now = new Date().toISOString();
  const stmt = db.prepare('UPDATE auth_users SET last_login = ?, updated_at = ? WHERE id = ?');
  stmt.run(now, now, Number(id));
}

export function createSession({ user_id, token, expires_at }) {
  const now = new Date().toISOString();
  const stmt = db.prepare('INSERT INTO sessions (user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?)');
  stmt.run(Number(user_id), token, expires_at, now);
}

export function getSessionByToken(token) {
  const stmt = db.prepare('SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")');
  return stmt.get(token) || null;
}

export function deleteSession(token) {
  const stmt = db.prepare('DELETE FROM sessions WHERE token = ?');
  stmt.run(token);
}

// Função para fechar o banco (útil para testes ou shutdown)
export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

