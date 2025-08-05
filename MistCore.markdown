# MistCore API Documentation

## Overview

This document details the API for `MistCore.js`, a core module for database interactions, user selection state management, and UI rendering in the Mist application.

### Database Interaction Functions

- **`getMistViewportData(db)`**: Retrieves structured data for the UI, including the primary line, categories, and items from the database.
- **`loadPrimaryLine(db, storyText, sourceFile)`**: Loads the primary line from the database or generates it from story context if it doesn't exist.
- **`loadCategoriesForTime(primaryLineId, db, storyText, sourceFile)`**: Loads categories for a given time index or generates them from story context.
- **`loadItemsForCategory(categoryLineId, db)`**: Loads items for a specific category from the database.
- **`addTimeIndex(value, db)`**: Adds a new time index to the primary line in the database.
- **`addCategory(primaryLineId, category, db)`**: Adds a new category for a given time index.
- **`addItem(categoryLineId, itemValue, db)`**: Adds a new item to a specified category.
- **`addCharacterLocation(name, time, location, db)`**: Records a character's location at a specific time.
- **`getCharacterLocationsByTime(time, db)`**: Retrieves all character locations for a given time.
- **`getCharacterLocation(name, time, db)`**: Gets a specific character's location at a given time.

### Selection and State Management Functions

- **`advanceSelectionMode(selectionModeState, selection)`**: Updates the selection state based on user input, progressing through time, category, and item selection steps.
- **`getViewportCentering(selectionModeState)`**: Calculates the centering offsets for the viewport based on the current selection state.
- **`isItemVisible(session, depth, index)`**: Determines if an item at a specific depth and index is visible in the current session.
- **`handleSelectionBackend(session, selection, selectionModeState)`**: Manages the backend logic for user selections, updating the session state without database interactions.

### Viewport Initialization and Rendering

- **`initViewport(session, db)`**: Sets up the initial viewport state for a session, loading necessary data from the database.
- **`renderViewport(session, uiRenderer)`**: Renders the current viewport using the provided UI renderer, displaying the selected time, category, and item.

### UI Input Functions

- **`showAddTimeInput(uiRenderer, onAdd, db)`**: Displays an input box for adding a new time index.
- **`showAddCategoryInput(uiRenderer, primaryLineId, onAdd, db)`**: Shows an input box for adding a new category to a specified time index.
- **`showAddItemInput(uiRenderer, categoryLineId, onAdd, db)`**: Presents an input box for adding a new item to a category.
- **`showInputBox(prompt, defaultValue, onSubmit)`**: A generic function to display an input box for user input.
- **`handleSelection(session, selection, db)`**: Processes user selections, updates the session state, and persists changes to the database if necessary.