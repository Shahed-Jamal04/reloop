import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MaterialMasterGame.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { playActionSound, playSuccessSound, playWinSound, playLoseSound } from '../utils/gameAudio';

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

const BEACH_TRASH_OPTIONS = [
  { id: 1, label: 'Plastic Bottle', emoji: '🥤', points: 25 },
  { id: 2, label: 'Tin Can', emoji: '🥫', points: 20 },
  { id: 3, label: 'Plastic Bag', emoji: '🛍️', points: 30 },
  { id: 4, label: 'Soda Cup', emoji: '🥤', points: 15 },
  { id: 5, label: 'Fishing Net', emoji: '🪝', points: 35 },
  { id: 6, label: 'Beach Ball', emoji: '🏐', points: 10 },
  { id: 7, label: 'Shoe', emoji: '👟', points: 20 },
  { id: 8, label: 'Bottle Cap', emoji: '🧢', points: 15 },
  { id: 9, label: 'Food Wrapper', emoji: '🍫', points: 25 },
  { id: 10, label: 'Sunglasses', emoji: '🕶️', points: 10 },
  { id: 11, label: 'Straw', emoji: '🥤', points: 15 },
  { id: 12, label: 'Cigarette Butt', emoji: '🚬', points: 20 },
];

const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);
const randomGif = (list) => list[Math.floor(Math.random() * list.length)];
const generateBeachItems = () => shuffle(BEACH_TRASH_OPTIONS).slice(0, 6);

export function PollutionCleanupGame() {
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('menu');
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [cleanPower, setCleanPower] = useState(1);
  const [beachItems, setBeachItems] = useState(generateBeachItems());
  const [eventMessage, setEventMessage] = useState('');
  const [resultGif, setResultGif] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (gameState !== 'playing' || timeLeft === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameState('finished');
          const threshold = score >= 180;
          setResultGif(randomGif(threshold ? SUCCESS_GIFS : FAIL_GIFS));
          if (threshold) playWinSound();
          else playLoseSound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, timeLeft, score]);

  const startGame = () => {
    setGameState('playing');
    setTimeLeft(30);
    setScore(0);
    setCleanPower(1);
    setBeachItems(generateBeachItems());
    setEventMessage('');
    setResultGif('');
    setLoading(false);
    playActionSound();
  };

  const handleTrashClick = (itemId) => {
    if (gameState !== 'playing') return;

    const item = beachItems.find((entry) => entry.id === itemId);
    if (!item) return;

    setScore((prev) => prev + item.points * cleanPower);
    setBeachItems((prev) => prev.filter((entry) => entry.id !== itemId));
    playSuccessSound();
    setEventMessage(`✅ Cleaned ${item.label}! +${item.points * cleanPower}`);

    if (Math.random() < 0.25) {
      setCleanPower((prev) => Math.min(prev + 1, 4));
      setEventMessage('✨ Cleaning boost! Your next pickups are stronger.');
      playActionSound();
    }

    if (beachItems.length === 1) {
      setTimeout(() => {
        setGameState('finished');
        setResultGif(randomGif(SUCCESS_GIFS));
        playWinSound();
      }, 400);
    }

    setTimeout(() => setEventMessage(''), 900);
  };

  const submitScore = async () => {
    if (!isAuthenticated || !user || !token) return;
    setLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/games/scores`,
        {
          userId: user.id,
          gameName: 'pollution-cleanup',
          score,
          timeSpent: 30 - timeLeft,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      navigate('/leaderboard');
    } catch (err) {
      setEventMessage('Failed to save score');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="game-container">
      <div className="game-header">
        <h1>🏖️ Beach Cleanup</h1>
        <p>Click trash items on the beach to clean them before time runs out.</p>
      </div>

      {gameState === 'menu' && (
        <div className="game-menu">
          <div className="game-info">
            <h2>How to Play</h2>
            <ul>
              <li>✅ Click trash cards on the beach to clean them up</li>
              <li>💯 Each item gives points, and boosts increase your cleaning power</li>
              <li>⏱️ You have 30 seconds to remove as much pollution as possible</li>
              <li>🎯 Finish the beach or get a high score before time expires</li>
            </ul>
          </div>
          <button onClick={startGame} className="btn btn-success btn-lg game-start-btn">
            Start Beach Cleanup
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="game-board beach-board">
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
              <span className="stat-label">Boost</span>
              <span className="stat-value">x{cleanPower}</span>
            </div>
          </div>

          {eventMessage && <div className="game-message">{eventMessage}</div>}

          <div className="trash-board">
            {beachItems.map((item) => (
              <button key={item.id} className="trash-card" onClick={() => handleTrashClick(item.id)}>
                <span className="trash-emoji">{item.emoji}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="beach-hint">
            {beachItems.length > 0
              ? `Trash left: ${beachItems.length} — click fast!`
              : 'All visible trash cleaned. Wait for your final score.'}
          </div>
        </div>
      )}

      {gameState === 'finished' && (
        <div className="game-finish">
          <div className="finish-card">
            <h2>Cleanup Complete!</h2>
            <div className="finish-score">
              <span className="score-value">{score}</span>
              <span className="score-label">Points</span>
            </div>
            <p className="finish-message">
              {score >= 180
                ? 'Amazing! You cleaned the beach and helped the shoreline.'
                : 'Good effort! Try again to beat your cleanup score.'}
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

export default PollutionCleanupGame;
