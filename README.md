# Abyssal Drift

A polished 2D submarine exploration game built with TypeScript and Phaser, blending crisp retro visuals with modern underwater lighting, particles, sonar and juicy game feel.

## Status

Playable prototype under active visual and gameplay refinement.

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
    npm run build

## Current controls

- Arrow keys: move
- AZERTY: ZQSD
- QWERTY: WASD
- Space: sonar
- Touch: analog joystick + SONAR button

## Current prototype

The repository includes:

- responsive 640×360 Phaser setup;
- crisp pixel-oriented rendering without CSS canvas stretching;
- Boot → Menu → Ocean scene flow;
- inertial submarine movement and buoyancy;
- dynamic occluded headlight;
- sonar, bubbles, particles and marine life;
- depth/pressure feedback and procedural audio;
- iPhone landscape touch controls.

## Play

The latest build is deployed automatically to GitHub Pages:

https://karlos-fr.github.io/abyssal-drift/

Landscape orientation is recommended on iPhone.
