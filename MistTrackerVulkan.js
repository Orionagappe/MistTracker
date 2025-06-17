// 4D Definite Item Tracker Skeleton Code (MySQL/X11/Vulkan-ready)

// --- Data Structures ---
class Line {
  constructor(type, parent = null) {
    this.type = type; // e.g., 'Primary', 'Category', 'Item'
    this.parent = parent;
    this.children = [];
    this.items = [];
  }
}

class DefiniteItem {
  constructor(value, line, position) {
    this.value = value;
    this.line = line;
    this.position = position;
    this.relatedItems = [];
  }
}

class CharacterLocation {
  constructor(name, time, location) {
    this.name = name;
    this.time = time;
    this.location = location; // Could be a string or a 3D vector
  }
}

class SelectionModeState {
  constructor() {
    this.currentStep = 'time'; // 'time', 'category', 'item', etc.
    this.selectedIndices = []; // [timeIndex, categoryIndex, itemIndex, ...]
    this.inputBoxOpen = false;
    this.inputBoxType = null; // 'time', 'category', 'item'
  }
}

// --- In-Memory Data Model ---
const MistModel = {
  lines: [],
  users: [],
  categories: [],
  items: [],
  sessions: [],
};

// --- Database Schema/Table Names ---
const MIST_SCHEMA = 'mist';
const TABLES = {
  persist: 'MistPersist',
  primaryLine: 'PrimaryLine',
  categoryLine: 'CategoryLine',
  itemLine: 'ItemLine',
  dataRelationships: 'DataRelationships',
  wordDefinitions: 'WordDefinitions',
  categories: 'Categories',
  users: 'Users',
  currentState: 'CurrentState'
};

// --- Session and State Management ---
function startSession(user) {
  return {
    user,
    path: [],
    opened: {},
    vectors: [],
    lastSelection: null,
    timestamp: Date.now()
  };
}

function endSession(session, db) {
  if (!session || !db) return;
  // Persist session state to the database
  db.query(
    `INSERT INTO ${MIST_SCHEMA}.${TABLES.currentState} (sessionId, state, timestamp) VALUES (?, ?, NOW())`,
    [session.user, JSON.stringify(session)]
  );
}

// Example: Attach to process exit (Node.js style)
if (typeof process !== 'undefined') {
  process.on('exit', () => {
    // Assume currentSession and db are in scope
    if (typeof currentSession !== 'undefined' && typeof db !== 'undefined') {
      endSession(currentSession, db);
    }
  });
  process.on('SIGINT', () => {
    if (typeof currentSession !== 'undefined' && typeof db !== 'undefined') {
      endSession(currentSession, db);
    }
    process.exit();
  });
}

function captureViewport(session, viewportState) {
  session.viewport = viewportState;
}

function saveSessionPath(sessionId, path, db) {
  db.query(
    `INSERT INTO ${MIST_SCHEMA}.${TABLES.persist} (sessionId, path, timestamp) VALUES (?, ?, NOW())`,
    [sessionId, JSON.stringify(path)]
  );
}

function saveCurrentState(sessionId, state, db) {
  db.query(
    `INSERT INTO ${MIST_SCHEMA}.${TABLES.currentState} (sessionId, state, timestamp) VALUES (?, ?, NOW())`,
    [sessionId, JSON.stringify(state)]
  );
}

// --- Data Model and CRUD Operations ---
function createPrimaryLine(db) {
  db.query(
    `CREATE TABLE IF NOT EXISTS ${MIST_SCHEMA}.${TABLES.primaryLine} (id INT AUTO_INCREMENT PRIMARY KEY, value VARCHAR(255))`
  );
  return loadPrimaryLine(db);
}

function addCategoryLine(primaryLineId, category, db) {
  db.query(
    `INSERT INTO ${MIST_SCHEMA}.${TABLES.categoryLine} (primaryLineId, category) VALUES (?, ?)`,
    [primaryLineId, category]
  );
}

