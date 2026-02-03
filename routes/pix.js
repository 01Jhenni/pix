import express from 'express';
import { processarJornada3, consultarRecorrencia } from '../services/pixService.js';
import { getTransactionByTxid, listTransactions } from '../database/sqlite-db.js';
import QRCode from 'qrcode';
import { authenticateApiKey } from './api-keys.js';

const router = express.Router();

const publicRouter = express.Router();

publicRouter.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const hasApiKey = apiKey || (authHeader && (authHeader.includes('Bearer') || authHeader.startsWith('Bearer')));
  if (hasApiKey) return authenticateApiKey(req, res, next);
  next();
});

router.post('/jornada3', async (req, res) => {
  try {
    const body = req.body || {};
    const { pixUserId, oauthToken: bodyOauthToken, ...rest } = body;
    const dados = { ...rest };
    if (bodyOauthToken && String(bodyOauthToken).trim()) {
      dados.oauthToken = String(bodyOauthToken).trim();
      console.log('✅ Token OAuth recebido na requisição (não chamará oauth/token).');
    } else {
      console.log('⚠️  Nenhum oauthToken na requisição — o backend chamará oauth/token (pode dar 429).');
    }

    if (!pixUserId) {
      return res.status(400).json({ error: 'pixUserId é obrigatório' });
    }

    // Validações básicas
    const camposObrigatorios = [
      'cpfDevedor', 'nomeDevedor', 'contrato', 'dataInicial',
      'periodicidade', 'politicaRetentativa', 'valorRec',
      'valorPrimeiroPagamento', 'chavePixRecebedor', 'nomeRecebedor', 'cidadeRecebedor'
    ];

    for (const campo of camposObrigatorios) {
      if (!dados[campo]) {
        const errMsg = 'Campo obrigatório ausente: ' + campo;
        return res.status(400).json({ error: errMsg });
      }
    }

    console.log('Iniciando processamento Jornada 3...');
    const resultado = await processarJornada3(pixUserId, dados);
    console.log('Processamento concluído. Resultado:', {
      hasDadosQR: !!resultado.dadosQR,
      hasPixCopiaECola: !!resultado.dadosQR?.pixCopiaECola,
      status: resultado.status
    });

    // Gerar QR Code PNG
    let qrCodeImage = null;
    const pixCopiaECola = resultado.dadosQR?.pixCopiaECola;
    
    if (pixCopiaECola) {
      try {
        console.log('Gerando QR Code PNG...');
        qrCodeImage = await QRCode.toDataURL(pixCopiaECola, {
          width: 300,
          margin: 2,
          errorCorrectionLevel: 'M'
        });
        console.log('QR Code gerado com sucesso!');
      } catch (err) {
        console.error('Erro ao gerar QR Code:', err);
      }
    } else {
      console.warn('⚠️  Código PIX copia e cola não encontrado no resultado');
    }

    if (!pixCopiaECola) {
      return res.status(500).json({
        error: 'QR Code não foi gerado. Verifique se a recorrência foi criada corretamente.',
        debug: {
          hasDadosQR: !!resultado.dadosQR,
          status: resultado.status,
          metadata: resultado._metadata
        }
      });
    }

    res.json({
      success: true,
      data: {
        txid: resultado._metadata?.txid,
        idRec: resultado._metadata?.idRec,
        pixCopiaECola: pixCopiaECola,
        qrCodeImage: qrCodeImage,
        qrCode: pixCopiaECola,
        jornada: resultado.dadosQR?.jornada || 'JORNADA_3',
        status: resultado.status || 'ATIVA',
        devedor: { cpf: dados.cpfDevedor, nome: dados.nomeDevedor },
        valor: {
          primeiroPagamento: dados.valorPrimeiroPagamento,
          recorrencia: dados.valorRec,
          primeiroPagamentoFormatado: `R$ ${parseFloat(dados.valorPrimeiroPagamento).toFixed(2).replace('.', ',')}`,
          recorrenciaFormatado: `R$ ${parseFloat(dados.valorRec).toFixed(2).replace('.', ',')}`
        },
        periodicidade: dados.periodicidade,
        dataInicial: dados.dataInicial,
        contrato: dados.contrato,
        metadata: resultado._metadata
      }
    });
  } catch (error) {
    console.error('Erro ao processar Jornada 3:', error);
    const msg = error.message || 'Erro ao processar Jornada 3';
    const isSSL = /certificado|SSL|cert\.pem|key\.pem|bad certificate/i.test(msg);
    const is429 = /429|Too Many Requests|rate limit/i.test(msg);
    const isToken = /token|OAuth|401|403|credencial|identificador/i.test(msg);
    const code = isSSL ? 'SSL_CERTIFICATE_REQUIRED' : is429 || isToken ? 'OAUTH_ERROR' : 'JORNADA3_ERROR';
    let errorMsg = msg;
    if (is429 || isToken) {
      errorMsg = msg + ' Cole o token no campo "Token OAuth BB (opcional)" no topo deste formulário (token do n8n, nó "2. OAuth Token", ou npm run test:oauth) e envie de novo.';
    }
    res.status(500).json({ 
      error: errorMsg,
      code
    });
  }
});

