# 项目总览

教育游戏和互动学习工具开发项目，包含：

- **儿童英语闯关游戏**（卡通风格）— Phaser 3 横版平台，新外研版四下教材
- **雅思备考训练工具**（简洁高效）— 待开发
- **Markdown 写作互动教学** — 待开发

# 安全规则

- 禁止 `pkill`、`killall`、`kill -9` 杀系统进程
- 禁止操作系统 Google Chrome，只用 Playwright 内置 Chromium
- 遇到端口冲突换端口，不要杀进程

# 开发规则

- 一次只做一件事，完成了再做下一件
- 完成后列举具体例子让我验收
- 同一个 bug 修复超过 3 次必须停下来，换思路先诊断根因
- 每次修改后自动 `git commit`，用中文写明改动内容

# 内容规则

- 题目内容必须来自原始文件（教材 PDF、课文文本），禁止自己编造
- 新内容先更新数据文件（`units.js` / JSON），再更新游戏逻辑

# 风格规则

- 儿童游戏：卡通可爱，色彩鲜艳，像素风
- 雅思工具：简洁专业，信息密度高
- MD 教学：互动性强，步骤清晰

# 子项目

## 英语大冒险 (`/Users/ly/cc-test`)

Mario 风格 2D 平台英语学习游戏。Phaser 3.60，纯静态 HTML+JS。

- **入口**：`index.html`（开发）/ `game-bundle.html`（单文件分发）
- **构建**：`python3 build_bundle.py`
- **测试**：Playwright 内置 Chromium，测试脚本 `test_*.js` 已 gitignore
- **仓库**：https://github.com/ying033225-star/english-learning-game

### 架构

```
js/
  boot.js              — Phaser.Game 配置
  data/units.js        — 6 单元词汇/句型/语法/语音
  data/levels.js       — 24 关布局
  scenes/              — 6 个场景（Boot/Menu/WorldSelect/Game/QuestionUI/Result）
  entities/            — Player, QuestionBlock, Coin, Enemy(4种), Boss
  systems/             — QuizManager(7种题型), AudioManager(TTS+跟读), ProgressManager
```

### 7 种题型轮换

| 关卡类型 | 轮换顺序 |
|---|---|
| 单词收集 | vocab → listening → spelling → cloze → phonics |
| 句型跳跃 | sentence → cloze → vocab |
| 语法选择 | grammar → cloze → vocab |
| Boss 综合 | vocab + 30% 错题回顾 |

### 关键坑位

- Enemy 移动在 `GameScene.update()` 直接巡线，不依赖 Enemy 类自身逻辑
- Boss 碰撞用隐藏 `_bodySprite` zone 绕过 Phaser Container 碰撞 bug
- 所有纹理在 `BootScene.js` 用 Graphics 代码生成，无外部图片
- 版本号升级需同步：`index.html` badge、所有 `?v=` cache buster、`build_bundle.py` 内 `VERSION`
