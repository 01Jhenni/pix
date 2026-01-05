import express from 'express';
import { processarJornada3, consultarRecorrencia } from '../services/pixService.js';
import { getDatabase } from '../database/db-loader.js';
import QRCode from 'qrcode';
import { authenticateApiKey } from './api-keys.js';

const router = express.Router();

/**
 * Rotas públicas (com API key) - para integração externa
 */
const publicRouter = express.Router();

// Middleware para rotas públicas - aceita API key ou pixUserId
publicRouter.use((req, res, next) => {
  // Se tem API key, autenticar
  if (req.headers['x-api-key'] || req.headers['authorization']?.includes('Bearer')) {
    return authenticateApiKey(req, res, next);
  }
  // Se não tem API key mas tem pixUserId no body, permitir
  next();
});

/**
 * POST /api/pix/jornada3
 * Cria uma recorrência PIX Jornada 3
 */
router.post('/jornada3', async (req, res) => {
  try {
    const { pixUserId, ...dados } = req.body;

    if (!pixUserId) {
      return res.status(400).json({ 
        error: 'pixUserId é obrigatório' 
      });
    }

    // Validações básicas
    const camposObrigatorios = [
      'cpfDevedor', 'nomeDevedor', 'contrato', 'dataInicial',
      'periodicidade', 'politicaRetentativa', 'valorRec',
      'valorPrimeiroPagamento'
    ];

    for (const campo of camposObrigatorios) {
      if (!dados[campo]) {
        return res.status(400).json({ 
          error: `Campo obrigatório ausente: ${campo}` 
        });
      }
    }

    // Processar Jornada 3
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

    // Verificar se temos os dados necessários
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
        jornada: resultado.dadosQR?.jornada || 'JORNADA_3',
        status: resultado.status || 'ATIVA',
        devedor: {
          cpf: dados.cpfDevedor,
          nome: dados.nomeDevedor
        },
        valor: {
          primeiroPagamento: dados.valorPrimeiroPagamento,
          recorrencia: dados.valorRec
        },
        metadata: resultado._metadata
      }
    });
  } catch (error) {
    console.error('Erro ao processar Jornada 3:', error);
    res.status(500).json({ 
      error: error.message || 'Erro ao processar Jornada 3' 
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
 * Obtém QR Code de uma transação
 */
router.get('/qrcode/:txid', async (req, res) => {
  try {
    const { txid } = req.params;
    const db = getDatabase();
    
    const transaction = db.prepare(`
      SELECT t.*, u.nome as usuario_nome, u.cnpj as usuario_cnpj
      FROM transactions t
      JOIN pix_users u ON t.pix_user_id = u.id
      WHERE t.txid = ?
    `).get(txid);

    if (!transaction) {
      return res.status(404).json({ 
        error: 'Transação não encontrada' 
      });
    }

    if (!transaction.pix_copia_e_cola) {
      return res.status(404).json({ 
        error: 'QR Code ainda não disponível' 
      });
    }

    // Gerar QR Code PNG
    const qrCodeImage = await QRCode.toDataURL(transaction.pix_copia_e_cola, {
      width: 300,
      margin: 2
    });

    res.json({
      success: true,
      data: {
        txid: transaction.txid,
        idRec: transaction.id_rec,
        pixCopiaECola: transaction.pix_copia_e_cola,
        qrCodeImage: qrCodeImage,
        status: transaction.status,
        jornada: transaction.jornada,
        devedor: {
          cpf: transaction.cpf_devedor,
          nome: transaction.nome_devedor
        },
        valor: {
          primeiroPagamento: transaction.valor_primeiro_pagamento,
          recorrencia: transaction.valor_recorrencia
        },
        created_at: transaction.created_at
      }
    });
  } catch (error) {
    console.error('Erro ao obter QR Code:', error);
    res.status(500).json({ 
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
      'valorPrimeiroPagamento'
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

    res.json({
      success: true,
      data: {
        txid: resultado._metadata?.txid,
        idRec: resultado._metadata?.idRec,
        pixCopiaECola: pixCopiaECola,
        qrCodeImage: qrCodeImage,
        status: resultado.status || 'ATIVA',
        metadata: resultado._metadata
      }
    });
  } catch (error) {
    console.error('Erro ao criar recorrência:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao criar recorrência PIX'
    });
  }
});

export { publicRouter };
export default router;

