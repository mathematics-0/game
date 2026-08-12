import Phaser from 'phaser';
import { COLORS, CONFIG, WORLDS, DIFFICULTIES, type DifficultyId } from '../constants';
import { registry } from '../registry';
import { LEVELS } from '../levels';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    const w = CONFIG.width;
    const h = CONFIG.height;
    this.cameras.main.setBackgroundColor(COLORS.bg);

    const state = registry.getState();

    // Title
    const title = this.add.text(w / 2, 80, 'GEOMETRIC QUEST', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '36px',
      color: '#ffffff',
    });
    title.setOrigin(0.5);

    const conditionLabel = this.add.text(w / 2, 120, `Condition ${state.condition}`, {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '14px',
      color: '#888888',
    });
    conditionLabel.setOrigin(0.5);

    // Stats summary
    const statsText = `Clears: ${state.totalClears}  Deaths: ${state.totalDeaths}  Jumps: ${state.totalJumps}`;
    const stats = this.add.text(w / 2, 150, statsText, {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '14px',
      color: '#666666',
    });
    stats.setOrigin(0.5);

    // Difficulty selection
    const diffLabel = this.add.text(w / 2, 210, 'DIFFICULTY', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '16px',
      color: '#888888',
    });
    diffLabel.setOrigin(0.5);

    const diffButtons: Phaser.GameObjects.Container[] = [];
    DIFFICULTIES.forEach((diff, idx) => {
      const bx = w / 2 - 180 + idx * 120;
      const by = 260;
      const isSelected = state.difficulty === diff.id;
      const bg = this.add.rectangle(bx, by, 100, 50, isSelected ? 0xffffff : 0x222222);
      bg.setStrokeStyle(2, 0xffffff);
      const txt = this.add.text(bx, by, diff.nameJa, {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '16px',
        color: isSelected ? '#000000' : '#ffffff',
      });
      txt.setOrigin(0.5);
      const container = this.add.container(0, 0, [bg, txt]);
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => {
        registry.setDifficulty(diff.id as DifficultyId);
        this.scene.restart();
      });
      diffButtons.push(container);
    });

    // AI recommended difficulty
    const recDiff = registry.getRecommendedDifficulty();
    if (recDiff !== null) {
      const recName = DIFFICULTIES.find((d) => d.id === recDiff)?.nameJa ?? '';
      const recText = this.add.text(w / 2, 305, `おすすめ: ${recName}`, {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '13px',
        color: '#ffffff',
        backgroundColor: '#333333',
        padding: { x: 12, y: 6 },
      });
      recText.setOrigin(0.5);
    }

    // World select
    const worldLabel = this.add.text(w / 2, 360, 'SELECT WORLD', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '16px',
      color: '#888888',
    });
    worldLabel.setOrigin(0.5);

    WORLDS.forEach((worldDef, idx) => {
      const wx = w / 2 - 240 + (idx % 3) * 160;
      const wy = 420 + Math.floor(idx / 3) * 140;
      const unlocked = state.unlockedWorlds.includes(worldDef.world);

      const cardBg = this.add.rectangle(wx, wy, 140, 110, unlocked ? 0x1a1a1a : 0x0a0a0a);
      cardBg.setStrokeStyle(2, unlocked ? 0xffffff : 0x333333);

      const wName = this.add.text(wx, wy - 20, `WORLD ${worldDef.world}`, {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '14px',
        color: unlocked ? '#ffffff' : '#444444',
      });
      wName.setOrigin(0.5);

      const wJa = this.add.text(wx, wy + 5, worldDef.nameJa, {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '18px',
        color: unlocked ? '#ffffff' : '#444444',
      });
      wJa.setOrigin(0.5);

      // Count cleared stages in this world
      const worldLevels = LEVELS.filter((l) => l.world === worldDef.world);
      const stageCount = this.add.text(wx, wy + 35, `${worldLevels.length} stages`, {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '12px',
        color: unlocked ? '#888888' : '#333333',
      });
      stageCount.setOrigin(0.5);

      if (!unlocked) {
        const lock = this.add.text(wx, wy - 45, '🔒', {
          fontSize: '24px',
        });
        lock.setOrigin(0.5);
      }

      if (unlocked) {
        cardBg.setInteractive({ useHandCursor: true });
        cardBg.on('pointerdown', () => {
          registry.setState({ currentWorld: worldDef.world, currentStage: 1 });
          this.scene.start('SkillSelect');
        });

        this.tweens.add({
          targets: cardBg,
          scaleX: 1.03,
          scaleY: 1.03,
          duration: 600,
          yoyo: true,
          repeat: -1,
          delay: idx * 100,
          ease: 'Sine.inOut',
        });
      }
    });

    // Reset button
    const resetBg = this.add.rectangle(w / 2, h - 60, 160, 40, 0x111111);
    resetBg.setStrokeStyle(1, 0x444444);
    const resetText = this.add.text(w / 2, h - 60, 'Reset Progress', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '14px',
      color: '#888888',
    });
    resetText.setOrigin(0.5);
    resetBg.setInteractive({ useHandCursor: true });
    resetBg.on('pointerdown', () => {
      registry.resetProgress();
      this.scene.restart();
    });
  }
}
