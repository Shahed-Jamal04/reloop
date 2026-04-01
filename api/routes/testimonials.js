import express from 'express';
import rateLimit from 'express-rate-limit';
import { getConnection } from '../db.js';

const router = express.Router();

const createTestimonialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many testimonial submissions. Please try again later.' },
});

// Public: create testimonial (saved inactive, pending approval)
router.post('/', createTestimonialLimiter, async (req, res) => {
  try {
    const { author_name, author_role, quote, rating } = req.body || {};

    if (!author_name || !quote) {
      return res.status(400).json({ error: 'author_name and quote are required' });
    }

    const trimmedName = String(author_name).trim();
    const trimmedRole = author_role != null ? String(author_role).trim() : null;
    const trimmedQuote = String(quote).trim();

    if (trimmedName.length < 2) {
      return res.status(400).json({ error: 'author_name is too short' });
    }

    if (trimmedQuote.length < 10) {
      return res.status(400).json({ error: 'quote is too short' });
    }

    const ratingNum = rating == null || rating === '' ? null : Number(rating);
    if (ratingNum != null && (Number.isNaN(ratingNum) || ratingNum < 0 || ratingNum > 5)) {
      return res.status(400).json({ error: 'rating must be between 0 and 5' });
    }

    const pool = await getConnection();

    const created = await pool
      .request()
      .input('user_id', null)
      .input('author_name', trimmedName)
      .input('author_role', trimmedRole || null)
      .input('quote', trimmedQuote)
      .input('rating', ratingNum)
      .query(`
        INSERT INTO testimonials (
          user_id,
          author_name,
          author_role,
          quote,
          rating,
          is_active,
          is_deleted
        )
        VALUES (
          @user_id,
          @author_name,
          @author_role,
          @quote,
          @rating,
          0,
          0
        );
        SELECT SCOPE_IDENTITY() AS id;
      `);

    res.status(201).json({
      message: 'Testimonial submitted and pending approval',
      id: created.recordset[0].id,
    });
  } catch (err) {
    console.error('Create testimonial error:', err);
    res.status(500).json({ error: 'Failed to submit testimonial' });
  }
});

export default router;

