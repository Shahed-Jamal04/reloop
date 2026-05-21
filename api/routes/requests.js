import express from 'express';
import sql from 'mssql';
import { getConnection } from '../db.js';
import { authenticate } from '../authMiddleware.js';

const router = express.Router();

async function getStatusId(pool, status) {
  const result = await pool.request().input('status', status).query(
    `SELECT id FROM request_status WHERE status = @status`
  );
  return result.recordset?.[0]?.id || null;
}

// Buyer creates a request for a material (only if available)
router.post('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'buyer') {
      return res.status(403).json({ error: 'Only buyers can create requests' });
    }

    const { material_id, message } = req.body;
    if (!material_id) {
      return res.status(400).json({ error: 'material_id is required' });
    }

    const pool = await getConnection();

    // Ensure material is available
    const material = await pool
      .request()
      .input('id', material_id)
      .query(`
        SELECT m.id
        FROM materials m
        JOIN material_status ms ON m.status_id = ms.id
        WHERE m.id = @id AND m.is_deleted = 0 AND ms.status = 'available'
      `);

    if (material.recordset.length === 0) {
      return res.status(400).json({ error: 'Material is not available' });
    }

    const pendingId = await getStatusId(pool, 'pending');
    if (!pendingId) {
      return res.status(500).json({ error: 'request_status is missing "pending"' });
    }

    const created = await pool
      .request()
      .input('material_id', material_id)
      .input('buyer_id', req.user.id)
      .input('message', message || null)
      .input('status_id', pendingId)
      .query(`
        INSERT INTO requests (material_id, buyer_id, message, status_id, is_deleted)
        VALUES (@material_id, @buyer_id, @message, @status_id, 0);
        SELECT SCOPE_IDENTITY() AS id;
      `);

    res.status(201).json({ message: 'Request created', id: created.recordset[0].id });
  } catch (err) {
    console.error('Create request error:', err);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

// Buyer: list my requests
router.get('/me', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'buyer') {
      return res.status(403).json({ error: 'Only buyers can view this list' });
    }

    const pool = await getConnection();
    const result = await pool
      .request()
      .input('buyer_id', req.user.id)
      .query(`
        SELECT
          r.id,
          r.message,
          rs.status AS status,
          r.created_at,
          m.id AS material_id,
          m.title AS material_title,
          m.image AS material_image,
          u.name AS seller_name
        FROM requests r
        JOIN request_status rs ON r.status_id = rs.id
        JOIN materials m ON r.material_id = m.id
        JOIN users u ON m.user_id = u.id
        WHERE r.buyer_id = @buyer_id AND r.is_deleted = 0
        ORDER BY r.created_at DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Buyer requests error:', err);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// Seller: incoming requests for my materials
router.get('/incoming', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'seller') {
      return res.status(403).json({ error: 'Only sellers can view this list' });
    }

    const pool = await getConnection();
    const result = await pool
      .request()
      .input('seller_id', req.user.id)
      .query(`
        SELECT
          r.id,
          r.message,
          rs.status AS status,
          r.created_at,
          m.id AS material_id,
          m.title AS material_title,
          m.image AS material_image,
          b.name AS buyer_name,
          b.email AS buyer_email
        FROM requests r
        JOIN request_status rs ON r.status_id = rs.id
        JOIN materials m ON r.material_id = m.id
        JOIN users b ON r.buyer_id = b.id
        WHERE m.user_id = @seller_id AND r.is_deleted = 0
        ORDER BY r.created_at DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Seller incoming requests error:', err);
    res.status(500).json({ error: 'Failed to fetch incoming requests' });
  }
});

