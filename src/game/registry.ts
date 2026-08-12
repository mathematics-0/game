import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AI_CONFIG, DIFFICULTIES, type SkillId, type DifficultyId } from './constants';
import type { Condition, GameState, JumpEventRecord, SessionRecord, PlayerStats } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient | null {
  if (!supabase && SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabase;
}

const STORAGE_KEY = 'gq_save';

function generateSessionToken(): string {
  return 's_' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
}

function createDefaultState(condition: Condition): GameState {
  return {
    condition,
    sessionToken: generateSessionToken(),
    currentWorld: 1,
    currentStage: 1,
    difficulty: 2,
    selectedSkill: null,
    unlockedWorlds: [1],
    totalDeaths: 0,
    totalJumps: 0,
    totalClears: 0,
  };
}

class GameRegistry {
  private state: GameState;
  private pendingJumps: JumpEventRecord[] = [];
  private cachedStats: PlayerStats | null = null;

  constructor() {
    const condition = this.parseConditionFromURL();
    this.state = this.loadState(condition);
  }

  private parseConditionFromURL(): Condition {
    const path = window.location.pathname.toLowerCase();
    if (path.endsWith('/b') || path.includes('/b/') || path === '/b') {
      return 'B';
    }
    return 'A';
  }

  private loadState(condition: Condition): GameState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const loaded = { ...createDefaultState(condition), ...parsed };
        loaded.condition = condition;
        return loaded;
      }
    } catch {
      // ignore
    }
    return createDefaultState(condition);
  }

  private saveLocal() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // ignore
    }
  }

  getState(): GameState {
    return { ...this.state };
  }

  getCondition(): Condition {
    return this.state.condition;
  }

  setState(partial: Partial<GameState>) {
    this.state = { ...this.state, ...partial };
    this.saveLocal();
  }

  setDifficulty(d: DifficultyId) {
    this.state.difficulty = d;
    this.saveLocal();
  }

  setSelectedSkill(skill: SkillId | null) {
    this.state.selectedSkill = skill;
    this.saveLocal();
  }

  unlockWorld(world: number) {
    if (!this.state.unlockedWorlds.includes(world)) {
      this.state.unlockedWorlds = [...this.state.unlockedWorlds, world];
      this.saveLocal();
    }
  }

  recordDeath() {
    this.state.totalDeaths++;
    this.saveLocal();
  }

  recordClear() {
    this.state.totalClears++;
    this.saveLocal();
  }

  recordJump() {
    this.state.totalJumps++;
    this.saveLocal();
  }

  // Queue a jump event for batch upload
  queueJumpEvent(event: JumpEventRecord) {
    this.pendingJumps.push(event);
  }

  // Upload session + jump events to Supabase
  async uploadSession(record: SessionRecord) {
    const sb = getSupabase();
    if (!sb) { this.pendingJumps = []; return; }
    try {
      const { data: sessionData } = await sb
        .from('sessions')
        .insert({
          session_token: record.sessionToken,
          condition: record.condition,
          world: record.world,
          stage: record.stage,
          difficulty: record.difficulty,
          skill: record.skill,
          cleared: record.cleared,
          time_ms: record.timeMs,
          deaths: record.deaths,
          jump_count: record.jumpCount,
          ai_jump_adjustment: record.aiJumpAdjustment,
        })
        .select('id')
        .maybeSingle();

      if (sessionData && this.pendingJumps.length > 0) {
        const jumps = this.pendingJumps.map((j) => ({
          session_id: sessionData.id,
          session_token: record.sessionToken,
          condition: j.condition,
          world: j.world,
          stage: j.stage,
          difficulty: j.difficulty,
          skill: j.skill,
          x_position: j.xPosition,
          y_position: j.yPosition,
          jump_velocity: j.jumpVelocity,
          base_jump_velocity: j.baseJumpVelocity,
          ai_adjustment: j.aiAdjustment,
          cleared: j.cleared,
        }));
        await sb.from('jump_events').insert(jumps);
        this.pendingJumps = [];
      }
    } catch {
      // Upload failure is non-fatal; data stays queued for next attempt
    }
  }

  // Fetch player stats from Supabase for AI recommendation
  async fetchPlayerStats(): Promise<PlayerStats> {
    if (this.cachedStats) return this.cachedStats;

    const defaultStats: PlayerStats = {
      totalSessions: 0,
      recentClearRate: 0,
      recentAvgJumps: 0,
      recentAvgDeaths: 0,
      recommendedDifficulty: 2,
      recommendedJumpAdjustment: 0,
    };

    const sb = getSupabase();
    if (!sb) return defaultStats;
    try {
      const token = this.state.sessionToken;
      const { data: recent } = await sb
        .from('sessions')
        .select('cleared, deaths, jump_count, difficulty')
        .eq('session_token', token)
        .order('created_at', { ascending: false })
        .limit(AI_CONFIG.recentSessionWindow);

      const { count: totalCount } = await sb
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .eq('session_token', token);

      if (!recent || recent.length === 0) {
        this.cachedStats = { ...defaultStats, totalSessions: totalCount ?? 0 };
        return this.cachedStats;
      }

      const clearRate = recent.filter((s) => s.cleared).length / recent.length;
      const avgDeaths = recent.reduce((sum, s) => sum + s.deaths, 0) / recent.length;
      const avgJumps = recent.reduce((sum, s) => sum + s.jump_count, 0) / recent.length;

      // Recommend difficulty based on performance
      let recommendedDifficulty: DifficultyId = 2;
      if (clearRate > 0.7 && avgDeaths < 1) {
        recommendedDifficulty = 3;
      } else if (clearRate < 0.3 || avgDeaths > 3) {
        recommendedDifficulty = 1;
      }

      // AI jump adjustment (condition B only)
      let recommendedJumpAdjustment = 0;
      const totalSessions = recent.length;
      if (totalSessions >= AI_CONFIG.minSessionsForAI) {
        const failureRate = 1 - clearRate;
        const adjustment =
          failureRate * AI_CONFIG.failureWeight +
          (3 - this.state.difficulty) * 0.1 * AI_CONFIG.difficultyWeight;
        recommendedJumpAdjustment = Math.min(AI_CONFIG.maxAdjustment, Math.max(0, adjustment));
      }

      this.cachedStats = {
        totalSessions: totalCount ?? totalSessions,
        recentClearRate: clearRate,
        recentAvgJumps: avgJumps,
        recentAvgDeaths: avgDeaths,
        recommendedDifficulty,
        recommendedJumpAdjustment,
      };
      return this.cachedStats;
    } catch {
      return defaultStats;
    }
  }

  // Get the AI jump velocity multiplier for condition B
  getAIJumpAdjustment(): number {
    if (this.state.condition !== 'B') return 0;
    if (!this.cachedStats) return 0;
    return this.cachedStats.recommendedJumpAdjustment;
  }

  // Get recommended difficulty for display
  getRecommendedDifficulty(): DifficultyId | null {
    if (!this.cachedStats || this.cachedStats.totalSessions < AI_CONFIG.minSessionsForAI) {
      return null;
    }
    return this.cachedStats.recommendedDifficulty;
  }

  invalidateStats() {
    this.cachedStats = null;
  }

  // Pre-fetch stats so AI recommendations are ready before gameplay
  async prefetchStats() {
    if (!this.cachedStats) {
      await this.fetchPlayerStats();
    }
  }

  getScrollSpeed(): number {
    const diff = DIFFICULTIES.find((d) => d.id === this.state.difficulty);
    return diff?.scrollSpeed ?? 120;
  }

  resetProgress() {
    const condition = this.state.condition;
    this.state = createDefaultState(condition);
    this.cachedStats = null;
    this.pendingJumps = [];
    this.saveLocal();
  }
}

export const registry = new GameRegistry();
