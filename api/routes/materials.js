import express from 'express';
import { getConnection } from '../db.js';
import { authenticate } from '../authMiddleware.js';

const router = express.Router();

// GET all active materials (public marketplace)
router.get('/', async (req, res) => {
  try {
    const pool = await getConnection();

    const result = await pool
      .request()
      .query(`
        SELECT 
          m.id,
          m.title,
          m.description,
          m.quantity,
          m.price,
          m.image,
          ms.status AS status,
          c.name AS category,
          u.name AS seller_name
        FROM materials m
        LEFT JOIN categories c ON m.category_id = c.id
        LEFT JOIN material_status ms ON m.status_id = ms.id
        LEFT JOIN users u ON m.user_id = u.id
        WHERE m.is_deleted = 0 AND ms.status = 'available'
        ORDER BY m.created_at DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Materials list error:', err);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

// GET materials for current seller (must be before /:id)
router.get('/me/listings', authenticate, async (req, res) => {
  try {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('user_id', req.user.id)
      .query(`
        SELECT 
          m.id,
          m.title,
          m.description,
          m.quantity,
          m.price,
          m.image,
          ms.status AS status,
          c.name AS category
        FROM materials m
        LEFT JOIN categories c ON m.category_id = c.id
        LEFT JOIN material_status ms ON m.status_id = ms.id
        WHERE m.user_id = @user_id AND m.is_deleted = 0
        ORDER BY m.created_at DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Seller listings error:', err);
    res.status(500).json({ error: 'Failed to fetch your listings' });
  }
});

// Seller: mark listing in/out of stock (marketplace only shows "available")
router.patch('/:id/stock', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'seller') {
      return res.status(403).json({ error: 'Only sellers can update listing stock status' });
    }

    const { id } = req.params;
    const { status: nextStatus } = req.body || {};
    if (!nextStatus || !['available', 'out_of_stock'].includes(nextStatus)) {
      return res.status(400).json({ error: 'status must be "available" or "out_of_stock"' });
    }

    const pool = await getConnection();

    const statusRow = await pool
      .request()
      .input('status', nextStatus)
      .query(`SELECT id FROM material_status WHERE status = @status`);

    if (statusRow.recordset.length === 0) {
      return res.status(500).json({
        error: `material_status is missing "${nextStatus}" (run db/migrations/add_material_out_of_stock_status.sql)`,
      });
    }
    const nextStatusId = statusRow.recordset[0].id;

    const allowedFrom = nextStatus === 'out_of_stock' ? 'available' : 'out_of_stock';

    const upd = await pool
      .request()
      .input('id', id)
      .input('user_id', req.user.id)
      .input('status_id', nextStatusId)
      .input('from_status', allowedFrom)
      .query(`
        UPDATE m
        SET m.status_id = @status_id, m.updated_at = GETDATE()
        OUTPUT INSERTED.id AS id
        FROM materials m
        JOIN material_status cur ON cur.id = m.status_id
        WHERE m.id = @id AND m.user_id = @user_id AND m.is_deleted = 0
          AND cur.status = @from_status
      `);

    if (!upd.recordset?.length) {
      const cur = await pool
        .request()
        .input('id', id)
        .input('user_id', req.user.id)
        .query(`
          SELECT ms.status AS status
          FROM materials m
          JOIN material_status ms ON m.status_id = ms.id
          WHERE m.id = @id AND m.user_id = @user_id AND m.is_deleted = 0
        `);

      if (cur.recordset.length === 0) {
        return res.status(404).json({ error: 'Listing not found' });
      }
      return res.status(400).json({
        error: `Listing cannot be set to ${nextStatus} from its current status (${cur.recordset[0].status})`,
      });
    }

    res.json({
      message: nextStatus === 'out_of_stock' ? 'Listing marked out of stock' : 'Listing is available again',
      id: upd.recordset[0].id,
      status: nextStatus,
    });
  } catch (err) {
    console.error('Update listing stock error:', err);
    res.status(500).json({ error: 'Failed to update listing stock status' });
  }
});

// GET single material by id (public: only available)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('id', id)
      .query(`
        SELECT 
          m.id,
          m.title,
          m.description,
          m.quantity,
          m.price,
          m.image,
          ms.status AS status,
          c.name AS category,
          u.name AS seller_name,
          u.email AS seller_email
        FROM materials m
        LEFT JOIN categories c ON m.category_id = c.id
        LEFT JOIN material_status ms ON m.status_id = ms.id
        LEFT JOIN users u ON m.user_id = u.id
        WHERE m.id = @id AND m.is_deleted = 0 AND ms.status = 'available'
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Material detail error:', err);
    res.status(500).json({ error: 'Failed to fetch material' });
  }
});

// CREATE new material (seller only)
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, price, quantity, image, category_id } = req.body;

    if (!title || !category_id) {
      return res.status(400).json({ error: 'Title and category_id are required' });
    }

    if (req.user.role !== 'seller') {
      return res.status(403).json({ error: 'Only sellers can create listings' });
    }

    const pool = await getConnection();

    const pendingStatus = await pool
      .request()
      .query(`SELECT id FROM material_status WHERE status = 'pending'`);

    if (pendingStatus.recordset.length === 0) {
      return res.status(500).json({ error: 'material_status is missing "pending" status (required for admin approval)' });
    }

    const pendingStatusId = pendingStatus.recordset[0].id;

    const result = await pool
      .request()
      .input('user_id', req.user.id)
      .input('title', title)
      .input('description', description || null)
      .input('price', price ?? null)
      .input('quantity', quantity ?? null)
      .input('image', image || null)
      .input('category_id', category_id)
      .input('status_id', pendingStatusId)
      .query(`
        INSERT INTO materials (
          user_id,
          title,
          description,
          price,
          quantity,
          image,
          category_id,
          status_id,
          is_deleted
        )
        VALUES (
          @user_id,
          @title,
          @description,
          @price,
          @quantity,
          @image,
          @category_id,
          @status_id,
          0
        );
        SELECT SCOPE_IDENTITY() AS id;
      `);

    const createdId = result.recordset[0].id;

    res.status(201).json({
      message: 'Material created and pending admin approval',
      id: createdId,
    });
  } catch (err) {
    console.error('Create material error:', err);
    res.status(500).json({ error: 'Failed to create material' });
  }
});

export default router;

