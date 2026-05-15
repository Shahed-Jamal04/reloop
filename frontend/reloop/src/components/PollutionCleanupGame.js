import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MaterialMasterGame.css';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
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
  { id: 5, label: 'Fishing Net', emoji: '🪝', points: 40 },
  { id: 6, label: 'Beach Ball', emoji: '🏐', points: 10 },
  { id: 7, label: 'Shoe', emoji: '👟', points: 20 },
  { id: 8, label: 'Bottle Cap', emoji: '🧢', points: 15 },
  { id: 9, label: 'Food Wrapper', emoji: '🍫', points: 25 },
  { id: 10, label: 'Sunglasses', emoji: '🕶️', points: 10 },
  { id: 11, label: 'Straw', emoji: '🥤', points: 15 },
  { id: 12, label: 'Cigarette Butt', emoji: '🚬', points: 20 },

  // 🔥 New additions
  { id: 13, label: 'Glass Bottle', emoji: '🍾', points: 25 },
  { id: 14, label: 'Broken Glass', emoji: '💥', points: 35 },
  { id: 15, label: 'Flip Flop', emoji: '🩴', points: 15 },
  { id: 16, label: 'Aluminum Can', emoji: '🥤', points: 20 },
  { id: 17, label: 'Plastic Cutlery', emoji: '🍴', points: 20 },
  { id: 18, label: 'Takeout Container', emoji: '🥡', points: 25 },
  { id: 19, label: 'Rope', emoji: '🧵', points: 20 },
  { id: 20, label: 'Fishing Line', emoji: '🧶', points: 35 },
  { id: 21, label: 'Styrofoam Box', emoji: '📦', points: 30 },
  { id: 22, label: 'Drink Lid', emoji: '🥤', points: 10 },
  { id: 23, label: 'Chip Bag', emoji: '🍟', points: 20 },
  { id: 24, label: 'Ice Cream Wrapper', emoji: '🍦', points: 15 },
  { id: 25, label: 'Disposable Mask', emoji: '😷', points: 25 },
  { id: 26, label: 'Battery', emoji: '🔋', points: 40 },
  { id: 27, label: 'Spray Can', emoji: '🧴', points: 30 },
  { id: 28, label: 'Diaper', emoji: '👶', points: 35 },
  { id: 29, label: 'Cup Sleeve', emoji: '☕', points: 10 },
  { id: 30, label: 'Paper Bag', emoji: '🛍️', points: 10 },
];

const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);
const randomGif = (list) => list[Math.floor(Math.random() * list.length)];
const generateBeachItems = () => shuffle(BEACH_TRASH_OPTIONS).slice(0, 6);

export function PollutionCleanupGame() {
  const { user, token, isAuthenticated } = useAuth();
  const { t } = useTheme();
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
        <h1>{t('pollutionCleanupHeading')}</h1>
        <p>{t('pollutionCleanupDescription')}</p>
      </div>

      {gameState === 'menu' && (
        <div className="game-menu">
          <div className="game-info">
            <h2>{t('howToPlay')}</h2>
            <ul>
              <li>{t('pollutionCleanupInstr1')}</li>
              <li>{t('pollutionCleanupInstr2')}</li>
              <li>{t('pollutionCleanupInstr3')}</li>
              <li>{t('pollutionCleanupInstr4')}</li>
            </ul>
          </div>
          <button onClick={startGame} className="btn btn-success btn-lg game-start-btn">
            {t('startGame')}
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="game-board beach-board">
          <div className="game-stats">
            <div className="stat">
              <span className="stat-label">{t('score')}</span>
              <span className="stat-value">{score}</span>
            </div>
            <div className="stat">
              <span className="stat-label">{t('time')}</span>
              <span className={`stat-value ${timeLeft < 10 ? 'warning' : ''}`}>{timeLeft}s</span>
            </div>
            <div className="stat">
              <span className="stat-label">{t('boost')}</span>
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
              ? `${t('trashLeft')}: ${beachItems.length} — ${t('clickFast')}`
              : t('allTrashCleaned')}
          </div>
        </div>
      )}

      {gameState === 'finished' && (
        <div className="game-finish">
          <div className="finish-card">
            <h2>{score >= 100 ? t('beachCleanupComplete') : t('gameFailed')}</h2>
            <div className="finish-score">
              <span className="score-value">{score}</span>
              <span className="score-label">{t('points')}</span>
            </div>
            <p className="finish-message">
              {score < 100
                ? t('scoreBelow100')
                : score >= 180
                ? t('pollutionCleanupSuccess')
                : t('pollutionCleanupFailed')}
            </p>
            {resultGif && (
              <div className="feedback-gif">
                <img src={resultGif} alt="result" />
              </div>
            )}
            <div className="finish-actions">
              {isAuthenticated && score >= 100 ? (
                <button onClick={submitScore} disabled={loading} className="btn btn-success btn-lg">
                  {loading ? t('saving') : t('saveScore')}
                </button>
              ) : !isAuthenticated ? (
                <p className="text-muted">{t('loginToSave')}</p>
              ) : null}
              <button onClick={startGame} className="btn btn-outline-secondary btn-lg">
                {t('playAgain')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PollutionCleanupGame;
