import Phaser from 'phaser';
import { COLORS, CONFIG } from './constants';

export function generateTextures(scene: Phaser.Scene) {
  const g = scene.add.graphics();

  // Player — white rounded square with black inner core
  g.clear();
  g.fillStyle(COLORS.player, 1);
  g.fillRoundedRect(2, 2, 28, 28, 6);
  g.fillStyle(COLORS.playerCore, 0.8);
  g.fillRoundedRect(8, 8, 16, 16, 3);
  g.generateTexture('player', 32, 32);
  g.clear();

  // Ground block — white with gray bottom edge
  g.fillStyle(COLORS.ground, 1);
  g.fillRect(0, 0, CONFIG.tileSize, CONFIG.tileSize);
  g.fillStyle(COLORS.groundEdge, 1);
  g.fillRect(0, CONFIG.tileSize - 4, CONFIG.tileSize, 4);
  g.generateTexture('ground', CONFIG.tileSize, CONFIG.tileSize);
  g.clear();

  // Platform (one-way) — light gray bar
  g.fillStyle(COLORS.platform, 1);
  g.fillRoundedRect(0, 0, CONFIG.tileSize, 12, 3);
  g.fillStyle(COLORS.platformEdge, 1);
  g.fillRect(0, 10, CONFIG.tileSize, 2);
  g.generateTexture('platform', CONFIG.tileSize, 12);
  g.clear();

  // Wall — dark gray with darker edges
  g.fillStyle(COLORS.wall, 1);
  g.fillRect(0, 0, CONFIG.tileSize, CONFIG.tileSize);
  g.fillStyle(COLORS.wallEdge, 1);
  g.fillRect(0, 0, 4, CONFIG.tileSize);
  g.fillRect(CONFIG.tileSize - 4, 0, 4, CONFIG.tileSize);
  g.fillStyle(0x333333, 0.5);
  for (let i = 0; i < CONFIG.tileSize; i += 8) {
    g.fillRect(4, i, CONFIG.tileSize - 8, 1);
  }
  g.generateTexture('wall', CONFIG.tileSize, CONFIG.tileSize);
  g.clear();

  // Spike — white triangle
  g.fillStyle(COLORS.spike, 1);
  g.beginPath();
  g.moveTo(0, CONFIG.tileSize);
  g.lineTo(CONFIG.tileSize / 2, 0);
  g.lineTo(CONFIG.tileSize, CONFIG.tileSize);
  g.closePath();
  g.fillPath();
  g.fillStyle(COLORS.spikeDark, 0.4);
  g.fillRect(0, CONFIG.tileSize - 3, CONFIG.tileSize, 3);
  g.generateTexture('spike', CONFIG.tileSize, CONFIG.tileSize);
  g.clear();

  // Walker enemy — black square with white outline and eyes
  g.lineStyle(2, COLORS.enemyOutline, 1);
  g.fillStyle(COLORS.enemy, 1);
  g.fillRoundedRect(4, 4, 32, 32, 4);
  g.strokeRoundedRect(4, 4, 32, 32, 4);
  g.fillStyle(COLORS.enemyEye, 1);
  g.fillRect(12, 12, 6, 6);
  g.fillRect(22, 12, 6, 6);
  g.fillStyle(COLORS.playerCore, 1);
  g.fillRect(14, 14, 3, 3);
  g.fillRect(24, 14, 3, 3);
  g.generateTexture('enemy_walker', 40, 40);
  g.clear();

  // Flyer enemy — black diamond with white outline
  g.lineStyle(2, COLORS.enemyOutline, 1);
  g.fillStyle(COLORS.enemy, 1);
  g.beginPath();
  g.moveTo(20, 4);
  g.lineTo(36, 20);
  g.lineTo(20, 36);
  g.lineTo(4, 20);
  g.closePath();
  g.fillPath();
  g.strokePath();
  g.fillStyle(COLORS.enemyEye, 0.9);
  g.fillCircle(20, 18, 5);
  g.fillStyle(COLORS.playerCore, 1);
  g.fillCircle(20, 18, 2);
  g.generateTexture('enemy_flyer', 40, 40);
  g.clear();

  // Gem — white diamond
  g.fillStyle(COLORS.gem, 1);
  g.beginPath();
  g.moveTo(12, 0);
  g.lineTo(24, 0);
  g.lineTo(32, 12);
  g.lineTo(18, 32);
  g.lineTo(4, 12);
  g.closePath();
  g.fillPath();
  g.fillStyle(COLORS.gemCore, 0.6);
  g.beginPath();
  g.moveTo(14, 4);
  g.lineTo(22, 4);
  g.lineTo(18, 16);
  g.lineTo(10, 12);
  g.closePath();
  g.fillPath();
  g.generateTexture('gem', 36, 32);
  g.clear();

  // Goal — white glowing column with flag
  g.fillStyle(COLORS.goal, 1);
  g.fillRoundedRect(14, 0, 12, 80, 4);
  g.fillStyle(COLORS.goalGlow, 0.3);
  g.fillRoundedRect(8, 0, 24, 80, 6);
  g.fillStyle(COLORS.goal, 1);
  g.beginPath();
  g.moveTo(26, 10);
  g.lineTo(50, 18);
  g.lineTo(26, 26);
  g.closePath();
  g.fillPath();
  g.generateTexture('goal', 60, 80);
  g.clear();

  // Particle textures (monochrome)
  g.fillStyle(0xffffff, 1);
  g.fillCircle(4, 4, 4);
  g.generateTexture('particle_white', 8, 8);
  g.clear();

  g.fillStyle(0x888888, 1);
  g.fillCircle(3, 3, 3);
  g.generateTexture('particle_dust', 6, 6);
  g.clear();

  g.fillStyle(0xffffff, 1);
  g.fillCircle(3, 3, 3);
  g.generateTexture('particle_spark', 6, 6);
  g.clear();

  g.fillStyle(0xffffff, 1);
  g.fillRect(0, 0, 5, 5);
  g.generateTexture('particle_debris', 5, 5);
  g.clear();

  g.fillStyle(0xffffff, 1);
  g.fillRect(0, 0, 3, 3);
  g.generateTexture('particle_shield', 3, 3);
  g.clear();

  g.destroy();
}
