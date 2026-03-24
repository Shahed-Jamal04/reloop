import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getConnection } from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_change_this';

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const pool = await getConnection();

    // Check if user already exists
    const existingUser = await pool
      .request()
      .input('email', email)
      .query('SELECT id FROM users WHERE email = @email');

    if (existingUser.recordset.length > 0) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get role_id (default to 'buyer' if not specified)
    const roleToUse = role || 'buyer';
    const roleResult = await pool
      .request()
      .input('role', roleToUse)
      .query('SELECT id FROM roles WHERE name = @role');

    if (roleResult.recordset.length === 0) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    const roleId = roleResult.recordset[0].id;

    // Create user
    const result = await pool
      .request()
      .input('name', name)
      .input('email', email)
      .input('password', hashedPassword)
      .input('phone', phone || null)
      .input('role_id', roleId)
      .query(
        `INSERT INTO users (name, email, password, phone, role_id)
         VALUES (@name, @email, @password, @phone, @role_id);
         SELECT SCOPE_IDENTITY() as id;`
      );

    const userId = result.recordset[0].id;

    // Create user profile
    await pool
      .request()
      .input('user_id', userId)
      .query(
        `INSERT INTO profiles (user_id, rating)
         VALUES (@user_id, 0)`
      );

    // Create cart
    await pool
      .request()
      .input('user_id', userId)
      .query(
        `INSERT INTO cart (user_id)
         VALUES (@user_id)`
      );

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: userId, name, email, role: roleToUse },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const pool = await getConnection();

    // Find user
    const userResult = await pool
      .request()
      .input('email', email)
      .query(
        `SELECT u.id, u.name, u.email, u.password, r.name as role
         FROM users u
         JOIN roles r ON u.role_id = r.id
         WHERE u.email = @email AND u.is_deleted = 0`
      );

    if (userResult.recordset.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = userResult.recordset[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// VERIFY TOKEN
router.post('/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
