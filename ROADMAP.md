# Abyssal Drift — Implementation Roadmap

## Vision

Build a small side-view 2D submarine exploration game in TypeScript + Phaser. The visual identity combines intentionally retro low-resolution art with modern transparency, lighting, particles, sonar, water effects and highly responsive "juicy" feedback.

The first goal is not content volume. It is a 30–60 second prototype in which simply piloting the submarine already feels good.

---

# Phase 0 — Technical foundation

## Goal
Create a reliable, lightweight development base.

## Tasks
- [x] Choose project name: Abyssal Drift.
- [x] Create GitHub repository.
- [x] Initialize TypeScript project.
- [x] Add Phaser.
- [x] Add Vite.
- [x] Add ESLint.
- [x] Add Prettier.
- [x] Add .gitignore.
- [x] Expand README.
- [x] Add AGENTS.md.
- [x] Set logical resolution to 480 × 270.
- [x] Add responsive upscale.
- [x] Use Phaser WebGL/automatic renderer with browser fallback.
- [ ] Verify desktop.
- [ ] Verify mobile.
- [x] Display a first test scene.

## Done when
npm install + npm run dev launches a 480 × 270 Phaser scene that scales cleanly.

---

# Phase 1 — Minimal architecture

## Goal
Keep gameplay logic, presentation and effects separated from the beginning.

## Target structure

- src/main.ts
- src/game/Game.ts
- src/game/core/
- src/game/scenes/BootScene.ts
- src/game/scenes/MenuScene.ts
- src/game/scenes/OceanScene.ts
- src/game/input/
- src/game/submarine/Submarine.ts
- src/game/submarine/SubmarinePhysics.ts
- src/game/submarine/SubmarineEffects.ts
- src/game/ocean/
- src/game/sonar/
- src/game/effects/
- src/game/audio/
- src/game/ui/
- src/assets/

## Tasks
- [x] Create Game.ts.
- [x] Create BootScene.
- [x] Create MenuScene.
- [x] Create OceanScene.
- [ ] Add a simple asset strategy.
- [x] Add keyboard input abstraction.
- [ ] Reserve a clean path for touch input.
- [ ] Add a common update-system interface.
- [ ] Add debug mode.
- [x] Add FPS display.
- [ ] Prepare hitbox debug display.

## Done when
The game transitions Boot → Menu → Ocean without gameplay dependencies.

---

# Phase 2 — Submarine movement prototype

## Goal
Make movement pleasant before building the game around it.

## Initial controls
- Left/right: propulsion.
- Up/down: ascend/descend.
- Space: sonar later.

## Physics tasks
- [x] Create Submarine.
- [x] Create SubmarinePhysics.
- [x] Horizontal velocity.
- [x] Progressive acceleration.
- [x] Progressive deceleration.
- [x] Inertia.
- [x] Maximum speed.
- [x] Vertical velocity.
- [x] Light buoyancy.
- [x] Water drag.
- [ ] Smooth acceleration limits.
- [x] Pitch following vertical movement.
- [ ] Small response lag / smoothing.
- [x] Keep the submarine inside the playable area.

## Input tasks
- [x] Arrow keys.
- [x] AZERTY ZQSD.
- [x] QWERTY WASD.
- [ ] Gamepad.
- [ ] Touch-control abstraction.
- [ ] Remapping later if useful.

## Done when
Moving the submarine with no real content is already pleasant for at least 30 seconds.

---

# Phase 3 — Test cave and camera

## Goal
Create a compact playground for the core mechanics.

## Tasks
- [x] Build a simple cave.
- [x] Ceiling, floor and walls.
- [x] Environment collisions.
- [x] Narrow passages.
- [x] One open chamber.
- [x] Obstacles.
- [x] Shallow and deep zones.
- [x] Camera bounds.
- [x] Smooth camera follow.
- [x] Look-ahead in movement direction.

## Done when
The player can explore the test space for roughly 1–2 minutes.

---

# Phase 4 — Bubble system

## Goal
Make bubbles one of the game's visual signatures.

