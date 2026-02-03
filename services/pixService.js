// Importar primeiro para desabilitar SSL
import '../init-ssl.js';

import axios from 'axios';
import crypto from 'crypto';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import { getPixUserById, createTransaction, updateTransactionByTxid } from '../database/sqlite-db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Garantir que .env seja carregado pela pasta do projeto (não depende do server.js nem do cwd do PM2)
const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env');
dotenv.config({ path: envPath });
// Log único ao carregar: confirma se BB_OAUTH_TOKEN será usado (evita 429)
if (process.env.BB_OAUTH_TOKEN && process.env.BB_OAUTH_TOKEN.trim()) {
  console.log('✅ [pixService] BB_OAUTH_TOKEN carregado do .env — OAuth não será chamado.');
} else {
  console.log('⚠️  [pixService] BB_OAUTH_TOKEN não encontrado. .env em:', envPath);
}

// Cache de tokens OAuth por usuário
const tokenCache = new Map();

// Função para carregar certificados SSL se existirem
export function loadSSLCertificates() {
  // PRIORIDADE 1: Tentar ler de variáveis de ambiente (útil para Terminus/Cloud)
  if (process.env.SSL_CERT && process.env.SSL_KEY) {
    console.log('✅ Certificados SSL encontrados nas variáveis de ambiente!');
    try {
      const cert = process.env.SSL_CERT;
      const key = process.env.SSL_KEY;
      const ca = process.env.SSL_CA || undefined;
      const passphrase = process.env.SSL_PASSPHRASE || undefined;

      if (passphrase) {
        console.log('   Usando passphrase para descriptografar certificados');
      }

      return {
        cert,
        key,
        ca,
        passphrase,
        rejectUnauthorized: !!ca // Se tiver CA, valida; senão, não valida
      };
    } catch (error) {
      console.error('⚠️  Erro ao processar certificados SSL das variáveis de ambiente:', error.message);
      // Continuar para tentar arquivos locais
    }
  }

  // PRIORIDADE 2: Tentar ler de arquivos locais (tentar projeto atual e depois cwd)
  const possibleDirs = [
    path.join(__dirname, '..', 'certificates'),
    path.join(process.cwd(), 'certificates'),
    path.join(process.cwd(), 'pix', 'certificates')
  ];
  let certsDir = possibleDirs[0];
  let certPath = path.join(certsDir, 'cert.pem');
  let keyPath = path.join(certsDir, 'key.pem');
  if (!fs.existsSync(keyPath)) keyPath = path.join(certsDir, 'chave.pem');
  for (const dir of possibleDirs) {
    const c = path.join(dir, 'cert.pem');
    const k = fs.existsSync(path.join(dir, 'key.pem')) ? path.join(dir, 'key.pem') : path.join(dir, 'chave.pem');
    if (fs.existsSync(c) && fs.existsSync(k)) {
      certsDir = dir;
      certPath = c;
      keyPath = k;
      break;
    }
  }
  const caPath = path.join(certsDir, 'ca.pem');
  const passphrasePath = path.join(certsDir, 'passphrase.txt');

  const hasCert = fs.existsSync(certPath);
  const hasKey = fs.existsSync(keyPath);
  const hasCA = fs.existsSync(caPath);
  const hasPassphrase = fs.existsSync(passphrasePath);

  if (hasCert && hasKey) {
    console.log('✅ Certificados SSL encontrados em arquivos locais! Usando certificados do cliente.');
    console.log(`   Cert: ${certPath}`);
    console.log(`   Key:  ${keyPath}`);
    try {
      const cert = fs.readFileSync(certPath, 'utf8');
      const key = fs.readFileSync(keyPath, 'utf8');
      const ca = hasCA ? fs.readFileSync(caPath, 'utf8') : undefined;
      const passphrase = hasPassphrase ? fs.readFileSync(passphrasePath, 'utf8').trim() : undefined;

      if (passphrase) {
        console.log('   Usando passphrase para descriptografar certificados');
      }

      return {
        cert,
        key,
        ca,
        passphrase,
        rejectUnauthorized: hasCA ? true : false // Se tiver CA, valida; senão, não valida
      };
    } catch (error) {
      console.error('⚠️  Erro ao ler certificados SSL:', error.message);
      return null;
    }
  } else {
    console.log('⚠️  Certificados SSL não encontrados. Usando modo sem certificado (pode falhar na API do BB).');
    console.log('   Pastas verificadas (coloque cert.pem e key.pem em uma delas):');
    possibleDirs.forEach((d) => console.log('   - ' + path.resolve(d)));
    console.log('   OU defina no servidor: SSL_CERT e SSL_KEY (conteúdo dos arquivos, ex.: variáveis no Terminus).');
    console.log('   Use os certificados da credencial "Vida Ouro" do n8n para gerar QR Code.');
    return null;
  }
}

