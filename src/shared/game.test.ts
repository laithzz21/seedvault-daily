import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  GRID_SIZE,
  generatePuzzle,
  scorePlacement,
  validatePlacements,
  emojiGrid,
  type PlantId,
  type Puzzle,
  type TileType,
} from './game.ts';

/** Build a puzzle with an all-soil grid and the given hand. */
const soilPuzzle = (hand: PlantId[]): Puzzle => ({
  date: '2026-12-09',
  grid: Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, (): TileType => 'soil'),
  ),
  hand,
});

/** Build a puzzle with specific tiles set (row, col, tile). */
const customPuzzle = (
  hand: PlantId[],
  tiles: [number, number, TileType][],
): Puzzle => {
  const puzzle = soilPuzzle(hand);
  for (const [row, col, tile] of tiles) {
    const gridRow = puzzle.grid[row];
    if (gridRow !== undefined) gridRow[col] = tile;
  }
  return puzzle;
};

describe('generatePuzzle', () => {
  it('is deterministic: the same date always yields the same puzzle', () => {
    const a = generatePuzzle('2026-12-09');
    const b = generatePuzzle('2026-12-09');
    assert.deepEqual(a, b);
  });

  it('gives different puzzles on different dates', () => {
    const a = generatePuzzle('2026-12-09');
    const b = generatePuzzle('2026-12-10');
    assert.notDeepEqual(a, b);
  });

  it('always builds a 5x5 bed with 2 rocks, 1 pond, 2 sun, 2 shade', () => {
    for (const date of ['2026-12-01', '2026-12-09', '2027-01-15', '2026-11-22']) {
      const puzzle = generatePuzzle(date);
      assert.equal(puzzle.grid.length, GRID_SIZE);
      const flat = puzzle.grid.flat();
      assert.equal(flat.length, GRID_SIZE * GRID_SIZE);
      assert.equal(flat.filter((t) => t === 'rock').length, 2);
      assert.equal(flat.filter((t) => t === 'pond').length, 1);
      assert.equal(flat.filter((t) => t === 'sun').length, 2);
      assert.equal(flat.filter((t) => t === 'shade').length, 2);
      assert.equal(flat.filter((t) => t === 'soil').length, 18);
    }
  });

  it('always deals a hand of 8: one species doubled, one absent', () => {
    for (const date of ['2026-12-01', '2026-12-09', '2027-01-15']) {
      const puzzle = generatePuzzle(date);
      assert.equal(puzzle.hand.length, 8);
      const counts = new Map<PlantId, number>();
      for (const id of puzzle.hand) counts.set(id, (counts.get(id) ?? 0) + 1);
      const values = [...counts.values()].sort();
      assert.deepEqual(values, [1, 1, 1, 1, 1, 1, 2]);
      assert.equal(counts.size, 7);
    }
  });
});

describe('scorePlacement', () => {
  it('scores a lone sunflower on soil as base 1', () => {
    const puzzle = soilPuzzle(['sunflower']);
    const result = scorePlacement(puzzle, [
      { plant: 'sunflower', row: 2, col: 2 },
    ]);
    assert.equal(result.total, 1);
  });

  it('scores a sunflower on sun as base 1 + sun 3', () => {
    const puzzle = customPuzzle(['sunflower'], [[2, 2, 'sun']]);
    const result = scorePlacement(puzzle, [
      { plant: 'sunflower', row: 2, col: 2 },
    ]);
    assert.equal(result.total, 4);
  });

  it('scores adjacent sunflowers: +1 per Sunflower next door', () => {
    const puzzle = soilPuzzle(['sunflower', 'sunflower']);
    const result = scorePlacement(puzzle, [
      { plant: 'sunflower', row: 2, col: 2 },
      { plant: 'sunflower', row: 2, col: 3 },
    ]);
    // Each: base 1 + neighbour 1 = 2, total 4.
    assert.equal(result.total, 4);
  });

  it('scores rose by adjacent flowers only', () => {
    const puzzle = soilPuzzle(['rose', 'tulip', 'fern']);
    const result = scorePlacement(puzzle, [
      { plant: 'rose', row: 2, col: 2 },
      { plant: 'tulip', row: 2, col: 3 },
      { plant: 'fern', row: 3, col: 2 },
    ]);
    // Rose: base 1 + tulip flower 2 = 3. Tulip: base 1 (no tulip line).
    // Fern: base 1 + 1 neighbour (rose) = 2. Total 6.
    assert.equal(result.total, 6);
  });

  it('scores mushroom by tile: shade 4, soil 1, sun 0', () => {
    const shade = customPuzzle(['mushroom'], [[1, 1, 'shade']]);
    assert.equal(
      scorePlacement(shade, [{ plant: 'mushroom', row: 1, col: 1 }]).total,
      4,
    );
    const soil = soilPuzzle(['mushroom']);
    assert.equal(
      scorePlacement(soil, [{ plant: 'mushroom', row: 1, col: 1 }]).total,
      1,
    );
    const sun = customPuzzle(['mushroom'], [[1, 1, 'sun']]);
    assert.equal(
      scorePlacement(sun, [{ plant: 'mushroom', row: 1, col: 1 }]).total,
      0,
    );
  });

  it('scores cactus by empty soil next door', () => {
    const puzzle = soilPuzzle(['cactus', 'fern']);
    const result = scorePlacement(puzzle, [
      { plant: 'cactus', row: 2, col: 2 },
      { plant: 'fern', row: 2, col: 3 },
    ]);
    // Cactus: base 1 + 3 empty neighbours * 2 = 7. Fern: base 1 + 1 = 2.
    assert.equal(result.total, 9);
  });

  it('scores tulip line bonus when tulips share a row or column', () => {
    const puzzle = soilPuzzle(['tulip', 'tulip']);
    const inLine = scorePlacement(puzzle, [
      { plant: 'tulip', row: 1, col: 1 },
      { plant: 'tulip', row: 1, col: 4 },
    ]);
    // Each: base 1 + line 3 = 4, total 8.
    assert.equal(inLine.total, 8);

    const apart = scorePlacement(puzzle, [
      { plant: 'tulip', row: 0, col: 0 },
      { plant: 'tulip', row: 3, col: 3 },
    ]);
    assert.equal(apart.total, 2);
  });

  it('scores mint by different species next door', () => {
    const puzzle = soilPuzzle(['mint', 'mint', 'fern']);
    const result = scorePlacement(puzzle, [
      { plant: 'mint', row: 2, col: 2 },
      { plant: 'mint', row: 2, col: 3 },
      { plant: 'fern', row: 3, col: 2 },
    ]);
    // Mint A: base 1 + fern 1 = 2 (mint next door does not count).
    // Mint B: base 1 + 0 = 1. Fern: base 1 + 1 neighbour (mint A) = 2.
    assert.equal(result.total, 5);
  });

  it('awards +5 per bloom group of 3+ connected same species', () => {
    const puzzle = soilPuzzle(['fern', 'fern', 'fern']);
    const connected = scorePlacement(puzzle, [
      { plant: 'fern', row: 2, col: 1 },
      { plant: 'fern', row: 2, col: 2 },
      { plant: 'fern', row: 2, col: 3 },
    ]);
    // Ferns: (1+1) + (1+2) + (1+1) = 7, plus bloom 5 = 12.
    assert.equal(connected.bloomGroups, 1);
    assert.equal(connected.bloomBonus, 5);
    assert.equal(connected.total, 12);

    const scattered = scorePlacement(puzzle, [
      { plant: 'fern', row: 0, col: 0 },
      { plant: 'fern', row: 2, col: 2 },
      { plant: 'fern', row: 4, col: 4 },
    ]);
    assert.equal(scattered.bloomGroups, 0);
    assert.equal(scattered.total, 3);
  });
});

