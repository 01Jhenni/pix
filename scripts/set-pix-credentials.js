#!/usr/bin/env node

/**
 * Atualiza credenciais OAuth do usuário PIX (homologação/produção).
 * Lê valores de variáveis de ambiente ou do arquivo .env (raiz do projeto).
 *
 * Uso (produção — igual ao n8n Jornada 3 - Produção):
 *   Coloque no .env: BasicToken=... e APIKey=...
 *   node scripts/set-pix-credentials.js
 *
 * Ou na linha de comando:
 *   Linux/macOS:  BasicToken="SEU_BASIC" APIKey="SUA_APP_KEY" node scripts/set-pix-credentials.js
 *   PowerShell:   $env:BasicToken="SEU_BASIC"; $env:APIKey="SUA_APP_KEY"; node scripts/set-pix-credentials.js
 *
 * Homologação: defina BB_OAUTH_URL e BB_BASE_URL (ou use env) antes de rodar.
 * Usuário ID padrão: 1. Para outro: node scripts/set-pix-credentials.js 2
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(projectRoot, '.env') });

import { loadDatabase, initDatabase } from '../database/db-loader.js';
import { getPixUserById, listPixUsers, updatePixUser } from '../database/sqlite-db.js';

const HOMOLOG_OAUTH = 'https://oauth.hm.bb.com.br/oauth/token';
const HOMOLOG_BASE = 'https://api.hm.bb.com.br/pix/v2';
const PROD_OAUTH = 'https://oauth.bb.com.br/oauth/token';
const PROD_BASE = 'https://api-pix.bb.com.br/pix/v2';

async function main() {
  const userId = process.argv[2] ? parseInt(process.argv[2], 10) : 1;

  // Default: produção (igual ao n8n Jornada 3 - Produção). Para homologação defina BB_OAUTH_URL e BB_BASE_URL.
  const oauthUrl = process.env.BB_OAUTH_URL || PROD_OAUTH;
  const baseUrl = process.env.BB_BASE_URL || (oauthUrl.includes('hm.bb.com.br') ? HOMOLOG_BASE : PROD_BASE);
  const basicAuth = process.env.BasicToken || process.env.BB_BASIC_AUTH_BASE64;
  const gwAppKey = process.env.APIKey || process.env.BB_GW_APP_KEY;

  if (!basicAuth || !gwAppKey) {
    console.error('❌ Defina BasicToken (ou BB_BASIC_AUTH_BASE64) e APIKey (ou BB_GW_APP_KEY).');
    console.error('');
    console.error('Exemplo (produção — igual ao n8n Jornada 3 - Produção):');
    console.error('  export BasicToken="<valor base64 do portal BB>"');
    console.error('  export APIKey="<gw_app_key do portal BB>"');
    console.error('  node scripts/set-pix-credentials.js');
    console.error('');
    console.error('Exemplo (homologação):');
    console.error('  export BB_OAUTH_URL="https://oauth.hm.bb.com.br/oauth/token"');
    console.error('  export BB_BASE_URL="https://api.hm.bb.com.br/pix/v2"');
    console.error('  export BasicToken="..." export APIKey="..." node scripts/set-pix-credentials.js');
    process.exit(1);
  }

  await loadDatabase();
  initDatabase();

  const user = getPixUserById(userId);
  if (!user) {
    const users = listPixUsers();
    if (users.length === 0) {
      console.error('❌ Nenhum usuário PIX cadastrado. Crie um usuário antes.');
      process.exit(1);
    }
    console.error(`❌ Usuário PIX com ID ${userId} não encontrado. IDs existentes: ${users.map(u => u.id).join(', ')}`);
    process.exit(1);
  }

  const updates = {
    oauth_url: oauthUrl,
    base_url: baseUrl,
    basic_auth_base64: basicAuth,
    gw_app_key: gwAppKey
  };
  updatePixUser(userId, updates);

  console.log('✅ Credenciais atualizadas com sucesso (fluxo igual ao n8n Jornada 3 - Produção).');
  console.log(`   Usuário ID: ${userId} (${user.nome || 'N/A'})`);
  console.log(`   OAuth URL:  ${oauthUrl}`);
  console.log(`   Base URL:   ${baseUrl}`);
  console.log(`   GW App Key: ${gwAppKey.substring(0, 20)}...`);
  console.log('');
  console.log('Próximo passo: npm run test:oauth');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
