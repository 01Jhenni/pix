import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = path.join(__dirname, '..', 'pix_system.json');

let db = {
  pix_users: [],
  transactions: [],
  user_profiles: [],  // Perfis white label por usuário
  api_keys: []        // API keys para integração
};

export function initDatabase() {
  // Carregar banco se existir
  if (fs.existsSync(DB_PATH)) {
    try {
      const data = fs.readFileSync(DB_PATH, 'utf8');
      db = JSON.parse(data);
      // Garantir que novas tabelas existam
      if (!db.user_profiles) db.user_profiles = [];
      if (!db.api_keys) db.api_keys = [];
    } catch (error) {
      console.error('Erro ao carregar banco:', error);
      db = { pix_users: [], transactions: [], user_profiles: [], api_keys: [] };
    }
  } else {
    // Criar banco vazio com todas as tabelas
    db = { pix_users: [], transactions: [], user_profiles: [], api_keys: [] };
    saveDatabase();
  }
  
  console.log('✅ Banco de dados JSON inicializado');
  return db;
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  } catch (error) {
    console.error('Erro ao salvar banco:', error);
  }
}

export function getDatabase() {
  if (!db.pix_users) {
    initDatabase();
  }
  return {
    prepare: (query) => {
      return {
        get: (...params) => {
          // Simular SELECT ... WHERE id = ? AND ativo = 1
          if (query.includes('SELECT') && query.includes('FROM pix_users') && query.includes('WHERE id = ?') && !query.includes('JOIN')) {
            const id = params[0];
            const user = db.pix_users.find(u => u.id === parseInt(id));
            
            // Se tem AND ativo = 1, verificar também
            if (query.includes('AND ativo = 1') || query.includes('ativo = 1')) {
              if (user && (user.ativo === 1 || user.ativo === true)) {
                // Se é SELECT id, retornar só o id
                if (query.includes('SELECT id') && !query.includes('SELECT *')) {
                  return { id: user.id };
                }
                return user;
              }
              return null;
            }
            
            return user || null;
          }
          if (query.includes('SELECT') && query.includes('FROM transactions')) {
            if (query.includes('WHERE t.id = ?')) {
              const id = params[0];
              const transaction = db.transactions.find(t => t.id === id);
              if (transaction && query.includes('JOIN pix_users')) {
                const user = db.pix_users.find(u => u.id === transaction.pix_user_id);
                return {
                  ...transaction,
                  usuario_id: user?.id,
                  usuario_cnpj: user?.cnpj,
                  usuario_nome: user?.nome
                };
              }
              return transaction || null;
            }
            if (query.includes('WHERE t.txid = ?')) {
              const txid = params[0];
              const transaction = db.transactions.find(t => t.txid === txid);
              if (transaction && query.includes('JOIN pix_users')) {
                const user = db.pix_users.find(u => u.id === transaction.pix_user_id);
                return {
                  ...transaction,
                  usuario_id: user?.id,
                  usuario_cnpj: user?.cnpj,
                  usuario_nome: user?.nome
                };
              }
              return transaction || null;
            }
          }
          if (query.includes('SELECT') && query.includes('FROM pix_users') && query.includes('WHERE cnpj = ?')) {
            const cnpj = params[0];
            return db.pix_users.find(u => u.cnpj === cnpj) || null;
          }
          // Suporte para user_profiles
          if (query.includes('SELECT') && query.includes('FROM user_profiles')) {
            if (query.includes('WHERE pix_user_id = ?')) {
              const userId = params[0];
              return (db.user_profiles || []).find(p => p.pix_user_id === parseInt(userId)) || null;
            }
            if (query.includes('WHERE id = ?')) {
              const id = params[0];
              return (db.user_profiles || []).find(p => p.id === parseInt(id)) || null;
            }
          }
          // Suporte para api_keys
          if (query.includes('SELECT') && query.includes('FROM api_keys')) {
            if (query.includes('WHERE key = ?')) {
              const key = params[0];
              return (db.api_keys || []).find(k => k.key === key) || null;
            }
            if (query.includes('WHERE pix_user_id = ?')) {
              const userId = params[0];
              return (db.api_keys || []).filter(k => k.pix_user_id === parseInt(userId));
            }
            if (query.includes('WHERE id = ?')) {
              const id = params[0];
              return (db.api_keys || []).find(k => k.id === parseInt(id)) || null;
            }
          }
          if (query.includes('COUNT(*)')) {
            // Contagem simples - precisa aplicar filtros também
            let count = db.transactions.length;
            if (query.includes('WHERE t.pix_user_id = ?')) {
              const userId = params[0];
              count = db.transactions.filter(t => t.pix_user_id === userId).length;
            }
            if (query.includes('AND t.status = ?')) {
              const status = params[params.length - 1];
              const userId = query.includes('WHERE t.pix_user_id = ?') ? params[0] : null;
              let filtered = db.transactions;
              if (userId) {
                filtered = filtered.filter(t => t.pix_user_id === userId);
              }
              count = filtered.filter(t => t.status === status).length;
            }
            return { total: count };
          }
          return null;
        },
        all: (...params) => {
          // Simular SELECT * FROM ...
          if (query.includes('FROM pix_users') && !query.includes('JOIN')) {
            let users = [...db.pix_users];
            // Aplicar filtros básicos
            if (query.includes('WHERE ativo = 1')) {
              users = users.filter(u => u.ativo === 1);
            }
            if (query.includes('ORDER BY created_at DESC')) {
              users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            }
            return users;
          }
          if (query.includes('FROM transactions')) {
            let transactions = [...db.transactions];
            
            // Se tem JOIN, fazer join com pix_users
            if (query.includes('JOIN pix_users')) {
              transactions = transactions.map(t => {
                const user = db.pix_users.find(u => u.id === t.pix_user_id);
                return {
                  ...t,
                  usuario_id: user?.id,
                  usuario_cnpj: user?.cnpj,
                  usuario_nome: user?.nome
                };
              });
            }
            
            // Aplicar filtros
            let paramIndex = 0;
            if (query.includes('WHERE t.pix_user_id = ?') || query.includes('WHERE 1=1') && query.includes('AND t.pix_user_id = ?')) {
              const userId = params[paramIndex];
              paramIndex++;
              transactions = transactions.filter(t => t.pix_user_id === userId);
            }
            if (query.includes('AND t.status = ?')) {
              const status = params[paramIndex];
              paramIndex++;
              transactions = transactions.filter(t => t.status === status);
            }
            if (query.includes('ORDER BY t.created_at DESC')) {
              transactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            }
            if (query.includes('LIMIT ?')) {
              const limit = params[params.length - 2];
              const offset = params[params.length - 1] || 0;
              transactions = transactions.slice(offset, offset + limit);
            }
            return transactions;
          }
          // Suporte para user_profiles
          if (query.includes('FROM user_profiles')) {
            return db.user_profiles || [];
          }
          // Suporte para api_keys
          if (query.includes('FROM api_keys')) {
            let keys = [...(db.api_keys || [])];
            if (query.includes('WHERE pix_user_id = ?')) {
              const userId = params[0];
              keys = keys.filter(k => k.pix_user_id === parseInt(userId));
            }
            if (query.includes('ORDER BY created_at DESC')) {
              keys.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            }
            return keys;
          }
          return [];
        },
        run: (...params) => {
          // Simular INSERT
          if (query.includes('INSERT INTO pix_users')) {
            const newId = db.pix_users.length > 0 
              ? Math.max(...db.pix_users.map(u => u.id)) + 1 
              : 1;
            const user = {
              id: newId,
              cnpj: params[0],
              nome: params[1],
              gw_app_key: params[2],
              basic_auth_base64: params[3],
              base_url: params[4] || 'https://api-pix.bb.com.br/pix/v2',
              oauth_url: params[5] || 'https://oauth.bb.com.br/oauth/token',
              chave_pix_recebedor: params[6] || null,
              nome_recebedor: params[7] || null,
              cidade_recebedor: params[8] || null,
              ativo: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            db.pix_users.push(user);
            saveDatabase();
            return { lastInsertRowid: newId, changes: 1 };
          }
          if (query.includes('INSERT INTO transactions')) {
            const newId = db.transactions.length > 0 
              ? Math.max(...db.transactions.map(t => t.id)) + 1 
              : 1;
            const transaction = {
              id: newId,
              pix_user_id: params[0],
              txid: params[1],
              id_rec: params[2] || null,
              contrato: params[3] || null,
              cpf_devedor: params[4] || null,
              nome_devedor: params[5] || null,
              valor_primeiro_pagamento: params[6] || null,
              valor_recorrencia: params[7] || null,
              data_inicial: params[8] || null,
              periodicidade: params[9] || null,
              politica_retentativa: params[10] || null,
              status: params[11] || 'PENDENTE',
              pix_copia_e_cola: null,
              qr_code_image: null,
              jornada: null,
              metadata: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            db.transactions.push(transaction);
            saveDatabase();
            return { lastInsertRowid: newId, changes: 1 };
          }
          // INSERT INTO user_profiles
          if (query.includes('INSERT INTO user_profiles')) {
            const newId = (db.user_profiles || []).length > 0 
              ? Math.max(...db.user_profiles.map(p => p.id)) + 1 
              : 1;
            const profile = {
              id: newId,
              pix_user_id: params[0],
              brand_name: params[1] || null,
              brand_logo: params[2] || null,
              primary_color: params[3] || '#667eea',
              secondary_color: params[4] || '#764ba2',
              success_color: params[5] || '#10b981',
              danger_color: params[6] || '#ef4444',
              warning_color: params[7] || '#f59e0b',
              info_color: params[8] || '#3b82f6',
              custom_css: params[9] || null,
              custom_js: params[10] || null,
              footer_text: params[11] || null,
              header_text: params[12] || null,
              favicon: params[13] || null,
              metadata: params[14] || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            if (!db.user_profiles) db.user_profiles = [];
            db.user_profiles.push(profile);
            saveDatabase();
            return { lastInsertRowid: newId, changes: 1 };
          }
          // INSERT INTO api_keys
          if (query.includes('INSERT INTO api_keys')) {
            const newId = (db.api_keys || []).length > 0 
              ? Math.max(...db.api_keys.map(k => k.id)) + 1 
              : 1;
            const apiKey = {
              id: newId,
              pix_user_id: params[0],
              key: params[1],
              name: params[2] || null,
              active: params[3] !== undefined ? params[3] : 1,
              last_used: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            if (!db.api_keys) db.api_keys = [];
            db.api_keys.push(apiKey);
            saveDatabase();
            return { lastInsertRowid: newId, changes: 1 };
          }
          // Simular UPDATE
          if (query.includes('UPDATE pix_users')) {
            const id = params[params.length - 1];
            const userIndex = db.pix_users.findIndex(u => u.id === id);
            if (userIndex >= 0) {
              if (query.includes('SET ativo = 0')) {
                db.pix_users[userIndex].ativo = 0;
                db.pix_users[userIndex].updated_at = new Date().toISOString();
                saveDatabase();
                return { changes: 1 };
              }
              // UPDATE com múltiplos campos
              const updates = query.match(/SET (.+?) WHERE/);
              if (updates) {
                const fields = updates[1].split(',').map(f => f.trim());
                fields.forEach((field, index) => {
                  if (field.includes('=') && field.includes('?')) {
                    const fieldName = field.split('=')[0].trim();
                    if (fieldName !== 'updated_at') {
                      db.pix_users[userIndex][fieldName] = params[index];
                    }
                  }
                });
                db.pix_users[userIndex].updated_at = new Date().toISOString();
                saveDatabase();
                return { changes: 1 };
              }
            }
            return { changes: 0 };
          }
          if (query.includes('UPDATE transactions')) {
            const id = params[params.length - 1];
            const transIndex = db.transactions.findIndex(t => t.id === id);
            if (transIndex >= 0) {
              // Parse dos campos do UPDATE
              const updates = query.match(/SET (.+?) WHERE/);
              if (updates) {
                const fields = updates[1].split(',').map(f => f.trim());
                let paramIndex = 0;
                fields.forEach(field => {
                  if (field.includes('=') && field.includes('?')) {
                    const fieldName = field.split('=')[0].trim();
                    if (fieldName !== 'updated_at') {
                      db.transactions[transIndex][fieldName] = params[paramIndex];
                      paramIndex++;
                    }
                  }
                });
                db.transactions[transIndex].updated_at = new Date().toISOString();
                saveDatabase();
                return { changes: 1 };
              }
            }
            return { changes: 0 };
          }
          // UPDATE user_profiles
          if (query.includes('UPDATE user_profiles')) {
            const id = params[params.length - 1];
            const profileIndex = (db.user_profiles || []).findIndex(p => p.id === parseInt(id));
            if (profileIndex >= 0) {
              const updates = query.match(/SET (.+?) WHERE/);
              if (updates) {
                const fields = updates[1].split(',').map(f => f.trim());
                let paramIndex = 0;
                fields.forEach(field => {
                  if (field.includes('=') && field.includes('?')) {
                    const fieldName = field.split('=')[0].trim();
                    if (fieldName !== 'updated_at') {
                      db.user_profiles[profileIndex][fieldName] = params[paramIndex];
                      paramIndex++;
                    }
                  }
                });
                db.user_profiles[profileIndex].updated_at = new Date().toISOString();
                saveDatabase();
                return { changes: 1 };
              }
            }
            return { changes: 0 };
          }
          // UPDATE api_keys
          if (query.includes('UPDATE api_keys')) {
            if (!db.api_keys) db.api_keys = [];
            
            // Extrair o ID do WHERE
            const whereMatch = query.match(/WHERE id = \?/);
            if (!whereMatch) {
              // Tentar encontrar o ID nos parâmetros
              const id = params[params.length - 1];
              const keyIndex = db.api_keys.findIndex(k => k.id === parseInt(id));
              
              if (keyIndex >= 0) {
                const updates = query.match(/SET (.+?) WHERE/);
                if (updates) {
                  const fields = updates[1].split(',').map(f => f.trim());
                  let paramIndex = 0;
                  fields.forEach(field => {
                    if (field.includes('=') && field.includes('?')) {
                      const fieldName = field.split('=')[0].trim();
                      if (fieldName !== 'updated_at') {
                        db.api_keys[keyIndex][fieldName] = params[paramIndex];
                        paramIndex++;
                      }
                    }
                  });
                  db.api_keys[keyIndex].updated_at = new Date().toISOString();
                  saveDatabase();
                  return { changes: 1 };
                }
              }
            } else {
              // WHERE id = ?
              const id = params[params.length - 1];
              const keyIndex = db.api_keys.findIndex(k => k.id === parseInt(id));
              
              if (keyIndex >= 0) {
                const updates = query.match(/SET (.+?) WHERE/);
                if (updates) {
                  const fields = updates[1].split(',').map(f => f.trim());
                  let paramIndex = 0;
                  fields.forEach(field => {
                    if (field.includes('=') && field.includes('?')) {
                      const fieldName = field.split('=')[0].trim();
                      if (fieldName !== 'updated_at') {
                        db.api_keys[keyIndex][fieldName] = params[paramIndex];
                        paramIndex++;
                      }
                    }
                  });
                  // updated_at sempre no final
                  if (params[params.length - 2]) {
                    db.api_keys[keyIndex].updated_at = params[params.length - 2];
                  } else {
                    db.api_keys[keyIndex].updated_at = new Date().toISOString();
                  }
                  saveDatabase();
                  return { changes: 1 };
                }
              }
            }
            return { changes: 0 };
          }
          return { changes: 0 };
        },
        exec: (sql) => {
          // Para CREATE TABLE, não fazemos nada no JSON
          return;
        }
      };
    }
  };
}

