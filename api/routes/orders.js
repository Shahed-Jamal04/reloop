import express from 'express';
import sql from 'mssql';
import { getConnection } from '../db.js';
import { authenticate } from '../authMiddleware.js';

const router = express.Router();

function groupOrderRows(rows) {
  const map = new Map();
  for (const row of rows) {
    const oid = row.order_id;
    if (!map.has(oid)) {
      map.set(oid, {
        id: oid,
        total_price: row.total_price,
        status: row.order_status,
        created_at: row.created_at,
        request_id: row.request_id,
        buyer_name: row.buyer_name ?? null,
        payment_status: row.payment_status ?? null,
        payment_amount: row.payment_amount != null ? Number(row.payment_amount) : null,
        items: [],
      });
    }
    if (row.material_id != null) {
      map.get(oid).items.push({
        material_id: row.material_id,
        quantity: row.quantity,
        line_price: row.line_price,
        material_title: row.material_title,
        material_image: row.material_image,
      });
    }
  }
  return [...map.values()];
}

async function getOrderHeader(pool, orderId) {
  const r = await pool
    .request()
    .input('id', orderId)
    .query(`
      SELECT o.id, o.buyer_id, o.total_price, os.status AS status
      FROM orders o
      JOIN order_status os ON o.status_id = os.id
      WHERE o.id = @id AND o.is_deleted = 0
    `);
  return r.recordset[0] || null;
}

/** @returns {{ role: 'buyer' | 'seller' } | null} */
async function getParticipantRole(pool, orderId, userId, userRole) {
  const header = await getOrderHeader(pool, orderId);
  if (!header) return null;
  if (header.buyer_id === userId) return { header, role: 'buyer' };
  if (userRole === 'seller') {
    const s = await pool
      .request()
      .input('oid', orderId)
      .input('sid', userId)
      .query(`
        SELECT 1 AS ok
        FROM order_items oi
        JOIN materials m ON m.id = oi.material_id AND m.is_deleted = 0
        WHERE oi.order_id = @oid AND oi.is_deleted = 0 AND m.user_id = @sid
      `);
    if (s.recordset.length) return { header, role: 'seller' };
  }
  return null;
}