function addItemLine(categoryLineId, itemValue, db) {
  db.query(
    `INSERT INTO ${MIST_SCHEMA}.${TABLES.itemLine} (categoryLineId, itemValue) VALUES (?, ?)`,
    [categoryLineId, itemValue]
  );
}

function loadPrimaryLine(db) {
  return db.query(
    `SELECT value FROM ${MIST_SCHEMA}.${TABLES.primaryLine} ORDER BY id`
  ).then(rows => rows.map(row => row.value));
}

function loadCategoriesForTime(primaryLineId, db) {
  return db.query(
    `SELECT category FROM ${MIST_SCHEMA}.${TABLES.categoryLine} WHERE primaryLineId = ? ORDER BY id`,
    [primaryLineId]
  ).then(rows => rows.map(row => row.category));
}

function loadItemsForCategory(categoryLineId, db) {
  return db.query(
    `SELECT itemValue FROM ${MIST_SCHEMA}.${TABLES.itemLine} WHERE categoryLineId = ? ORDER BY id`,
    [categoryLineId]
  ).then(rows => rows.map(row => row.itemValue));
}

function addTimeIndex(value, db) {
  db.query(
    `INSERT INTO ${MIST_SCHEMA}.${TABLES.primaryLine} (value) VALUES (?)`,
    [value]
  );
  return loadPrimaryLine(db);
}

function addCategory(primaryLineId, category, db) {
  db.query(
    `INSERT INTO ${MIST_SCHEMA}.${TABLES.categoryLine} (primaryLineId, category) VALUES (?, ?)`,
    [primaryLineId, category]
  );
  return loadCategoriesForTime(primaryLineId, db);
}

function addItem(categoryLineId, itemValue, db) {
  db.query(
    `INSERT INTO ${MIST_SCHEMA}.${TABLES.itemLine} (categoryLineId, itemValue) VALUES (?, ?)`,
    [categoryLineId, itemValue]
  );
  return loadItemsForCategory(categoryLineId, db);
}

async function addCharacterLocation(name, time, location, db) {
  await db.query(
    `INSERT INTO CharacterLocations (name, time, location) VALUES (?, ?, ?)`,
    [name, time, location]
  );
}

async function getCharacterLocationsByTime(time, db) {
  const rows = await db.query(
    `SELECT name, location FROM CharacterLocations WHERE time = ?`,
    [time]
  );
  return rows.map(row => new CharacterLocation(row.name, time, row.location));
}

async function getCharacterLocation(name, time, db) {
  const rows = await db.query(
    `SELECT location FROM CharacterLocations WHERE name = ? AND time = ?`,
    [name, time]
  );
  return rows.length > 0 ? rows[0].location : null;
}

// --- Data Integrity and Utilities ---
function ensureMistDatabase(db) {
  db.query(`CREATE DATABASE IF NOT EXISTS ${MIST_SCHEMA}`);
  db.query(`USE ${MIST_SCHEMA}`);
  db.query(`CREATE TABLE IF NOT EXISTS ${TABLES.persist} (sessionId VARCHAR(255), path TEXT, timestamp DATETIME)`);
  db.query(`CREATE TABLE IF NOT EXISTS ${TABLES.primaryLine} (id INT AUTO_INCREMENT PRIMARY KEY, value VARCHAR(255))`);
  db.query(`CREATE TABLE IF NOT EXISTS ${TABLES.categoryLine} (id INT AUTO_INCREMENT PRIMARY KEY, primaryLineId INT, category VARCHAR(255))`);
  db.query(`CREATE TABLE IF NOT EXISTS ${TABLES.itemLine} (id INT AUTO_INCREMENT PRIMARY KEY, categoryLineId INT, itemValue VARCHAR(255))`);
  db.query(`CREATE TABLE IF NOT EXISTS ${TABLES.dataRelationships} (category VARCHAR(255), item VARCHAR(255), sheetId VARCHAR(255))`);
  db.query(`CREATE TABLE IF NOT EXISTS ${TABLES.wordDefinitions} (word VARCHAR(255), partOfSpeech VARCHAR(255), definition TEXT)`);
  db.query(`CREATE TABLE IF NOT EXISTS ${TABLES.categories} (timeIndex VARCHAR(255), category VARCHAR(255))`);
  db.query(`CREATE TABLE IF NOT EXISTS ${TABLES.users} (userName VARCHAR(255), accountId VARCHAR(255), dateCreated DATETIME, lastSession DATETIME, sessions TEXT)`);
  db.query(`CREATE TABLE IF NOT EXISTS ${TABLES.currentState} (sessionId VARCHAR(255), state TEXT, timestamp DATETIME)`);
}

