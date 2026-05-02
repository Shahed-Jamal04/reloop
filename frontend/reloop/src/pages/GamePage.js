import React, { useState } from 'react';
import MaterialMasterGame from '../components/MaterialMasterGame';
import RecycleBinGame from '../components/RecycleBinGame';
import RecyclingQuizGame from '../components/RecyclingQuizGame';
import EcoMemoryGame from '../components/EcoMemoryGame';
import WasteSortingGame from '../components/WasteSortingGame';
import CarbonFootprintGame from '../components/CarbonFootprintGame';
import PollutionCleanupGame from '../components/PollutionCleanupGame';
import './GamePage.css';

const GAMES = [
  { key: 'material', label: 'Material Master', component: <MaterialMasterGame /> },
  { key: 'recycle', label: 'Trash Toss', component: <RecycleBinGame /> },
  { key: 'quiz', label: 'Recycling Quiz', component: <RecyclingQuizGame /> },
  { key: 'memory', label: 'Eco Memory', component: <EcoMemoryGame /> },
  { key: 'sorting', label: 'Waste Sorting', component: <WasteSortingGame /> },
  { key: 'carbon', label: 'Carbon Adventure', component: <CarbonFootprintGame /> },
  { key: 'cleanup', label: 'Pollution Cleanup', component: <PollutionCleanupGame /> },
];

export function GamePage() {
  const [activeGame, setActiveGame] = useState('material');

  const activeComponent = GAMES.find((game) => game.key === activeGame)?.component;

  return (
    <div className="game-page">
      <div className="game-selection-bar">
        {GAMES.map((game) => (
          <button
            key={game.key}
            className={`game-switch-btn${activeGame === game.key ? ' active' : ''}`}
            onClick={() => setActiveGame(game.key)}
          >
            {game.label}
          </button>
        ))}
      </div>

      {activeComponent}
    </div>
  );
}

export default GamePage;