// Carregar certificados uma vez
const sslCerts = loadSSLCertificates();

// Função para criar agente HTTPS
function createHttpsAgent() {
  if (sslCerts) {
    // Usar certificados do cliente
    const agentConfig = {
      cert: sslCerts.cert,
      key: sslCerts.key,
      ca: sslCerts.ca,
      rejectUnauthorized: sslCerts.rejectUnauthorized,
      keepAlive: true,
      keepAliveMsecs: 1000,
      maxSockets: 50,
      secureProtocol: 'TLSv1_2_method'
    };

    // Adicionar passphrase se existir
    if (sslCerts.passphrase) {
      agentConfig.passphrase = sslCerts.passphrase;
    }

    return new https.Agent(agentConfig);
  } else {
    // Modo sem certificado (pode não funcionar)
    return new https.Agent({
      rejectUnauthorized: false,
      keepAlive: true,
      keepAliveMsecs: 1000,
      maxSockets: 50,
      secureProtocol: 'TLSv1_2_method',
      ciphers: 'DEFAULT:@SECLEVEL=1'
    });
  }
}

// Agente HTTPS reutilizável
const httpsAgent = createHttpsAgent();

// Função auxiliar para tentar múltiplas configurações SSL em caso de erro
// IMPORTANTE: Tentar COM certificado do cliente PRIMEIRO (BB exige mTLS e rejeita sem cert)
async function tryWithMultipleSSLConfigs(requestFn) {
  let withCert = [];
  if (sslCerts) {
    const base = { cert: sslCerts.cert, key: sslCerts.key, rejectUnauthorized: false, secureProtocol: 'TLSv1_2_method' };
    if (sslCerts.passphrase) base.passphrase = sslCerts.passphrase;
    if (sslCerts.ca) base.ca = sslCerts.ca;
    withCert = [
      { ...base },
      { ...base, secureProtocol: 'TLS_method' },
      { cert: sslCerts.cert, key: sslCerts.key, rejectUnauthorized: false, secureProtocol: 'TLSv1_2_method' },
      ...(sslCerts.ca ? [{ cert: sslCerts.cert, key: sslCerts.key, ca: sslCerts.ca, rejectUnauthorized: true, secureProtocol: 'TLSv1_2_method' }] : [])
    ];
  }
  const withoutCert = [
    { rejectUnauthorized: false, secureProtocol: 'TLSv1_2_method' },
    { rejectUnauthorized: false, secureProtocol: 'TLS_method' }
  ];
  const sslConfigs = [...withCert, ...withoutCert];

  for (let i = 0; i < sslConfigs.length; i++) {
    try {
      console.log(`Tentativa SSL ${i + 1}/${sslConfigs.length}...`);
      const result = await requestFn(new https.Agent(sslConfigs[i]));
      console.log(`✅ Sucesso na tentativa ${i + 1}!`);
      return result;
    } catch (retryError) {
      const retryMsg = retryError.message || '';
      // Se não for erro SSL, propagar o erro
      if (!retryMsg.includes('SSL') && !retryMsg.includes('certificate') && !retryMsg.includes('EPROTO') && !retryMsg.includes('bad certificate')) {
        throw retryError;
      }
      // Se for a última tentativa, lançar erro
      if (i === sslConfigs.length - 1) {
        throw new Error(
          `Erro de certificado SSL após ${sslConfigs.length} tentativas. ` +
          `A API do BB rejeitou o certificado do cliente (alert 42). ` +
          `Use os MESMOS arquivos da credencial SSL do n8n (ex.: Vida Ouro): cert.pem e chave.pem em certificates/. ` +
          `Confirme que o ambiente (produção/homologação) e o gw_app_key batem com a aplicação do certificado. ` +
          `Detalhes: ${retryError.message}`
        );
      }
    }
  }
}

// Configurar axios para usar o agente HTTPS globalmente
axios.defaults.httpsAgent = httpsAgent;
axios.defaults.timeout = 30000;

