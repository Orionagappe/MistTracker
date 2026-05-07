/**
 * Hyperbolic Rubik's Cube - Integration Example
 * 
 * Shows how to integrate the hyperbolic cube mini-game into your
 * existing MistTracker game server.
 */

// ============================================================================
// STEP 1: Import the routes in your main server file
// ============================================================================

const express = require('express');
const hyperbolicCubeRoutes = require('./hyperbolic-cube-routes.js');

const app = express();
app.use(express.json());

// Register hyperbolic cube game routes
app.use('/api/games/hyperbolic-cube', hyperbolicCubeRoutes);

// ============================================================================
// STEP 2: Add to game menu/router (React component example)
// ============================================================================

/*
In your main game component (e.g., GameMenu.jsx or Dashboard.jsx):

import HyperbolicRubiksCubeGame from './HyperbolicRubiksCubeGame.jsx';
import { useState } from 'react';

export function GameMenu() {
  const [activeGame, setActiveGame] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');

  return (
    <div className="game-menu">
      {!activeGame ? (
        <div className="menu-options">
          <div className="game-card">
            <h2>Hyperbolic Rubik's Cube</h2>
            <p>A non-standard puzzle using hyperbolic geometry</p>
            
            <div className="difficulty-selector">
              <button onClick={() => setDifficulty('easy')}>Easy</button>
              <button onClick={() => setDifficulty('medium')}>Medium</button>
              <button onClick={() => setDifficulty('hard')}>Hard</button>
            </div>
            
            <button 
              onClick={() => setActiveGame('hyperbolic-cube')}
              className="play-button"
            >
              Play Game
            </button>
          </div>
        </div>
      ) : activeGame === 'hyperbolic-cube' ? (
        <HyperbolicRubiksCubeGame 
          difficulty={difficulty}
          onSolve={(result) => {
            console.log('Solved:', result);
            // Update player stats, show results modal, etc.
            setActiveGame(null);
          }}
        />
      ) : null}
    </div>
  );
}
*/

// ============================================================================
// STEP 3: API Integration Example (Client-side)
// ============================================================================

/*
// Create a game service for API calls
class HyperbolicCubeGameService {
  constructor(baseUrl = '/api/games/hyperbolic-cube') {
    this.baseUrl = baseUrl;
  }

  async startGame(playerId, difficulty = 'medium') {
    const response = await fetch(`${this.baseUrl}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, difficulty })
    });
    return response.json();
  }

  async makeMove(sessionId, axis, layer, clockwise) {
    const response = await fetch(`${this.baseUrl}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, axis, layer, clockwise })
    });
    return response.json();
  }

  async getStatus(sessionId) {
    const response = await fetch(`${this.baseUrl}/status/${sessionId}`);
    return response.json();
  }

  async endGame(sessionId) {
    const response = await fetch(`${this.baseUrl}/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });
    return response.json();
  }

  async scramble(sessionId) {
    const response = await fetch(`${this.baseUrl}/scramble`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });
    return response.json();
  }

  async getLeaderboard(difficulty = 'all', limit = 10) {
    const response = await fetch(
      `${this.baseUrl}/leaderboard?difficulty=${difficulty}&limit=${limit}`
    );
    return response.json();
  }
}

// Usage in component:
const gameService = new HyperbolicCubeGameService();

async function playGame(playerId, difficulty) {
  // Start game
  const session = await gameService.startGame(playerId, difficulty);
  console.log('Game started:', session);

  // Make some moves
  let result = await gameService.makeMove(session.sessionId, 'x', 1, true);
  console.log('Move result:', result);

  // Check status
  const status = await gameService.getStatus(session.sessionId);
  console.log('Game status:', status);

  // End game (automatically called when solved)
  const endResult = await gameService.endGame(session.sessionId);
  console.log('Game result:', endResult);
}
*/

// ============================================================================
// STEP 4: Database Schema (for tracking scores)
// ============================================================================

