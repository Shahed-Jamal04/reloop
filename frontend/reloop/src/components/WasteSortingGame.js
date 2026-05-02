import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './MaterialMasterGame.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { playActionSound, playSuccessSound, playFailSound, playWinSound, playLoseSound } from '../utils/gameAudio';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const TRASH_ITEMS = [
  { id: 1, item: 'Cardboard Box', bin: 'Paper' },
  { id: 2, item: 'Plastic Bottle', bin: 'Plastic' },
  { id: 3, item: 'Tin Can', bin: 'Metal' },
  { id: 4, item: 'Apple Core', bin: 'Organic' },
  { id: 5, item: 'Glass Bottle', bin: 'Glass' },
  { id: 6, item: 'Newspaper', bin: 'Paper' },
  { id: 7, item: 'Pizza Box', bin: 'Paper' },
  { id: 8, item: 'Shampoo Bottle', bin: 'Plastic' },
  { id: 9, item: 'Soda Can', bin: 'Metal' },
  { id: 10, item: 'Banana Peel', bin: 'Organic' },
  { id: 11, item: 'Wine Bottle', bin: 'Glass' },
  { id: 12, item: 'Magazine', bin: 'Paper' },
];

const BINS = [
  { label: 'Paper', emoji: '📄' },
  { label: 'Plastic', emoji: '🥤' },
  { label: 'Metal', emoji: '🔩' },
  { label: 'Glass', emoji: '🍾' },
  { label: 'Organic', emoji: '🍎' },
];

const FAIL_GIFS = [
  `${process.env.PUBLIC_URL}/lose-1.gif`,
  `${process.env.PUBLIC_URL}/lose-2.gif`,
  `${process.env.PUBLIC_URL}/lose-3.gif`,
];

const SUCCESS_GIFS = [
  `${process.env.PUBLIC_URL}/win-1.jfif`,
  `${process.env.PUBLIC_URL}/win-2.gif`,
  `${process.env.PUBLIC_URL}/win-3.gif`,
];

const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);
const randomGif = (list) => list[Math.floor(Math.random() * list.length)];

export function WasteSortingGame() {
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('menu');
  const [items, setItems] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const failStreakRef = useRef(0);
  const [message, setMessage] = useState('');
  const [resultGif, setResultGif] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (gameState !== 'playing' || timeLeft === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameState('finished');
          setResultGif(randomGif(SUCCESS_GIFS));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  const startGame = () => {
    setGameState('playing');
    setItems(shuffle(TRASH_ITEMS));
    setScore(0);
    setTimeLeft(60);
    failStreakRef.current = 0;
    setMessage('');
    setResultGif('');
    setLoading(false);
    playActionSound();
  };

  const handleDrop = (event, binLabel) => {
    event.preventDefault();
    if (gameState !== 'playing') return;

    const itemId = Number(event.dataTransfer.getData('text/plain'));
    const item = items.find((entry) => entry.id === itemId);
    if (!item) return;

    const isCorrect = item.bin === binLabel;
    if (isCorrect) {
      setScore((prev) => prev + 100);
      setMessage(`✅ Correct! ${item.item} belongs in ${binLabel}.`);
      failStreakRef.current = 0;
      playSuccessSound();
    } else {
      failStreakRef.current += 1;
      setMessage(`❌ Wrong bin. ${item.item} belongs in ${item.bin}.`);
      setResultGif(randomGif(FAIL_GIFS));
      playFailSound();
      if (failStreakRef.current >= 3) {
        setGameState('finished');
        playLoseSound();
      }
    }

    setItems((prev) => prev.filter((entry) => entry.id !== itemId));
    setTimeout(() => setMessage(''), 900);
  };

  const handleDragStart = (event, itemId) => {
    event.dataTransfer.setData('text/plain', itemId);
  };

  const submitScore = async () => {
    if (!isAuthenticated || !user || !token) return;
    setLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/games/scores`,
        {
          userId: user.id,
          gameName: 'waste-sorting',
          score,
          timeSpent: 60 - timeLeft,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
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
        <h1>🗑️ Waste Sorting</h1>
        <p>Drag each item into the right recycling bin.</p>
      </div>

      {gameState === 'menu' && (
        <div className="game-menu">
          <div className="game-info">
            <h2>How to Play</h2>
            <ul>
              <li>✅ Drag each item to the bin it belongs in</li>
              <li>💯 Correct sorts give 100 points</li>
              <li>⚠️ 3 wrong drops ends the game</li>
              <li>⏱️ Finish as many as possible in 60 seconds</li>
            </ul>
          </div>
          <button onClick={startGame} className="btn btn-success btn-lg game-start-btn">
            Start Waste Sorting
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
              <span className={`stat-value ${timeLeft < 10 ? 'warning' : ''}`}>{timeLeft}s</span>
            </div>
            <div className="stat">
              <span className="stat-label">Remaining</span>
              <span className="stat-value">{items.length}</span>
            </div>
          </div>

          {message && <div className="game-message">{message}</div>}

          <div className="game-grid">
            <div className="game-column">
              <h3>Items</h3>
              <div className="material-list">
                {items.map((item) => (
                  <button
                    key={item.id}
                    draggable
                    onDragStart={(event) => handleDragStart(event, item.id)}
                    className="material-card"
                  >
                    {item.item}
                  </button>
                ))}
              </div>
            </div>

            <div className="game-column">
              <h3>Bins</h3>
              <div className="bin-list">
                {BINS.map((bin) => (
                  <div
                    key={bin.label}
                    className="bin-card"
                    onDrop={(event) => handleDrop(event, bin.label)}
                    onDragOver={(event) => event.preventDefault()}
                  >
                    <span className="bin-emoji">{bin.emoji}</span>
                    {bin.label}
                  </div>
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
              {items.length === 0 && score > 0
                ? 'Great work! You sorted all the items.'
                : 'Nice attempt! Practice makes sorting easier.'}
            </p>
            {resultGif && (
              <div className="feedback-gif">
                <img src={resultGif} alt="result" />
              </div>
            )}
            <div className="finish-actions">
              {isAuthenticated ? (
                <button onClick={submitScore} disabled={loading} className="btn btn-success btn-lg">
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

export default WasteSortingGame;
