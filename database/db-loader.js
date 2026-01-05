// Carregador de banco de dados - Supabase
let dbFunctions = null;

export async function loadDatabase() {
  try {
    const dbModule = await import('./db-supabase.js');
    console.log('✅ Usando Supabase');
    dbFunctions = {
      getDatabase: dbModule.getDatabase,
      initDatabase: dbModule.initDatabase
    };
    return dbFunctions;
  } catch (error) {
    console.error('❌ Erro ao carregar Supabase:', error.message);
    throw new Error('Supabase não está configurado corretamente. Verifique SUPABASE_URL e SUPABASE_KEY nas variáveis de ambiente.');
  }
}

export function getDatabase() {
  if (!dbFunctions) {
    throw new Error('Banco de dados não foi inicializado. Execute loadDatabase() primeiro.');
  }
  return dbFunctions.getDatabase();
}

export function initDatabase() {
  if (!dbFunctions) {
    throw new Error('Banco de dados não foi inicializado. Execute loadDatabase() primeiro.');
  }
  return dbFunctions.initDatabase();
}