/**
 * GET /api/pix/recorrencia/:idRec
 * Consulta uma recorrência
 */
router.get('/recorrencia/:idRec', async (req, res) => {
  try {
    const { idRec } = req.params;
    const { pixUserId, txid } = req.query;

    if (!pixUserId || !txid) {
      return res.status(400).json({ 
        error: 'pixUserId e txid são obrigatórios' 
      });
    }

    const resultado = await consultarRecorrencia(
      parseInt(pixUserId), 
      idRec, 
      txid
    );

    if (!resultado) {
      return res.status(404).json({ 
        error: 'Recorrência não encontrada' 
      });
    }

    res.json({
      success: true,
      data: resultado
    });
  } catch (error) {
    console.error('Erro ao consultar recorrência:', error);
    res.status(500).json({ 
      error: error.message || 'Erro ao consultar recorrência' 
    });
  }
});

/**
 * GET /api/pix/qrcode/:txid
 * Obtém QR Code de uma transação (formato compatível com n8n)
 */
router.get('/qrcode/:txid', async (req, res) => {
  try {
    const { txid } = req.params;
    const transaction = getTransactionByTxid(txid);

    if (!transaction) {
      return res.status(404).json({ 
        success: false,
        error: 'Transação não encontrada' 
      });
    }

    if (!transaction.pix_copia_e_cola) {
      return res.status(404).json({ 
        success: false,
        error: 'QR Code ainda não disponível' 
      });
    }

    // Gerar QR Code PNG
    const qrCodeImage = await QRCode.toDataURL(transaction.pix_copia_e_cola, {
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'M'
    });
    const qrcodeBase64 = qrCodeImage.replace(/^data:image\/\w+;base64,/, '');

    res.json({
      success: true,
      data: {
        txid: transaction.txid,
        idRec: transaction.id_rec,
        pixCopiaECola: transaction.pix_copia_e_cola,
        qrCodeImage: qrCodeImage,
        qrcode: qrcodeBase64,
        dadosQR: { jornada: transaction.jornada || 'JORNADA_3', pixCopiaECola: transaction.pix_copia_e_cola },
        status: transaction.status,
        jornada: transaction.jornada || 'JORNADA_3',
        devedor: {
          cpf: transaction.cpf_devedor,
          nome: transaction.nome_devedor
        },
        valor: {
          primeiroPagamento: parseFloat(transaction.valor_primeiro_pagamento),
          recorrencia: parseFloat(transaction.valor_recorrencia),
          primeiroPagamentoFormatado: `R$ ${parseFloat(transaction.valor_primeiro_pagamento).toFixed(2).replace('.', ',')}`,
          recorrenciaFormatado: `R$ ${parseFloat(transaction.valor_recorrencia).toFixed(2).replace('.', ',')}`
        },
        periodicidade: transaction.periodicidade,
        dataInicial: transaction.data_inicial,
        contrato: transaction.contrato,
        createdAt: transaction.created_at,
        updatedAt: transaction.updated_at
      }
    });
  } catch (error) {
    console.error('Erro ao obter QR Code:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Erro ao obter QR Code' 
    });
  }
});

