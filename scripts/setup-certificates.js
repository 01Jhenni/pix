#!/usr/bin/env node

/**
 * Script para ajudar a configurar certificados SSL
 * Uso: node scripts/setup-certificates.js
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

// Criar interface de leitura
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function createCertsDir() {
  if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true });
    console.log(`✅ Pasta ${certsDir} criada`);
  }
}

async function setupCertificates() {
  console.log('🔐 Configuração de Certificados SSL do Banco do Brasil\n');
  console.log('Este script ajuda você a configurar os certificados SSL.\n');

  createCertsDir();

  console.log('📋 INSTRUÇÕES:');
  console.log('1. No n8n, acesse: Settings → Credentials → "Vida Ouro" (SSL Certificates)');
  console.log('2. Copie o conteúdo de cada campo\n');

  // CA Certificate
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1️⃣  CA CERTIFICATE (Certificate Authority)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const hasCA = await question('Você tem o CA Certificate? (s/n): ');
  
  if (hasCA.toLowerCase() === 's') {
    console.log('\nCole o conteúdo do CA (incluindo BEGIN/END):');
    console.log('(Digite "FIM" em uma linha vazia para finalizar)\n');
    
    let caContent = '';
    let line;
    while ((line = await question('')) !== 'FIM') {
      caContent += line + '\n';
    }
    
    if (caContent.trim()) {
      fs.writeFileSync(path.join(certsDir, 'ca.pem'), caContent.trim());
      console.log('✅ ca.pem salvo!\n');
    }
  }

  // Certificate
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('2️⃣  CERTIFICATE (Certificado Público)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const hasCert = await question('Você tem o Certificate? (s/n): ');
  
  if (hasCert.toLowerCase() === 's') {
    console.log('\nCole o conteúdo do Certificate (incluindo BEGIN/END):');
    console.log('(Digite "FIM" em uma linha vazia para finalizar)\n');
    
    let certContent = '';
    let line;
    while ((line = await question('')) !== 'FIM') {
      certContent += line + '\n';
    }
    
    if (certContent.trim()) {
      fs.writeFileSync(path.join(certsDir, 'cert.pem'), certContent.trim());
      console.log('✅ cert.pem salvo!\n');
    }
  } else {
    console.log('⚠️  Certificate é obrigatório! Sem ele, a conexão não funcionará.\n');
  }

  // Private Key
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('3️⃣  PRIVATE KEY (Chave Privada)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const hasKey = await question('Você tem o Private Key? (s/n): ');
  
  if (hasKey.toLowerCase() === 's') {
    console.log('\nCole o conteúdo do Private Key (incluindo BEGIN/END):');
    console.log('(Digite "FIM" em uma linha vazia para finalizar)\n');
    
    let keyContent = '';
    let line;
    while ((line = await question('')) !== 'FIM') {
      keyContent += line + '\n';
    }
    
    if (keyContent.trim()) {
      fs.writeFileSync(path.join(certsDir, 'key.pem'), keyContent.trim());
      console.log('✅ key.pem salvo!\n');
    }
  } else {
    console.log('⚠️  Private Key é obrigatório! Sem ele, a conexão não funcionará.\n');
  }

  // Passphrase
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('4️⃣  PASSPHRASE (Senha - Opcional)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Se os certificados estiverem criptografados, você precisa da senha.');
  const hasPassphrase = await question('Você tem a Passphrase? (s/n): ');
  
  if (hasPassphrase.toLowerCase() === 's') {
    const passphrase = await question('Digite a passphrase: ');
    if (passphrase.trim()) {
      fs.writeFileSync(path.join(certsDir, 'passphrase.txt'), passphrase.trim());
      console.log('✅ passphrase.txt salvo!\n');
    }
  } else {
    console.log('ℹ️  Sem passphrase (certificados não criptografados)\n');
  }

  // Verificar arquivos criados
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📁 ARQUIVOS CRIADOS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const files = ['ca.pem', 'cert.pem', 'key.pem', 'passphrase.txt'];
  files.forEach(file => {
    const filePath = path.join(certsDir, file);
    if (fs.existsSync(filePath)) {
      const size = fs.statSync(filePath).size;
      if (file === 'passphrase.txt') {
        console.log(`✅ ${file} (${size} bytes) - ⚠️  SENHA - mantenha seguro!`);
      } else {
        console.log(`✅ ${file} (${size} bytes)`);
      }
    } else {
      if (file === 'passphrase.txt') {
        console.log(`ℹ️  ${file} (opcional - não encontrado)`);
      } else if (file === 'ca.pem') {
        console.log(`ℹ️  ${file} (opcional - não encontrado)`);
      } else {
        console.log(`❌ ${file} (obrigatório - não encontrado)`);
      }
    }
  });

  console.log('\n✅ Configuração concluída!');
  console.log('Reinicie o servidor para aplicar as mudanças.\n');

  rl.close();
}

setupCertificates().catch(console.error);