// Interceptor para garantir que todas as requisições usem o agente correto
axios.interceptors.request.use((config) => {
  if (!config.httpsAgent) {
    config.httpsAgent = httpsAgent;
  }
  // Não sobrescrever se já tiver certificados configurados
  if (sslCerts && config.httpsAgent && config.httpsAgent.options) {
    // Manter configurações de certificado
    if (!config.httpsAgent.options.cert) {
      config.httpsAgent.options.cert = sslCerts.cert;
    }
    if (!config.httpsAgent.options.key) {
      config.httpsAgent.options.key = sslCerts.key;
    }
    if (sslCerts.ca && !config.httpsAgent.options.ca) {
      config.httpsAgent.options.ca = sslCerts.ca;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

/**
 * Obtém token OAuth para um usuário PIX
 * @param {number} pixUserId - ID do usuário PIX
 * @param {string} [overrideToken] - Token opcional enviado na requisição (evita chamar OAuth quando 429)
 */
export async function getOAuthToken(pixUserId, overrideToken) {
  const user = getPixUserById(pixUserId);
  
  if (!user) {
    throw new Error('Usuário PIX não encontrado ou inativo');
  }

  if (!user.ativo) {
    throw new Error('Usuário PIX está inativo');
  }

  // Token enviado na requisição (frontend): usa direto e evita 429
  if (overrideToken && String(overrideToken).trim()) {
    const token = String(overrideToken).trim();
    tokenCache.set(pixUserId, { token, expiresAt: Date.now() + 50 * 60 * 1000 });
    return token;
  }

  // Validar campos obrigatórios
  if (!user.oauth_url) {
    throw new Error('URL OAuth não configurada para este usuário PIX');
  }

  if (!user.basic_auth_base64) {
    throw new Error('Credencial Basic Auth não configurada para este usuário PIX');
  }

  if (!user.gw_app_key) {
    throw new Error('GW App Key não configurada para este usuário PIX');
  }

  // Verificar cache
  const cached = tokenCache.get(pixUserId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.token;
  }

  // Token manual (env/.env): evita chamar OAuth quando 429 bloqueia (ex.: colar token do n8n ou de um test:oauth que funcionou)
  const manualToken = process.env.BB_OAUTH_TOKEN;
  if (manualToken && manualToken.trim()) {
    const tokenPreview = manualToken.length > 20 ? manualToken.substring(0, 20) + '...' : manualToken;
    console.log(`ℹ️  Usando token OAuth da variável BB_OAUTH_TOKEN (${manualToken.length} chars) - não chama oauth/token.`);
    tokenCache.set(pixUserId, { token: manualToken.trim(), expiresAt: Date.now() + 50 * 60 * 1000 }); // 50 min
    return manualToken.trim();
  }
  // Log detalhado para debug
  const envKeys = Object.keys(process.env).filter(k => k.includes('BB') || k.includes('OAUTH'));
  console.log(`⚠️  BB_OAUTH_TOKEN não definido neste processo (process.env.BB_OAUTH_TOKEN=${manualToken || 'undefined'}); chamando OAuth (pode dar 429).`);
  console.log(`   Variáveis BB encontradas no processo: ${envKeys.length > 0 ? envKeys.join(', ') : 'nenhuma'}`);
  console.log('   Defina BB_OAUTH_TOKEN no .env (mesma pasta do server.js) ou no PM2 ecosystem.config.cjs e reinicie.');

  const oauthPost = () => axios.post(
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

  // Retry em 429 (rate limit / Cloudflare): mais tentativas e espera maior para não bloquear testes
  const backoffSeconds = [0, 15, 30, 60, 120];
  let lastError;
  for (let attempt = 0; attempt < backoffSeconds.length; attempt++) {
    if (attempt > 0) {
      const wait = backoffSeconds[attempt];
      console.log(`⏳ 429 rate limit: aguardando ${wait}s antes da tentativa ${attempt + 1}/${backoffSeconds.length}...`);
      await new Promise(r => setTimeout(r, wait * 1000));
    }
    try {
      const response = await oauthPost();
      const token = response.data.access_token;
      const expiresIn = response.data.expires_in || 3600;
      tokenCache.set(pixUserId, { token, expiresAt: Date.now() + (expiresIn - 300) * 1000 });
      return token;
    } catch (error) {
      lastError = error;
      if (error.response?.status === 429 && attempt < backoffSeconds.length - 1) continue;
      break;
    }
  }

  const error = lastError;
  const statusCode = error.response?.status;
    const contentType = error.response?.headers?.['content-type'] || '';
    
    console.error('Erro ao obter token OAuth:', {
      message: error.message,
      code: error.code,
      status: statusCode,
      statusText: error.response?.statusText,
      contentType: contentType
    });
    
    // Capturar mensagem de erro de forma mais completa
    let errorMsg = '';
    
    // Se a resposta for HTML (página de erro do BB)
    if (contentType.includes('text/html') || contentType.includes('text/plain')) {
      const htmlResponse = typeof error.response?.data === 'string' 
        ? error.response.data 
        : String(error.response?.data || '');
      
      // Tentar extrair mensagem de erro do HTML
      const htmlMatch = htmlResponse.match(/\[ERR[^\]]+\]/i) || 
                        htmlResponse.match(/Acesso negado/i) ||
                        htmlResponse.match(/Forbidden/i);
      
      if (htmlMatch) {
        errorMsg = `Resposta HTML do servidor: ${htmlMatch[0]}`;
      } else {
        // Limitar tamanho do HTML para não poluir o log
        const htmlPreview = htmlResponse.substring(0, 200).replace(/\s+/g, ' ');
        errorMsg = `Servidor retornou HTML ao invés de JSON. Primeiros caracteres: ${htmlPreview}...`;
      }
    } else if (error.response?.data) {
      // Resposta JSON normal
      if (typeof error.response.data === 'string') {
        errorMsg = error.response.data;
      } else if (error.response.data.error_description) {
        errorMsg = error.response.data.error_description;
      } else if (error.response.data.message) {
        errorMsg = error.response.data.message;
      } else if (error.response.data.error) {
        errorMsg = error.response.data.error;
      } else {
        errorMsg = JSON.stringify(error.response.data);
      }
    } else if (error.message) {
      errorMsg = error.message;
    } else {
      errorMsg = 'Erro desconhecido ao obter token OAuth';
    }
    
    const errorCode = error.code || '';
    const errorString = String(error.message || '');
    
    // Detectar erro de certificado SSL (bad certificate = alert 42)
    const isSSLError = errorMsg.includes('SSL') || errorMsg.includes('certificate') || errorMsg.includes('bad certificate') || 
        errorCode.includes('CERT') || errorCode.includes('UNABLE_TO_VERIFY_LEAF_SIGNATURE') ||
        errorString.includes('EPROTO') || errorString.includes('0A000412') || errorString.includes('sslv3 alert bad certificate') ||
        errorString.includes('SSL alert number 42') || errorCode === 'EPROTO' || errorCode === 'CERT_HAS_EXPIRED';
    
    if (isSSLError) {
      console.error('⚠️  Erro SSL detectado: bad certificate (alert 42)');
      console.error('   A API do BB está rejeitando a conexão por falta de certificado cliente.');
      console.error('   Tentando diferentes configurações SSL...');
      
      // Tentar com diferentes configurações
      const configs = [
        { rejectUnauthorized: false, secureProtocol: 'TLSv1_2_method' },
        { rejectUnauthorized: false, secureProtocol: 'TLSv1_method' },
        { rejectUnauthorized: false }
      ];
      
      for (const config of configs) {
        try {
          const retryResponse = await axios.post(
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
              httpsAgent: new https.Agent(config),
              timeout: 30000
            }
          );
          
          console.log('✅ Sucesso com configuração alternativa!');
          const token = retryResponse.data.access_token;
          const expiresIn = retryResponse.data.expires_in || 3600;
          tokenCache.set(pixUserId, {
            token,
            expiresAt: Date.now() + (expiresIn - 300) * 1000
          });
          return token;
        } catch (retryError) {
          continue;
        }
      }
      
      // Última tentativa: tentar todas as configurações possíveis
      console.error('⚠️  Tentando todas as configurações possíveis...');
      
      const ultimasTentativas = [
        // Tentar sem certificado mas com diferentes configurações
        { rejectUnauthorized: false, requestCert: false },
        { rejectUnauthorized: false, requestCert: true, rejectUnauthorized: false },
        { rejectUnauthorized: false, secureProtocol: 'TLSv1_method' },
        { rejectUnauthorized: false, secureProtocol: 'TLS_method' },
        // Tentar com passphrase como se fosse um certificado (improvável, mas vamos tentar)
      ];

      for (let i = 0; i < ultimasTentativas.length; i++) {
        try {
          console.log(`Tentativa final ${i + 1}/${ultimasTentativas.length}...`);
          const lastTry = await axios.post(
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
              httpsAgent: new https.Agent(ultimasTentativas[i]),
              timeout: 30000,
              validateStatus: (status) => status < 500 // Aceitar até 4xx
            }
          );
          
          if (lastTry.status === 200 && lastTry.data && lastTry.data.access_token) {
            console.log('✅ Sucesso na última tentativa!');
            const token = lastTry.data.access_token;
            const expiresIn = lastTry.data.expires_in || 3600;
            tokenCache.set(pixUserId, {
              token,
              expiresAt: Date.now() + (expiresIn - 300) * 1000
            });
            return token;
          }
        } catch (lastError) {
          // Continuar tentando
          if (i === ultimasTentativas.length - 1) {
            console.error(`Última tentativa falhou: ${lastError.message.substring(0, 100)}`);
          }
        }
      }
      
      // Se todas as tentativas falharam
      throw new Error(
        'ERRO SSL: A API do Banco do Brasil requer certificados SSL do cliente (client certificates). ' +
        'Os certificados Certificate e Private Key estão vazios no n8n. ' +
        '\n\nPOSSÍVEIS SOLUÇÕES:\n' +
        '1. Execute: npm run configurar-certs (tenta extrair do banco do n8n)\n' +
        '2. Verifique se os certificados estão em um vault externo (Enterprise)\n' +
        '3. Solicite os certificados SSL diretamente ao Banco do Brasil\n' +
        '4. Use o n8n original que já tem os certificados configurados\n\n' +
        'Os certificados são OBRIGATÓRIOS para conectar à API do BB.'
      );
    }
    
    // Montar mensagem de erro mais informativa
    let finalErrorMsg = `Falha ao obter token OAuth`;
    
    if (statusCode) {
      finalErrorMsg += ` (HTTP ${statusCode})`;
    }
    
    if (errorMsg) {
      // Limitar tamanho da mensagem para não cortar
      const maxLength = 200;
      const truncatedMsg = errorMsg.length > maxLength 
        ? errorMsg.substring(0, maxLength) + '...' 
        : errorMsg;
      finalErrorMsg += `: ${truncatedMsg}`;
    }
    
    if (errorCode) {
      finalErrorMsg += ` [${errorCode}]`;
    }
    
    // Adicionar informações úteis para debug
    if (statusCode === 401) {
      finalErrorMsg += '\n\n💡 SOLUÇÃO: Verifique as credenciais (gw_app_key e basic_auth_base64) do usuário PIX.';
      finalErrorMsg += '\n   - Confirme se basic_auth_base64 está no formato correto (Base64 de client_id:client_secret)';
      finalErrorMsg += '\n   - Verifique se as credenciais não expiraram no Portal do BB';
    } else if (statusCode === 403) {
      finalErrorMsg += '\n\n💡 SOLUÇÃO: Acesso negado - Problema de PERMISSÕES (Scopes).';
      finalErrorMsg += '\n   1. Acesse: https://developers.bb.com.br/';
      finalErrorMsg += '\n   2. Vá em "Minhas Aplicações"';
      finalErrorMsg += '\n   3. Encontre a aplicação com gw_app_key: ' + (user?.gw_app_key?.substring(0, 20) || 'N/A') + '...';
      finalErrorMsg += '\n   4. Habilite TODOS os escopos necessários:';
      finalErrorMsg += '\n      - rec.write, rec.read';
      finalErrorMsg += '\n      - payloadlocationrec.write, payloadlocationrec.read';
      finalErrorMsg += '\n      - cobr.write, cobr.read';
      finalErrorMsg += '\n      - cob.write, cob.read';
      finalErrorMsg += '\n   5. Salve e aguarde 5-10 minutos para propagação';
      finalErrorMsg += '\n   6. Verifique se está usando o ambiente correto (sandbox vs produção)';
      finalErrorMsg += '\n\n📚 Veja RESOLVER_PERMISSOES_BB.md e ESCOPOS_OAUTH_BB.md para mais detalhes.';
    } else if (statusCode === 404) {
      finalErrorMsg += '\n\n💡 SOLUÇÃO: URL OAuth não encontrada.';
      finalErrorMsg += '\n   - Verifique se a URL está correta: https://oauth.bb.com.br/oauth/token';
      finalErrorMsg += '\n   - Para sandbox: https://oauth.sandbox.bb.com.br/oauth/token';
    } else if (statusCode === 429) {
      finalErrorMsg += '\n\n💡 429 = rate limit (Cloudflare/BB). Para parar de chamar o OAuth:';
      finalErrorMsg += '\n   1. No servidor, edite o .env (na pasta do projeto, ex: /root/pix/.env)';
      finalErrorMsg += '\n   2. Adicione uma linha: BB_OAUTH_TOKEN=<token_de_acesso>';
      finalErrorMsg += '\n   3. Obtenha o token: no n8n execute o fluxo e copie o access_token do nó "2. OAuth Token"; ou rode npm run test:oauth em outro PC e copie o token.';
      finalErrorMsg += '\n   4. Reinicie: pm2 restart pix-system --update-env';
      finalErrorMsg += '\n   Ou use o campo "Token OAuth BB (opcional)" no formulário Teste PIX e cole o token antes de enviar.';
    } else if (errorCode === 'ECONNREFUSED' || errorCode === 'ETIMEDOUT') {
      finalErrorMsg += '\n\n💡 SOLUÇÃO: Não foi possível conectar ao servidor OAuth.';
      finalErrorMsg += '\n   - Verifique a conectividade com o servidor do BB';
      finalErrorMsg += '\n   - Verifique firewall/proxy';
      finalErrorMsg += '\n   - Teste a URL manualmente: curl -v https://oauth.bb.com.br/oauth/token';
    }
    
    throw new Error(finalErrorMsg);
}

/**
 * Gera TXID único
 */
export function generateTxid() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Cria cobrança imediata
 * @param {string} [oauthToken] - Token OAuth opcional (evita 429 quando enviado pelo frontend)
 */
export async function criarCobranca(pixUserId, txid, valor, chavePix, solicitacaoPagador = 'Primeira parcela - Pix Automatico', oauthToken) {
  const user = getPixUserById(pixUserId);
  
  if (!user) {
    throw new Error('Usuário PIX não encontrado');
  }

  const token = await getOAuthToken(pixUserId, oauthToken);
  const baseUrl = user.base_url.replace(/\/+$/, '');

  try {
    const response = await axios.put(
      `${baseUrl}/cob/${txid}?gw-dev-app-key=${encodeURIComponent(user.gw_app_key)}`,
      {
        calendario: {
          expiracao: 3600
        },
        valor: {
          original: valor
        },
        chave: chavePix,
        solicitacaoPagador: solicitacaoPagador
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        httpsAgent: httpsAgent,
        timeout: 30000
      }
    );

    return response.data;
  } catch (error) {
    console.error('Erro ao criar cobrança:', error.response?.data || error.message);
    const errorMsg = error.response?.data?.mensagem || error.response?.data?.message || error.message;
    const errorCode = error.code || '';
    
    // Melhorar mensagem de erro de SSL e tentar múltiplas configurações
    if (errorMsg.includes('SSL') || errorMsg.includes('certificate') || errorMsg.includes('bad certificate') || 
        errorMsg.includes('EPROTO') || errorCode.includes('CERT') || errorCode.includes('UNABLE_TO_VERIFY_LEAF_SIGNATURE')) {
      console.error('Erro SSL detectado. Tentando múltiplas configurações...');
      
      return await tryWithMultipleSSLConfigs(async (agent) => {
        const retryResponse = await axios.put(
          `${baseUrl}/cob/${txid}?gw-dev-app-key=${encodeURIComponent(user.gw_app_key)}`,
          {
            calendario: { expiracao: 3600 },
            valor: { original: valor },
            chave: chavePix,
            solicitacaoPagador: solicitacaoPagador
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            httpsAgent: agent,
            timeout: 30000
          }
        );
        return retryResponse.data;
      });
    }
    throw new Error(`Falha ao criar cobrança: ${errorMsg}`);
  }
}

/**
 * Cria LOCREC
 * @param {string} [oauthToken] - Token OAuth opcional (evita 429)
 */
export async function criarLocrec(pixUserId, oauthToken) {
  const user = getPixUserById(pixUserId);
  
  if (!user) {
    throw new Error('Usuário PIX não encontrado');
  }

  const token = await getOAuthToken(pixUserId, oauthToken);
  const baseUrl = user.base_url.replace(/\/+$/, '');

  try {
    const response = await axios.post(
      `${baseUrl}/locrec?gw-dev-app-key=${encodeURIComponent(user.gw_app_key)}`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        httpsAgent: httpsAgent,
        timeout: 30000
      }
    );

    return response.data;
  } catch (error) {
    console.error('Erro ao criar LOCREC:', error.response?.data || error.message);
    const errorMsg = error.response?.data?.mensagem || error.response?.data?.message || error.message;
    const errorCode = error.code || '';
    
    // Tentar múltiplas configurações SSL se for erro de certificado
    if (errorMsg.includes('SSL') || errorMsg.includes('certificate') || errorMsg.includes('bad certificate') || 
        errorMsg.includes('EPROTO') || errorCode.includes('CERT') || errorCode.includes('UNABLE_TO_VERIFY_LEAF_SIGNATURE')) {
      console.error('Erro SSL detectado ao criar LOCREC. Tentando múltiplas configurações...');
      
      return await tryWithMultipleSSLConfigs(async (agent) => {
        const retryResponse = await axios.post(
          `${baseUrl}/locrec?gw-dev-app-key=${encodeURIComponent(user.gw_app_key)}`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            httpsAgent: agent,
            timeout: 30000
          }
        );
        return retryResponse.data;
      });
    }
    
    throw new Error(`Falha ao criar LOCREC: ${errorMsg}`);
  }
}

