import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { requestExpandedMode } from '@devvit/web/client';
import './index.css';
import { GRID_SIZE, tileAt, type TileType } from '../shared/game';
import type { ErrorResponse, InitResponse } from '../shared/api';

const TILE_COLORS: Record<TileType, string> = {
  soil: 'bg-soil-light',
  sun: 'bg-amber-200',
  shade: 'bg-[#b8c4b3]',
  rock: 'bg-stone-300',
  pond: 'bg-sky-300',
};

/**
 * The inline feed view: a small, fast preview of today's garden and one
 * big Play button. Tapping it opens the full game in expanded mode.
 */
const Splash = () => {
  const [init, setInit] = useState<InitResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/init');
        const data: InitResponse | ErrorResponse = await res.json();
        if (cancelled) return;
        if ('type' in data && data.type === 'init') setInit(data);
      } catch {
        // The splash still works without init data: the Play button opens
        // the game, which loads its own state.
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const played = init?.played ?? null;
  const puzzle = init?.puzzle ?? null;

  return (
    <main className="flex flex-col items-center gap-3 p-4">
      <div className="flex w-full max-w-[420px] items-center gap-3">
        <span className="animate-floaty text-4xl">🌱</span>
        <div className="flex-1">
          <h1 className="text-lg font-black leading-tight text-leaf-dark">
            Seedvault
          </h1>
          <p className="text-xs font-semibold text-bark/60">
            A tiny garden, a new puzzle every day
          </p>
        </div>
        {puzzle !== null && (
          <div className="grid grid-cols-5 gap-0.5 rounded-lg border-2 border-soil-dark bg-soil p-0.5">
            {Array.from({ length: GRID_SIZE }, (_, row) =>
              Array.from({ length: GRID_SIZE }, (_, col) => {
                const tile = tileAt(puzzle, row, col) ?? 'soil';
                return (
                  <span
                    key={`${row},${col}`}
                    className={`h-3.5 w-3.5 rounded-[3px] ${TILE_COLORS[tile]}`}
                  />
                );
              }),
            )}
          </div>
        )}
      </div>

      {played !== null ? (
        <p className="w-full max-w-[420px] rounded-xl bg-leaf-pale px-3 py-2 text-center text-sm font-bold text-leaf-dark">
          🌻 You scored {played.score} today
          {played.rank > 0 ? ` — #${played.rank} so far` : ''}. See your garden
          or try to beat it!
        </p>
      ) : (
        <p className="w-full max-w-[420px] rounded-xl bg-parchment px-3 py-2 text-center text-sm font-semibold text-bark/80">
          Plant 8 seeds on the 5×5 bed. Sunflowers love sun, mushrooms love
          shade — grow the best garden you can.
          {init !== null && init.playersToday > 0 && (
            <>
              {' '}
              {init.playersToday}{' '}
              {init.playersToday === 1 ? 'gardener has' : 'gardeners have'}{' '}
              already played today.
            </>
          )}
        </p>
      )}

      <button
        type="button"
        onClick={(event) => {
          requestExpandedMode(event.nativeEvent, 'game', {
            title: 'Seedvault',
          });
        }}
        className="w-full max-w-[420px] rounded-xl bg-leaf-dark px-4 py-3 text-base font-black text-white shadow-lg transition-all hover:bg-leaf"
      >
        {played !== null ? '🌻 See my garden' : '🌱 Play today’s garden'}
      </button>
    </main>
  );
};

const rootElement = document.getElementById('root');
if (rootElement === null) {
  throw new Error('Seedvault: #root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <Splash />
  </StrictMode>,
);
