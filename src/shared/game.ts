/**
 * Seedvault — shared game logic.
 *
 * Used by both the client (live score preview, splash preview) and the
 * server (submission validation + authoritative scoring), so both sides
 * always agree on what a garden is worth.
 *
 * No DOM or Node APIs here: this module must run in the webview and in the
 * serverless environment.
 */

export const GRID_SIZE = 5;
export const HAND_SIZE = 8;

export type PlantId =
  | 'sunflower'
  | 'rose'
  | 'mushroom'
  | 'cactus'
  | 'fern'
  | 'tulip'
  | 'berry'
  | 'mint';

export type TileType = 'soil' | 'sun' | 'shade' | 'rock' | 'pond';

export type PlantInfo = {
  id: PlantId;
  name: string;
  /** One-line rule shown on the seed packet. */
  rule: string;
  /** Emoji used only in the share-text grid. */
  emoji: string;
  /** Primary colour for the plant's SVG art. */
  color: string;
  /** Accent colour for the plant's SVG art. */
  accent: string;
};

export const PLANTS: Record<PlantId, PlantInfo> = {
  sunflower: {
    id: 'sunflower',
    name: 'Sunflower',
    rule: '+3 on a sunny tile, +1 per Sunflower next door',
    emoji: '🌻',
    color: '#f5b301',
    accent: '#7a4a00',
  },
  rose: {
    id: 'rose',
    name: 'Rose',
    rule: '+2 per flower next door (Rose or Tulip)',
    emoji: '🌹',
    color: '#e5484d',
    accent: '#7f1d1d',
  },
  mushroom: {
    id: 'mushroom',
    name: 'Mushroom',
    rule: '+4 in shade, +1 on soil, +0 in sun',
    emoji: '🍄',
    color: '#e8e0d0',
    accent: '#b3402e',
  },
  cactus: {
    id: 'cactus',
    name: 'Cactus',
    rule: '+2 per empty soil cell next door',
    emoji: '🌵',
    color: '#4d9e57',
    accent: '#2c5f33',
  },
  fern: {
    id: 'fern',
    name: 'Fern',
    rule: '+1 per plant next door, any kind',
    emoji: '🌿',
    color: '#5aa469',
    accent: '#2f6b3a',
  },
  tulip: {
    id: 'tulip',
    name: 'Tulip',
    rule: '+3 if another Tulip shares its row or column',
    emoji: '🌷',
    color: '#f472b6',
    accent: '#9d174d',
  },
  berry: {
    id: 'berry',
    name: 'Berry Bush',
    rule: '+2 per Berry Bush next door',
    emoji: '🫐',
    color: '#6d5bd0',
    accent: '#3730a3',
  },
  mint: {
    id: 'mint',
    name: 'Mint',
    rule: '+1 per different species next door',
    emoji: '🌱',
    color: '#34d399',
    accent: '#065f46',
  },
};

export const PLANT_IDS: PlantId[] = [
  'sunflower',
  'rose',
  'mushroom',
  'cactus',
  'fern',
  'tulip',
  'berry',
  'mint',
];

/** A flower for the Rose rule: Rose or Tulip. */
const FLOWERS: ReadonlySet<PlantId> = new Set(['rose', 'tulip']);

export type Puzzle = {
  /** UTC date string, YYYY-MM-DD. */
  date: string;
  /** 5x5 grid of tile types, indexed [row][col]. */
  grid: TileType[][];
  /** The day's hand: 8 plants. */
  hand: PlantId[];
};

export type Placement = {
  plant: PlantId;
  row: number;
  col: number;
};

export type PlantScore = {
  plant: PlantId;
  row: number;
  col: number;
  points: number;
  /** Human-readable breakdown, e.g. "base 1 + sun 3 + neighbour 1". */
  detail: string;
};

export type ScoreResult = {
  total: number;
  plants: PlantScore[];
  /** Bonus from bloom groups (3+ of a species connected). */
  bloomBonus: number;
  bloomGroups: number;
};

/** Today's date as a UTC `YYYY-MM-DD` string. */
export const todayDateString = (now: Date = new Date()): string =>
  now.toISOString().slice(0, 10);

/** FNV-1a 32-bit hash of a string. */
const hashString = (str: string): number => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

/** mulberry32 — small deterministic PRNG. */
const mulberry32 = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffled = <T,>(items: readonly T[], rand: () => number): T[] => {
  const pool = [...items];
  const out: T[] = [];
  while (pool.length > 0) {
    const idx = Math.floor(rand() * pool.length);
    const [item] = pool.splice(idx, 1);
    if (item !== undefined) out.push(item);
  }
  return out;
};

/**
 * Generate the day's puzzle. Deterministic: the same date always yields the
 * same bed and the same hand, so every player faces the same puzzle.
 */
