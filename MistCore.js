/**
 * Shared core logic for MistIllum.js and MistTrackerVulkan.js.
 * Move all shared functions/classes here to eliminate circular dependencies.
 */

// --- Viewport and Selection Utilities ---

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

function initViewport(/* args */) {
  // ...implementation...
}

function renderViewport(/* args */) {
  // ...implementation...
}

// --- Selection Functions ---

function selectTimeIndex(/* args */) {
  // ...implementation...
}

function selectCategory(/* args */) {
  // ...implementation...
}

function selectItem(/* args */) {
  // ...implementation...
}

// --- UI Input Functions ---

function showAddTimeInput(/* args */) {
  // ...implementation...
}

function showAddCategoryInput(/* args */) {
  // ...implementation...
}

function showAddItemInput(/* args */) {
  // ...implementation...
}

function showInputBox(/* args */) {
  // ...implementation...
}

function handleSelection(/* args */) {
  // ...implementation...
}

// --- Export all shared modules ---
module.exports = {
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