#!/usr/bin/env node

/**
 * Mostra a configuração OAuth do usuário PIX (sem precisar do sqlite3 instalado).
 * Também permite atualizar oauth_url para o ambiente correto (homologação, sandbox, produção).
 *
 * Uso:
 *   node scripts/check-pix-config.js              → mostra config do usuário 1
 *   node scripts/check-pix-config.js 2           → mostra config do usuário 2
 *   node scripts/check-pix-config.js set-oauth "https://oauth.hm.bb.com.br/oauth/token"  → atualiza oauth_url do usuário 1
 *   node scripts/check-pix-config.js set-oauth "https://oauth.hm.bb.com.br/oauth/token" 2  → atualiza usuário 2
 */

import { loadDatabase, initDatabase } from '../database/db-loader.js';
import { getPixUserById, listPixUsers, updatePixUser } from '../database/sqlite-db.js';

async function main() {
  await loadDatabase();
  initDatabase();

  const args = process.argv.slice(2);
  const setOauthArg = args.find((a, i) => a === 'set-oauth' && args[i + 1]);
  const setOauthIndex = args.indexOf('set-oauth');

  if (setOauthArg !== undefined && setOauthIndex >= 0) {
    const newUrl = args[setOauthIndex + 1];
    const userId = args[setOauthIndex + 2] ? parseInt(args[setOauthIndex + 2], 10) : 1;
    const user = getPixUserById(userId);
    if (!user) {
      console.error(`❌ Usuário PIX com ID ${userId} não encontrado.`);
      process.exit(1);
    }
    updatePixUser(userId, { oauth_url: newUrl });
    console.log('✅ oauth_url atualizada com sucesso.');
    console.log(`   ID ${userId}: ${newUrl}`);
    return;
  }

  const userId = args[0] && !args[0].startsWith('set-') ? parseInt(args[0], 10) : 1;
  let user = getPixUserById(userId);
  if (!user) {
    const users = listPixUsers();
    if (users.length === 0) {
      console.error('❌ Nenhum usuário PIX cadastrado.');
      process.exit(1);
    }
    user = users[0];
    console.log(`ℹ️  Usando primeiro usuário (ID: ${user.id})\n`);
  }

  const mask = (str, show = 20) =>
    !str ? '—' : str.length <= show ? str : str.substring(0, show) + '...';

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Configuração do usuário PIX');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`ID:           ${user.id}`);
  console.log(`Nome:         ${user.nome || '—'}`);
  console.log(`CNPJ:         ${user.cnpj || '—'}`);
  console.log(`Ativo:        ${user.ativo ? 'Sim' : 'Não'}`);
  console.log('');
  console.log(`oauth_url:    ${user.oauth_url || 'NÃO CONFIGURADO'}`);
  console.log(`base_url:     ${user.base_url || '—'}`);
  console.log(`gw_app_key:   ${mask(user.gw_app_key, 24)}`);
  console.log(`basic_auth:   ${mask(user.basic_auth_base64, 30)}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('Ambientes OAuth do BB:');
  console.log('  Homologação: https://oauth.hm.bb.com.br/oauth/token');
  console.log('  Sandbox:     https://oauth.sandbox.bb.com.br/oauth/token');
  console.log('  Produção:    https://oauth.bb.com.br/oauth/token');
  console.log('');
  console.log('Para alterar oauth_url (ex.: homologação):');
  console.log('  node scripts/check-pix-config.js set-oauth "https://oauth.hm.bb.com.br/oauth/token"');
  console.log('');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
