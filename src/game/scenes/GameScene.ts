import Phaser from 'phaser';
import { CONFIG, COLORS, SKILLS } from '../constants';
import { registry } from '../registry';
import { LEVELS } from '../levels';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { ParticleSystem } from '../particles';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private enemies: Enemy[] = [];
  private particles!: ParticleSystem;

  private groundGroup!: Phaser.Physics.Arcade.StaticGroup;
  private wallGroup!: Phaser.Physics.Arcade.StaticGroup;
  private ceilingGroup!: Phaser.Physics.Arcade.StaticGroup;
  private spikeGroup!: Phaser.Physics.Arcade.StaticGroup;
  private platformGroup!: Phaser.Physics.Arcade.StaticGroup;
  private gemGroup!: Phaser.Physics.Arcade.Group;
  private goalSprite!: Phaser.Physics.Arcade.Sprite;

  private scrollSpeed = 120;
  private scrollX = 0;

  private gemsCollected = 0;
  private totalGems = 0;
  private deaths = 0;
  private jumpCount = 0;
  private startTime = 0;
  private cleared = false;

  private uiText: Phaser.GameObjects.Text[] = [];
  private skillButton!: Phaser.GameObjects.Rectangle;
  private skillButtonText!: Phaser.GameObjects.Text;
  private pauseButton!: Phaser.GameObjects.Rectangle;
  private paused = false;
  private pauseOverlay!: Phaser.GameObjects.Container;

  constructor() {
    super('Game');
  }

  create() {
    const state = registry.getState();
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.scrollSpeed = registry.getScrollSpeed();
    this.scrollX = 0;
    this.gemsCollected = 0;
    this.totalGems = 0;
    this.deaths = 0;
    this.jumpCount = 0;
    this.cleared = false;
    this.startTime = this.time.now;
    this.enemies = [];

    // Find current level
    const level = LEVELS.find(
      (l) => l.world === state.currentWorld && l.stage === state.currentStage,
    );
    if (!level) {
      this.scene.start('Menu');
      return;
    }

    this.particles = new ParticleSystem(this);

    // Create physics groups
    this.groundGroup = this.physics.add.staticGroup();
    this.wallGroup = this.physics.add.staticGroup();
    this.ceilingGroup = this.physics.add.staticGroup();
    this.spikeGroup = this.physics.add.staticGroup();
    this.platformGroup = this.physics.add.staticGroup();
    this.gemGroup = this.physics.add.group();

    // Parse level tiles
    this.parseLevel(level);

    // Create player at spawn
    const spawn = this.findSpawn(level);
    const aiAdj = registry.getAIJumpAdjustment();
    this.player = new Player(this, spawn.x, spawn.y, state.selectedSkill, aiAdj, {
      onJump: (x, y, vel, baseVel) => {
        this.jumpCount++;
        registry.recordJump();
        this.particles.jumpRing(x, y);
        registry.queueJumpEvent({
          world: state.currentWorld,
          stage: state.currentStage,
          difficulty: state.difficulty,
          skill: state.selectedSkill,
          condition: state.condition,
          xPosition: x,
          yPosition: y,
          jumpVelocity: vel,
          baseJumpVelocity: baseVel,
          aiAdjustment: aiAdj,
          cleared: false,
        });
      },
      onSkill: (skill, x, y) => {
        this.particles.skillActivate(x, y);
        if (skill === 'shield') this.particles.shield(x, y);
        this.updateSkillButton();
      },
      onDeath: () => {
        this.deaths++;
        registry.recordDeath();
        this.particles.damage(this.player.sprite.x, this.player.sprite.y);
        this.time.delayedCall(600, () => this.restartLevel());
      },
      onLand: (x, y) => {
        this.particles.dust(x, y);
      },
      onDashEnd: () => {
        this.updateSkillButton();
      },
    });

    // Collisions
    this.physics.add.collider(this.player.sprite, this.groundGroup, () => {
      this.onPlayerLand();
    });
    this.physics.add.collider(this.player.sprite, this.wallGroup);
    this.physics.add.collider(this.player.sprite, this.ceilingGroup, () => {
      this.onPlayerLand();
    });

    // Platform (one-way) collision
    this.physics.add.collider(this.player.sprite, this.platformGroup, (_player, _platform) => {
      this.onPlayerLand();
    });

    // Spike overlap
    this.physics.add.overlap(this.player.sprite, this.spikeGroup, () => {
      this.player.takeDamage();
    });

    // Gem overlap
    this.physics.add.overlap(this.player.sprite, this.gemGroup, (_player, gem) => {
      const g = gem as Phaser.Physics.Arcade.Sprite;
      g.destroy();
      this.gemsCollected++;
      this.particles.collect(g.x, g.y);
      this.updateUI();
    });

    // Goal overlap
    this.physics.add.overlap(this.player.sprite, this.goalSprite, () => {
      if (!this.cleared) {
        this.onLevelClear();
      }
    });

    // Enemy collisions
    this.enemies.forEach((enemy) => {
      this.physics.add.overlap(this.player.sprite, enemy.sprite, () => {
        this.onEnemyContact(enemy);
      });
    });

    // Camera — follow player vertically, lock horizontally
    this.cameras.main.startFollow(this.player.sprite, false, 0, 0.1);

    // Input
    this.setupInput();

    // UI
    this.createUI();

    // Instructions
    const isTouch = !this.input.keyboard || !this.sys.game.device.os.desktop;
    const instr = this.add.text(
      CONFIG.width / 2,
      CONFIG.height - 160,
      isTouch ? '長押しでジャンプ  /  ボタンでスキル' : 'SPACE: ジャンプ（長押し）  /  ENTER: スキル',
      {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '14px',
        color: '#666666',
      },
    );
    instr.setOrigin(0.5);
    instr.setScrollFactor(0);
    instr.setAlpha(0.7);
    this.time.delayedCall(3000, () => {
      this.tweens.add({ targets: instr, alpha: 0, duration: 1000 });
    });
  }

  private parseLevel(level: { tiles: string[] }) {
    const ts = CONFIG.tileSize;
    const rows = level.tiles;

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        const x = c * ts + ts / 2;
        const y = r * ts + ts / 2;

        switch (ch) {
          case '#':
            this.groundGroup.create(x, y, 'ground').refreshBody();
            break;
          case '=':
            this.platformGroup.create(x, y, 'platform').refreshBody();
            break;
          case 'W':
            this.wallGroup.create(x, y, 'wall').refreshBody();
            break;
          case 'T':
            this.ceilingGroup.create(x, y, 'ground').refreshBody();
            break;
          case '^':
            this.spikeGroup.create(x, y, 'spike').refreshBody();
            break;
          case 'E':
            this.enemies.push(new Enemy(this, x, y, 'walker'));
            break;
          case 'F':
            this.enemies.push(new Enemy(this, x, y, 'flyer'));
            break;
          case '*':
            this.gemGroup.create(x, y, 'gem');
            this.totalGems++;
            break;
          case 'G':
            this.goalSprite = this.physics.add.sprite(x, y, 'goal');
            break;
        }
      }
    }
  }

  private findSpawn(level: { tiles: string[] }): { x: number; y: number } {
    const ts = CONFIG.tileSize;
    for (let r = 0; r < level.tiles.length; r++) {
      for (let c = 0; c < level.tiles[r].length; c++) {
        if (level.tiles[r][c] === 'S') {
          return { x: c * ts + ts / 2, y: r * ts + ts / 2 };
        }
      }
    }
    return { x: 100, y: 200 };
  }

  private onPlayerLand() {
    if (!this.player.isDead()) {
      this.particles.dust(this.player.sprite.x, this.player.sprite.y + 14, 0);
    }
  }

  private onEnemyContact(enemy: Enemy) {
    if (this.player.isInvincible() || this.player.isDead()) return;

    // Check if player is stomping (falling onto enemy)
    const playerBottom = this.player.sprite.y + 14;
    const enemyTop = enemy.sprite.y - 14;
    const falling = this.player.sprite.body!.velocity.y > 0;

    if (falling && playerBottom < enemyTop + 10) {
      // Stomp
      enemy.kill();
      this.particles.enemyDeath(enemy.sprite.x, enemy.sprite.y);
      // Bounce
      this.player.sprite.setVelocityY(-300);
    } else {
      this.player.takeDamage();
    }
  }

  private setupInput() {
    const isDesktop = this.sys.game.device.os.desktop;

    if (isDesktop && this.input.keyboard) {
      // Space = hold to jump
      const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      spaceKey.on('down', () => {
        if (!this.paused) this.player.holdJump();
      });
      spaceKey.on('up', () => {
        this.player.releaseJump();
      });

      // Enter = skill
      const enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      enterKey.on('down', () => {
        if (!this.paused) this.player.useSkill();
      });

      // Esc = pause
      const escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      escKey.on('down', () => {
        this.togglePause();
      });
    }

    // Touch: hold anywhere on left side = jump
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.paused) return;
      // Right side = skill button area (handled by button)
      const onSkillButton = pointer.x > CONFIG.width - 120 && pointer.y > CONFIG.height - 120;
      if (onSkillButton) {
        this.player.useSkill();
      } else {
        this.player.holdJump();
      }
    });

    this.input.on('pointerup', () => {
      this.player.releaseJump();
    });
  }

  private createUI() {
    const state = registry.getState();

    // Top bar background
    const topBar = this.add.rectangle(0, 0, CONFIG.width, 50, 0x0a0a0a, 0.8);
    topBar.setOrigin(0, 0);
    topBar.setScrollFactor(0);

    // Stage info
    const stageText = this.add.text(16, 16, `W${state.currentWorld}-${state.currentStage}`, {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
    });
    stageText.setScrollFactor(0);
    this.uiText.push(stageText);

    // Gems
    const gemText = this.add.text(120, 16, `◆ ${this.gemsCollected}/${this.totalGems}`, {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '16px',
      color: '#ffffff',
    });
    gemText.setScrollFactor(0);
    this.uiText.push(gemText);

    // Difficulty
    const diffText = this.add.text(CONFIG.width - 16, 16, ['EASY', 'NORMAL', 'HARD'][state.difficulty - 1], {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '14px',
      color: '#888888',
    });
    diffText.setOrigin(1, 0);
    diffText.setScrollFactor(0);
    this.uiText.push(diffText);

    // Skill button (bottom-right)
    const skill = state.selectedSkill;
    const btnX = CONFIG.width - 70;
    const btnY = CONFIG.height - 70;
    this.skillButton = this.add.rectangle(btnX, btnY, 80, 80, 0x222222);
    this.skillButton.setStrokeStyle(2, 0xffffff);
    this.skillButton.setScrollFactor(0);
    this.skillButton.setInteractive({ useHandCursor: true });
    this.skillButton.on('pointerdown', () => {
      if (!this.paused) this.player.useSkill();
    });

    this.skillButtonText = this.add.text(btnX, btnY, skill ? SKILLS[skill].nameJa : '---', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '12px',
      color: '#ffffff',
      align: 'center',
    });
    this.skillButtonText.setOrigin(0.5);
    this.skillButtonText.setScrollFactor(0);

    // Pause button (top-right area, below difficulty)
    this.pauseButton = this.add.rectangle(CONFIG.width - 40, 80, 30, 30, 0x222222);
    this.pauseButton.setStrokeStyle(1, 0x666666);
    this.pauseButton.setScrollFactor(0);
    this.pauseButton.setInteractive({ useHandCursor: true });
    this.pauseButton.on('pointerdown', () => this.togglePause());

    const pauseIcon = this.add.text(CONFIG.width - 40, 80, '||', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '16px',
      color: '#ffffff',
    });
    pauseIcon.setOrigin(0.5);
    pauseIcon.setScrollFactor(0);

    // Pause overlay (hidden)
    this.pauseOverlay = this.add.container(0, 0);
    this.pauseOverlay.setScrollFactor(0);
    this.pauseOverlay.setVisible(false);

    const overlayBg = this.add.rectangle(0, 0, CONFIG.width, CONFIG.height, 0x000000, 0.85);
    overlayBg.setOrigin(0, 0);
    const pauseTitle = this.add.text(CONFIG.width / 2, CONFIG.height / 2 - 60, 'PAUSED', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '36px',
      color: '#ffffff',
    });
    pauseTitle.setOrigin(0.5);

    const resumeBg = this.add.rectangle(CONFIG.width / 2, CONFIG.height / 2, 200, 50, 0xffffff);
    const resumeText = this.add.text(CONFIG.width / 2, CONFIG.height / 2, 'Resume', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '18px',
      color: '#000000',
    });
    resumeText.setOrigin(0.5);
    resumeBg.setInteractive({ useHandCursor: true });
    resumeBg.on('pointerdown', () => this.togglePause());

    const quitBg = this.add.rectangle(CONFIG.width / 2, CONFIG.height / 2 + 70, 200, 50, 0x222222);
    quitBg.setStrokeStyle(2, 0xffffff);
    const quitText = this.add.text(CONFIG.width / 2, CONFIG.height / 2 + 70, 'Quit to Menu', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '16px',
      color: '#ffffff',
    });
    quitText.setOrigin(0.5);
    quitBg.setInteractive({ useHandCursor: true });
    quitBg.on('pointerdown', () => {
      this.scene.start('Menu');
    });

    this.pauseOverlay.add([overlayBg, pauseTitle, resumeBg, resumeText, quitBg, quitText]);
  }

  private updateUI() {
    if (this.uiText[1]) {
      this.uiText[1].setText(`◆ ${this.gemsCollected}/${this.totalGems}`);
    }
  }

  private updateSkillButton() {
    const state = registry.getState();
    const skill = state.selectedSkill;
    if (skill) {
      this.skillButtonText.setText(SKILLS[skill].nameJa);
      this.skillButton.setFillStyle(0x222222);
    } else {
      this.skillButtonText.setText('---');
    }
  }

  private togglePause() {
    this.paused = !this.paused;
    this.physics.world.isPaused = this.paused;
    this.pauseOverlay.setVisible(this.paused);
  }

  private restartLevel() {
    this.scene.restart();
  }

  private onLevelClear() {
    this.cleared = true;
    const state = registry.getState();
    registry.recordClear();
    this.particles.goalReached(this.player.sprite.x, this.player.sprite.y);

    // Upload session data
    const timeMs = this.time.now - this.startTime;
    registry.uploadSession({
      sessionToken: state.sessionToken,
      condition: state.condition,
      world: state.currentWorld,
      stage: state.currentStage,
      difficulty: state.difficulty,
      skill: state.selectedSkill,
      cleared: true,
      timeMs,
      deaths: this.deaths,
      jumpCount: this.jumpCount,
      aiJumpAdjustment: registry.getAIJumpAdjustment(),
    });
    registry.invalidateStats();

    // Determine next level
    const currentIdx = LEVELS.findIndex(
      (l) => l.world === state.currentWorld && l.stage === state.currentStage,
    );

    // Show clear overlay
    this.showClearOverlay(() => {
      if (currentIdx >= 0 && currentIdx < LEVELS.length - 1) {
        const next = LEVELS[currentIdx + 1];
        // Same world — go to next stage
        if (next.world === state.currentWorld) {
          registry.setState({ currentStage: next.stage });
        } else {
          // New world unlocked
          registry.unlockWorld(next.world);
          registry.setState({ currentWorld: next.world, currentStage: 1 });
        }
        this.scene.start('SkillSelect');
      } else {
        // All levels complete
        this.scene.start('Menu');
      }
    });
  }

  private showClearOverlay(onContinue: () => void) {
    const overlay = this.add.container(0, 0);
    overlay.setScrollFactor(0);

    const bg = this.add.rectangle(0, 0, CONFIG.width, CONFIG.height, 0x000000, 0.85);
    bg.setOrigin(0, 0);

    const clearText = this.add.text(CONFIG.width / 2, CONFIG.height / 2 - 80, 'CLEAR!', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '48px',
      color: '#ffffff',
    });
    clearText.setOrigin(0.5);

    const statsText = this.add.text(
      CONFIG.width / 2,
      CONFIG.height / 2 - 10,
      `Gems: ${this.gemsCollected}/${this.totalGems}\nDeaths: ${this.deaths}\nJumps: ${this.jumpCount}\nTime: ${((this.time.now - this.startTime) / 1000).toFixed(1)}s`,
      {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '18px',
        color: '#888888',
        align: 'center',
        lineSpacing: 8,
      },
    );
    statsText.setOrigin(0.5);

    const continueBg = this.add.rectangle(CONFIG.width / 2, CONFIG.height / 2 + 120, 240, 56, 0xffffff);
    const continueText = this.add.text(CONFIG.width / 2, CONFIG.height / 2 + 120, 'CONTINUE', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '22px',
      color: '#000000',
    });
    continueText.setOrigin(0.5);
    continueBg.setInteractive({ useHandCursor: true });
    continueBg.on('pointerdown', () => {
      overlay.destroy();
      onContinue();
    });

    overlay.add([bg, clearText, statsText, continueBg, continueText]);

    // Animate
    this.tweens.add({
      targets: clearText,
      scale: { from: 0, to: 1 },
      duration: 400,
      ease: 'Back.out',
    });
  }

  update(time: number, delta: number) {
    if (this.paused) return;

    // Auto-scroll: move all static bodies and sprites leftward
    const scrollDelta = (this.scrollSpeed * delta) / 1000;
    this.scrollX += scrollDelta;

    // Move static groups
    this.scrollStaticGroup(this.groundGroup, scrollDelta);
    this.scrollStaticGroup(this.wallGroup, scrollDelta);
    this.scrollStaticGroup(this.ceilingGroup, scrollDelta);
    this.scrollStaticGroup(this.spikeGroup, scrollDelta);
    this.scrollStaticGroup(this.platformGroup, scrollDelta);

    // Move gems
    this.gemGroup.getChildren().forEach((gem) => {
      const g = gem as Phaser.Physics.Arcade.Sprite;
      if (g && g.active) {
        g.x -= scrollDelta;
        if (g.x < -50) g.destroy();
      }
    });

    // Move goal
    if (this.goalSprite && this.goalSprite.active) {
      this.goalSprite.x -= scrollDelta;
    }

    // Move enemies
    this.enemies.forEach((enemy) => {
      if (enemy.isAlive()) {
        enemy.update(delta, this.scrollSpeed);
      }
    });

    // Player update
    const grounded =
      this.player.sprite.body!.blocked.down ||
      this.player.sprite.body!.touching.down ||
      this.player.sprite.body!.blocked.up ||
      this.player.sprite.body!.touching.up;

    this.player.update(delta, grounded);

    // Dash trail
    if (this.player.isInvincible() && time % 60 < 16) {
      this.particles.dashTrail(this.player.sprite.x, this.player.sprite.y);
    }

    // Check if player fell off world
    if (this.player.sprite.y > CONFIG.height + 100 || this.player.sprite.y < -200) {
      if (!this.player.isDead()) {
        this.player.takeDamage();
      }
    }

    // Check if player is pushed off left edge by auto-scroll
    if (this.player.sprite.x < 20 && !this.player.isDead()) {
      this.player.takeDamage();
    }
  }

  private scrollStaticGroup(group: Phaser.Physics.Arcade.StaticGroup, delta: number) {
    group.getChildren().forEach((child) => {
      const obj = child as unknown as Phaser.GameObjects.Sprite & { refreshBody?: () => void };
      if (obj && obj.active) {
        obj.x -= delta;
        obj.refreshBody?.();
        if (obj.x < -CONFIG.tileSize) {
          obj.destroy();
        }
      }
    });
  }
}
