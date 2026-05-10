class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        const { width, height } = this.cameras.main;

        // Simple loading text
        const loadText = this.add.text(width / 2, height / 2, '正在准备游戏...', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffb6c1'
        }).setOrigin(0.5);

        // Generate textures in next frame so text renders first
        this.time.delayedCall(100, () => {
            this.generateTextures();
            loadText.setText('准备好了!');
            this.time.delayedCall(300, () => {
                this.scene.start('MenuScene');
            });
        });
    }

    generateTextures() {
        // --- Player (cute girl character) ---
        this.createPlayerTextures();

        // --- Ground tile ---
        const gg = this.make.graphics({ add: false });
        gg.fillStyle(0x7ec850);
        gg.fillRect(0, 0, 32, 6);
        gg.fillStyle(0xc8845c);
        gg.fillRect(0, 6, 32, 26);
        gg.fillStyle(0xb8733a);
        gg.fillRect(4, 12, 3, 3);
        gg.fillRect(14, 16, 3, 3);
        gg.fillRect(24, 10, 3, 3);
        gg.fillRect(8, 22, 3, 3);
        gg.fillRect(20, 20, 3, 3);
        gg.generateTexture('ground', 32, 32);
        gg.destroy();

        // --- Platform tile ---
        const platg = this.make.graphics({ add: false });
        platg.fillStyle(0xdeb887);
        platg.fillRect(0, 0, 32, 16);
        platg.fillStyle(0xc4a46c);
        platg.fillRect(0, 0, 32, 2);
        platg.fillStyle(0xa0825a);
        platg.fillRect(0, 14, 32, 2);
        platg.generateTexture('platform', 32, 16);
        platg.destroy();

        // --- Question block ---
        const qg = this.make.graphics({ add: false });
        qg.fillStyle(0xffa500);
        qg.fillRect(0, 0, 32, 32);
        qg.lineStyle(1, 0x8b6914);
        qg.strokeRect(0, 0, 32, 32);
        qg.fillStyle(0xffd700);
        qg.fillRect(3, 3, 26, 26);
        qg.lineStyle(1, 0x8b6914);
        qg.strokeRect(3, 3, 26, 26);
        qg.fillStyle(0x8b4513);
        // "?" mark
        qg.fillRect(12, 6, 8, 3);
        qg.fillRect(14, 10, 4, 3);
        qg.fillRect(12, 17, 4, 3);
        qg.fillRect(14, 14, 4, 3);
        qg.fillRect(16, 20, 4, 3);
        qg.generateTexture('question_block', 32, 32);
        qg.destroy();

        // Question block - hit (dark, empty)
        const qh = this.make.graphics({ add: false });
        qh.fillStyle(0x8b7355);
        qh.fillRect(0, 0, 32, 32);
        qh.lineStyle(1, 0x5c4a2e);
        qh.strokeRect(0, 0, 32, 32);
        qh.fillStyle(0x7a6240);
        qh.fillRect(3, 3, 26, 26);
        qh.generateTexture('question_block_hit', 32, 32);
        qh.destroy();

        // --- Coin ---
        const cg = this.make.graphics({ add: false });
        cg.fillStyle(0xffd700);
        cg.fillCircle(8, 8, 7);
        cg.fillStyle(0xffec8b);
        cg.fillCircle(7, 7, 3);
        cg.generateTexture('coin', 16, 16);
        cg.destroy();

        // --- Enemy ---
        const eg = this.make.graphics({ add: false });
        eg.fillStyle(0x9932cc);
        eg.fillCircle(16, 18, 14);
        eg.fillStyle(0xffffff);
        eg.fillCircle(11, 14, 4);
        eg.fillCircle(21, 14, 4);
        eg.fillStyle(0x333333);
        eg.fillCircle(12, 14, 2);
        eg.fillCircle(22, 14, 2);
        eg.lineStyle(2, 0x333333);
        eg.lineBetween(7, 9, 14, 11);
        eg.lineBetween(25, 9, 18, 11);
        eg.fillStyle(0x333333);
        eg.fillRect(6, 26, 8, 4);
        eg.fillRect(18, 26, 8, 4);
        eg.generateTexture('enemy', 32, 32);
        eg.destroy();

        // --- Flag pole ---
        const fg = this.make.graphics({ add: false });
        fg.fillStyle(0x888888);
        fg.fillRect(8, 0, 4, 64);
        fg.fillStyle(0xff6b6b);
        fg.fillTriangle(12, 4, 34, 14, 12, 24);
        fg.fillStyle(0xffd700);
        fg.fillCircle(10, 0, 6);
        fg.generateTexture('flag', 36, 64);
        fg.destroy();

        // --- Star ---
        const sg = this.make.graphics({ add: false });
        sg.fillStyle(0xffd700);
        sg.beginPath();
        const cx = 12, cy = 12, r = 10, ri = 4;
        for (let i = 0; i < 5; i++) {
            const angle = (i * 72 - 90) * Math.PI / 180;
            const innerAngle = ((i * 72) + 36 - 90) * Math.PI / 180;
            if (i === 0) sg.moveTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
            else sg.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
            sg.lineTo(cx + ri * Math.cos(innerAngle), cy + ri * Math.sin(innerAngle));
        }
        sg.closePath();
        sg.fillPath();
        sg.generateTexture('star', 24, 24);
        sg.destroy();

        // --- Heart ---
        const hg = this.make.graphics({ add: false });
        hg.fillStyle(0xff6b6b);
        hg.fillCircle(8, 6, 5);
        hg.fillCircle(16, 6, 5);
        hg.fillTriangle(3, 9, 21, 9, 12, 20);
        hg.generateTexture('heart', 24, 24);
        hg.destroy();

        // --- Sparkle particle ---
        const spg = this.make.graphics({ add: false });
        spg.fillStyle(0xffffff);
        spg.fillRect(2, 0, 3, 3);
        spg.fillRect(0, 2, 7, 3);
        spg.fillRect(2, 5, 3, 3);
        spg.generateTexture('sparkle', 7, 8);
        spg.destroy();
    }

    createPlayerTextures() {
        // Frame: Idle
        let pg = this.make.graphics({ add: false });
        pg.fillStyle(0x5c3317);
        pg.fillRect(10, 0, 12, 8);
        pg.fillRect(10, 8, 2, 12);
        pg.fillRect(20, 8, 2, 12);
        pg.fillRect(22, 4, 6, 6);
        pg.fillStyle(0xffdab9);
        pg.fillRect(12, 8, 8, 8);
        pg.fillStyle(0x333333);
        pg.fillRect(14, 10, 2, 2);
        pg.fillRect(18, 10, 2, 2);
        pg.fillStyle(0xff9999);
        pg.fillRect(15, 14, 4, 1);
        pg.fillStyle(0xff69b4);
        pg.fillRect(10, 16, 12, 10);
        pg.fillRect(8, 18, 16, 6);
        pg.fillStyle(0xffdab9);
        pg.fillRect(6, 18, 4, 6);
        pg.fillRect(22, 18, 4, 6);
        pg.fillRect(12, 26, 3, 6);
        pg.fillRect(17, 26, 3, 6);
        pg.fillStyle(0xff69b4);
        pg.fillRect(11, 32, 4, 3);
        pg.fillRect(17, 32, 4, 3);
        pg.generateTexture('player_idle', 32, 36);
        pg.destroy();

        // Frame: Walk 1
        pg = this.make.graphics({ add: false });
        pg.fillStyle(0x5c3317);
        pg.fillRect(10, 0, 12, 8);
        pg.fillRect(10, 8, 2, 12);
        pg.fillRect(20, 8, 2, 12);
        pg.fillRect(22, 4, 6, 6);
        pg.fillStyle(0xffdab9);
        pg.fillRect(12, 8, 8, 8);
        pg.fillStyle(0x333333);
        pg.fillRect(14, 10, 2, 2);
        pg.fillRect(18, 10, 2, 2);
        pg.fillStyle(0xff9999);
        pg.fillRect(15, 14, 4, 1);
        pg.fillStyle(0xff69b4);
        pg.fillRect(10, 16, 12, 10);
        pg.fillRect(8, 18, 16, 6);
        pg.fillStyle(0xffdab9);
        pg.fillRect(6, 18, 4, 6);
        pg.fillRect(22, 18, 4, 6);
        pg.fillRect(11, 26, 3, 6);
        pg.fillRect(18, 26, 3, 6);
        pg.fillStyle(0xff69b4);
        pg.fillRect(10, 32, 4, 3);
        pg.fillRect(18, 32, 4, 3);
        pg.generateTexture('player_walk1', 32, 36);
        pg.destroy();

        // Frame: Walk 2
        pg = this.make.graphics({ add: false });
        pg.fillStyle(0x5c3317);
        pg.fillRect(10, 0, 12, 8);
        pg.fillRect(10, 8, 2, 12);
        pg.fillRect(20, 8, 2, 12);
        pg.fillRect(22, 4, 6, 6);
        pg.fillStyle(0xffdab9);
        pg.fillRect(12, 8, 8, 8);
        pg.fillStyle(0x333333);
        pg.fillRect(14, 10, 2, 2);
        pg.fillRect(18, 10, 2, 2);
        pg.fillStyle(0xff9999);
        pg.fillRect(15, 14, 4, 1);
        pg.fillStyle(0xff69b4);
        pg.fillRect(10, 16, 12, 10);
        pg.fillRect(8, 18, 16, 6);
        pg.fillStyle(0xffdab9);
        pg.fillRect(6, 18, 4, 6);
        pg.fillRect(22, 18, 4, 6);
        pg.fillRect(13, 26, 3, 6);
        pg.fillRect(17, 26, 3, 6);
        pg.fillStyle(0xff69b4);
        pg.fillRect(12, 32, 4, 3);
        pg.fillRect(16, 32, 4, 3);
        pg.generateTexture('player_walk2', 32, 36);
        pg.destroy();

        // Frame: Jump
        pg = this.make.graphics({ add: false });
        pg.fillStyle(0x5c3317);
        pg.fillRect(10, 0, 12, 8);
        pg.fillRect(10, 8, 2, 12);
        pg.fillRect(20, 8, 2, 12);
        pg.fillRect(22, 0, 6, 8);
        pg.fillStyle(0xffdab9);
        pg.fillRect(12, 8, 8, 8);
        pg.fillStyle(0x333333);
        pg.fillRect(14, 10, 2, 2);
        pg.fillRect(18, 10, 2, 2);
        pg.fillStyle(0xff9999);
        pg.fillRect(14, 13, 4, 2);
        pg.fillStyle(0xff69b4);
        pg.fillRect(10, 16, 12, 10);
        pg.fillRect(8, 18, 16, 6);
        pg.fillStyle(0xffdab9);
        pg.fillRect(6, 16, 4, 6);
        pg.fillRect(22, 16, 4, 6);
        pg.fillRect(10, 26, 3, 4);
        pg.fillRect(17, 26, 3, 4);
        pg.fillStyle(0xff69b4);
        pg.fillRect(9, 30, 4, 3);
        pg.fillRect(17, 30, 4, 3);
        pg.generateTexture('player_jump', 32, 36);
        pg.destroy();
    }
}
