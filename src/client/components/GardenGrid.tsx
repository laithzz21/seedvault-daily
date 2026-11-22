import { GRID_SIZE, tileAt, type Puzzle, type TileType } from '../../shared/game';
import { PlantArt } from './PlantArt';
import { cellKey, type PlacedSeed } from '../types';

type GardenGridProps = {
  puzzle: Puzzle;
  placements: PlacedSeed[];
  /** Live points per planted cell, keyed by `row,col`. */
  cellScores: Map<string, number>;
  /** A seed is selected and ready to plant. */
  hasSelection: boolean;
  /** True once the garden is submitted (read-only). */
  disabled: boolean;
  onCellClick: (row: number, col: number) => void;
};

const TILE_STYLES: Record<TileType, string> = {
  soil: 'bg-soil-light hover:bg-soil',
  sun: 'bg-amber-200 hover:bg-amber-300',
  shade: 'bg-[#b8c4b3] hover:bg-[#a5b5a0]',
  rock: 'bg-stone-300 cursor-not-allowed',
  pond: 'bg-sky-300 cursor-not-allowed',
};

const Rock = () => (
  <svg viewBox="0 0 48 48" className="h-3/5 w-3/5" role="img" aria-label="Rock">
    <ellipse cx="24" cy="30" rx="15" ry="10" fill="#a8a29e" />
    <ellipse cx="20" cy="25" rx="9" ry="7" fill="#d6d3d1" />
    <ellipse cx="17" cy="23" rx="3" ry="2" fill="#f5f5f4" />
  </svg>
);

const Pond = () => (
  <svg viewBox="0 0 48 48" className="h-3/5 w-3/5 animate-ripple" role="img" aria-label="Pond">
    <path d="M6 22 Q12 17 18 22 T30 22 T42 22" stroke="#e0f2fe" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M6 32 Q12 27 18 32 T30 32 T42 32" stroke="#e0f2fe" strokeWidth="3" fill="none" strokeLinecap="round" />
  </svg>
);

/**
 * The 5x5 garden bed. Tap an empty plantable cell with a seed selected to
 * plant it; tap a planted cell to pick it back up.
 */
export const GardenGrid = ({
  puzzle,
  placements,
  cellScores,
  hasSelection,
  disabled,
  onCellClick,
}: GardenGridProps) => {
  const placedByCell = new Map(placements.map((p) => [cellKey(p.row, p.col), p]));

  return (
    <div
      className="grid w-full max-w-[420px] grid-cols-5 gap-1.5 rounded-2xl border-4 border-soil-dark bg-soil p-1.5 shadow-lg"
      role="grid"
      aria-label="Garden bed"
    >
      {Array.from({ length: GRID_SIZE }, (_, row) =>
        Array.from({ length: GRID_SIZE }, (_, col) => {
          const tile = tileAt(puzzle, row, col) ?? 'soil';
          const placed = placedByCell.get(cellKey(row, col));
          const plantable = tile === 'soil' || tile === 'sun' || tile === 'shade';
          const score = cellScores.get(cellKey(row, col));
          return (
            <button
              key={cellKey(row, col)}
              type="button"
              role="gridcell"
              aria-label={
                placed
                  ? `${placed.plant} at row ${row + 1}, column ${col + 1}. Tap to pick up.`
                  : `${tile} tile, row ${row + 1}, column ${col + 1}`
              }
              disabled={disabled || !plantable}
              onClick={() => onCellClick(row, col)}
              className={[
                'relative flex aspect-square items-center justify-center rounded-lg transition-all',
                TILE_STYLES[tile],
                plantable && hasSelection && !disabled && !placed
                  ? 'cursor-pointer ring-2 ring-dashed ring-leaf-dark ring-offset-1'
                  : '',
                placed ? 'cursor-pointer' : '',
              ].join(' ')}
            >
              {tile === 'sun' && !placed && (
                <span className="animate-sunpulse pointer-events-none absolute inset-0 rounded-lg bg-yellow-300/50" />
              )}
              {tile === 'rock' && <Rock />}
              {tile === 'pond' && <Pond />}
              {tile === 'shade' && !placed && (
                <span className="pointer-events-none absolute right-1 top-1 text-[10px] leading-none text-emerald-900/60">
                  🌙
                </span>
              )}
              {tile === 'sun' && !placed && (
                <span className="pointer-events-none absolute right-1 top-1 text-[10px] leading-none">
                  ☀️
                </span>
              )}
              {placed && (
                <>
                  <span className="animate-sprout">
                    <PlantArt plant={placed.plant} size={44} />
                  </span>
                  {score !== undefined && (
                    <span className="absolute bottom-0.5 right-0.5 rounded-full bg-bark px-1.5 py-px text-[10px] font-bold leading-4 text-cream">
                      +{score}
                    </span>
                  )}
                  {!disabled && (
                    <span className="absolute left-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/90 text-[10px] font-bold leading-none text-bark shadow">
                      ×
                    </span>
                  )}
                </>
              )}
            </button>
          );
        }),
      )}
    </div>
  );
};