/*
CREATE TABLE hyperbolic_cube_games (
  id INT PRIMARY KEY AUTO_INCREMENT,
  player_id VARCHAR(255) NOT NULL,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  difficulty ENUM('easy', 'medium', 'hard') NOT NULL,
  total_moves INT NOT NULL,
  elapsed_seconds INT NOT NULL,
  reward DECIMAL(10, 2) NOT NULL,
  is_solved BOOLEAN NOT NULL,
  achievements JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  
  INDEX idx_player_id (player_id),
  INDEX idx_difficulty (difficulty),
  INDEX idx_reward (reward DESC),
  FOREIGN KEY (player_id) REFERENCES users(id)
);

CREATE TABLE hyperbolic_cube_leaderboard (
  id INT PRIMARY KEY AUTO_INCREMENT,
  player_id VARCHAR(255) NOT NULL,
  difficulty ENUM('easy', 'medium', 'hard') NOT NULL,
  best_reward DECIMAL(10, 2) NOT NULL,
  best_time INT NOT NULL,
  best_moves INT NOT NULL,
  games_played INT NOT NULL,
  avg_reward DECIMAL(10, 2),
  
  UNIQUE KEY unique_player_difficulty (player_id, difficulty),
  FOREIGN KEY (player_id) REFERENCES users(id)
);
*/

// ============================================================================
// STEP 5: Adding Rewards to Main Game System
// ============================================================================

/*
// In your reputation/reward system:

async function updatePlayerRewards(playerId, gameResult) {
  // Add hyperbolic cube reward to player's total
  const reputationGain = gameResult.reward * GAME_REWARD_MULTIPLIER;
  
  await updatePlayerReputation(playerId, reputationGain);
  
  // Record achievement
  for (const achievement of gameResult.achievements) {
    await recordAchievement(playerId, {
      type: 'hyperbolic-cube',
      id: achievement.id,
      name: achievement.name,
      reward: achievement.bonus
    });
  }
  
  // Track game stats
  await trackGameSession(playerId, gameResult);
}
*/

// ============================================================================
// STEP 6: WebSocket Integration (optional, for real-time updates)
// ============================================================================

/*
const WebSocket = require('ws');

io.on('connection', (socket) => {
  socket.on('hyperbolic-cube:move', (data) => {
    const { sessionId, axis, layer, clockwise } = data;
    
    // Record move
    const result = sessionManager.recordMove(sessionId, axis, layer, clockwise);
    
    // Broadcast to spectators
    io.emit('hyperbolic-cube:move-result', result);
    
    // Check if solved
    if (result.isSolved) {
      io.emit('hyperbolic-cube:solved', {
        sessionId,
        message: 'Cube solved!'
      });
    }
  });
});
*/

// ============================================================================
// QUICK START CHECKLIST
// ============================================================================

/*
☐ Copy hyperbolic-cube.js to project
☐ Copy HyperbolicRubiksCubeGame.jsx to project (in React components)
☐ Copy hyperbolic-cube-integration.js to project
☐ Copy hyperbolic-cube-routes.js to project
☐ Add routes to main server file (Step 1)
☐ Add game menu option in React (Step 2)
☐ Update database schema if using persistence (Step 4)
☐ Integrate rewards with main game system (Step 5)
☐ Test the game thoroughly!

Optional:
☐ Add WebSocket support for real-time multiplayer (Step 6)
☐ Create leaderboard display component
☐ Add tutorial/help documentation
☐ Implement mobile touch controls
*/

// ============================================================================
// TESTING
// ============================================================================

/*
// Test the cube mechanics directly (Node.js)
const HyperbolicRubiksCube = require('./hyperbolic-cube.js');

const cube = new HyperbolicRubiksCube(3, -1.0);
console.log('Initial state:', cube.isCubeSolved()); // true

cube.scramble(15);
console.log('After scramble:', cube.isCubeSolved()); // false
console.log('Complexity:', cube.getComplexityScore());

cube.rotateX(1, Math.PI / 2, true);
console.log('After one move:', cube.isCubeSolved()); // probably false

// Test API
const gameService = require('./hyperbolic-cube-integration.js');
const manager = new gameService.HyperbolicCubeSessionManager();

const session = manager.createSession('test-player', 'easy');
console.log('Session created:', session.sessionId);

const moveResult = manager.recordMove(session.sessionId, 'x', 0, true);
console.log('Move result:', moveResult);
*/

module.exports = {
  // Export example functions for testing
  exampleStartGame: () => console.log('See STEP 1-2 for implementation'),
  exampleAPICall: () => console.log('See STEP 3 for implementation'),
  exampleDatabaseSchema: () => console.log('See STEP 4 for schema'),
  exampleRewardIntegration: () => console.log('See STEP 5 for integration'),
};