## Tasks
- [x] Create BubbleSystem.
- [x] Multiple bubble sizes.
- [x] Emit behind the propeller.
- [x] Emission depends on speed.
- [x] Random spawn offsets.
- [x] Individual rise speeds.
- [x] Horizontal drift.
- [x] Slight growth while rising.
- [x] Variable transparency.
- [x] Subtle deformation.
- [x] Cleanup outside active area.
- [x] Object pooling.
- [ ] Large impact bubbles.
- [ ] Ambient bubbles from scenery.
- [ ] Surface pop when relevant.
- [x] Configurable particle cap.

## Done when
Bubbles strongly reinforce motion and depth without harming frame rate.

---

# Phase 5 — Underwater atmosphere

## Background
- [x] Vertical water gradient.
- [ ] Multiple scenery layers.
- [ ] Slow parallax.
- [ ] Rock silhouettes.
- [ ] Vegetation.
- [ ] Floating debris.

## Particles
- [x] Create ParticleField.
- [x] Suspended underwater dust.
- [x] Several depth layers.
- [x] Different layer speeds.
- [x] Slight response to submarine movement.

## Surface light
- [ ] Stylized light rays.
- [ ] Slow intensity variation.
- [ ] Depth haze.
- [ ] Progressive loss of color with depth.

## Done when
A still screenshot already reads as retro-modern underwater exploration.

---

# Phase 6 — Submarine headlight

- [x] Front light.
- [x] Semi-transparent cone.
- [ ] Slight delayed follow.
- [x] Tiny beam movement.
- [ ] Depth-dependent intensity.
- [x] Lamp halo.
- [x] Very subtle flicker.
- [x] Additive blend test.
- [ ] Darkness mask / RenderTexture test.
- [ ] Simple scenery occlusion if worthwhile.
- [ ] Particles visible inside the beam.

---

# Phase 7 — Sonar

## Goal
Create a simple mechanic with strong audiovisual identity.

- [x] Create SonarSystem.
- [x] Cooldown.
- [x] Expanding pulse.
- [x] Alpha fade.
- [ ] Sonar audio.
- [x] Small submarine flash.
- [x] Temporary object reveal.
- [x] Highlight scenery or interesting objects.
- [x] Detection feedback.
- [x] Tiny camera response.
- [x] Implement without shaders first.
- [ ] Consider shader enhancement later.

---

# Phase 8 — Movement juiciness

## Propulsion
- [x] Animate propeller.
- [x] Propeller speed follows thrust.
- [ ] Tiny visual recoil.
- [x] Engine vibration.
- [ ] Very light camera feedback.
- [ ] Engine sound responds to speed.
- [x] More bubbles at high thrust.
- [ ] Push suspended particles behind the propeller.

## Direction change
- [ ] Pitch/roll-like visual response.
- [ ] Small overshoot.
- [ ] Smooth return.
- [x] Bubble response.

## Vertical movement
- [x] Adjust submarine attitude.
- [x] Adjust bubble behaviour.
- [x] Preserve readable vertical inertia.

---

# Phase 9 — Collisions and impacts

- [ ] Measure impact strength.
- [ ] Scale reaction by speed.
- [x] Small rebound.
- [ ] Screen shake.
- [ ] Very short flash.
- [ ] Metallic sound.
- [ ] Bubble burst.
- [ ] Small debris.
- [ ] Optional sparks.
- [ ] Submarine impact animation.
- [ ] Temporary headlight disturbance.
- [ ] HUD reaction.

---

# Phase 10 — Depth as a mechanic

Create a normalized depth value from 0.0 near the surface to 1.0 at maximum depth.

## Visual
- [ ] Darken environment with depth.
- [ ] Remove warm colors progressively.
- [ ] Increase haze.
- [ ] Reduce visibility.
- [ ] Increase importance of the headlight.
- [ ] Change particle density.

## Audio
- [ ] Filter ambience.
- [ ] Add hull creaks.
- [ ] Alter engine texture.
- [ ] Add deep rumble.
- [ ] Alter sonar character.

