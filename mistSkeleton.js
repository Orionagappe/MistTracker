// 4D Definite Item Tracker Skeleton Code
// This code provides a basic structure for managing lines and items in a Google Sheets sidebar UI.
// Data structure for a line
class Line {
  constructor(type, parent = null) {
    this.type = type; // e.g., 'Primary', 'Category', 'Item'
    this.parent = parent;
    this.children = [];
    this.items = [];
  }
}

// Data structure for an item
class DefiniteItem {
  constructor(value, line, position) {
    this.value = value;
    this.line = line;
    this.position = position;
    this.relatedItems = [];
  }
}

// Initialize the primary line (time axis)
function createPrimaryLine() {
  const primaryLine = new Line('Primary');
  // Load or create time indexes from sheet
  // ...
  return primaryLine;
}

// Add a category line at a specific time index
function addCategoryLine(primaryLine, timeIndex, category) {
  const categoryLine = new Line('Category', primaryLine);
  primaryLine.children.push(categoryLine);
  // Store in sheet and update UI
  // ...
  return categoryLine;
}

// Add an item line for a category
function addItemLine(categoryLine, itemValue) {
  const itemLine = new Line('Item', categoryLine);
  categoryLine.children.push(itemLine);
  const item = new DefiniteItem(itemValue, itemLine, 0);
  itemLine.items.push(item);
  // Store in sheet and update UI
  // ...
  return itemLine;
}

// UI and selection logic would use HTML Service and client-side JS

function showMistUI() {
  const html = HtmlService.createHtmlOutputFromFile('MistUI')
    .setTitle('4D Definite Item Tracker');
  SpreadsheetApp.getUi().showSidebar(html);
}

function ensureMistSpreadsheet() {
  // Get the folder where this script (mistSkeleton.js) is located
  const fileName = 'mistSkeleton.js';
  const files = DriveApp.getFilesByName(fileName);
  if (!files.hasNext()) {
    throw new Error('mistSkeleton.js not found in Drive.');
  }
  const scriptFile = files.next();
  const parentFolder = scriptFile.getParents().hasNext() ? scriptFile.getParents().next() : null;
  if (!parentFolder) {
    throw new Error('Parent folder for mistSkeleton.js not found.');
  }

  // Check if "mist" spreadsheet exists in this folder
  const mistFiles = parentFolder.getFilesByName('mist');
  let mistSpreadsheet;
  if (mistFiles.hasNext()) {
    const file = mistFiles.next();
    mistSpreadsheet = SpreadsheetApp.openById(file.getId());
  } else {
    // Create new spreadsheet named "mist" in the current folder
    mistSpreadsheet = SpreadsheetApp.create('mist');
    // Move the new spreadsheet to the current folder
    const mistFile = DriveApp.getFileById(mistSpreadsheet.getId());
    parentFolder.addFile(mistFile);
    // Optionally remove from root folder
    DriveApp.getRootFolder().removeFile(mistFile);
  }

  // Ensure "Mist Persist" sheet exists
  let persistSheet = mistSpreadsheet.getSheetByName('Mist Persist');
  if (!persistSheet) {
    persistSheet = mistSpreadsheet.insertSheet('Mist Persist');
  }

  // Add additional sheets as required for mistSkeleton.js to function
  const requiredSheets = ['PrimaryLine', 'CategoryLine', 'ItemLine'];
  requiredSheets.forEach(sheetName => {
    if (!mistSpreadsheet.getSheetByName(sheetName)) {
      mistSpreadsheet.insertSheet(sheetName);
    }
  });

  Logger.log('Mist spreadsheet ready: ' + mistSpreadsheet.getUrl());
  return mistSpreadsheet;
}