function ensureCharacterLocationsTable(db) {
  db.query(`
    CREATE TABLE IF NOT EXISTS CharacterLocations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255),
      time VARCHAR(255),
      location VARCHAR(255)
    )
  `);
}

function loadMistUser(userEmail, db) {
  return db.query(
    `SELECT * FROM ${MIST_SCHEMA}.${TABLES.users} WHERE accountId = ?`,
    [userEmail]
  ).then(rows => {
    if (rows.length === 0) {
      const userName = userEmail.split('@')[0];
      db.query(
        `INSERT INTO ${MIST_SCHEMA}.${TABLES.users} (userName, accountId, dateCreated) VALUES (?, ?, NOW())`,
        [userName, userEmail]
      );
      return { userName, accountId: userEmail };
    }
    return rows[0];
  });
}

function getMistDataTables() {
  return TABLES;
}

function getMistTables() {
  return {
    persist: TABLES.persist,
    primaryLine: TABLES.primaryLine,
    categoryLine: TABLES.categoryLine,
    itemLine: TABLES.itemLine
  };
}

function loadWordDefinition(word, db) {
  return db.query(
    `SELECT * FROM ${MIST_SCHEMA}.${TABLES.wordDefinitions} WHERE word = ?`,
    [word]
  ).then(rows => rows[0] || null);
}

// --- Viewport and UI Logic ---
function advanceSelectionMode(selectionModeState, selection) {
  // Update selectedIndices and currentStep based on selection
  // Set inputBoxOpen and inputBoxType as needed
  // Example logic:
  if (selectionModeState.currentStep === 'time') {
    selectionModeState.selectedIndices[0] = selection.index;
    selectionModeState.currentStep = 'category';
    selectionModeState.inputBoxOpen = true;
    selectionModeState.inputBoxType = 'category';
  } else if (selectionModeState.currentStep === 'category') {
    selectionModeState.selectedIndices[1] = selection.index;
    selectionModeState.currentStep = 'item';
    selectionModeState.inputBoxOpen = true;
    selectionModeState.inputBoxType = 'item';
  } else if (selectionModeState.currentStep === 'item') {
    selectionModeState.selectedIndices[2] = selection.index;
    selectionModeState.inputBoxOpen = false;
    selectionModeState.inputBoxType = null;
  }
}

function getViewportCentering(selectionModeState) {
  // Returns { timeLineOffsetX, categoryLineOffsetY }
  return {
    timeLineOffsetX: window.innerWidth / 6,
    categoryLineOffsetY: window.innerHeight / 6
  };
}

function isItemVisible(session, depth, index) {
  return session.opened && session.opened[depth] && session.opened[depth].includes(index);
}

function handleSelectionBackend(session, selection, selectionModeState) {
  // 1. Update the navigation path
  if (!session.path) session.path = [];
  session.path.push(selection);

  // 2. Mark the selected item as opened in the session
  if (!session.opened) session.opened = {};
  const depth = selectionModeState.selectedIndices.length;
  if (!session.opened[depth]) session.opened[depth] = [];
  if (!session.opened[depth].includes(selection.index)) {
    session.opened[depth].push(selection.index);
  }

  // 3. Advance the selection mode state
  advanceSelectionMode(selectionModeState, selection);

  // 4. Optionally update vectors or other in-memory session fields
  // (e.g., recalculate vectors for nD navigation if needed)
  // session.vectors = recalculateVectors(session.path);

  // 5. Update lastSelection
  session.lastSelection = selection;

  // No database writes here; all changes are in-memory.
}

