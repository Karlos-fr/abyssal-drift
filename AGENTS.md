# AGENTS.md — Abyssal Drift

## Project goal

Build a small, polished 2D side-view submarine exploration game in TypeScript and Phaser. Retro readability comes from low-resolution shapes and pixel-oriented art; modern polish comes from transparency, lighting, particles, sonar, water distortion and responsive audio.

## Working rules

- Work directly on the existing branch unless the user explicitly asks for a branch.
- Keep the logical game resolution at **480 × 270** unless a deliberate design change is documented.
- Keep gameplay logic separate from presentation/effects.
- Prefer small, composable systems over large scene classes.
- Do not add major content systems before the first movement/game-feel milestone is validated.
- Avoid premature shaders. Implement a simple readable version first, then enhance it.
- Every advanced visual effect must be designed so it can later be disabled for performance/accessibility.
- Use strict TypeScript. Avoid any.
- Keep files focused and reasonably small.
- Add comments for non-obvious design intent, not line-by-line narration.
- Do not commit generated dist/ or node_modules/ directories.
- When a ROADMAP.md task becomes genuinely complete, check it off in the same commit (or the immediately following documentation commit). Never mark aspirational or partially implemented work as complete.

## Validation before marking a roadmap task complete

1. The feature is integrated, not just stubbed.
2. Type checking passes.
3. Production build passes.
4. No known console errors are introduced.
5. Existing controls still work.
6. The result has been manually smoke-tested where the environment allows it.

## Architectural direction

SubmarinePhysics -> Submarine -> SubmarineEffects

Physics owns movement state. The game object owns composition and position. Effects react to state but do not decide gameplay outcomes.
