import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Leaderboard.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const GAME_OPTIONS = [
  { gameName: 'material-master', label: 'Material Master' },
  { gameName: 'trash-toss', label: 'Trash Toss' },
  { gameName: 'recycling-quiz', label: 'Recycling Quiz' },
  { gameName: 'eco-memory', label: 'Eco Memory' },
  { gameName: 'waste-sorting', label: 'Waste Sorting' },
  { gameName: 'carbon-adventure', label: 'Carbon Adventure' },
  { gameName: 'pollution-cleanup', label: 'Pollution Cleanup' },
];

const getGameLabel = (name) => GAME_OPTIONS.find((option) => option.gameName === name)?.label || 'Game';

export function Leaderboard() {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('all');
  const [gameName, setGameName] = useState('material-master');

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/games/leaderboard`, {
        params: { gameName, period },
      });
      setScores(response.data || []);
      setError('');
    } catch (err) {
      setError('Failed to load leaderboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [gameName, period]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

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
        <p>Top players across all RecycleX games</p>
      </div>

      <div className="leaderboard-filters">
        <div className="filter-group">
          {GAME_OPTIONS.map((option) => (
            <button
              key={option.gameName}
              className={`filter-btn ${gameName === option.gameName ? 'active' : ''}`}
              onClick={() => setGameName(option.gameName)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="filter-group">
          <button
            className={`filter-btn ${period === 'today' ? 'active' : ''}`}
            onClick={() => setPeriod('today')}
          >
            Today
          </button>
          <button
            className={`filter-btn ${period === 'weekly' ? 'active' : ''}`}
            onClick={() => setPeriod('weekly')}
          >
            This Week
          </button>
          <button
            className={`filter-btn ${period === 'all' ? 'active' : ''}`}
            onClick={() => setPeriod('all')}
          >
            All Time
          </button>
        </div>
      </div>

      {loading && <div className="loading">Loading leaderboard...</div>}

      {error && <div className="error-banner">{error}</div>}

      {!loading && scores.length === 0 && (
        <div className="empty-state">
          <p>No scores yet. Be the first to play {getGameLabel(gameName)}!</p>
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
                  <span className="player-game">{getGameLabel(player.gameName)}</span>
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
        <Link to="/game" className="btn btn-success">
          Play Now
        </Link>
      </div>
    </div>
  );
}

export default Leaderboard;
