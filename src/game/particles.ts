import Phaser from 'phaser';

export class ParticleSystem {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  dust(x: number, y: number, direction = 0) {
    const emitter = this.scene.add.particles(x, y, 'particle_dust', {
      speed: { min: 40, max: 120 },
      angle: { min: direction > 0 ? 200 : 0, max: direction > 0 ? 260 : 160 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 300,
      quantity: 6,
      gravityY: 200,
    });
    emitter.explode(6, x, y);
    this.scene.time.delayedCall(400, () => emitter.destroy());
  }

  jumpRing(x: number, y: number) {
    const emitter = this.scene.add.particles(x, y, 'particle_white', {
      speed: 80,
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.7, end: 0 },
      lifespan: 250,
      quantity: 8,
    });
    emitter.explode(8, x, y);
    this.scene.time.delayedCall(300, () => emitter.destroy());
  }

  doubleJumpRing(x: number, y: number) {
    const emitter = this.scene.add.particles(x, y, 'particle_spark', {
      speed: 120,
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 400,
      quantity: 12,
    });
    emitter.explode(12, x, y);
    this.scene.time.delayedCall(450, () => emitter.destroy());
  }

  dashTrail(x: number, y: number) {
    const emitter = this.scene.add.particles(x, y, 'particle_spark', {
      speed: 20,
      angle: { min: 160, max: 200 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 200,
      quantity: 4,
    });
    emitter.explode(4, x, y);
    this.scene.time.delayedCall(250, () => emitter.destroy());
  }

  enemyDeath(x: number, y: number) {
    const emitter = this.scene.add.particles(x, y, 'particle_debris', {
      speed: { min: 80, max: 250 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.0, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 500,
      quantity: 14,
      gravityY: 400,
    });
    emitter.explode(14, x, y);
    this.scene.time.delayedCall(550, () => emitter.destroy());
  }

  damage(x: number, y: number) {
    const emitter = this.scene.add.particles(x, y, 'particle_debris', {
      speed: { min: 60, max: 180 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 400,
      quantity: 10,
      gravityY: 200,
    });
    emitter.explode(10, x, y);
    this.scene.time.delayedCall(450, () => emitter.destroy());
  }

  skillActivate(x: number, y: number) {
    const emitter = this.scene.add.particles(x, y, 'particle_white', {
      speed: { min: 60, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.7, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 500,
      quantity: 16,
    });
    emitter.explode(16, x, y);
    this.scene.time.delayedCall(550, () => emitter.destroy());
  }

  shield(x: number, y: number) {
    const emitter = this.scene.add.particles(x, y, 'particle_shield', {
      speed: 60,
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 600,
      quantity: 20,
    });
    emitter.explode(20, x, y);
    this.scene.time.delayedCall(650, () => emitter.destroy());
  }

  collect(x: number, y: number) {
    const emitter = this.scene.add.particles(x, y, 'particle_spark', {
      speed: { min: 40, max: 120 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 400,
      quantity: 8,
    });
    emitter.explode(8, x, y);
    this.scene.time.delayedCall(450, () => emitter.destroy());
  }

  goalReached(x: number, y: number) {
    const emitter = this.scene.add.particles(x, y, 'particle_white', {
      speed: { min: 80, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 800,
      quantity: 30,
    });
    emitter.explode(30, x, y);
    this.scene.time.delayedCall(850, () => emitter.destroy());
  }
}
