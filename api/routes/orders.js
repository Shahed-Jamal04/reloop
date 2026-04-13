import express from 'express';
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

// List orders for the current user (buyer: my purchases; seller: orders containing my materials)
router.get('/', authenticate, async (req, res) => {
  try {
    const pool = await getConnection();
    const role = req.user.role;

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
            oi.material_id,
            oi.quantity,
            oi.price AS line_price,
            m.title AS material_title,
            m.image AS material_image
          FROM orders o
          JOIN order_status os ON o.status_id = os.id
          LEFT JOIN order_items oi ON oi.order_id = o.id AND oi.is_deleted = 0
          LEFT JOIN materials m ON m.id = oi.material_id AND m.is_deleted = 0
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

export default router;