// Adicionar rota pública para jornada3
publicRouter.post('/jornada3', async (req, res) => {
  try {
    // Se autenticado por API key, usar pixUserId do token
    const pixUserId = req.pixUserId || req.body.pixUserId;
    
    if (!pixUserId) {
      return res.status(400).json({ 
        success: false,
        error: 'pixUserId é obrigatório ou forneça uma API Key válida' 
      });
    }

    const { pixUserId: _, ...dados } = req.body;

    // Validações básicas
    const camposObrigatorios = [
      'cpfDevedor', 'nomeDevedor', 'contrato', 'dataInicial',
      'periodicidade', 'politicaRetentativa', 'valorRec',
      'valorPrimeiroPagamento', 'chavePixRecebedor', 'nomeRecebedor', 'cidadeRecebedor'
    ];

    for (const campo of camposObrigatorios) {
      if (!dados[campo]) {
        return res.status(400).json({ 
          success: false,
          error: `Campo obrigatório ausente: ${campo}` 
        });
      }
    }

    // Processar Jornada 3
    const resultado = await processarJornada3(pixUserId, dados);

    // Gerar QR Code PNG
    let qrCodeImage = null;
    const pixCopiaECola = resultado.dadosQR?.pixCopiaECola;
    
    if (pixCopiaECola) {
      try {
        qrCodeImage = await QRCode.toDataURL(pixCopiaECola, {
          width: 300,
          margin: 2,
          errorCorrectionLevel: 'M'
        });
      } catch (qrError) {
        console.error('Erro ao gerar QR Code:', qrError);
      }
    }

    if (!pixCopiaECola) {
      return res.status(500).json({
        success: false,
        error: 'QR Code não foi gerado. Verifique se a recorrência foi criada corretamente.'
      });
    }

    // Buscar transação completa do banco para retornar dados completos
    const transaction = getTransactionByTxid(resultado._metadata?.txid);

    // Base64 puro do PNG (sem prefixo data URL) para compatibilidade com n8n / Resposta Sucesso
    const qrcodeBase64 = qrCodeImage && qrCodeImage.startsWith('data:') ? qrCodeImage.replace(/^data:image\/\w+;base64,/, '') : qrCodeImage;

    // Retornar resposta completa com QR Code e copia e cola (formato idêntico ao n8n Jornada 3)
    res.json({
      success: true,
      message: 'Recorrência PIX criada com sucesso. QR Code gerado.',
      data: {
        // IDs principais
        txid: resultado._metadata?.txid,
        idRec: resultado._metadata?.idRec,

        // QR Code e Copia e Cola
        pixCopiaECola: pixCopiaECola,
        qrCodeImage: qrCodeImage,
        qrCode: pixCopiaECola,
        qrcode: qrcodeBase64 || qrCodeImage, // n8n: PNG em base64 puro

        // Formato n8n Resposta Sucesso
        dadosQR: {
          jornada: resultado.dadosQR?.jornada || 'JORNADA_3',
          pixCopiaECola: pixCopiaECola
        },
        vinculo: {
          devedor: {
            cpf: dados.cpfDevedor,
            nome: dados.nomeDevedor
          }
        },

        jornada: resultado.dadosQR?.jornada || 'JORNADA_3',
        status: resultado.status || 'ATIVA',
        devedor: {
          cpf: dados.cpfDevedor,
          nome: dados.nomeDevedor
        },
        valor: {
          primeiroPagamento: parseFloat(dados.valorPrimeiroPagamento),
          recorrencia: parseFloat(dados.valorRec),
          primeiroPagamentoFormatado: `R$ ${parseFloat(dados.valorPrimeiroPagamento).toFixed(2).replace('.', ',')}`,
          recorrenciaFormatado: `R$ ${parseFloat(dados.valorRec).toFixed(2).replace('.', ',')}`
        },
        periodicidade: dados.periodicidade,
        dataInicial: dados.dataInicial,
        contrato: dados.contrato,
        createdAt: transaction?.created_at || new Date().toISOString(),
        metadata: resultado._metadata
      }
    });
  } catch (error) {
    console.error('Erro ao criar recorrência:', error);
    const msg = error.message || 'Erro ao criar recorrência PIX';
    const isSSLError = /SSL|certificado|certificate|bad certificate|cert\.pem|key\.pem/i.test(msg);
    res.status(500).json({
      success: false,
      error: isSSLError
        ? 'A API do Banco do Brasil exige certificados SSL do cliente para gerar QR Code e PIX Copia e Cola. Coloque os arquivos cert.pem e key.pem (fornecidos pelo BB) na pasta certificates/ no servidor.'
        : msg,
      errorCode: isSSLError ? 'SSL_CERTIFICATE_REQUIRED' : undefined
    });
  }
});

