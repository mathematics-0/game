import Phaser from 'phaser';
import { COLORS, CONFIG, SKILLS, ALL_SKILL_IDS, type SkillId } from '../constants';
import { registry } from '../registry';

export class SkillSelectScene extends Phaser.Scene {
  private selectedSkill: SkillId | null = null;

  constructor() {
    super('SkillSelect');
  }

  create() {
    const w = CONFIG.width;
    const h = CONFIG.height;
    this.cameras.main.setBackgroundColor(COLORS.bg);

    const state = registry.getState();

    // Header
    const header = this.add.text(w / 2, 60, `WORLD ${state.currentWorld} - STAGE ${state.currentStage}`, {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '22px',
      color: '#888888',
    });
    header.setOrigin(0.5);

    const title = this.add.text(w / 2, 100, 'SELECT SKILL', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '28px',
      color: '#ffffff',
    });
    title.setOrigin(0.5);

    const subtitle = this.add.text(w / 2, 135, '1つだけ選択可能', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '14px',
      color: '#666666',
    });
    subtitle.setOrigin(0.5);

    // AI recommendation panel (condition B only)
    if (state.condition === 'B') {
      const adjustment = registry.getAIJumpAdjustment();
      if (adjustment > 0) {
        const aiPanel = this.add.rectangle(w / 2, 180, w - 60, 50, 0x1a1a1a);
        aiPanel.setStrokeStyle(1, 0xffffff);
        const aiText = this.add.text(w / 2, 180, `AI: Jump power +${Math.round(adjustment * 100)}%`, {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '15px',
          color: '#ffffff',
        });
        aiText.setOrigin(0.5);
      }
    }

    // Skill cards
    const cardW = 300;
    const cardH = 110;
    const startY = 240;
    const gap = 20;

    ALL_SKILL_IDS.forEach((skillId, idx) => {
      const skill = SKILLS[skillId];
      const cx = w / 2;
      const cy = startY + idx * (cardH + gap);

      const bg = this.add.rectangle(cx, cy, cardW, cardH, 0x111111);
      bg.setStrokeStyle(2, 0x333333);

      // Icon
      this.drawSkillIcon(cx - 110, cy, skill.icon);

      // Name
      const nameText = this.add.text(cx - 70, cy - 20, skill.nameJa, {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '20px',
        color: '#ffffff',
      });
      nameText.setOrigin(0, 0.5);

      // Description
      const descText = this.add.text(cx - 70, cy + 10, skill.description, {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '13px',
        color: '#888888',
        wordWrap: { width: 240 },
      });
      descText.setOrigin(0, 0.5);

      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => {
        if (this.selectedSkill !== skillId) {
          bg.setFillStyle(0x1a1a1a);
          bg.setStrokeStyle(2, 0x888888);
        }
      });
      bg.on('pointerout', () => {
        if (this.selectedSkill !== skillId) {
          bg.setFillStyle(0x111111);
          bg.setStrokeStyle(2, 0x333333);
        }
      });
      bg.on('pointerdown', () => {
        this.selectedSkill = skillId;
        registry.setSelectedSkill(skillId);
        this.refreshCards();
      });

      // Store reference for refresh
      (bg as Phaser.GameObjects.Rectangle & { _skillId?: SkillId })._skillId = skillId;
    });

    this.refreshCards();

    // No skill option
    const noSkillBg = this.add.rectangle(w / 2, startY + ALL_SKILL_IDS.length * (cardH + gap) + 10, cardW, 50, 0x111111);
    noSkillBg.setStrokeStyle(2, 0x333333);
    const noSkillText = this.add.text(w / 2, startY + ALL_SKILL_IDS.length * (cardH + gap) + 10, 'スキルなし', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '16px',
      color: '#888888',
    });
    noSkillText.setOrigin(0.5);
    noSkillBg.setInteractive({ useHandCursor: true });
    noSkillBg.on('pointerdown', () => {
      this.selectedSkill = null;
      registry.setSelectedSkill(null);
      this.refreshCards();
    });
    (noSkillBg as Phaser.GameObjects.Rectangle & { _skillId?: SkillId })._skillId = undefined;

    // Start button
    const startBg = this.add.rectangle(w / 2, h - 80, 240, 56, 0xffffff);
    const startText = this.add.text(w / 2, h - 80, 'START', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '22px',
      color: '#000000',
    });
    startText.setOrigin(0.5);
    startBg.setInteractive({ useHandCursor: true });
    startBg.on('pointerover', () => {
      startBg.setScale(1.05);
    });
    startBg.on('pointerout', () => {
      startBg.setScale(1.0);
    });
    startBg.on('pointerdown', () => {
      this.scene.start('Game');
    });
  }

  private refreshCards() {
    this.children.list.forEach((child) => {
      if (child instanceof Phaser.GameObjects.Rectangle) {
        const skillId = (child as Phaser.GameObjects.Rectangle & { _skillId?: SkillId })._skillId;
        if (skillId !== undefined) {
          if (this.selectedSkill === skillId) {
            child.setFillStyle(0xffffff);
            child.setStrokeStyle(3, 0xffffff);
          } else {
            child.setFillStyle(0x111111);
            child.setStrokeStyle(2, 0x333333);
          }
        }
      }
    });
  }

  private drawSkillIcon(x: number, y: number, shape: string): Phaser.GameObjects.Shape {
    const size = 24;
    switch (shape) {
      case 'circle':
        return this.add.circle(x, y, size / 2, 0xffffff);
      case 'triangle':
        const tri = this.add.triangle(x, y, 0, -size / 2, size / 2, size / 2, -size / 2, size / 2, 0xffffff);
        return tri;
      case 'diamond':
        const dia = this.add.polygon(x, y, [0, -size / 2, size / 2, 0, 0, size / 2, -size / 2, 0], 0xffffff);
        return dia;
      case 'hexagon':
        const hexPts: number[] = [];
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3 - Math.PI / 2;
          hexPts.push(Math.cos(a) * size / 2, Math.sin(a) * size / 2);
        }
        return this.add.polygon(x, y, hexPts, 0xffffff);
      case 'star':
        const starPts: number[] = [];
        for (let i = 0; i < 10; i++) {
          const a = (i * Math.PI) / 5 - Math.PI / 2;
          const r = i % 2 === 0 ? size / 2 : size / 4;
          starPts.push(Math.cos(a) * r, Math.sin(a) * r);
        }
        return this.add.polygon(x, y, starPts, 0xffffff);
      default:
        return this.add.circle(x, y, size / 2, 0xffffff);
    }
  }
}
