#!/usr/bin/env node

/**
 * Script rápido para configurar certificados SSL
 * Aceita arquivos ou conteúdo colado
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.join(__dirname, '..');
const certsDir = path.join(rootDir, 'certificates');

// Criar pasta se não existir
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
}

console.log('🔐 Configuração Rápida de Certificados SSL\n');
console.log('Você mencionou:');
console.log('  - cadeia_completa.pem (linhas 1-172)');
console.log('  - chave.pem (linhas 1-36)\n');

// Verificar se os arquivos já existem no diretório atual
const currentDir = process.cwd();
const cadeiaPath = path.join(currentDir, 'cadeia_completa.pem');
const chavePath = path.join(currentDir, 'chave.pem');

let certContent = null;
let keyContent = null;

// Tentar ler arquivos se existirem
if (fs.existsSync(cadeiaPath)) {
  console.log('✅ Encontrado cadeia_completa.pem no diretório atual');
  certContent = fs.readFileSync(cadeiaPath, 'utf8');
}

if (fs.existsSync(chavePath)) {
  console.log('✅ Encontrado chave.pem no diretório atual');
  keyContent = fs.readFileSync(chavePath, 'utf8');
}

// Se não encontrou, verificar argumentos da linha de comando
if (!certContent && process.argv[2]) {
  const argPath = path.resolve(process.argv[2]);
  if (fs.existsSync(argPath)) {
    certContent = fs.readFileSync(argPath, 'utf8');
    console.log(`✅ Lendo certificado de: ${argPath}`);
  }
}

if (!keyContent && process.argv[3]) {
  const argPath = path.resolve(process.argv[3]);
  if (fs.existsSync(argPath)) {
    keyContent = fs.readFileSync(argPath, 'utf8');
    console.log(`✅ Lendo chave de: ${argPath}`);
  }
}

// Salvar certificado
if (certContent) {
  // Garantir formato PEM correto
  let cert = certContent.trim();
  if (!cert.includes('BEGIN CERTIFICATE')) {
    cert = '-----BEGIN CERTIFICATE-----\n' + cert;
  }
  if (!cert.includes('END CERTIFICATE')) {
    cert = cert + '\n-----END CERTIFICATE-----\n';
  }
  
  fs.writeFileSync(path.join(certsDir, 'cert.pem'), cert);
  console.log('✅ cert.pem salvo!');
} else {
  console.log('⚠️  Certificado não encontrado. Coloque cadeia_completa.pem no diretório ou use:');
  console.log('   node scripts/setup-ssl-quick.js caminho/para/cadeia_completa.pem caminho/para/chave.pem');
}

// Salvar chave
if (keyContent) {
  // Garantir formato PEM correto
  let key = keyContent.trim();
  if (!key.includes('BEGIN') && !key.includes('PRIVATE KEY') && !key.includes('RSA')) {
    key = '-----BEGIN PRIVATE KEY-----\n' + key;
  }
  if (!key.includes('BEGIN PRIVATE KEY') && !key.includes('BEGIN RSA PRIVATE KEY')) {
    if (key.includes('RSA')) {
      key = '-----BEGIN RSA PRIVATE KEY-----\n' + key;
    } else {
      key = '-----BEGIN PRIVATE KEY-----\n' + key;
    }
  }
  if (!key.includes('END PRIVATE KEY') && !key.includes('END RSA PRIVATE KEY')) {
    if (key.includes('RSA')) {
      key = key + '\n-----END RSA PRIVATE KEY-----\n';
    } else {
      key = key + '\n-----END PRIVATE KEY-----\n';
    }
  }
  
  fs.writeFileSync(path.join(certsDir, 'key.pem'), key);
  console.log('✅ key.pem salvo!');
} else {
  console.log('⚠️  Chave não encontrada. Coloque chave.pem no diretório ou use:');
  console.log('   node scripts/setup-ssl-quick.js caminho/para/cadeia_completa.pem caminho/para/chave.pem');
}

// Passphrase
const passphrasePath = path.join(certsDir, 'passphrase.txt');
if (!fs.existsSync(passphrasePath)) {
  fs.writeFileSync(passphrasePath, 'CeciM@042425');
  console.log('✅ passphrase.txt criado');
}

// Verificar
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📁 STATUS:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const certPath = path.join(certsDir, 'cert.pem');
const keyPath = path.join(certsDir, 'key.pem');

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  const certSize = fs.statSync(certPath).size;
  const keySize = fs.statSync(keyPath).size;
  console.log(`✅ cert.pem (${certSize} bytes)`);
  console.log(`✅ key.pem (${keySize} bytes)`);
  console.log(`✅ passphrase.txt`);
  console.log('\n✅ Certificados configurados com sucesso!');
  console.log('Reinicie o servidor para aplicar.\n');
} else {
  console.log('❌ Certificados incompletos. Configure manualmente ou use npm run setup-ssl\n');
}