## Gameplay
- [ ] Safe depth.
- [ ] Warning zone.
- [ ] Pressure danger later.
- [ ] Hull upgrades only if the larger game needs them.

## Done when
The player can feel a large depth change without reading the HUD.

---

# Phase 11 — Marine life

- [ ] Small fish.
- [ ] Simple schooling.
- [ ] Fish flee the submarine.
- [ ] Fish react to light.
- [ ] Fish react to sonar.
- [ ] Jellyfish.
- [ ] Small bioluminescent creatures.
- [ ] Distant silhouettes.
- [ ] Rare decorative creatures.

Fauna primarily supports atmosphere; do not build a complex ecosystem early.

---

# Phase 12 — Audio

## Ambience
- [ ] Continuous underwater bed.
- [ ] Low rumble.
- [ ] Water texture.
- [ ] Small hull/environment creaks.
- [ ] Distant sounds.

## Submarine
- [ ] Engine.
- [ ] Propeller.
- [ ] Pitch/intensity follows speed.
- [ ] Ballast sound.
- [ ] Impacts.
- [ ] Hull stress.

## Sonar
- [ ] Ping.
- [ ] Echo.
- [ ] Special detection response.

## Mix
- [ ] Music bus.
- [ ] Ambience bus.
- [ ] Effects bus.
- [ ] UI bus.
- [ ] Master volume.

---

# Phase 13 — Final art direction

## Submarine
- [ ] Main sprite.
- [ ] Propeller.
- [ ] Windows.
- [ ] Lights.
- [ ] Shadows.
- [ ] Optional damage states.
- [ ] Pilot animation only if visible and useful.

## Environment
- [ ] Rocks.
- [ ] Seabed.
- [ ] Plants.
- [ ] Wrecks.
- [ ] Structures.
- [ ] Interactive props.

## Palette
- [ ] Surface palette.
- [ ] Deep-water palette.
- [ ] Sonar color.
- [ ] Hazard color.
- [ ] Interactive-object color.

Retro sprites remain crisp and deliberately low-resolution. Modern effects may use transparency, interpolation, particles, additive blending, masks, filters and distortion.

---

# Phase 14 — Water polish / post-processing

Only start once gameplay feels good.

- [ ] Subtle global water distortion.
- [ ] Gentle sinusoidal motion.
- [ ] Local distortion around large bubbles if useful.
- [ ] Simple caustics.
- [ ] Light bloom.
- [ ] Extremely subtle impact chromatic aberration if it improves the look.
- [ ] Depth vignette.
- [ ] Discreet grain.
- [ ] Depth-dependent contrast.

Every advanced effect must be individually disableable.

---

# Phase 15 — Minimal HUD

Possible information:
- depth;
- hull integrity;
- sonar;
- energy;
- optional speed.

Tasks:
- [ ] HUD.
- [ ] Readable retro typography.
- [ ] Depth indicator.
- [ ] Sonar status.
- [ ] Hull integrity if used.
- [ ] Small HUD animation.
- [ ] Impact reaction.
- [ ] Reduced-HUD mode.
- [ ] Mobile readability.

---

# Phase 16 — Gameplay loop

Target loop:

Explore → sonar → discover → reach → avoid/solve → collect/activate → go deeper.

- [ ] Points of interest.
- [ ] Collectables.
- [ ] Simple locked passages.
- [ ] Environmental hazards.
- [ ] Optional mines.
- [ ] Currents.
- [ ] Dark zones.
- [ ] Objectives.
- [ ] Level exit.

---

# Phase 17 — Vertical slice

Target duration: 5–10 minutes.

The slice should contain:
- [ ] shallow start;
- [ ] descent;
- [ ] dark cave;
- [ ] sonar-dependent passage;
- [ ] marine life;
- [ ] wreck;
- [ ] hazard;
- [ ] recoverable/interactive object;
- [ ] deep zone;
- [ ] ending/return route.

## Done when
The slice is representative enough to decide whether the concept should become a complete game.

---

# Phase 18 — Optimization

