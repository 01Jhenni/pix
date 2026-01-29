import * as sqliteDb from './sqlite-db.js';

let initialized = false;

export async function loadDatabase() {
  if (!initialized) {
    console.log('ℹ️ Usando banco de dados SQLite local persistente (database/sqlite-db.js).');
    console.log('   Os dados serão salvos em: data/pix.db');
    initialized = true;
  }
  return {
    getDatabase: sqliteDb.getDatabase,
    initDatabase: sqliteDb.initDatabase,
  };
}

export function getDatabase() {
  return sqliteDb.getDatabase();
}

export function initDatabase() {
  return sqliteDb.initDatabase();
}