export const generatePuzzle = (date: string): Puzzle => {
  const rand = mulberry32(hashString(`seedvault:${date}`));

  // Fixed tiles: 2 rocks, 1 pond, 2 sunny, 2 shady — seeded positions.
  const cells = shuffled(
    Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => i),
    rand,
  );
  const grid: TileType[][] = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, (): TileType => 'soil'),
  );
  const fixed: TileType[] = ['rock', 'rock', 'pond', 'sun', 'sun', 'shade', 'shade'];
  cells.slice(0, fixed.length).forEach((cell, i) => {
    const tile = fixed[i];
    if (tile === undefined) return;
    const row = Math.floor(cell / GRID_SIZE);
    const col = cell % GRID_SIZE;
    const gridRow = grid[row];
    if (gridRow !== undefined) gridRow[col] = tile;
  });

  // Hand: one species doubled, one species absent, the rest once each.
  // Counts [2,1,1,1,1,1,1,0] shuffled across the 8 species = 8 plants.
  const counts = shuffled([2, 1, 1, 1, 1, 1, 1, 0], rand);
  const hand: PlantId[] = [];
  PLANT_IDS.forEach((id, i) => {
    const count = counts[i] ?? 0;
    for (let n = 0; n < count; n++) hand.push(id);
  });

  return { date, grid, hand: shuffled(hand, rand) };
};

export const tileAt = (puzzle: Puzzle, row: number, col: number): TileType | undefined => {
  if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return undefined;
  return puzzle.grid[row]?.[col];
};

const isPlantable = (tile: TileType | undefined): boolean =>
  tile === 'soil' || tile === 'sun' || tile === 'shade';

const neighbours = (
  row: number,
  col: number,
): { row: number; col: number }[] => {
  const out: { row: number; col: number }[] = [];
  if (row > 0) out.push({ row: row - 1, col });
  if (row < GRID_SIZE - 1) out.push({ row: row + 1, col });
  if (col > 0) out.push({ row, col: col - 1 });
  if (col < GRID_SIZE - 1) out.push({ row, col: col + 1 });
  return out;
};

type Board = Map<string, PlantId>;

const keyOf = (row: number, col: number): string => `${row},${col}`;

const boardOf = (placements: readonly Placement[]): Board => {
  const board = new Map<string, PlantId>();
  for (const p of placements) board.set(keyOf(p.row, p.col), p.plant);
  return board;
};

/**
 * Validate a submission against the day's puzzle. Returns an error message
 * or null when the placement is legal.
 */
export const validatePlacements = (
  puzzle: Puzzle,
  placements: readonly Placement[],
): string | null => {
  if (!Array.isArray(placements)) return 'Placements must be a list.';
  if (placements.length === 0) return 'Plant at least one seed before growing.';
  if (placements.length > HAND_SIZE) return `At most ${HAND_SIZE} plants.`;

  // The placement must use plants from today's hand (same multiset).
  const handCounts = new Map<PlantId, number>();
  for (const id of puzzle.hand) handCounts.set(id, (handCounts.get(id) ?? 0) + 1);
  const usedCounts = new Map<PlantId, number>();
  for (const p of placements) {
    if (!PLANT_IDS.includes(p.plant)) return `Unknown plant: ${String(p.plant)}.`;
    usedCounts.set(p.plant, (usedCounts.get(p.plant) ?? 0) + 1);
  }
  for (const [id, used] of usedCounts) {
    if (used > (handCounts.get(id) ?? 0)) {
      return `You only have ${handCounts.get(id) ?? 0} ${PLANTS[id].name} seed(s) today.`;
    }
  }

  const seen = new Set<string>();
  for (const p of placements) {
    if (!Number.isInteger(p.row) || !Number.isInteger(p.col)) {
      return 'Plant positions must be whole grid cells.';
    }
    const tile = tileAt(puzzle, p.row, p.col);
    if (tile === undefined) return 'A plant is outside the garden bed.';
    if (!isPlantable(tile)) return 'You cannot plant on rock or water.';
    const key = keyOf(p.row, p.col);
    if (seen.has(key)) return 'Two plants cannot share one cell.';
    seen.add(key);
  }
  return null;
};

/** Count connected groups (orthogonal) of 3+ of the same species. */
const countBloomGroups = (board: Board): number => {
  const visited = new Set<string>();
  let groups = 0;
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const key = keyOf(row, col);
      const plant = board.get(key);
      if (plant === undefined || visited.has(key)) continue;
      // Flood-fill this species from this cell.
      const stack = [{ row, col }];
      visited.add(key);
      let size = 0;
      while (stack.length > 0) {
        const current = stack.pop();
        if (current === undefined) break;
        size += 1;
        for (const n of neighbours(current.row, current.col)) {
          const nKey = keyOf(n.row, n.col);
          if (!visited.has(nKey) && board.get(nKey) === plant) {
            visited.add(nKey);
            stack.push(n);
          }
        }
      }
      if (size >= 3) groups += 1;
    }
  }
  return groups;
};

