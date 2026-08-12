import type { SkillId, DifficultyId } from './constants';

export type Condition = 'A' | 'B';

export interface LevelData {
  world: number;
  stage: number;
  name: string;
  tiles: string[];
}

export interface GameState {
  condition: Condition;
  sessionToken: string;
  currentWorld: number;
  currentStage: number;
  difficulty: DifficultyId;
  selectedSkill: SkillId | null;
  unlockedWorlds: number[];
  totalDeaths: number;
  totalJumps: number;
  totalClears: number;
}

export interface JumpEventRecord {
  world: number;
  stage: number;
  difficulty: DifficultyId;
  skill: SkillId | null;
  condition: Condition;
  xPosition: number;
  yPosition: number;
  jumpVelocity: number;
  baseJumpVelocity: number;
  aiAdjustment: number;
  cleared: boolean;
}

export interface SessionRecord {
  sessionToken: string;
  condition: Condition;
  world: number;
  stage: number;
  difficulty: DifficultyId;
  skill: SkillId | null;
  cleared: boolean;
  timeMs: number;
  deaths: number;
  jumpCount: number;
  aiJumpAdjustment: number;
}

// Stats fetched from Supabase for AI recommendation
export interface PlayerStats {
  totalSessions: number;
  recentClearRate: number;
  recentAvgJumps: number;
  recentAvgDeaths: number;
  recommendedDifficulty: DifficultyId;
  recommendedJumpAdjustment: number;
}
