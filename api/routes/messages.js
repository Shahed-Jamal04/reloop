import express from 'express';
import { getConnection } from '../db.js';
import { authenticate } from '../authMiddleware.js';

const router = express.Router();

// Verify that the logged-in user is a party to the request
// Returns { request_id, buyer_id, seller_id } or null.
async function resolveParticipants(pool, requestId) {
  const result = await pool
    .request()
    .input('id', requestId)
    .query(`
      SELECT
        r.id AS request_id,
        r.buyer_id,
        m.user_id AS seller_id,
        m.title AS material_title
      FROM requests r
      JOIN materials m ON r.material_id = m.id
      WHERE r.id = @id AND r.is_deleted = 0 AND m.is_deleted = 0
    `);
  return result.recordset?.[0] || null;
}

// GET /api/requests/:id/messages — full thread for a request
router.get('/:id/messages', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    const parties = await resolveParticipants(pool, id);
    if (!parties) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const me = Number(req.user.id);
    if (me !== Number(parties.buyer_id) && me !== Number(parties.seller_id)) {
      return res.status(403).json({ error: 'You are not a participant in this request' });
    }

    const result = await pool
      .request()
      .input('request_id', id)
      .query(`
        SELECT
          msg.id,
          msg.sender_id,
          msg.receiver_id,
          msg.message,
          msg.created_at,
          s.name AS sender_name
        FROM messages msg
        JOIN users s ON msg.sender_id = s.id
        WHERE msg.request_id = @request_id AND msg.is_deleted = 0
        ORDER BY msg.created_at ASC, msg.id ASC
      `);

    res.json({
      request_id: Number(id),
      buyer_id: parties.buyer_id,
      seller_id: parties.seller_id,
      material_title: parties.material_title,
      messages: result.recordset,
    });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

// POST /api/requests/:id/messages — send a message in the thread
router.post('/:id/messages', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const raw = req.body?.message;
    const message = typeof raw === 'string' ? raw.trim() : '';

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    if (message.length > 2000) {
      return res.status(400).json({ error: 'Message is too long (max 2000 chars)' });
    }

    const pool = await getConnection();

    const parties = await resolveParticipants(pool, id);
    if (!parties) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const me = Number(req.user.id);
    const buyerId = Number(parties.buyer_id);
    const sellerId = Number(parties.seller_id);
    if (me !== buyerId && me !== sellerId) {
      return res.status(403).json({ error: 'You are not a participant in this request' });
    }
    const receiverId = me === buyerId ? sellerId : buyerId;

    const inserted = await pool
      .request()
      .input('sender_id', me)
      .input('receiver_id', receiverId)
      .input('request_id', id)
      .input('message', message)
      .query(`
        INSERT INTO messages (sender_id, receiver_id, request_id, message, is_deleted)
        OUTPUT INSERTED.id, INSERTED.sender_id, INSERTED.receiver_id, INSERTED.message, INSERTED.created_at
        VALUES (@sender_id, @receiver_id, @request_id, @message, 0)
      `);

    const row = inserted.recordset[0];
    res.status(201).json({
      id: row.id,
      sender_id: row.sender_id,
      receiver_id: row.receiver_id,
      message: row.message,
      created_at: row.created_at,
      sender_name: req.user?.name || 'You',
    });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
