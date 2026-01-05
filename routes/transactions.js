import express from 'express';
import { getDatabase } from '../database/db-loader.js';

const router = express.Router();

/**
 * GET /api/transactions
 * Lista todas as transações com filtros opcionais
 */
router.get('/', (req, res) => {
  try {
    const { pixUserId, status, limit = 100, offset = 0 } = req.query;
    const db = getDatabase();

    let query = `
      SELECT 
        t.id, t.txid, t.id_rec, t.contrato,
        t.cpf_devedor, t.nome_devedor,
        t.valor_primeiro_pagamento, t.valor_recorrencia,
        t.data_inicial, t.periodicidade, t.politica_retentativa,
        t.status, t.jornada, t.created_at, t.updated_at,
        u.id as usuario_id, u.cnpj as usuario_cnpj, u.nome as usuario_nome
      FROM transactions t
      JOIN pix_users u ON t.pix_user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (pixUserId) {
      query += ' AND t.pix_user_id = ?';
      params.push(pixUserId);
    }

    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }

    query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const transactions = db.prepare(query).all(...params);

    // Contar total
    let countQuery = `
      SELECT COUNT(*) as total
      FROM transactions t
      WHERE 1=1
    `;
    const countParams = [];

    if (pixUserId) {
      countQuery += ' AND t.pix_user_id = ?';
      countParams.push(pixUserId);
    }

    if (status) {
      countQuery += ' AND t.status = ?';
      countParams.push(status);
    }

    const { total } = db.prepare(countQuery).get(...countParams);

    res.json({
      success: true,
      data: transactions,
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
    const db = getDatabase();
    
    const transaction = db.prepare(`
      SELECT 
        t.*,
        u.id as usuario_id, u.cnpj as usuario_cnpj, u.nome as usuario_nome
      FROM transactions t
      JOIN pix_users u ON t.pix_user_id = u.id
      WHERE t.id = ?
    `).get(id);

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
    const db = getDatabase();
    
    const transaction = db.prepare(`
      SELECT 
        t.*,
        u.id as usuario_id, u.cnpj as usuario_cnpj, u.nome as usuario_nome
      FROM transactions t
      JOIN pix_users u ON t.pix_user_id = u.id
      WHERE t.txid = ?
    `).get(txid);

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
    const db = getDatabase();

    let query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'ATIVA' THEN 1 END) as ativas,
        COUNT(CASE WHEN status = 'PENDENTE' THEN 1 END) as pendentes,
        COUNT(CASE WHEN status IN ('REJEITADA', 'CANCELADA', 'EXPIRADA') THEN 1 END) as canceladas,
        SUM(CAST(valor_recorrencia AS REAL)) as valor_total
      FROM transactions
      WHERE 1=1
    `;
    const params = [];

    if (pixUserId) {
      query += ' AND pix_user_id = ?';
      params.push(pixUserId);
    }

    const stats = db.prepare(query).get(...params);

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