// Seller: accept/reject a request
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'seller') {
      return res.status(403).json({ error: 'Only sellers can update request status' });
    }

    const { id } = req.params;
    const { status } = req.body; // accepted|rejected

    if (!status || !['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'status must be "accepted" or "rejected"' });
    }

    const pool = await getConnection();
    const pendingId = await getStatusId(pool, 'pending');
    if (!pendingId) {
      return res.status(500).json({ error: 'request_status is missing "pending"' });
    }

    const newStatusId = await getStatusId(pool, status);
    if (!newStatusId) {
      return res.status(500).json({ error: `request_status is missing "${status}"` });
    }

    if (status === 'rejected') {
      const upd = await pool
        .request()
        .input('id', id)
        .input('seller_id', req.user.id)
        .input('pending_id', pendingId)
        .input('status_id', newStatusId)
        .query(`
          UPDATE r
          SET r.status_id = @status_id, r.updated_at = GETDATE()
          FROM requests r
          INNER JOIN materials m ON r.material_id = m.id
          WHERE r.id = @id AND r.is_deleted = 0 AND m.user_id = @seller_id AND r.status_id = @pending_id
        `);

      if (!upd.rowsAffected?.[0]) {
        return res.status(400).json({ error: 'Request is not pending or was already handled' });
      }

      return res.json({ message: 'Request rejected' });
    }

    // accept: only from pending; create one order per request (idempotent via orders.request_id)
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
      const acceptUpd = await new sql.Request(transaction)
        .input('id', id)
        .input('seller_id', req.user.id)
        .input('pending_id', pendingId)
        .input('accepted_id', newStatusId)
        .query(`
          UPDATE r
          SET r.status_id = @accepted_id, r.updated_at = GETDATE()
          OUTPUT INSERTED.id AS request_id, INSERTED.buyer_id, INSERTED.material_id
          FROM requests r
          INNER JOIN materials m ON r.material_id = m.id
          WHERE r.id = @id AND r.is_deleted = 0 AND m.user_id = @seller_id AND r.status_id = @pending_id
        `);

      if (acceptUpd.recordset?.length > 0) {
        const row = acceptUpd.recordset[0];
        const requestId = row.request_id;
        const buyerId = row.buyer_id;
        const materialId = row.material_id;

        const mat = await new sql.Request(transaction)
          .input('material_id', materialId)
          .query(`
            SELECT price, quantity
            FROM materials
            WHERE id = @material_id AND is_deleted = 0
          `);

        if (mat.recordset.length === 0) {
          await transaction.rollback();
          return res.status(500).json({ error: 'Material not found for order' });
        }

        // material.price is the total for the listed quantity (lot), not per unit
        const lotPrice = mat.recordset[0].price != null ? Number(mat.recordset[0].price) : 0;
        const stockQty = mat.recordset[0].quantity != null ? Number(mat.recordset[0].quantity) : null;
        const lineQty = stockQty != null && stockQty > 0 ? stockQty : 1;
        const totalPrice = lotPrice;

        const orderPending = await new sql.Request(transaction).query(
          `SELECT id FROM order_status WHERE status = 'pending'`
        );
        if (orderPending.recordset.length === 0) {
          await transaction.rollback();
          return res.status(500).json({ error: 'order_status is missing "pending"' });
        }
        const orderStatusId = orderPending.recordset[0].id;

        const ins = await new sql.Request(transaction)
          .input('buyer_id', buyerId)
          .input('status_id', orderStatusId)
          .input('total_price', totalPrice)
          .input('request_id', requestId)
          .query(`
            INSERT INTO orders (buyer_id, status_id, total_price, request_id, is_deleted)
            OUTPUT INSERTED.id AS order_id
            VALUES (@buyer_id, @status_id, @total_price, @request_id, 0)
          `);

        const orderId = ins.recordset[0].order_id;

        await new sql.Request(transaction)
          .input('order_id', orderId)
          .input('material_id', materialId)
          .input('quantity', lineQty)
          .input('price', lotPrice)
          .query(`
            INSERT INTO order_items (order_id, material_id, quantity, price, is_deleted)
            VALUES (@order_id, @material_id, @quantity, @price, 0)
          `);

        await transaction.commit();
        return res.json({
          message: 'Request accepted and order created',
          order_id: orderId,
        });
      }

      await transaction.rollback();
    } catch (txnErr) {
      try {
        await transaction.rollback();
      } catch {
        // ignore
      }
      throw txnErr;
    }

    // Not updated: already handled — idempotent accept if order exists
    const state = await pool
      .request()
      .input('id', id)
      .input('seller_id', req.user.id)
      .query(`
        SELECT rs.status AS request_status, o.id AS order_id
        FROM requests r
        JOIN materials m ON r.material_id = m.id
        JOIN request_status rs ON r.status_id = rs.id
        LEFT JOIN orders o ON o.request_id = r.id AND o.is_deleted = 0
        WHERE r.id = @id AND r.is_deleted = 0 AND m.user_id = @seller_id
      `);

    if (state.recordset.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const { request_status, order_id } = state.recordset[0];

    if (request_status === 'accepted' && order_id) {
      return res.json({
        message: 'Request was already accepted',
        order_id,
      });
    }

    return res.status(400).json({ error: 'Request is not pending or cannot be accepted' });
  } catch (err) {
    console.error('Update request status error:', err);
    res.status(500).json({ error: 'Failed to update request status' });
  }
});

export default router;