/**
 * Cria recorrência
 * @param {string} [oauthToken] - Token OAuth opcional (evita 429)
 */
export async function criarRecorrencia(pixUserId, dados, oauthToken) {
  const user = getPixUserById(pixUserId);
  
  if (!user) {
    throw new Error('Usuário PIX não encontrado');
  }

  const token = await getOAuthToken(pixUserId, oauthToken);
  const baseUrl = user.base_url.replace(/\/+$/, '');

  const body = {
    vinculo: {
      objeto: 'masterClassic',
      contrato: dados.contrato,
      devedor: {
        cpf: dados.cpfDevedor,
        nome: dados.nomeDevedor
      }
    },
    calendario: {
      dataInicial: dados.dataInicial,
      periodicidade: dados.periodicidade
    },
    politicaRetentativa: dados.politicaRetentativa,
    loc: dados.locId,
    valor: {
      valorRec: dados.valorRec
    },
    ativacao: {
      dadosJornada: {
        txid: dados.txid
      }
    }
  };

  try {
    const response = await axios.post(
      `${baseUrl}/rec?gw-dev-app-key=${encodeURIComponent(user.gw_app_key)}`,
      body,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        httpsAgent: httpsAgent,
        timeout: 30000
      }
    );

    return response.data;
  } catch (error) {
    console.error('Erro ao criar recorrência:', error.response?.data || error.message);
    const errorMsg = error.response?.data?.mensagem || error.response?.data?.message || error.message;
    const errorCode = error.code || '';
    
    // Tentar múltiplas configurações SSL se for erro de certificado
    if (errorMsg.includes('SSL') || errorMsg.includes('certificate') || errorMsg.includes('bad certificate') || 
        errorMsg.includes('EPROTO') || errorCode.includes('CERT') || errorCode.includes('UNABLE_TO_VERIFY_LEAF_SIGNATURE')) {
      console.error('Erro SSL detectado ao criar recorrência. Tentando múltiplas configurações...');
      
      return await tryWithMultipleSSLConfigs(async (agent) => {
        const retryResponse = await axios.post(
          `${baseUrl}/rec?gw-dev-app-key=${encodeURIComponent(user.gw_app_key)}`,
          body,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            httpsAgent: agent,
            timeout: 30000
          }
        );
        return retryResponse.data;
      });
    }
    
    throw new Error(`Falha ao criar recorrência: ${errorMsg}`);
  }
}

