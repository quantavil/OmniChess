# Project: A.C.A.S (Advanced Chess Assistance System)

## Overview
A.C.A.S is an open-source, multi-engine, multi-variant chess assistance system. It operates as a web-based UI/GUI communicating with a userscript (located locally at `/home/quantavil/Documents/Project/userscript/ACAS-bot/` and online at [quantavil/userscript](https://github.com/quantavil/userscript/tree/main/ACAS-bot)) that runs in separate tabs of chess websites (e.g., chess.com, lichess.org) via CommLink (cross-window postMessage communication). It supports built-in WASM chess engines (Stockfish, Fairy Stockfish, Lc0, Maia) and external UCI engines via a Node.js/Electron localhost server (`appServer`).

## Structure
A.C.A.S/
├── index.html             # Landing page / redirection to the app
├── app/                   # Main GUI application code
│   ├── index.html         # Main GUI frontend
│   ├── gui.css            # Styles for the GUI
│   └── assets/            # Static assets and frontend JavaScript logic
│       ├── js/            # GUI engine & interface coordinators
│       │   ├── globals.js            # Shared global state, settings templates, utility logic
│       │   ├── AcasInstance.js       # Repr. of an engine instance and its coordination
│       │   ├── gui.js                # Core GUI DOM operations
│       │   ├── gui/                  # Submodules for input/dropdown/setting UI mapping
│       │   ├── instance/             # Submodules for WASM engine communication and calculations
│       │   └── misc/                 # Utility scripts (e.g. userscript bridge, icons.js)
│       └── engines/       # WASM engine binaries and wrappers
└── appServer/             # Node.js/Electron localhost desktop server for external engines
    ├── backend/           # Server-side WebSocket / UCI engine controller
    └── ui/                # Dev/monitoring interface for the localhost server

## Conventions
- **GUI & Engine separation**: Chess engine execution runs in a separate browser tab/process (GUI) from the chess site, avoiding detection and cross-origin resource limitations.
- **CommLink communication**: GUI and userscript exchange board states and calculated move suggestions via CommLink.
- **Modular components inside app/assets/js**: Code is split into logical modules (e.g., instances, gui controls, rendering feedbacks, metrics calculations).

## Dependencies & Setup
- Built-in WASM chess engines require Cross-Origin Opener Policy (COOP) and Cross-Origin Embedder Policy (COEP) headers (provided by `coi-serviceworker.js` for GitHub Pages).
- Localhost engine server (`appServer`) runs a Node.js script using `ws` (WebSockets) and optionally Electron.

## Critical Information
- Expect variants support bugs (especially on Fairy Stockfish).
- Do not run calculations in the main userscript thread to prevent page lag and cheat-detection triggers on chess websites.

## Insights
- **Audit & Implementation Findings:** Performed a codebase audit and implemented design realignments:
  - Deleted Stockfish 16 binary assets (`sf16-7.js`/`sf16-7.wasm`/`16-0-worker.js`) to remove bloat, leaving SF 17 and 18 options.
  - Revamped UI styling from gamified blue-gray layout to a premium dark-bone monochromatic dashboard (`#0b0f19`/`#16161a`) with tactile spring click micro-interactions.
  - Decoupled from remote Bootstrap Icons CDN; created local SVG icon registry [icons.js](file:///home/quantavil/Documents/Project/A.C.A.S/app/assets/js/misc/icons.js) with dynamic checkmark inject actions.
  - Audit details preserved in [codebase_audit.md](file:///home/quantavil/.gemini/antigravity-cli/brain/0bcff703-dd9a-420d-91ca-458862b3feed/codebase_audit.md).
- **Stealth & Automation Alignment:** Placed both the renamed "Stealth & Automation" card and the "Miscellaneous" card inline side-by-side within the main settings-panels layout, ensuring they flex next to each other correctly.
- **Warm Charcoal & Flat Refinements:** Lifted overall illumination by shifting base darks to warm charcoal (`#1f1f23`, `#29292e`, `#323238`) and borders to crisp slate (`#3f3f46`). Removed thick bottom borders and glassmorphism blurs on popups/dropdowns, replacing them with flat styling, custom shadow depth, and smooth modal entrance animations.
- **Subpage Depletions & Link Alignment:** Completely deleted the obsolete `blog` and `contributing` pages and removed all corresponding links/buttons in headers/footers. Corrected all case-insensitive `Psyyke` repository references in links, canonical URLs, and configuration files to point to the correct owner `quantavil`.
- **Icon Swaps & Close Buttons:** Corrected swapped SVGs in `icons.js` where `import` now points to down-arrow and `export` points to up-arrow. Added a standard `close` cross icon, changing all popup close buttons in `index.html` from the download-like `export` to `close` for an intuitive dialog layout.

- **Lottie, Bootstrap Icons CDN, & Footer Removal**: Dropped bodymovin library, replaced with inline animated SVG loader in usage/index.html, and extended local icons.js with download, journals, tools, and chat-square-quote SVGs to replace Bootstrap Icons remote CDNs. Removed the bottom footer links and credit section from the app settings GUI.
- **Floating Panel Settings Inline Integration:** Removed the `#floating-floaty` dialog settings modal entirely, moving the chess board videostream container and 'Display Board' checkbox inline, shown dynamically under `#pip-sub-settings` via setting changes.
- **Firefox Picture-in-Picture & State Sync:** Prevented Firefox PiP termination by keeping the video element rendering inline in the DOM rather than off-screen/hidden. Integrated `enterpictureinpicture` and `leavepictureinpicture` listeners to sync state with the `pip` checkbox.
- **Pychess Rendering Fix:** Replaced `Math.floor` with `Math.round` in `getBoardDimensionsFromSize` to resolve subpixel truncation errors that broke rank 8 piece extraction. Added fallback to CSS transform-based coordinate parsing in `pychess.org` adapter when `cgKey` is missing.
- **Picture-in-Picture Engine Name Display:** Added a helper to map engine keys to human-friendly names and passed it to `updatePipData` during calculations/new games, replacing static 'A.C.A.S' text on the PIP window header.
- **Crazyhouse Drop Move Parsing:** Added support in `engineMessageProcessor.js` to parse drop moves (e.g. `P@e4`) using a new `dropRegex` and handle them safely in `AcasInstance.js`'s piece evaluation.
- **Userscript Compatibility:** Ported and restored missing site adapters (chess.org, papergames.io, immortal.game, chess.net, freechess.club, play.chessclub.com, app.edchess.io, and the GUI/backend pages) to the userscript repository.
- **AutoMove Jitter & Path Presets:** Implemented dynamic click release delays (randomized 40ms to 110ms) and Bezier mouse path presets (fast-flicker, slow-steady, and tired-drag profiles) in the autoMove logic to enhance human simulation.
- **Documentation & Credits:** Updated main and userscript READMEs to attribute credit to the original script (HKR/Psyyke's greasyfork) and detail our new enhancements (modular structure, local CommLink, adaptive depth, auto-move jitter, presets).
- **Userscript Code Audit & Performance Overhaul:** Resolved all 20 code audit findings (including null click crashes, classList errors, unguarded wrappers, coordinates transposition, underpromotion clicking, and secure origin checks) and dramatically reduced CPU load by optimization of the FEN scanner DOM calls (from 17 scans to 1) and CommLink shared receiver polling.

## Blunders
- None logged yet.
