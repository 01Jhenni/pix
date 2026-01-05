/**
 * Script para criar tabelas no Supabase via API REST
 * 
 * IMPORTANTE: Este script requer a Service Role Key (não a anon key)
 * Para obter:
 * 1. Acesse https://supabase.com/dashboard
 * 2. Selecione seu projeto
 * 3. Vá em Settings > API
 * 4. Copie a "service_role" key (NÃO a anon key)
 * 5. Defina como SUPABASE_SERVICE_KEY no .env
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://joksegwuxhqgoigvhebb.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || 'sb_publishable_PYm4oqLlgttAQAFmo10dVQ_o6FIW96r';

console.log('🔧 Criando tabelas no Supabase...\n');

async function createTables() {
  try {
    // Usar service role key para ter permissões completas
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, '..', 'database', 'supabase-schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📝 Arquivo SQL carregado\n');
    console.log('⚠️  NOTA: O Supabase não permite executar SQL via API REST diretamente.');
    console.log('   Você precisa executar o SQL manualmente no Supabase Dashboard.\n');
    console.log('📋 INSTRUÇÕES:');
    console.log('   1. Acesse: https://supabase.com/dashboard');
    console.log('   2. Selecione seu projeto');
    console.log('   3. Vá em "SQL Editor" (ícone de banco de dados no menu lateral)');
    console.log('   4. Clique em "New query"');
    console.log('   5. Copie TODO o conteúdo do arquivo: database/supabase-schema.sql');
    console.log('   6. Cole no editor SQL');
    console.log('   7. Clique em "Run" ou pressione Ctrl+Enter');
    console.log('   8. Aguarde a confirmação de sucesso\n');
    
    // Tentar verificar se as tabelas já existem
    console.log('🔍 Verificando se as tabelas já existem...\n');
    
    const tables = ['auth_users', 'sessions', 'pix_users', 'transactions', 'user_profiles', 'api_keys'];
    let allExist = true;
    
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('*').limit(0);
        if (error) {
          if (error.message.includes('relation') || error.message.includes('does not exist')) {
            console.log(`   ❌ Tabela "${table}" não existe`);
            allExist = false;
          } else {
            console.log(`   ⚠️  Tabela "${table}": ${error.message}`);
          }
        } else {
          console.log(`   ✅ Tabela "${table}" existe`);
        }
      } catch (err) {
        console.log(`   ❌ Erro ao verificar "${table}": ${err.message}`);
        allExist = false;
      }
    }
    
    console.log('');
    
    if (allExist) {
      console.log('✅ Todas as tabelas já existem!');
      console.log('✅ O banco de dados está configurado corretamente.\n');
      return true;
    } else {
      console.log('⚠️  Algumas tabelas não existem.');
      console.log('   Execute o SQL conforme as instruções acima.\n');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('\n📝 Certifique-se de que:');
    console.error('   1. SUPABASE_URL está correto no .env');
    console.error('   2. SUPABASE_KEY ou SUPABASE_SERVICE_KEY está correto');
    console.error('   3. Você tem permissões para acessar o projeto\n');
    return false;
  }
}

createTables().then(success => {
  process.exit(success ? 0 : 1);
});

