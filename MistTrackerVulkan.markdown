# MistTrackerVulkan API Documentation

## Overview

This document details the API for `MistTrackerVulkan.js`, a core module for data tracking, session management, and database interactions in the Mist Solution ecosystem. Functions and classes are grouped by functionality, with notes on their primary purposes.

---

## Classes

### Line

- **Description**: Represents a line in the data model, which can be of types like 'Primary', 'Category', or 'Item'. It supports hierarchical structures with parent and children lines.
- **Methods**:
  - `constructor(type, parent)`: Initializes a new line with the given type and optional parent.

---

### DefiniteItem

- **Description**: Represents a definite item associated with a line, including its value, position, and related items.
- **Methods**:
  - `constructor(value, line, position)`: Creates a new definite item with the specified value, line, and position.

---

### CharacterLocation

- **Description**: Tracks the location of a character at a specific time, used for mapping and navigation.
- **Methods**:
  - `constructor(name, time, location)`: Initializes a character location with name, time, and location.

---

### SelectionModeState

- **Description**: Manages the state of the selection mode, tracking the current step (e.g., 'time', 'category', 'item') and selected indices.
- **Methods**:
  - `constructor()`: Initializes the selection mode state.

---

### Milestone

- **Description**: Represents a milestone in precision and mode enablement, tracking order, value, and achievement status.
- **Methods**:
  - `constructor(order, description)`: Creates a new milestone with the given order and optional description.

---

### MilestoneManager

- **Description**: Manages milestones, precision levels, and the enablement of projection and render modes based on achieved milestones.
- **Methods**:
  - `constructor()`: Initializes the milestone manager.
  - `addMilestone(order, description)`: Adds a new milestone if it doesn't already exist.
  - `achieveMilestone(order)`: Achieves a milestone, enabling new precision and modes.
  - `createTensorMetricTable(order)`: Creates a tensor metric table for the given milestone order.
  - `createInteractionDistribution(order)`: Creates an interaction distribution for the given milestone order.
  - `updateEnabledModes(order)`: Enables new projection or render modes based on the milestone order.
  - `isModeEnabled(modeType, modeName)`: Checks if a specific mode is enabled.
  - `getCurrentMilestone()`: Returns the highest achieved milestone.

---

## Functions

### In-Memory Model

- **resetMistModel()**: Resets the in-memory MistModel to its initial state.
- **addUserToMistModel(user)**: Adds a user to the MistModel if not already present.
- **findUserInMistModel(accountId)**: Finds and returns a user in MistModel by accountId.

---

### Session and State Management

- **startSession(user)**: Initializes a new session for the given user.
- **endSession(session, db)**: Ends the current session and persists its state to the database.
- **captureViewport(session, viewportState)**: Captures the current viewport state in the session.
- **saveSessionPath(sessionId, path, db)**: Saves the user's navigation path to the database.
- **saveCurrentState(sessionId, state, db)**: Saves the current UI and rendering state to the database.

---

### Data Model and CRUD Operations

- **createPrimaryLine(db)**: Creates the primary line table in the database if it doesn't exist.
- **addCategoryLine(primaryLineId, category, db)**: Adds a category line to the database.
- **addItemLine(categoryLineId, itemValue, db)**: Adds an item line to the database.
- **loadPrimaryLine(db, storyText, sourceFile)**: Loads or generates the primary line from the database or story context.
- **loadCategoriesForTime(primaryLineId, db, storyText, sourceFile)**: Loads or generates categories for a given time index.
- **loadItemsForCategory(categoryLineId, db)**: Loads items for a given category from the database.
- **addTimeIndex(value, db)**: Adds a new time index to the primary line.
- **addCategory(primaryLineId, category, db)**: Adds a new category for a given time index.
- **addItem(categoryLineId, itemValue, db)**: Adds a new item for a given category.
- **addCharacterLocation(name, time, location, db)**: Adds a character's location at a specific time.
- **getCharacterLocationsByTime(time, db)**: Retrieves all character locations for a given time.
- **getCharacterLocation(name, time, db)**: Retrieves a character's location at a specific time.

---

### Data Integrity and Utilities

- **ensureMistDatabase(db)**: Creates or verifies the Mist database schema and tables.
- **updateMistData(db, csvDir)**: Updates Mist data tables from local CSV files.
- **loadMistUser(userEmail, db)**: Loads or creates a user in the database.
- **getMistDataSheets()**: Returns table references for the data schema.
- **getMistSheets()**: Returns table references for the main schema.
- **ensureCharacterLocationsTable(db)**: Ensures the character locations table exists.
- **getMistDataTables()**: Returns required table references.
- **getMistTables()**: Returns core table references.
- **loadWordDefinition(word, db)**: Loads a word's definition from the database.

---

### Advanced Rendering and Navigation

- **gramSchmidt(vectors, n)**: Applies the Gram-Schmidt process to orthonormalize vectors.
- **calculateLineOrientation(path)**: Computes the orientation of lines based on the selection path.
- **hourGlass(depth, vectorsSoFar)**: Generates orthogonal vectors for line arrangement.
- **projectItemsTo3D(items, characterLocations, timeMap, locationMap)**: Projects items and locations to 3D coordinates.
- **getMapModeProjection(db, timeMap, locationMap)**: Retrieves the 3D projection for map mode.
- **getLineTransformationMatrix(path, vectors)**: Computes a transformation matrix for rendering.

---

### Story Parsing Utility

- **storyWriter(rtfText, sourceFile)**: Parses RTF or text to extract names, statements, and provenance.
- **mapReader(imagePath, options)**: Parses an image to extract location markers or other data.

---

### Keybinds Management

- **mapKeybinds(promptFn, onUpdate)**: Allows the user to change keybinds via input.
- **handleInput(input, context)**: Processes key or mouse input events.
- **getUserKeybind(action)**: Retrieves the current keybind for an action.
- **setUserKeybind(action, key)**: Sets a keybind for a specific action.
- **resetUserKeybinds(defaults)**: Resets all user keybinds to default.

---

### Swarm Health Maintainer

- **checkAndSyncEvent(event, user, db)**: Checks event probability, syncs to the swarm, and handles anomalies.
- **isInteractionBanned(event, user)**: Checks if an interaction is banned for a user.
- **eventHorizonUser(user, db)**: Bans a user and flushes all Mist data from the host.
- **flushUserData(user, db)**: Removes all user data from persistent tables.
- **banInteraction(event, provenance, eventHorizon)**: Bans a specific interaction type or event.

---

### Milestone Modeling

- **getAllAnomalousResults()**: Returns all anomalous results as an array.
- **removeAnomalousResult(eventId)**: Removes an anomalous result by eventId.
- **setAnomalousResult(eventId, entry)**: Adds or updates an anomalous result.
- **getCurrentMilestoneOrder()**: Returns the order of the current highest milestone.
- **enableModeIfMilestone(modeType, modeName)**: Enables a mode if the milestone is achieved.
- **listEnabledModes()**: Lists all enabled projection and render modes.

---

### User Profile Management

- **nominateSuccessor(userId, email, db)**: Nominates a successor by email (before 6th milestone).
- **nominateSuccessorPGP(userId, pgpPublicKey, db)**: Nominates a successor by PGP cert (after 6th milestone).
- **nominateSuccessorFlexible(userId, value, db)**: Nominates a successor using the appropriate method based on milestone.

---

This documentation provides a comprehensive overview of the `MistTrackerVulkan.js` API, covering data tracking, session management, and advanced utilities.