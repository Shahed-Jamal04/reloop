import express from 'express';
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

    // Ensure request belongs to seller's material
    const owned = await pool
      .request()
      .input('id', id)
      .input('seller_id', req.user.id)
      .query(`
        SELECT r.id
        FROM requests r
        JOIN materials m ON r.material_id = m.id
        WHERE r.id = @id AND m.user_id = @seller_id AND r.is_deleted = 0
      `);

    if (owned.recordset.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const statusId = await getStatusId(pool, status);
    if (!statusId) {
      return res.status(500).json({ error: `request_status is missing "${status}"` });
    }

    await pool
      .request()
      .input('id', id)
      .input('status_id', statusId)
      .query(`
        UPDATE requests
        SET status_id = @status_id, updated_at = GETDATE()
        WHERE id = @id AND is_deleted = 0
      `);

    res.json({ message: 'Request status updated' });
  } catch (err) {
    console.error('Update request status error:', err);
    res.status(500).json({ error: 'Failed to update request status' });
  }
});

export default router;

