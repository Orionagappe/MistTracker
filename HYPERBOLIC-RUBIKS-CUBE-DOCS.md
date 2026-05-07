# Hyperbolic Rubik's Cube Mini-Game Documentation

## Overview

The **Hyperbolic Rubik's Cube** is a non-standard puzzle mini-game integrated into MistTracker. Unlike traditional Rubik's cubes that use Euclidean 3D rotations, this variant uses **hyperbolic geometry** where rotations follow the rules of negatively-curved space.

## What Makes It Hyperbolic?

### Standard Rubik's Cube (Euclidean)
- Rotations occur on fixed axes in flat 3D space
- Angular distances are preserved (angles sum to 180° in a triangle)
- All rotations are isometries of ℝ³

### Hyperbolic Rubik's Cube
- Rotations occur in negatively-curved (hyperbolic) space
- Uses the **Poincaré disk model** for visualization
- Rotations are represented as **Möbius transformations**
- Angular relationships follow hyperbolic geometry rules (angles sum to < 180° in a triangle)

## Technical Implementation

### Rotation Mechanics

#### Standard Euclidean Rotation (Reference)
```javascript
// Standard rotation matrix
x' = x*cos(θ) - y*sin(θ)
y' = x*sin(θ) + y*cos(θ)
```

#### Hyperbolic Rotation (Our Implementation)
```javascript
// Using hyperbolic functions and rapidity parameter
rapidity = atanh(tan(θ))
cosh_r = cosh(rapidity)
sinh_r = sinh(rapidity)

x' = x*cosh(r) + y*sinh(r)
y' = x*sinh(r) + y*cosh(r)
```

The hyperbolic rotation uses **sinh** and **cosh** instead of **sin** and **cos**, which fundamentally changes how distances accumulate in rotated space.

### Key Differences

| Property | Euclidean | Hyperbolic |
|----------|-----------|-----------|
| Curvature | 0 (flat) | -1 (negative) |
| Rotation Matrix | SO(3) - orthogonal | SL(2,ℂ) - Möbius |
| Angle Preservation | Yes | Modified by rapidity |
| Distance Formula | Pythagorean | Hyperbolic (acosh-based) |
| Visual Model | Standard 3D | Poincaré disk |

## Game Mechanics

### Difficulty Levels

**Easy**
- Initial Scramble: 5 moves
- Target Time: 60 seconds
- Base Reward: 10 points
- Best For: Learning hyperbolic mechanics

**Medium**
- Initial Scramble: 15 moves
- Target Time: 60 seconds
- Base Reward: 25 points
- Best For: Standard gameplay

**Hard**
- Initial Scramble: 30 moves
- Target Time: 120 seconds (2x multiplier)
- Base Reward: 50 points
- Difficulty Bonus: 2.0x
- Best For: Expert players

### Scoring System

```
Base Reward = difficulty_base (10, 25, or 50)

Move Efficiency = max(0.1, 1 - (moves - min) / (max - min))^0.5
  where: min = 18, max = scramble_count × 3

Time Bonus = 1.0 to 1.5x (if faster than target)
           = 1.0 to 0.2x (if slower than target)

Total Reward = Base × Move_Efficiency × Time_Bonus + Achievement_Bonuses
```

### Achievements

| Achievement | Condition | Bonus |
|------------|-----------|-------|
| Speed Demon | Solve in < 30s | +10 |
| Optimal Solver | Move Efficiency > 80% | +15 |
| Eureka! | Minimal extra moves on first attempt | +20 |
| Hyperbolic Master | Complete Hard difficulty | +25 |

## API Endpoints

### Start Game
```http
POST /api/games/hyperbolic-cube/start
Content-Type: application/json

{
  "playerId": "user123",
  "difficulty": "medium"
}

Response:
{
  "sessionId": "hyperbolic-1234567890-abc123",
  "playerId": "user123",
  "difficulty": "medium",
  "initialComplexity": 45.32
}
```

### Make a Move
```http
POST /api/games/hyperbolic-cube/move
Content-Type: application/json

{
  "sessionId": "hyperbolic-1234567890-abc123",
  "axis": "x",
  "layer": 1,
  "clockwise": true
}

Response:
{
  "sessionId": "hyperbolic-1234567890-abc123",
  "move": { "axis": "x", "layer": 1, "clockwise": true },
  "moves": 5,
  "complexity": 38.2,
  "isSolved": false
}
```

