import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import MaterialMasterGame from '../components/MaterialMasterGame';
import RecycleBinGame from '../components/RecycleBinGame';
import RecyclingQuizGame from '../components/RecyclingQuizGame';
import EcoMemoryGame from '../components/EcoMemoryGame';
import WasteSortingGame from '../components/WasteSortingGame';
import CarbonFootprintGame from '../components/CarbonFootprintGame';
import PollutionCleanupGame from '../components/PollutionCleanupGame';
import './GamePage.css';

export function GamePage() {
  const [activeGame, setActiveGame] = useState('material');
  const { t } = useTheme();

  const GAMES = [
    { key: 'material', label: t('materialMaster'), component: <MaterialMasterGame /> },
    { key: 'recycle', label: t('trashToss'), component: <RecycleBinGame /> },
    { key: 'quiz', label: t('recyclingQuiz'), component: <RecyclingQuizGame /> },
    { key: 'memory', label: t('ecoMemory'), component: <EcoMemoryGame /> },
    { key: 'sorting', label: t('wasteSorting'), component: <WasteSortingGame /> },
    { key: 'carbon', label: t('carbonAdventure'), component: <CarbonFootprintGame /> },
    { key: 'cleanup', label: t('pollutionCleanup'), component: <PollutionCleanupGame /> },
  ];

  const activeComponent = GAMES.find((game) => game.key === activeGame)?.component;

  return (
    <div className="game-page">
      <div className="game-select-row">
        <label htmlFor="game-select" className="game-select-label">
          {t('selectGame')}:
        </label>
        <select
          id="game-select"
          className="game-select"
          value={activeGame}
          onChange={(event) => setActiveGame(event.target.value)}
        >
          {GAMES.map((game) => (
            <option key={game.key} value={game.key}>
              {game.label}
            </option>
          ))}
        </select>
      </div>

      {activeComponent}
    </div>
  );
}

export default GamePage;
