# 英语大冒险 - English Adventure

Mario-style 2D platformer English learning game for 4th grade students (新外研版四年级下册). Built with Phaser 3.60, pure static HTML+JS — zero dependencies beyond the Phaser CDN script.

## Quick start

- **Play**: Open `index.html` in a browser (double-click)
- **Build bundle**: `python3 build_bundle.py` → regenerates `game-bundle.html`
- **Test**: `npx playwright` available for browser automation; test scripts are ephemeral (gitignored via `test_*.js`)

## Architecture

Phaser 3 Arcade physics game. All source in `js/`. The bundle inlines every JS file into a single `<script>` tag inside `game-bundle.html` so it's fully portable.

```
js/
  boot.js                   — Phaser.Game config, scene registry
  data/units.js             — All 6 units' vocabulary/sentences/grammar/phonics
  data/levels.js            — 24 level layouts (4 per unit × 6 units)
  scenes/
    BootScene.js            — Procedural texture generation (no external images)
    MenuScene.js            — Title screen
    WorldSelectScene.js     — World map with locked/unlocked levels
    GameScene.js            — Core platformer gameplay, question triggering, enemy patrol
    QuestionUI.js           — Modal question UI (all 7 question types)
    ResultScene.js          — Level complete / score screen
  entities/
    Player.js               — Girl character: run, jump, hit blocks
    QuestionBlock.js        — "?" block that triggers questions on hit
    Coin.js                 — Correct answer reward
    Enemy.js                — 4 enemy types: ground, flying, shooter, speedy
    Boss.js                 — Boss enemy with physics-body workaround
  systems/
    QuizManager.js          — Question generation (7 types), wrong-answer tracking
    AudioManager.js         — Web Speech TTS + speech recognition for follow-along reading
    ProgressManager.js      — localStorage-based progress persistence
```

## Level types & question rotation

| Level type | Questions rotate through |
|---|---|
| `vocabulary` (单词收集) | vocab → listening → spelling → cloze → phonics (5轮) |
| `sentence` (句型跳跃) | sentence → cloze → vocab (3轮) |
| `grammar` (语法选择) | grammar → cloze → vocab (3轮) |
| `boss` (综合测验) | primarily vocab, 30% review from wrong answers |

The 7 question types: `vocabulary`, `listening`, `sentence`, `grammar`, `phonics`, `spelling`, `cloze`.

## Key implementation notes

- **Enemy movement**: Patrol logic is in `GameScene.update()`, not in the Enemy class. Uses `this.enemies.create(x, y, 'enemy')` (not `add()`) so velocity isn't zeroed by `body.reset()`.
- **Boss physics**: Phaser Container physics has a known bug with colliders. Boss uses a hidden `_bodySprite` zone as the collision target; the visual Container syncs via tween `onUpdate`.
- **Textures**: All sprites are procedurally generated in `BootScene.js` using Phaser Graphics — no external image files.
- **Version bump ritual**: Update version badge in `index.html`, bump all `?v=` cache busters, and update `VERSION` in `build_bundle.py`, then rebuild.

## Content sources

Game content is derived from 4 reference PDFs (gitignored):
1. 新外研四下单词表带音标.pdf — vocabulary with phonetics
2. 新外研四下-单元重点知识总结.pdf — grammar, phrases, phonics patterns
3. 新外研四下英语课堂笔记.pdf — image-only, no extractable text
4. 新外研英语四下课文逐句翻译.pdf — textbook sentences with translations

Extracted `.txt` files are in the repo root. The enriched `units.js` contains 25–33 vocab per unit, 14–17 phrases, 15–17 sentences, 8 grammar quiz options, and 6–10 phonics words.

## Repo

https://github.com/ying033225-star/english-learning-game
