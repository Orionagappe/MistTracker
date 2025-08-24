// --- Mist Causality: Multi-User 4D Definite Item Tracker & 3D Physics Simulator Entry Point ---

import mysql from 'mysql2/promise';
import nvk from 'nvk';
import * as MistTracker from './MistTrackerVulkan.js';
import * as MistMulti from './MistMulti.js';
import * as MistIllum from './MistIllum.js';
import { storyWriter } from './MistTrackerVulkan.js';
import { ensureMistDatabase, updateMistData, loadMistUser, getMistDataTables } from './MistTrackerVulkan.js';
import { MistMenuControl, launchMistCore } from './MistIllum.js';
import fs from 'node:fs';
import { MenuManager, MenuPage, Button, Slider, Dropdown } from './MistInterface.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Setup Vulkan rendering context
const instance = new nvk.Instance();
const physicalDevice = instance.physicalDevices[0];
const device = new nvk.Device(physicalDevice);
const graphicsQueue = device.getQueue(0, 0);
const renderContext = { instance, physicalDevice, device, graphicsQueue };

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
  let userName = process.argv[2] || process.env.USER || process.env.USERNAME || 'alice';
  let userEmail = `${userName}@example.com`;

  // Check if user exists in database, add if not
  let user = await loadMistUser(userEmail, db);
  if (!user || !user.accountId) {
    // Use MistTrackerVulkan function to add user
    await MistTracker.addUserToMistModel({ userName, accountId: userEmail });
    user = { userName, accountId: userEmail };
  }

  // 8. Setup Interface and Menu System

  
  // Create menu manager
  const menuManager = new MenuManager('mainMenu');
  menuManager.setConfigPath('./settings.config');

  // Create main menu pages
  const mainPage = new MenuPage('main');
  const settingsPage = new MenuPage('settings');
  const audioPage = new MenuPage('audio');
  const displayPage = new MenuPage('display');

  // Setup main menu
  mainPage.addComponent(
    new Button('startSession', null, 'Start Session')
      .onClick(() => launchMistCore({ db, userName: user.userName, menuManager }))
  ).addComponent(
    new Button('settings', null, 'Settings')
      .onClick(() => menuManager.showPage('settings'))
  );

  // Setup settings menu
  settingsPage.addComponent(
    new Button('audio', null, 'Audio Settings')
      .onClick(() => menuManager.showPage('audio'))
  ).addComponent(
    new Button('display', null, 'Display Settings')
      .onClick(() => menuManager.showPage('display'))
  ).addComponent(
    new Button('back', null, 'Back')
      .onClick(() => menuManager.back())
  );

  // Setup audio settings
  audioPage.addComponent(
    new Slider('masterVolume', null, 0, 100)
      .setValue(80)
      .onChange(value => MistIllum.volumeGlobal(value / 100))
  ).addComponent(
    new Button('back', null, 'Back')
      .onClick(() => menuManager.back())
  );

  // Setup display settings
  displayPage.addComponent(
    new Dropdown('displayMode', null, ['2D', '3D', '4D'])
      .onChange(mode => MistIllum.worldWarp(mode))
  ).addComponent(
    new Button('back', null, 'Back')
      .onClick(() => menuManager.back())
  );

  // Add pages to manager
  menuManager
    .addPage(mainPage)
    .addPage(settingsPage)
    .addPage(audioPage)
    .addPage(displayPage);

  // Load previous configuration if exists
  await menuManager.loadConfig();

  // Launch MistIllum core with menu system
  menuManager.showPage('main');

  console.log('Mist Causality 3D environment launched for user:', user.userName);
}

main().catch(err => {
  console.error('Error in MistCausality:', err);
});