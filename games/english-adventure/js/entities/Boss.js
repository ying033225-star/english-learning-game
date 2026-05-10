class Boss extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);
        scene.add.existing(this);

        // Use a hidden physics sprite as the body (avoids isParent error with Container physics)
        this._bodySprite = scene.add.zone(x, y, 60, 60);
        scene.physics.add.existing(this._bodySprite, false);
        this._bodySprite.body.setImmovable(true);
        this._bodySprite.body.setAllowGravity(false);

        this.hp = 3;
        this.maxHp = 3;
        this.defeated = false;

        // Boss body (large, menacing)
        const body = scene.add.graphics();
        body.fillStyle(0x4a148c);
        body.fillCircle(0, 0, 30);
        body.fillStyle(0x7b2d8e);
        body.fillCircle(-8, -12, 10);
        body.fillCircle(8, -12, 10);
        // Red eyes
        body.fillStyle(0xff0000);
        body.fillCircle(-10, -8, 6);
        body.fillCircle(10, -8, 6);
        body.fillStyle(0xffff00);
        body.fillCircle(-10, -8, 3);
        body.fillCircle(10, -8, 3);
        // Mouth
        body.fillStyle(0xffffff);
        body.fillRect(-12, 8, 24, 8);
        body.fillStyle(0x333333);
        for (let i = 0; i < 4; i++) {
            body.fillRect(-10 + i * 6, 10, 3, 3);
        }
        // Crown
        body.fillStyle(0xffd700);
        body.fillTriangle(-15, -28, 0, -44, 15, -28);
        body.fillTriangle(-18, -28, -5, -38, 8, -28);
        body.fillTriangle(-8, -28, 5, -38, 18, -28);
        this.add(body);

        // HP bar background
        const hpBg = scene.add.graphics();
        hpBg.fillStyle(0x333333);
        hpBg.fillRect(-35, -55, 70, 8);
        this.add(hpBg);

        // HP bar foreground
        this.hpBar = scene.add.graphics();
        this.updateHpBar();
        this.add(this.hpBar);

        // Boss label
        const label = scene.add.text(0, -65, 'BOSS', {
            fontSize: '12px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#ff6b6b',
            stroke: '#000',
            strokeThickness: 2
        }).setOrigin(0.5);
        this.add(label);

        // Bobbing animation (moves the container AND the body sprite together)
        this.initY = y;
        scene.tweens.add({
            targets: this,
            y: y - 10,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            onUpdate: () => {
                this._bodySprite.y = this.y;
                this._bodySprite.x = this.x;
            }
        });
    }

    updateHpBar() {
        this.hpBar.clear();
        const ratio = this.hp / this.maxHp;
        const color = ratio > 0.6 ? 0x4caf50 : ratio > 0.3 ? 0xff9800 : 0xff0000;
        this.hpBar.fillStyle(color);
        this.hpBar.fillRect(-35, -55, 70 * ratio, 8);
    }

    takeDamage() {
        if (this.defeated) return false;
        this.hp--;
        this.updateHpBar();

        this.scene.tweens.add({
            targets: this,
            alpha: 0.3,
            duration: 100,
            yoyo: true,
            repeat: 2
        });

        if (this.hp <= 0) {
            this.defeat();
            return true;
        }
        return false;
    }

    defeat() {
        this.defeated = true;
        this._bodySprite.body.enable = false;
        this.scene.cameras.main.shake(400, 0.02);
        for (let i = 0; i < 15; i++) {
            const sparkle = this.scene.add.image(
                this.x + Phaser.Math.Between(-30, 30),
                this.y + Phaser.Math.Between(-30, 30),
                'sparkle'
            ).setScale(1.5);
            this.scene.tweens.add({
                targets: sparkle,
                x: sparkle.x + Phaser.Math.Between(-80, 80),
                y: sparkle.y - Phaser.Math.Between(30, 80),
                alpha: 0,
                scale: 0,
                duration: 600,
                onComplete: () => sparkle.destroy()
            });
        }

        const vText = this.scene.add.text(this.x, this.y - 50, '击败Boss!', {
            fontSize: '18px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#ffd700',
            stroke: '#333',
            strokeThickness: 3
        }).setOrigin(0.5);
        this.scene.tweens.add({
            targets: vText,
            y: this.y - 70,
            alpha: 0,
            duration: 1200,
            onComplete: () => vText.destroy()
        });

        this.scene.time.delayedCall(800, () => {
            this.destroy();
        });
    }
}
