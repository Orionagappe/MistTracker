# Phase 15: Preparation Checklist

**Previous Phase**: Phase 14 - Builder Persistence (✅ Complete)  
**Current Phase**: Phase 15 - [To Be Defined]  
**Recommendation**: Simulator refinement and validation  

---

## Pre-Phase Tasks

- [ ] Review Phase 14 completion summary: `PHASE-14-BUILDER-PERSISTENCE-COMPLETE.md`
- [ ] Run multi-timeline builder test to verify persistence isolation works correctly
- [ ] Verify server is not generating any 400/500 errors on builder config save
- [ ] Check database for builder_configs entries across different timelines

---

## Known Working State (Phase 14 Stable)

### Builder Component ✅
- Atoms persist to database via PUT /timelines/:id/builder-config
- Atoms reload correctly on page refresh (loads from localStorage + DB)
- Timeline-keyed storage prevents config mixing
- 3D rendering works with proper atom sizes and placement

### Database ✅
- `builder_configs` table auto-creates on server startup
- JSON column properly handled (no double-parse errors)
- Validator accepts real atom configuration objects

### Storage Hook ✅
- `useBuilderStorage(timelineId)` provides timeline-scoped persistence
- Handles both localStorage and server sync
- Auto-save triggers on config changes

---

## Known Issues to Address in Phase 15

| Issue | Component | Impact | Priority |
|-------|-----------|--------|----------|
| PhysicsVisualization render loop | PhysicsVisualization.jsx | Console spam, ~80 logs per render | Low |
| Double WebSocket connection | App.jsx | Benign but inefficient | Low |
| Simulator config loading not yet tested | PhysicsPage → Simulator | Unknown | Medium |

---

## Recommended Phase 15 Focus

### Option A: Simulator Hardening (Recommended)
**Scope**: Ensure simulator can load builder configs correctly and validate simulation params  
**Tasks**:
1. Test simulator with atoms loaded from builder
2. Verify simulation params pass validation
3. Check WebSocket message handling for builder-to-simulator data flow
4. Fix PhysicsVisualization render loop as part of this work

**Effort**: 4–6 hours  
**Dependencies**: None (Phase 14 stable)

### Option B: Builder UI Polish
**Scope**: Improve builder UX (presets, quick-place, visual feedback)  
**Tasks**:
1. Add atom preset buttons (common elements)
2. Implement undo/redo for placements
3. Add visual guides or snapping

**Effort**: 8–12 hours  
**Dependencies**: None (Phase 14 stable)

### Option C: API Documentation & Testing
**Scope**: Formalize builder API for future integrations  
**Tasks**:
1. Document PUT /timelines/:id/builder-config schema
2. Document GET /timelines/:id/builder-config response format
3. Add integration tests for save/load cycle
4. Create example payloads for documentation

**Effort**: 3–5 hours  
**Dependencies**: None (Phase 14 stable)

---

## Build/Run Commands (Unchanged)

**Development**:
```bash
cd j:\Portfolio Site\Gdocsdev\MistTracker
npm run server    # Terminal 1 (port 3000)
npm run client    # Terminal 2 (port 5173)
```

**Testing**:
- Browser: http://localhost:5173
- API endpoint: http://localhost:3000
- Database: MySQL 8.0 on localhost (schema: `mist`)

---

## Code Locations (Unchanged)

| Component | File | Key Functions |
|-----------|------|-----------------|
| Builder UI | `client/src/components/AtomBuilder.jsx` | `handleCanvasClick()`, `rebuildScene()` |
| Storage Hook | `client/src/hooks/useBuilderStorage.js` | `loadConfig()`, `saveConfig()` |
| Persistence Logic | `client/src/pages/PhysicsPage.jsx` | `handleSaveConfiguration()` |
| Server Endpoint | `server.js` | `PUT /timelines/:id/builder-config` |
| Validation | `builder-config-validator.js` | `validateBuilderConfig()` |
| Database Schema | `database-schema.sql` | `builder_configs` table |

---

## Next Steps

1. **Immediately** (if testing simulator): Verify simulator loads builder-placed atoms without errors
2. **Before Phase 15 starts**: Choose Option A, B, or C based on user feedback
3. **Document decision**: Update this file with chosen Phase 15 scope

---

## Contact / Notes

- All builder fixes verified April 18, 2026
- Database tested and working
- Ready for Phase 15 work at any time
