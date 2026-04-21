Phase 17.2.0 - LOCAL TESTING QUICK START GUIDE
==============================================

This guide shows how to test Phase 17.2.0 (Multi-Atom Foundation) locally on your machine.

PREREQUISITES
=============
✓ Node.js 18+ installed
✓ npm or yarn package manager
✓ Port 5173 available (Vite dev server)
✓ Port 5000 available (multi-atom API simulator)
✓ Git workspace at j:\Portfolio Site\Gdocsdev\MistTracker

STEP 1: Start the Multi-Atom API Simulator
===========================================

The API simulator runs independently and provides mock data for all atoms.

Option A: Run in New Terminal
  cd j:\Portfolio Site\Gdocsdev\MistTracker\server
  node multiAtomAPI.js

  Expected output:
    Multi-Atom API running on http://localhost:5000
    Try: curl http://localhost:5000/api/analysis/H/status

Option B: Run in Background (PowerShell)
  Start-Process -NoNewWindow -FilePath "node" -ArgumentList "server/multiAtomAPI.js"

Verify it's running:
  curl http://localhost:5000/api/analysis/H/status
  (Should return JSON with Hydrogen status)

STEP 2: Update API_BASE in Client (if needed)
==============================================

If the dev server runs on different port, update client/src/api.js:

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

Or set environment variable:
  $env:VITE_API_URL = 'http://localhost:5000'

STEP 3: Start the React Dev Server
==================================

In a new terminal window:

  cd j:\Portfolio Site\Gdocsdev\MistTracker\client
  npm install (if needed)
  npm run dev

Expected output:
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help

STEP 4: Open the Application
============================

Navigate to: http://localhost:5173/

You should see:
  - MistTracker homepage
  - Login required (use test credentials if available)
  - After login, navigate to "Hydrogen Proxy" or Phase 17 section

STEP 5: Test Phase 17.2.0 Multi-Atom Tab
=========================================

1. Click "Multi-Atom (17.2.0)" tab
   Expected: Should see three panels:
     - Left: Atom selector grid (H-Ne)
     - Right: Training controls (placeholder until atom selected)
     - Bottom: Comparison matrix with all atoms

2. Click an atom button (e.g., Hydrogen "H")
   Expected:
     - Atom highlighted as selected
     - Training panel shows: "H - Hydrogen Training"
     - Status: "○ Idle"
     - Configuration form visible (Epochs, Batch Size, Learning Rate)

3. Test Atom Selection
   - Click on different atoms (He, Li, etc.)
   - Each should show its electron configuration
   - Training panel should update with new atom name

4. Test Training Simulation (Click "Start Training" on an atom)
   Expected behavior:
     - Status changes to "● Training"
     - Progress bar appears
     - Loss value displayed and decreasing
     - Epoch counter incrementing
     - Estimated time remaining calculated
     - Button changes to "Stop Training"

   Real behavior (simulated):
     - Training runs for configured number of epochs (default 100)
     - Takes ~100 seconds (1 epoch per second simulation)
     - Can click "Stop Training" anytime to halt

5. Test Comparison Matrix (Bottom Panel)
   Expected:
     - Table with 10 atoms (H-Ne)
     - Columns: Symbol, Name, Accuracy, Convergence Time, Speedup, Size, Status
     - Sort controls at top (by Accuracy, Convergence, Speedup)
     - Color-coded accuracy bars
     - Statistics cards: Average Accuracy, Trained Count, etc.

6. Test Sorting
   - Click "Sort by Accuracy"
   - Table reorders with highest accuracy first (should show H first, as pre-trained)
   - Click "Sort by Convergence Time"
   - Reorders by fastest convergence

7. Test Status Polling
   - Start training on Hydrogen
   - After ~10 seconds, open DevTools (F12)
   - Check Console tab
   - Should see periodic fetch calls to:
     /api/analysis/H/status
   - Status bar updates every 2-5 seconds

STEP 6: Monitor API Activity
===========================

Open browser DevTools (F12):
  1. Go to Network tab
  2. Filter by XHR/Fetch
  3. Start training on an atom
  4. You should see requests:
     - POST /api/analysis/{atom}/train
     - GET /api/analysis/{atom}/status (repeated every 2s)
     - GET /api/analysis/atoms/compare (every 30s)

STEP 7: Test Phase 17.1 Backward Compatibility
==============================================

Click "Training (17.1)" tab:
  Expected:
    - Shows Hydrogen proxy training UI from Phase 17.1
    - Displays training status with mock data
    - Shows proxy visualization
    - Controls: Start Training button

Note: This uses mock data, not real training

Click "Validation" tab:
  Expected:
    - Shows validation results
    - Validate button available

STEP 8: Check Console for Errors
================================

