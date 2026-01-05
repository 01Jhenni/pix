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
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_PYm4oqLlgttAQAFmo10dVQ_o6FIW96r';

console.log('🔧 Configurando tabelas no Supabase...\n');
console.log('📝 IMPORTANTE: Este script apenas valida a conexão.');
console.log('   Para criar as tabelas, execute o SQL manualmente no Supabase Dashboard.\n');

async function checkConnection() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // Testar conexão tentando listar tabelas
    console.log('🔍 Testando conexão com Supabase...');
    
    // Tentar uma query simples em uma tabela que deve existir
    const { data, error } = await supabase
      .from('auth_users')
      .select('count')
      .limit(1);
    
    if (error) {
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('⚠️  Tabelas ainda não foram criadas.');
        console.log('\n📋 PRÓXIMOS PASSOS:');
        console.log('   1. Acesse: https://supabase.com/dashboard');
        console.log('   2. Selecione seu projeto');
        console.log('   3. Vá em "SQL Editor"');
        console.log('   4. Copie o conteúdo de: database/supabase-schema.sql');
        console.log('   5. Cole e execute no SQL Editor');
        console.log('   6. Aguarde a confirmação de sucesso\n');
        return false;
      } else {
        throw error;
      }
    }
    
    console.log('✅ Conexão com Supabase funcionando!');
    console.log('✅ Tabelas já existem no banco de dados.\n');
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao conectar com Supabase:', error.message);
    console.error('\n📝 VERIFIQUE:');
    console.error('   1. SUPABASE_URL está correto?');
    console.error('   2. SUPABASE_KEY está correto?');
    console.error('   3. O arquivo .env existe?');
    console.error('   4. A conexão com a internet está funcionando?\n');
    return false;
  }
}

checkConnection().then(success => {
  if (success) {
    console.log('✅ Setup concluído com sucesso!');
    process.exit(0);
  } else {
    console.log('⚠️  Execute o SQL manualmente no Supabase Dashboard.');
    process.exit(1);
  }
});