- [ ] CPU profiling.
- [ ] GPU profiling.
- [ ] Sprite counts.
- [ ] Particle counts.
- [ ] RenderTexture cost.
- [ ] Filter/shader cost.
- [ ] Per-frame allocation checks.
- [ ] Object pooling.
- [ ] Desktop tests.
- [ ] Mobile tests.
- [ ] Chromium.
- [ ] Firefox.
- [ ] Safari.
- [ ] iPhone.
- [ ] Android.

Targets:
- Desktop: stable 60 FPS.
- Recent mobile: 60 FPS target.
- Older mobile: minimum 30 FPS with reduced effects.

---

# Phase 19 — Accessibility and options

- [ ] Music volume.
- [ ] Effects volume.
- [ ] Ambience volume.
- [ ] Screen-shake intensity.
- [ ] Disable flashes.
- [ ] Disable distortion.
- [ ] Reduce particles.
- [ ] Low-performance mode.
- [ ] HUD size.
- [ ] Rebind controls.
- [ ] Gamepad.
- [ ] Touch.

---

# Phase 20 — Additional content

Only after the vertical slice is validated.

Possible environments:
- caves;
- underwater canyon;
- wreck;
- flooded industrial complex;
- abyssal trench;
- sunken city.

Possible mechanics:
- torpedoes;
- mechanical arm;
- grappling device;
- mines;
- currents;
- hostile creatures;
- electrical systems;
- toxic areas;
- submarine upgrades.

---

# Phase 21 — Final polish

- [ ] Review every player action.
- [ ] Fill missing feedback.
- [ ] Review scene transitions.
- [ ] Review menus.
- [ ] Review loading.
- [ ] Add small UI animations.
- [ ] Smooth audio transitions.
- [ ] Normalize camera shake.
- [ ] Normalize effect intensity.
- [ ] Verify dark-area readability.
- [ ] Remove distracting effects.
- [ ] Fix sprite clipping.
- [ ] Fix rendering/filter artifacts.
- [ ] Fix collision edge cases.
- [ ] Verify different refresh rates.

---

# Recommended implementation order

1. Movement
2. Camera
3. Collision
4. Bubbles
5. Particles
6. Headlight
7. Sonar
8. Juiciness
9. Depth
10. Audio
11. Marine life
12. Final art
13. Gameplay loop
14. Vertical slice
15. Post-processing
16. Additional content

Do not prioritize advanced shaders over movement and readability.

---

# First milestone — "The submarine is already fun"

## Must contain
- [x] underwater scene;
- [x] controllable submarine;
- [x] inertia;
- [x] buoyancy;
- [x] camera;
- [x] simple cave;
- [x] collisions;
- [x] animated propeller;
- [x] bubbles;
- [x] suspended particles;
- [x] headlight;
- [x] sonar;
- [ ] screen shake;
- [ ] engine audio;
- [ ] sonar audio;
- [ ] wall-impact feedback.

## Explicitly excluded
- enemies;
- inventory;
- progression system;
- save system;
- story;
- multiple levels;
- bosses;
- complex damage model;
- crafting;
- upgrade tree.

## Validation question

Is piloting the submarine around one small cave for 30–60 seconds already enjoyable?

If not, do not add content. Improve inertia, controls, camera, sound, bubbles, lighting and feedback first.

---

# Definition of done for a task

A task is only complete when:
1. it works;
2. it is integrated;
3. it does not break existing features;
4. npm run dev works;
5. the production build passes;
6. there are no known console errors;
7. the implementation remains readable and maintainable;
8. it has been manually smoke-tested when the environment allows it.

---

# Development principles

## Keep scope small
Before the vertical slice, avoid multiplying levels, enemies, weapons, systems and collectables.

## Separate logic and effects
SubmarinePhysics owns movement. Submarine owns the game object. SubmarineEffects reacts visually to movement state.

## Prefer several subtle effects to one giant effect
Acceleration can affect engine audio, propeller speed, visual recoil, bubbles, particles, vibration and attitude at the same time. Each individual effect should stay subtle.

## Keep advanced effects optional
Water distortion, bloom, particles, light rays, post-processing and screen shake should be configurable so performance and accessibility can be tuned later.
