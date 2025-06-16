### **Version 0.4 Update Summary**

###  **mistSkeleton.js**

* **Purpose:** Backend logic for a 4D definite item tracker using Google Apps Script.  
* **Features:**  
  * Defines data structures for lines and items.  
  * Manages Google Sheets for storing time indexes (primary line), categories, and items.  
  * Functions to add/load time indexes, categories, and items.  
  * Groups categories by time and items by category for the UI.  
  * Tracks session state, user selections, and navigation paths.  
  * Provides a transformStream function to update state based on user actions.  
  * Includes a parser for RTF stories.

### **viewport.html**

* **Purpose:** Frontend UI for visualizing and interacting with the tracker.  
* **Features:**  
  * Renders primary, category, and item lines as columns/rows.  
  * Allows selection and addition of time indexes, categories, and items.  
  * Handles user selection and updates state via Apps Script backend.  
  * Uses a flexbox layout for arranging lines and items.  
  * Implements an `hourGlass` utility for line arrangement (currently 2D).