### Get Session Status
```http
GET /api/games/hyperbolic-cube/status/hyperbolic-1234567890-abc123

Response:
{
  "sessionId": "hyperbolic-1234567890-abc123",
  "playerId": "user123",
  "difficulty": "medium",
  "moves": 5,
  "complexity": 38.2,
  "isSolved": false,
  "elapsedSeconds": 45.2,
  "moveHistory": [...]
}
```

### End Game
```http
POST /api/games/hyperbolic-cube/end
Content-Type: application/json

{
  "sessionId": "hyperbolic-1234567890-abc123"
}

Response:
{
  "sessionId": "hyperbolic-1234567890-abc123",
  "success": true,
  "result": {
    "isSolved": true,
    "totalMoves": 28,
    "elapsedSeconds": 67.3,
    "reward": 34.5,
    "achievements": [...]
  }
}
```

## React Component Usage

### Basic Usage
```jsx
import HyperbolicRubiksCubeGame from './HyperbolicRubiksCubeGame.jsx';

function GamePage() {
  const handleSolve = (result) => {
    console.log('Game solved!', result);
    // Update player rewards, show results, etc.
  };

  return (
    <HyperbolicRubiksCubeGame 
      difficulty="medium" 
      onSolve={handleSolve}
    />
  );
}
```

### Props
- **difficulty** (string): 'easy', 'medium', or 'hard'
- **onSolve** (function): Callback when cube is solved, receives result object

## Integration with MistTracker

### Adding to Game Routes
```javascript
const hyperbolicCubeRoutes = require('./hyperbolic-cube-routes.js');

// In your main server file
app.use('/api/games/hyperbolic-cube', hyperbolicCubeRoutes);
```

### Adding to Dashboard/Menu
```jsx
import HyperbolicRubiksCubeGame from './HyperbolicRubiksCubeGame.jsx';

// In game menu or dashboard
<GameButton 
  title="Hyperbolic Cube"
  onClick={() => setActiveGame('hyperbolic-cube')}
/>

{activeGame === 'hyperbolic-cube' && (
  <HyperbolicRubiksCubeGame difficulty="medium" />
)}
```

## Mathematical Background

### Poincaré Disk Model
The visualization uses the Poincaré disk model of hyperbolic geometry:
- Points inside unit disk represent hyperbolic plane
- Boundary circle represents infinity
- Straight lines appear as arcs
- Distances increase as you approach the boundary

### Möbius Transformations
Hyperbolic rotations are implemented as Möbius transformations of the form:
```
f(z) = (az + b) / (cz + d)
where ad - bc = 1 (preserves hyperbolic metric)
```

### Complexity Score
Measures distance from solved state using hyperbolic distance:
```
d_hyperbolic(x, y) = acosh(1 + 2*euclidean_distance²)
Total_complexity = sum of hyperbolic distances for all misplaced cells
```

## Files

- **hyperbolic-cube.js** - Core game logic and cube mechanics
- **HyperbolicRubiksCubeGame.jsx** - React UI component with Three.js rendering
- **hyperbolic-cube-integration.js** - Session management and reward logic
- **hyperbolic-cube-routes.js** - Express API routes
- **HYPERBOLIC-RUBIKS-CUBE-DOCS.md** - This documentation

## Future Enhancements

1. **Multiplayer Mode** - Compete on leaderboards with timed challenges
2. **Tutorials** - Learn hyperbolic geometry concepts through gameplay
3. **Custom Cubes** - 2x2x2, 4x4x4, and other sizes
4. **Advanced Visualizations** - Upper half-plane model, Klein disk model
5. **Harder Puzzles** - 4D hyperbolic cubes, higher curvature values
6. **Mobile Support** - Touch controls for mobile devices
7. **Achievements** - More specialized achievement categories
8. **Replay System** - Save and replay game sessions

## Known Limitations

- Current implementation uses 3x3x3 size only
- Complexity calculation may vary from intuitive difficulty
- Touch/mobile controls not yet implemented
- No leaderboard persistence in current version (database integration needed)

## Troubleshooting

**Game crashes when clicking rotate buttons**
- Ensure Three.js is properly imported
- Check browser console for WebGL errors
- Verify container element exists

**Unexpected rotation behavior**
- This is expected in hyperbolic space - rotations don't work like Euclidean rotations
- Try moves in small increments to understand the mechanics
- Complexity score shows distance from solved state

**Performance issues**
- Reduce renderer quality on slower machines
- Close other browser tabs
- Check browser GPU acceleration is enabled

## Questions or Feedback?

This is an experimental non-standard puzzle game. Feedback on difficulty and gameplay balance is welcome!
