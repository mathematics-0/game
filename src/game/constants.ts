// Black & White color palette
export const COLORS = {
  // World
  bg: 0x0a0a0a,
  bgMid: 0x141414,
  bgLight: 0x1e1e1e,

  // Terrain
  ground: 0xffffff,
  groundEdge: 0x888888,
  platform: 0xcccccc,
  platformEdge: 0x666666,
  wall: 0x444444,
  wallEdge: 0x222222,

  // Hazards
  spike: 0xffffff,
  spikeDark: 0xaaaaaa,

  // Player
  player: 0xffffff,
  playerCore: 0x000000,
  playerGlow: 0xffffff,

  // Enemies
  enemy: 0x000000,
  enemyEye: 0xffffff,
  enemyOutline: 0xffffff,

  // Collectibles
  gem: 0xffffff,
  gemCore: 0x999999,
  goal: 0xffffff,
  goalGlow: 0xffffff,

  // UI
  uiBg: 0x0a0a0a,
  uiPanel: 0x1a1a1a,
  uiText: 0xffffff,
  uiTextDim: 0x888888,
  uiAccent: 0xffffff,
  uiDanger: 0xffffff,
  uiSuccess: 0xffffff,

  // Particles
  dust: 0x888888,
  spark: 0xffffff,
  debris: 0xffffff,
} as const;

export const CONFIG = {
  width: 720,
  height: 1080,
  tileSize: 48,
  gravity: 1800,
  playerSpeed: 0,
  baseJumpVel: 580,
  autoScrollSpeed: 120,
  maxHealth: 1,
} as const;

export const DIFFICULTIES = [
  { id: 1, name: 'Easy', nameJa: 'かんたん', scrollSpeed: 90, color: 0x666666 },
  { id: 2, name: 'Normal', nameJa: 'ふつう', scrollSpeed: 120, color: 0x999999 },
  { id: 3, name: 'Hard', nameJa: 'むずかしい', scrollSpeed: 160, color: 0xffffff },
] as const;

export type DifficultyId = 1 | 2 | 3;

export type SkillId = 'doubleJump' | 'dash' | 'gravity' | 'shield' | 'spear';

export interface SkillDef {
  id: SkillId;
  name: string;
  nameJa: string;
  description: string;
  icon: 'circle' | 'triangle' | 'diamond' | 'hexagon' | 'star';
}

export const SKILLS: Record<SkillId, SkillDef> = {
  doubleJump: {
    id: 'doubleJump',
    name: 'Double Jump',
    nameJa: '2段ジャンプ',
    description: '空中でもう一度ジャンプできる。',
    icon: 'circle',
  },
  dash: {
    id: 'dash',
    name: 'Dash',
    nameJa: 'ダッシュ',
    description: '前方に高速移動し、無敵時間を得る。',
    icon: 'triangle',
  },
  gravity: {
    id: 'gravity',
    name: 'Gravity Flip',
    nameJa: '重力反転',
    description: '重力を反転させ、天井を走れる。',
    icon: 'diamond',
  },
  shield: {
    id: 'shield',
    name: 'Shield',
    nameJa: 'シールド',
    description: 'ダメージを1回無効化する。',
    icon: 'hexagon',
  },
  spear: {
    id: 'spear',
    name: 'Spear Arc',
    nameJa: '範囲攻撃',
    description: '前方に弧状の攻撃を放つ。',
    icon: 'star',
  },
};

export const ALL_SKILL_IDS: SkillId[] = ['doubleJump', 'dash', 'gravity', 'shield', 'spear'];

export interface WorldDef {
  world: number;
  name: string;
  nameJa: string;
}

export const WORLDS: WorldDef[] = [
  { world: 1, name: 'Tutorial', nameJa: 'チュートリアル' },
  { world: 2, name: 'Beginning', nameJa: '本編開始' },
  { world: 3, name: 'Branch', nameJa: '分岐' },
  { world: 4, name: 'Challenge', nameJa: '難関' },
  { world: 5, name: 'Final', nameJa: '最終' },
];

// AI jump adjustment config
export const AI_CONFIG = {
  // How much of the adjustment is based on recent failure rate
  failureWeight: 0.6,
  // How much is based on difficulty
  difficultyWeight: 0.3,
  // Base correction factor when struggling (multiplier on jump velocity)
  maxAdjustment: 0.18,
  // Number of recent sessions to consider
  recentSessionWindow: 5,
  // Min sessions before AI adjustment activates
  minSessionsForAI: 3,
} as const;
