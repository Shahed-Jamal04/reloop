import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MaterialMasterGame.css';
import './ecoMemoryGame.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { playActionSound, playSuccessSound, playFailSound, playWinSound } from '../utils/gameAudio';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const LOGO_SRC = `${process.env.PUBLIC_URL}/recyclex-logo.png`;

const PAIRS = [
  { id: 1, pairId: 1, label: 'Aluminum Can', type: 'item' },
  { id: 2, pairId: 1, label: 'Metal Bin', type: 'pair' },
  { id: 3, pairId: 2, label: 'Newspaper', type: 'item' },
  { id: 4, pairId: 2, label: 'Paper Bin', type: 'pair' },
  { id: 5, pairId: 3, label: 'Glass Bottle', type: 'item' },
  { id: 6, pairId: 3, label: 'Glass Bin', type: 'pair' },
  { id: 7, pairId: 4, label: 'Banana Peel', type: 'item' },
  { id: 8, pairId: 4, label: 'Organic Bin', type: 'pair' },
  { id: 9, pairId: 5, label: 'Plastic Cup', type: 'item' },
  { id: 10, pairId: 5, label: 'Plastic Bin', type: 'pair' },
  { id: 11, pairId: 6, label: 'Egg Carton', type: 'item' },
  { id: 12, pairId: 6, label: 'Recycling Bin', type: 'pair' },
];

const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);

export function EcoMemoryGame() {
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('menu');
  const [cards, setCards] = useState([]);
  const [firstChoice, setFirstChoice] = useState(null);
  const [secondChoice, setSecondChoice] = useState(null);
  const [matchedIds, setMatchedIds] = useState([]);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultGif, setResultGif] = useState('');
  const [previewCountdown, setPreviewCountdown] = useState(0);

  useEffect(() => {
    if (!firstChoice || !secondChoice) return;

    const isMatch = firstChoice.pairId === secondChoice.pairId && firstChoice.id !== secondChoice.id;
    const timeout = setTimeout(() => {
      if (isMatch) {
        setMatchedIds((prev) => [...prev, firstChoice.pairId]);
        setScore((prev) => prev + 120);
        setMessage('✅ Match! Great job.');
        playSuccessSound();
      } else {
        setMessage('❌ Not a match. Try again.');
        playFailSound();
      }

      setFirstChoice(null);
      setSecondChoice(null);
      setTimeout(() => setMessage(''), 800);
    }, 800);

    return () => clearTimeout(timeout);
  }, [firstChoice, secondChoice]);

  useEffect(() => {
    if (matchedIds.length === PAIRS.length / 2 && gameState === 'playing') {
      setGameState('finished');
      setResultGif(`${process.env.PUBLIC_URL}/win-2.gif`);
      playWinSound();
    }
  }, [matchedIds, gameState]);

  const startGame = () => {
    setGameState('preview');
    setCards(shuffle(PAIRS).map((item, index) => ({ ...item, uid: index + 1 })));
    setFirstChoice(null);
    setSecondChoice(null);
    setMatchedIds([]);
    setScore(0);
    setMessage('Memorize all cards. The game starts in 5 seconds!');
    setResultGif('');
    setLoading(false);
    setPreviewCountdown(5);
    playActionSound();
  };

  useEffect(() => {
    if (gameState !== 'preview') return;
    if (previewCountdown <= 0) {
      setGameState('playing');
      setMessage('Match the item with the correct bin.');
      return;
    }

    const timer = setTimeout(() => setPreviewCountdown((time) => time - 1), 1000);
    return () => clearTimeout(timer);
  }, [gameState, previewCountdown]);

  const handleCardClick = (card) => {
    if (gameState !== 'playing') return;
    if (firstChoice && secondChoice) return;
    if (matchedIds.includes(card.pairId)) return;
    if (firstChoice && firstChoice.uid === card.uid) return;

    if (!firstChoice) {
      setFirstChoice(card);
      return;
    }

    setSecondChoice(card);
  };

  const submitScore = async () => {
    if (!isAuthenticated || !user || !token) return;
    setLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/games/scores`,
        {
          userId: user.id,
          gameName: 'eco-memory',
          score,
          timeSpent: 0,
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

  const renderCardLabel = (card) => {
    const isOpen =
      gameState === 'preview' ||
      firstChoice?.uid === card.uid ||
      secondChoice?.uid === card.uid ||
      matchedIds.includes(card.pairId);

    if (!isOpen) {
      return (
        <div className="memory-card-back">
          <img src={LOGO_SRC} alt="RecycleX logo" />
        </div>
      );
    }

    return (
      <div className="memory-card-front">
        <div className="memory-card-label">{card.label}</div>
        <div className="memory-card-type">{card.type === 'item' ? 'ITEM' : 'BIN'}</div>
      </div>
    );
  };

  return (
    <div className="game-container">
      <div className="game-header">
        <h1>🧩 Eco Memory Match</h1>
        <p>Match recycling items to the right bin.</p>
      </div>

      {gameState === 'menu' && (
        <div className="game-menu">
          <div className="game-info">
            <h2>How to Play</h2>
            <ul>
              <li>✅ Flip two cards to match the recycling item with the correct bin</li>
              <li>🧠 Look for patterns and remember the card positions</li>
              <li>💯 Each match gives 120 points</li>
              <li>🎯 Match all the pairs to win</li>
            </ul>
          </div>
          <button onClick={startGame} className="btn btn-success btn-lg game-start-btn">
            Start Memory Match
          </button>
        </div>
      )}

      {(gameState === 'preview' || gameState === 'playing') && (
        <div className="game-board">
          <div className="game-stats">
            <div className="stat">
              <span className="stat-label">Score</span>
              <span className="stat-value">{score}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Matches</span>
              <span className="stat-value">{matchedIds.length}/{PAIRS.length / 2}</span>
            </div>
            {gameState === 'preview' && (
              <div className="stat">
                <span className="stat-label">Preview</span>
                <span className="stat-value">{previewCountdown}s</span>
              </div>
            )}
          </div>

          {message && <div className="game-message">{message}</div>}

          <div className="game-grid">
            <div className="game-column">
              <div className="card-grid">
                {cards.map((card) => {
                  const matched = matchedIds.includes(card.pairId);
                  return (
                    <button
                      key={card.uid}
                      className={`memory-card ${matched ? 'matched' : ''} ${firstChoice?.uid === card.uid || secondChoice?.uid === card.uid ? 'selected' : ''}`}
                      onClick={() => handleCardClick(card)}
                      disabled={gameState !== 'playing' || matched}
                    >
                      {renderCardLabel(card)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {gameState === 'finished' && (
        <div className="game-finish">
          <div className="finish-card">
            <h2>Memory Match Complete!</h2>
            <div className="finish-score">
              <span className="score-value">{score}</span>
              <span className="score-label">Points</span>
            </div>
            <p className="finish-message">
              {score >= 480
                ? 'Excellent memory! You matched every pair quickly.'
                : 'Well done! Keep improving your recycling recall.'}
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

export default EcoMemoryGame;
