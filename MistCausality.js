// --- Mist Causality: Multi-User 4D Definite Item Tracker & 3D Physics Simulator Entry Point ---

// Use mysql2 for DB (node-mysql2-master inspired)
const mysql = require('mysql2/promise');
const MistTracker = require('./test/MistTrackerVulkan.js');
const MistMulti = require('./MistMulti.js');
const MistIllum = require('./MistIllum.js');


const dbConfig = {
  host: 'localhost',           // TCP/IP host (named pipe/socket is handled by mysql2 internally)
  user: 'root',
  password: 'password',
  //database: 'dbname',
  port: 3306,                  // Explicitly set port from my.ini
  // For named pipe/socket support on Windows:
  // The 'socketPath' option is used by mysql2 for named pipes or Unix sockets.
  // On Windows, named pipes are specified as '\\.\pipe\PIPE_NAME'
  // The socket in your my.ini is 'jeffersonbrain', so:
  // socketPath: '\\\\.\\pipe\\jeffersonbrain',
  // Uncomment the next line if you want to use named pipe instead of TCP:
  // socketPath: '\\\\.\\pipe\\jeffersonbrain',
  // For shared memory, mysql2 does not support it directly; use TCP or named pipe.
};

async function startMistCausalitySession(userName, publicKey) {
  // 1. Connect to MySQL WITHOUT database first
  const dbConfigNoDB = { ...dbConfig };
  delete dbConfigNoDB.database;
  const db = await mysql.createConnection(dbConfigNoDB);

  // 2. Ensure Mist DB schema/tables exist
  await db.query(`CREATE DATABASE IF NOT EXISTS jeffersonbrain`);
  await db.changeUser({ database: 'jeffersonbrain' });

  MistTracker.ensureMistDatabase(db);


// --- DB Configuration ---
}

// --- UI Renderer Stub (replace with real X11/CLI/GUI implementation) ---
const uiRenderer = {
  showSettingsMenu: (options, config) => {
    console.log('Settings Menu:', options.map(o => o.label));
  },
  promptSelect: (title, options, cb) => {
    console.log(title, options.map(o => o.label || o));
    cb(0); // Always select first for demo
  },
  showMenu: (options) => {
    console.log('Menu:', options.map(o => o.label));
  },
  showMessage: (msg) => {
    console.log('Message:', msg);
  },
  closeDialog: () => {},
  promptTilingConfig: (cb) => cb({ rows: 1, cols: 1 }),
  promptKeybinds: (cb) => cb({}),
  saveSessionConfig: (cfg) => {},
  loadSessionConfig: (cb) => cb({})
};

// --- Main Mist Causality Session ---
async function startMistCausalitySession(userName, publicKey) {
  // 1. Connect to DB
  const db = await mysql.createConnection(dbConfig);

  // 2. Ensure Mist DB schema/tables exist
  await db.query(`CREATE DATABASE IF NOT EXISTS mist`);
  await db.query(`USE mist`);
  MistTracker.ensureMistDatabase(db);

  // 3. Register user session (multi-user logic)
  const sessionToken = MistMulti.generateSessionToken();
  MistMulti.addUserSession(sessionToken, userName, publicKey);

  // 4. Start MistTracker session (4D definite item tracker)
  const session = MistTracker.startSession(userName);

  // 5. Initialize viewport and menu control (Selection/Map Mode)
  const { MistMenuControl } = require('./MistIllum.js');
  const menuControl = new MistIllum.MistMenuControl(db, uiRenderer);
  await menuControl.start(userName);

  // 6. Multi-user event handlers (selection, navigation, physics updates)
  MistMulti.onEvent('selection', (data, sender) => {
    MistTracker.handleSelectionBackend(session, data.selection, menuControl.selectionModeState);
    menuControl.renderMenu();
  });

  MistMulti.onEvent('physicsUpdate', (data, sender) => {
    menuControl.physicsEngine.setMode(data.mode);
    // ...update physics engine state as needed
  });

  // --- Reed-Solomon Reliable Messaging Example ---
  function sendReliableSelection(selectionData) {
    const message = Buffer.from(JSON.stringify({
      type: 'selection',
      selection: selectionData,
      sender: sessionToken
    }));
    // Use MistMulti's Reed-Solomon FEC for reliability
    MistMulti.sendReliableMessageToPeers(message, 4, 2);
  }

  // Example: Hook up reliable messaging to a menu action
  menuControl.sendReliableSelection = sendReliableSelection;

  // Example: Handle incoming FEC_SHARD messages (should be called from your peer message handler)
  MistMulti.onFECShardMessage = (msg, messageId) => {
    MistMulti.onFECShardMessage(msg, messageId);
    // Optionally, handle the recovered message here
  };

  // 7. Main interactive loop (Selection/Map Mode, 4D navigation)
  async function mainLoop() {
    // Render menu and viewport
    menuControl.renderMenu();
    // In a real app, poll for keyboard/mouse events and dispatch to menuControl or MistIllum.handleUserInput
    setTimeout(mainLoop, 1000 / 30); // 30 FPS loop
  }
  mainLoop();

  // 8. On session end, export interaction events and soundstage mapping
  async function endSessionAndExport() {
    // Gather interaction events (for demo, just use session.path)
    const events = session.path || [];
    // Example: Map each event to a sound frequency using a CSV mapping (see How-to-play-notes-from-words-under-the-influence-of-starlight-Worksheet.csv)
    // For demo, assume a mapping function getFrequencyForLetter(letter)
    const fs = require('fs');
    const csv = require('csv-parse/sync');
    const csvData = fs.readFileSync('../How-to-play-notes-from-words-under-the-influence-of-starlight-Worksheet.csv', 'utf8');
    const rows = csv.parse(csvData, { columns: true });
    const freqMap = {};
    rows.forEach(row => {
      freqMap[row['alphabet of letter in word']] = Number(row['frequency of tone associated with letter in word']);
    });

    const exportedEvents = events.map(ev => {
      // Example: If ev.value is a string, map each letter to frequency
      if (ev.value && typeof ev.value === 'string') {
        const letters = ev.value.toUpperCase().split('');
        const frequencies = letters.map(l => freqMap[l] || null);
        return { ...ev, letters, frequencies };
      }
      return ev;
    });

    // Write to file for analysis
    fs.writeFileSync(`MistCausalitySession_${userName}_${Date.now()}.json`, JSON.stringify(exportedEvents, null, 2));
    // End session in DB
    MistTracker.endSession(session, db);
    await db.end();
  }

  // 9. Attach to process exit
  process.on('exit', endSessionAndExport);
  process.on('SIGINT', () => {
    endSessionAndExport().then(() => process.exit());
  });

  console.log('Mist Causality session started for user:', userName);
}

// --- Entry Point ---
const userName = process.argv[2] || 'alice';
const publicKey = 'alice_pubkey'; // Replace with real key management

startMistCausalitySession(userName, publicKey);

// --- Testing Method for Mist Solution ---
/**
 * To test the Mist Solution:
 * 1. Run this file: `node test/MistCausality.js`
 * 2. Interact with the menu (via CLI or UI).
 * 3. Trigger a selection event (e.g., select a time/category/item).
 * 4. Call `menuControl.sendReliableSelection(selectionData)` to send a selection using Reed-Solomon FEC.
 * 5. Simulate network loss by dropping some FEC_SHARD messages and verify that the selection is still reconstructed by peers.
 * 6. On session exit (Ctrl+C), check the exported JSON file for correct event and frequency mapping.
 * 7. Review logs/output for any errors or warnings.
 */