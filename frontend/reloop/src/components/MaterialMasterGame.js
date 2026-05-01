import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MaterialMasterGame.css';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const MATERIAL_PAIRS = [
  { material: '🪨 Steel Scrap', industry: '🏗️ Construction', id: 1 },
  { material: '🪵 Reclaimed Wood', industry: '🏠 Furniture', id: 2 },
  { material: '♻️ Plastic Pellets', industry: '🛠️ Manufacturing', id: 3 },
  { material: '🔧 Aluminum Offcuts', industry: '✈️ Aerospace', id: 4 },
  { material: '🧱 Concrete Chunks', industry: '🚧 Civil Works', id: 5 },
  { material: '🔩 Copper Wire', industry: '⚡ Electrical', id: 6 },
];

export function MaterialMasterGame() {
  const { user, isAuthenticated } = useAuth();
  const [gameState, setGameState] = useState('menu'); // menu, playing, finished
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [matched, setMatched] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Shuffle arrays for display
  const materials = MATERIAL_PAIRS.sort(() => Math.random() - 0.5);
  const industries = MATERIAL_PAIRS.sort(() => Math.random() - 0.5);

  // Timer logic
  useEffect(() => {
    if (gameState !== 'playing' || timeLeft === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameState('finished');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setTimeLeft(90);
    setMatched([]);
    setSelectedMaterial(null);
    setSelectedIndustry(null);
    setMessage('');
  };

  const handleMaterialClick = (material) => {
    if (matched.includes(material.id)) return;
    setSelectedMaterial(material);
  };

  const handleIndustryClick = (industry) => {
    if (matched.includes(industry.id)) return;
    setSelectedIndustry(industry);
  };

  // Check for match
  useEffect(() => {
    if (!selectedMaterial || !selectedIndustry) return;

    if (selectedMaterial.id === selectedIndustry.id) {
      // Correct match
      setMatched([...matched, selectedMaterial.id]);
      setScore(score + 100);
      setMessage('✅ Perfect match! +100 points');
      setSelectedMaterial(null);
      setSelectedIndustry(null);

      setTimeout(() => setMessage(''), 3000);
    } else {
      // Wrong match
      setMessage('❌ Not a match, try again');
      setSelectedMaterial(null);
      setSelectedIndustry(null);

      setTimeout(() => setMessage(''), 3000);
    }
  }, [selectedMaterial, selectedIndustry]);

  const submitScore = async () => {
    if (!isAuthenticated || !user) return;

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/games/scores`, {
        userId: user.id,
        gameName: 'material-master',
        score: score,
        timeSpent: 90 - timeLeft,
      });
      setMessage('🎉 Score saved! Check the leaderboard');
    } catch (err) {
      setMessage('Failed to save score');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="game-container">
      <div className="game-header">
        <h1>🎮 Material Master</h1>
        <p>Match materials to their best industries!</p>
      </div>

      {gameState === 'menu' && (
        <div className="game-menu">
          <div className="game-info">
            <h2>How to Play</h2>
            <ul>
              <li>✅ Match materials with their best use case</li>
              <li>⏱️ You have 90 seconds</li>
              <li>💯 Each match = 100 points</li>
              <li>🏆 Make it to the leaderboard!</li>
            </ul>
          </div>
          <button onClick={startGame} className="btn btn-success btn-lg game-start-btn">
            Start Game
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="game-board">
          <div className="game-stats">
            <div className="stat">
              <span className="stat-label">Score</span>
              <span className="stat-value">{score}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Time</span>
              <span className={`stat-value ${timeLeft < 10 ? 'warning' : ''}`}>
                {timeLeft}s
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Matched</span>
              <span className="stat-value">{matched.length}/6</span>
            </div>
          </div>

          {message && <div className="game-message">{message}</div>}

          <div className="game-grid">
            <div className="game-column">
              <h3>Materials</h3>
              <div className="material-list">
                {materials.map((mat) => (
                  <button
                    key={mat.id}
                    className={`material-card ${
                      matched.includes(mat.id) ? 'matched' : ''
                    } ${selectedMaterial?.id === mat.id ? 'selected' : ''}`}
                    onClick={() => handleMaterialClick(mat)}
                    disabled={matched.includes(mat.id)}
                  >
                    {mat.material}
                  </button>
                ))}
              </div>
            </div>

            <div className="game-column">
              <h3>Industries</h3>
              <div className="industry-list">
                {industries.map((ind) => (
                  <button
                    key={ind.id}
                    className={`industry-card ${
                      matched.includes(ind.id) ? 'matched' : ''
                    } ${selectedIndustry?.id === ind.id ? 'selected' : ''}`}
                    onClick={() => handleIndustryClick(ind)}
                    disabled={matched.includes(ind.id)}
                  >
                    {ind.industry}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {gameState === 'finished' && (
        <div className="game-finish">
          <div className="finish-card">
            <h2>Game Over!</h2>
            <div className="finish-score">
              <span className="score-value">{score}</span>
              <span className="score-label">Points</span>
            </div>
            <p className="finish-message">
              {matched.length === 6
                ? '🎉 Perfect! You matched everything!'
                : `Good effort! You matched ${matched.length}/6 pairs`}
            </p>

            <div className="finish-actions">
              {isAuthenticated ? (
                <button
                  onClick={submitScore}
                  disabled={loading}
                  className="btn btn-success btn-lg"
                >
                  {loading ? 'Saving...' : '📊 Save Score & View Leaderboard'}
                </button>
              ) : (
                <p className="text-muted">Log in to save your score!</p>
              )}
              <button onClick={startGame} className="btn btn-outline-secondary btn-lg">
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MaterialMasterGame;
