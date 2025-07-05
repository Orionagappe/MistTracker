// --- Mist Causality: Multi-User 4D Definite Item Tracker & 3D Physics Simulator Entry Point ---

const mysql = require('mysql2/promise');
const MistTracker = require('./MistTrackerVulkan.js');
const MistMulti = require('./MistMulti.js');
const MistIllum = require('./MistIllum.js');
const { storyWriter } = require('./MistTrackerVulkan.js');
const { ensureMistDatabase, updateMistData, loadMistUser, getMistDataTables } = require('./MistTrackerVulkan.js');
const { MistMenuControl, launchMistCore } = require('./MistIllum.js');

// --- DB Configuration ---
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'password',
  port: 3306,
  // socketPath: '\\\\.\\pipe\\jeffersonbrain', // Uncomment if using named pipe
};

async function main() {
  // 1. Connect to MySQL WITHOUT database first
  const dbConfigNoDB = { ...dbConfig };
  delete dbConfigNoDB.database;
  const db = await mysql.createConnection(dbConfigNoDB);

  // 2. Ensure Mist DB schema/tables exist
  await ensureMistDatabase(db);

  // 3. Generate dictionary table and English language syntax reference for storyWriter
  // (Assume updateMistData will create/populate dictionary and syntax tables as needed)
  await updateMistData(db);

  // 4. Import story using storyWriter utility
  // (For demo, load a story file or use a sample string)
  const fs = require('fs');
  const storyPath = './sample_story.rtf';
  let storyText = '';
  try {
    storyText = fs.readFileSync(storyPath, 'utf8');
  } catch (e) {
    storyText = 'Once upon a time, Alice met Bob. "Hello, Bob," said Alice. "Hi, Alice," replied Bob.';
  }
  const storyContext = storyWriter(storyText, storyPath);

  // 5. Setup table dependencies for MistMulti and MistIllum (handled by ensureMistDatabase and updateMistData)
  // If MistMulti or MistIllum require additional tables, ensure they are created here

  // 6. Generate relationships for MistIllum menus and save to appropriate db table
  // (For demo, create category/item relationships based on story context)
  const { addCategoryLine, addItemLine, loadPrimaryLine, loadCategoriesForTime } = MistTracker;
  // Ensure at least one primary line exists
  let primaryLine = await loadPrimaryLine(db, storyText, storyPath);
  if (primaryLine.length === 0) {
    await addCategoryLine(1, 'DefaultCategory', db);
  }
  // For each category, add items from statements
  const categories = await loadCategoriesForTime(1, db, storyText, storyPath);
  if (categories.length > 0 && storyContext.statements.length > 0) {
    for (const category of categories) {
      for (const stmt of storyContext.statements) {
        await addItemLine(1, stmt.statement, db); // Simplified: all items to first category
      }
    }
  }

  // 7. Setup current user in db
  const userName = process.argv[2] || 'alice';
  const userEmail = `${userName}@example.com`;
  const user = await loadMistUser(userEmail, db);

  // 8. Launch MistIllum 3D environment
  // Prepare a minimal uiRenderer for CLI/X11 demo
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

  // Launch MistIllum core (single-user mode for demo)
  launchMistCore({ db, userName: user.userName }, uiRenderer);

  console.log('Mist Causality 3D environment launched for user:', user.userName);
}

main().catch(err => {
  console.error('Error in MistCausality:', err);
});