// Carregador de banco de dados - Supabase
import { getDatabase, initDatabase } from './db-supabase.js';

export async function loadDatabase() {
  console.log('✅ Usando Supabase');
  return { getDatabase, initDatabase };
}

export { getDatabase, initDatabase };

