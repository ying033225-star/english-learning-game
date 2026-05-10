class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player_idle');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.body.setSize(18, 30);
        this.body.setOffset(7, 4);

        // Movement
        this.speed = 200;
        this.jumpForce = -480;
        this.isJumping = false;
        this.coins = 0;
        this.lives = 3;

        // Input
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.spaceKey = scene.input.keyboard.addKey('SPACE');
        this.wasd = {
            up: scene.input.keyboard.addKey('W'),
            left: scene.input.keyboard.addKey('A'),
            right: scene.input.keyboard.addKey('D')
        };

        // Touch input for mobile
        this.touchLeft = false;
        this.touchRight = false;
        this.touchJump = false;
        this.setupTouchInput(scene);

        // Animation state
        this.facingRight = true;
        this.walkTimer = 0;
        this.currentWalkFrame = 'player_walk1';
    }

    setupTouchInput(scene) {
        scene.input.on('pointerdown', (pointer) => {
            const halfW = scene.cameras.main.width / 2;
            if (pointer.x < halfW / 2) {
                this.touchLeft = true;
            } else if (pointer.x > halfW * 1.5) {
                this.touchRight = true;
            } else {
                this.touchJump = true;
            }
        });
        scene.input.on('pointerup', () => {
            this.touchLeft = false;
            this.touchRight = false;
            this.touchJump = false;
        });
    }

    update() {
        const onGround = this.body.blocked.down || this.body.touching.down;

        // Horizontal movement (keyboard + touch)
        const left = this.cursors.left.isDown || this.wasd.left.isDown || this.touchLeft;
        const right = this.cursors.right.isDown || this.wasd.right.isDown || this.touchRight;
        const jump = this.cursors.up.isDown || this.wasd.up.isDown || this.spaceKey.isDown || this.touchJump;

        if (left) {
            this.setVelocityX(-this.speed);
            this.setFlipX(true);
            this.facingRight = false;
        } else if (right) {
            this.setVelocityX(this.speed);
            this.setFlipX(false);
            this.facingRight = true;
        } else {
            this.setVelocityX(0);
        }

        // Jump (only when on ground)
        if (jump && onGround && !this._jumpLock) {
            this.setVelocityY(this.jumpForce);
            this._jumpLock = true;
            if (typeof audioManager !== 'undefined' && audioManager) {
                audioManager.sfxJump();
            }
        }

        // Release jump lock when key released and on ground
        if (!jump && onGround) {
            this._jumpLock = false;
        }

        if (onGround) {
            this.isJumping = false;
        }

        // Animation
        if (!onGround) {
            this.setTexture('player_jump');
        } else if (left || right) {
            this.walkTimer += this.scene.game.loop.delta;
            if (this.walkTimer > 150) {
                this.walkTimer = 0;
                this.currentWalkFrame = this.currentWalkFrame === 'player_walk1' ? 'player_walk2' : 'player_walk1';
            }
            this.setTexture(this.currentWalkFrame);
        } else {
            this.setTexture('player_idle');
        }

        // Fall death check
        if (this.y > this.scene.cameras.main.height + 50) {
            this.die();
        }
    }

    addCoin() {
        this.coins++;
        this.setTint(0xffff00);
        this.scene.time.delayedCall(100, () => {
            this.clearTint();
        });
    }

    takeDamage() {
        this.lives--;
        this.setTint(0xff0000);
        this.scene.time.delayedCall(300, () => {
            this.clearTint();
        });

        // Brief invulnerability
        this.body.checkCollision.none = true;
        this.scene.time.delayedCall(1000, () => {
            if (this.active && this.body) {
                this.body.checkCollision.none = false;
            }
        });

        if (this.lives <= 0) {
            this.die();
        }
    }

    die() {
        this.scene.cameras.main.shake(300, 0.01);
        this.setTint(0xff0000);
        this.scene.time.delayedCall(500, () => {
            // Reset player instead of restarting scene (avoids keyboard state loss)
            if (this.scene.resetPlayer) {
                this.scene.resetPlayer();
            } else {
                this.scene.scene.restart();
            }
        });
    }
}