async function getMistViewportData(db) {
  const primaryLine = await loadPrimaryLine(db);
  const categoriesByTime = {};
  for (let i = 0; i < primaryLine.length; i++) {
    const categories = await loadCategoriesForTime(i + 1, db);
    categoriesByTime[primaryLine[i]] = categories;
  }
  const itemsByCategory = {};
  for (const time in categoriesByTime) {
    for (let i = 0; i < categoriesByTime[time].length; i++) {
      const category = categoriesByTime[time][i];
      const items = await loadItemsForCategory(i + 1, db);
      itemsByCategory[category] = items;
    }
  }
  return {
    primaryLine: primaryLine,
    categories: categoriesByTime,
    items: itemsByCategory
  };
}

// --- Advanced Rendering and Navigation (Vulkan/OpenCL-ready) ---
function gramSchmidt(vectors, n) {
  let basis = [];
  for (let i = 0; i < n; i++) {
    let v = Array(n).fill(0);
    v[i] = 1;
    for (let b of basis) {
      let dot = v.reduce((s, x, j) => s + x * b[j], 0);
      for (let j = 0; j < n; j++) v[j] -= dot * b[j];
    }
    let mag = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
    if (mag > 1e-8) basis.push(v.map(x => x / mag));
  }
  return basis;
}

function calculateLineOrientation(path) {
  const orientations = [];
  for (let i = 0; i < path.length; i++) {
    if (i === 0) orientations.push({ type: 'vertical' });
    else if (i === 1) orientations.push({ type: 'horizontal' });
    else orientations.push({ type: 'orthogonal', plane: [i-2, i-1] });
  }
  return orientations;
}

function hourGlass(depth, vectorsSoFar = []) {
  const baseVectors = [
    [1,0,0,0], // Primary
    [0,1,0,0], // Category
    [0,0,1,0], // 3rd
    [0,0,0,1]  // 4th
  ];
  if (depth < baseVectors.length) return baseVectors[depth];
  let n = baseVectors[0].length;
  let basis = vectorsSoFar.slice(0, depth);
  let gs = gramSchmidt(basis, n);
  return gs[depth] || Array(n).fill(0).map((_,i)=>i===depth?1:0);
}

// Utility to convert time/location data to 3D coordinates for projection
function projectItemsTo3D(items, characterLocations, timeMap, locationMap) {
  // items: array of DefiniteItem or similar
  // characterLocations: array of CharacterLocation
  // timeMap/locationMap: mapping from time/location to 3D coordinates
  // Returns: array of {item, x, y, z}
  return items.map(item => {
    const loc = characterLocations.find(
      cl => cl.name === item.value && timeMap[cl.time]
    );
    if (!loc) return { item, x: 0, y: 0, z: 0 };
    const tCoord = timeMap[loc.time] || [0, 0, 0];
    const lCoord = locationMap[loc.location] || [0, 0, 0];
    // Combine time and location into a 3D point (customize as needed)
    return {
      item,
      x: tCoord[0] + lCoord[0],
      y: tCoord[1] + lCoord[1],
      z: tCoord[2] + lCoord[2]
    };
  });
}

async function getMapModeProjection(db, timeMap, locationMap) {
  // Load all items and character locations
  const items = MistModel.items; // or load from DB if needed
  const rows = await db.query(`SELECT name, time, location FROM CharacterLocations`);
  const characterLocations = rows.map(row => new CharacterLocation(row.name, row.time, row.location));
  return projectItemsTo3D(items, characterLocations, timeMap, locationMap);
}

