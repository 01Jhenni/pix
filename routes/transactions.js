import express from 'express';
import {
  listTransactions,
  getTransactionById,
  getTransactionByTxid,
  getTransactionsStats,
} from '../database/sqlite-db.js';

const router = express.Router();

/**
 * GET /api/transactions
 * Lista todas as transações com filtros opcionais
 */
router.get('/', (req, res) => {
  try {
    const { pixUserId, status, limit = 100, offset = 0 } = req.query;
    const { rows, total } = listTransactions({
      pixUserId,
      status,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Erro ao listar transações:', error);
    res.status(500).json({ 
      error: error.message || 'Erro ao listar transações' 
    });
  }
});

/**
 * GET /api/transactions/:id
 * Obtém uma transação específica
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const transaction = getTransactionById(id);

    if (!transaction) {
      return res.status(404).json({ 
        error: 'Transação não encontrada' 
      });
    }

    // Parse metadata se existir
    if (transaction.metadata) {
      try {
        transaction.metadata = JSON.parse(transaction.metadata);
      } catch (e) {
        // Ignora erro de parse
      }
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Erro ao obter transação:', error);
    res.status(500).json({ 
      error: error.message || 'Erro ao obter transação' 
    });
  }
});

/**
 * GET /api/transactions/txid/:txid
 * Obtém uma transação por TXID
 */
router.get('/txid/:txid', (req, res) => {
  try {
    const { txid } = req.params;
    const transaction = getTransactionByTxid(txid);

    if (!transaction) {
      return res.status(404).json({ 
        error: 'Transação não encontrada' 
      });
    }

    // Parse metadata se existir
    if (transaction.metadata) {
      try {
        transaction.metadata = JSON.parse(transaction.metadata);
      } catch (e) {
        // Ignora erro de parse
      }
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Erro ao obter transação:', error);
    res.status(500).json({ 
      error: error.message || 'Erro ao obter transação' 
    });
  }
});

/**
 * GET /api/transactions/stats
 * Estatísticas das transações
 */
router.get('/stats/summary', (req, res) => {
  try {
    const { pixUserId } = req.query;
    const stats = getTransactionsStats({ pixUserId });

    res.json({
      success: true,
      data: {
        ...stats,
        valor_total: stats.valor_total || 0
      }
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ 
      error: error.message || 'Erro ao obter estatísticas' 
    });
  }
});

export default router;

