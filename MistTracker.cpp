#include <string>
#include <vector>
#include <map>
#include <ctime>
#include <memory>
#include <iostream>
#include <algorithm>

// --- Data Structures ---
struct Line {
    std::string type;
    std::shared_ptr<Line> parent;
    std::vector<std::shared_ptr<Line>> children;
    std::vector<std::string> items;
    Line(const std::string& t, std::shared_ptr<Line> p = nullptr)
        : type(t), parent(p) {}
};

struct DefiniteItem {
    std::string value;
    std::shared_ptr<Line> line;
    std::vector<double> position;
    std::vector<std::string> relatedItems;
    DefiniteItem(const std::string& v, std::shared_ptr<Line> l, const std::vector<double>& pos)
        : value(v), line(l), position(pos) {}
};

struct CharacterLocation {
    std::string name;
    std::string time;
    std::string location;
    CharacterLocation(const std::string& n, const std::string& t, const std::string& loc)
        : name(n), time(t), location(loc) {}
};

struct SelectionModeState {
    std::string currentStep = "time";
    std::vector<int> selectedIndices;
    bool inputBoxOpen = false;
    std::string inputBoxType;
};

struct MapModeState {
    std::vector<double> cameraPosition = {0, 0, 10};
    std::string projectionType = "perspective";
    std::string focusItem;
};

// --- In-Memory Data Model ---
struct MistModel {
    std::vector<std::shared_ptr<Line>> lines;
    std::vector<std::string> users;
    std::vector<std::string> categories;
    std::vector<std::string> items;
    std::vector<std::string> sessions;
};

// --- Session and State Management ---
struct Session {
    std::string user;
    std::vector<std::string> path;
    std::map<int, std::vector<int>> opened;
    std::vector<std::vector<double>> vectors;
    std::string lastSelection;
    std::time_t timestamp;
};

Session startSession(const std::string& user) {
    Session session;
    session.user = user;
    session.timestamp = std::time(nullptr);
    return session;
}

void endSession(const Session& session /*, DB connection*/) {
    // Persist session state to the database
    // db.query("INSERT INTO mist.CurrentState ...", ...);
}

void captureViewport(Session& session, const std::string& viewportState) {
    // session.viewport = viewportState; // Add viewport field if needed
}

void saveSessionPath(const std::string& sessionId, const std::vector<std::string>& path /*, DB connection*/) {
    // db.query("INSERT INTO MistPersist ...", ...);
}

void saveCurrentState(const std::string& sessionId, const Session& state /*, DB connection*/) {
    // db.query("INSERT INTO CurrentState ...", ...);
}

// --- Data Model and CRUD Operations (stubs) ---
void createPrimaryLine(/*DB connection*/) {
    // db.query("CREATE TABLE IF NOT EXISTS mist.PrimaryLine ...");
}
void addCategoryLine(int primaryLineId, const std::string& category /*, DB connection*/) {}
void addItemLine(int categoryLineId, const std::string& itemValue /*, DB connection*/) {}
std::vector<std::string> loadPrimaryLine(/*DB connection*/) { return {}; }
std::vector<std::string> loadCategoriesForTime(int primaryLineId /*, DB connection*/) { return {}; }
std::vector<std::string> loadItemsForCategory(int categoryLineId /*, DB connection*/) { return {}; }
void addTimeIndex(const std::string& value /*, DB connection*/) {}
void addCategory(int primaryLineId, const std::string& category /*, DB connection*/) {}
void addItem(int categoryLineId, const std::string& itemValue /*, DB connection*/) {}
void addCharacterLocation(const std::string& name, const std::string& time, const std::string& location /*, DB connection*/) {}
std::vector<CharacterLocation> getCharacterLocationsByTime(const std::string& time /*, DB connection*/) { return {}; }
std::string getCharacterLocation(const std::string& name, const std::string& time /*, DB connection*/) { return ""; }

// --- Data Integrity and Utilities (stubs) ---
void ensureMistDatabase(/*DB connection*/) {}
void ensureCharacterLocationsTable(/*DB connection*/) {}
std::string loadMistUser(const std::string& userEmail /*, DB connection*/) { return userEmail; }
std::map<std::string, std::string> getMistDataTables() { return {}; }
std::map<std::string, std::string> getMistTables() { return {}; }
std::string loadWordDefinition(const std::string& word /*, DB connection*/) { return ""; }