// --- Story Parsing Utility ---
function storyWriter(rtfText, sourceFile) {
  // (Same as previous implementation)
  let plainText = rtfText
    .replace(/\\par[d]?/g, '\n')
    .replace(/\\[a-z]+\d* ?/g, '')
    .replace(/{\\[^}]+}/g, '')
    .replace(/[{}]/g, '')
    .replace(/\\'/g, '')
    .replace(/\n{2,}/g, '\n')
    .replace(/\r/g, '');

  plainText = plainText
    .replace(/[\t`]/g, ' ')
    .replace(/["“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  if (!plainText || plainText.length < 10) {
    throw new Error('Story text is too short or failed to extract.');
  }

  const provenance = {
    sourceFile: sourceFile,
    timestamp: new Date().toISOString()
  };

  const nameRegex = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
  let names = new Set();
  let match;
  while ((match = nameRegex.exec(plainText)) !== null) {
    if (!["Once", "When", "After", "The", "And", "But", "As", "If", "Now", "Later", "Meanwhile", "Next", "Then", "By", "To", "With", "For", "From", "In", "On", "At", "Of", "Or", "So", "He", "She", "His", "Her", "It", "They", "Their", "There", "That", "This", "A", "An"].includes(match[1])) {
      names.add(match[1]);
    }
  }
  names = Array.from(names);

  const pronouns = { he: null, she: null, his: null, her: null, him: null, they: null, their: null };
  const sentences = plainText.split(/[\.\!\?]\s+/);
  let lastMale = null, lastFemale = null, lastPlural = null;
  let impliedNames = [];
  const femaleNames = ["Yathlanae", "Darlene"];
  const maleNames = ["Landon", "Tristan", "Darin"];
  const pluralNames = ["Drow", "neighbors"];
  sentences.forEach(sentence => {
    names.forEach(name => {
      if (sentence.includes(name)) {
        if (femaleNames.includes(name)) lastFemale = name;
        else if (maleNames.includes(name)) lastMale = name;
        else if (pluralNames.includes(name)) lastPlural = name;
      }
    });
    if (/\b(he|his|him)\b/i.test(sentence) && lastMale) impliedNames.push(lastMale);
    if (/\b(she|her)\b/i.test(sentence) && lastFemale) impliedNames.push(lastFemale);
    if (/\b(they|their|them)\b/i.test(sentence) && lastPlural) impliedNames.push(lastPlural);
  });

  const statementRegex = /"([^"]+)"/g;
  let statements = [];
  while ((match = statementRegex.exec(plainText)) !== null) {
    let context = plainText.substring(0, match.index);
    let speaker = null;
    let contextNames = context.match(nameRegex);
    if (contextNames && contextNames.length > 0) {
      speaker = contextNames[contextNames.length - 1];
    }
    statements.push({ speaker: speaker, statement: match[1] });
  }

  return {
    explicitNames: names,
    impliedNames: Array.from(new Set(impliedNames)),
    statements: statements,
    provenance: provenance
  };
}

// --- Export for integration with native UI and GPU logic ---
module.exports = {
  // --- Data Structures ---
  Line,
  DefiniteItem,
  CharacterLocation,
  SelectionModeState,

  // --- In-Memory Model ---
  MistModel,

  // --- Session and State Management ---
  startSession,
  endSession,
  captureViewport,
  saveSessionPath,
  saveCurrentState,

  // --- Data Model and CRUD Operations ---
  createPrimaryLine,
  addCategoryLine,
  addItemLine,
  loadPrimaryLine,
  loadCategoriesForTime,
  loadItemsForCategory,
  addTimeIndex,
  addCategory,
  addItem,
  addCharacterLocation,
  getCharacterLocationsByTime,
  getCharacterLocation,

  // --- Data Integrity and Utilities ---
  ensureMistDatabase,
  ensureCharacterLocationsTable,
  loadMistUser,
  getMistDataTables,
  getMistTables,
  loadWordDefinition,

  // --- Viewport and UI Logic ---
  getMistViewportData,
  advanceSelectionMode,
  getViewportCentering,
  isItemVisible,
  handleSelectionBackend,

  // --- Advanced Rendering and Navigation ---
  gramSchmidt,
  calculateLineOrientation,
  hourGlass,
  projectItemsTo3D,
  getMapModeProjection,

  // --- Story Parsing Utility ---
  storyWriter
};