import React, { useState, useRef } from 'react';
import axios from 'axios';
import './MaterialMasterGame.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { playActionSound, playSuccessSound, playFailSound, playWinSound, playLoseSound } from '../utils/gameAudio';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const SCENARIOS = [
  {
    title: 'Morning commute',
    description: 'You need to get to work. What do you choose?',
    options: [
      { label: 'Bike or walk', delta: 20 },
      { label: 'Public transit', delta: 10 },
      { label: 'Drive alone', delta: 0 },
    ],
  },
  {
    title: 'Lunch choice',
    description: 'You are buying lunch. Which option do you take?',
    options: [
      { label: 'Reusable container', delta: 20 },
      { label: 'Takeout in paper', delta: 10 },
      { label: 'Single-use plastic', delta: 0 },
    ],
  },
  {
    title: 'Shopping trip',
    description: 'You need household supplies. Which is best?',
    options: [
      { label: 'Refillable products', delta: 20 },
      { label: 'Bulk items', delta: 10 },
      { label: 'Pre-packaged plastic', delta: 0 },
    ],
  },
  {
    title: 'Evening routine',
    description: 'How do you manage energy at home?',
    options: [
      { label: 'Turn off unused lights', delta: 20 },
      { label: 'Use LED bulbs', delta: 10 },
      { label: 'Leave everything on', delta: 0 },
    ],
  },
  {
    title: 'Waste disposal',
    description: 'A small amount of waste is left. What do you do?',
    options: [
      { label: 'Recycle or compost it', delta: 20 },
      { label: 'Throw it in trash', delta: 0 },
      { label: 'Leave it out', delta: -10 },
    ],
  },
  {
    title: 'Weekend project',
    description: 'You are building something at home. Which materials do you use?',
    options: [
      { label: 'Reclaimed wood and bamboo', delta: 20 },
      { label: 'New plastic components', delta: 5 },
      { label: 'Single-use materials', delta: 0 },
    ],
  },
];

export function CarbonFootprintGame() {
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('menu');
  const [currentStep, setCurrentStep] = useState(0);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultGif, setResultGif] = useState('');
  const failStreakRef = useRef(0);

  const startGame = () => {
    setGameState('playing');
    setCurrentStep(0);
    setScore(0);
    setMessage('');
    setResultGif('');
    setLoading(false);
    failStreakRef.current = 0;
    playActionSound();
  };

  const handleChoice = (delta, label) => {
    if (gameState !== 'playing') return;

    setScore((prev) => prev + delta);
    setMessage(`You chose ${label}.`);

    const isPoorChoice = delta <= 0;
    if (isPoorChoice) {
      failStreakRef.current += 1;
      playFailSound();
    } else {
      failStreakRef.current = 0;
      playSuccessSound();
    }

    const nextStep = currentStep + 1;
    if (failStreakRef.current >= 3) {
      setTimeout(() => {
        setGameState('finished');
        setResultGif(`${process.env.PUBLIC_URL}/lose-2.gif`);
        playLoseSound();
        setMessage('Too many poor choices. Game over.');
      }, 800);
      return;
    }

    if (nextStep >= SCENARIOS.length) {
      setTimeout(() => {
        setGameState('finished');
        if (score + delta >= 80) {
          setResultGif(`${process.env.PUBLIC_URL}/win-3.gif`);
          playWinSound();
        } else {
          setResultGif(`${process.env.PUBLIC_URL}/lose-2.gif`);
          playLoseSound();
        }
        setMessage('');
      }, 800);
      return;
    }

    setTimeout(() => {
      setCurrentStep(nextStep);
      setMessage('');
    }, 800);
  };

  const submitScore = async () => {
    if (!isAuthenticated || !user || !token) return;
    setLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/games/scores`,
        {
          userId: user.id,
          gameName: 'carbon-adventure',
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

  const currentScenario = SCENARIOS[currentStep];

  return (
    <div className="game-container">
      <div className="game-header">
        <h1>🌿 Carbon Footprint Adventure</h1>
        <p>Choose eco-friendly habits and earn the best footprint score.</p>
      </div>

      {gameState === 'menu' && (
        <div className="game-menu">
          <div className="game-info">
            <h2>How to Play</h2>
            <ul>
              <li>✅ Pick the most sustainable choice for each scenario</li>
              <li>💯 Better choices earn more points</li>
              <li>🎯 Finish 5 scenarios to complete the adventure</li>
            </ul>
          </div>
          <button onClick={startGame} className="btn btn-success btn-lg game-start-btn">
            Start Adventure
          </button>
        </div>
      )}

      {gameState === 'playing' && currentScenario && (
        <div className="game-board">
          <div className="game-stats">
            <div className="stat">
              <span className="stat-label">Footprint Score</span>
              <span className="stat-value">{score}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Scenario</span>
              <span className="stat-value">{currentStep + 1}/{SCENARIOS.length}</span>
            </div>
          </div>

          {message && <div className="game-message">{message}</div>}

          <div className="game-grid">
            <div className="game-column">
              <div className="question-card">
                <strong>{currentScenario.title}</strong>
                <p>{currentScenario.description}</p>
              </div>
            </div>
            <div className="game-column">
              <div className="card-grid">
                {currentScenario.options.map((option) => (
                  <button
                    key={option.label}
                    className="option-card"
                    onClick={() => handleChoice(option.delta, option.label)}
                  >
                    {option.label}
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
            <h2>Adventure Complete!</h2>
            <div className="finish-score">
              <span className="score-value">{score}</span>
              <span className="score-label">Points</span>
            </div>
            <p className="finish-message">
              {score >= 80
                ? 'Eco-champion! Your choices were very green.'
                : score >= 40
                ? 'Solid effort! There is room to improve.'
                : 'Keep going! Try making greener choices next time.'}
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

export default CarbonFootprintGame;
