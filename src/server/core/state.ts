import { redis } from '@devvit/web/server';
import { PLANT_IDS, type Placement, type PlantId } from '../../shared/game';

/** Daily leaderboards and play records live for 3 days after their last write. */
export const DAY_TTL_SECONDS = 3 * 24 * 60 * 60;

const leaderboardKey = (date: string): string => `lb:${date}`;
const leaderboardMetaKey = (date: string): string => `lbmeta:${date}`;
const playedKey = (userId: string, date: string): string =>
  `played:${userId}:${date}`;
const streakKey = (userId: string): string => `streak:${userId}`;
const streakDateKey = (userId: string): string => `streakdate:${userId}`;

export const isPlantId = (value: string): value is PlantId =>
  PLANT_IDS.some((id) => id === value);

/** Parse an unknown value into placements, or null when malformed. */
export const parsePlacements = (value: unknown): Placement[] | null => {
  if (!Array.isArray(value)) return null;
  const out: Placement[] = [];
  for (const item of value) {
    if (typeof item !== 'object' || item === null) return null;
    if (!('plant' in item) || !('row' in item) || !('col' in item)) return null;
    const { plant, row, col } = item;
    if (typeof plant !== 'string' || !isPlantId(plant)) return null;
    if (typeof row !== 'number' || typeof col !== 'number') return null;
    out.push({ plant, row, col });
  }
  return out;
};

export type PlayedRecord = {
  score: number;
  placements: Placement[];
};

/** The player's best submission for a date, if any. */
export const getPlayed = async (
  userId: string,
  date: string,
): Promise<PlayedRecord | null> => {
  const raw = await redis.get(playedKey(userId, date));
  if (raw === undefined) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  const placements = parsePlacements(parsed);
  if (placements === null) return null;
  const score = await redis.zScore(leaderboardKey(date), userId);
  if (score === undefined) return null;
  return { score, placements };
};

/** How many players have submitted for a date. */
export const getPlayersToday = async (date: string): Promise<number> =>
  redis.zCard(leaderboardKey(date));

/**
 * 1-based rank for a player (highest score = 1), or null when they have not
 * submitted. `zRank` counts from the lowest score, so rank = total - zRank.
 */
export const getRank = async (
  userId: string,
  date: string,
): Promise<number | null> => {
  const key = leaderboardKey(date);
  const [rankAsc, total] = await Promise.all([
    redis.zRank(key, userId),
    redis.zCard(key),
  ]);
  if (rankAsc === undefined) return null;
  return total - rankAsc;
};

export type LeaderboardRow = {
  userId: string;
  username: string;
  snoovatarUrl: string | null;
  score: number;
};

/** Top players for a date, highest score first. */
export const getTopPlayers = async (
  date: string,
  limit = 10,
): Promise<LeaderboardRow[]> => {
  const entries = await redis.zRange(leaderboardKey(date), 0, limit - 1, {
    reverse: true,
    by: 'rank',
  });
  const meta = await redis.hGetAll(leaderboardMetaKey(date));
  const rows: LeaderboardRow[] = [];
  for (const entry of entries) {
    const raw = meta[entry.member];
    let username = entry.member;
    let snoovatarUrl: string | null = null;
    if (raw !== undefined) {
      try {
        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed === 'object' && parsed !== null) {
          if ('username' in parsed && typeof parsed.username === 'string') {
            username = parsed.username;
          }
          if (
            'snoovatarUrl' in parsed &&
            typeof parsed.snoovatarUrl === 'string'
          ) {
            snoovatarUrl = parsed.snoovatarUrl;
          }
        }
      } catch {
        // Keep the fallback values.
      }
    }
    rows.push({
      userId: entry.member,
      username,
      snoovatarUrl,
      score: entry.score,
    });
  }
  return rows;
};

/** Record a player's best score for a date. */
export const recordScore = async (
  userId: string,
  date: string,
  score: number,
  username: string,
  snoovatarUrl: string | null,
  placements: Placement[],
): Promise<void> => {
  const key = leaderboardKey(date);
  await redis.zAdd(key, { member: userId, score });
  await redis.hSet(leaderboardMetaKey(date), {
    [userId]: JSON.stringify({ username, snoovatarUrl }),
  });
  await redis.set(playedKey(userId, date), JSON.stringify(placements));
  await redis.expire(key, DAY_TTL_SECONDS);
  await redis.expire(leaderboardMetaKey(date), DAY_TTL_SECONDS);
  await redis.expire(playedKey(userId, date), DAY_TTL_SECONDS);
};

/** The player's current streak (consecutive days played). */
export const getStreak = async (userId: string): Promise<number> => {
  const raw = await redis.get(streakKey(userId));
  if (raw === undefined) return 0;
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const yesterdayOf = (date: string): string => {
  const ms = Date.parse(`${date}T00:00:00Z`);
  return new Date(ms - 86_400_000).toISOString().slice(0, 10);
};

/**
 * Record a play on `date`, rolling the streak forward. Playing again on the
 * same day leaves the streak unchanged; a missed day resets it to 1.
 */
export const recordPlay = async (
  userId: string,
  date: string,
): Promise<number> => {
  const lastPlayed = await redis.get(streakDateKey(userId));
  if (lastPlayed === date) return getStreak(userId);
  const current = await getStreak(userId);
  const next = lastPlayed === yesterdayOf(date) ? current + 1 : 1;
  await redis.set(streakKey(userId), String(next));
  await redis.set(streakDateKey(userId), date);
  return next;
};
