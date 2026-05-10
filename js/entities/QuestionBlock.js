// Question block entity
class QuestionBlock extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'question_block');
        scene.add.existing(this);
        scene.physics.add.existing(this, true); // static
        this.isActive = true;
    }

    hit() {
        if (!this.isActive) return null;
        this.isActive = false;
        this.setTexture('question_block_hit');
        return true;
    }
}