describe('validatePlacements', () => {
  it('accepts a legal placement', () => {
    const puzzle = generatePuzzle('2026-12-09');
    // Find 3 plantable cells (the first row may contain fixed tiles).
    const soilCells: { row: number; col: number }[] = [];
    for (let r = 0; r < GRID_SIZE && soilCells.length < 3; r++) {
      for (let c = 0; c < GRID_SIZE && soilCells.length < 3; c++) {
        const tile = puzzle.grid[r]?.[c];
        if (tile === 'soil' || tile === 'sun' || tile === 'shade') {
          soilCells.push({ row: r, col: c });
        }
      }
    }
    const legal = puzzle.hand.slice(0, 3).map((plant, i) => {
      const cell = soilCells[i];
      if (cell === undefined) throw new Error('test setup: missing soil cell');
      return { plant, row: cell.row, col: cell.col };
    });
    assert.equal(validatePlacements(puzzle, legal), null);
  });

  it('rejects planting on rock or pond', () => {
    const puzzle = customPuzzle(['fern'], [[0, 0, 'rock']]);
    assert.match(
      validatePlacements(puzzle, [{ plant: 'fern', row: 0, col: 0 }]) ?? '',
      /rock or water/,
    );
  });

  it('rejects two plants in one cell', () => {
    const puzzle = soilPuzzle(['fern', 'mint']);
    assert.match(
      validatePlacements(puzzle, [
        { plant: 'fern', row: 1, col: 1 },
        { plant: 'mint', row: 1, col: 1 },
      ]) ?? '',
      /share one cell/,
    );
  });

  it('rejects plants not in today’s hand', () => {
    const puzzle = soilPuzzle(['fern']);
    assert.match(
      validatePlacements(puzzle, [{ plant: 'rose', row: 1, col: 1 }]) ?? '',
      /only have 0 Rose/,
    );
  });

  it('rejects using more of a species than the hand holds', () => {
    const puzzle = soilPuzzle(['fern']);
    assert.match(
      validatePlacements(puzzle, [
        { plant: 'fern', row: 1, col: 1 },
        { plant: 'fern', row: 1, col: 2 },
      ]) ?? '',
      /only have 1 Fern/,
    );
  });

  it('rejects empty and out-of-bounds placements', () => {
    const puzzle = soilPuzzle(['fern']);
    assert.match(validatePlacements(puzzle, []) ?? '', /at least one/);
    assert.match(
      validatePlacements(puzzle, [{ plant: 'fern', row: 5, col: 0 }]) ?? '',
      /outside the garden/,
    );
  });
});

describe('emojiGrid', () => {
  it('renders a 5x5 grid with plant and tile emoji', () => {
    const puzzle = customPuzzle(['sunflower'], [[0, 0, 'rock']]);
    const grid = emojiGrid(puzzle, [{ plant: 'sunflower', row: 2, col: 2 }]);
    const rows = grid.split('\n');
    assert.equal(rows.length, 5);
    assert.ok(rows[0]?.startsWith('🪨'));
    assert.ok(rows[2]?.includes('🌻'));
  });
});
