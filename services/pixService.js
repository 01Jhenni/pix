// Importar primeiro para desabilitar SSL
import '../init-ssl.js';

import axios from 'axios';
import crypto from 'crypto';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getPixUserById, createTransaction, updateTransactionByTxid } from '../database/sqlite-db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

  // PRIORIDADE 2: Tentar ler de arquivos locais
  const certsDir = path.join(__dirname, '..', 'certificates');
  const certPath = path.join(certsDir, 'cert.pem');
  // Aceitar tanto key.pem quanto chave.pem
  const keyPath = fs.existsSync(path.join(certsDir, 'key.pem')) 
    ? path.join(certsDir, 'key.pem')
    : path.join(certsDir, 'chave.pem');
  const caPath = path.join(certsDir, 'ca.pem');
  const passphrasePath = path.join(certsDir, 'passphrase.txt');

  const hasCert = fs.existsSync(certPath);
  const hasKey = fs.existsSync(keyPath);
  const hasCA = fs.existsSync(caPath);
  const hasPassphrase = fs.existsSync(passphrasePath);

  if (hasCert && hasKey) {
    console.log('✅ Certificados SSL encontrados em arquivos locais! Usando certificados do cliente.');
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
    console.log('⚠️  Certificados SSL não encontrados. Usando modo sem certificado (pode falhar).');
    console.log(`   Procurando em: ${certsDir}`);
    console.log('   Arquivos esperados: cert.pem, key.pem (ou chave.pem), ca.pem (opcional), passphrase.txt (opcional)');
    console.log('   OU configure variáveis de ambiente: SSL_CERT, SSL_KEY, SSL_CA (opcional), SSL_PASSPHRASE (opcional)');
    console.log('');
    console.log('💡 DICA: Se os campos Certificate/Private Key estiverem vazios no n8n:');
    console.log('   1. Tente a credencial "SSL Certificates account 3"');
    console.log('   2. Ou verifique o banco de dados do n8n');
    console.log('   3. Veja GUIA_RAPIDO_CERTIFICADOS.md para mais detalhes');
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
async function tryWithMultipleSSLConfigs(requestFn) {
  const sslConfigs = [
    // 1. Sem certificado do cliente, apenas desabilitando validação
    {
      rejectUnauthorized: false,
      requestCert: false,
      secureProtocol: 'TLSv1_2_method'
    },
    // 2. Sem certificado, TLS 1.3
    {
      rejectUnauthorized: false,
      requestCert: false,
      secureProtocol: 'TLS_method'
    },
    // 3. Sem certificado, TLS 1.2 com ciphers específicos
    {
      rejectUnauthorized: false,
      requestCert: false,
      secureProtocol: 'TLSv1_2_method',
      ciphers: 'DEFAULT:@SECLEVEL=1'
    },
    // 4. Se tiver certificados, tentar sem passphrase
    ...(sslCerts ? [{
      cert: sslCerts.cert,
      key: sslCerts.key,
      rejectUnauthorized: false,
      requestCert: true,
      secureProtocol: 'TLSv1_2_method'
    }] : []),
    // 5. Se tiver certificados, tentar com diferentes protocolos
    ...(sslCerts ? [{
      cert: sslCerts.cert,
      key: sslCerts.key,
      rejectUnauthorized: false,
      requestCert: true,
      secureProtocol: 'TLS_method'
    }] : [])
  ];

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
          `A API do Banco do Brasil requer certificados SSL válidos do cliente. ` +
          `Verifique se os certificados estão corretos em: certificates/cert.pem e certificates/key.pem. ` +
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
 */
export async function getOAuthToken(pixUserId) {
  const user = getPixUserById(pixUserId);
  
  if (!user) {
    throw new Error('Usuário PIX não encontrado ou inativo');
  }

  if (!user.ativo) {
    throw new Error('Usuário PIX está inativo');
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

  try {
    const response = await axios.post(
      user.oauth_url,
      new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'rec.write rec.read payloadlocationrec.write payloadlocationrec.read cobr.write cobr.read cob.write cob.read'
        // Escopos necessários conforme Guia Técnico API Pix Automático BB:
        // - rec.write/read: Recorrências (Jornadas 1-4)
        // - payloadlocationrec.write/read: Location/QR Code (Jornadas 2-4)
        // - cob.write/read: Cobrança imediata (Jornada 3)
        // - cobr.write/read: Cobrança com vencimento (Jornada 4)
        // Se der erro 403, verifique se todos estão habilitados no Portal do BB
        // Ver ESCOPOS_OAUTH_BB.md para detalhes completos
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

    const token = response.data.access_token;
    const expiresIn = response.data.expires_in || 3600;
    
    // Cache do token (expira 5 minutos antes)
    tokenCache.set(pixUserId, {
      token,
      expiresAt: Date.now() + (expiresIn - 300) * 1000
    });

    return token;
  } catch (error) {
    console.error('Erro ao obter token OAuth:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText
    });
    
    // Capturar mensagem de erro de forma mais completa
    let errorMsg = '';
    if (error.response?.data) {
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
    const statusCode = error.response?.status;
    
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
    if (error.response?.status === 401) {
      finalErrorMsg += '. Verifique as credenciais (gw_app_key e basic_auth_base64) do usuário PIX.';
    } else if (error.response?.status === 403) {
      finalErrorMsg += '. Acesso negado. Verifique as permissões da aplicação no Banco do Brasil.';
    } else if (error.response?.status === 404) {
      finalErrorMsg += '. URL OAuth não encontrada. Verifique a URL configurada.';
    } else if (errorCode === 'ECONNREFUSED' || errorCode === 'ETIMEDOUT') {
      finalErrorMsg += '. Não foi possível conectar ao servidor OAuth. Verifique a conectividade e a URL.';
    }
    
    throw new Error(finalErrorMsg);
  }
}

/**
 * Gera TXID único
 */
export function generateTxid() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Cria cobrança imediata
 */
export async function criarCobranca(pixUserId, txid, valor, chavePix, solicitacaoPagador = 'Primeira parcela - Pix Automatico') {
  const user = getPixUserById(pixUserId);
  
  if (!user) {
    throw new Error('Usuário PIX não encontrado');
  }

  const token = await getOAuthToken(pixUserId);
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
 */
export async function criarLocrec(pixUserId) {
  const user = getPixUserById(pixUserId);
  
  if (!user) {
    throw new Error('Usuário PIX não encontrado');
  }

  const token = await getOAuthToken(pixUserId);
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
 */
export async function criarRecorrencia(pixUserId, dados) {
  const user = getPixUserById(pixUserId);
  
  if (!user) {
    throw new Error('Usuário PIX não encontrado');
  }

  const token = await getOAuthToken(pixUserId);
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
 */
export async function consultarRecorrencia(pixUserId, idRec, txid) {
  const user = getPixUserById(pixUserId);
  
  if (!user) {
    throw new Error('Usuário PIX não encontrado');
  }

  const token = await getOAuthToken(pixUserId);
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
 */
export async function pollingQrCode(pixUserId, idRec, txid, maxTentativas = 12) {
  const delays = [1, 2, 3, 5, 5, 5, 8, 8, 8, 10, 10];
  let ultimaResposta = null;

  for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
    try {
      const resp = await consultarRecorrencia(pixUserId, idRec, txid);
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
 */
export async function processarJornada3(pixUserId, dados) {
  // Usar dados do usuário se não fornecidos
  const user = getPixUserById(pixUserId);
  if (!user) {
    throw new Error('Usuário PIX não encontrado');
  }

  const chavePix = dados.chavePixRecebedor || user.chave_pix_recebedor;
  if (!chavePix) {
    throw new Error('Chave PIX do recebedor não configurada');
  }

  // 1. Gerar TXID
  const txid = generateTxid();

  // 2. Criar cobrança imediata
  await criarCobranca(pixUserId, txid, dados.valorPrimeiroPagamento, chavePix);

  // 3. Criar LOCREC
  const locrec = await criarLocrec(pixUserId);
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
  });

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
  const resultado = await pollingQrCode(pixUserId, idRec, txid);
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

