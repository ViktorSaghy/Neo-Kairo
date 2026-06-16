# Neo-Kairo Incremental Development Strategy

## Core Principle
**Don't refactor for refactoring's sake.** Extract systems only when:
1. You're adding a **new feature** that needs the system
2. You're **modifying** an existing system and want it organized
3. You want to **test** something independently
4. You need **parallel development** on related features

## Current State
- Single `App.jsx` file (9,592 lines, 614.6 KB) ← Keep as reference
- Existing `data/world.js` for world data
- Game is functional and working

---

## When to Extract a System

**Trigger 1: Adding a New Feature**
```
"I want to add a new loot system mechanic"
→ Extract loot to systems/loot/lootSystem.js
→ Import & use in App.jsx
→ Delete old code from App.jsx when stable
```

**Trigger 2: Modifying an Existing System**
```
"I need to change how hacking works"
→ Extract hack to systems/hack/hackSystem.js
→ Make changes in new module
→ Test thoroughly
→ Swap App.jsx to use new version
→ Delete old code
```

**Trigger 3: Want to Write Tests**
```
"I want to test the RNG system"
→ Extract RNG to utils/rng.js
→ Write test file: utils/rng.test.js
→ Import into App.jsx
```

**NOT a trigger:**
- "It would be nice if..." ← Too vague
- "Might be useful someday" ← Premature
- Just general cleanup ← Keep working on features

---

## File Structure (Grows as You Work)

```
src/
├── App.jsx ← Central hub, imports from modules
├── main.jsx
│
├── systems/ ← Created on-demand as you add/modify features
│   ├── audio/
│   │   └── AudioSystem.js (extracted when: adding audio features)
│   ├── hack/
│   │   └── hackSystem.js (extracted when: modifying hacking)
│   └── ...
│
├── data/
│   └── world.js (already exists)
│
├── utils/ ← Created on-demand
│   ├── rng.js (extracted when: need to test RNG or add seeding)
│   └── ...
│
└── components/ ← Created on-demand
    ├── HackScreen.jsx (extracted when: refactoring hack UI)
    └── ...
```

---

## Workflow Example

### Scenario: "I want to add new item effects"

**Step 1: Assess**
- Item system is in App.jsx (functions: lootTable, shopInventory, etc.)
- Need to modify or test it independently

**Step 2: Extract**
```javascript
// src/systems/items/itemSystem.js
export function lootTable(danger, rng, chunkType) { /* ... */ }
export function shopInventory(ct, faction, danger) { /* ... */ }
export function armorStock(ct, danger) { /* ... */ }
// etc.
```

**Step 3: Integrate**
```javascript
// In App.jsx
import { lootTable, shopInventory } from './systems/items/itemSystem.js';
// Remove old function definitions from App.jsx
```

**Step 4: Add Feature**
```javascript
// src/systems/items/itemSystem.js
export function applyNewItemEffect(item, character) { 
  // Your new code
}
```

**Step 5: Test & Deploy**
- Verify loot drops work
- Verify shops work
- Ship update

**Step 6: Cleanup**
- Remove old item functions from App.jsx if not already gone

---

## Key Rules

1. **Extract ONE system at a time** - don't extract 5 things at once
2. **Test after extraction** - make sure the game still works
3. **Keep App.jsx as command center** - it orchestrates everything
4. **One system per folder** - `systems/audio/`, `systems/combat/`, etc.
5. **Don't pre-extract** - only extract when you actually need it
6. **Gradual cleanup** - old code can coexist briefly during transition

---

## Target Structure (After 6+ months of development)

```
src/
├── App.jsx (main, maybe 500-1000 lines)
├── main.jsx
│
├── systems/
│   ├── audio/ (AudioSystem, HackAudio)
│   ├── worldGen/ (chunks, terrain, factions)
│   ├── combat/ (damage, status effects, AI)
│   ├── hack/ (difficulty, programs, logic)
│   ├── loot/ (drops, shops, inventory)
│   ├── progression/ (achievements, reputation, legacy)
│   └── narrative/ (events, jobs, dialogue)
│
├── components/
│   ├── UI/ (Bar, Tag, Sheet, etc.)
│   ├── Game/ (HUD, inventory screens)
│   └── Menus/ (start, settings, etc.)
│
├── hooks/ (custom React hooks)
├── utils/ (helpers, RNG, math)
└── data/ (world.js, constants)
```

---

## Success Metrics

- ✓ Game still works after each extraction
- ✓ New features go into proper modules
- ✓ App.jsx gets slightly smaller over time (not bigger)
- ✓ Can modify individual systems without touching App.jsx
- ✓ No architectural debt accumulates

**This is not about speed. It's about sustainable development.**