// List orders for the current user (buyer: my purchases; seller: orders containing my materials)
router.get('/', authenticate, async (req, res) => {
  try {
    const pool = await getConnection();
    const role = req.user.role;

    const paymentJoin = `
      OUTER APPLY (
        SELECT TOP 1 ps.status AS payment_status, p.amount AS payment_amount
        FROM payments p
        JOIN payment_status ps ON p.status_id = ps.id
        WHERE p.order_id = o.id AND p.is_deleted = 0
        ORDER BY p.id DESC
      ) pay
    `;

    if (role === 'buyer') {
      const result = await pool
        .request()
        .input('buyer_id', req.user.id)
        .query(`
          SELECT
            o.id AS order_id,
            o.total_price,
            os.status AS order_status,
            o.created_at,
            o.request_id,
            pay.payment_status,
            pay.payment_amount,
            oi.material_id,
            oi.quantity,
            oi.price AS line_price,
            m.title AS material_title,
            m.image AS material_image
          FROM orders o
          JOIN order_status os ON o.status_id = os.id
          LEFT JOIN order_items oi ON oi.order_id = o.id AND oi.is_deleted = 0
          LEFT JOIN materials m ON m.id = oi.material_id AND m.is_deleted = 0
          ${paymentJoin}
          WHERE o.buyer_id = @buyer_id AND o.is_deleted = 0
          ORDER BY o.created_at DESC, oi.id
        `);
      return res.json(groupOrderRows(result.recordset));
    }

    if (role === 'seller') {
      const result = await pool
        .request()
        .input('seller_id', req.user.id)
        .query(`
          SELECT
            o.id AS order_id,
            o.total_price,
            os.status AS order_status,
            o.created_at,
            o.request_id,
            buyer.name AS buyer_name,
            pay.payment_status,
            pay.payment_amount,
            oi.material_id,
            oi.quantity,
            oi.price AS line_price,
            m.title AS material_title,
            m.image AS material_image
          FROM orders o
          JOIN order_status os ON o.status_id = os.id
          JOIN users buyer ON buyer.id = o.buyer_id
          JOIN order_items oi ON oi.order_id = o.id AND oi.is_deleted = 0
          JOIN materials m ON m.id = oi.material_id AND m.is_deleted = 0
          ${paymentJoin}
          WHERE m.user_id = @seller_id AND o.is_deleted = 0
          ORDER BY o.created_at DESC, oi.id
        `);
      return res.json(groupOrderRows(result.recordset));
    }

    return res.status(403).json({ error: 'Orders list is only available to buyers and sellers' });
  } catch (err) {
    console.error('List orders error:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Mock payment: buyer marks order as paid → payment row + order → confirmed
router.post('/:id/pay', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'buyer') {
      return res.status(403).json({ error: 'Only the buyer can record payment for this order' });
    }

    const { id } = req.params;
    const pool = await getConnection();
    const participant = await getParticipantRole(pool, id, req.user.id, req.user.role);
    if (!participant || participant.role !== 'buyer') {
      return res.status(404).json({ error: 'Order not found' });
    }

    const { header } = participant;
    if (header.status !== 'pending') {
      return res.status(400).json({ error: 'Order is not awaiting payment' });
    }

    if (header.status === 'confirmed' || header.status === 'completed') {
      const paidRow = await pool
        .request()
        .input('oid', id)
        .query(`
          SELECT TOP 1 p.id AS payment_id
          FROM payments p
          JOIN payment_status ps ON p.status_id = ps.id
          WHERE p.order_id = @oid AND p.is_deleted = 0 AND ps.status = N'paid'
          ORDER BY p.id DESC
        `);
      return res.json({
        message: 'Order already confirmed or completed',
        payment_id: paidRow.recordset[0]?.payment_id ?? null,
      });
    }

    const paidStatus = await pool.request().query(`SELECT id FROM payment_status WHERE status = 'paid'`);
    if (paidStatus.recordset.length === 0) {
      return res.status(500).json({ error: 'payment_status is misconfigured' });
    }
    const paidId = paidStatus.recordset[0].id;

    const confirmedOrder = await pool.request().query(`SELECT id FROM order_status WHERE status = 'confirmed'`);
    if (confirmedOrder.recordset.length === 0) {
      return res.status(500).json({ error: 'order_status is missing "confirmed"' });
    }
    const confirmedOrderId = confirmedOrder.recordset[0].id;

    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
      const stepUp = await new sql.Request(transaction)
        .input('oid', id)
        .input('sid', confirmedOrderId)
        .query(`
          UPDATE orders
          SET status_id = @sid, updated_at = GETDATE()
          OUTPUT INSERTED.id AS oid
          WHERE id = @oid AND is_deleted = 0
            AND status_id = (SELECT id FROM order_status WHERE status = N'pending')
        `);

      if (!stepUp.recordset?.length) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Order is not awaiting payment' });
      }

      const insPay = await new sql.Request(transaction)
        .input('order_id', id)
        .input('amount', header.total_price ?? 0)
        .input('status_id', paidId)
        .query(`
          INSERT INTO payments (order_id, amount, payment_method, status_id, is_deleted)
          OUTPUT INSERTED.id AS payment_id
          VALUES (@order_id, @amount, N'mock', @status_id, 0)
        `);

      await transaction.commit();

      return res.json({
        message: 'Mock payment recorded; order confirmed',
        payment_id: insPay.recordset[0].payment_id,
      });
    } catch (e) {
      try {
        await transaction.rollback();
      } catch {
        // ignore
      }
      throw e;
    }
  } catch (err) {
    console.error('Order pay error:', err);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

// Update order status: completed (from confirmed), cancelled (from pending)
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status: nextStatus } = req.body || {};
    if (!nextStatus || !['completed', 'cancelled'].includes(nextStatus)) {
      return res.status(400).json({ error: 'status must be "completed" or "cancelled"' });
    }

    const pool = await getConnection();
    const participant = await getParticipantRole(pool, id, req.user.id, req.user.role);
    if (!participant) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const { header } = participant;
    const current = (header.status || '').toLowerCase();

    if (nextStatus === 'cancelled') {
      if (current !== 'pending') {
        return res.status(400).json({ error: 'Only pending orders can be cancelled' });
      }
      const cancelledId = (await pool.request().query(`SELECT id FROM order_status WHERE status = 'cancelled'`))
        .recordset[0]?.id;
      if (!cancelledId) {
        return res.status(500).json({ error: 'order_status is missing "cancelled"' });
      }
      await pool
        .request()
        .input('oid', id)
        .input('sid', cancelledId)
        .query(`
          UPDATE orders
          SET status_id = @sid, updated_at = GETDATE()
          WHERE id = @oid AND is_deleted = 0
            AND status_id = (SELECT id FROM order_status WHERE status = N'pending')
        `);
      return res.json({ message: 'Order cancelled' });
    }

    // completed
    if (current !== 'confirmed') {
      return res.status(400).json({ error: 'Only confirmed orders can be marked completed' });
    }
    const completedId = (await pool.request().query(`SELECT id FROM order_status WHERE status = 'completed'`))
      .recordset[0]?.id;
    if (!completedId) {
      return res.status(500).json({ error: 'order_status is missing "completed"' });
    }
    await pool
      .request()
      .input('oid', id)
      .input('sid', completedId)
      .query(`
        UPDATE orders
        SET status_id = @sid, updated_at = GETDATE()
        WHERE id = @oid AND is_deleted = 0
          AND status_id = (SELECT id FROM order_status WHERE status = N'confirmed')
      `);
    return res.json({ message: 'Order marked completed' });
  } catch (err) {
    console.error('Order status error:', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

export default router;
