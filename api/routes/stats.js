import express from 'express';
import { getConnection } from '../db.js';

const router = express.Router();

// GET Platform Statistics
router.get('/', async (req, res) => {
  try {
    const pool = await getConnection();

    // Count total materials
    const materialsCount = await pool
      .request()
      .query(`SELECT COUNT(*) as count FROM materials WHERE is_deleted = 0`);

    // Count active sellers
    const sellersCount = await pool
      .request()
      .query(`
        SELECT COUNT(DISTINCT user_id) as count 
        FROM materials 
        WHERE is_deleted = 0
      `);

    // Sum total tons (quantity)
    const tonsResult = await pool
      .request()
      .query(`
        SELECT COALESCE(SUM(quantity), 0) as total_tons 
        FROM materials 
        WHERE is_deleted = 0
      `);

    // Count categories
    const categoriesCount = await pool
      .request()
      .query(`SELECT COUNT(*) as count FROM categories WHERE is_deleted = 0`);

    res.json({
      materials_available: materialsCount.recordset[0].count,
      active_sellers: sellersCount.recordset[0].count,
      tons_saved: tonsResult.recordset[0].total_tons,
      categories: categoriesCount.recordset[0].count,
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// GET Categories with item count
router.get('/categories', async (req, res) => {
  try {
    const pool = await getConnection();

    const result = await pool
      .request()
      .query(`
        SELECT 
          c.id,
          c.name,
          COUNT(m.id) as item_count
        FROM categories c
        LEFT JOIN materials m ON c.id = m.category_id AND m.is_deleted = 0
        WHERE c.is_deleted = 0
        GROUP BY c.id, c.name
        ORDER BY item_count DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Categories error:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET User Dashboard Stats (requires auth)
router.get('/user-stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const pool = await getConnection();

    // Determine user role (buyer/seller/admin)
    const roleResult = await pool
      .request()
      .input('user_id', userId)
      .query(`
        SELECT r.name AS role
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = @user_id AND u.is_deleted = 0
      `);

    const role = roleResult.recordset?.[0]?.role || 'buyer';

    // Active listings:
    // - seller: count only available listings (approved)
    // - buyer/admin: 0
    const listings = role === 'seller'
      ? await pool
          .request()
          .input('user_id', userId)
          .query(`
            SELECT COUNT(*) as count
            FROM materials m
            JOIN material_status ms ON m.status_id = ms.id
            WHERE m.user_id = @user_id AND m.is_deleted = 0 AND ms.status = 'available'
          `)
      : { recordset: [{ count: 0 }] };

    // Pending requests:
    // - buyer: my pending requests (sent)
    // - seller: incoming pending requests on my materials
    // - admin: 0
    const pendingRequests = role === 'seller'
      ? await pool
          .request()
          .input('user_id', userId)
          .query(`
            SELECT COUNT(*) as count
            FROM requests r
            JOIN materials m ON r.material_id = m.id
            JOIN request_status rs ON r.status_id = rs.id
            WHERE m.user_id = @user_id AND r.is_deleted = 0 AND rs.status = 'pending'
          `)
      : role === 'buyer'
        ? await pool
            .request()
            .input('user_id', userId)
            .query(`
              SELECT COUNT(*) as count 
              FROM requests 
              WHERE buyer_id = @user_id 
              AND status_id = (SELECT id FROM request_status WHERE status = 'pending')
              AND is_deleted = 0
            `)
        : { recordset: [{ count: 0 }] };

    // Active orders
    const activeOrders = await pool
      .request()
      .input('user_id', userId)
      .query(`
        SELECT COUNT(*) as count 
        FROM orders 
        WHERE buyer_id = @user_id 
        AND status_id IN (
          SELECT id FROM order_status 
          WHERE status IN ('pending', 'confirmed')
        )
        AND is_deleted = 0
      `);

    // Total items traded
    const tradedItems = await pool
      .request()
      .input('user_id', userId)
      .query(`
        SELECT COALESCE(SUM(oi.quantity), 0) as total 
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        WHERE o.buyer_id = @user_id AND o.is_deleted = 0
      `);

    // Cart items count
    const cartItems = await pool
      .request()
      .input('user_id', userId)
      .query(`
        SELECT COUNT(*) as count 
        FROM cart_items ci
        JOIN cart c ON ci.cart_id = c.id
        WHERE c.user_id = @user_id AND ci.is_deleted = 0
      `);

    // Unread messages
    const unreadMessages = await pool
      .request()
      .input('user_id', userId)
      .query(`
        SELECT COUNT(*) as count 
        FROM messages 
        WHERE receiver_id = @user_id AND is_deleted = 0
        -- Add is_read column if needed
      `);

    // Total orders
    const totalOrders = await pool
      .request()
      .input('user_id', userId)
      .query(`
        SELECT COUNT(*) as count 
        FROM orders 
        WHERE buyer_id = @user_id AND is_deleted = 0
      `);

    // Total payments amount
    const totalPayments = await pool
      .request()
      .input('user_id', userId)
      .query(`
        SELECT COALESCE(SUM(p.amount), 0) as total 
        FROM payments p
        JOIN orders o ON p.order_id = o.id
        WHERE o.buyer_id = @user_id AND p.is_deleted = 0
      `);

    res.json({
      active_listings: listings.recordset[0].count,
      pending_requests: pendingRequests.recordset[0].count,
      active_orders: activeOrders.recordset[0].count,
      items_traded: tradedItems.recordset[0].total,
      cart_items: cartItems.recordset[0].count,
      unread_messages: unreadMessages.recordset[0].count,
      total_orders: totalOrders.recordset[0].count,
      total_payments: totalPayments.recordset[0].total,
    });
  } catch (err) {
    console.error('User stats error:', err);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

// GET Testimonials
router.get('/testimonials', async (req, res) => {
  try {
    const pool = await getConnection();

    const result = await pool
      .request()
      .query(`
        SELECT TOP 6
          id,
          author_name,
          author_role,
          quote,
          rating,
          created_at
        FROM testimonials
        WHERE is_active = 1 AND is_deleted = 0
        ORDER BY created_at DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Testimonials error:', err);
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
});

export default router;
