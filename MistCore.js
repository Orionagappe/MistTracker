import { MenuManager, MenuPage, Button, Slider, Dropdown, InputBox } from './MistInterface.js';
import { startSession, saveSessionPath, saveCurrentState } from './MistTrackerVulkan.js';

class ViewportManager extends MenuManager {
  constructor(id, parentElement) {
    super(id, parentElement);
    this.timeLineOffsetX = 0;
    this.categoryLineOffsetY = 0;
    this.selectionState = {
      selectedTimeIndex: 0,
      selectedCategory: null,
      selectedItem: null
    };
    this.viewportData = {
      primaryLine: [],
      categories: {},
      items: {}
    };
    this.setupPages();
  }

  setupPages() {
    // Main viewport page
    const mainPage = new MenuPage('viewport-main');
    
    // Time selection
    const timeSelect = new Dropdown('time-select')
      .setLabel('Time Index')
      .onChange(index => {
        this.selectionState.selectedTimeIndex = parseInt(index);
        this.updateCategoryList();
        this.emit('timeSelect', index);
      });

    // Category selection
    const categorySelect = new Dropdown('category-select')
      .setLabel('Category')
      .onChange(category => {
        this.selectionState.selectedCategory = category;
        this.updateItemList();
        this.emit('categorySelect', category);
      });

    // Item selection
    const itemSelect = new Dropdown('item-select')
      .setLabel('Item')
      .onChange(item => {
        this.selectionState.selectedItem = item;
        this.emit('itemSelect', item);
      });

    // Add components
    mainPage
      .addComponent(timeSelect)
      .addComponent(categorySelect)
      .addComponent(itemSelect)
      .addComponent(new Button('add-time')
        .setLabel('Add Time Index')
        .onClick(() => this.showAddTimeDialog()))
      .addComponent(new Button('add-category')
        .setLabel('Add Category')
        .onClick(() => this.showAddCategoryDialog()))
      .addComponent(new Button('add-item')
        .setLabel('Add Item')
        .onClick(() => this.showAddItemDialog()));

    this.addPage(mainPage);
    this.showPage('viewport-main');
  }

  updateTimeList() {
    const timeSelect = this.pages.get('viewport-main').getComponent('time-select');
    timeSelect.setOptions(this.viewportData.primaryLine.map((value, index) => ({
      value: index,
      label: value
    })));
  }

  updateCategoryList() {
    const categorySelect = this.pages.get('viewport-main').getComponent('category-select');
    const timeValue = this.viewportData.primaryLine[this.selectionState.selectedTimeIndex];
    const categories = this.viewportData.categories[timeValue] || [];
    categorySelect.setOptions(categories);
  }

  updateItemList() {
    const itemSelect = this.pages.get('viewport-main').getComponent('item-select');
    const items = this.viewportData.items[this.selectionState.selectedCategory] || [];
    itemSelect.setOptions(items);
  }

  showAddTimeDialog() {
    const dialog = new MenuPage('add-time-dialog');
    const input = new InputBox('time-input')
      .setLabel('Enter new time index:');
    
    dialog
      .addComponent(input)
      .addComponent(new Button('submit')
        .setLabel('Add')
        .onClick(() => {
          const value = input.getValue();
          if (value) {
            this.emit('addTime', value);
          }
          this.back();
        }));

    this.addPage(dialog);
    this.showPage('add-time-dialog');
  }

  showAddCategoryDialog() {
    if (!this.viewportData.primaryLine[this.selectionState.selectedTimeIndex]) {
      this.showMessage('Select a time index first');
      return;
    }

    const dialog = new MenuPage('add-category-dialog');
    const input = new InputBox('category-input')
      .setLabel('Enter new category:');
    
    dialog
      .addComponent(input)
      .addComponent(new Button('submit')
        .setLabel('Add')
        .onClick(() => {
          const value = input.getValue();
          if (value) {
            this.emit('addCategory', {
              timeIndex: this.selectionState.selectedTimeIndex,
              category: value
            });
          }
          this.back();
        }));

    this.addPage(dialog);
    this.showPage('add-category-dialog');
  }

  showAddItemDialog() {
    if (!this.selectionState.selectedCategory) {
      this.showMessage('Select a category first');
      return;
    }

    const dialog = new MenuPage('add-item-dialog');
    const input = new InputBox('item-input')
      .setLabel('Enter new item:');
    
    dialog
      .addComponent(input)
      .addComponent(new Button('submit')
        .setLabel('Add')
        .onClick(() => {
          const value = input.getValue();
          if (value) {
            this.emit('addItem', {
              category: this.selectionState.selectedCategory,
              item: value
            });
          }
          this.back();
        }));

    this.addPage(dialog);
    this.showPage('add-item-dialog');
  }

  setViewportData(data) {
    this.viewportData = data;
    this.updateTimeList();
    this.updateCategoryList();
    this.updateItemList();
  }

  getViewportCentering() {
    return {
      timeLineOffsetX: this.timeLineOffsetX,
      categoryLineOffsetY: this.categoryLineOffsetY
    };
  }

