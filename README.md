# Abyssal Drift

A polished 2D submarine exploration game built with TypeScript and Phaser, blending retro pixel art with modern underwater effects, lighting, particles, sonar, and juicy game feel.

## Status

Early playable prototype. The current milestone focuses on making basic submarine movement feel good before adding content-heavy systems.

See [ROADMAP.md](./ROADMAP.md) for the implementation plan.

## Stack

- TypeScript
- Phaser 4
- Vite
- ESLint
- Prettier

## Run locally

    npm install
    npm run dev

Production checks:

    npm run typecheck
    npm run lint
    npm run format:check
    npm run build

## Current controls

- Arrow keys: move
- AZERTY: ZQSD
- QWERTY: WASD

## Current prototype

The repository already contains:

- responsive 480×270 Phaser setup;
- Boot → Menu → Ocean scene flow;
- procedural placeholder ocean;
- procedural placeholder submarine;
- custom inertial movement and light buoyancy;
- soft camera follow;
- FPS debug overlay.

Final art, sonar, bubbles and cave collisions intentionally come after the movement baseline.
