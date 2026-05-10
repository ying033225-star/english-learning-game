class WorldSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WorldSelectScene' });
    }

    create() {
        const { width, height } = this.cameras.main;

        if (!progressManager) {
            progressManager = new ProgressManager();
        }

        // Background
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x2d1b4e, 0x4a2c6e, 1);
        bg.fillRect(0, 0, width, height);

        // Title
        this.add.text(width / 2, 30, '选择世界', {
            fontSize: '32px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#ffd700',
            stroke: '#333',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.add.text(width / 2, 62, `存档进度：世界 ${progressManager.progress.currentWorld}`, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#dda0dd'
        }).setOrigin(0.5);

        // World nodes - 2 rows × 3 columns
        const worldNames = [
            { id: 1, title: '职业', en: 'People at Work', icon: '👩‍⚕️' },
            { id: 2, title: '情绪', en: 'How do you feel?', icon: '😊' },
            { id: 3, title: '才能', en: 'Talent Show', icon: '⭐' },
            { id: 4, title: '植物', en: 'Plant Life', icon: '🌻' },
            { id: 5, title: '校园', en: 'School Events', icon: '🏫' },
            { id: 6, title: '服装', en: 'Cool Clothes', icon: '👗' },
        ];

        const startX = width / 2 - 200;
        const startY = 110;
        const colGap = 200;
        const rowGap = 150;

        worldNames.forEach((world, i) => {
            const col = i % 3;
            const row = Math.floor(i / 3);
            const wx = startX + col * colGap;
            const wy = startY + row * rowGap;

            const worldData = progressManager.progress.worlds[world.id];
            const isUnlocked = worldData && worldData.unlocked;

            // World card
            const card = this.add.graphics();
            const cardW = 170;
            const cardH = 120;

            if (isUnlocked) {
                card.fillStyle(0xffffff, 0.15);
                card.fillRoundedRect(wx - cardW / 2, wy - cardH / 2, cardW, cardH, 12);
                card.lineStyle(2, UNITS[world.id] ? UNITS[world.id].bgColor : 0xffd700);
                card.strokeRoundedRect(wx - cardW / 2, wy - cardH / 2, cardW, cardH, 12);
            } else {
                card.fillStyle(0x333333, 0.5);
                card.fillRoundedRect(wx - cardW / 2, wy - cardH / 2, cardW, cardH, 12);
                card.lineStyle(2, 0x555555);
                card.strokeRoundedRect(wx - cardW / 2, wy - cardH / 2, cardW, cardH, 12);
            }

            // World icon
            const icon = this.add.text(wx, wy - 20, world.icon, {
                fontSize: '36px'
            }).setOrigin(0.5).setAlpha(isUnlocked ? 1 : 0.3);

            // World name
            const nameText = this.add.text(wx, wy + 20, `世界${world.id}`, {
                fontSize: '16px',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                color: isUnlocked ? '#ffffff' : '#666666'
            }).setOrigin(0.5);

            const cnText = this.add.text(wx, wy + 38, world.title, {
                fontSize: '13px',
                fontFamily: 'Arial',
                color: isUnlocked ? '#dda0dd' : '#555555'
            }).setOrigin(0.5);

            // Lock icon for locked worlds
            if (!isUnlocked) {
                const lock = this.add.text(wx, wy - 45, '🔒', {
                    fontSize: '18px'
                }).setOrigin(0.5);
            }

            // Interactive zone
            if (isUnlocked) {
                const zone = this.add.zone(wx, wy, cardW, cardH)
                    .setInteractive({ useHandCursor: true });

                zone.on('pointerover', () => {
                    card.clear();
                    card.fillStyle(0xffffff, 0.25);
                    card.fillRoundedRect(wx - cardW / 2, wy - cardH / 2, cardW, cardH, 12);
                    card.lineStyle(3, UNITS[world.id] ? UNITS[world.id].bgColor : 0xffd700);
                    card.strokeRoundedRect(wx - cardW / 2, wy - cardH / 2, cardW, cardH, 12);
                });

                zone.on('pointerout', () => {
                    card.clear();
                    card.fillStyle(0xffffff, 0.15);
                    card.fillRoundedRect(wx - cardW / 2, wy - cardH / 2, cardW, cardH, 12);
                    card.lineStyle(2, UNITS[world.id] ? UNITS[world.id].bgColor : 0xffd700);
                    card.strokeRoundedRect(wx - cardW / 2, wy - cardH / 2, cardW, cardH, 12);
                });

                zone.on('pointerdown', () => {
                    // Determine level type for first level
                    this.cameras.main.fadeOut(400, 0, 0, 0);
                    this.time.delayedCall(400, () => {
                        this.scene.start('GameScene', {
                            world: world.id,
                            level: 1,
                            type: 'vocabulary'
                        });
                    });
                });
            }
        });

        // Reset progress button (bottom)
        const resetY = height - 30;
        this.add.text(width / 2, resetY, '重置进度', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#888888'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })
            .on('pointerover', function () { this.setColor('#ff6b6b'); })
            .on('pointerout', function () { this.setColor('#888888'); })
            .on('pointerdown', () => {
                progressManager.resetProgress();
                this.scene.restart();
            }, this);

        // Fade in
        this.cameras.main.fadeIn(400);
    }
}
