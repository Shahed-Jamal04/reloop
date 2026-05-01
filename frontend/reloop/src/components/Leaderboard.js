import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Leaderboard.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export function Leaderboard() {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all-time'); // all-time, weekly, today

  useEffect(() => {
    fetchLeaderboard();
  }, [filter]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/games/leaderboard`, {
        params: { period: filter === 'today' ? 'today' : filter === 'weekly' ? 'weekly' : 'all' },
      });
      setScores(response.data || []);
      setError('');
    } catch (err) {
      setError('Failed to load leaderboard');
      console.error(err);
      // Demo data if API fails
      setScores([
        {
          rank: 1,
          name: 'Alex Champion',
          score: 5200,
          game: 'material-master',
          date: new Date(),
          badge: '👑',
        },
        {
          rank: 2,
          name: 'Jordan Swift',
          score: 4800,
          game: 'material-master',
          date: new Date(),
          badge: '🥈',
        },
        {
          rank: 3,
          name: 'Sam Leader',
          score: 4500,
          game: 'material-master',
          date: new Date(),
          badge: '🥉',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getMedalEmoji = (rank) => {
    if (rank === 1) return '👑';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getScoreColor = (rank) => {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return 'default';
  };

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h1>🏆 Leaderboard</h1>
        <p>Top Material Masters</p>
      </div>

      <div className="leaderboard-filters">
        <button
          className={`filter-btn ${filter === 'today' ? 'active' : ''}`}
          onClick={() => setFilter('today')}
        >
          Today
        </button>
        <button
          className={`filter-btn ${filter === 'weekly' ? 'active' : ''}`}
          onClick={() => setFilter('weekly')}
        >
          This Week
        </button>
        <button
          className={`filter-btn ${filter === 'all-time' ? 'active' : ''}`}
          onClick={() => setFilter('all-time')}
        >
          All Time
        </button>
      </div>

      {loading && <div className="loading">Loading leaderboard...</div>}

      {error && <div className="error-banner">{error}</div>}

      {!loading && scores.length === 0 && (
        <div className="empty-state">
          <p>No scores yet. Be the first to play Material Master!</p>
        </div>
      )}

      {!loading && scores.length > 0 && (
        <div className="leaderboard-table">
          {/* Top 3 Podium */}
          <div className="podium">
            {scores[0] && (
              <div className="podium-place podium-1">
                <div className="podium-medal">👑</div>
                <div className="podium-name">{scores[0].name || 'Player 1'}</div>
                <div className="podium-score">{scores[0].score}</div>
                <div className="podium-rank">1st</div>
              </div>
            )}

            {scores[1] && (
              <div className="podium-place podium-2">
                <div className="podium-medal">🥈</div>
                <div className="podium-name">{scores[1].name || 'Player 2'}</div>
                <div className="podium-score">{scores[1].score}</div>
                <div className="podium-rank">2nd</div>
              </div>
            )}

            {scores[2] && (
              <div className="podium-place podium-3">
                <div className="podium-medal">🥉</div>
                <div className="podium-name">{scores[2].name || 'Player 3'}</div>
                <div className="podium-score">{scores[2].score}</div>
                <div className="podium-rank">3rd</div>
              </div>
            )}
          </div>

          {/* Ranking Table */}
          <div className="ranking-table">
            <div className="table-header">
              <div className="col-rank">Rank</div>
              <div className="col-player">Player</div>
              <div className="col-score">Score</div>
              <div className="col-date">Date</div>
            </div>

            {scores.map((player, idx) => (
              <div key={idx} className={`table-row ${getScoreColor(player.rank || idx + 1)}`}>
                <div className="col-rank medal">{getMedalEmoji(player.rank || idx + 1)}</div>
                <div className="col-player">
                  <span className="player-name">{player.name || `Player ${idx + 1}`}</span>
                  <span className="player-game">Material Master</span>
                </div>
                <div className="col-score">
                  <span className="score-badge">{player.score}</span>
                </div>
                <div className="col-date">
                  {player.date
                    ? new Date(player.date).toLocaleDateString()
                    : 'Recently'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="leaderboard-cta">
        <p>Want to see your name on the leaderboard?</p>
        <a href="/game" className="btn btn-success">
          Play Material Master Now
        </a>
      </div>
    </div>
  );
}

export default Leaderboard;
