// Carregador de banco de dados - prioriza Supabase
import * as jsonDb from './db-json.js';

let dbFunctions = {
  getDatabase: jsonDb.getDatabase,
  initDatabase: jsonDb.initDatabase
};

export async function loadDatabase() {
  // Tentar carregar Supabase primeiro
  try {
    const dbModule = await import('./db-supabase.js');
    console.log('✅ Usando Supabase');
    dbFunctions = {
      getDatabase: dbModule.getDatabase,
      initDatabase: dbModule.initDatabase
    };
  } catch (error) {
    console.log('⚠️  Supabase não disponível, tentando SQLite...');
    // Tentar carregar SQLite se disponível
    try {
      const dbModule = await import('./db.js');
      console.log('✅ Usando SQLite (better-sqlite3)');
      dbFunctions = {
        getDatabase: dbModule.getDatabase,
        initDatabase: dbModule.initDatabase
      };
    } catch (error2) {
      // Fallback para JSON (padrão)
      console.log('⚠️  SQLite não disponível, usando banco JSON');
      dbFunctions = {
        getDatabase: jsonDb.getDatabase,
        initDatabase: jsonDb.initDatabase
      };
    }
  }
  return dbFunctions;
}

export function getDatabase() {
  return dbFunctions.getDatabase();
}

export function initDatabase() {
  return dbFunctions.initDatabase();
}

