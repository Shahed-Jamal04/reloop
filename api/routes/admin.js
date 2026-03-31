import express from 'express';
import { getConnection } from '../db.js';
import { authenticate } from '../authMiddleware.js';

const router = express.Router();

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// List pending materials for approval
router.get('/materials/pending', authenticate, requireAdmin, async (req, res) => {
  try {
    const pool = await getConnection();

    const result = await pool.request().query(`
      SELECT
        m.id,
        m.title,
        m.description,
        m.price,
        m.quantity,
        m.image,
        c.name AS category,
        u.name AS seller_name,
        u.email AS seller_email,
        ms.status AS status,
        m.created_at
      FROM materials m
      JOIN material_status ms ON m.status_id = ms.id
      JOIN categories c ON m.category_id = c.id
      JOIN users u ON m.user_id = u.id
      WHERE m.is_deleted = 0 AND ms.status = 'pending'
      ORDER BY m.created_at DESC
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Admin pending materials error:', err);
    res.status(500).json({ error: 'Failed to fetch pending materials' });
  }
});

// Approve a material (set to available)
router.patch('/materials/:id/approve', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    const available = await pool.request().query(`SELECT id FROM material_status WHERE status = 'available'`);
    if (available.recordset.length === 0) {
      return res.status(500).json({ error: 'material_status is missing "available" status' });
    }

    const statusId = available.recordset[0].id;

    const update = await pool
      .request()
      .input('id', id)
      .input('status_id', statusId)
      .query(`
        UPDATE materials
        SET status_id = @status_id, updated_at = GETDATE()
        WHERE id = @id AND is_deleted = 0
      `);

    if (update.rowsAffected?.[0] === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }

    res.json({ message: 'Material approved' });
  } catch (err) {
    console.error('Admin approve material error:', err);
    res.status(500).json({ error: 'Failed to approve material' });
  }
});

// Reject a material (set to removed)
router.patch('/materials/:id/reject', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    const removed = await pool.request().query(`SELECT id FROM material_status WHERE status = 'removed'`);
    if (removed.recordset.length === 0) {
      return res.status(500).json({ error: 'material_status is missing "removed" status' });
    }

    const statusId = removed.recordset[0].id;

    const update = await pool
      .request()
      .input('id', id)
      .input('status_id', statusId)
      .query(`
        UPDATE materials
        SET status_id = @status_id, updated_at = GETDATE()
        WHERE id = @id AND is_deleted = 0
      `);

    if (update.rowsAffected?.[0] === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }

    res.json({ message: 'Material rejected' });
  } catch (err) {
    console.error('Admin reject material error:', err);
    res.status(500).json({ error: 'Failed to reject material' });
  }
});

// List pending testimonials (inactive)
router.get('/testimonials/pending', authenticate, requireAdmin, async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT
        id,
        author_name,
        author_role,
        quote,
        rating,
        created_at
      FROM testimonials
      WHERE is_deleted = 0 AND is_active = 0
      ORDER BY created_at DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Admin pending testimonials error:', err);
    res.status(500).json({ error: 'Failed to fetch pending testimonials' });
  }
});

// Approve testimonial (activate)
router.patch('/testimonials/:id/approve', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();
    const update = await pool
      .request()
      .input('id', id)
      .query(`
        UPDATE testimonials
        SET is_active = 1, updated_at = GETDATE()
        WHERE id = @id AND is_deleted = 0
      `);
    if (update.rowsAffected?.[0] === 0) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }
    res.json({ message: 'Testimonial approved' });
  } catch (err) {
    console.error('Admin approve testimonial error:', err);
    res.status(500).json({ error: 'Failed to approve testimonial' });
  }
});

// Reject testimonial (soft delete)
router.patch('/testimonials/:id/reject', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();
    const update = await pool
      .request()
      .input('id', id)
      .query(`
        UPDATE testimonials
        SET is_deleted = 1, updated_at = GETDATE()
        WHERE id = @id AND is_deleted = 0
      `);
    if (update.rowsAffected?.[0] === 0) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }
    res.json({ message: 'Testimonial rejected' });
  } catch (err) {
    console.error('Admin reject testimonial error:', err);
    res.status(500).json({ error: 'Failed to reject testimonial' });
  }
});

// List users (admin)
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.phone,
        r.name AS role,
        u.is_deleted
      FROM users u
      JOIN roles r ON u.role_id = r.id
      ORDER BY u.id DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Admin list users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user role (admin)
router.patch('/users/:id/role', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body || {};

    if (!role) {
      return res.status(400).json({ error: 'role is required' });
    }

    const pool = await getConnection();
    const roleResult = await pool.request().input('role', role).query(`SELECT id FROM roles WHERE name = @role`);
    if (roleResult.recordset.length === 0) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const roleId = roleResult.recordset[0].id;
    const update = await pool
      .request()
      .input('id', id)
      .input('role_id', roleId)
      .query(`
        UPDATE users
        SET role_id = @role_id
        WHERE id = @id
      `);

    if (update.rowsAffected?.[0] === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User role updated' });
  } catch (err) {
    console.error('Admin update user role error:', err);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Disable user (soft delete)
router.patch('/users/:id/disable', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();
    const update = await pool
      .request()
      .input('id', id)
      .query(`
        UPDATE users
        SET is_deleted = 1
        WHERE id = @id
      `);
    if (update.rowsAffected?.[0] === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User disabled' });
  } catch (err) {
    console.error('Admin disable user error:', err);
    res.status(500).json({ error: 'Failed to disable user' });
  }
});

// Enable user (restore)
router.patch('/users/:id/enable', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();
    const update = await pool
      .request()
      .input('id', id)
      .query(`
        UPDATE users
        SET is_deleted = 0
        WHERE id = @id
      `);
    if (update.rowsAffected?.[0] === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User enabled' });
  } catch (err) {
    console.error('Admin enable user error:', err);
    res.status(500).json({ error: 'Failed to enable user' });
  }
});

export default router;

