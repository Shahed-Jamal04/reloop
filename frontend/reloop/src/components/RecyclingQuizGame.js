import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './MaterialMasterGame.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { playActionSound, playSuccessSound, playFailSound, playWinSound } from '../utils/gameAudio';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const QUESTIONS = [
  {
    question: 'Which item should always go in the recycling bin?',
    options: ['Plastic bottle', 'Pizza box with grease', 'Used tissue', 'Styrofoam cup'],
    answer: 'Plastic bottle',
    fact: 'Clean plastic bottles are widely recyclable and can be processed into new products.',
  },
  {
    question: 'What is the best way to dispose of a glass jar?',
    options: ['Trash can', 'Recycle bin', 'Compost', 'Donate'],
    answer: 'Recycle bin',
    fact: 'Glass jars are recyclable in most recycling programs when they are clean and dry.',
  },
  {
    question: 'Which material should NOT go in the recycling bin?',
    options: ['Paper cup', 'Aluminum can', 'Food-contaminated paper', 'Cardboard'],
    answer: 'Food-contaminated paper',
    fact: 'Paper contaminated with food can ruin the recycling batch and should go in trash or compost.',
  },
  {
    question: 'How long does it take for a plastic bottle to break down in a landfill?',
    options: ['About 6 months', '2-5 years', '100-450 years', '1 month'],
    answer: '100-450 years',
    fact: 'Plastic can persist for centuries if it does not get recycled.',
  },
  {
    question: 'What does the recycling symbol with three arrows mean?',
    options: ['Trash only', 'Reuse the item', 'The item is recyclable', 'Compost it'],
    answer: 'The item is recyclable',
    fact: 'The three-arrow symbol indicates packaging can typically be recycled.',
  },
  {
    question: 'Which item is best for composting?',
    options: ['Banana peel', 'Plastic fork', 'Glass jar', 'Styrofoam plate'],
    answer: 'Banana peel',
    fact: 'Fruit peels and food scraps are excellent for composting.',
  },
  {
    question: 'Where should a paper coffee cup go if it is clean?',
    options: ['Recycle bin', 'Trash can', 'Compost', 'Donate'],
    answer: 'Recycle bin',
    fact: 'Clean paper cups can be recycled in many systems, but check for local guidelines.',
  },
];

const shuffle = (array) => [...array].sort(() => Math.random() - 0.5);

export function RecyclingQuizGame() {
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('menu');
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const failStreakRef = useRef(0);

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
    setQuestions(shuffle(QUESTIONS));
    setGameState('playing');
    setCurrentIndex(0);
    setSelectedAnswer('');
    setScore(0);
    setTimeLeft(60);
    setMessage('');
    setLoading(false);
    failStreakRef.current = 0;
    playActionSound();
  };

  const handleAnswer = (option) => {
    if (selectedAnswer || gameState !== 'playing') return;

    const current = questions[currentIndex];
    const isCorrect = option === current.answer;
    setSelectedAnswer(option);
    setMessage(isCorrect ? '✅ Correct!' : `❌ Wrong — ${current.answer} is correct.`);

    if (isCorrect) {
      setScore((prev) => prev + 150);
      failStreakRef.current = 0;
      playSuccessSound();
    } else {
      failStreakRef.current += 1;
      playFailSound();
    }

    const timeout = setTimeout(() => {
      setSelectedAnswer('');
      setMessage('');

      if (!isCorrect && failStreakRef.current >= 3) {
        setGameState('finished');
        return;
      }

      if (currentIndex + 1 >= questions.length) {
        setGameState('finished');
        playWinSound();
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    }, 1000);

    return () => clearTimeout(timeout);
  };

  const submitScore = async () => {
    if (!isAuthenticated || !user || !token) return;
    setLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/games/scores`,
        {
          userId: user.id,
          gameName: 'recycling-quiz',
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

  const currentQuestion = questions[currentIndex] || {};

  return (
    <div className="game-container">
      <div className="game-header">
        <h1>🧠 Recycling Quiz</h1>
        <p>Answer recycling questions fast and earn points.</p>
      </div>

      {gameState === 'menu' && (
        <div className="game-menu">
          <div className="game-info">
            <h2>How to Play</h2>
            <ul>
              <li>✅ Pick the correct recycling answer</li>
              <li>⏱️ 60 seconds total time</li>
              <li>💯 150 points per correct answer</li>
              <li>🏆 Save your score and climb the leaderboard</li>
            </ul>
          </div>
          <button onClick={startGame} className="btn btn-success btn-lg game-start-btn">
            Start Quiz
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
              <span className="stat-label">Question</span>
              <span className="stat-value">{currentIndex + 1}/{questions.length}</span>
            </div>
          </div>

          {message && <div className="game-message">{message}</div>}

          <div className="game-grid">
            <div className="game-column">
              <div className="question-card">{currentQuestion.question}</div>
            </div>
            <div className="game-column">
              <div className="card-grid">
                {currentQuestion.options?.map((option) => (
                  <button
                    key={option}
                    className={`option-card ${selectedAnswer === option ? 'selected' : ''}`}
                    onClick={() => handleAnswer(option)}
                  >
                    {option}
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
            <h2>Quiz Complete!</h2>
            <div className="finish-score">
              <span className="score-value">{score}</span>
              <span className="score-label">Points</span>
            </div>
            <p className="finish-message">
              {score >= 600
                ? 'Excellent! Your recycling knowledge is strong.'
                : score >= 300
                ? 'Nice work! Keep learning more tips.'
                : 'Good start! Practice helps you improve.'}
            </p>
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

export default RecyclingQuizGame;
