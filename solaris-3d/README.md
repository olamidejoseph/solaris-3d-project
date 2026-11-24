# SOLARIS 3D

A cinematic, interactive Solar System explorer built with Vite and Three.js.

## Requirements
- Node.js 20.19+ or 22.12+
- VS Code (recommended)

## Run locally

1. Extract the ZIP file.
2. Open the `solaris-3d` folder in VS Code.
3. Open the VS Code terminal (`Terminal > New Terminal`).
4. Run:

   ```bash
   npm install
   npm run dev
   ```

5. Open the local URL printed by Vite (normally `http://localhost:5173`).

## Build for production

```bash
npm run build
npm run preview
```

The production-ready files are generated in the `dist` folder.

## Controls
- Drag: rotate the camera around the Solar System.
- Scroll / pinch: zoom.
- Click a planet or use the planet strip: select and inspect it.
- Pause button: pause or resume orbital motion.
- Speed buttons: change simulation speed.
- Orbital paths / Planet labels: show or hide them.
- Reset view: return to the overview camera.

## Simulation model
- The eight planets and Pluto use their approximate orbital periods in Earth days.
- At 1×, one simulated Earth year takes 12 real seconds.
- The speed multipliers accelerate all bodies together, preserving their relative orbital-period ratios.
- Orbital eccentricity, inclination, and node are approximated for visual demonstration.
- Distances are compressed non-linearly and planet sizes are enlarged for visibility. This is not a scale model.
- Planet surfaces are procedural visual approximations, not scientific surface maps.
- The Sun is the central light source; the background stars are decorative and are not positioned as a scientific star catalogue.

## Project structure

```text
solaris-3d/
├── index.html
├── package.json
├── README.md
└── src/
    ├── main.js
    └── style.css
```

## Troubleshooting
- If `npm` is not recognised, install Node.js LTS, close and reopen VS Code, then try again.
- If the browser shows a blank page, check the VS Code terminal and browser developer console for errors.
- An internet connection is required for the Google Fonts import. The simulation itself does not need external image assets.
