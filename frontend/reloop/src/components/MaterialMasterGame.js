import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './MaterialMasterGame.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { playActionSound, playSuccessSound, playFailSound, playWinSound, playLoseSound } from '../utils/gameAudio';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const SUCCESS_GIFS = [
  `${process.env.PUBLIC_URL}/win-1.jfif`,
  `${process.env.PUBLIC_URL}/win-2.gif`,
  `${process.env.PUBLIC_URL}/win-3.gif`,
];

const FAIL_GIFS = [
  `${process.env.PUBLIC_URL}/lose-1.gif`,
  `${process.env.PUBLIC_URL}/lose-2.gif`,
  `${process.env.PUBLIC_URL}/lose-3.gif`,
];

const MATERIAL_PAIRS = [
  { material: '🪨 Steel Scrap', industry: '🏗️ Construction', id: 1 },
  { material: '🪵 Reclaimed Wood', industry: '🏠 Furniture', id: 2 },
  { material: '♻️ Plastic Pellets', industry: '🛠️ Manufacturing', id: 3 },
  { material: '🔧 Aluminum Offcuts', industry: '✈️ Aerospace', id: 4 },
  { material: '🧱 Concrete Chunks', industry: '🚧 Civil Works', id: 5 },
  { material: '🔩 Copper Wire', industry: '⚡ Electrical', id: 6 },
  { material: '🧼 Textile Scrap', industry: '👕 Apparel', id: 7 },
  { material: '📦 Cardboard', industry: '📚 Packaging', id: 8 },
  { material: '🍷 Glass Shards', industry: '🍾 Glassworks', id: 9 },
  { material: '💡 Tungsten Filament', industry: '🔌 Lighting', id: 10 },

  // 🔥 New additions
  { material: '🛢️ Recycled Oil', industry: '🚗 Automotive', id: 11 },
  { material: '🔋 Lithium Cells', industry: '🔌 Energy Storage', id: 12 },
  { material: '📱 E-Waste Components', industry: '💻 Electronics', id: 13 },
  { material: '🧴 HDPE Plastic Flakes', industry: '🧪 Packaging', id: 14 },
  { material: '🧪 PET Plastic', industry: '🥤 Beverage', id: 15 },
  { material: '🪶 Rubber Granules', industry: '🏀 Sports Surfaces', id: 16 },
  { material: '🚗 Tire Shreds', industry: '🛣️ Road Construction', id: 17 },
  { material: '🌾 Organic Compost', industry: '🌱 Agriculture', id: 18 },
  { material: '🧂 Silica Sand (Recycled Glass)', industry: '🏭 Construction Materials', id: 19 },
  { material: '🧵 Polyester Fibers', industry: '👕 Textile Manufacturing', id: 20 },
  { material: '📀 Recycled CDs Plastic', industry: '🎨 Creative Design', id: 21 },
  { material: '🪟 Glass Panels', industry: '🏢 Architecture', id: 22 },
  { material: '🧲 Rare Earth Metals', industry: '⚙️ High-Tech Manufacturing', id: 23 },
  { material: '📦 Paper Pulp', industry: '📰 Printing', id: 24 },
  { material: '🧫 Food Waste Slurry', industry: '⚡ Biogas Energy', id: 25 },
  { material: '🧴 Cosmetic Containers', industry: '💄 Personal Care', id: 26 },
  { material: '🔌 Copper Tubing', industry: '❄️ HVAC Systems', id: 27 },
  { material: '🧱 Fly Ash', industry: '🏗️ Cement Production', id: 28 },
  { material: '🪵 Wood Chips', industry: '🔥 Biomass Energy', id: 29 },
  { material: '🧼 Fabric Fibers', industry: '🧻 Insulation', id: 30 },
];

export function MaterialMasterGame() {
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('menu'); // menu, playing, finished
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [matched, setMatched] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [industries, setIndustries] = useState([]);
  const failStreakRef = useRef(0);
  const [feedbackGif, setFeedbackGif] = useState('');
  const [resultGif, setResultGif] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const shufflePairs = (pairs) => [...pairs].sort(() => Math.random() - 0.5);
  const randomGif = (list) => list[Math.floor(Math.random() * list.length)];
  const getRandomPairs = (pairs, count = 10) => {
    const shuffled = [...pairs].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  };
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
const selectedPairs = getRandomPairs(MATERIAL_PAIRS, 10);


  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setTimeLeft(90);
    setMatched([]);
    failStreakRef.current = 0;
    setSelectedMaterial(null);
    setSelectedIndustry(null);
    setMessage('');
    setFeedbackGif('');
    setResultGif('');
    setMaterials(shufflePairs(selectedPairs));
    setIndustries(shufflePairs(selectedPairs));
    playActionSound();
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

    const isMatch = selectedMaterial.id === selectedIndustry.id;
    const currentFailStreak = failStreakRef.current;
    const nextFailStreak = isMatch ? 0 : currentFailStreak + 1;

    if (isMatch) {
      setMessage('✅ Perfect match! +100 points');
      setFeedbackGif(randomGif(SUCCESS_GIFS));
      failStreakRef.current = 0;
      playSuccessSound();
    } else {
      setMessage('❌ Not a match, try again');
      failStreakRef.current = nextFailStreak;
      setFeedbackGif(randomGif(FAIL_GIFS));
      playFailSound();
      if (nextFailStreak >= 3) {
        setGameState('finished');
        setResultGif(randomGif(FAIL_GIFS));
        playLoseSound();
      }
    }

    const timeout = setTimeout(() => {
      if (isMatch) {
        setMatched((prev) => {
          const newMatched = [...prev, selectedMaterial.id];
          if (newMatched.length === 6) {
            setGameState('finished');
            setResultGif(randomGif(SUCCESS_GIFS));
            playWinSound();
          }
          return newMatched;
        });
        setScore((prev) => prev + 100);
      }

      setSelectedMaterial(null);
      setSelectedIndustry(null);
      setMessage('');
      setFeedbackGif('');
    }, 900);

    return () => clearTimeout(timeout);
  }, [selectedMaterial, selectedIndustry]);

  const submitScore = async () => {
    if (!isAuthenticated || !user || !token) return;

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/games/scores`, {
        userId: user.id,
        gameName: 'material-master',
        score: score,
        timeSpent: 90 - timeLeft,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/leaderboard');
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
          {feedbackGif && (
            <div className="feedback-gif">
              <img src={feedbackGif} alt="game feedback" />
            </div>
          )}

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
            {resultGif && (
              <div className="result-gif">
                <img src={resultGif} alt="game result" />
              </div>
            )}

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
