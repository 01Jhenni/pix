#!/usr/bin/env node

/**
 * Script para extrair certificados SSL do banco de dados do n8n
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

async function extrairDoBancoN8n() {
  console.log('🔍 Extração de Certificados do n8n\n');
  console.log('Este script ajuda a extrair certificados do banco de dados do n8n.\n');

  // Tentar localizar banco do n8n
  const possiveisCaminhos = [
    path.join(process.env.HOME || process.env.USERPROFILE || '', '.n8n', 'database.sqlite'),
    path.join(process.env.APPDATA || '', 'n8n', 'database.sqlite'),
    'C:\\Users\\' + (process.env.USERNAME || '') + '\\.n8n\\database.sqlite',
    './n8n/database.sqlite',
    './database.sqlite'
  ];

  console.log('Procurando banco de dados do n8n...\n');
  let dbPath = null;
  
  for (const caminho of possiveisCaminhos) {
    if (fs.existsSync(caminho)) {
      dbPath = caminho;
      console.log(`✅ Encontrado: ${caminho}\n`);
      break;
    }
  }

  if (!dbPath) {
    console.log('❌ Banco de dados do n8n não encontrado automaticamente.\n');
    const caminhoManual = await question('Digite o caminho completo do database.sqlite do n8n (ou Enter para pular): ');
    if (caminhoManual.trim() && fs.existsSync(caminhoManual.trim())) {
      dbPath = caminhoManual.trim();
    } else {
      console.log('\n⚠️  Não foi possível acessar o banco de dados.');
      console.log('Você pode tentar extrair manualmente:\n');
      console.log('1. Abra o banco de dados do n8n');
      console.log('2. Execute: SELECT name, data FROM credentials WHERE type = \'httpSslAuth\';');
      console.log('3. Copie o JSON do campo data');
      console.log('4. Use este script novamente ou configure manualmente\n');
      return false;
    }
  }

  try {
    // Tentar usar better-sqlite3 se disponível
    let Database;
    try {
      Database = (await import('better-sqlite3')).default;
    } catch (e) {
      console.log('⚠️  better-sqlite3 não disponível. Instalando...');
      console.log('Execute: npm install better-sqlite3');
      return false;
    }

    const db = new Database(dbPath, { readonly: true });
    
    console.log('Buscando credenciais SSL...\n');
    const credenciais = db.prepare(`
      SELECT name, data FROM credentials 
      WHERE type = 'httpSslAuth'
    `).all();

    if (credenciais.length === 0) {
      console.log('❌ Nenhuma credencial SSL encontrada no banco de dados.\n');
      db.close();
      return false;
    }

    console.log(`✅ Encontradas ${credenciais.length} credencial(is) SSL:\n`);
    credenciais.forEach((cred, index) => {
      console.log(`${index + 1}. ${cred.name}`);
    });

    console.log('\nExtraindo certificados...\n');

    for (const cred of credenciais) {
      try {
        const data = JSON.parse(cred.data);
        
        if (data.certificate || data.privateKey) {
          console.log(`\n📋 Credencial: ${cred.name}`);
          
          if (data.certificate) {
            const certPath = path.join(certsDir, 'cert.pem');
            fs.writeFileSync(certPath, data.certificate);
            console.log(`  ✅ Certificate salvo: cert.pem`);
          }
          
          if (data.privateKey) {
            const keyPath = path.join(certsDir, 'key.pem');
            fs.writeFileSync(keyPath, data.privateKey);
            console.log(`  ✅ Private Key salvo: key.pem`);
          }
          
          if (data.caCertificate) {
            const caPath = path.join(certsDir, 'ca.pem');
            fs.writeFileSync(caPath, data.caCertificate);
            console.log(`  ✅ CA Certificate salvo: ca.pem`);
          }
          
          if (data.passphrase) {
            const passPath = path.join(certsDir, 'passphrase.txt');
            fs.writeFileSync(passPath, data.passphrase);
            console.log(`  ✅ Passphrase salva: passphrase.txt`);
          }
        }
      } catch (error) {
        console.log(`  ⚠️  Erro ao processar ${cred.name}: ${error.message}`);
      }
    }

    db.close();
    console.log('\n✅ Extração concluída!\n');
    return true;
  } catch (error) {
    console.error('❌ Erro ao acessar banco de dados:', error.message);
    return false;
  }
}

async function configurarManual() {
  console.log('\n📝 Configuração Manual de Certificados\n');
  console.log('Se você tem os certificados em outro lugar, vamos configurá-los agora.\n');

  if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true });
  }

  // Certificate
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1️⃣  CERTIFICATE (Obrigatório)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const temCert = await question('Você tem o Certificate? (s/n): ');
  
  if (temCert.toLowerCase() === 's') {
    console.log('\nCole o Certificate (incluindo BEGIN/END):');
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
  }

  // Private Key
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('2️⃣  PRIVATE KEY (Obrigatório)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const temKey = await question('Você tem o Private Key? (s/n): ');
  
  if (temKey.toLowerCase() === 's') {
    console.log('\nCole o Private Key (incluindo BEGIN/END):');
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
  }

  // Verificar
  const temCert = fs.existsSync(path.join(certsDir, 'cert.pem'));
  const temKey = fs.existsSync(path.join(certsDir, 'key.pem'));
  
  if (temCert && temKey) {
    console.log('✅ Certificados configurados com sucesso!\n');
    return true;
  } else {
    console.log('⚠️  Certificados incompletos. Certifique-se de ter cert.pem e key.pem\n');
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  EXTRATOR DE CERTIFICADOS SSL DO N8N');
  console.log('═══════════════════════════════════════════════════════\n');

  if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true });
  }

  // Tentar extrair do banco
  const extraido = await extrairDoBancoN8n();
  
  if (!extraido) {
    const continuar = await question('\nDeseja configurar manualmente? (s/n): ');
    if (continuar.toLowerCase() === 's') {
      await configurarManual();
    }
  }

  // Verificar status final
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📁 STATUS FINAL:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const arquivos = {
    'cert.pem': 'Certificate (obrigatório)',
    'key.pem': 'Private Key (obrigatório)',
    'ca.pem': 'CA Certificate (opcional)',
    'passphrase.txt': 'Passphrase (opcional)'
  };

  for (const [arquivo, descricao] of Object.entries(arquivos)) {
    const caminho = path.join(certsDir, arquivo);
    if (fs.existsSync(caminho)) {
      const size = fs.statSync(caminho).size;
      console.log(`✅ ${arquivo} - ${descricao} (${size} bytes)`);
    } else {
      if (arquivo.includes('obrigatório')) {
        console.log(`❌ ${arquivo} - ${descricao} (FALTANDO)`);
      } else {
        console.log(`ℹ️  ${arquivo} - ${descricao} (não encontrado)`);
      }
    }
  }

  console.log('\n✅ Processo concluído!');
  console.log('Reinicie o servidor para aplicar as mudanças.\n');

  rl.close();
}

main().catch(console.error);

