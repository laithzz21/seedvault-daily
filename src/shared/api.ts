import type { Placement, Puzzle, ScoreResult } from './game';

export type InitResponse = {
  type: 'init';
  postId: string;
  /** UTC date string, YYYY-MM-DD — the puzzle day. */
  date: string;
  username: string | null;
  snoovatarUrl: string | null;
  puzzle: Puzzle;
  /** The player's best submission today, if any. */
  played: {
    score: number;
    placements: Placement[];
    rank: number;
  } | null;
  /** Consecutive days played, including today if already played. */
  streak: number;
  playersToday: number;
};

export type SubmitRequest = {
  placements: Placement[];
};

export type SubmitResponse = {
  type: 'submit';
  score: ScoreResult;
  /** 1-based rank among today's players (highest score = 1). */
  rank: number;
  playersToday: number;
  streak: number;
  isNewBest: boolean;
};

export type LeaderboardEntry = {
  rank: number;
  username: string;
  snoovatarUrl: string | null;
  score: number;
  isYou: boolean;
};

export type LeaderboardResponse = {
  type: 'leaderboard';
  date: string;
  entries: LeaderboardEntry[];
  playerRank: number | null;
  playersToday: number;
};

export type ErrorResponse = {
  status: 'error';
  message: string;
};
