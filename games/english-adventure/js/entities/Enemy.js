// Enemy entity - supports ground patrol, flying, and projectile types
class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type) {
        super(scene, x, y, 'enemy');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.enemyType = type || 'ground';
        this.patrolRange = 80;
        this.startX = x;
        this.startY = y;
        this._shootTimer = 0;

        // Visual variety per type
        this.body.setBounce(0);

        switch (this.enemyType) {
            case 'flying':
                this.setTint(0xff6b6b); // Red-ish
                this.body.setAllowGravity(false);
                this.body.setVelocityY(50);
                this.patrolRange = 60;
                break;
            case 'shooter':
                this.setTint(0xff9800); // Orange
                this.body.setVelocityX(30);
                this.patrolRange = 60;
                this._shootTimer = Phaser.Math.Between(2000, 4000);
                break;
            case 'speedy':
                this.setTint(0x00bcd4); // Cyan
                this.setScale(0.7);
                this.body.setVelocityX(80);
                this.patrolRange = 120;
                break;
            default: // ground
                this.setTint(0x9932cc); // Purple (original)
                this.body.setVelocityX(40);
                break;
        }
    }

    update(time, delta) {
        if (!this.active) return;

        switch (this.enemyType) {
            case 'flying':
                // Float up and down
                if (this.y < this.startY - this.patrolRange) {
                    this.body.setVelocityY(50);
                } else if (this.y > this.startY + this.patrolRange) {
                    this.body.setVelocityY(-50);
                }
                break;
            case 'shooter':
                // Patrol and shoot
                if (this.x > this.startX + this.patrolRange) {
                    this.body.setVelocityX(-30);
                } else if (this.x < this.startX - this.patrolRange) {
                    this.body.setVelocityX(30);
                }
                // Shoot projectile
                this._shootTimer -= delta;
                if (this._shootTimer <= 0) {
                    this.shoot();
                    this._shootTimer = Phaser.Math.Between(3000, 5000);
                }
                break;
            case 'speedy':
                // Fast patrol
                if (this.x > this.startX + this.patrolRange) {
                    this.body.setVelocityX(-80);
                    this.setFlipX(true);
                } else if (this.x < this.startX - this.patrolRange) {
                    this.body.setVelocityX(80);
                    this.setFlipX(false);
                }
                break;
            default: // ground
                if (this.x > this.startX + this.patrolRange) {
                    this.body.setVelocityX(-40);
                } else if (this.x < this.startX - this.patrolRange) {
                    this.body.setVelocityX(40);
                }
                break;
        }
    }

    shoot() {
        if (!this.scene || !this.active) return;
        // Create a small projectile toward the player
        const proj = this.scene.add.circle(this.x, this.y, 6, 0xff0000);
        proj.setDepth(5);
        this.scene.physics.add.existing(proj);
        proj.body.setAllowGravity(false);

        // Direction toward player (or left if player not found)
        const player = this.scene.player;
        const dirX = player ? (player.x < this.x ? -1 : 1) : -1;
        proj.body.setVelocity(dirX * 150, -60);

        // Add to scene's enemy projectiles list for collision
        if (!this.scene._enemyProjectiles) {
            this.scene._enemyProjectiles = this.scene.physics.add.group();
        }
        this.scene._enemyProjectiles.add(proj);

        // Auto-destroy after 3 seconds
        this.scene.time.delayedCall(3000, () => {
            if (proj.active) proj.destroy();
        });
    }
}
