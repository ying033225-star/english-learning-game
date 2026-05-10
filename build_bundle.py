#!/usr/bin/env python3
"""Build game-bundle.html from source files"""
import os

os.chdir("/Users/ly/cc-test")

VERSION = "v17"

# JS files in dependency order
js_files = [
    "js/systems/AudioManager.js",
    "js/systems/ProgressManager.js",
    "js/systems/QuizManager.js",
    "js/entities/Player.js",
    "js/entities/QuestionBlock.js",
    "js/entities/Coin.js",
    "js/entities/Enemy.js",
    "js/entities/Boss.js",
    "js/scenes/BootScene.js",
    "js/scenes/MenuScene.js",
    "js/scenes/WorldSelectScene.js",
    "js/scenes/GameScene.js",
    "js/scenes/QuestionUI.js",
    "js/scenes/ResultScene.js",
    "js/data/units.js",
    "js/data/levels.js",
    "js/boot.js",
]

# Collect all JS
all_js = []
for f in js_files:
    if os.path.exists(f):
        with open(f, "r", encoding="utf-8") as fh:
            content = fh.read()
            all_js.append(f"// --- {f} ---\n{content}")
    else:
        print(f"WARNING: {f} not found!")

combined_js = "\n\n".join(all_js)

html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">
    <title>英语大冒险 - English Adventure</title>
    <style>
*{{margin:0;padding:0;box-sizing:border-box}}html,body{{width:100%;height:100%;overflow:hidden;background:#1a1a2e}}#game-container{{width:100%;height:100%;display:flex;justify-content:center;align-items:center}}#game-container canvas{{image-rendering:pixelated;image-rendering:crisp-edges}}
    </style>
</head>
<body>
    <div id="game-container"></div>
    <div id="version-badge" style="position:fixed;top:0;left:0;background:#0f0;color:#000;padding:2px 8px;font:12px Arial;z-index:9999;">{VERSION}</div>
    <script src="https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js"></script>
    <script>
{combined_js}
    </script>
</body>
</html>'''

with open("game-bundle.html", "w", encoding="utf-8") as out:
    out.write(html)

size_kb = os.path.getsize("game-bundle.html") / 1024
print(f"Built game-bundle.html ({VERSION}) — {size_kb:.0f} KB")
