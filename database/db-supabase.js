import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://joksegwuxhqgoigvhebb.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_PYm4oqLlgttAQAFmo10dVQ_o6FIW96r';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SECRET_KEY || 'sb_secret_MzHD848Ilfhk2zqZlWdAOg_lzcbrrs9';

let supabase;
let supabaseAdmin; // Cliente com service key para operações administrativas
let dbInterface;

// Inicializar cliente Supabase (public key)
function initSupabase() {
  if (!supabase) {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error('SUPABASE_URL e SUPABASE_KEY devem ser configurados');
    }
    
    // Validar formato da URL
    if (!SUPABASE_URL.startsWith('https://') || !SUPABASE_URL.includes('.supabase.co')) {
      throw new Error(`URL do Supabase inválida: ${SUPABASE_URL}`);
    }
    
    // Validar formato da chave - apenas verificar se não está vazia
    // Chaves do Supabase podem ter tamanhos variados
    if (!SUPABASE_KEY || SUPABASE_KEY.trim().length === 0) {
      throw new Error('Chave do Supabase não pode estar vazia');
    }
    
    try {
      supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      console.log('✅ Cliente Supabase inicializado');
      console.log(`   URL: ${SUPABASE_URL.substring(0, 40)}...`);
      console.log(`   Key: ${SUPABASE_KEY.substring(0, 20)}...`);
      
    } catch (error) {
      console.error('❌ Erro ao criar cliente Supabase:', error.message);
      throw error;
    }
  }
  return supabase;
}

// Inicializar cliente Supabase Admin (service key) - para operações que precisam bypass RLS
function initSupabaseAdmin() {
  if (!supabaseAdmin) {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      // Se não tiver service key, usar a public key
      return initSupabase();
    }
    
    try {
      supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      console.log('✅ Cliente Supabase Admin inicializado (service key)');
    } catch (error) {
      console.warn('⚠️  Erro ao criar cliente Supabase Admin, usando cliente público:', error.message);
      return initSupabase();
    }
  }
  return supabaseAdmin;
}

// Helper para executar Promises de forma síncrona (sem deasync)
// Usa uma abordagem melhorada que permite que o event loop processe
function syncPromise(promise, allowNull = false) {
  let result;
  let error;
  let done = false;
  
  promise
    .then(data => {
      result = data;
      done = true;
    })
    .catch(err => {
      error = err;
      done = true;
    });
  
  const startTime = Date.now();
  const timeout = 30000; // 30 segundos timeout (aumentado para conexões lentas)
  
  // Polling otimizado - usar delays maiores para não bloquear o event loop
  let iterations = 0;
  while (!done && (Date.now() - startTime) < timeout) {
    iterations++;
    
    // Usar delay maior para permitir que o event loop processe outras operações
    // Delay progressivo: menor no início, maior depois
    const elapsed = Date.now() - startTime;
    let delay = 5; // Delay base de 5ms
    
    // Aumentar delay progressivamente
    if (elapsed > 1000) delay = 10;
    if (elapsed > 5000) delay = 20;
    if (elapsed > 10000) delay = 50;
    
    const wait = (ms) => {
      const start = Date.now();
      while (Date.now() - start < ms && !done) {
        // Pequeno yield para permitir que outras operações sejam processadas
      }
    };
    wait(delay);
  }
  
  if (!done) {
    const elapsed = Date.now() - startTime;
    const errorMsg = `Timeout ao executar operação no banco de dados (${elapsed}ms). Verifique se as tabelas foram criadas no Supabase e se a conexão está funcionando.`;
    if (allowNull) {
      console.warn(`⚠️  ${errorMsg}`);
      return null;
    }
    throw new Error(errorMsg);
  }
  
  if (error) {
    // Melhorar mensagem de erro para tabelas não encontradas
    const errorMsg = error.message || String(error);
    if (errorMsg.includes('relation') || errorMsg.includes('does not exist') || errorMsg.includes('not found')) {
      const tableMatch = errorMsg.match(/relation "([^"]+)"/) || errorMsg.match(/table "([^"]+)"/);
      const tableName = tableMatch ? tableMatch[1] : 'desconhecida';
      throw new Error(`Tabela "${tableName}" não encontrada no Supabase. Execute database/supabase-schema.sql no Supabase SQL Editor.`);
    }
    // Para outros erros, verificar se é um erro de RLS ou conexão
    if (errorMsg.includes('permission denied') || errorMsg.includes('RLS') || errorMsg.includes('row-level security')) {
      throw new Error(`Erro de permissão no Supabase. Verifique as políticas RLS (Row Level Security) nas tabelas ou use a service key.`);
    }
    throw error;
  }
  
  return result;
}

