class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        this.worldNum = data.world || 1;
        this.levelNum = data.level || 1;
        this.levelType = data.type || 'vocabulary';
        this.totalCoins = 0;
        this.collectedCoins = 0;
        this.questionsAnswered = 0;
        this.correctAnswers = 0;
        this._flagTriggered = false;
        this._levelComplete = false;
        this.flagReached = false;
    }

    create() {
        try {
            this._doCreate();
        } catch (e) {
            console.error('GameScene create error:', e);
            // Show error text on screen
            this.add.text(400, 240, '加载失败: ' + e.message, {
                fontSize: '16px', fontFamily: 'Arial', color: '#ff0000',
                wordWrap: { width: 700 }, align: 'center'
            }).setOrigin(0.5);
        }
    }

    _doCreate() {
        const { width, height } = this.cameras.main;

        // Dynamic world background color
        const worldColors = [
            0x87ceeb, 0xffdab9, 0xdda0dd, 0x90ee90, 0xfffacd, 0xffb6c1
        ];
        this.cameras.main.setBackgroundColor(worldColors[this.worldNum - 1] || 0x87ceeb);

        // Init audio (safe)
        try { if (!audioManager) audioManager = new AudioManager(); } catch (e) {}

        // Init quiz system
        const unitData = UNITS[this.worldNum] || UNITS[1];
        this.quizManager = new QuizManager(unitData);
        this.questionUI = new QuestionUI(this);

        // Build level
        this.buildLevel();

        // Spawn player
        this.player = new Player(this, 80, 300);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setBounds(0, 0, this.levelWidth, height);
        this.physics.world.setBounds(0, 0, this.levelWidth, height);

        // Setup collisions
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.player, this.groundGroup);

        if (this.questionBlocks) {
            this.physics.add.collider(this.player, this.questionBlocks, this.hitQuestionBlock, null, this);
        }

        if (this.coins) {
            this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
        }

        if (this.enemies) {
            this.physics.add.collider(this.player, this.enemies, this.touchEnemy, null, this);
            this.physics.add.collider(this.enemies, this.groundGroup);
            this.physics.add.collider(this.enemies, this.platforms);
        }

        // Enemy projectile group
        this._enemyProjectiles = this.physics.add.group();
        this.physics.add.overlap(this.player, this._enemyProjectiles, this.hitByProjectile, null, this);

        // Player growth tracking
        this._consecutiveCorrect = 0;
        this._playerGrown = false;

        // Flag trigger physics overlap (in addition to x-position check)
        if (this.flagTrigger) {
            this.physics.add.overlap(this.player, this.flagTrigger, () => {
                if (!this._flagTriggered) {
                    this._flagTriggered = true;
                    console.log('Flag overlap detected!');
                    this.flagReached = true;
                    this.reachFlag();
                }
            }, null, this);
        }

        // HUD
        this.createHUD();

        // Manual flag trigger key (press 'F' in game to test level completion)
        this.fKey = this.input.keyboard.addKey('F');
        this.fKey.on('down', () => {
            if (!this.flagReached) {
                console.log('Manual flag trigger via F key!');
                this.flagReached = true;
                this.reachFlag();
            }
        });

        // Fade in
        this.cameras.main.fadeIn(500, 255, 255, 255);
    }

    buildLevel() {
        const { height } = this.cameras.main;

        this.levelWidth = 3200;

        // Ground
        this.groundGroup = this.physics.add.staticGroup();
        const groundTiles = Math.ceil(this.levelWidth / TILE_SIZE);
        for (let i = 0; i < groundTiles; i++) {
            const tile = this.groundGroup.create(i * TILE_SIZE + 16, height - 16, 'ground');
            tile.setDisplaySize(TILE_SIZE, TILE_SIZE);
            tile.refreshBody();
        }

        // Physics groups
        this.platforms = this.physics.add.staticGroup();
        this.questionBlocks = this.physics.add.staticGroup();
        this.coins = this.physics.add.group();
        this.enemies = this.physics.add.group();

        // Different layouts per level type
        const layout = this.getLayoutConfig(height);
        this.buildPlatforms(layout);
        this.buildQuestionBlocks(layout);
        this.buildCoins(layout);
        this.buildEnemies(layout);

        // Flag at end - texture-based, non-overlapping with trigger
        this._flagX = this.levelWidth - 120;
        this._flagY = height - 85;

        this.flag = this.add.image(this._flagX, this._flagY, 'flag').setDepth(10);
        this.flagReached = false;
        this.tweens.add({
            targets: this.flag,
            y: this._flagY - 10,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Invisible flag trigger zone (uses sparkle texture, NOT flag texture)
        this.flagTrigger = this.physics.add.staticGroup();
        const trig = this.flagTrigger.create(this._flagX, this._flagY + 20, 'sparkle');
        trig.setAlpha(0).setScale(5);
        trig.body.setSize(60, 120);
        trig.setDepth(1);

        // Boss level: spawn boss near the flag
        if (this.levelType === 'boss') {
            this._boss = new Boss(this, this.levelWidth - 500, height - 130);
            this.physics.add.collider(this.player, this._boss._bodySprite);

            // Boss question blocks (3 floating around boss)
            this._bossBlocks = [];
            for (let i = 0; i < 3; i++) {
                const bx = this._boss.x - 60 + i * 60;
                const by = this._boss.y - 60;
                const block = this.questionBlocks.create(bx, by, 'question_block');
                block.setDisplaySize(TILE_SIZE, TILE_SIZE);
                block.refreshBody();
                block.isActive = true;
                block.isBossBlock = true;
                this._bossBlocks.push(block);
            }
        }

        this.addDecorations(height);
    }

    getLayoutConfig(height) {
        const baseX = 300;
        const gap = 180;
        const type = this.levelType;

        const configs = {
            // Level 1: Vocabulary - gentle intro, many question blocks
            vocabulary: {
                platforms: [
                    [350, 390, 3], [550, 340, 3], [740, 320, 3],
                    [940, 360, 4], [1160, 390, 3], [1380, 350, 4],
                    [1600, 380, 3], [1820, 340, 5], [2060, 380, 3], [2300, 390, 3],
                ],
                questionBlocks: [
                    [380, 330], [580, 280], [770, 260],
                    [970, 300], [1190, 330], [1410, 290],
                    [1630, 320], [1850, 280], [2090, 320], [2330, 330],
                ],
                coins: { count: 10, startX: 450, spacing: 220, ys: [430, 400, 370, 340, 310] },
                enemies: [{ x: 500, type: 'ground' }, { x: 1100, type: 'ground' }, { x: 1700, type: 'speedy' }, { x: 2300, type: 'ground' }],
            },
            // Level 2: Sentence - gentle intro, flying enemies
            sentence: {
                platforms: [
                    [300, 390, 3], [520, 350, 2], [700, 380, 3],
                    [920, 330, 2], [1100, 370, 4], [1340, 310, 3],
                    [1560, 360, 4], [1800, 320, 3], [2020, 380, 3], [2260, 350, 3],
                    [2500, 390, 3],
                ],
                questionBlocks: [
                    [330, 330], [550, 290], [730, 320],
                    [950, 270], [1130, 310], [1370, 250],
                    [1590, 300], [1830, 260], [2050, 320], [2290, 290],
                ],
                coins: { count: 8, startX: 400, spacing: 280, ys: [420, 380, 340, 300, 360] },
                enemies: [{ x: 700, type: 'flying' }, { x: 1500, type: 'ground' }],
            },
            // Level 3: Grammar - more challenging with shooters
            grammar: {
                platforms: [
                    [300, 390, 3], [500, 340, 2], [680, 380, 3],
                    [880, 310, 2], [1040, 360, 3], [1240, 300, 2],
                    [1420, 350, 4], [1660, 290, 2], [1840, 370, 3],
                    [2060, 320, 3], [2300, 380, 3],
                ],
                questionBlocks: [
                    [330, 330], [530, 280], [710, 320],
                    [910, 250], [1070, 300], [1270, 240],
                    [1450, 290], [1690, 230], [1870, 310], [2090, 260],
                ],
                coins: { count: 6, startX: 420, spacing: 350, ys: [400, 350, 310, 290] },
                enemies: [{ x: 550, type: 'speedy' }, { x: 1050, type: 'shooter' }, { x: 1550, type: 'flying' }, { x: 2100, type: 'ground' }],
            },
            // Level 4: Boss - intense, all enemy types
            boss: {
                platforms: [
                    [300, 380, 3], [500, 350, 3], [720, 320, 2],
                    [900, 370, 4], [1140, 340, 2], [1320, 310, 3],
                    [1540, 360, 4], [1780, 330, 3], [2020, 290, 2],
                    [2220, 350, 3], [2480, 380, 3],
                ],
                questionBlocks: [
                    [330, 320], [530, 290], [750, 260],
                    [930, 310], [1170, 280], [1350, 250],
                    [1570, 300], [1810, 270], [2050, 230], [2250, 290],
                ],
                coins: { count: 4, startX: 500, spacing: 600, ys: [370, 330, 300] },
                enemies: [
                    { x: 400, type: 'speedy' }, { x: 800, type: 'shooter' }, { x: 1200, type: 'flying' },
                    { x: 1600, type: 'shooter' }, { x: 2000, type: 'speedy' }, { x: 2400, type: 'ground' },
                ],
            },
        };

        return configs[type] || configs.vocabulary;
    }

    buildPlatforms(layout) {
        layout.platforms.forEach(([x, y, count]) => this.createPlatform(x, y, count));
    }

    buildQuestionBlocks(layout) {
        layout.questionBlocks.forEach(([x, y]) => this.createQuestionBlock(x, y));
    }

    buildCoins(layout) {
        const cfg = layout.coins;
        for (let i = 0; i < cfg.count; i++) {
            const cx = cfg.startX + i * cfg.spacing;
            const cy = cfg.ys[i % cfg.ys.length];
            const coin = this.coins.create(cx, cy, 'coin');
            coin.body.setAllowGravity(false);
            this.tweens.add({
                targets: coin,
                y: cy - 6,
                duration: 700,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            this.totalCoins++;
        }
    }

    buildEnemies(layout) {
        const h = this.cameras.main.height;
        layout.enemies.forEach(({ x, type }) => {
            const eType = type || 'ground';
            const y = eType === 'flying' ? h - 140 : h - 60;
            this.createEnemy(x, y, eType);
        });
    }

    createPlatform(x, y, tileCount) {
        for (let i = 0; i < tileCount; i++) {
            const tile = this.platforms.create(x + i * TILE_SIZE + 16, y, 'platform');
            tile.setDisplaySize(TILE_SIZE, 16);
            tile.refreshBody();
        }
    }

    createQuestionBlock(x, y) {
        const block = this.questionBlocks.create(x, y, 'question_block');
        block.setDisplaySize(TILE_SIZE, TILE_SIZE);
        block.refreshBody();
        block.isActive = true;
        return block;
    }

    createEnemy(x, y, type) {
        const enemyType = type || 'ground';
        // Create via group to ensure physics body is properly configured
        const enemy = this.enemies.create(x, y, 'enemy');
        enemy.body.setAllowGravity(enemyType !== 'flying');
        enemy.body.setBounce(0);
        enemy.enemyType = enemyType;
        enemy.startX = x;
        enemy.startY = y;
        enemy._shootTimer = 0;

        // Set visual and movement based on type
        switch (enemyType) {
            case 'flying':
                enemy.setTint(0xff6b6b);
                enemy.body.setAllowGravity(false);
                enemy.body.setVelocityY(50);
                enemy.patrolRange = 60;
                enemy._initVelY = 50;
                break;
            case 'shooter':
                enemy.setTint(0xff9800);
                enemy.body.setVelocityX(30);
                enemy.patrolRange = 60;
                enemy._shootTimer = Phaser.Math.Between(2000, 4000);
                break;
            case 'speedy':
                enemy.setTint(0x00bcd4);
                enemy.setScale(0.7);
                enemy.body.setVelocityX(80);
                enemy.patrolRange = 120;
                break;
            default:
                enemy.setTint(0x9932cc);
                enemy.body.setVelocityX(40);
                enemy.patrolRange = 80;
                break;
        }
        return enemy;
    }

    spawnPenaltyEnemy(x, y) {
        const enemy = this.createEnemy(x, y - 60);
        // Drop from above
        enemy.y = y - 100;
        enemy.body.setVelocityY(100);
    }

    addDecorations(height) {
        const type = this.levelType;

        // Different bush colors per level type
        const bushColors = {
            vocabulary: 0x228b22, sentence: 0x7ec850, grammar: 0x2e7d32, boss: 0x4a148c
        };
        const bushColor = bushColors[type] || 0x228b22;

        for (let i = 0; i < 20; i++) {
            const bx = 100 + i * 160;
            const bush = this.add.graphics();
            bush.fillStyle(bushColor, 0.6);
            bush.fillCircle(bx, height - 58, 8);
            bush.fillCircle(bx + 8, height - 56, 10);
            bush.fillCircle(bx - 6, height - 56, 7);
        }

        // Different background elements per level type
        if (type === 'sentence') {
            // Floating word bubbles in background
            for (let i = 0; i < 6; i++) {
                const fx = 150 + i * 500;
                const fy = 60 + (i % 3) * 50;
                const bubble = this.add.graphics();
                bubble.fillStyle(0xdda0dd, 0.25);
                bubble.fillRoundedRect(fx - 30, fy - 12, 60, 24, 12);
                bubble.setScrollFactor(0.2);
            }
        } else if (type === 'grammar') {
            // Question marks in background
            for (let i = 0; i < 5; i++) {
                const qx = 200 + i * 600;
                const qy = 50 + (i % 2) * 60;
                const qmark = this.add.text(qx, qy, '?', {
                    fontSize: '40px', fontFamily: 'Arial', fontStyle: 'bold',
                    color: '#ff69b4'
                }).setAlpha(0.15).setScrollFactor(0.2);
            }
        } else if (type === 'boss') {
            // Warning stripes at bottom
            for (let i = 0; i < 8; i++) {
                const sx = i * 400;
                const stripe = this.add.graphics();
                stripe.fillStyle(0xff0000, 0.15);
                stripe.fillRect(sx, height - 70, 200, 8);
                stripe.setScrollFactor(0.3);
            }
        }

        // Background clouds (vary count and position by type)
        const cloudCount = type === 'boss' ? 10 : type === 'grammar' ? 6 : 8;
        for (let i = 0; i < cloudCount; i++) {
            const cx = i * (3200 / cloudCount) + 100;
            const cy = 30 + (i % 3) * 40;
            const cloud = this.add.graphics();
            const alpha = type === 'boss' ? 0.3 : 0.5;
            cloud.fillStyle(0xffffff, alpha);
            cloud.fillCircle(cx, cy, 15);
            cloud.fillCircle(cx + 15, cy - 3, 20);
            cloud.fillCircle(cx + 30, cy, 15);
            cloud.setScrollFactor(type === 'boss' ? 0.5 : 0.3);
        }
    }

    createHUD() {
        const hudY = 16;

        // Coin counter
        this.coinIcon = this.add.image(30, hudY + 8, 'coin').setScrollFactor(0).setDepth(100);
        this.coinText = this.add.text(46, hudY, '0', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#333333',
            strokeThickness: 2
        }).setScrollFactor(0).setDepth(100);

        // Hearts
        this.hearts = [];
        for (let i = 0; i < 3; i++) {
            const heart = this.add.image(160 + i * 28, hudY + 8, 'heart').setScrollFactor(0).setDepth(100);
            this.hearts.push(heart);
        }

        // Level info with type name
        const typeNames = { vocabulary: '单词收集', sentence: '连词成句', grammar: '语法选择', boss: 'Boss挑战' };
        this.add.text(700, hudY, `世界${this.worldNum} - 第${this.levelNum}关`, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#333333',
            strokeThickness: 2
        }).setScrollFactor(0).setDepth(100);
        this.add.text(700, hudY + 18, typeNames[this.levelType] || '', {
            fontSize: '11px',
            fontFamily: 'Arial',
            color: '#ffd700',
            stroke: '#333333',
            strokeThickness: 1
        }).setScrollFactor(0).setDepth(100);
        // HIGHLY VISIBLE version marker
        const vbg = this.add.graphics().setScrollFactor(0).setDepth(200);
        vbg.fillStyle(0xff0000, 1);
        vbg.fillRect(0, 0, 40, 20);
        this.add.text(20, 10, 'v15', {
            fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

        // DEBUG: show player position
        this.debugText = this.add.text(300, 60, '', {
            fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold',
            color: '#ffff00', stroke: '#000000', strokeThickness: 3
        }).setScrollFactor(0).setDepth(200);
    }

    hitQuestionBlock(player, block) {
        if (!block.isActive) return;

        // Only trigger when player hits from below
        if (!player.body.touching.up) return;

        block.isActive = false;
        block.setTexture('question_block_hit');

        // Bounce animation
        this.tweens.add({
            targets: block,
            y: block.y - 8,
            duration: 80,
            yoyo: true,
            ease: 'Quad.easeOut'
        });

        // Generate question based on level type
        const typeMap = {
            vocabulary: 'vocabulary',
            listening: 'listening',
            sentence: 'sentence',
            grammar: 'grammar',
            boss: 'vocabulary'
        };
        const qType = typeMap[this.levelType] || 'vocabulary';

        let actualType = qType;
        const questionCount = this.questionsAnswered || 0;
        if (this.levelType === 'vocabulary') {
            const vocabMod = questionCount % 5;
            if (vocabMod === 0) actualType = 'vocabulary';
            else if (vocabMod === 1) actualType = 'listening';
            else if (vocabMod === 2) actualType = 'spelling';
            else if (vocabMod === 3) actualType = 'cloze';
            else actualType = 'phonics';
        } else if (this.levelType === 'grammar') {
            const gramMod = questionCount % 3;
            if (gramMod === 0) actualType = 'grammar';
            else if (gramMod === 1) actualType = 'cloze';
            else actualType = 'vocabulary';
        } else if (this.levelType === 'sentence') {
            const sentMod = questionCount % 3;
            if (sentMod === 0) actualType = 'sentence';
            else if (sentMod === 1) actualType = 'cloze';
            else actualType = 'vocabulary';
        }

        const isBossBlock = block.isBossBlock === true;
        const question = this.quizManager.generateQuestion(actualType);

        this.questionUI.show(question, (correct) => {
            this.questionsAnswered++;

            if (correct) {
                this.correctAnswers++;
                this.collectedCoins++;
                this._consecutiveCorrect++;
                // Grow player after 3 consecutive correct answers
                if (this._consecutiveCorrect >= 3 && !this._playerGrown) {
                    this.growPlayer();
                }
                this.coinText.setText(this.collectedCoins.toString());
                if (audioManager) audioManager.sfxCorrect();

                // Coin effect
                const coin = this.add.image(block.x, block.y - 20, 'coin');
                this.tweens.add({
                    targets: coin,
                    y: block.y - 70,
                    alpha: 0,
                    duration: 500,
                    ease: 'Quad.easeOut',
                    onComplete: () => coin.destroy()
                });

                const posText = this.add.text(block.x, block.y - 40, '+1 ⭐', {
                    fontSize: '16px',
                    fontFamily: 'Arial',
                    color: '#ffd700',
                    stroke: '#333',
                    strokeThickness: 2
                }).setOrigin(0.5);
                this.tweens.add({
                    targets: posText,
                    y: block.y - 70,
                    alpha: 0,
                    duration: 800,
                    onComplete: () => posText.destroy()
                });

                // Boss block: damage boss on correct answer
                if (isBossBlock && this._boss && !this._boss.defeated) {
                    this._boss.takeDamage();
                    if (this._boss.defeated) {
                        // Show message that flag is now accessible
                        const unlockText = this.add.text(this._boss.x, this._boss.y - 80, '旗帜已解锁! 冲向终点!', {
                            fontSize: '16px',
                            fontFamily: 'Arial',
                            fontStyle: 'bold',
                            color: '#ffd700',
                            stroke: '#333',
                            strokeThickness: 3
                        }).setOrigin(0.5);
                        this.tweens.add({
                            targets: unlockText,
                            y: unlockText.y - 30,
                            alpha: 0,
                            duration: 2000,
                            onComplete: () => unlockText.destroy()
                        });
                    }
                }
            } else {
                this._consecutiveCorrect = 0;
                if (audioManager) audioManager.sfxWrong();
                this.spawnPenaltyEnemy(block.x, block.y);
            }
        });
    }

    collectCoin(player, coin) {
        coin.destroy();
        this.collectedCoins++;
        this.coinText.setText(this.collectedCoins.toString());
        if (audioManager) audioManager.sfxCoin();

        // Sparkle effect
        const sparkle = this.add.image(coin.x, coin.y, 'sparkle');
        this.tweens.add({
            targets: sparkle,
            alpha: 0,
            scale: 1.5,
            duration: 300,
            onComplete: () => sparkle.destroy()
        });
    }

    hitByProjectile(player, proj) {
        proj.destroy();
        player.takeDamage();
        this.updateHearts();
    }

    growPlayer() {
        if (this._playerGrown) return;
        this._playerGrown = true;
        this.player.setScale(1.5);
        // Grow back after 8 seconds
        this.time.delayedCall(8000, () => {
            if (this.player && this.player.active) {
                this.player.setScale(1);
                this._playerGrown = false;
            }
        });
        // Show growth message
        const msg = this.add.text(this.player.x, this.player.y - 50, '变大啦!', {
            fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold',
            color: '#ffd700', stroke: '#333', strokeThickness: 3
        }).setOrigin(0.5);
        this.tweens.add({
            targets: msg, y: msg.y - 30, alpha: 0, duration: 1200,
            onComplete: () => msg.destroy()
        });
    }

    touchEnemy(player, enemy) {
        // If player is jumping on top of enemy
        if (player.body.velocity.y > 0 && player.body.bottom <= enemy.body.top + 15) {
            // Stomp enemy
            enemy.destroy();
            player.setVelocityY(-250);
            if (audioManager) audioManager.sfxStomp();

            // Score popup
            const text = this.add.text(enemy.x, enemy.y - 20, '+10', {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: '#ffd700',
                stroke: '#333333',
                strokeThickness: 2
            }).setOrigin(0.5);

            this.tweens.add({
                targets: text,
                y: enemy.y - 50,
                alpha: 0,
                duration: 600,
                onComplete: () => text.destroy()
            });
        } else {
            // Take damage
            player.takeDamage();
            this.updateHearts();
        }
    }

    reachFlag() {
        if (this._levelComplete) return;
        this._levelComplete = true;
        console.log('reachFlag called! Starting level complete sequence...');

        this.physics.pause();
        this.player.setVelocityX(0);
        this.player.setVelocityY(0);
        if (audioManager) audioManager.sfxLevelComplete();

        const fx = this._flagX || 400;
        const fy = this._flagY ? this._flagY - 50 : 240;

        // Victory popup
        const text = this.add.text(fx, fy - 80, '过关啦!', {
            fontSize: '24px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#ffd700',
            stroke: '#333333',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.tweens.add({
            targets: text,
            scale: 1.2,
            duration: 400,
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                this.scene.start('ResultScene', {
                    world: this.worldNum,
                    level: this.levelNum,
                    coins: this.collectedCoins,
                    totalCoins: this.totalCoins,
                    correct: this.correctAnswers,
                    total: this.questionsAnswered,
                    lives: this.player.lives
                });
            }
        });
    }

    updateHearts() {
        for (let i = 0; i < this.hearts.length; i++) {
            this.hearts[i].setAlpha(i < this.player.lives ? 1 : 0.2);
        }
    }

    enemyShoot(enemy) {
        if (!enemy.active) return;
        const proj = this.add.circle(enemy.x, enemy.y, 6, 0xff0000);
        proj.setDepth(5);
        this.physics.add.existing(proj);
        proj.body.setAllowGravity(false);
        const player = this.player;
        const dirX = player ? (player.x < enemy.x ? -1 : 1) : -1;
        proj.body.setVelocity(dirX * 150, -60);
        this._enemyProjectiles.add(proj);
        this.time.delayedCall(3000, () => {
            if (proj.active) proj.destroy();
        });
    }

    resetPlayer() {
        // Reset player state without restarting scene (preserves keyboard state)
        this.player.x = 80;
        this.player.y = 300;
        this.player.lives = 3;
        this.player.clearTint();
        if (this.player.body) {
            this.player.body.checkCollision.none = false;
            this.player.body.setVelocity(0, 0);
        }
        this.updateHearts();
        this.physics.resume();
        console.log('Player reset to start position');
    }

    update() {
        if (!this.player || !this.player.active) return;

        this.player.update();

        // Flag detection - requires minimum coins
        const flagX = 2600;
        const distToFlag = this._flagX ? Math.abs(this.player.x - this._flagX) : 9999;
        const minCoins = Math.max(1, Math.floor(this.totalCoins * 0.3));
        const coinGateMet = this.collectedCoins >= minCoins;

        // Boss gate: boss must be defeated for boss levels
        const bossGateMet = this.levelType !== 'boss' || (this._boss && this._boss.defeated);

        if (this.debugText) {
            this.debugText.setText('玩家:' + Math.round(this.player.x)
                + ' 旗:' + flagX
                + ' 币:' + this.collectedCoins + '/' + minCoins
                + (this.levelType === 'boss' ? ' Boss:' + (this._boss ? this._boss.hp : '?') : '')
                + ' (' + this.levelType + ')');
        }

        if (!this.flagReached && !this._levelComplete && coinGateMet && bossGateMet) {
            if (this.player.x > flagX || distToFlag < 80) {
                this.flagReached = true;
                this.reachFlag();
            }
        }

        // Enemy patrol + update (handles all 4 types directly)
        const now = this.time.now;
        const dt = this.game.loop.delta;
        this.enemies.getChildren().forEach(enemy => {
            if (!enemy.active) return;
            const eType = enemy.enemyType || 'ground';
            const range = enemy.patrolRange || 80;

            switch (eType) {
                case 'flying':
                    if (enemy.y < enemy.startY - range) {
                        enemy.body.setVelocityY(50);
                    } else if (enemy.y > enemy.startY + range) {
                        enemy.body.setVelocityY(-50);
                    } else if (Math.abs(enemy.body.velocity.y) < 1) {
                        // Restore velocity if zeroed by collision
                        enemy.body.setVelocityY(enemy._initVelY || 50);
                    }
                    break;
                case 'shooter':
                    if (enemy.x > enemy.startX + range) {
                        enemy.body.setVelocityX(-30);
                    } else if (enemy.x < enemy.startX - range) {
                        enemy.body.setVelocityX(30);
                    }
                    enemy._shootTimer -= dt;
                    if (enemy._shootTimer <= 0) {
                        this.enemyShoot(enemy);
                        enemy._shootTimer = Phaser.Math.Between(3000, 5000);
                    }
                    break;
                case 'speedy':
                    if (enemy.x > enemy.startX + range) {
                        enemy.body.setVelocityX(-80);
                        enemy.setFlipX(true);
                    } else if (enemy.x < enemy.startX - range) {
                        enemy.body.setVelocityX(80);
                        enemy.setFlipX(false);
                    }
                    break;
                default: // ground
                    if (enemy.x > enemy.startX + range) {
                        enemy.body.setVelocityX(-40);
                    } else if (enemy.x < enemy.startX - range) {
                        enemy.body.setVelocityX(40);
                    }
                    break;
            }
        });

        // Cleanup off-screen projectiles
        if (this._enemyProjectiles) {
            this._enemyProjectiles.getChildren().forEach(p => {
                if (!p.active || p.y > 600 || p.x < this.player.x - 800 || p.x > this.player.x + 900) {
                    p.destroy();
                }
            });
        }

        // Update HUD
        this.coinText.setText(this.collectedCoins.toString());
    }
}
