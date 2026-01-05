// Carregador de banco de dados - usa JSON por padrão (sem necessidade de compilação)
import * as jsonDb from './db-json.js';

let dbFunctions = {
  getDatabase: jsonDb.getDatabase,
  initDatabase: jsonDb.initDatabase
};

export async function loadDatabase() {
  // Tentar carregar SQLite se disponível, senão usa JSON
  try {
    const dbModule = await import('./db.js');
    console.log('✅ Usando SQLite (better-sqlite3)');
    dbFunctions = {
      getDatabase: dbModule.getDatabase,
      initDatabase: dbModule.initDatabase
    };
  } catch (error) {
    // Fallback para JSON (padrão)
    console.log('⚠️  SQLite não disponível, usando banco JSON');
    dbFunctions = {
      getDatabase: jsonDb.getDatabase,
      initDatabase: jsonDb.initDatabase
    };
  }
  return dbFunctions;
}

export function getDatabase() {
  return dbFunctions.getDatabase();
}

export function initDatabase() {
  return dbFunctions.initDatabase();
}