// Adicionar rota pública para obter QR Code
publicRouter.get('/qrcode/:txid', async (req, res) => {
  try {
    const { txid } = req.params;
    const transaction = getTransactionByTxid(txid);

    if (!transaction) {
      return res.status(404).json({ 
        success: false,
        error: 'Transação não encontrada' 
      });
    }

    // Verificar se a transação pertence ao usuário da API key
    if (req.pixUserId && transaction.pix_user_id !== req.pixUserId) {
      return res.status(403).json({ 
        success: false,
        error: 'Acesso negado. Esta transação não pertence ao seu usuário PIX.' 
      });
    }

    if (!transaction.pix_copia_e_cola) {
      return res.status(404).json({ 
        success: false,
        error: 'QR Code ainda não disponível' 
      });
    }

    // Gerar QR Code PNG
    const qrCodeImage = await QRCode.toDataURL(transaction.pix_copia_e_cola, {
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'M'
    });

    res.json({
      success: true,
      data: {
        txid: transaction.txid,
        idRec: transaction.id_rec,
        pixCopiaECola: transaction.pix_copia_e_cola,
        qrCodeImage: qrCodeImage,
        status: transaction.status,
        jornada: transaction.jornada || 'JORNADA_3',
        devedor: {
          cpf: transaction.cpf_devedor,
          nome: transaction.nome_devedor
        },
        valor: {
          primeiroPagamento: parseFloat(transaction.valor_primeiro_pagamento),
          recorrencia: parseFloat(transaction.valor_recorrencia),
          primeiroPagamentoFormatado: `R$ ${parseFloat(transaction.valor_primeiro_pagamento).toFixed(2).replace('.', ',')}`,
          recorrenciaFormatado: `R$ ${parseFloat(transaction.valor_recorrencia).toFixed(2).replace('.', ',')}`
        },
        periodicidade: transaction.periodicidade,
        dataInicial: transaction.data_inicial,
        contrato: transaction.contrato,
        createdAt: transaction.created_at,
        updatedAt: transaction.updated_at
      }
    });
  } catch (error) {
    console.error('Erro ao obter QR Code:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Erro ao obter QR Code' 
    });
  }
});

// Adicionar rota pública para listar transações
publicRouter.get('/transactions', (req, res) => {
  try {
    const { status, limit = 100, offset = 0 } = req.query;
    
    // Se autenticado por API key, filtrar apenas transações do usuário
    const pixUserId = req.pixUserId || req.query.pixUserId;
    
    if (!pixUserId) {
      return res.status(400).json({ 
        success: false,
        error: 'pixUserId é obrigatório ou forneça uma API Key válida' 
      });
    }

    const { rows, total } = listTransactions({
      pixUserId,
      status,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Formatar transações para resposta
    const transactions = rows.map(t => ({
      id: t.id,
      txid: t.txid,
      idRec: t.id_rec,
      status: t.status,
      jornada: t.jornada || 'JORNADA_3',
      devedor: {
        cpf: t.cpf_devedor,
        nome: t.nome_devedor
      },
      valor: {
        primeiroPagamento: parseFloat(t.valor_primeiro_pagamento),
        recorrencia: parseFloat(t.valor_recorrencia),
        primeiroPagamentoFormatado: `R$ ${parseFloat(t.valor_primeiro_pagamento).toFixed(2).replace('.', ',')}`,
        recorrenciaFormatado: `R$ ${parseFloat(t.valor_recorrencia).toFixed(2).replace('.', ',')}`
      },
      periodicidade: t.periodicidade,
      dataInicial: t.data_inicial,
      contrato: t.contrato,
      hasQrCode: !!t.pix_copia_e_cola,
      createdAt: t.created_at,
      updatedAt: t.updated_at
    }));

    res.json({
      success: true,
      data: transactions,
      pagination: {
        total: total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    });
  } catch (error) {
    console.error('Erro ao listar transações:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Erro ao listar transações' 
    });
  }
});

// Adicionar rota pública para consultar recorrência
publicRouter.get('/recorrencia/:idRec', async (req, res) => {
  try {
    const { idRec } = req.params;
    const { txid } = req.query;
    const pixUserId = req.pixUserId || req.query.pixUserId;

    if (!pixUserId || !txid) {
      return res.status(400).json({ 
        success: false,
        error: 'pixUserId e txid são obrigatórios ou forneça uma API Key válida' 
      });
    }

    const resultado = await consultarRecorrencia(
      parseInt(pixUserId), 
      idRec, 
      txid
    );

    if (!resultado) {
      return res.status(404).json({ 
        success: false,
        error: 'Recorrência não encontrada' 
      });
    }

    res.json({
      success: true,
      data: resultado
    });
  } catch (error) {
    console.error('Erro ao consultar recorrência:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Erro ao consultar recorrência' 
    });
  }
});

export { publicRouter };
export default router;

