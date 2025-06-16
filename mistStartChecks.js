startSession(); //start a new session for the user, initializing necessary variables and state
endSession(); //end the current session for the user, saving necessary data and state
onExit(); //exception for when session ends unexpectedly, such as when the user closes the browser or navigates away from the page
priorState(); //back function to load the previous state from Current State sheet in Mist spreadsheet
nextState(); //forward function to load the next state from Current State sheet in Mist spreadsheet
captureViewport(); //capture the current viewport and save it in the Viewport sheet of Mist spreadsheet
selectMenuItems(); //select menu items based on the current state and viewport, save results in Menu Items sheet of Mist spreadsheet
createViewport(); //create a viewport based on the current state and user input, save it in the Viewport sheet of Mist spreadsheet
persistUpdate(); //save the current state of viewport items in the Current State sheet of Mist spreadsheet to Mist Persist sheet. Ignores user path information from session and only saves rendered items in the viewport.
userPath(); //save the user path information from the session to the User Path sheet in Mist spreadsheet. This is used to track the user's navigation through the application.

createPrimaryLine // Initialize the primary line (time axis)
addCategoryLine // Add a category line at a specific time index
addItemLine // Add an item line for a category
showMistUI // UI and selection logic would use HTML Service and client-side JS
ensureMistSpreadsheet //ensure that the Mist spreadsheet exists and is accessible
ensureMistDataSpreadsheet //ensure that the Mist Data spreadsheet exists and is accessible
updateMistData //update the Mist Data spreadsheet with the latest data from the Story document
loadMistUser //load the Mist user data from the Mist User sheet in Mist spreadsheet
getMistDataSheets // Utility: Get Mist Data spreadsheet and relevant sheets
getMistSheets // Utility: Get Mist spreadsheet and relevant sheets
loadPrimaryLine // Load primary line (time indexes) from Mist spreadsheet
loadCategoriesForTime // Load categories for a given time index from Mist Data spreadsheet
loadItemsForCategory // Load items for a given category from Mist Data spreadsheet
loadWordDefinition // Load dictionary definition for a word from dictionary sheets
addTimeIndex // Add a new time index to the PrimaryLine sheet
addCategory // Add a new category for a given time index
addItem // Add a new item for a given category
getMistViewportData // Provide data for the viewport UI
transformStream // Transform stream function to handle user selections and update session state. Use data from Mist spreadsheet to perform transformations and save results in Current State sheet in Mist spreadsheet.
saveSessionPath // Save path to Mist Persist
saveCurrentState // Save current state to Current State sheet
calculateLineOrientation // Calculate orientation of lines based on viewport and user input
getSessionId // Use user email + session start time or similar unique identifier 
storyWriter // Safely parses an RTF story, extracting explicit and implied character names and character statements
initViewport // Initialize the viewport with the current state and user input
renderViewport // Render the viewport based on the current state, user input, and Mist Persist items
selectTimeIndex // Select a time index from the PrimaryLine sheet
selectCategory // Select a category from the Categories sheet based on the selected time index
selectItem // Select an item from the Items sheet based on the selected category
showAddTimeInput // Show input box for adding a new time index
showAddCategoryInput // Show input box for adding a new category
showAddItemInput // Show input box for adding a new item
showInputBox // Show input box for user input, such as adding a new time index, category, or item
handleSelection // Handle user selection from the Mist UI, updating the session state and saving to Mist Persist
hourGlass; //a function within viewport to render an 3d environment based on the current state, user input, and Mist Persist items, save results in the Viewport sheet of Mist spreadsheet