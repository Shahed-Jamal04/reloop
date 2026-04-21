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

// Admin KPI overview (single call for the dashboard)
router.get('/overview', authenticate, requireAdmin, async (req, res) => {
  try {
    const pool = await getConnection();

    const [
      pendingMaterials,
      pendingTestimonials,
      usersBreakdown,
      listingsBreakdown,
      ordersBreakdown,
      revenue,
      recentMaterials,
      recentTestimonials,
      recentUsers,
    ] = await Promise.all([
      pool.request().query(`
        SELECT COUNT(*) AS count
        FROM materials m
        JOIN material_status ms ON m.status_id = ms.id
        WHERE m.is_deleted = 0 AND ms.status = 'pending'
      `),
      pool.request().query(`
        SELECT COUNT(*) AS count
        FROM testimonials
        WHERE is_deleted = 0 AND is_active = 0
      `),
      pool.request().query(`
        SELECT r.name AS role, COUNT(u.id) AS count
        FROM roles r
        LEFT JOIN users u ON u.role_id = r.id AND u.is_deleted = 0
        GROUP BY r.name
      `),
      pool.request().query(`
        SELECT ms.status, COUNT(m.id) AS count
        FROM material_status ms
        LEFT JOIN materials m ON m.status_id = ms.id AND m.is_deleted = 0
        GROUP BY ms.status
      `),
      pool.request().query(`
        SELECT os.status, COUNT(o.id) AS count
        FROM order_status os
        LEFT JOIN orders o ON o.status_id = os.id AND o.is_deleted = 0
        GROUP BY os.status
      `),
      pool.request().query(`
        SELECT COALESCE(SUM(p.amount), 0) AS total
        FROM payments p
        JOIN payment_status ps ON p.status_id = ps.id
        WHERE p.is_deleted = 0 AND ps.status = 'paid'
      `),
      pool.request().query(`
        SELECT TOP 5 m.id, m.title, m.created_at, u.name AS seller_name
        FROM materials m
        JOIN material_status ms ON m.status_id = ms.id
        JOIN users u ON u.id = m.user_id
        WHERE m.is_deleted = 0 AND ms.status = 'pending'
        ORDER BY m.created_at DESC
      `),
      pool.request().query(`
        SELECT TOP 5 id, author_name, quote, created_at
        FROM testimonials
        WHERE is_deleted = 0 AND is_active = 0
        ORDER BY created_at DESC
      `),
      pool.request().query(`
        SELECT TOP 5 u.id, u.name, u.email, r.name AS role, u.created_at
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.is_deleted = 0
        ORDER BY u.id DESC
      `),
    ]);

    const usersByRole = {};
    for (const row of usersBreakdown.recordset) {
      usersByRole[row.role] = row.count;
    }

    const listingsByStatus = {};
    for (const row of listingsBreakdown.recordset) {
      listingsByStatus[row.status] = row.count;
    }

    const ordersByStatus = {};
    for (const row of ordersBreakdown.recordset) {
      ordersByStatus[row.status] = row.count;
    }

    const totalUsers = Object.values(usersByRole).reduce((a, b) => a + b, 0);
    const totalListings = Object.values(listingsByStatus).reduce((a, b) => a + b, 0);
    const totalOrders = Object.values(ordersByStatus).reduce((a, b) => a + b, 0);

    res.json({
      kpis: {
        pending_materials: pendingMaterials.recordset[0].count,
        pending_testimonials: pendingTestimonials.recordset[0].count,
        total_users: totalUsers,
        total_listings: totalListings,
        total_orders: totalOrders,
        revenue: Number(revenue.recordset[0].total || 0),
      },
      users_by_role: usersByRole,
      listings_by_status: listingsByStatus,
      orders_by_status: ordersByStatus,
      recent: {
        materials: recentMaterials.recordset,
        testimonials: recentTestimonials.recordset,
        users: recentUsers.recordset,
      },
    });
  } catch (err) {
    console.error('Admin overview error:', err);
    res.status(500).json({ error: 'Failed to fetch admin overview' });
  }
});

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

