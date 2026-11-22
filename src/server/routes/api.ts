import { Hono } from 'hono';
import { context } from '@devvit/web/server';
import {
  generatePuzzle,
  scorePlacement,
  todayDateString,
  validatePlacements,
  type Placement,
} from '../../shared/game';
import type {
  ErrorResponse,
  InitResponse,
  LeaderboardResponse,
  SubmitResponse,
} from '../../shared/api';
import {
  getPlayed,
  getPlayersToday,
  getRank,
  getStreak,
  getTopPlayers,
  parsePlacements,
  recordPlay,
  recordScore,
} from '../core/state';

export const apiRouter = new Hono();

const error = (message: string): ErrorResponse => ({
  status: 'error',
  message,
});

/**
 * GET /api/init — the game bootstrap. Returns today's puzzle, the player's
 * best submission today (if any), their streak, and how many gardens have
 * been grown today. Works for guests too (no userId): they can play
 * locally, but submitting needs a signed-in account.
 */
apiRouter.get('/init', async (c) => {
  const date = todayDateString();
  const userId = context.userId;
  const puzzle = generatePuzzle(date);

  let played: InitResponse['played'] = null;
  let streak = 0;
  if (userId !== undefined) {
    const record = await getPlayed(userId, date);
    streak = await getStreak(userId);
    if (record !== null) {
      const rank = await getRank(userId, date);
      played = {
        score: record.score,
        placements: record.placements,
        rank: rank ?? 0,
      };
    }
  }

  const playersToday = await getPlayersToday(date);
  const response: InitResponse = {
    type: 'init',
    postId: context.postId ?? '',
    date,
    username: context.username ?? null,
    snoovatarUrl: context.snoovatar ?? null,
    puzzle,
    played,
    streak,
    playersToday,
  };
  return c.json(response);
});

/**
 * POST /api/submit — validate and score a garden. The server regenerates
 * the day's puzzle from the date and re-scores from scratch, so the client
 * can never inflate a score. A player may re-submit, but only a better
 * score replaces their best.
 */
apiRouter.post('/submit', async (c) => {
  const userId = context.userId;
  if (userId === undefined) {
    return c.json<ErrorResponse>(
      error('Sign in to Reddit to grow your garden.'),
      401,
    );
  }

  const body: unknown = await c.req.json().catch(() => null);
  let placements: Placement[] | null = null;
  if (typeof body === 'object' && body !== null && 'placements' in body) {
    placements = parsePlacements(body.placements);
  }
  if (placements === null) {
    return c.json<ErrorResponse>(
      error('That garden did not arrive in one piece. Try again.'),
      400,
    );
  }

  const date = todayDateString();
  const puzzle = generatePuzzle(date);
  const validationError = validatePlacements(puzzle, placements);
  if (validationError !== null) {
    return c.json<ErrorResponse>(error(validationError), 400);
  }

  const score = scorePlacement(puzzle, placements);
  const previous = await getPlayed(userId, date);
  const isNewBest = previous === null || score.total > previous.score;
  if (isNewBest) {
    await recordScore(
      userId,
      date,
      score.total,
      context.username ?? 'gardener',
      context.snoovatar ?? null,
      placements,
    );
  }
  const streak = await recordPlay(userId, date);
  const rank = await getRank(userId, date);
  const playersToday = await getPlayersToday(date);

  const response: SubmitResponse = {
    type: 'submit',
    score,
    rank: rank ?? 0,
    playersToday,
    streak,
    isNewBest,
  };
  return c.json(response);
});

/** GET /api/leaderboard — today's top 10 gardens plus the player's rank. */
apiRouter.get('/leaderboard', async (c) => {
  const date = todayDateString();
  const userId = context.userId;
  const rows = await getTopPlayers(date);
  const playerRank =
    userId === undefined ? null : await getRank(userId, date);
  const playersToday = await getPlayersToday(date);

  const response: LeaderboardResponse = {
    type: 'leaderboard',
    date,
    entries: rows.map((row, index) => ({
      rank: index + 1,
      username: row.username,
      snoovatarUrl: row.snoovatarUrl,
      score: row.score,
      isYou: row.userId === userId,
    })),
    playerRank,
    playersToday,
  };
  return c.json(response);
});
