// Data structure for a line
class Line {
  constructor(type, parent = null) {
    this.type = type; // e.g., 'Primary', 'Category', 'Item'
    this.parent = parent;
    this.children = [];
    this.items = [];
  }
}

// Data structure for a definite item
class DefiniteItem {
  constructor(value, line, position, properties = {}) {
    this.value = value;
    this.line = line;
    this.position = position;
    this.relatedItems = [];
    this.properties = properties;
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

// Example: get definition for a word (for viewport or other UI)
function getWordDefinition(word) {
  return loadWordDefinition(word);
}

// The rest of the functions (ensureMistSpreadsheet, ensureMistDataSpreadsheet, updateMistData, loadMistUser, etc.)
// remain as previously implemented, but now the above functions ensure that all data access and updates
// are routed through the correct data objects and sheets as defined in mistUpdateHeaders.csv.