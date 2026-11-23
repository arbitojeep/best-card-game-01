# Ember Duel

[![make.fun](https://make.fun/badge/bounty.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![node](https://img.shields.io/badge/node-22-green.svg)](https://nodejs.org)

A turn-based card duel against Ash, the Ember Wisp — an original game built
for the [make.fun best card game bounty](https://make.fun/bounty/best-card-game-20261122-1826).

## How to play

You and Ash each have 20 life. Spend ember to play cards from your hand,
then end your turn and watch Ash answer.

- **Strike** (red) — deal damage.
- **Guard** (blue) — gain shield that absorbs damage.
- **Mend** (green) — heal life.
- **Kindle** (purple) — draw cards.

Ember grows by 1 each turn, up to 6. First side to zero life loses.

Mouse: click a card to play it, click END TURN. Keyboard: `1-4` play a
card, `Enter` ends your turn, `R` restarts.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network requests, no libraries — plain static files
under `game/`. `main.ts` (Node 22) hands the entry in: it copies `game/`
and `screenshots/` to `/output` and writes `/output/dossier.json`.

## Layout

- `main.ts` — the entry program: copies the game and writes the dossier.
- `game/index.html` — the page; `game/src/main.js` — rules, turns and input.
- `game/src/deck.js` — the cards; `game/src/ai.js` — Ash's brain.
- `game/src/render.js` — all canvas drawing; `game/src/random.js` — seeded RNG.
- `screenshots/` — real renders of the game (title, play, win, loss).
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.
