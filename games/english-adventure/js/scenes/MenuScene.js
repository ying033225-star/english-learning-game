class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const { width, height } = this.cameras.main;

        // Sky gradient background
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x87ceeb, 0x87ceeb, 0xffb6c1, 0xffb6c1, 1);
        bg.fillRect(0, 0, width, height);

        // Ground
        const ground = this.add.graphics();
        ground.fillStyle(0x7ec850);
        ground.fillRect(0, height - 60, width, 60);
        ground.fillStyle(0xc8845c);
        ground.fillRect(0, height - 54, width, 54);

        // Decorative clouds
        this.addCloud(120, 60);
        this.addCloud(400, 40);
        this.addCloud(650, 80);

        // Decorative flowers on ground
        for (let i = 0; i < 10; i++) {
            const fx = 40 + i * 80;
            this.addFlower(fx, height - 68);
        }

        // Title
        const titleShadow = this.add.text(width / 2 + 2, 82, '英语大冒险', {
            fontSize: '48px',
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
            color: '#333333'
        }).setOrigin(0.5);

        const title = this.add.text(width / 2, 80, '英语大冒险', {
            fontSize: '48px',
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#ff69b4',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(width / 2, 130, 'English Adventure', {
            fontSize: '18px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            stroke: '#dda0dd',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Decorative stars around title
        for (let i = 0; i < 5; i++) {
            const sx = width / 2 - 160 + i * 80;
            const sy = 100 + Math.sin(i * 1.2) * 15;
            const star = this.add.image(sx, sy, 'star').setScale(1 + Math.random() * 0.5);
            this.tweens.add({
                targets: star,
                y: sy - 5,
                duration: 800 + i * 200,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // Start button
        const btnY = 210;
        const btn = this.add.graphics();
        btn.fillStyle(0xff69b4);
        btn.fillRoundedRect(width / 2 - 80, btnY - 25, 160, 50, 12);
        btn.lineStyle(3, 0xffffff);
        btn.strokeRoundedRect(width / 2 - 80, btnY - 25, 160, 50, 12);

        const btnText = this.add.text(width / 2, btnY, '开始冒险', {
            fontSize: '24px',
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Make button interactive
        const btnZone = this.add.zone(width / 2, btnY, 160, 50).setInteractive({ useHandCursor: true });

        btnZone.on('pointerover', () => {
            btn.clear();
            btn.fillStyle(0xff85c1);
            btn.fillRoundedRect(width / 2 - 80, btnY - 25, 160, 50, 12);
            btn.lineStyle(3, 0xffffff);
            btn.strokeRoundedRect(width / 2 - 80, btnY - 25, 160, 50, 12);
        });

        btnZone.on('pointerout', () => {
            btn.clear();
            btn.fillStyle(0xff69b4);
            btn.fillRoundedRect(width / 2 - 80, btnY - 25, 160, 50, 12);
            btn.lineStyle(3, 0xffffff);
            btn.strokeRoundedRect(width / 2 - 80, btnY - 25, 160, 50, 12);
        });

        btnZone.on('pointerdown', () => {
            this.cameras.main.fadeOut(500, 255, 255, 255);
            this.time.delayedCall(500, () => {
                this.scene.start('WorldSelectScene');
            });
        });

        // Settings hint
        this.add.text(width / 2, 280, '双击网页即可开始 | 适合小学四年级', {
            fontSize: '12px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            alpha: 0.7
        }).setOrigin(0.5);

        // Cute character on title screen
        const char = this.add.image(width / 2, height - 100, 'player_idle').setScale(3);
        this.tweens.add({
            targets: char,
            y: height - 105,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Fade in
        this.cameras.main.fadeIn(500, 255, 255, 255);

        // Floating sparkles
        for (let i = 0; i < 8; i++) {
            const sx = Phaser.Math.Between(50, width - 50);
            const sy = Phaser.Math.Between(50, height - 100);
            const sparkle = this.add.image(sx, sy, 'sparkle').setAlpha(0);
            this.tweens.add({
                targets: sparkle,
                alpha: 0.8,
                y: sy - 20,
                duration: 1500 + i * 300,
                yoyo: true,
                repeat: -1,
                delay: i * 400,
                ease: 'Sine.easeInOut'
            });
        }
    }

    addCloud(x, y) {
        const cloud = this.add.graphics();
        cloud.fillStyle(0xffffff, 0.8);
        cloud.fillCircle(x, y, 20);
        cloud.fillCircle(x + 20, y - 5, 25);
        cloud.fillCircle(x + 40, y, 20);
        cloud.fillCircle(x + 15, y + 5, 18);

        this.tweens.add({
            targets: cloud,
            x: 30,
            duration: 8000 + Math.random() * 4000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    addFlower(x, y) {
        const flower = this.add.graphics();
        // Stem
        flower.fillStyle(0x228b22);
        flower.fillRect(x + 2, y, 3, 12);
        // Petals
        flower.fillStyle(0xffb6c1);
        flower.fillCircle(x, y - 2, 4);
        flower.fillCircle(x + 6, y - 2, 4);
        flower.fillCircle(x + 3, y - 6, 4);
        // Center
        flower.fillStyle(0xffd700);
        flower.fillCircle(x + 3, y - 2, 3);
    }
}
