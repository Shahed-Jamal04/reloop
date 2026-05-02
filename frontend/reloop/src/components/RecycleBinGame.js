import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './MaterialMasterGame.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { playActionSound, playSuccessSound, playFailSound, playWinSound, playLoseSound } from '../utils/gameAudio';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const TRASH_ITEMS = [
  { item: '📦 Cardboard Box', bin: 'Paper' },
  { item: '📰 Newspaper', bin: 'Paper' },
  { item: '📄 Office Paper', bin: 'Paper' },
  { item: '📚 Magazine', bin: 'Paper' },
  { item: '🥚 Egg Carton', bin: 'Paper' },
  { item: '🥤 Plastic Bottle', bin: 'Plastic' },
  { item: '🧴 Shampoo Bottle', bin: 'Plastic' },
  { item: '🛍️ Plastic Bag', bin: 'Plastic' },
  { item: '🥡 Food Container', bin: 'Plastic' },
  { item: '🧃 Juice Carton (Plastic-lined)', bin: 'Plastic' },
  { item: '🥫 Tin Can', bin: 'Metal' },
  { item: '🥤 Soda Can', bin: 'Metal' },
  { item: '🍴 Aluminum Foil (clean)', bin: 'Metal' },
  { item: '🔩 Screws', bin: 'Metal' },
  { item: '🍷 Glass Bottle', bin: 'Glass' },
  { item: '🥛 Glass Jar', bin: 'Glass' },
  { item: '🍾 Wine Bottle', bin: 'Glass' },
  { item: '🍏 Apple Core', bin: 'Organic' },
  { item: '🍌 Banana Peel', bin: 'Organic' },
  { item: '🍗 Chicken Bone', bin: 'Organic' },
  { item: '🥦 Vegetable Scraps', bin: 'Organic' },
  { item: '☕ Coffee Grounds', bin: 'Organic' },
  { item: '🔋 Battery', bin: 'Hazardous' },
  { item: '💡 Light Bulb', bin: 'Hazardous' },
  { item: '🧪 Chemicals', bin: 'Hazardous' },
  { item: '🖥️ Electronics', bin: 'Hazardous' },
  { item: '🍕 Greasy Pizza Box', bin: 'General' },
  { item: '🧻 Used Tissue', bin: 'General' },
  { item: '🍬 Candy Wrapper', bin: 'General' },
  { item: '📿 Prayer Beads', bin: 'General' },
];

const BINS = [
  { label: 'Paper', emoji: '📄' },
  { label: 'Plastic', emoji: '🥤' },
  { label: 'Metal', emoji: '🔩' },
  { label: 'Glass', emoji: '🍾' },
  { label: 'Organic', emoji: '🍎' },
  { label: 'Hazardous', emoji: '☣️' },
  { label: 'General', emoji: '🗑️' },
];

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

export function RecycleBinGame() {
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('menu');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentItem, setCurrentItem] = useState(TRASH_ITEMS[0]);
  const [selectedBin, setSelectedBin] = useState(null);
  const failStreakRef = useRef(0);
  const [feedbackGif, setFeedbackGif] = useState('');
  const [resultGif, setResultGif] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const randomGif = (list) => list[Math.floor(Math.random() * list.length)];

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

  const pickItem = () => {
    const next = TRASH_ITEMS[Math.floor(Math.random() * TRASH_ITEMS.length)];
    setCurrentItem(next);
  };

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setTimeLeft(60);
    setSelectedBin(null);
    failStreakRef.current = 0;
    setFeedbackGif('');
    setResultGif('');
    setMessage('');
    pickItem();
    playActionSound();
  };

  const handleBinClick = (bin) => {
    if (gameState !== 'playing') return;
    setSelectedBin(bin);
  };

  useEffect(() => {
    if (!selectedBin) return;

    const isCorrect = selectedBin === currentItem.bin;
    const currentFailStreak = failStreakRef.current;
    const nextFailStreak = isCorrect ? 0 : currentFailStreak + 1;

    if (isCorrect) {
      setScore((prev) => prev + 100);
      setMessage('✅ Nice! Correct bin.');
      setFeedbackGif(randomGif(SUCCESS_GIFS));
      failStreakRef.current = 0;
      playSuccessSound();
    } else {
      setMessage(`❌ Nope — ${currentItem.item} belongs in ${currentItem.bin}.`);
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
      setSelectedBin(null);
      setMessage('');
      setFeedbackGif('');
      pickItem();
    }, 1000);

    return () => clearTimeout(timeout);
  }, [selectedBin, currentItem]);

  const submitScore = async () => {
    if (!isAuthenticated || !user || !token) return;

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/games/scores`, {
        userId: user.id,
        gameName: 'trash-toss',
        score,
        timeSpent: 60 - timeLeft,
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
        <h1>♻️ Trash Toss</h1>
        <p>Choose the right recycling bin for each item.</p>
      </div>

      {gameState === 'menu' && (
        <div className="game-menu">
          <div className="game-info">
            <h2>How to Play</h2>
            <ul>
              <li>✅ Pick the correct bin for the item shown</li>
              <li>⏱️ You have 60 seconds</li>
              <li>💯 Each correct toss = 100 points</li>
              <li>🏆 Save your score when you finish</li>
            </ul>
          </div>
          <button onClick={startGame} className="btn btn-success btn-lg game-start-btn">
            Start Trash Toss
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
          </div>

          <div className="item-card">
            <span>{currentItem.item}</span>
          </div>

          {message && <div className="game-message">{message}</div>}
          {feedbackGif && (
            <div className="feedback-gif">
              <img src={feedbackGif} alt="feedback" />
            </div>
          )}

          <div className="bin-list">
            {BINS.map((bin) => (
              <button
                key={bin.label}
                className={`bin-card ${selectedBin === bin.label ? 'selected' : ''}`}
                onClick={() => handleBinClick(bin.label)}
              >
                <span className="bin-emoji">{bin.emoji}</span>
                {bin.label}
              </button>
            ))}
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
              {score >= 400
                ? 'Great job! You know your recycling bins.'
                : 'Keep practicing — recycling is a skill!'}
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

export default RecycleBinGame;
