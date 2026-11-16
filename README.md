# Don't Wake My Friend

A top-down browser stealth game about getting things done while your friend sleeps. Grab a glass of water, find your keys, or silence a ringing phone before the wake meter reaches 100%.

## Run locally

Use Node.js 20.19+ on the 20.x line, or Node.js 22.12 or newer.

```sh
npm ci
npm run dev
```

Open the local URL Vite prints in the terminal.

## How to play

The first run starts with the glass of water. Restarting or playing again randomly picks from seven missions covering water, a charger, headphones, snacks, a phone alarm, keys, and the bedroom door.

Move close enough for the interaction prompt to appear, then interact to complete the objective. Every footstep makes noise. The wake meter rises faster on tile and closer to your friend. Sneak to make quieter steps, or stop moving to let the meter fall. The phone alarm keeps adding wake while it rings, and a tossed coin makes noise where it lands.

Choose Easy, Normal, or Hard using the difficulty selector. Successful runs earn a stealth score based on time, peak wake level, total noise, and distance from your friend at completion. Personal records are saved in the current browser.

| Action | Keyboard | Touch |
| --- | --- | --- |
| Move | W A S D or arrow keys | Directional pad |
| Sneak | Hold Shift while moving | Hold **Hold to sneak** while moving |
| Interact | E | **Interact** |
| Toss a coin | F | **Toss coin** |
| Pause or resume | Esc | **Pause** or **Resume** |

## Development

The game uses React, TypeScript, and Vite, with an HTML canvas for the playfield, Zustand for shared state, and Web Audio for sound effects.

| Command | Purpose |
| --- | --- |
| `npm run lint` | Run Oxlint |
| `npm run build` | Type-check and build the game into `dist/` |
| `npm run preview` | Serve the production build locally after building |

Room layouts and missions are in [`src/data`](src/data). The game loop, audio, and rendering are in [`src/game`](src/game). The HUD, dialogs, and touch controls are in [`src/components`](src/components).