  setViewportCentering(offsetX, offsetY) {
    this.timeLineOffsetX = offsetX;
    this.categoryLineOffsetY = offsetY;
  }
}

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

// --- State and Mode Classes ---
class MapModeState {
  constructor() {
    this.cameraPosition = [0, 0, 10];
    this.projectionType = 'perspective'; // or 'orthographic'
    this.focusItem = null;
    // Add more as needed for 3D navigation
  }
}

// --- Viewport Initialization and Rendering ---

/**
 * Initialize the viewport state for a session.
 * Sets up initial selection indices and loads the first available data.
 * @param {Object} session - The current session object.
 * @param {Object} db - Database connection.
 */
async function initViewport(session, db) {
  // Start a new session from DB user info if available
  if (db && session && session.user) {
    // Replace session object with a fresh session for this user
    Object.assign(session, session.user);
  }

  // Load initial data for viewport
  const viewportData = await getMistViewportData(db);

  // Set initial selection indices if not already set
  if (!session.selectionModeState) {
    session.selectionModeState = new MapModeState();
  }
  session.selectedTimeIndex = 0;
  session.selectedCategory = viewportData.categories[viewportData.primaryLine[0]]?.[0] || null;
  session.selectedItem = viewportData.items[session.selectedCategory]?.[0] || null;
  session.viewportData = viewportData;
}

/**
 * Render the viewport using the current session and UI renderer.
 * @param {Object} session - The current session object.
 * @param {Object} uiRenderer - The UI rendering interface.
 */
function renderViewport(session) {
  if (!session.viewportManager) {
    session.viewportManager = new ViewportManager('mist-viewport');
  }

  // Set up event handlers if not already set
  if (!session.handlersInitialized) {
    session.viewportManager.on('timeSelect', (index) => {
      selectTimeIndex(session, index);
    });

    session.viewportManager.on('categorySelect', (category) => {
      const timeValue = session.viewportData.primaryLine[session.selectedTimeIndex];
      const categories = session.viewportData.categories[timeValue] || [];
      const index = categories.indexOf(category);
      if (index !== -1) {
        selectCategory(session, index);
      }
    });

    session.viewportManager.on('itemSelect', (item) => {
      const items = session.viewportData.items[session.selectedCategory] || [];
      const index = items.indexOf(item);
      if (index !== -1) {
        selectItem(session, index);
      }
    });

    session.viewportManager.on('addTime', async (value) => {
      if (session.db) {
        await addTimeIndex(value, session.db);
        session.viewportData = await getMistViewportData(session.db);
        session.viewportManager.setViewportData(session.viewportData);
      }
    });

    session.viewportManager.on('addCategory', async ({ timeIndex, category }) => {
      if (session.db) {
        await addCategory(timeIndex + 1, category, session.db);
        session.viewportData = await getMistViewportData(session.db);
        session.viewportManager.setViewportData(session.viewportData);
      }
    });

    session.viewportManager.on('addItem', async ({ category, item }) => {
      if (session.db) {
        const categoryLineId = session.viewportData.categoryLineIds[category];
        if (categoryLineId) {
          await addItem(categoryLineId, item, session.db);
          session.viewportData = await getMistViewportData(session.db);
          session.viewportManager.setViewportData(session.viewportData);
        }
      }
    });

    session.handlersInitialized = true;
  }

  // Update viewport data and selection state
  session.viewportManager.setViewportData(session.viewportData);
  session.viewportManager.selectionState = {
    selectedTimeIndex: session.selectedTimeIndex || 0,
    selectedCategory: session.selectedCategory,
    selectedItem: session.selectedItem
  };

  return session.viewportManager;
}

/**
 * Handle selection of a time index.
 * Updates session state and advances to category selection.
 * @param {Object} session - The current session object.
 * @param {number} index - Index of the selected time.
 */
function selectTimeIndex(session, index) {
  const { primaryLine } = session.viewportData || {};
  if (primaryLine && index >= 0 && index < primaryLine.length) {
    session.selectedTimeIndex = index;
    const timeValue = primaryLine[index];
    const categories = session.viewportData.categories[timeValue] || [];
    session.selectedCategory = categories[0] || null;
    session.selectedItem = session.selectedCategory
      ? (session.viewportData.items[session.selectedCategory] || [])[0]
      : null;
    session.selectionModeState.currentStep = 'category';
    
    if (session.viewportManager) {
      session.viewportManager.selectionState = {
        selectedTimeIndex: index,
        selectedCategory: session.selectedCategory,
        selectedItem: session.selectedItem
      };
    }
  }
}

/**
 * Handle selection of a category.
 * Updates session state and advances to item selection.
 * @param {Object} session - The current session object.
 * @param {number} index - Index of the selected category.
 */