/**
 * Score a placement. Every plant earns its rule points; groups of 3+ of a
 * species connected orthogonally earn a +5 bloom bonus each.
 */
export const scorePlacement = (
  puzzle: Puzzle,
  placements: readonly Placement[],
): ScoreResult => {
  const board = boardOf(placements);
  const plants: PlantScore[] = [];

  for (const p of placements) {
    const tile = tileAt(puzzle, p.row, p.col) ?? 'soil';
    const adjacent = neighbours(p.row, p.col)
      .map((n) => board.get(keyOf(n.row, n.col)))
      .filter((v): v is PlantId => v !== undefined);
    const adjacentCells = neighbours(p.row, p.col);

    let points = 0;
    const parts: string[] = [];

    switch (p.plant) {
      case 'sunflower': {
        points += 1;
        parts.push('base 1');
        if (tile === 'sun') {
          points += 3;
          parts.push('sun 3');
        }
        const buddies = adjacent.filter((a) => a === 'sunflower').length;
        if (buddies > 0) {
          points += buddies;
          parts.push(`neighbours ${buddies}`);
        }
        break;
      }
      case 'rose': {
        points += 1;
        parts.push('base 1');
        const flowers = adjacent.filter((a) => FLOWERS.has(a)).length;
        if (flowers > 0) {
          points += flowers * 2;
          parts.push(`flowers ${flowers * 2}`);
        }
        break;
      }
      case 'mushroom': {
        // The mushroom's tile value IS its points (no base).
        if (tile === 'shade') {
          points += 4;
          parts.push('shade 4');
        } else if (tile === 'soil') {
          points += 1;
          parts.push('soil 1');
        } else {
          parts.push('wilted 0');
        }
        break;
      }
      case 'cactus': {
        points += 1;
        parts.push('base 1');
        const empty = adjacentCells.filter((n) => {
          const t = tileAt(puzzle, n.row, n.col);
          return isPlantable(t) && !board.has(keyOf(n.row, n.col));
        }).length;
        if (empty > 0) {
          points += empty * 2;
          parts.push(`space ${empty * 2}`);
        }
        break;
      }
      case 'fern': {
        points += 1;
        parts.push('base 1');
        if (adjacent.length > 0) {
          points += adjacent.length;
          parts.push(`neighbours ${adjacent.length}`);
        }
        break;
      }
      case 'tulip': {
        points += 1;
        parts.push('base 1');
        const inLine = placements.some(
          (other) =>
            other.plant === 'tulip' &&
            !(other.row === p.row && other.col === p.col) &&
            (other.row === p.row || other.col === p.col),
        );
        if (inLine) {
          points += 3;
          parts.push('line 3');
        }
        break;
      }
      case 'berry': {
        points += 1;
        parts.push('base 1');
        const buddies = adjacent.filter((a) => a === 'berry').length;
        if (buddies > 0) {
          points += buddies * 2;
          parts.push(`neighbours ${buddies * 2}`);
        }
        break;
      }
      case 'mint': {
        points += 1;
        parts.push('base 1');
        const different = adjacent.filter((a) => a !== 'mint').length;
        if (different > 0) {
          points += different;
          parts.push(`variety ${different}`);
        }
        break;
      }
    }

    plants.push({
      plant: p.plant,
      row: p.row,
      col: p.col,
      points,
      detail: parts.join(' + '),
    });
  }

  const bloomGroups = countBloomGroups(board);
  const bloomBonus = bloomGroups * 5;
  const total =
    plants.reduce((sum, p) => sum + p.points, 0) + bloomBonus;

  return { total, plants, bloomBonus, bloomGroups };
};

/** Emoji for an empty tile in the share grid. */
const TILE_EMOJI: Record<TileType, string> = {
  soil: '⬜',
  sun: '🟨',
  shade: '⬛',
  rock: '🪨',
  pond: '🌊',
};

/** Render the finished garden as a 5x5 emoji grid for sharing. */
export const emojiGrid = (
  puzzle: Puzzle,
  placements: readonly Placement[],
): string => {
  const board = boardOf(placements);
  const rows: string[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    let line = '';
    for (let c = 0; c < GRID_SIZE; c++) {
      const plant = board.get(keyOf(r, c));
      if (plant) {
        line += PLANTS[plant].emoji;
      } else {
        line += TILE_EMOJI[tileAt(puzzle, r, c) ?? 'soil'];
      }
    }
    rows.push(line);
  }
  return rows.join('\n');
};

/** The full share text (Wordle-style) for a finished garden. */
export const shareText = (
  puzzle: Puzzle,
  placements: readonly Placement[],
  score: number,
): string =>
  `🌱 Seedvault — ${puzzle.date}\nScore: ${score}\n\n${emojiGrid(puzzle, placements)}`;
