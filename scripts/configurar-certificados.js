#!/usr/bin/env node

/**
 * Script para configurar certificados SSL
 * Uso: node scripts/configurar-certificados.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.join(__dirname, '..');
const certsDir = path.join(rootDir, 'certificates');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('🔐 Configuração de Certificados SSL\n');
  console.log('Você mencionou:');
  console.log('  - cadeia_completa.pem (1-172)');
  console.log('  - chave.pem (1-36)\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true });
  }

  // Certificado (cadeia completa)
  console.log('1️⃣  CERTIFICADO (cadeia_completa.pem)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Cole o conteúdo completo do certificado (incluindo BEGIN/END):');
  console.log('(Digite "FIM" em uma linha vazia para finalizar)\n');
  
  let certContent = '';
  let line;
  while ((line = await question('')) !== 'FIM') {
    certContent += line + '\n';
  }
  
  if (certContent.trim()) {
    // Garantir que tem BEGIN e END
    if (!certContent.includes('BEGIN CERTIFICATE')) {
      certContent = '-----BEGIN CERTIFICATE-----\n' + certContent;
    }
    if (!certContent.includes('END CERTIFICATE')) {
      certContent = certContent.trim() + '\n-----END CERTIFICATE-----\n';
    }
    
    fs.writeFileSync(path.join(certsDir, 'cert.pem'), certContent.trim());
    console.log('✅ cert.pem salvo!\n');
  }

  // Chave privada
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('2️⃣  CHAVE PRIVADA (chave.pem)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Cole o conteúdo completo da chave privada (incluindo BEGIN/END):');
  console.log('(Digite "FIM" em uma linha vazia para finalizar)\n');
  
  let keyContent = '';
  while ((line = await question('')) !== 'FIM') {
    keyContent += line + '\n';
  }
  
  if (keyContent.trim()) {
    // Garantir que tem BEGIN e END
    if (!keyContent.includes('BEGIN PRIVATE KEY') && !keyContent.includes('BEGIN RSA PRIVATE KEY')) {
      if (keyContent.includes('RSA')) {
        keyContent = '-----BEGIN RSA PRIVATE KEY-----\n' + keyContent;
      } else {
        keyContent = '-----BEGIN PRIVATE KEY-----\n' + keyContent;
      }
    }
    if (!keyContent.includes('END PRIVATE KEY') && !keyContent.includes('END RSA PRIVATE KEY')) {
      if (keyContent.includes('RSA')) {
        keyContent = keyContent.trim() + '\n-----END RSA PRIVATE KEY-----\n';
      } else {
        keyContent = keyContent.trim() + '\n-----END PRIVATE KEY-----\n';
      }
    }
    
    fs.writeFileSync(path.join(certsDir, 'key.pem'), keyContent.trim());
    console.log('✅ key.pem salvo!\n');
  }

  // Passphrase (já temos)
  const passphrasePath = path.join(certsDir, 'passphrase.txt');
  if (!fs.existsSync(passphrasePath)) {
    fs.writeFileSync(passphrasePath, 'CeciM@042425');
    console.log('✅ passphrase.txt criado com a senha padrão\n');
  }

  // Verificar arquivos
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📁 ARQUIVOS CRIADOS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const files = ['cert.pem', 'key.pem', 'passphrase.txt'];
  let allOk = true;
  
  files.forEach(file => {
    const filePath = path.join(certsDir, file);
    if (fs.existsSync(filePath)) {
      const size = fs.statSync(filePath).size;
      console.log(`✅ ${file} (${size} bytes)`);
    } else {
      if (file === 'passphrase.txt') {
        console.log(`ℹ️  ${file} (opcional)`);
      } else {
        console.log(`❌ ${file} (FALTANDO)`);
        allOk = false;
      }
    }
  });

  if (allOk) {
    console.log('\n✅ Certificados configurados com sucesso!');
    console.log('Reinicie o servidor para aplicar as mudanças.\n');
  } else {
    console.log('\n⚠️  Ainda faltam certificados obrigatórios.\n');
  }

  rl.close();
}

main().catch(console.error);

