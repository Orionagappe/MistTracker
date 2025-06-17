# MistTracker
Simulator Engine for X11 
https://discord.gg/hKkHpDaf

MistTrackerVulkan.js is the core logic and data management engine for a 4D item tracker, enabling advanced, session-aware, and spatially-aware visualization and navigation of complex item relationships, ready for use in high-performance, GPU-accelerated desktop applications.

Key Features and Functionality
Data Structures:
Defines classes for lines (axes), items, character locations, selection state, and map mode state, supporting hierarchical and spatial relationships.

Session and State Management:
Functions to start/end sessions, capture viewport state, and persist or restore user navigation and session data.

Database Integration:
All persistent data (lines, items, categories, locations, users, etc.) is stored in MySQL tables, with CRUD operations for each entity.

Spatial and Temporal Modeling:
Supports tracking of character/item locations over time, and provides utilities for projecting these relationships into 3D space for map mode visualization.

Selection and Navigation Logic:
Manages user selection state, enforces session-based visibility, and provides logic for advancing selection steps and centering the viewport.

Advanced Rendering Support:
Includes n-dimensional vector math (Gram-Schmidt, hourGlass), line orientation calculations, and transformation matrix utilities for GPU-accelerated rendering with Vulkan/OpenCL.

Story and Map Parsing:
Can extract structured data from RTF/text stories (storyWriter) and parse location information from image files (mapReader), enabling semi-automated data entry from narrative or visual sources.

Extensible and Modular:
All logic is organized for easy integration with native UI and rendering pipelines, and can be extended for additional axes, data types, or visualization modes.

Discord is the current location for development related discussion for this project. Please open an issue if the link needs to be refreshed.

Permissions will be automated soon, so be sure to set your Discord alias as your project alias.
