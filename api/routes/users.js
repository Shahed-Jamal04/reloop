import express from 'express';
import bcrypt from 'bcryptjs';
import { getConnection } from '../db.js';
import { authenticate } from '../authMiddleware.js';

const router = express.Router();

// GET /api/users/me — current user + profile + activity summary
router.get('/me', authenticate, async (req, res) => {
  try {
    const pool = await getConnection();

    const userResult = await pool
      .request()
      .input('id', req.user.id)
      .query(`
        SELECT
          u.id,
          u.name,
          u.email,
          u.phone,
          u.created_at,
          u.updated_at,
          r.name AS role,
          p.location,
          p.bio,
          p.rating
        FROM users u
        JOIN roles r ON u.role_id = r.id
        LEFT JOIN profiles p ON p.user_id = u.id AND p.is_deleted = 0
        WHERE u.id = @id AND u.is_deleted = 0
      `);

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.recordset[0];

    // Activity counts (role-aware)
    const activity = { listings: 0, requests: 0, orders: 0, messages: 0 };

    if (user.role === 'seller') {
      const listings = await pool
        .request()
        .input('user_id', user.id)
        .query(`
          SELECT COUNT(*) AS count
          FROM materials
          WHERE user_id = @user_id AND is_deleted = 0
        `);
      activity.listings = listings.recordset[0].count;

      const incoming = await pool
        .request()
        .input('user_id', user.id)
        .query(`
          SELECT COUNT(*) AS count
          FROM requests r
          JOIN materials m ON r.material_id = m.id
          WHERE m.user_id = @user_id AND r.is_deleted = 0
        `);
      activity.requests = incoming.recordset[0].count;

      const orders = await pool
        .request()
        .input('user_id', user.id)
        .query(`
          SELECT COUNT(DISTINCT o.id) AS count
          FROM orders o
          JOIN order_items oi ON oi.order_id = o.id AND oi.is_deleted = 0
          JOIN materials m ON m.id = oi.material_id
          WHERE m.user_id = @user_id AND o.is_deleted = 0
        `);
      activity.orders = orders.recordset[0].count;
    } else if (user.role === 'buyer') {
      const requests = await pool
        .request()
        .input('user_id', user.id)
        .query(`SELECT COUNT(*) AS count FROM requests WHERE buyer_id = @user_id AND is_deleted = 0`);
      activity.requests = requests.recordset[0].count;

      const orders = await pool
        .request()
        .input('user_id', user.id)
        .query(`SELECT COUNT(*) AS count FROM orders WHERE buyer_id = @user_id AND is_deleted = 0`);
      activity.orders = orders.recordset[0].count;
    }

    const messages = await pool
      .request()
      .input('user_id', user.id)
      .query(`
        SELECT COUNT(*) AS count
        FROM messages
        WHERE (sender_id = @user_id OR receiver_id = @user_id) AND is_deleted = 0
      `);
    activity.messages = messages.recordset[0].count;

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      location: user.location,
      bio: user.bio,
      rating: user.rating != null ? Number(user.rating) : 0,
      created_at: user.created_at,
      updated_at: user.updated_at,
      activity,
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PATCH /api/users/me — update profile info
router.patch('/me', authenticate, async (req, res) => {
  try {
    const { name, phone, location, bio } = req.body || {};

    if (name != null && !String(name).trim()) {
      return res.status(400).json({ error: 'Name cannot be empty' });
    }

    const pool = await getConnection();

    if (name != null || phone !== undefined) {
      await pool
        .request()
        .input('id', req.user.id)
        .input('name', name != null ? String(name).trim() : null)
        .input('phone', phone !== undefined ? (phone || null) : null)
        .query(`
          UPDATE users
          SET
            name = COALESCE(@name, name),
            phone = CASE WHEN @phone IS NULL AND @name IS NOT NULL THEN phone ELSE @phone END,
            updated_at = GETDATE()
          WHERE id = @id AND is_deleted = 0
        `);
    }

    // Ensure profile row exists (older accounts may not have one)
    await pool
      .request()
      .input('user_id', req.user.id)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = @user_id AND is_deleted = 0)
          INSERT INTO profiles (user_id, rating) VALUES (@user_id, 0)
      `);

    if (location !== undefined || bio !== undefined) {
      await pool
        .request()
        .input('user_id', req.user.id)
        .input('location', location !== undefined ? (location || null) : null)
        .input('bio', bio !== undefined ? (bio || null) : null)
        .input('set_location', location !== undefined ? 1 : 0)
        .input('set_bio', bio !== undefined ? 1 : 0)
        .query(`
          UPDATE profiles
          SET
            location = CASE WHEN @set_location = 1 THEN @location ELSE location END,
            bio = CASE WHEN @set_bio = 1 THEN @bio ELSE bio END,
            updated_at = GETDATE()
          WHERE user_id = @user_id AND is_deleted = 0
        `);
    }

    // Return the fresh record
    const fresh = await pool
      .request()
      .input('id', req.user.id)
      .query(`
        SELECT
          u.id, u.name, u.email, u.phone,
          r.name AS role,
          p.location, p.bio, p.rating
        FROM users u
        JOIN roles r ON u.role_id = r.id
        LEFT JOIN profiles p ON p.user_id = u.id AND p.is_deleted = 0
        WHERE u.id = @id AND u.is_deleted = 0
      `);

    const row = fresh.recordset[0];
    res.json({
      message: 'Profile updated',
      user: {
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        role: row.role,
        location: row.location,
        bio: row.bio,
        rating: row.rating != null ? Number(row.rating) : 0,
      },
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// PATCH /api/users/me/password — change password (requires current)
router.patch('/me/password', authenticate, async (req, res) => {
  try {
    const { current_password, new_password } = req.body || {};

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }
    if (String(new_password).length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    if (current_password === new_password) {
      return res.status(400).json({ error: 'New password must be different from current' });
    }

    const pool = await getConnection();

    const user = await pool
      .request()
      .input('id', req.user.id)
      .query(`SELECT password FROM users WHERE id = @id AND is_deleted = 0`);

    if (user.recordset.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const ok = await bcrypt.compare(current_password, user.recordset[0].password);
    if (!ok) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashed = await bcrypt.hash(new_password, 10);
    await pool
      .request()
      .input('id', req.user.id)
      .input('password', hashed)
      .query(`
        UPDATE users
        SET password = @password, updated_at = GETDATE()
        WHERE id = @id AND is_deleted = 0
      `);

    res.json({ message: 'Password updated' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;