function ensureMistDataSpreadsheet() {
  // Get the folder where this script (mistSkeleton.js) is located
  const fileName = 'mistSkeleton.js';
  const files = DriveApp.getFilesByName(fileName);
  if (!files.hasNext()) {
    throw new Error('mistSkeleton.js not found in Drive.');
  }
  const scriptFile = files.next();
  const parentFolder = scriptFile.getParents().hasNext() ? scriptFile.getParents().next() : null;
  if (!parentFolder) {
    throw new Error('Parent folder for mistSkeleton.js not found.');
  }

  // Check if "Mist Data" spreadsheet exists in this folder
  const mistFiles = parentFolder.getFilesByName('Mist Data');
  let mistSpreadsheet;
  if (mistFiles.hasNext()) {
    const file = mistFiles.next();
    mistSpreadsheet = SpreadsheetApp.openById(file.getId());
  } else {
    // Create new spreadsheet named "Mist Data" in the current folder
    mistSpreadsheet = SpreadsheetApp.create('Mist Data');
    // Move the new spreadsheet to the current folder
    const mistFile = DriveApp.getFileById(mistSpreadsheet.getId());
    parentFolder.addFile(mistFile);
    // Optionally remove from root folder
    DriveApp.getRootFolder().removeFile(mistFile);
  }

  // Ensure required sheets exist for mistSkeleton.js to function
  const requiredSheets = [
    'Data Relationships',
    'Word Definitions',
    'Categories',
    'Users'
  ];
  requiredSheets.forEach(sheetName => {
    if (!mistSpreadsheet.getSheetByName(sheetName)) {
      mistSpreadsheet.insertSheet(sheetName);
    }
  });

  Logger.log('Mist Data spreadsheet ready: ' + mistSpreadsheet.getUrl());
  return mistSpreadsheet;
}

function updateMistData() {
  // Get the folder where mistSkeleton.js is located
  const fileName = 'mistSkeleton.js';
  const files = DriveApp.getFilesByName(fileName);
  if (!files.hasNext()) throw new Error('mistSkeleton.js not found in Drive.');
  const scriptFile = files.next();
  const parentFolder = scriptFile.getParents().hasNext() ? scriptFile.getParents().next() : null;
  if (!parentFolder) throw new Error('Parent folder for mistSkeleton.js not found.');

  // Get or create Mist and Mist Data spreadsheets using mistSkeleton.js helpers
  const mistSpreadsheet = ensureMistSpreadsheet();
  const mistDataSpreadsheet = ensureMistDataSpreadsheet();

  // Find all CSV files in the folder
  const csvFiles = [];
  const filesIter = parentFolder.getFiles();
  while (filesIter.hasNext()) {
    const f = filesIter.next();
    if (f.getName().toLowerCase().endsWith('.csv')) csvFiles.push(f);
  }

  // For each CSV, update the appropriate sheet in Mist or Mist Data
  csvFiles.forEach(csvFile => {
    const csvName = csvFile.getName().replace(/\.csv$/i, '');
    const content = csvFile.getBlob().getDataAsString();
    const rows = Utilities.parseCsv(content);

    // Skip if less than 2 rows (header + at least one data row)
    if (rows.length < 2) return;

    // Decide which spreadsheet to use based on sheet names in both
    let targetSpreadsheet = null;
    let sheet = mistSpreadsheet.getSheetByName(csvName);
    if (sheet) {
      targetSpreadsheet = mistSpreadsheet;
    } else {
      sheet = mistDataSpreadsheet.getSheetByName(csvName);
      if (sheet) {
        targetSpreadsheet = mistDataSpreadsheet;
      }
    }

    // If sheet doesn't exist in either, add to Mist Data by default
    if (!sheet) {
      sheet = mistDataSpreadsheet.insertSheet(csvName);
      targetSpreadsheet = mistDataSpreadsheet;
    }

    // Clear and update the sheet with CSV data
    sheet.clearContents();
    sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);

    Logger.log(`Updated sheet "${csvName}" in "${targetSpreadsheet.getName()}" from file "${csvFile.getName()}"`);
  });
}

