class ResultScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ResultScene' });
    }

    init(data) {
        this.worldNum = data.world || 1;
        this.levelNum = data.level || 1;
        this.coins = data.coins || 0;
        this.totalCoins = data.totalCoins || 0;
        this.correct = data.correct || 0;
        this.total = data.total || 0;
        this.lives = data.lives || 0;
    }

    create() {
        const { width, height } = this.cameras.main;

        // Background
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x2d1b4e, 0x2d1b4e, 1);
        bg.fillRect(0, 0, width, height);

        // Stars based on performance
        const ratio = this.totalCoins > 0 ? this.coins / Math.max(this.totalCoins, 1) : 0;
        const starCount = ratio >= 0.8 ? 3 : ratio >= 0.5 ? 2 : 1;

        // Title
        this.add.text(width / 2, 50, '关卡完成!', {
            fontSize: '36px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#ffd700',
            stroke: '#333333',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Stars
        for (let i = 0; i < 3; i++) {
            const starX = width / 2 - 60 + i * 60;
            const star = this.add.image(starX, 120, 'star').setScale(i < starCount ? 2 : 1);
            if (i < starCount) {
                star.setAlpha(0);
                this.tweens.add({
                    targets: star,
                    alpha: 1,
                    scale: 2,
                    duration: 400,
                    delay: i * 300 + 300,
                    ease: 'Back.easeOut'
                });
            } else {
                star.setAlpha(0.3);
                star.setTint(0x666666);
            }
        }

        // Stats
        const statsY = 180;
        this.add.text(width / 2, statsY, `金币: ${this.coins}  |  答题: ${this.correct}/${this.total}`, {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(width / 2, statsY + 30, `正确率: ${this.total > 0 ? Math.round(this.correct / this.total * 100) : 0}%  |  生命: ${'♥'.repeat(this.lives)}`, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffb6c1'
        }).setOrigin(0.5);

        // Next level button
        const btnY = 280;
        const btn = this.add.graphics();
        btn.fillStyle(0x90ee90);
        btn.fillRoundedRect(width / 2 - 80, btnY - 22, 160, 44, 10);

        const nextLevel = this.levelNum < 4
            ? `下一关 →`
            : '返回地图';

        this.add.text(width / 2, btnY, nextLevel, {
            fontSize: '20px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#333333'
        }).setOrigin(0.5);

        const btnZone = this.add.zone(width / 2, btnY, 160, 44).setInteractive({ useHandCursor: true });

        btnZone.on('pointerover', () => {
            btn.clear();
            btn.fillStyle(0xa0f0a0);
            btn.fillRoundedRect(width / 2 - 80, btnY - 22, 160, 44, 10);
        });

        btnZone.on('pointerout', () => {
            btn.clear();
            btn.fillStyle(0x90ee90);
            btn.fillRoundedRect(width / 2 - 80, btnY - 22, 160, 44, 10);
        });

        btnZone.on('pointerdown', () => {
            // Save progress
            if (!progressManager) progressManager = new ProgressManager();
            const ratio = this.totalCoins > 0 ? this.coins / Math.max(this.totalCoins, 1) : 0;
            const stars = ratio >= 0.8 ? 3 : ratio >= 0.5 ? 2 : 1;
            // Map level number to progress key (4 = 'boss')
            const levelKey = this.levelNum >= 4 ? 'boss' : this.levelNum;
            progressManager.completeLevel(this.worldNum, levelKey, stars);

            // Determine next level
            const levelTypes = ['vocabulary', 'sentence', 'grammar', 'boss'];
            const nextLevel = this.levelNum < 4 ? this.levelNum + 1 : null;
            const nextType = nextLevel ? levelTypes[nextLevel - 1] : null;

            if (nextLevel) {
                this.scene.start('GameScene', {
                    world: this.worldNum,
                    level: nextLevel,
                    type: nextType
                });
            } else {
                this.scene.start('WorldSelectScene');
            }
        });

        // Replay button
        const replayY = 340;
        this.add.text(width / 2, replayY, '重新挑战', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#aaa'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })
            .on('pointerover', function () { this.setColor('#fff'); })
            .on('pointerout', function () { this.setColor('#aaa'); })
            .on('pointerdown', () => {
                this.scene.start('GameScene', {
                    world: this.worldNum,
                    level: this.levelNum,
                    type: 'vocabulary'
                });
            });

        // Particle celebration
        for (let i = 0; i < 20; i++) {
            const px = Phaser.Math.Between(50, width - 50);
            const py = Phaser.Math.Between(50, height - 50);
            const sparkle = this.add.image(px, py, 'sparkle').setAlpha(0).setScale(0.5);
            this.tweens.add({
                targets: sparkle,
                alpha: 0.8,
                scale: 1,
                duration: 800,
                delay: i * 100,
                yoyo: true,
                onComplete: () => sparkle.destroy()
            });
        }

        this.cameras.main.fadeIn(500);
    }
}