/**
 * Consulta recorrência
 * @param {string} [oauthToken] - Token OAuth opcional (evita 429)
 */
export async function consultarRecorrencia(pixUserId, idRec, txid, oauthToken) {
  const user = getPixUserById(pixUserId);
  
  if (!user) {
    throw new Error('Usuário PIX não encontrado');
  }

  const token = await getOAuthToken(pixUserId, oauthToken);
  const baseUrl = user.base_url.replace(/\/+$/, '');

  try {
    const response = await axios.get(
      `${baseUrl}/rec/${encodeURIComponent(idRec)}?txid=${encodeURIComponent(txid)}&gw-dev-app-key=${encodeURIComponent(user.gw_app_key)}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        httpsAgent: httpsAgent,
        timeout: 30000
      }
    );

    return Array.isArray(response.data) ? response.data[0] : response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    const errorMsg = String(error.response?.data?.mensagem || error.response?.data?.message || error.message);
    const errorCode = error.code || '';
    if (/SSL|certificate|bad certificate|EPROTO|CERT/i.test(errorMsg) || /CERT|EPROTO/i.test(errorCode)) {
      console.error('Erro SSL ao consultar recorrência. Tentando múltiplas configurações...');
      try {
        const ret = await tryWithMultipleSSLConfigs(async (agent) => {
          const r = await axios.get(
            `${baseUrl}/rec/${encodeURIComponent(idRec)}?txid=${encodeURIComponent(txid)}&gw-dev-app-key=${encodeURIComponent(user.gw_app_key)}`,
            {
              headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
              httpsAgent: agent,
              timeout: 30000
            }
          );
          return Array.isArray(r.data) ? r.data[0] : r.data;
        });
        return ret;
      } catch (retryErr) {
        console.error('Retry SSL falhou ao consultar recorrência:', retryErr.message);
      }
    }
    console.error('Erro ao consultar recorrência:', error.response?.data || error.message);
    throw new Error(`Falha ao consultar recorrência: ${error.response?.data?.mensagem || error.message}`);
  }
}

/**
 * Valida CRC16 do EMV
 */
export function crc16Ccitt(str) {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= (str.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function isValidEmv(emv) {
  if (!emv || typeof emv !== 'string') return false;
  const idx = emv.indexOf('6304');
  if (idx < 0) return false;
  const calc = crc16Ccitt(emv.substring(0, idx + 4));
  const informed = emv.substring(idx + 4, idx + 8).toUpperCase();
  return calc === informed;
}

/**
 * Extrai EMV de diferentes formatos de resposta
 */
export function pickEmvFromResp(resp) {
  return resp?.dadosQR?.pixCopiaECola
      || resp?.pixCopiaECola
      || resp?.qrcode?.emv
      || resp?.payload?.emv
      || null;
}

/**
 * Polling para obter QR Code
 * @param {string} [oauthToken] - Token OAuth opcional (evita 429)
 */
export async function pollingQrCode(pixUserId, idRec, txid, oauthToken, maxTentativas = 12) {
  const delays = [1, 2, 3, 5, 5, 5, 8, 8, 8, 10, 10];
  let ultimaResposta = null;

  for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
    try {
      const resp = await consultarRecorrencia(pixUserId, idRec, txid, oauthToken);
      ultimaResposta = resp;

      if (!resp) {
        await sleep(delays[tentativa - 1] || 2);
        continue;
      }

      const status = resp?.status;
      const jornada = resp?.dadosQR?.jornada;
      const emv = pickEmvFromResp(resp);
      const emvOk = emv ? isValidEmv(emv) : false;

      // Estados terminais negativos
      if (['REJEITADA', 'CANCELADA', 'EXPIRADA'].includes(status)) {
        throw new Error(`Recorrência ${status}`);
      }

      // Sucesso: EMV válido
      if (emv && emvOk && (!jornada || jornada === 'JORNADA_3')) {
        return {
          ...resp,
          dadosQR: {
            ...(resp.dadosQR || {}),
            pixCopiaECola: emv,
            jornada: jornada || 'JORNADA_3',
            imagemQrcode: resp?.imagemQrcode || resp?.qrcode?.imagemQrcode || null,
          },
          _metadata: {
            tentativas: tentativa,
            emvValidoCRC: true,
            idRec,
            txid,
            origem: 'GET /rec/{idRec}?txid',
            timestamp: new Date().toISOString(),
          }
        };
      }

    } catch (err) {
      const sc = err?.response?.status || err?.statusCode;
      const retryable = [404, 408, 409, 423, 429, 500, 502, 503, 504].includes(sc)
                   || ['ETIMEDOUT', 'ECONNRESET'].includes(err?.code);

      // 401/403 → não faz sentido insistir
      if ([401, 403].includes(sc)) throw err;
      if (!retryable && sc >= 400 && sc < 500) throw err;
    }

    if (tentativa < maxTentativas) {
      const wait = delays[tentativa - 1] || 2;
      await sleep(wait);
    }
  }

  throw new Error(`EMV composto não obtido após ${maxTentativas} tentativas (idRec=${idRec})`);
}

function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

/**
 * Processo completo Jornada 3
 * Aceita dados.oauthToken opcional: quando enviado, não chama OAuth (evita 429).
 */
export async function processarJornada3(pixUserId, dados) {
  // Usar dados do usuário se não fornecidos
  const user = getPixUserById(pixUserId);
  if (!user) {
    throw new Error('Usuário PIX não encontrado');
  }

  // Token OAuth opcional (frontend pode enviar quando servidor está com 429)
  const oauthToken = dados.oauthToken && String(dados.oauthToken).trim() ? String(dados.oauthToken).trim() : undefined;
  if (oauthToken) {
    console.log('ℹ️  Usando token OAuth enviado na requisição (não chama oauth/token).');
  }

  const chavePix = dados.chavePixRecebedor || user.chave_pix_recebedor;
  if (!chavePix) {
    throw new Error('Chave PIX do recebedor não configurada');
  }

  // 1. Gerar TXID
  const txid = generateTxid();

  // 2. Criar cobrança imediata
  await criarCobranca(pixUserId, txid, dados.valorPrimeiroPagamento, chavePix, undefined, oauthToken);

  // 3. Criar LOCREC
  const locrec = await criarLocrec(pixUserId, oauthToken);
  const locId = locrec.id;

  // 4. Criar recorrência
  const recorrencia = await criarRecorrencia(pixUserId, {
    contrato: dados.contrato,
    cpfDevedor: dados.cpfDevedor,
    nomeDevedor: dados.nomeDevedor,
    dataInicial: dados.dataInicial,
    periodicidade: dados.periodicidade,
    politicaRetentativa: dados.politicaRetentativa,
    valorRec: dados.valorRec,
    locId: locId,
    txid: txid
  }, oauthToken);

  const idRec = recorrencia.idRec;

  // 5. Salvar transação inicial no banco local
  const transactionId = createTransaction({
    pix_user_id: pixUserId,
    txid,
    id_rec: idRec,
    contrato: dados.contrato,
    cpf_devedor: dados.cpfDevedor,
    nome_devedor: dados.nomeDevedor,
    valor_primeiro_pagamento: dados.valorPrimeiroPagamento,
    valor_recorrencia: dados.valorRec,
    data_inicial: dados.dataInicial,
    periodicidade: dados.periodicidade,
    politica_retentativa: dados.politicaRetentativa,
    status: 'PENDENTE',
  });

  // 6. Polling para obter QR Code
  console.log(`Iniciando polling para obter QR Code (idRec: ${idRec}, txid: ${txid})...`);
  const resultado = await pollingQrCode(pixUserId, idRec, txid, oauthToken);
  console.log('Polling concluído. QR Code obtido:', {
    hasDadosQR: !!resultado.dadosQR,
    hasPixCopiaECola: !!resultado.dadosQR?.pixCopiaECola,
    jornada: resultado.dadosQR?.jornada
  });

  // Verificar se temos o código PIX
  if (!resultado.dadosQR?.pixCopiaECola) {
    throw new Error('Código PIX copia e cola não foi obtido após polling');
  }

  // 7. Atualizar transação com QR Code no banco local
  updateTransactionByTxid(txid, {
    pix_copia_e_cola: resultado.dadosQR.pixCopiaECola,
    status: resultado.status || 'ATIVA',
    jornada: resultado.dadosQR.jornada || 'JORNADA_3',
    metadata: JSON.stringify(resultado._metadata),
  });

  console.log('✅ Transação atualizada com QR Code (banco local)');

  return {
    ...resultado,
    transactionId
  };
}

