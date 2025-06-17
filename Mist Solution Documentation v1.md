4 dimensional definite item tracker.

Definitions:   
definite items can be anything that has a defined space in time.  
Indefinite items are anything that has no physical or boolean interpretation.  
Primary line is a vertical line that represents all relative time indexes with earlier times being higher and later times being lower. The time line is the only line that has no parent line.  
Line is an axis of movement along which associated parameters are defined, represented, and accessed.

List of line associations:  
Primary Line  
Category Line  
Item Line

Purpose:  
To generate a visual representation of all tracked items and display the topology of item relationships. 

Selection:  
Selector inverts the color of the representation of the item on the current line relative to the color of the line.

Navigation:  
Navigation along any line always uses directions relative to the parent line or plane.

Mode:  
Map mode is the internal representation of all data.  
Selection mode is the user interface that allows users to visually manipulate the selection and arrangement of selections and parent elements.

Selection mode description:  
Selecting a time index opens the category selection entry box. Users may select defined category options. Once the user makes a selection, the box closes, and a new line is drawn perpendicular to the parent line. Center viewport so the time line is ⅙ of the viewport width, away from the left boundary of the viewport and the category line is ⅙ of the viewport height away from the bottom boundary of the viewport. A new box opens to allow user input for the selected category. Based on user submitted value, populate category line with the item and all related items.

All lines subsequent to the category line, based on user selection, are arranged orthogonal to the plane created by new line’s parent line and and the parent line of the current line. 

Items on each line are arranged based on their relative location on the previous line, but are not visible or selectable to the user unless it has been opened previously by the user in the current session.

A reasonable way to implement the solution outlined in \*\*mist.md\*\* using JavaScript and Google Apps Script (as in concordance.js) would be to:

\---

\#\#\# 1\. \*\*Define Data Structures for Lines and Items\*\*

\- Use JavaScript objects/classes to represent \*\*lines\*\* (axes) and \*\*items\*\* (definite items).  
\- Each line (Primary, Category, Item) is an object with properties for its type, parent, children, and associated items.  
\- Each item has properties for its value, position on the line, and references to related items.

\---

\#\#\# 2\. \*\*Store State in Google Sheets\*\*

\- Use a Google Sheet to persist the state of all lines and items (time indexes, categories, items, relationships).  
\- Each sheet/tab can represent a line type (e.g., "PrimaryLine", "CategoryLine", "ItemLine").  
\- Each row represents an item or a relationship.

\---

\#\#\# 3\. \*\*Core Functions\*\*

\- \*\*createPrimaryLine()\*\*: Initializes the vertical time line.  
\- \*\*addCategoryLine(timeIndex, category)\*\*: Adds a category line perpendicular to the primary line at a given time index.  
\- \*\*addItemLine(categoryIndex, item)\*\*: Adds an item line orthogonal to the category line.  
\- \*\*selectItem(line, index)\*\*: Handles selection logic and UI state.  
\- \*\*navigate(line, direction)\*\*: Handles navigation along lines relative to parent lines.

\---

\#\#\# 4\. \*\*UI Representation\*\*

