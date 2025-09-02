// 4D Definite Item Tracker Skeleton Code (MySQL/X11/Vulkan-ready)
import crypto from 'node:crypto';
import { broadcastToPeers, onEvent } from './MistMulti.js';
import { probabilityOfEvent } from './MistIllum.js'; // Should return a probability (0..1)
import { v4 as uuidv4 } from 'uuid';


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

// --- Selection and User Management ---
class SelectionModeState {
  constructor() {
    this.currentStep = null;
    this.selectedIndices = [];
    this.inputBoxOpen = false;
    this.inputBoxType = null;
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

function resetMistModel() {
  MistModel.lines = [];
  MistModel.users = [];
  MistModel.categories = [];
  MistModel.items = [];
  MistModel.sessions = [];
}

/**
 * Add a user to MistModel.
 * @param {Object} user - User object with at least userName and accountId.
 */
function addUserToMistModel(user) {
  if (!MistModel.users.find(u => u.accountId === user.accountId)) {
    MistModel.users.push(user);
  }
}

/**
 * Find a user in MistModel by accountId.
 * @param {string} accountId
 * @returns {Object|null}
 */
function findUserInMistModel(accountId) {
  return MistModel.users.find(u => u.accountId === accountId) || null;
}

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
  currentState: 'CurrentState',
  assets: 'MistAssets'  // New table for asset management
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
async function createPrimaryLine(db) {
  await db.query(
    `CREATE TABLE IF NOT EXISTS ${MIST_SCHEMA}.${TABLES.primaryLine} (id INT AUTO_INCREMENT PRIMARY KEY, value VARCHAR(255))`
  );
  return loadPrimaryLine(db);
}

async function addCategoryLine(primaryLineId, category, db) {
  await db.query(
    `INSERT INTO ${MIST_SCHEMA}.${TABLES.categoryLine} (primaryLineId, category) VALUES (?, ?)`,
    [primaryLineId, category]
  );
}

async function addItemLine(categoryLineId, itemValue, db) {
  await db.query(
    `INSERT INTO ${MIST_SCHEMA}.${TABLES.itemLine} (categoryLineId, itemValue) VALUES (?, ?)`,
    [categoryLineId, itemValue]
  );
}

/**
 * Loads the primary line from the database.
 * If no primary line exists, generates a new one using context from storyWriter.
 * @param {object} db - Database connection.
 * @param {string} [storyText] - Optional RTF/text for context.
 * @param {string} [sourceFile] - Optional source file for provenance.
 * @returns {Promise<Array>} - Array of primary line values.
 */
async function loadPrimaryLine(db, storyText = null, sourceFile = null) {
  let rows = await db.query(
    `SELECT value FROM ${MIST_SCHEMA}.${TABLES.primaryLine} ORDER BY id`
  );
  let primaryLine = rows.map(row => row.value);

  // If no primary line exists, generate one from story context
  if (primaryLine.length === 0 && storyText) {
    const context = storyWriter(storyText, sourceFile);
    // Use explicitNames or impliedNames as time indices
    const timeIndices = context.explicitNames.length > 0
      ? context.explicitNames
      : context.impliedNames.length > 0
        ? context.impliedNames
        : ['Time0'];
    for (const value of timeIndices) {
      await db.query(
        `INSERT INTO ${MIST_SCHEMA}.${TABLES.primaryLine} (value) VALUES (?)`,
        [value]
      );
    }
    // Reload after insertion
    rows = await db.query(
      `SELECT value FROM ${MIST_SCHEMA}.${TABLES.primaryLine} ORDER BY id`
    );
    primaryLine = rows.map(row => row.value);
  }
  return primaryLine;
}

/**
 * Loads categories for a given time (primary line index).
 * If no categories exist, generates new ones using context from storyWriter.
 * @param {number} primaryLineId - The primary line index (1-based).
 * @param {object} db - Database connection.
 * @param {string} [storyText] - Optional RTF/text for context.
 * @param {string} [sourceFile] - Optional source file for provenance.
 * @returns {Promise<Array>} - Array of category names.
 */
async function loadCategoriesForTime(primaryLineId, db, storyText = null, sourceFile = null) {
  let rows = await db.query(
    `SELECT category FROM ${MIST_SCHEMA}.${TABLES.categoryLine} WHERE primaryLineId = ? ORDER BY id`,
    [primaryLineId]
  );
  let categories = rows.map(row => row.category);

  // If no categories exist, generate from story context
  if (categories.length === 0 && storyText) {
    const context = storyWriter(storyText, sourceFile);
    // Use statements or fallback to generic categories
    const categoryNames = context.statements.length > 0
      ? context.statements.map(s => s.speaker || 'Unknown')
      : ['Category0'];
    for (const category of categoryNames) {
      await db.query(
        `INSERT INTO ${MIST_SCHEMA}.${TABLES.categoryLine} (primaryLineId, category) VALUES (?, ?)`,
        [primaryLineId, category]
      );
    }
    // Reload after insertion
    rows = await db.query(
      `SELECT category FROM ${MIST_SCHEMA}.${TABLES.categoryLine} WHERE primaryLineId = ? ORDER BY id`,
      [primaryLineId]
    );
    categories = rows.map(row => row.category);
  }
  return categories;
}

async function loadItemsForCategory(categoryLineId, db) {
  let [rows] = await db.query(
    `SELECT itemValue FROM ${MIST_SCHEMA}.${TABLES.itemLine} WHERE categoryLineId = ? ORDER BY id`,
    [categoryLineId]
  );
  return rows.map(row => row.itemValue);
}

async function addTimeIndex(value, db) {
  await db.query(
    `INSERT INTO ${MIST_SCHEMA}.${TABLES.primaryLine} (value) VALUES (?)`,
    [value]
  );
  return loadPrimaryLine(db);
}

async function addCategory(primaryLineId, category, db) {
  await db.query(
    `INSERT INTO ${MIST_SCHEMA}.${TABLES.categoryLine} (primaryLineId, category) VALUES (?, ?)`,
    [primaryLineId, category]
  );
  return loadCategoriesForTime(primaryLineId, db);
}

async function addItem(categoryLineId, itemValue, db) {
  await db.query(
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

// --- Data Integrity and Utilities ---

/**
 * Update Mist Data tables in the MySQL database using CSV files in the local filesystem.
 * This replaces the previous Google Drive/Sheets logic.
 * @param {object} db - MySQL connection.
 * @param {string} [csvDir='./data'] - Directory containing CSV files.
 */
async function updateMistData(db, csvDir = './data') {
  // List of table names to update (should match your schema)
  const tables = [
    'DataRelationships',
    'WordDefinitions',
    'Categories',
    'Users'
    // Add more as needed
  ];

  for (const table of tables) {
    const csvPath = path.join(csvDir, `${table}.csv`);
    if (!fs.existsSync(csvPath)) continue;
    const content = fs.readFileSync(csvPath, 'utf8');
    const rows = csvParse.parse(content, { columns: true, skip_empty_lines: true });
    if (rows.length === 0) continue;

    // Clear table before inserting new data
    await db.query(`DELETE FROM ${MIST_SCHEMA}.${table}`);

    // Insert each row
    for (const row of rows) {
      const columns = Object.keys(row);
      const values = columns.map(col => row[col]);
      const placeholders = columns.map(() => '?').join(',');
      await db.query(
        `INSERT INTO ${MIST_SCHEMA}.${table} (${columns.join(',')}) VALUES (${placeholders})`,
        values
      );
    }
  }
}

/**
 * Ensure a user exists in the Users table, or create if missing.
 * @param {string} userEmail - User's email (used as accountId).
 * @param {object} db - MySQL connection.
 * @returns {Promise<Object>} - User record.
 */
async function loadMistUser(userEmail, db) {
  const [rows] = await db.query(
    `SELECT * FROM ${MIST_SCHEMA}.${TABLES.users} WHERE accountId = ?`,
    [userEmail]
  );
  if (rows.length === 0) {
    const userName = userEmail.split('@')[0];
    await db.query(
      `INSERT INTO ${MIST_SCHEMA}.${TABLES.users} (userName, accountId, dateCreated) VALUES (?, ?, NOW())`,
      [userName, userEmail]
    );
    return { userName, accountId: userEmail };
  }
  return rows[0];
}

/**
 * Get references to Mist Data tables (for "data" schema).
 * @returns {Object} - Table name mapping for data schema.
 */
function getMistDataSheets() {
  // If you use a separate schema for data, change 'mist_data' as needed
  const DATA_SCHEMA = 'mist_data';
  return {
    dataRelationships: `${DATA_SCHEMA}.DataRelationships`,
    wordDefinitions: `${DATA_SCHEMA}.WordDefinitions`,
    categories: `${DATA_SCHEMA}.Categories`,
    users: `${DATA_SCHEMA}.Users`
    // Add more as needed
  };
}

/**
 * Get references to Mist main tables (for "mist" schema).
 * @returns {Object} - Table name mapping for main schema.
 */
function getMistSheets() {
  return {
    persist: `${MIST_SCHEMA}.${TABLES.persist}`,
    primaryLine: `${MIST_SCHEMA}.${TABLES.primaryLine}`,
    categoryLine: `${MIST_SCHEMA}.${TABLES.categoryLine}`,
    itemLine: `${MIST_SCHEMA}.${TABLES.itemLine}`,
    dataRelationships: `${MIST_SCHEMA}.${TABLES.dataRelationships}`,
    wordDefinitions: `${MIST_SCHEMA}.${TABLES.wordDefinitions}`,
    categories: `${MIST_SCHEMA}.${TABLES.categories}`,
    users: `${MIST_SCHEMA}.${TABLES.users}`
    // Add more as needed
  };
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

async function loadWordDefinition(word, db) {
  let [rows] = await db.query(
    `SELECT * FROM ${MIST_SCHEMA}.${TABLES.wordDefinitions} WHERE word = ?`,
    [word]
  );
  return rows[0] || null;
}

// --- Viewport and UI Logic ---

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

function getLineTransformationMatrix(path, vectors) {
  // Returns a 4x4 matrix for Vulkan/OpenGL rendering, based on the current selection path and vectors
  // (Implementation depends on your math library)
}

// --- Story Parsing Utility ---
function storyWriter(rtfText, sourceFile) {
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
const { createCanvas, loadImage } = require('canvas');

async function loadPulsarMapImage(imagePath) {
  const img = await loadImage(imagePath);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  return { canvas, ctx, width: img.width, height: img.height };
}

/**
 * Detect the central point and radiating lines in a pulsar map image.
 * Uses basic image processing; for production, consider Hough transform or OpenCV.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width
 * @param {number} height
 * @returns {{center: {x, y}, lines: Array<{angle, points: Array<{x, y}>}>}}
 */
function detectCentralPointAndLines(ctx, width, height) {
  // 1. Find the darkest pixel cluster (likely the center)
  let minSum = 255 * 3, center = { x: width / 2, y: height / 2 };
  for (let y = height * 0.3; y < height * 0.7; y++) {
    for (let x = width * 0.3; x < width * 0.7; x++) {
      const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
      const sum = r + g + b;
      if (sum < minSum) {
        minSum = sum;
        center = { x, y };
      }
    }
  }
  // 2. Radially sample lines from center, looking for dark pixels (lines)
  const lines = [];
  for (let angle = 0; angle < 2 * Math.PI; angle += Math.PI / 16) {
    let points = [];
    for (let r = 0; r < Math.min(width, height) / 2; r += 2) {
      const x = Math.round(center.x + r * Math.cos(angle));
      const y = Math.round(center.y + r * Math.sin(angle));
      if (x < 0 || y < 0 || x >= width || y >= height) break;
      const [red, green, blue] = ctx.getImageData(x, y, 1, 1).data;
      if (red + green + blue < 100) points.push({ x, y });
    }
    if (points.length > 10) {
      lines.push({ angle, points });
    }
  }
  return { center, lines };
}

/**
 * Parse binary tick marks along a pulsar line.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} line - {angle, points}
 * @returns {{binary: string, decimal: number}}
 */
function parseBinaryTicksAlongLine(ctx, line) {
  // Sample along the line, detect tick marks (short/long dashes)
  let binary = '';
  let lastWasDash = false;
  let dashLength = 0;
  for (let i = 0; i < line.points.length; i++) {
    const { x, y } = line.points[i];
    const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
    const isDash = (r + g + b < 100);
    if (isDash) {
      dashLength++;
      lastWasDash = true;
    } else if (lastWasDash) {
      // Classify dash as short (0) or long (1)
      binary += dashLength > 6 ? '1' : '0';
      dashLength = 0;
      lastWasDash = false;
    }
  }
  const decimal = parseInt(binary, 2);
  return { binary, decimal };
}

/**
 * Extract reference geometry (hydrogen molecule, human figures) from the image.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width
 * @param {number} height
 * @returns {{hydrogen: Object, humans: Array<Object>}}
 */
function extractReferenceGeometry(ctx, width, height) {
  // Detect two circles (hydrogen) near the top
  // Detect two large bounding boxes (humans) on the right
  // This is a simple heuristic; for production use shape detection libraries
  let hydrogen = null, humans = [];
  // Hydrogen: scan top 20% for circles
  for (let y = 0; y < height * 0.2; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
      if (r + g + b < 100) {
        // Found a dark pixel, check for circle by sampling neighbors
        let count = 0;
        for (let dx = -5; dx <= 5; dx++) {
          for (let dy = -5; dy <= 5; dy++) {
            if (dx * dx + dy * dy < 25) {
              const [rr, gg, bb] = ctx.getImageData(x + dx, y + dy, 1, 1).data;
              if (rr + gg + bb < 100) count++;
            }
          }
        }
        if (count > 30) {
          hydrogen = hydrogen || [];
          hydrogen.push({ x, y });
        }
      }
    }
  }
  // Humans: scan right 40% for tall dark regions
  for (let x = width * 0.6; x < width; x += 5) {
    let yStart = null, yEnd = null;
    for (let y = height * 0.3; y < height * 0.9; y += 2) {
      const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
      if (r + g + b < 100) {
        if (yStart === null) yStart = y;
        yEnd = y;
      }
    }
    if (yStart !== null && yEnd - yStart > height * 0.2) {
      humans.push({ x, y: yStart, height: yEnd - yStart });
    }
  }
  return { hydrogen, humans };
}

/**
 * Integrate parsed pulsar map data into MistModel and/or database.
 * @param {Object} center
 * @param {Array} pulsars - Array of {direction, period, position}
 * @param {Object} referenceGeometry
 * @param {Object} db
 */
function integratePulsarMapWithMistModel(center, pulsars, referenceGeometry, db) {
  // Use MistModel and DefiniteItem from MistTrackerVulkan.js
  pulsars.forEach((pulsar, idx) => {
    const line = new Line('Pulsar', null);
    MistModel.lines.push(line);
    const item = new DefiniteItem(
      `Pulsar-${idx}`,
      line,
      { x: pulsar.position.x, y: pulsar.position.y, angle: pulsar.direction }
    );
    item.period = pulsar.period;
    MistModel.items.push(item);
    // Optionally, persist to DB
    if (db) {
      db.query(
        `INSERT INTO ${MIST_SCHEMA}.${TABLES.itemLine} (categoryLineId, itemValue) VALUES (?, ?)`,
        [1, `Pulsar-${idx}: period=${pulsar.period.decimal}`]
      );
    }
  });
  // Store reference geometry for scaling/orientation if needed
  MistModel.referenceGeometry = referenceGeometry;
}

function mapRead(){
  // Using sharp for image processing
  const options = { 
    processImage: async (imagePath) => {
      const image = await sharp(imagePath);
      const metadata = await image.metadata();
      const buffer = await image.raw().toBuffer();
      return { buffer, metadata };
    }
  };
  mapReader(imagePath, options);
}

async function parsePulsarMap(imagePath, db) {
  const { canvas, ctx, width, height } = await loadPulsarMapImage(imagePath);
  const { center, lines } = detectCentralPointAndLines(ctx, width, height);
  const referenceGeometry = extractReferenceGeometry(ctx, width, height);

  const pulsars = [];
  for (const line of lines) {
    const period = parseBinaryTicksAlongLine(ctx, line);
    pulsars.push({
      direction: line.angle,
      period,
      position: { x: line.points[1].x, y: line.points[1].y }
    });
  }

  integratePulsarMapWithMistModel(center, pulsars, referenceGeometry, db);
  return { center, pulsars, referenceGeometry };
}

async function mapReader(imagePath, options = {}) {
  // Load the image
  const img = await loadImage(imagePath);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  // Example: Parse colored dots or QR codes as location markers
  // This is a placeholder; real implementation would depend on your encoding scheme
  let locations = [];
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const [r, g, b, a] = ctx.getImageData(x, y, 1, 1).data;
      // Example: Red dots represent character locations
      if (r > 200 && g < 50 && b < 50 && a > 200) {
        locations.push({ x, y, color: [r, g, b], description: 'Possible character location' });
      }
    }
  }
  // Optionally, use OCR or QR code libraries to extract text/labels from the image

  return {
    imagePath,
    width: img.width,
    height: img.height,
    locations
  };
}

// --- Keybinds Management ---
const defaultKeybinds = {
  select: 'Enter',
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  menu: 'Escape',
  mouseSelect: 'Button1',
  mouseContext: 'Button3'
};

let userKeybinds = { ...defaultKeybinds };

/**
 * Get the current keybind for an action.
 * @param {string} action
 * @returns {string|null}
 */
function getUserKeybind(action) {
  return userKeybinds[action] || null;
}

/**
 * Set a keybind for a specific action.
 * @param {string} action
 * @param {string} key
 */
function setUserKeybind(action, key) {
  userKeybinds[action] = key;
}

/**
 * Reset all user keybinds to default.
 * @param {Object} [defaults]
 */
function resetUserKeybinds(defaults = null) {
  userKeybinds = { ...(defaults || defaultKeybinds) };
}

/**
 * Allow user to change keybinds via input (X11 or fallback).
 * @param {function} promptFn - Function to prompt user for new key/mouse input.
 * @param {function} onUpdate - Callback when keybinds are updated.
 */
function mapKeybinds(promptFn, onUpdate) {
  // For each action, prompt user to press a key or mouse button
  Object.keys(defaultKeybinds).forEach(action => {
    promptFn(`Press new key or mouse button for "${action}" (current: ${userKeybinds[action]}):`, (input) => {
      userKeybinds[action] = input;
      if (onUpdate) onUpdate(userKeybinds);
    });
  });
}

/**
 * Handle key or mouse input event.
 * @param {string} input - Key or mouse button identifier.
 * @param {object} context - Current UI or environment context.
 */
function handleInput(input, context) {
  // Map input to action
  const action = Object.keys(userKeybinds).find(a => userKeybinds[a] === input);
  if (!action) return;
  // Dispatch action based on context (menu/environment)
  if (context && context.handleAction) {
    context.handleAction(action);
  }
}

// --- Anomalous Result Table (in-memory, should be persisted in DB in production) ---
const AnomalousResults = new Map(); // eventId -> { event, provenance, confirms, fails, status }
const BannedInteractions = new Set(); // Set of banned interaction types or event hashes
const BannedUsers = new Set(); // Set of banned user IDs

/**
 * Get all anomalous results as an array.
 * @returns {Array}
 */
function getAllAnomalousResults() {
  return Array.from(AnomalousResults.values());
}

/**
 * Remove an anomalous result by eventId.
 * @param {string} eventId
 */
function removeAnomalousResult(eventId) {
  AnomalousResults.delete(eventId);
}

/**
 * Add or update an anomalous result.
 * @param {string} eventId
 * @param {Object} entry
 */
function setAnomalousResult(eventId, entry) {
  AnomalousResults.set(eventId, entry);
}

// --- Provenance Helper ---
function createProvenance(event, user) {
  return {
    eventId: uuidv4(),
    user,
    timestamp: new Date().toISOString(),
    sessionId: event.sessionId || null,
    source: event.source || 'MistIllum',
    details: event.details || {}
  };
}

// --- Data Coherence Check and Swarm Sync ---
async function checkAndSyncEvent(event, user, db) {
  // 1. Check if interaction is banned
  if (isInteractionBanned(event, user)) {
    eventHorizonUser(user, db);
    return { error: 'Interaction banned. User event-horizoned.' };
  }

  // 2. Calculate event probability using MistIllum.js
  const prob = probabilityOfEvent(event); // Should return a probability (0..1)
  const sigma = probToSigma(prob);

  // 3. Create provenance
  const provenance = createProvenance(event, user);

  // 4. Handle anomalous results
  if (Math.abs(sigma) > 3) {
    // Add to anomalous result table
    const entry = {
      event,
      provenance,
      confirms: 0,
      fails: 0,
      status: 'pending'
    };
    AnomalousResults.set(provenance.eventId, entry);

    // Broadcast to swarm for error checking/confirmation
    broadcastToPeers({
      type: 'anomalyCheck',
      event,
      provenance,
      sigma
    });

    // If >5 sigma, require multiple confirms
    if (Math.abs(sigma) > 5) {
      entry.status = 'requires_multiple_confirms';
    }
    return { eventId: provenance.eventId, status: entry.status };
  } else {
    // Normal event, add to persistent tables and propagate
    await addEventToPersistentTables(event, provenance, db);
    broadcastToPeers({
      type: 'eventConfirmed',
      event,
      provenance
    });
    return { status: 'confirmed' };
  }
}

// --- Sigma Calculation Helper ---
function probToSigma(prob) {
  if (prob === 0.5) return 0;
  if (prob === 1) return 0;
  if (prob === 0) return 10; // Arbitrary large sigma for impossible
  const z = Math.sqrt(2) * inverseErfc(2 * (1 - prob));
  return z;
}

function inverseErfc(x) {
  let z = Math.sqrt(-Math.log((x / 2)));
  return z - (Math.log(z) / (2 * z));
}

// --- Swarm Confirmation Handling ---
onEvent('anomalyCheck', (data) => {
  const { event, provenance, sigma } = data;
  if (isInteractionBanned(event, provenance.user)) {
    // If banned, event horizon immediately
    eventHorizonUser(provenance.user);
    return;
  }
  const prob = probabilityOfEvent(event);
  const localSigma = probToSigma(prob);
  const confirm = Math.abs(localSigma) <= Math.abs(sigma);
  broadcastToPeers({
    type: 'anomalyVote',
    eventId: provenance.eventId,
    confirm,
    provenance: { ...provenance, peer: true }
  });
});

onEvent('anomalyVote', async (data) => {
  const { eventId, confirm, provenance } = data;
  const entry = AnomalousResults.get(eventId);
  if (!entry) return;
  if (confirm) {
    entry.confirms += 1;
  } else {
    entry.fails += 1;
  }

  const total = entry.confirms + entry.fails;
  if (entry.status === 'requires_multiple_confirms') {
    if (entry.confirms >= 3 && entry.confirms / total > 0.95) {
      entry.status = 'confirmed';
      await addEventToPersistentTables(entry.event, entry.provenance);
      broadcastToPeers({
        type: 'eventConfirmed',
        event: entry.event,
        provenance: entry.provenance
      });
    }
  } else if (entry.confirms > 0 && entry.fails / entry.confirms > 0.05) {
    await removeEventFromPersistentTables(entry.event, entry.provenance);
    entry.status = 'removed';
  } else if (entry.fails / total > 0.5) {
    entry.status = 'banned';
    banInteraction(entry.event, entry.provenance);
    broadcastToPeers({
      type: 'interactionBanned',
      event: entry.event,
      provenance: entry.provenance
    });
  } else if (entry.fails >= 30 && entry.confirms === 0) {
    entry.status = 'eventHorizon';
    banInteraction(entry.event, entry.provenance, true);
    eventHorizonUser(entry.provenance.user);
    broadcastToPeers({
      type: 'eventHorizon',
      event: entry.event,
      provenance: entry.provenance
    });
  }
});

// --- Helper: Add/Remove Event from Persistent Tables ---
async function addEventToPersistentTables(event, provenance, db) {
  await db.query(
    `INSERT INTO PersistentEvents (eventId, eventData, provenance, timestamp) VALUES (?, ?, ?, NOW())`,
    [provenance.eventId, JSON.stringify(event), JSON.stringify(provenance)]
  );
}

async function removeEventFromPersistentTables(event, provenance, db) {
  await db.query(
    `DELETE FROM PersistentEvents WHERE eventId = ?`,
    [provenance.eventId]
  );
}

// --- Helper: Ban Interaction ---
function banInteraction(event, provenance, eventHorizon = false) {
  const interactionHash = hashInteraction(event);
  BannedInteractions.add(interactionHash);
  if (eventHorizon) {
    eventHorizonUser(provenance.user);
  }
}

// --- Helper: Check if Interaction is Banned ---
function isInteractionBanned(event, user) {
  const interactionHash = hashInteraction(event);
  return BannedInteractions.has(interactionHash) || BannedUsers.has(user);
}

// --- Helper: Hash Interaction ---
function hashInteraction(event) {
  // Simple hash: could use JSON.stringify + hash function for uniqueness
  return crypto.createHash('sha256').update(JSON.stringify(event)).digest('hex');
}

// --- Helper: Event Horizon User (Ban and Flush) ---
async function eventHorizonUser(user, db) {
  BannedUsers.add(user);
  // Remove user from all sessions, flush Mist data from host, and delete from DB
  await flushUserData(user, db);
  // Optionally broadcast ban to swarm
  broadcastToPeers({
    type: 'userEventHorizon',
    user
  });
}

// --- Helper: Flush User Data ---
async function flushUserData(user, db) {
  // Remove user from Users table and all related Mist data
  await db.query(`DELETE FROM ${TABLES.users} WHERE accountId = ?`, [user]);
  await db.query(`DELETE FROM ${TABLES.currentState} WHERE sessionId = ?`, [user]);
  await db.query(`DELETE FROM ${TABLES.persist} WHERE sessionId = ?`, [user]);
  // Optionally, remove or anonymize user data in other tables
}

// --- Milestone Modeling for Tensor Metrics and Interaction Distributions ---

/**
 * Milestone class to track precision, table size, and enablement of new modes.
 * Each milestone is an order of magnitude (10^n), up to int256.
 */
class Milestone {
  constructor(order, description = '') {
    this.order = order; // e.g., 1, 2, 3, ... up to 256
    this.value = BigInt(10) ** BigInt(order); // 10^order
    this.description = description;
    this.enabled = false;
    this.achievedAt = null;
  }
}

/**
 * MilestoneManager manages milestones, precision, and mode enablement.
 */
class MilestoneManager {
  constructor() {
    this.milestones = [];
    this.currentOrder = 0;
    this.maxOrder = 256;
    // Track which modes are enabled at which milestone
    this.enabledProjectionModes = new Set();
    this.enabledRenderModes = new Set();
    this.tensorMetricTables = {}; // order -> table reference
    this.interactionDistributions = {}; // order -> distribution reference
  }

  /**
   * Add a new milestone (if not already present).
   */
  addMilestone(order, description = '') {
    if (order > this.maxOrder) return null;
    if (this.milestones.find(m => m.order === order)) return null;
    const milestone = new Milestone(order, description);
    this.milestones.push(milestone);
    this.milestones.sort((a, b) => a.order - b.order);
    return milestone;
  }

  /**
   * Achieve a milestone, enabling new precision and modes.
   */
  achieveMilestone(order) {
    const milestone = this.milestones.find(m => m.order === order);
    if (!milestone) return false;
    milestone.enabled = true;
    milestone.achievedAt = new Date();

    // Increase tensor metric table precision/size
    this.tensorMetricTables[order] = this.createTensorMetricTable(order);

    // Increase interaction approximation distribution precision
    this.interactionDistributions[order] = this.createInteractionDistribution(order);

    // Enable new projection/render modes if conditions met
    this.updateEnabledModes(order);

    return true;
  }

  

  /**
   * Create a new tensor metric table for the given milestone order.
   */
  createTensorMetricTable(order) {
    // Example: Table size/precision increases with milestone order
    const size = Number(BigInt(10) ** BigInt(order));
    // Placeholder: In practice, allocate or reference a DB or in-memory table
    return { order, size, precision: order, data: new Array(size).fill(0) };
  }

  /**
   * Create a new interaction approximation distribution for the given milestone order.
   */
  createInteractionDistribution(order) {
    // Example: More precise or higher-resolution distribution
    const bins = Number(BigInt(10) ** BigInt(order));
    // Placeholder: In practice, allocate or reference a DB or in-memory distribution
    return { order, bins, data: new Array(bins).fill(0) };
  }

  /**
   * Enable new projection or render modes based on milestone conditions.
   */
  updateEnabledModes(order) {
    // Example: Enable new modes at specific orders
    if (order >= 3) this.enabledProjectionModes.add('4D');
    if (order >= 6) this.enabledProjectionModes.add('nD');
    if (order >= 4) this.enabledRenderModes.add('wave-based');
    if (order >= 8) this.enabledRenderModes.add('quantum');
    // Add more as needed
  }

  /**
   * Check if a mode is enabled.
   */
  isModeEnabled(modeType, modeName) {
    if (modeType === 'projection') return this.enabledProjectionModes.has(modeName);
    if (modeType === 'render') return this.enabledRenderModes.has(modeName);
    return false;
  }

  /**
   * Get the highest achieved milestone.
   */
  getCurrentMilestone() {
    return this.milestones.filter(m => m.enabled).slice(-1)[0] || null;
  }
}

/**
 * Get the current milestone order.
 * @returns {number}
 */
function getCurrentMilestoneOrder() {
  const current = milestoneManager.getCurrentMilestone();
  return current ? current.order : 0;
}

/**
 * Enable a projection or render mode if milestone is achieved.
 * @param {string} modeType - 'projection' or 'render'
 * @param {string} modeName
 * @returns {boolean} - True if enabled, false otherwise.
 */
function enableModeIfMilestone(modeType, modeName) {
  if (milestoneManager.isModeEnabled(modeType, modeName)) {
    return true;
  }
  return false;
}

/**
 * List all enabled projection and render modes.
 * @returns {Object} { projectionModes: Array, renderModes: Array }
 */
function listEnabledModes() {
  const projectionModes = [];
  const renderModes = [];
  ['3D', '4D', 'nD'].forEach(mode => {
    if (milestoneManager.isModeEnabled('projection', mode)) projectionModes.push(mode);
  });
  ['standard', 'wave-based', 'quantum'].forEach(mode => {
    if (milestoneManager.isModeEnabled('render', mode)) renderModes.push(mode);
  });
  return { projectionModes, renderModes };
}

// --- Example Usage ---
// Initialize milestone manager (singleton or per-session as needed)
const milestoneManager = new MilestoneManager();
// Add milestones up to int256 (practically, you may want to limit this)
for (let i = 1; i <= 18; i++) { // 10^18 is already very large; int256 is 10^77+
  milestoneManager.addMilestone(i, `Order ${i} milestone`);
}

// Achieve a milestone (e.g., after a computation or user action)
milestoneManager.achieveMilestone(3); // Enables 4D projection mode, increases precision

// Check if a mode is enabled
if (milestoneManager.isModeEnabled('projection', '4D')) {
  // Enable 4D projection logic in the UI/rendering pipeline
}

// --- User Profile Management ---
function nominateSuccessor(userId, email, db) {
  db.query(
    `UPDATE Users SET successorEmail = ? WHERE accountId = ?`,
    [email, userId]
  );
}

function nominateSuccessorPGP(userId, pgpPublicKey, db) {
  db.query(
    `UPDATE Users SET successorPGP = ? WHERE accountId = ?`,
    [pgpPublicKey, userId]
  );
}

function canUsePGPNomination() {
  return milestoneManager.getCurrentMilestone() && milestoneManager.getCurrentMilestone().order >= 6;
}

function nominateSuccessorFlexible(userId, value, db) {
  if (canUsePGPNomination()) {
    return nominateSuccessorPGP(userId, value, db);
  } else {
    return nominateSuccessor(userId, value, db);
  }
}


// --- Export for integration with native UI and GPU logic ---
module.exports = {
  // ...existing exports,
  checkAndSyncEvent,
  AnomalousResults,
  isInteractionBanned,
  eventHorizonUser,
  flushUserData,
  banInteraction
};

// --- Export for integration with native UI and GPU logic ---
module.exports = {
  // --- Data Structures ---
  Line,
  DefiniteItem,
  CharacterLocation,
  SelectionModeState,

  // --- In-Memory Model ---
  resetMistModel,
  addUserToMistModel,
  findUserInMistModel,

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
  updateMistData,
  loadMistUser,
  getMistDataSheets,
  getMistSheets,
  ensureCharacterLocationsTable,
  getMistDataTables,
  getMistTables,
  loadWordDefinition,
  getMistViewportData,

  // --- Advanced Rendering and Navigation ---
  gramSchmidt,
  calculateLineOrientation,
  hourGlass,
  projectItemsTo3D,
  getMapModeProjection,
  getLineTransformationMatrix,

  // --- Story Parsing Utility ---
  storyWriter,
  mapReader,

  // --- Keybinds Management ---
  mapKeybinds,
  handleInput,
  getUserKeybind,
  setUserKeybind,
  resetUserKeybinds,

  // --- Swarm Health Maintainer ---
  checkAndSyncEvent,
  checkAndSyncEvent,
  isInteractionBanned,
  eventHorizonUser,
  flushUserData,
  banInteraction,

  // --- Milestone Modeling ---
  Milestone,
  MilestoneManager,
  getAllAnomalousResults,
  removeAnomalousResult,
  setAnomalousResult,
  getCurrentMilestoneOrder,
  enableModeIfMilestone,
  listEnabledModes,

  // --- User Profile Management ---
  nominateSuccessor,
  nominateSuccessorPGP,
  nominateSuccessorFlexible
};