function loadMistUser() {
  // Get the folder where mistSkeleton.js is located
  const fileName = 'mistSkeleton.js';
  const files = DriveApp.getFilesByName(fileName);
  if (!files.hasNext()) throw new Error('mistSkeleton.js not found in Drive.');
  const scriptFile = files.next();
  const parentFolder = scriptFile.getParents().hasNext() ? scriptFile.getParents().next() : null;
  if (!parentFolder) throw new Error('Parent folder for mistSkeleton.js not found.');

  // Get or create Mist Data spreadsheet and Users sheet
  const mistDataSpreadsheet = ensureMistDataSpreadsheet();
  let usersSheet = mistDataSpreadsheet.getSheetByName('Users');
  if (!usersSheet) {
    usersSheet = mistDataSpreadsheet.insertSheet('Users');
    usersSheet.appendRow(['User Name', 'Google AccountID', 'Date Created', 'Last Session', 'Sessions']);
  }

  // Get current user's email and alias
  const userEmail = Session.getActiveUser().getEmail();
  const userName = userEmail.split('@')[0];

  // Check if user already has a record
  const data = usersSheet.getDataRange().getValues();
  let userRow = null;
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === userEmail) {
      userRow = i + 1; // Sheet rows are 1-indexed
      break;
    }
  }

  // If not, create a new record
  if (!userRow) {
    // Find a CSV file in the parent folder for Sessions
    let sessionsFileId = '';
    const filesIter = parentFolder.getFiles();
    while (filesIter.hasNext()) {
      const f = filesIter.next();
      if (f.getName().toLowerCase().endsWith('.csv')) {
        sessionsFileId = f.getId();
        break;
      }
    }
    // If no CSV file found, create a new one and store its fileId
    if (!sessionsFileId) {
      const csvName = `sessions_${userName}_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
      const csvFile = parentFolder.createFile(csvName, "Session Start,Session End,Activity\n", MimeType.CSV);
      sessionsFileId = csvFile.getId();
    }
    const now = new Date();
    usersSheet.appendRow([
      userName,                // User Name (alias)
      userEmail,               // Google AccountID
      now,                     // Date Created
      null,                    // Last Session
      sessionsFileId           // Sessions (CSV file id)
    ]);
    Logger.log(`Created new user record for ${userName} (${userEmail})`);
  } else {
    Logger.log(`User record found for ${userName} (${userEmail})`);
  }
}
// Utility: Get Mist Data spreadsheet and relevant sheets
function getMistDataSheets() {
  const mistDataSpreadsheet = ensureMistDataSpreadsheet();
  return {
    dataRelationships: mistDataSpreadsheet.getSheetByName('Data Relationships'),
    wordDefinitions: mistDataSpreadsheet.getSheetByName('Word Definitions'),
    categories: mistDataSpreadsheet.getSheetByName('Categories'),
    users: mistDataSpreadsheet.getSheetByName('Users'),
    // Add more as needed from mistUpdateHeaders.csv
  };
}

// Utility: Get Mist spreadsheet and relevant sheets
function getMistSheets() {
  const mistSpreadsheet = ensureMistSpreadsheet();
  return {
    persist: mistSpreadsheet.getSheetByName('Mist Persist'),
    primaryLine: mistSpreadsheet.getSheetByName('PrimaryLine'),
    categoryLine: mistSpreadsheet.getSheetByName('CategoryLine'),
    itemLine: mistSpreadsheet.getSheetByName('ItemLine'),
    // Add more as needed
  };
}

// Load primary line (time indexes) from Mist spreadsheet
function loadPrimaryLine() {
  const { primaryLine } = getMistSheets();
  const data = primaryLine.getDataRange().getValues();
  // Assume first row is header, rest are time indexes
  return data.slice(1).map(row => row[0]);
}

// Load categories for a given time index from Mist Data spreadsheet
function loadCategoriesForTime(timeIndex) {
  const { categories } = getMistDataSheets();
  const data = categories.getDataRange().getValues();
  // Assume first row is header: [time, category]
  return data.filter(row => row[0] === timeIndex).map(row => row[1]);
}

// Load items for a given category from Mist Data spreadsheet
function loadItemsForCategory(category) {
  const { dataRelationships } = getMistDataSheets();
  const data = dataRelationships.getDataRange().getValues();
  // Assume first row is header: [category, item, sheetId]
  return data.filter(row => row[0] === category).map(row => row[1]);
}

// Load dictionary definition for a word from dictionary sheets
function loadWordDefinition(word) {
  const { wordDefinitions } = getMistDataSheets();
  const data = wordDefinitions.getDataRange().getValues();
  // Assume first row is header: [word, partOfSpeech, definition]
  const found = data.find(row => row[0] === word);
  return found ? { word: found[0], partOfSpeech: found[1], definition: found[2] } : null;
}

// Add a new time index to the PrimaryLine sheet
function addTimeIndex(value) {
  const { primaryLine } = getMistSheets();
  primaryLine.appendRow([value]);
  return loadPrimaryLine();
}

// Add a new category for a given time index
function addCategory(timeIndex, category) {
  const { categories } = getMistDataSheets();
  categories.appendRow([timeIndex, category]);
  // Return updated categories object (grouped by timeIndex)
  const data = categories.getDataRange().getValues();
  const grouped = {};
  data.slice(1).forEach(row => {
    if (!grouped[row[0]]) grouped[row[0]] = [];
    grouped[row[0]].push(row[1]);
  });
  return grouped;
}

// Add a new item for a given category
function addItem(category, item) {
  const { dataRelationships } = getMistDataSheets();
  // Find the next available sheetId (or use a default)
  const sheetId = "defaultSheetId";
  dataRelationships.appendRow([category, item, sheetId]);
  // Return updated items object (grouped by category)
  const data = dataRelationships.getDataRange().getValues();
  const grouped = {};
  data.slice(1).forEach(row => {
    if (!grouped[row[0]]) grouped[row[0]] = [];
    grouped[row[0]].push(row[1]);
  });
  return grouped;
}

// Provide data for the viewport UI
function getMistViewportData() {
  const primaryLine = loadPrimaryLine();
  // Group categories by time index
  const { categories } = getMistDataSheets();
  const catData = categories.getDataRange().getValues();
  const categoriesByTime = {};
  catData.slice(1).forEach(row => {
    if (!categoriesByTime[row[0]]) categoriesByTime[row[0]] = [];
    categoriesByTime[row[0]].push(row[1]);
  });
  // Group items by category
  const { dataRelationships } = getMistDataSheets();
  const itemData = dataRelationships.getDataRange().getValues();
  const itemsByCategory = {};
  itemData.slice(1).forEach(row => {
    if (!itemsByCategory[row[0]]) itemsByCategory[row[0]] = [];
    itemsByCategory[row[0]].push(row[1]);
  });
  return {
    primaryLine: primaryLine,
    categories: categoriesByTime,
    items: itemsByCategory
  };
}

// Transform stream function to handle user selections and update session state
function transformStream(sessionState, selection) {
  const sessionId = getSessionId();
  let path = sessionState.path || [];
  path.push(selection);

  // Calculate vectors/orientations for each line
  let vectors = [];
  for (let i = 0; i < path.length; i++) {
    if (i === 0) vectors.push({ x: 1, y: 0 });
    else if (i === 1) vectors.push({ x: 0, y: -1 });
    else vectors.push({ x: -vectors[i-1].y, y: vectors[i-1].x });
  }

  // Track opened lines/items for session-based visibility
  let opened = sessionState.opened || {};
  opened[path.length - 1] = opened[path.length - 1] || [];
  opened[path.length - 1].push(selection.index);

  const newState = {
    ...sessionState,
    path,
    vectors,
    opened,
    lastSelection: selection,
    timestamp: new Date()
  };

  saveSessionPath(sessionId, path);
  saveCurrentState(sessionId, newState);

  return newState;
}
function saveSessionPath(sessionId, path) {
  const { persist } = getMistSheets();
  persist.appendRow([sessionId, JSON.stringify(path), new Date()]);
}

function saveCurrentState(sessionId, state) {
  const mistSpreadsheet = ensureMistSpreadsheet();
  let sheet = mistSpreadsheet.getSheetByName('Current State');
  if (!sheet) sheet = mistSpreadsheet.insertSheet('Current State');
  sheet.appendRow([sessionId, JSON.stringify(state), new Date()]);
}

function calculateLineOrientation(path) {
  // Returns an array of orientation objects for each line in the path
  // Example: [{type: 'vertical'}, {type: 'horizontal'}, {type: 'orthogonal', plane: [0,1]}]
  // For the first line: vertical (primary)
  // Second: horizontal (category)
  // Third and beyond: orthogonal to previous two
  const orientations = [];
  for (let i = 0; i < path.length; i++) {
    if (i === 0) orientations.push({ type: 'vertical' });
    else if (i === 1) orientations.push({ type: 'horizontal' });
    else orientations.push({ type: 'orthogonal', plane: [i-2, i-1] });
  }
  return orientations;
}

function getSessionId() {
  // Use user email + session start time or similar unique identifier
  const userEmail = Session.getActiveUser().getEmail();
  const now = new Date();
  return userEmail + '_' + now.toISOString().slice(0,10);
}
/**
 * storyWriter
 * Safely parses an RTF story, extracting explicit and implied character names and character statements,
 * following the security and validation measures outlined in codeParseSecurity.md.
 * @param {string} rtfText - The RTF content of the story.
 * @param {string} sourceFile - The file name or path for provenance.
 * @returns {Object} Structured data: { explicitNames, impliedNames, statements, provenance }
 */
function storyWriter(rtfText, sourceFile) {
  // 1. Robust Extraction and Decoding
  // Remove RTF formatting, control words, and hidden fields
  let plainText = rtfText
    .replace(/\\par[d]?/g, '\n')
    .replace(/\\[a-z]+\d* ?/g, '')
    .replace(/{\\[^}]+}/g, '')
    .replace(/[{}]/g, '')
    .replace(/\\'/g, '')
    .replace(/\n{2,}/g, '\n')
    .replace(/\r/g, '');

  // 2. Input Sanitization
  plainText = plainText
    .replace(/[\t`]/g, ' ') // Remove tabs and backticks
    .replace(/["“”]/g, '"') // Normalize quotes
    .replace(/[‘’]/g, "'")  // Normalize apostrophes
    .replace(/\s+/g, ' ')   // Normalize whitespace
    .trim();

  // 3. Syntax and Structure Validation
  if (!plainText || plainText.length < 10) {
    throw new Error('Story text is too short or failed to extract.');
  }

  // 4. Controlled Parsing (no code execution)
  // 5. Schema Enforcement (see return structure)

  // 6. Provenance and Auditing
  const provenance = {
    sourceFile: sourceFile,
    timestamp: new Date().toISOString()
  };

  // 7. Name Extraction (Explicit)
  // Find capitalized words not at the start of a sentence (simple heuristic)
  const nameRegex = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
  let names = new Set();
  let match;
  while ((match = nameRegex.exec(plainText)) !== null) {
    // Filter out common words and pronouns
    if (!["Once", "When", "After", "The", "And", "But", "As", "If", "Now", "Later", "Meanwhile", "Next", "Then", "By", "To", "With", "For", "From", "In", "On", "At", "Of", "Or", "So", "He", "She", "His", "Her", "It", "They", "Their", "There", "That", "This", "A", "An"].includes(match[1])) {
      names.add(match[1]);
    }
  }
  names = Array.from(names);

  // 8. Pronoun Resolution (Implied Names)
  const pronouns = { he: null, she: null, his: null, her: null, him: null, they: null, their: null };
  const sentences = plainText.split(/[\.\!\?]\s+/);
  let lastMale = null, lastFemale = null, lastPlural = null;
  let impliedNames = [];
  // Example gender assignment (expand as needed)
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

  // 9. Character Statement Extraction
  const statementRegex = /"([^"]+)"/g;
  let statements = [];
  while ((match = statementRegex.exec(plainText)) !== null) {
    // Try to associate with previous name before the quote
    let context = plainText.substring(0, match.index);
    let speaker = null;
    let contextNames = context.match(nameRegex);
    if (contextNames && contextNames.length > 0) {
      speaker = contextNames[contextNames.length - 1];
    }
    statements.push({ speaker: speaker, statement: match[1] });
  }

  // 10. Schema Enforcement (return structure)
  return {
    explicitNames: names,
    impliedNames: Array.from(new Set(impliedNames)),
    statements: statements,
    provenance: provenance
  };
}