\- Use Google Apps Script’s \[HTML Service\](https://developers.google.com/apps-script/guides/html) to build a custom sidebar or dialog for visualization.  
\- Render lines as SVG or HTML elements, with CSS for color inversion on selection.  
\- Allow user interaction for selection, navigation, and input.

\---

\#\#\# 5\. \*\*Session State\*\*

\- Use \[PropertiesService\](https://developers.google.com/apps-script/guides/properties) or in-memory objects to track which items/lines have been opened in the current session.

\---

\#\#\# 6\. \*\*Example Skeleton Code\*\*

\`\`\`javascript  
// Data structure for a line  
class Line {  
  constructor(type, parent \= null) {  
    this.type \= type; // e.g., 'Primary', 'Category', 'Item'  
    this.parent \= parent;  
    this.children \= \[\];  
    this.items \= \[\];  
  }  
}

// Data structure for an item  
class DefiniteItem {  
  constructor(value, line, position) {  
    this.value \= value;  
    this.line \= line;  
    this.position \= position;  
    this.relatedItems \= \[\];  
  }  
}

// Initialize the primary line (time axis)  
function createPrimaryLine() {  
  const primaryLine \= new Line('Primary');  
  // Load or create time indexes from sheet  
  // ...  
  return primaryLine;  
}

// Add a category line at a specific time index  
function addCategoryLine(primaryLine, timeIndex, category) {  
  const categoryLine \= new Line('Category', primaryLine);  
  primaryLine.children.push(categoryLine);  
  // Store in sheet and update UI  
  // ...  
  return categoryLine;  
}

// Add an item line for a category  
function addItemLine(categoryLine, itemValue) {  
  const itemLine \= new Line('Item', categoryLine);  
  categoryLine.children.push(itemLine);  
  const item \= new DefiniteItem(itemValue, itemLine, 0);  
  itemLine.items.push(item);  
  // Store in sheet and update UI  
  // ...  
  return itemLine;  
}

// UI and selection logic would use HTML Service and client-side JS

function showMistUI() {  
  const html \= HtmlService.createHtmlOutputFromFile('MistUI')  
    .setTitle('4D Definite Item Tracker');  
  SpreadsheetApp.getUi().showSidebar(html);  
}  
\`\`\`

\---

\#\#\# 7\. \*\*Visualization (MistUI.html)\*\*

\- Use HTML/CSS/JS to render lines and items.  
\- Use event handlers to manage selection, navigation, and input.  
\- Use Google Apps Script’s \`google.script.run\` to call server-side functions for data updates.

\---

\#\#\# 8\. \*\*Persistence\*\*

\- On every change (add/select/navigate), update the Google Sheet to persist the state.  
\- On UI load, read from the sheet to reconstruct the current topology.

\---

\#\#\# 9\. \*\*Extensibility\*\*

\- Add more line types or relationships as needed.  
\- Implement logic for orthogonal arrangement and visibility rules as described in mist.md.

\---

\*\*Summary:\*\*    
You would model lines and items as objects, persist their state in Google Sheets, use Apps Script server functions for logic, and HTML Service for visualization and interaction, following the axis/line and selection/navigation rules described in mist.md. This approach fits well with the patterns used in concordance.js and leverages Google Apps Script’s strengths for workspace automation and UI.

Based on the provided scripts and documentation, the \*\*current functionality of "mist" as a solution\*\* is as follows:

\---

\#\#\# \*\*1. Workspace Initialization and Data Governance\*\*

\- \*\*Folder and File Management:\*\*    
  The scripts automatically locate the folder containing mistSkeleton.js and ensure that two key spreadsheets exist in that folder:  
  \- \*\*Mist\*\* (for tracking lines and items, with sheets like "Mist Persist", "PrimaryLine", "CategoryLine", "ItemLine")  
  \- \*\*Mist Data\*\* (for supporting data, with sheets like "Data Relationships", "Word Definitions", "Categories", "Users")

\- \*\*Sheet Management:\*\*    
  If required sheets are missing in either spreadsheet, they are created automatically.

\---

\#\#\# \*\*2. Data Import and Synchronization\*\*

\- \*\*CSV Import:\*\*    
  All CSV files in the same folder are detected and their contents are loaded into sheets (by name) in either "Mist" or "Mist Data". If a sheet does not exist, it is created in "Mist Data" by default.

\---

\#\#\# \*\*3. User Management and Session Tracking\*\*

\- \*\*User Record Creation:\*\*    
  On startup, the system checks if the current user has a record in the "Users" sheet of "Mist Data". If not, it creates a new record with:  
  \- User Name (alias)  
  \- Google AccountID (email)  
  \- Date Created  
  \- Last Session (null on creation)  
  \- Sessions (the fileId of a CSV file in the folder; if none exists, a new CSV is created for the user)

\---

\#\#\# \*\*4. Data Model for 4D Definite Item Tracking\*\*

\- \*\*Core Data Structures:\*\*    
  The code defines JavaScript classes for \`Line\` (representing axes like Primary, Category, Item) and \`DefiniteItem\` (representing items on those lines).  
\- \*\*Line and Item Management:\*\*    
  Functions exist to create the primary time line, add category lines, and add item lines, with relationships between them. These are designed to be persisted in the spreadsheets.

\---

\#\#\# \*\*5. UI Integration (Sidebar)\*\*

\- \*\*Sidebar UI:\*\*    
  There is a function to show a sidebar in Google Sheets using HTML Service, intended for visualizing and interacting with the 4D item tracker.

\---

\#\#\# \*\*6. Session and State Management\*\*

\- \*\*Session Files:\*\*    
  Each user has a session CSV file for tracking their activity.  
\- \*\*Persistence:\*\*    
  All changes and data are persisted in the relevant Google Sheets and session CSVs.

\---

\#\#\# \*\*7. Extensibility for Visual and Interactive Topology\*\*

\- \*\*Preparation for Visual Topology:\*\*    
  The scripts and data structures are set up to support the visual and interactive requirements described in mist.md, such as:  
  \- Visualizing lines and items  
  \- Handling selection and navigation  
  \- Managing relationships and visibility based on user interaction

\---

\#\# \*\*Summary Table\*\*

| Feature Area         | Current Functionality                                                                 |  
|----------------------|--------------------------------------------------------------------------------------|  
| File/Sheet Setup     | Auto-creates and manages "Mist" and "Mist Data" spreadsheets and required sheets     |  
| Data Import          | Loads CSVs into sheets for structured data import                                    |  
| User Management      | Tracks users, creates user/session records, manages session CSVs                     |  
| Data Model           | Defines lines and items, supports adding and relating them                           |  
| UI                   | Sidebar setup for future interactive visualization                                   |  
| Session/State        | Persists user and session state in sheets and CSVs                                   |  
| Extensibility        | Structured for future expansion to full 4D visual/interactive topology               |

\---

\*\*In summary:\*\*    
The V0.2 "mist" solution provides a robust backend for a 4D definite item tracker, handling all workspace setup, user/session management, and data import. It lays the groundwork for a visual, interactive system, with all data and relationships persisted in Google Sheets and CSVs, ready for further UI and logic development.  


Mist Functions and Classes: See x11LibreMigration.txt