function selectCategory(session, index) {
  const timeValue = session.viewportData.primaryLine[session.selectedTimeIndex];
  const categories = session.viewportData.categories[timeValue] || [];
  if (categories && index >= 0 && index < categories.length) {
    session.selectedCategory = categories[index];
    session.selectedItem = session.selectedCategory
      ? (session.viewportData.items[session.selectedCategory] || [])[0]
      : null;
    session.selectionModeState.currentStep = 'item';
    
    if (session.viewportManager) {
      session.viewportManager.selectionState = {
        selectedTimeIndex: session.selectedTimeIndex,
        selectedCategory: session.selectedCategory,
        selectedItem: session.selectedItem
      };
    }
  }
}

/**
 * Handle selection of an item.
 * Updates session state to reflect the selected item.
 * @param {Object} session - The current session object.
 * @param {number} index - Index of the selected item.
 */
function selectItem(session, index) {
  const items = session.viewportData.items[session.selectedCategory] || [];
  if (items && index >= 0 && index < items.length) {
    session.selectedItem = items[index];
    session.selectionModeState.currentStep = null; // End of selection path
    
    if (session.viewportManager) {
      session.viewportManager.selectionState = {
        selectedTimeIndex: session.selectedTimeIndex,
        selectedCategory: session.selectedCategory,
        selectedItem: session.selectedItem
      };
    }
  }
}

// --- UI Input Functions ---

/**
 * Show input for adding a new time index.
 * @param {Object} uiRenderer - The UI rendering interface.
 * @param {Function} onAdd - Callback when a new time index is added.
 * @param {Object} db - Database connection.
 */
function showAddTimeInput(uiRenderer, onAdd, db) {
  uiRenderer.showInputBox('Enter new time index:', '', async (value) => {
    if (value && value.trim()) {
      await addTimeIndex(value.trim(), db);
      if (typeof onAdd === 'function') onAdd(value.trim());
    }
  });
}

/**
 * Show input for adding a new category.
 * @param {Object} uiRenderer - The UI rendering interface.
 * @param {number} primaryLineId - The selected primary line index (1-based).
 * @param {Function} onAdd - Callback when a new category is added.
 * @param {Object} db - Database connection.
 */
function showAddCategoryInput(uiRenderer, primaryLineId, onAdd, db) {
  uiRenderer.showInputBox('Enter new category:', '', async (value) => {
    if (value && value.trim()) {
      await addCategory(primaryLineId, value.trim(), db);
      if (typeof onAdd === 'function') onAdd(value.trim());
    }
  });
}

/**
 * Handle user selection, update session state, and persist as needed.
 * @param {Object} session - The current session object.
 * @param {Object} selection - { type: 'time'|'category'|'item', index: number }
 * @param {Object} db - Database connection.
 */
async function handleSelection(session, selection, db) {
  // Update session state based on selection type
  if (selection.type === 'time') {
    selectTimeIndex(session, selection.index);
  } else if (selection.type === 'category') {
    selectCategory(session, selection.index);
  } else if (selection.type === 'item') {
    selectItem(session, selection.index);
  }
  // Optionally persist session state or path
  if (session && session.user && session.path) {
    await saveSessionPath(session.user.accountId, session.path, db);
    await saveCurrentState(session.user.accountId, session, db);
  }
}

/**
 * Show input for adding a new item.
 * @param {Object} uiRenderer - The UI rendering interface.
 * @param {number} categoryLineId - The selected category line index (1-based).
 * @param {Function} onAdd - Callback when a new item is added.
 * @param {Object} db - Database connection.
 */
function showAddItemInput(uiRenderer, categoryLineId, onAdd, db) {
  uiRenderer.showInputBox('Enter new item:', '', async (value) => {
    if (value && value.trim()) {
      await addItem(categoryLineId, value.trim(), db);
      if (typeof onAdd === 'function') onAdd(value.trim());
    }
  });
}

/**
 * Show a generic input box for user input using MistInterface components.
 * @param {string} prompt - The prompt to display.
 * @param {string} defaultValue - The default value for the input.
 * @param {Function} onSubmit - Callback when input is submitted.
 */
function showInputBox(prompt, defaultValue, onSubmit) {
  if (!this.viewportManager) {
    console.warn('No viewport manager available for input box');
    return;
  }

  const inputDialog = new MenuPage('input-dialog');
  const input = new InputBox('value-input')
    .setLabel(prompt)
    .setValue(defaultValue || '');
  
  inputDialog
    .addComponent(input)
    .addComponent(new Button('submit')
      .setLabel('Submit')
      .onClick(() => {
        const value = input.getValue();
        if (typeof onSubmit === 'function') {
          onSubmit(value);
        }
        this.viewportManager.back();
      }))
    .addComponent(new Button('cancel')
      .setLabel('Cancel')
      .onClick(() => this.viewportManager.back()));

  this.viewportManager.addPage(inputDialog);
  this.viewportManager.showPage('input-dialog');
}

// --- Export all shared modules ---
export {
  getMistViewportData,
  advanceSelectionMode,
  getViewportCentering,
  isItemVisible,
  handleSelectionBackend,
  MapModeState,
  initViewport,
  renderViewport,
  selectTimeIndex,
  selectCategory,
  selectItem,
  showAddTimeInput,
  showAddCategoryInput,
  showAddItemInput,
  showInputBox,
  handleSelection
};