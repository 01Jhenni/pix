#!/usr/bin/env node

/**
 * Apaga os dados atuais de usuários PIX (e relacionados) e cadastra um usuário
 * de homologação pronto para testar (OAuth URL e Base URL de homologação).
 *
 * Uso: node scripts/seed-homologacao.js
 *
 * Para usar outros valores, defina as variáveis de ambiente:
 *   BB_CNPJ, BB_NOME, BB_GW_APP_KEY, BB_BASIC_AUTH_BASE64
 *   BB_OAUTH_URL, BB_BASE_URL (opcional; padrão = homologação)
 */

import { loadDatabase, initDatabase } from '../database/db-loader.js';
import { getDatabase, createPixUser } from '../database/sqlite-db.js';

// Valores de homologação para teste (podem ser sobrescritos por env)
const HOMOLOG = {
  oauth_url: 'https://oauth.hm.bb.com.br/oauth/token',
  base_url: 'https://api.hm.bb.com.br/pix/v2',
  cnpj: process.env.BB_CNPJ || '02429647000169',
  nome: process.env.BB_NOME || 'Vida ouro - Homologação',
  gw_app_key: process.env.BB_GW_APP_KEY || 'cc7d70998c8d43148e6cafd269a34bfd',
  basic_auth_base64: process.env.BB_BASIC_AUTH_BASE64 || 'ZXlKcFpDSTZJamcyWlNJc0ltTnZaR2xuYjFCMVlteHBZMkZrYjNJaU9qQXNJbU52WkdsbmIxTnZablIzWVhKbElqb3hORFl5TnpFc0luTmxjWFZsYm1OcFlXeEpibk4wWVd4aFkyRnZJam94ZlE6ZXlKcFpDSTZJalF4WWpGak5HUXRPVFk0TlMwME5qWmtMVGd4WWprdE1XUmhNV1pqWWpjd1lUZG1ObUV6TVdRNFpEZ3RJaXdpWTI5a2FXZHZVSFZpYkdsallXUnZjaUk2TUN3aVkyOWthV2R2VTI5bWRIZGhjbVVpT2pFME5qSTNNU3dpYzJWeGRXVnVZMmxoYkVsdWMzUmhiR0ZqWVc4aU9qRXNJbk5sY1hWbGJtTnBZV3hEY21Wa1pXNWphV0ZzSWpveExDSmhiV0pwWlc1MFpTSTZJbWh2Ylc5c2IyZGhZMkZ2SWl3aWFXRjBJam94TnpVMk56TTVNRGs1TnpZNGZR',
};

async function main() {
  await loadDatabase();
  initDatabase();

  const db = getDatabase();

  console.log('🗑️  Limpando dados atuais (transações, api_keys, perfis, usuários PIX)...');

  db.exec('DELETE FROM transactions');
  db.exec('DELETE FROM api_keys');
  db.exec('DELETE FROM user_profiles');
  db.exec('DELETE FROM pix_users');

  console.log('✅ Dados antigos removidos.\n');

  const oauth_url = process.env.BB_OAUTH_URL || HOMOLOG.oauth_url;
  const base_url = process.env.BB_BASE_URL || HOMOLOG.base_url;

  console.log('📝 Cadastrando usuário de homologação para teste...');
  console.log(`   Nome: ${HOMOLOG.nome}`);
  console.log(`   CNPJ: ${HOMOLOG.cnpj}`);
  console.log(`   OAuth URL: ${oauth_url}`);
  console.log(`   Base URL: ${base_url}`);
  console.log(`   GW App Key: ${HOMOLOG.gw_app_key.substring(0, 20)}...\n`);

  const user = createPixUser({
    cnpj: HOMOLOG.cnpj,
    nome: HOMOLOG.nome,
    gw_app_key: HOMOLOG.gw_app_key,
    basic_auth_base64: HOMOLOG.basic_auth_base64,
    base_url,
    oauth_url,
  });

  console.log('✅ Usuário cadastrado com sucesso!');
  console.log(`   ID: ${user.id}`);
  console.log('');
  console.log('Próximo passo: npm run test:oauth');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
