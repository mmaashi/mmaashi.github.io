/**
 * SŪQAI Scoring Engine — Barrel Export
 *
 * Usage:
 *   import { calculateAllScores } from '@/lib/scoring';
 *   const result = calculateAllScores(metricsRow);
 */

export type { Check, PillarResult, ScoringInput, ScoreResult } from "./types";

export {
  calculateAllScores,
  calculateValueScore,
  calculateGrowthScore,
  calculatePerformanceScore,
  calculateHealthScore,
  calculateDividendScore,
  generateRiskFlags,
  generateInsightBadges,
} from "./engine";
