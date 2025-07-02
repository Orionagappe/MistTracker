Mist 7D Update

#### **1\. Database Layer**

* **Update all references to MySQL:**  
  * The solution now uses a custom MistMySQL.js wrapper (inspired by mysql-master) with queryAsync, connectAsync, and endAsync methods.  
  * All CRUD and session persistence functions should use this interface.  
* **Time Vector Support:**  
  * All time-based data (e.g., CharacterLocation, session state) now uses a 3-element time vector `[T0, T1, T2]` (quantum, interaction, cosmological) instead of a single time value.  
  * Database schema and queries must support t0, t1, t2 columns.

#### **2\. Session and State Management**

* **Session objects** now include a timeVec property.  
* **Session persistence** (endSession, saveSessionPath, etc.) should serialize the full session object, including timeVec.  
* **On exit** and signal handling should ensure session state is saved using the new DB interface.

#### **3\. Data Model and CRUD**

* **CRUD functions** (e.g., addCharacterLocation, getCharacterLocationsByTime) now require and use the time vector.  
* **Migration scripts** may be needed to convert legacy single-time data to the new vector format.

#### **4\. UI and Viewport**

* **Selection and navigation** logic (e.g., SelectionModeState) now tracks three time indices.  
* **Projection and rendering** functions (e.g., projectItemsTo3D) use the timeToSpace mapping from MistIllum.js to convert time vectors to spatial coordinates.  
* **Menu and settings** overlays are implemented in MistIllum.js and support both CLI and X11 UI renderers.

#### **5\. Physics and Math**

* **Metric tensors** are now 7D (metricTensor7D) to support three time dimensions and four spatial/energy axes.  
* **All physics, wave, and rendering logic** (e.g., waveFunction, quantumMassEvolution, gravWaveDeltaV) use the appropriate time dimension as per the new model.  
* **Landscape/environment generation** uses generateLandscapeFromTime to create 3D environments as a product of the three time dimensions.

#### **6\. Multi-User and P2P**

* **Session and event management** uses in-memory maps and message queues.  
* **Peer-to-peer messaging** and event handling are implemented using stubs or minimal logic, with placeholders for cryptography and DHT.  
* **Rate limiting** and provenance tracking are enforced as per MistMulti.js.

#### **7\. Moderation and Swarm Health**

* **Anomaly detection** and event horizon logic are implemented, with in-memory and persistent tracking of anomalous events and banned users/interactions.

#### **8\. Milestone and Mode Management**

* **MilestoneManager** enables/disables projection and render modes based on achieved milestones.  
* **Mode selection menus** are milestone-aware and only show available modes.

#### **9\. Migration and Compatibility**

* **All Google Sheets/Drive operations** are replaced with MySQL queries and file I/O.  
* **All HTML Service UI** is replaced with X11 or CLI UI.  
* **All vector/matrix operations** are ready for GPU acceleration (Vulkan/OpenCL), but currently implemented in JS.

#### **10\. Testing and Stubbing**

* **All external dependencies** (npm modules, system calls) are stubbed or replaced for environments where npm is not available.  
* **Testing** should focus on pure JS logic, with stubs for DB, crypto, and system calls.

