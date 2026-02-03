#!/usr/bin/env node
/**
 * Script de diagnóstico: verifica se BB_OAUTH_TOKEN está sendo lido corretamente
 * 
 * Uso no servidor:
 *   node scripts/check-bb-token.js
 * 
 * Ou via npm:
 *   npm run check:bb-token
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar .env do diretório raiz do projeto (mesma lógica do server.js)
const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env');

console.log('🔍 Diagnóstico BB_OAUTH_TOKEN\n');
console.log(`📁 Diretório do projeto: ${projectRoot}`);
console.log(`📄 Caminho do .env: ${envPath}`);

// Verificar se .env existe
if (fs.existsSync(envPath)) {
  console.log('✅ Arquivo .env encontrado');
  
  // Ler conteúdo do .env (sem processar com dotenv ainda)
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');
  
  // Procurar BB_OAUTH_TOKEN no arquivo
  const tokenLines = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed.startsWith('BB_OAUTH_TOKEN=') && !trimmed.startsWith('#');
  });
  
  if (tokenLines.length === 0) {
    console.log('❌ BB_OAUTH_TOKEN não encontrado no arquivo .env');
  } else if (tokenLines.length > 1) {
    console.log(`⚠️  BB_OAUTH_TOKEN aparece ${tokenLines.length} vezes no .env (deve aparecer apenas 1 vez)`);
    tokenLines.forEach((line, idx) => {
      const value = line.split('=')[1]?.trim() || '(vazio)';
      const preview = value.length > 20 ? value.substring(0, 20) + '...' : value;
      console.log(`   Linha ${idx + 1}: ${preview}`);
    });
  } else {
    const line = tokenLines[0];
    const parts = line.split('=');
    if (parts.length < 2 || !parts[1]?.trim()) {
      console.log('❌ BB_OAUTH_TOKEN está definido mas o valor está vazio');
    } else {
      const value = parts.slice(1).join('=').trim(); // Suporta valores com '=' no token
      const preview = value.length > 30 ? value.substring(0, 30) + '...' : value;
      console.log(`✅ BB_OAUTH_TOKEN encontrado no .env (valor: ${preview})`);
    }
  }
} else {
  console.log('❌ Arquivo .env não encontrado');
}

// Agora carregar com dotenv (mesma lógica do server.js)
dotenv.config({ path: envPath });

// Verificar process.env após dotenv
console.log('\n🔬 Verificando process.env após dotenv.config():');
const token = process.env.BB_OAUTH_TOKEN;

if (!token) {
  console.log('❌ process.env.BB_OAUTH_TOKEN está undefined');
  console.log('\n💡 Possíveis causas:');
  console.log('   1. Variável não está no .env ou está com nome errado');
  console.log('   2. Valor está vazio ou tem espaços extras');
  console.log('   3. Arquivo .env está em outro diretório');
} else if (!token.trim()) {
  console.log('⚠️  process.env.BB_OAUTH_TOKEN está definido mas vazio (apenas espaços)');
} else {
  const preview = token.length > 30 ? token.substring(0, 30) + '...' : token;
  console.log(`✅ process.env.BB_OAUTH_TOKEN está definido: ${preview}`);
  console.log(`   Tamanho: ${token.length} caracteres`);
}

// Verificar variáveis relacionadas
console.log('\n📋 Outras variáveis BB (para referência):');
const bbVars = ['BB_OAUTH_TOKEN', 'BasicToken', 'BB_BASIC_AUTH_BASE64', 'APIKey', 'BB_GW_APP_KEY', 'BB_OAUTH_URL', 'BB_BASE_URL'];
bbVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    const preview = value.length > 30 ? value.substring(0, 30) + '...' : value;
    console.log(`   ${varName}: ${preview}`);
  }
});

console.log('\n💡 Dica: Se BB_OAUTH_TOKEN não aparecer aqui, o PM2 também não vai enxergar.');
console.log('   Certifique-se de que o .env está na mesma pasta do server.js');
console.log('   e reinicie com: pm2 restart pix-system --update-env');