// --- Viewport and UI Logic (stubs) ---
void advanceSelectionMode(SelectionModeState& state, int selectionIndex) {
    if (state.currentStep == "time") {
        if (state.selectedIndices.size() < 1) state.selectedIndices.resize(1);
        state.selectedIndices[0] = selectionIndex;
        state.currentStep = "category";
        state.inputBoxOpen = true;
        state.inputBoxType = "category";
    } else if (state.currentStep == "category") {
        if (state.selectedIndices.size() < 2) state.selectedIndices.resize(2);
        state.selectedIndices[1] = selectionIndex;
        state.currentStep = "item";
        state.inputBoxOpen = true;
        state.inputBoxType = "item";
    } else if (state.currentStep == "item") {
        if (state.selectedIndices.size() < 3) state.selectedIndices.resize(3);
        state.selectedIndices[2] = selectionIndex;
        state.inputBoxOpen = false;
        state.inputBoxType = "";
    }
}

struct ViewportCentering {
    double timeLineOffsetX;
    double categoryLineOffsetY;
};

ViewportCentering getViewportCentering(const SelectionModeState& /*state*/) {
    // Replace with actual window size queries
    return { 1920.0 / 6, 1080.0 / 6 };
}

bool isItemVisible(const Session& session, int depth, int index) {
    auto it = session.opened.find(depth);
    if (it == session.opened.end()) return false;
    const auto& indices = it->second;
    return std::find(indices.begin(), indices.end(), index) != indices.end();
}

void handleSelectionBackend(Session& session, int selectionIndex, SelectionModeState& state) {
    session.path.push_back(std::to_string(selectionIndex));
    int depth = state.selectedIndices.size();
    session.opened[depth].push_back(selectionIndex);
    advanceSelectionMode(state, selectionIndex);
    session.lastSelection = std::to_string(selectionIndex);
}

// --- Milestone Modeling ---
struct Milestone {
    int order;
    std::string description;
    bool enabled = false;
    std::time_t achievedAt = 0;
    Milestone(int o, const std::string& d) : order(o), description(d) {}
};

class MilestoneManager {
public:
    std::vector<Milestone> milestones;
    int currentOrder = 0;
    int maxOrder = 256;
    std::vector<std::string> enabledProjectionModes;
    std::vector<std::string> enabledRenderModes;

    void addMilestone(int order, const std::string& description) {
        milestones.emplace_back(order, description);
    }

    bool achieveMilestone(int order) {
        for (auto& m : milestones) {
            if (m.order == order) {
                m.enabled = true;
                m.achievedAt = std::time(nullptr);
                updateEnabledModes(order);
                return true;
            }
        }
        return false;
    }

    void updateEnabledModes(int order) {
        if (order >= 3 && std::find(enabledProjectionModes.begin(), enabledProjectionModes.end(), "4D") == enabledProjectionModes.end())
            enabledProjectionModes.push_back("4D");
        if (order >= 6 && std::find(enabledProjectionModes.begin(), enabledProjectionModes.end(), "nD") == enabledProjectionModes.end())
            enabledProjectionModes.push_back("nD");
        if (order >= 4 && std::find(enabledRenderModes.begin(), enabledRenderModes.end(), "wave-based") == enabledRenderModes.end())
            enabledRenderModes.push_back("wave-based");
        if (order >= 8 && std::find(enabledRenderModes.begin(), enabledRenderModes.end(), "quantum") == enabledRenderModes.end())
            enabledRenderModes.push_back("quantum");
    }

    bool isModeEnabled(const std::string& modeType, const std::string& modeName) {
        if (modeType == "projection")
            return std::find(enabledProjectionModes.begin(), enabledProjectionModes.end(), modeName) != enabledProjectionModes.end();
        if (modeType == "render")
            return std::find(enabledRenderModes.begin(), enabledRenderModes.end(), modeName) != enabledRenderModes.end();
        return false;
    }
};

// --- Exported API (for C++/JS bridge or direct use) ---
/*
extern "C" {
    // Export functions for use in Node.js or other modules
    // e.g., startSession, endSession, createPrimaryLine, etc.
}
*/

// --- Example usage ---
/*
int main() {
    MilestoneManager mm;
    mm.addMilestone(3, "Enable 4D projection");
    mm.achieveMilestone(3);
    std::cout << "4D enabled: " << mm.isModeEnabled("projection", "4D") << std::endl;
    return 0;
}
*/