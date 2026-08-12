import Phaser from 'phaser';
import { CONFIG, type SkillId } from '../constants';

type GravityDir = 1 | -1;

export interface PlayerCallbacks {
  onJump: (x: number, y: number, vel: number, baseVel: number) => void;
  onSkill: (skill: SkillId, x: number, y: number) => void;
  onDeath: () => void;
  onLand: (x: number, y: number) => void;
  onDashEnd: () => void;
}

export class Player {
  sprite: Phaser.Physics.Arcade.Sprite;
  private scene: Phaser.Scene;
  private skill: SkillId | null;
  private callbacks: PlayerCallbacks;
  private gravityDir: GravityDir = 1;
  private jumpHeld = false;
  private canDoubleJump = false;
  private isDashing = false;
  private dashTime = 0;
  private invincible = false;
  private invincibleTimer = 0;
  private shieldActive = false;
  private skillUsed = false;
  private dead = false;
  private coyoteTime = 0;
  private jumpBuffer = 0;
  private aiAdjustment: number;
  private baseJumpVel: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    skill: SkillId | null,
    aiAdjustment: number,
    callbacks: PlayerCallbacks,
  ) {
    this.scene = scene;
    this.skill = skill;
    this.callbacks = callbacks;
    this.aiAdjustment = aiAdjustment;
    this.baseJumpVel = CONFIG.baseJumpVel;
    if (skill === 'shield') this.shieldActive = true;

    this.sprite = scene.physics.add.sprite(x, y, 'player');
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.body!.setSize(24, 28, true);
    (this.sprite.body as Phaser.Physics.Arcade.Body).setOffset(4, 2);

    this.sprite.setCollideWorldBounds(false);
  }

  getGravityDir(): GravityDir {
    return this.gravityDir;
  }

  isDead(): boolean {
    return this.dead;
  }

  isInvincible(): boolean {
    return this.invincible;
  }

  hasShield(): boolean {
    return this.shieldActive;
  }

  private getActualJumpVel(): number {
    return this.baseJumpVel * (1 + this.aiAdjustment);
  }

  update(_dt: number, grounded: boolean) {
    if (this.dead) return;

    // Auto-scroll: player x is locked, world scrolls
    this.sprite.setVelocityX(0);

    // Coyote time
    if (grounded) {
      this.coyoteTime = 100;
      this.canDoubleJump = false;
    } else {
      this.coyoteTime -= _dt;
    }

    // Jump buffer countdown
    if (this.jumpBuffer > 0) {
      this.jumpBuffer -= _dt;
    }

    // Execute buffered jump
    if (this.jumpBuffer > 0 && (grounded || this.coyoteTime > 0)) {
      this.doJump();
      this.jumpBuffer = 0;
    }

    // Variable jump height — cut velocity when released
    if (!this.jumpHeld && this.gravityDir === 1 && this.sprite.body!.velocity.y < 0) {
      this.sprite.setVelocityY(this.sprite.body!.velocity.y * 0.5);
    }
    if (!this.jumpHeld && this.gravityDir === -1 && this.sprite.body!.velocity.y > 0) {
      this.sprite.setVelocityY(this.sprite.body!.velocity.y * 0.5);
    }

    // Dash timer
    if (this.isDashing) {
      this.dashTime -= _dt;
      if (this.dashTime <= 0) {
        this.isDashing = false;
        this.sprite.setVelocityY(0);
        this.invincible = false;
        this.callbacks.onDashEnd();
      }
    }

    // Invincibility timer
    if (this.invincible && !this.isDashing) {
      this.invincibleTimer -= _dt;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
        this.sprite.setAlpha(1);
      } else {
        this.sprite.setAlpha(0.5);
      }
    }

    // Update gravity direction
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(true);
    this.scene.physics.world.gravity.y = CONFIG.gravity * this.gravityDir;
  }

  holdJump() {
    if (this.dead) return;
    this.jumpHeld = true;
    this.tryJump();
  }

  releaseJump() {
    this.jumpHeld = false;
  }

  private tryJump() {
    const grounded = this.coyoteTime > 0 || this.sprite.body!.blocked.down || this.sprite.body!.touching.down;
    const ceilinged = this.sprite.body!.blocked.up || this.sprite.body!.touching.up;

    if (this.gravityDir === -1 && ceilinged) {
      this.doJump();
      return;
    }
    if (this.gravityDir === 1 && grounded) {
      this.doJump();
      return;
    }
    // Double jump
    if (this.skill === 'doubleJump' && !this.canDoubleJump && !grounded) {
      this.canDoubleJump = true;
      this.doJump(true);
      return;
    }
    // Buffer the jump
    this.jumpBuffer = 120;
  }

  private doJump(isDouble = false) {
    const vel = this.getActualJumpVel();
    this.sprite.setVelocityY(-vel * this.gravityDir);
    this.callbacks.onJump(this.sprite.x, this.sprite.y, vel * this.gravityDir, this.baseJumpVel);
    if (isDouble) {
      this.scene.time.delayedCall(0, () => {});
    }
  }

  useSkill() {
    if (this.dead || this.skillUsed || !this.skill) return;

    switch (this.skill) {
      case 'dash':
        this.activateDash();
        break;
      case 'gravity':
        this.activateGravityFlip();
        break;
      case 'shield':
        // Shield is passive, already active
        return;
      case 'spear':
        this.activateSpear();
        break;
      case 'doubleJump':
        // Passive skill
        return;
    }
  }

  private activateDash() {
    if (this.isDashing) return;
    this.isDashing = true;
    this.dashTime = 300;
    this.invincible = true;
    this.sprite.setVelocityY(0);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    this.skillUsed = true;
    this.callbacks.onSkill('dash', this.sprite.x, this.sprite.y);
  }

  private activateGravityFlip() {
    this.gravityDir = (this.gravityDir === 1 ? -1 : 1) as GravityDir;
    this.canDoubleJump = false;
    this.skillUsed = true;
    this.callbacks.onSkill('gravity', this.sprite.x, this.sprite.y);
  }

  private activateSpear() {
    this.skillUsed = true;
    this.callbacks.onSkill('spear', this.sprite.x, this.sprite.y);
    // Spear attack handled by GameScene via callback
  }

  flipGravityBack() {
    if (this.gravityDir === -1) {
      this.gravityDir = 1;
    }
  }

  takeDamage(): boolean {
    if (this.invincible || this.dead) return false;

    if (this.shieldActive) {
      this.shieldActive = false;
      this.invincible = true;
      this.invincibleTimer = 800;
      return false;
    }

    this.dead = true;
    this.sprite.setVelocity(0, 0);
    this.callbacks.onDeath();
    return true;
  }

  getSpearHitbox(): Phaser.Geom.Rectangle | null {
    if (!this.skill || this.skill !== 'spear') return null;
    const range = 80;
    return new Phaser.Geom.Rectangle(
      this.sprite.x + 16,
      this.sprite.y - 30,
      range,
      60,
    );
  }

  destroy() {
    this.sprite.destroy();
  }
}