// Criar interface compatível com SQLite
function createDatabaseInterface() {
  return {
    prepare: (query) => {
      return {
        get: (...params) => {
          // Para queries de verificação (SELECT), usar admin para bypass RLS se necessário
          // Mas tentar primeiro com public key para melhor performance
          const client = initSupabase(); // SELECT queries podem usar public key
          
          // SELECT ... FROM pix_users WHERE id = ?
          if (query.includes('SELECT') && query.includes('FROM pix_users') && query.includes('WHERE id = ?')) {
            const id = params[0];
            const promise = client
              .from('pix_users')
              .select('*')
              .eq('id', id)
              .maybeSingle();
            
            const data = syncPromise(promise, true); // allowNull para SELECT
            
            // Se tem AND ativo = 1, verificar
            if (query.includes('AND ativo = 1') && data && data.ativo !== 1) {
              return null;
            }
            
            // Se é SELECT id, retornar só o id
            if (query.includes('SELECT id') && !query.includes('SELECT *')) {
              return data ? { id: data.id } : null;
            }
            
            return data;
          }
          
          // SELECT ... FROM pix_users WHERE cnpj = ?
          if (query.includes('SELECT') && query.includes('FROM pix_users') && query.includes('WHERE cnpj = ?')) {
            const cnpj = params[0];
            const promise = client
              .from('pix_users')
              .select('*')
              .eq('cnpj', cnpj)
              .maybeSingle();
            
            return syncPromise(promise, true); // allowNull para SELECT
          }
          
          // SELECT ... FROM transactions WHERE t.id = ? JOIN pix_users
          if (query.includes('SELECT') && query.includes('FROM transactions') && query.includes('WHERE t.id = ?')) {
            const id = params[0];
            const promise = client
              .from('transactions')
              .select(`
                *,
                pix_users!inner(*)
              `)
              .eq('id', id)
              .maybeSingle();
            
            const data = syncPromise(promise, true); // allowNull para SELECT
            if (!data) return null;
            
            return {
              ...data,
              usuario_id: data.pix_users?.id,
              usuario_cnpj: data.pix_users?.cnpj,
              usuario_nome: data.pix_users?.nome
            };
          }
          
          // SELECT ... FROM transactions WHERE t.txid = ? JOIN pix_users
          if (query.includes('SELECT') && query.includes('FROM transactions') && query.includes('WHERE t.txid = ?')) {
            const txid = params[0];
            const promise = client
              .from('transactions')
              .select(`
                *,
                pix_users!inner(*)
              `)
              .eq('txid', txid)
              .maybeSingle();
            
            const data = syncPromise(promise, true); // allowNull para SELECT
            if (!data) return null;
            
            return {
              ...data,
              usuario_id: data.pix_users?.id,
              usuario_cnpj: data.pix_users?.cnpj,
              usuario_nome: data.pix_users?.nome
            };
          }
          
          // SELECT ... FROM user_profiles WHERE pix_user_id = ?
          if (query.includes('SELECT') && query.includes('FROM user_profiles') && query.includes('WHERE pix_user_id = ?')) {
            const userId = params[0];
            const promise = client
              .from('user_profiles')
              .select('*')
              .eq('pix_user_id', userId)
              .maybeSingle();
            
            return syncPromise(promise, true); // allowNull para SELECT
          }
          
          // SELECT ... FROM user_profiles WHERE id = ?
          if (query.includes('SELECT') && query.includes('FROM user_profiles') && query.includes('WHERE id = ?')) {
            const id = params[0];
            const promise = client
              .from('user_profiles')
              .select('*')
              .eq('id', id)
              .maybeSingle();
            
            return syncPromise(promise, true); // allowNull para SELECT
          }
          
          // SELECT ... FROM api_keys WHERE key = ?
          if (query.includes('SELECT') && query.includes('FROM api_keys') && query.includes('WHERE key = ?')) {
            const key = params[0];
            const promise = client
              .from('api_keys')
              .select('*')
              .eq('key', key)
              .maybeSingle();
            
            return syncPromise(promise, true); // allowNull para SELECT
          }
          
          // SELECT ... FROM api_keys WHERE pix_user_id = ?
          if (query.includes('SELECT') && query.includes('FROM api_keys') && query.includes('WHERE pix_user_id = ?')) {
            const userId = params[0];
            const promise = client
              .from('api_keys')
              .select('*')
              .eq('pix_user_id', userId);
            
            return syncPromise(promise, true); // allowNull para SELECT
          }
          
          // SELECT ... FROM api_keys WHERE id = ?
          if (query.includes('SELECT') && query.includes('FROM api_keys') && query.includes('WHERE id = ?')) {
            const id = params[0];
            const promise = client
              .from('api_keys')
              .select('*')
              .eq('id', id)
              .maybeSingle();
            
            return syncPromise(promise, true); // allowNull para SELECT
          }
          
          // SELECT ... FROM auth_users WHERE id = ?
          if (query.includes('SELECT') && query.includes('FROM auth_users') && query.includes('WHERE id = ?')) {
            const id = params[0];
            const promise = client
              .from('auth_users')
              .select('*')
              .eq('id', id)
              .maybeSingle();
            
            return syncPromise(promise, true); // allowNull para SELECT
          }
          
          // SELECT ... FROM auth_users WHERE username = ? AND active = 1
          if (query.includes('SELECT') && query.includes('FROM auth_users') && query.includes('WHERE username = ?')) {
            const username = params[0];
            let queryBuilder = client
              .from('auth_users')
              .select('*')
              .eq('username', username);
            
            if (query.includes('AND active = 1')) {
              queryBuilder = queryBuilder.eq('active', 1);
            }
            
            return syncPromise(queryBuilder.maybeSingle(), true); // allowNull para SELECT
          }
          
          // SELECT ... FROM auth_users WHERE email = ? AND active = 1
          if (query.includes('SELECT') && query.includes('FROM auth_users') && query.includes('WHERE email = ?')) {
            const email = params[0];
            let queryBuilder = client
              .from('auth_users')
              .select('*')
              .eq('email', email);
            
            if (query.includes('AND active = 1')) {
              queryBuilder = queryBuilder.eq('active', 1);
            }
            
            return syncPromise(queryBuilder.maybeSingle(), true); // allowNull para SELECT
          }
          
          // SELECT id FROM auth_users WHERE username = ? OR email = ?
          if (query.includes('SELECT') && query.includes('FROM auth_users') && query.includes('WHERE username = ?') && query.includes('OR email = ?')) {
            const username = params[0];
            const email = params[1];
            // Tentar buscar por username primeiro
            let promise = client
              .from('auth_users')
              .select('id')
              .eq('username', username)
              .maybeSingle();
            
            let result = syncPromise(promise, true); // allowNull para SELECT
            if (result) return result;
            
            // Se não encontrou, buscar por email
            promise = client
              .from('auth_users')
              .select('id')
              .eq('email', email)
              .maybeSingle();
            
            return syncPromise(promise, true); // allowNull para SELECT
          }
          
          // SELECT ... FROM sessions WHERE token = ? AND expires_at > ?
          if (query.includes('SELECT') && query.includes('FROM sessions') && query.includes('WHERE token = ?')) {
            const token = params[0];
            let queryBuilder = client
              .from('sessions')
              .select('*')
              .eq('token', token);
            
            if (query.includes('AND expires_at > ?')) {
              const expiresAt = params[1];
              queryBuilder = queryBuilder.gt('expires_at', expiresAt);
            }
            
            return syncPromise(queryBuilder.maybeSingle(), true); // allowNull para SELECT
          }
          
          // COUNT(*)
          if (query.includes('COUNT(*)')) {
            let queryBuilder = client.from('transactions').select('*', { count: 'exact', head: true });
            
            if (query.includes('WHERE t.pix_user_id = ?')) {
              queryBuilder = queryBuilder.eq('pix_user_id', params[0]);
            }
            
            if (query.includes('AND t.status = ?')) {
              const statusIndex = query.includes('WHERE t.pix_user_id = ?') ? 1 : 0;
              queryBuilder = queryBuilder.eq('status', params[statusIndex]);
            }
            
            const response = syncPromise(queryBuilder, true); // allowNull para COUNT
            const count = response?.count || response || 0;
            return { total: count || 0 };
          }
          
          // SELECT MAX(id) as max FROM user_profiles
          if (query.includes('SELECT MAX(id)') && query.includes('FROM user_profiles')) {
            const promise = client
              .from('user_profiles')
              .select('id')
              .order('id', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            const data = syncPromise(promise, true); // allowNull para SELECT
            return { max: data?.id || 0 };
          }
          
          return null;
        },
        
        all: (...params) => {
          const client = initSupabase();
          
          // SELECT * FROM pix_users
          if (query.includes('FROM pix_users') && !query.includes('JOIN')) {
            let queryBuilder = client.from('pix_users').select('*');
            
            if (query.includes('WHERE ativo = 1')) {
              queryBuilder = queryBuilder.eq('ativo', 1);
            }
            
            if (query.includes('ORDER BY created_at DESC')) {
              queryBuilder = queryBuilder.order('created_at', { ascending: false });
            }
            
            return syncPromise(queryBuilder, true) || []; // allowNull para SELECT
          }
          
          // SELECT * FROM transactions
          if (query.includes('FROM transactions')) {
            let queryBuilder = client.from('transactions').select(`
              *,
              pix_users(*)
            `);
            
            // Filtros
            let paramIndex = 0;
            if (query.includes('WHERE t.pix_user_id = ?') || (query.includes('WHERE 1=1') && query.includes('AND t.pix_user_id = ?'))) {
              queryBuilder = queryBuilder.eq('pix_user_id', params[paramIndex]);
              paramIndex++;
            }
            
            if (query.includes('AND t.status = ?')) {
              queryBuilder = queryBuilder.eq('status', params[paramIndex]);
              paramIndex++;
            }
            
            if (query.includes('ORDER BY t.created_at DESC')) {
              queryBuilder = queryBuilder.order('created_at', { ascending: false });
            }
            
            if (query.includes('LIMIT ?')) {
              const limit = params[params.length - 2];
              const offset = params[params.length - 1] || 0;
              queryBuilder = queryBuilder.range(offset, offset + limit - 1);
            }
            
            const data = syncPromise(queryBuilder, true) || []; // allowNull para SELECT
            
            // Formatar dados com join
            return data.map(t => ({
              ...t,
              usuario_id: t.pix_users?.id,
              usuario_cnpj: t.pix_users?.cnpj,
              usuario_nome: t.pix_users?.nome
            }));
          }
          
          // SELECT * FROM user_profiles
          if (query.includes('FROM user_profiles')) {
            let queryBuilder = client.from('user_profiles').select('*');
            
            if (query.includes('WHERE pix_user_id = ?')) {
              queryBuilder = queryBuilder.eq('pix_user_id', params[0]);
            }
            
            return syncPromise(queryBuilder, true) || []; // allowNull para SELECT
          }
          
          // SELECT * FROM api_keys
          if (query.includes('FROM api_keys')) {
            let queryBuilder = client.from('api_keys').select('*');
            
            if (query.includes('WHERE pix_user_id = ?')) {
              queryBuilder = queryBuilder.eq('pix_user_id', params[0]);
            }
            
            if (query.includes('ORDER BY created_at DESC')) {
              queryBuilder = queryBuilder.order('created_at', { ascending: false });
            }
            
            return syncPromise(queryBuilder, true) || []; // allowNull para SELECT
          }
          
          // SELECT * FROM auth_users
          if (query.includes('FROM auth_users')) {
            let queryBuilder = client.from('auth_users').select('*');
            
            if (query.includes('WHERE active = 1')) {
              queryBuilder = queryBuilder.eq('active', 1);
            }
            
            return syncPromise(queryBuilder, true) || []; // allowNull para SELECT
          }
          
          return [];
        },
        
        run: (...params) => {
          // Usar cliente admin para operações de escrita (INSERT, UPDATE, DELETE)
          const client = initSupabaseAdmin();
          
          // INSERT INTO pix_users
          if (query.includes('INSERT INTO pix_users')) {
            const userData = {
              cnpj: params[0],
              nome: params[1],
              gw_app_key: params[2],
              basic_auth_base64: params[3],
              base_url: params[4] || 'https://api-pix.bb.com.br/pix/v2',
              oauth_url: params[5] || 'https://oauth.bb.com.br/oauth/token',
              chave_pix_recebedor: params[6] || null,
              nome_recebedor: params[7] || null,
              cidade_recebedor: params[8] || null,
              ativo: 1
            };
            
            const promise = client
              .from('pix_users')
              .insert(userData)
              .select()
              .single();
            
            const response = syncPromise(promise);
            // Supabase retorna { data, error } ou diretamente o objeto
            const data = response?.data || response;
            if (!data || !data.id) {
              throw new Error('Falha ao inserir registro: não foi possível obter o ID');
            }
            return { lastInsertRowid: data.id, changes: 1 };
          }
          
          // INSERT INTO transactions
          if (query.includes('INSERT INTO transactions')) {
            const transactionData = {
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
              metadata: null
            };
            
            const promise = client
              .from('transactions')
              .insert(transactionData)
              .select()
              .single();
            
            const response = syncPromise(promise);
            // Supabase retorna { data, error } ou diretamente o objeto
            const data = response?.data || response;
            if (!data || !data.id) {
              throw new Error('Falha ao inserir registro: não foi possível obter o ID');
            }
            return { lastInsertRowid: data.id, changes: 1 };
          }
          
          // INSERT INTO user_profiles
          if (query.includes('INSERT INTO user_profiles')) {
            const profileData = {
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
              metadata: params[14] || null
            };
            
            const promise = client
              .from('user_profiles')
              .insert(profileData)
              .select()
              .single();
            
            const response = syncPromise(promise);
            // Supabase retorna { data, error } ou diretamente o objeto
            const data = response?.data || response;
            if (!data || !data.id) {
              throw new Error('Falha ao inserir registro: não foi possível obter o ID');
            }
            return { lastInsertRowid: data.id, changes: 1 };
          }
          
          // INSERT INTO api_keys
          if (query.includes('INSERT INTO api_keys')) {
            const apiKeyData = {
              pix_user_id: params[0],
              key: params[1],
              name: params[2] || null,
              active: params[3] !== undefined ? params[3] : 1,
              last_used: null
            };
            
            const promise = client
              .from('api_keys')
              .insert(apiKeyData)
              .select()
              .single();
            
            const response = syncPromise(promise);
            // Supabase retorna { data, error } ou diretamente o objeto
            const data = response?.data || response;
            if (!data || !data.id) {
              throw new Error('Falha ao inserir registro: não foi possível obter o ID');
            }
            return { lastInsertRowid: data.id, changes: 1 };
          }
          
          // UPDATE pix_users
          if (query.includes('UPDATE pix_users')) {
            const id = params[params.length - 1];
            const updates = {};
            
            // Parse dos campos do UPDATE
            const setMatch = query.match(/SET (.+?) WHERE/);
            if (setMatch) {
              const fields = setMatch[1].split(',').map(f => f.trim());
              let paramIndex = 0;
              fields.forEach(field => {
                if (field.includes('=') && field.includes('?')) {
                  const fieldName = field.split('=')[0].trim();
                  if (fieldName !== 'updated_at') {
                    updates[fieldName] = params[paramIndex];
                    paramIndex++;
                  }
                }
              });
            }
            
            updates.updated_at = new Date().toISOString();
            
            const promise = client
              .from('pix_users')
              .update(updates)
              .eq('id', id)
              .select();
            
            const response = syncPromise(promise);
            // Supabase retorna { data, error } ou diretamente o array
            const data = response?.data || response;
            return { changes: Array.isArray(data) ? data.length : (data ? 1 : 0) };
          }
          
          // UPDATE transactions
          if (query.includes('UPDATE transactions')) {
            const id = params[params.length - 1];
            const updates = {};
            
            const setMatch = query.match(/SET (.+?) WHERE/);
            if (setMatch) {
              const fields = setMatch[1].split(',').map(f => f.trim());
              let paramIndex = 0;
              fields.forEach(field => {
                if (field.includes('=') && field.includes('?')) {
                  const fieldName = field.split('=')[0].trim();
                  if (fieldName !== 'updated_at') {
                    updates[fieldName] = params[paramIndex];
                    paramIndex++;
                  }
                }
              });
            }
            
            updates.updated_at = new Date().toISOString();
            
            const promise = client
              .from('transactions')
              .update(updates)
              .eq('id', id)
              .select();
            
            const response = syncPromise(promise);
            // Supabase retorna { data, error } ou diretamente o array
            const data = response?.data || response;
            return { changes: Array.isArray(data) ? data.length : (data ? 1 : 0) };
          }
          
          // UPDATE user_profiles
          if (query.includes('UPDATE user_profiles')) {
            const id = params[params.length - 1];
            const updates = {};
            
            const setMatch = query.match(/SET (.+?) WHERE/);
            if (setMatch) {
              const fields = setMatch[1].split(',').map(f => f.trim());
              let paramIndex = 0;
              fields.forEach(field => {
                if (field.includes('=') && field.includes('?')) {
                  const fieldName = field.split('=')[0].trim();
                  if (fieldName !== 'updated_at') {
                    updates[fieldName] = params[paramIndex];
                    paramIndex++;
                  }
                }
              });
            }
            
            updates.updated_at = new Date().toISOString();
            
            const promise = client
              .from('user_profiles')
              .update(updates)
              .eq('id', id)
              .select();
            
            const response = syncPromise(promise);
            // Supabase retorna { data, error } ou diretamente o array
            const data = response?.data || response;
            return { changes: Array.isArray(data) ? data.length : (data ? 1 : 0) };
          }
          
          // UPDATE api_keys
          if (query.includes('UPDATE api_keys')) {
            const id = params[params.length - 1];
            const updates = {};
            
            const setMatch = query.match(/SET (.+?) WHERE/);
            if (setMatch) {
              const fields = setMatch[1].split(',').map(f => f.trim());
              let paramIndex = 0;
              fields.forEach(field => {
                if (field.includes('=') && field.includes('?')) {
                  const fieldName = field.split('=')[0].trim();
                  if (fieldName !== 'updated_at') {
                    updates[fieldName] = params[paramIndex];
                    paramIndex++;
                  }
                }
              });
            }
            
            updates.updated_at = new Date().toISOString();
            
            const promise = client
              .from('api_keys')
              .update(updates)
              .eq('id', id)
              .select();
            
            const response = syncPromise(promise);
            // Supabase retorna { data, error } ou diretamente o array
            const data = response?.data || response;
            return { changes: Array.isArray(data) ? data.length : (data ? 1 : 0) };
          }
          
          // INSERT INTO auth_users
          if (query.includes('INSERT INTO auth_users')) {
            const userData = {
              username: params[0],
              email: params[1],
              password_hash: params[2],
              name: params[3] || params[0],
              role: params[4] || 'admin',
              active: 1
            };
            
            const promise = client
              .from('auth_users')
              .insert(userData)
              .select()
              .single();
            
            const response = syncPromise(promise);
            // Supabase retorna { data, error } ou diretamente o objeto
            const data = response?.data || response;
            if (!data || !data.id) {
              throw new Error('Falha ao inserir registro: não foi possível obter o ID');
            }
            return { lastInsertRowid: data.id, changes: 1 };
          }
          
          // INSERT INTO sessions
          if (query.includes('INSERT INTO sessions')) {
            const sessionData = {
              user_id: params[0],
              token: params[1],
              expires_at: params[2]
            };
            
            const promise = client
              .from('sessions')
              .insert(sessionData)
              .select()
              .single();
            
            const response = syncPromise(promise);
            // Supabase retorna { data, error } ou diretamente o objeto
            const data = response?.data || response;
            if (!data || !data.id) {
              throw new Error('Falha ao inserir registro: não foi possível obter o ID');
            }
            return { lastInsertRowid: data.id, changes: 1 };
          }
          
          // UPDATE auth_users
          if (query.includes('UPDATE auth_users')) {
            const id = params[params.length - 1];
            const updates = {};
            
            const setMatch = query.match(/SET (.+?) WHERE/);
            if (setMatch) {
              const fields = setMatch[1].split(',').map(f => f.trim());
              let paramIndex = 0;
              fields.forEach(field => {
                if (field.includes('=') && field.includes('?')) {
                  const fieldName = field.split('=')[0].trim();
                  if (fieldName !== 'updated_at') {
                    updates[fieldName] = params[paramIndex];
                    paramIndex++;
                  }
                }
              });
            }
            
            updates.updated_at = new Date().toISOString();
            
            const promise = client
              .from('auth_users')
              .update(updates)
              .eq('id', id)
              .select();
            
            const response = syncPromise(promise);
            // Supabase retorna { data, error } ou diretamente o array
            const data = response?.data || response;
            return { changes: Array.isArray(data) ? data.length : (data ? 1 : 0) };
          }
          
          // DELETE FROM sessions
          if (query.includes('DELETE FROM sessions')) {
            const token = params[0];
            const promise = client
              .from('sessions')
              .delete()
              .eq('token', token)
              .select();
            
            const response = syncPromise(promise);
            // Supabase retorna { data, error } ou diretamente o array
            const data = response?.data || response;
            return { changes: Array.isArray(data) ? data.length : (data ? 1 : 0) };
          }
          
          return { changes: 0 };
        },
        
        exec: () => {
          // Para CREATE TABLE, não fazemos nada aqui
          // As tabelas devem ser criadas manualmente no Supabase
          return;
        }
      };
    }
  };
}

export function initDatabase() {
  try {
    initSupabase();
    dbInterface = createDatabaseInterface();
    console.log('✅ Banco de dados Supabase inicializado');
    return dbInterface;
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados Supabase:', error.message);
    throw error;
  }
}

export function getDatabase() {
  if (!dbInterface) {
    initDatabase();
  }
  return dbInterface;
}
