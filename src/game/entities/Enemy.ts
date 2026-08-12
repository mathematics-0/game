import Phaser from 'phaser';

export type EnemyType = 'walker' | 'flyer';

export class Enemy {
  sprite: Phaser.Physics.Arcade.Sprite;
  private type: EnemyType;
  private startY: number;
  private speed: number;
  private timeOffset: number;
  private alive = true;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, x: number, y: number, type: EnemyType) {
    this.scene = scene;
    this.type = type;
    this.startY = y;
    this.speed = 40;
    this.timeOffset = Math.random() * Math.PI * 2;

    const tex = type === 'walker' ? 'enemy_walker' : 'enemy_flyer';
    this.sprite = scene.physics.add.sprite(x, y, tex);
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.setSize(28, 28);

    if (type === 'walker') {
      this.sprite.setVelocityX(this.speed);
    }
  }

  update(dt: number, scrollSpeed: number) {
    if (!this.alive) return;

    this.sprite.x -= (scrollSpeed * dt) / 1000;

    if (this.type === 'walker') {
      if (this.sprite.body!.blocked.left || this.sprite.body!.touching.left) {
        this.sprite.setVelocityX(this.speed);
        this.sprite.flipX = false;
      } else if (this.sprite.body!.blocked.right || this.sprite.body!.touching.right) {
        this.sprite.setVelocityX(-this.speed);
        this.sprite.flipX = true;
      }
    } else {
      const t = this.scene.time.now / 1000 + this.timeOffset;
      this.sprite.y = this.startY + Math.sin(t * 2) * 40;
    }

    if (this.sprite.x < -100) {
      this.destroy();
    }
  }

  kill() {
    this.alive = false;
    this.sprite.destroy();
  }

  isAlive(): boolean {
    return this.alive;
  }

  getType(): EnemyType {
    return this.type;
  }

  destroy() {
    this.alive = false;
    if (this.sprite && this.sprite.active) {
      this.sprite.destroy();
    }
  }
}
