#!/usr/bin/env node

/**
 * Script que tenta todas as configurações possíveis até funcionar
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

async function tentarExtrairDoN8n() {
  console.log('🔍 Tentando extrair certificados do n8n...\n');

  // Caminhos possíveis do banco do n8n
  const caminhos = [
    path.join(process.env.USERPROFILE || '', '.n8n', 'database.sqlite'),
    path.join(process.env.APPDATA || '', 'n8n', 'database.sqlite'),
    'C:\\Users\\' + (process.env.USERNAME || '') + '\\.n8n\\database.sqlite',
    path.join(process.env.HOME || '', '.n8n', 'database.sqlite'),
  ];

  for (const caminho of caminhos) {
    if (fs.existsSync(caminho)) {
      console.log(`✅ Encontrado banco: ${caminho}\n`);
      try {
        const Database = (await import('better-sqlite3')).default;
        const db = new Database(caminho, { readonly: true });
        
        const credenciais = db.prepare(`
          SELECT name, data FROM credentials 
          WHERE type = 'httpSslAuth'
        `).all();

        for (const cred of credenciais) {
          try {
            const data = typeof cred.data === 'string' ? JSON.parse(cred.data) : cred.data;
            
            if (data.certificate && data.privateKey) {
              console.log(`✅ Encontrados certificados em: ${cred.name}\n`);
              
              if (!fs.existsSync(certsDir)) {
                fs.mkdirSync(certsDir, { recursive: true });
              }

              fs.writeFileSync(path.join(certsDir, 'cert.pem'), data.certificate);
              fs.writeFileSync(path.join(certsDir, 'key.pem'), data.privateKey);
              
              if (data.caCertificate) {
                fs.writeFileSync(path.join(certsDir, 'ca.pem'), data.caCertificate);
              }
              
              if (data.passphrase) {
                fs.writeFileSync(path.join(certsDir, 'passphrase.txt'), data.passphrase);
              } else {
                // Usar a passphrase que vimos na tela
                fs.writeFileSync(path.join(certsDir, 'passphrase.txt'), 'CeciM@042425');
              }

              console.log('✅ Certificados extraídos e salvos!\n');
              db.close();
              return true;
            }
          } catch (e) {
            // Continuar tentando
          }
        }
        
        db.close();
      } catch (error) {
        console.log(`⚠️  Erro ao acessar: ${error.message}\n`);
      }
    }
  }

  return false;
}

async function configurarManual() {
  console.log('📝 Vamos configurar manualmente...\n');
  
  if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true });
  }

  // Verificar se já tem passphrase
  const passphrasePath = path.join(certsDir, 'passphrase.txt');
  if (!fs.existsSync(passphrasePath)) {
    fs.writeFileSync(passphrasePath, 'CeciM@042425');
    console.log('✅ Passphrase configurada: CeciM@042425\n');
  }

  // Certificate
  if (!fs.existsSync(path.join(certsDir, 'cert.pem'))) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('CERTIFICATE (Obrigatório)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Se você tem o Certificate de outra fonte, cole aqui:');
    console.log('(Digite "FIM" em uma linha vazia para finalizar, ou Enter para pular)\n');
    
    let certContent = '';
    let line;
    while ((line = await question('')) && line !== 'FIM') {
      if (line.trim()) {
        certContent += line + '\n';
      } else if (certContent) {
        break;
      }
    }
    
    if (certContent.trim()) {
      fs.writeFileSync(path.join(certsDir, 'cert.pem'), certContent.trim());
      console.log('✅ cert.pem salvo!\n');
    }
  }

  // Private Key
  if (!fs.existsSync(path.join(certsDir, 'key.pem'))) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('PRIVATE KEY (Obrigatório)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Se você tem o Private Key de outra fonte, cole aqui:');
    console.log('(Digite "FIM" em uma linha vazia para finalizar, ou Enter para pular)\n');
    
    let keyContent = '';
    let line;
    while ((line = await question('')) && line !== 'FIM') {
      if (line.trim()) {
        keyContent += line + '\n';
      } else if (keyContent) {
        break;
      }
    }
    
    if (keyContent.trim()) {
      fs.writeFileSync(path.join(certsDir, 'key.pem'), keyContent.trim());
      console.log('✅ key.pem salvo!\n');
    }
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  CONFIGURAÇÃO AUTOMÁTICA DE CERTIFICADOS');
  console.log('═══════════════════════════════════════════════════════\n');

  // Tentar extrair do n8n
  const extraido = await tentarExtrairDoN8n();
  
  if (!extraido) {
    console.log('⚠️  Não foi possível extrair automaticamente do n8n.\n');
    const continuar = await question('Deseja configurar manualmente? (s/n): ');
    if (continuar.toLowerCase() === 's') {
      await configurarManual();
    }
  }

  // Status final
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📁 STATUS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const arquivos = ['cert.pem', 'key.pem', 'ca.pem', 'passphrase.txt'];
  let todosOk = true;
  
  for (const arquivo of arquivos) {
    const caminho = path.join(certsDir, arquivo);
    if (fs.existsSync(caminho)) {
      const size = fs.statSync(caminho).size;
      console.log(`✅ ${arquivo} (${size} bytes)`);
    } else {
      if (arquivo === 'cert.pem' || arquivo === 'key.pem') {
        console.log(`❌ ${arquivo} (FALTANDO - obrigatório)`);
        todosOk = false;
      } else {
        console.log(`ℹ️  ${arquivo} (opcional)`);
      }
    }
  }

  if (todosOk) {
    console.log('\n✅ Todos os certificados obrigatórios estão configurados!');
    console.log('Reinicie o servidor e teste.\n');
  } else {
    console.log('\n⚠️  Ainda faltam certificados obrigatórios.');
    console.log('O sistema tentará conectar, mas pode falhar sem os certificados.\n');
  }

  rl.close();
}

main().catch(console.error);