1. Open DevTools (F12)
2. Click Console tab
3. Look for:
   ❌ Red errors - should be NONE
   ⚠️ Yellow warnings - minimize (network warnings are OK)
   ✓ API logs - should see fetch activity

Expected logs:
  GET /api/analysis/{atom}/status - status 200
  POST /api/analysis/{atom}/train - status 200
  GET /api/analysis/atoms/compare - status 200

STEP 9: Test Responsive Design
==============================

1. Resize browser window to narrow width (< 768px)
   Expected:
     - Selector + Training stack vertically
     - Comparison matrix still visible, scrollable
     - Font sizes adjust

2. Open DevTools and use device emulation (F12 → click device icon)
   - Test on iPhone/iPad viewport
   - Test on Android/Galaxy viewport
   - Check touch targets are at least 44px

STEP 10: Database Integration (Optional, Phase 17.2.1)
=====================================================

To persist data to database:

1. Ensure MySQL/MariaDB is running
2. Run migration:
   mysql -u root -p < MULTI-ATOM-SCHEMA-PHASE-17.2.0.sql

3. Update server to mount multiAtomAPI:
   In server/app.js or index.js:
     import { mountMultiAtomAPI } from './multiAtomAPI.js';
     mountMultiAtomAPI(app);

4. Restart server
5. Training data now persisted to database

TROUBLESHOOTING
===============

Issue: "Cannot connect to API"
  Solution: Verify API simulator running on :5000
  Command: curl http://localhost:5000/api/analysis/H/status

Issue: "React components not loading"
  Solution: Check browser console for import errors
  Verify files exist:
    client/src/components/AtomSelector.jsx
    client/src/components/PerAtomTrainingPanel.jsx
    client/src/components/ProxyComparisonMatrix.jsx

Issue: "CSS not applying / looks broken"
  Solution: Force browser cache clear
  DevTools > Settings > Disable cache (while DevTools open)
  Refresh page (Ctrl+Shift+R)

Issue: "Polling not happening"
  Solution: Check Network tab in DevTools
  Should see repeated requests to /api/analysis/{atom}/status
  If not, verify:
    - Training actually started
    - API endpoint responding
    - Browser allowing fetch requests

Issue: "Training runs forever"
  Solution: Click "Stop Training" button
  Or reload page (Ctrl+R) to reset state

PERFORMANCE EXPECTATIONS
========================

Component Load Time: < 1 second
  - AtomSelector: ~200ms
  - PerAtomTrainingPanel: ~150ms
  - ProxyComparisonMatrix: ~400ms (with mock data)

API Response Times:
  - GET /api/analysis/{atom}/status: ~5-10ms
  - POST /api/analysis/{atom}/train: ~15-20ms
  - GET /api/analysis/atoms/compare: ~20-30ms

Memory Usage:
  - AtomSelector: ~2MB
  - PerAtomTrainingPanel: ~3MB
  - ProxyComparisonMatrix: ~5MB
  - Total UI: ~10MB in React

FEATURE CHECKLIST
=================

Core Features:
  ☐ Multi-atom selection (10 atoms: H-Ne)
  ☐ Per-atom training configuration
  ☐ Real-time training progress monitoring
  ☐ Training status polling
  ☐ Multi-atom comparison dashboard
  ☐ Sortable metrics table
  ☐ Color-coded performance indicators

UI/UX:
  ☐ Responsive design (desktop/tablet/mobile)
  ☐ Dark theme with Phase 17 green
  ☐ Smooth transitions and animations
  ☐ Status indicators (training/idle)
  ☐ Error messages clear and helpful
  ☐ Loading states visible

API Integration:
  ☐ GET /api/analysis/{atom}/status working
  ☐ POST /api/analysis/{atom}/train working
  ☐ DELETE /api/analysis/{atom}/train working
  ☐ GET /api/analysis/atoms/compare working
  ☐ Error handling graceful (mock data fallback)

Backward Compatibility:
  ☐ Phase 17.1 Hydrogen tabs still work
  ☐ Training/Validation/Comparison tabs present
  ☐ No breaking changes to existing UI

NEXT STEPS
==========

After successful local testing:

1. Commit Phase 17.2.0 to version control
2. Run full test suite: npm run test
3. Build production: npm run build
4. Proceed to Phase 17.2.1: Cluster Deployment
   - Start Docker cluster: docker-compose up -d
   - Deploy coordinator node
   - Implement milestone aggregation

For questions or issues:
  - Check PHASE-17.2.0-COMPLETION-SUMMARY.md
  - Review component source code
  - Check multiAtomAPI.js for API contract details
  - See database schema: MULTI-ATOM-SCHEMA-PHASE-17.2.0.sql

Good luck! Phase 17.2.0 is ready for testing! 🚀
