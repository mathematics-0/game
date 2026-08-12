import Phaser from 'phaser';
import { generateTextures } from '../textures';
import { COLORS, CONFIG } from '../constants';
import { registry } from '../registry';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    const w = CONFIG.width;
    const h = CONFIG.height;

    this.cameras.main.setBackgroundColor(COLORS.bg);

    // Generate all textures
    generateTextures(this);

    // Pre-fetch AI stats in the background (non-blocking)
    registry.prefetchStats();

    // Loading text
    const loadingText = this.add.text(w / 2, h / 2 - 40, 'LOADING', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '32px',
      color: '#ffffff',
    });
    loadingText.setOrigin(0.5);

    // Animated dots bar
    const barW = 200;
    const barH = 4;
    const barX = w / 2 - barW / 2;
    const barY = h / 2 + 20;

    const bgBar = this.add.rectangle(barX + barW / 2, barY, barW, barH, 0x222222);
    bgBar.setVisible(true);

    const fillBar = this.add.rectangle(barX, barY, 0, barH, 0xffffff);
    fillBar.setOrigin(0, 0.5);

    this.tweens.add({
      targets: fillBar,
      width: barW,
      duration: 800,
      ease: 'Power2',
      onComplete: () => {
        this.scene.start('Menu');
      },
    });
  }
}
