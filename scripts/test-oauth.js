#!/usr/bin/env node

/**
 * Script para testar conexão OAuth com as credenciais configuradas
 * Uso: node scripts/test-oauth.js [pixUserId]
 */

import { loadDatabase, initDatabase } from '../database/db-loader.js';
import { getPixUserById, listPixUsers } from '../database/sqlite-db.js';
import axios from 'axios';
import https from 'https';
import { loadSSLCertificates } from '../services/pixService.js';

async function testOAuth(pixUserId = null) {
  try {
    console.log('🔄 Inicializando banco de dados...');
    await loadDatabase();
    initDatabase();
    console.log('✅ Banco de dados inicializado\n');

    // Obter usuário PIX
    let user;
    if (pixUserId) {
      user = getPixUserById(pixUserId);
      if (!user) {
        console.error(`❌ Usuário PIX com ID ${pixUserId} não encontrado`);
        process.exit(1);
      }
    } else {
      const users = listPixUsers();
      if (users.length === 0) {
        console.error('❌ Nenhum usuário PIX cadastrado');
        process.exit(1);
      }
      user = users[0];
      console.log(`ℹ️  Usando primeiro usuário encontrado (ID: ${user.id})\n`);
    }

    console.log('📋 Configurações do usuário:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`ID: ${user.id}`);
    console.log(`Nome: ${user.nome || 'N/A'}`);
    console.log(`CNPJ: ${user.cnpj || 'N/A'}`);
    console.log(`Ativo: ${user.ativo ? 'Sim' : 'Não'}`);
    console.log(`OAuth URL: ${user.oauth_url || 'NÃO CONFIGURADO'}`);
    console.log(`Base URL: ${user.base_url || 'NÃO CONFIGURADO'}`);
    console.log(`GW App Key: ${user.gw_app_key ? `${user.gw_app_key.substring(0, 20)}...` : 'NÃO CONFIGURADO'}`);
    console.log(`Basic Auth: ${user.basic_auth_base64 ? `${user.basic_auth_base64.substring(0, 30)}...` : 'NÃO CONFIGURADO'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Validações
    if (!user.ativo) {
      console.error('❌ Usuário está inativo');
      process.exit(1);
    }

    if (!user.oauth_url) {
      console.error('❌ OAuth URL não configurada');
      process.exit(1);
    }

    if (!user.basic_auth_base64) {
      console.error('❌ Basic Auth não configurada');
      process.exit(1);
    }

    if (!user.gw_app_key) {
      console.error('❌ GW App Key não configurada');
      process.exit(1);
    }

    // Carregar certificados SSL
    console.log('🔐 Carregando certificados SSL...');
    let httpsAgent;
    try {
      const sslCerts = loadSSLCertificates();
      if (sslCerts && sslCerts.cert && sslCerts.key) {
        httpsAgent = new https.Agent({
          cert: sslCerts.cert,
          key: sslCerts.key,
          ca: sslCerts.ca,
          passphrase: sslCerts.passphrase,
          rejectUnauthorized: true
        });
        console.log('✅ Certificados SSL carregados');
      } else {
        console.warn('⚠️  Certificados SSL não encontrados. Tentando sem certificados...');
        httpsAgent = new https.Agent({
          rejectUnauthorized: false
        });
      }
    } catch (error) {
      console.warn('⚠️  Erro ao carregar certificados SSL:', error.message);
      console.warn('   Tentando sem certificados...');
      httpsAgent = new https.Agent({
        rejectUnauthorized: false
      });
    }
    console.log('');

    // Testar requisição OAuth
    console.log('🌐 Testando conexão OAuth...');
    console.log(`URL: ${user.oauth_url}`);
    console.log('');

    try {
      const response = await axios.post(
        user.oauth_url,
        new URLSearchParams({
          grant_type: 'client_credentials',
          scope: 'rec.write rec.read payloadlocationrec.write payloadlocationrec.read cobr.write cobr.read cob.write cob.read'
        }),
        {
          headers: {
            'Authorization': `Basic ${user.basic_auth_base64}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          httpsAgent: httpsAgent,
          timeout: 30000
        }
      );

      if (response.data && response.data.access_token) {
        const token = response.data.access_token;
        console.log('✅ SUCESSO! Token OAuth obtido com sucesso!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Token (início): ${token.substring(0, 30)}...`);
        console.log(`Tipo: ${response.data.token_type || 'Bearer'}`);
        console.log(`Expira em: ${response.data.expires_in || 'N/A'} segundos`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n💡 Para usar quando der 429, defina no servidor:');
        console.log(`   BB_OAUTH_TOKEN=${token}`);
        console.log('\n✅ Configurações estão corretas!');
      } else {
        console.error('❌ Resposta inesperada:', response.data);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ ERRO ao obter token OAuth');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      if (error.response) {
        console.error(`Status: ${error.response.status} ${error.response.statusText}`);
        console.error(`Dados:`, JSON.stringify(error.response.data, null, 2));
        
        if (error.response.status === 401) {
          console.error('\n💡 Problema: Credenciais inválidas');
          console.error('   Verifique se basic_auth_base64 está correto');
        } else if (error.response.status === 403) {
          console.error('\n💡 Problema: Acesso negado');
          console.error('   Verifique as permissões da aplicação no Banco do Brasil');
        } else if (error.response.status === 404) {
          console.error('\n💡 Problema: URL não encontrada');
          console.error('   Verifique se a OAuth URL está correta');
        } else if (error.response.status === 400) {
          const data = error.response.data || {};
          const desc = (data.error_description || data.error || '').toLowerCase();
          if (desc.includes('software não cadastrado') || desc.includes('não cadastrado') || data.error === 'invalid_client') {
            console.error('\n💡 Problema: Software não cadastrado (invalid_client)');
            console.error('   1. Certificados SSL do cliente: o BB homologação identifica o "software" pelo certificado.');
            console.error('      Coloque cert.pem e key.pem (fornecidos pelo BB) em: certificates/');
            console.error('   2. No portal do BB, confirme que a aplicação está cadastrada e ativa para homologação.');
            console.error('   Veja RESOLVER_PERMISSOES_BB.md → "Software não cadastrado"');
          } else {
            console.error('\n💡 Problema: Requisição inválida (400)');
            console.error('   Verifique o payload e os scopes solicitados.');
          }
        }
      } else if (error.code) {
        console.error(`Código: ${error.code}`);
        console.error(`Mensagem: ${error.message}`);
        
        if (error.code === 'EPROTO' || error.code.includes('CERT')) {
          console.error('\n💡 Problema: Erro de certificado SSL');
          console.error('   Os certificados SSL são obrigatórios para a API do Banco do Brasil');
          console.error('   Verifique se os certificados estão em /root/pix/certificates/');
        } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
          console.error('\n💡 Problema: Não foi possível conectar ao servidor');
          console.error('   Verifique a conectividade e a URL OAuth');
        }
      } else {
        console.error(`Erro: ${error.message}`);
      }
      
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    process.exit(1);
  }
}

// Executar
const pixUserId = process.argv[2] ? parseInt(process.argv[2]) : null;
testOAuth(pixUserId);

