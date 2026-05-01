import express from 'express';
import pool from '../db.js';
import { authenticate } from '../authMiddleware.js';

const router = express.Router();

/**
 * POST /api/games/scores
 * Submit a new game score
 */
router.post('/scores', authenticate, async (req, res) => {
  try {
    const { gameName, score, timeSpent } = req.body;
    const userId = req.user?.id;

    if (!userId || !gameName || score === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, gameName, score',
      });
    }

    const query = `
      INSERT INTO GameScores (userId, gameName, score, timeSpent, createdAt)
      VALUES (@userId, @gameName, @score, @timeSpent, GETDATE());
      SELECT SCOPE_IDENTITY() as id;
    `;

    const request = pool.request();
    request.input('userId', userId);
    request.input('gameName', gameName);
    request.input('score', score);
    request.input('timeSpent', timeSpent || null);

    const result = await request.query(query);
    const scoreId = result.recordset[0].id;

    // Check for achievements
    await checkAchievements(userId, gameName, score);

    res.json({
      success: true,
      message: 'Score submitted successfully',
      scoreId,
    });
  } catch (error) {
    console.error('Error submitting game score:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit game score',
      error: error.message,
    });
  }
});

/**
 * GET /api/games/leaderboard
 * Get top game scores with filtering
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const { gameName = 'material-master', period = 'all' } = req.query;

    let dateFilter = '';
    if (period === 'today') {
      dateFilter = `AND CAST(gs.createdAt AS DATE) = CAST(GETDATE() AS DATE)`;
    } else if (period === 'weekly') {
      dateFilter = `AND gs.createdAt >= DATEADD(DAY, -7, GETDATE())`;
    }

    const query = `
      SELECT TOP 50
        ROW_NUMBER() OVER (ORDER BY gs.score DESC) as rank,
        u.id,
        u.name,
        gs.score,
        gs.gameName,
        gs.createdAt as date
      FROM GameScores gs
      JOIN Users u ON gs.userId = u.id
      WHERE gs.gameName = @gameName
      ${dateFilter}
      ORDER BY gs.score DESC;
    `;

    const request = pool.request();
    request.input('gameName', gameName);

    const result = await request.query(query);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard',
      error: error.message,
    });
  }
});

/**
 * GET /api/games/user-stats/:userId
 * Get game stats for a specific user
 */
router.get('/user-stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { gameName = 'material-master' } = req.query;

    const query = `
      SELECT
        COUNT(*) as totalGames,
        MAX(score) as bestScore,
        AVG(score) as averageScore,
        @gameName as gameName
      FROM GameScores
      WHERE userId = @userId AND gameName = @gameName;
    `;

    const request = pool.request();
    request.input('userId', parseInt(userId));
    request.input('gameName', gameName);

    const result = await request.query(query);

    res.json(result.recordset[0] || {
      totalGames: 0,
      bestScore: 0,
      averageScore: 0,
      gameName,
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user stats',
      error: error.message,
    });
  }
});

/**
 * GET /api/games/achievements/:userId
 * Get user achievements/badges
 */
router.get('/achievements/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const query = `
      SELECT id, achievementType, achievementName, badge, earnedAt
      FROM UserAchievements
      WHERE userId = @userId
      ORDER BY earnedAt DESC;
    `;

    const request = pool.request();
    request.input('userId', parseInt(userId));

    const result = await request.query(query);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch achievements',
      error: error.message,
    });
  }
});

/**
 * Helper function to check and award achievements
 */
async function checkAchievements(userId, gameName, score) {
  try {
    // First Play Achievement
    const checkFirstPlay = await pool
      .request()
      .input('userId', userId)
      .input('gameName', gameName)
      .query(
        `SELECT COUNT(*) as count FROM GameScores WHERE userId = @userId AND gameName = @gameName`
      );

    if (checkFirstPlay.recordset[0].count === 1) {
      await awardAchievement(userId, 'first-play', 'First Play', '🎮');
    }

    // High Score Achievements
    if (score >= 5000) {
      await awardAchievement(userId, 'master', 'Material Master', '👑');
    } else if (score >= 3000) {
      await awardAchievement(userId, 'expert', 'Expert Player', '⭐');
    } else if (score >= 1000) {
      await awardAchievement(userId, 'novice', 'Rising Star', '✨');
    }

    // Streak Achievement
    const lastFive = await pool
      .request()
      .input('userId', userId)
      .input('gameName', gameName)
      .query(`
        SELECT TOP 5 score FROM GameScores
        WHERE userId = @userId AND gameName = @gameName
        ORDER BY createdAt DESC
      `);

    if (
      lastFive.recordset.length === 5 &&
      lastFive.recordset.every((r) => r.score >= 1000)
    ) {
      await awardAchievement(userId, 'hot-streak', '5-Game Hot Streak', '🔥');
    }
  } catch (error) {
    console.error('Error checking achievements:', error);
  }
}

/**
 * Helper function to award achievement
 */
async function awardAchievement(userId, type, name, badge) {
  try {
    const query = `
      IF NOT EXISTS (SELECT 1 FROM UserAchievements WHERE userId = @userId AND achievementType = @type)
      BEGIN
        INSERT INTO UserAchievements (userId, achievementType, achievementName, badge)
        VALUES (@userId, @type, @name, @badge)
      END
    `;

    const request = pool.request();
    request.input('userId', userId);
    request.input('type', type);
    request.input('name', name);
    request.input('badge', badge);

    await request.query(query);
  } catch (error) {
    console.error('Error awarding achievement:', error);
  }
}

export default router;
