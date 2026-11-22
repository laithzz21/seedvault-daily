import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { PLANTS } from '../shared/game';
import { GardenGrid } from './components/GardenGrid';
import { SeedHand } from './components/SeedHand';
import { ResultCard } from './components/ResultCard';
import { useGame } from './hooks/useGame';

const Header = ({
  date,
  streak,
  playersToday,
}: {
  date: string;
  streak: number;
  playersToday: number;
}) => (
  <header className="flex w-full max-w-[420px] items-center justify-between">
    <div className="flex items-center gap-2">
      <span className="animate-floaty text-3xl">🌱</span>
      <div>
        <h1 className="text-xl font-black leading-none text-leaf-dark">
          Seedvault
        </h1>
        <p className="text-xs font-semibold text-bark/60">{date}</p>
      </div>
    </div>
    <div className="flex gap-2 text-xs font-bold">
      {streak > 0 && (
        <span className="rounded-full bg-orange-100 px-2.5 py-1 text-orange-800">
          🔥 {streak}
        </span>
      )}
      <span className="rounded-full bg-leaf-pale px-2.5 py-1 text-leaf-dark">
        🌻 {playersToday} today
      </span>
    </div>
  </header>
);

const HowToPlay = () => (
  <details className="w-full max-w-[420px] rounded-2xl border-2 border-soil-light bg-white p-3 text-left shadow-sm">
    <summary className="cursor-pointer text-sm font-bold text-bark">
      How to play
    </summary>
    <p className="mt-2 text-xs leading-relaxed text-bark/80">
      Plant your 8 seeds on the bed. Every plant scores by its own rule —
      sunflowers love sunny tiles, mushrooms love shade, and groups of 3+ of
      one species connected together bloom for +5. You can rearrange until
      you press Grow. One garden a day, same puzzle for everyone.
    </p>
    <ul className="mt-2 space-y-1">
      {Object.values(PLANTS).map((p) => (
        <li key={p.id} className="flex items-start gap-1.5 text-xs text-bark/80">
          <span>{p.emoji}</span>
          <span>
            <strong className="text-bark">{p.name}:</strong> {p.rule}
          </span>
        </li>
      ))}
    </ul>
    <p className="mt-2 text-xs leading-relaxed text-bark/60">
      🪨 Rocks and 🌊 ponds can’t be planted. ☀️ sunny tiles and 🌙 shady
      tiles change what a plant is worth. Pick a planted cell to pick it back
      up.
    </p>
  </details>
);

const LeaderboardView = ({
  game,
}: {
  game: ReturnType<typeof useGame>;
}) => {
  const { leaderboard, loadingLeaderboard, backToResult } = game;
  return (
    <div className="flex w-full max-w-[420px] flex-col items-center gap-3">
      <h2 className="text-xl font-black text-leaf-dark">
        🏆 Today’s leaderboard
      </h2>
      {loadingLeaderboard && <p className="text-sm text-bark/60">Loading…</p>}
      {leaderboard !== null && (
        <>
          {leaderboard.entries.length === 0 && (
            <p className="text-sm text-bark/60">
              No gardens yet today — be the first!
            </p>
          )}
          <ul className="w-full space-y-1.5">
            {leaderboard.entries.map((entry) => (
              <li
                key={entry.rank}
                className={[
                  'flex items-center gap-2 rounded-xl px-3 py-2 text-sm shadow-sm',
                  entry.isYou
                    ? 'border-2 border-leaf-dark bg-leaf-pale font-bold'
                    : 'border border-soil-light bg-white',
                ].join(' ')}
              >
                <span className="w-6 text-center font-black text-bark/50">
                  {entry.rank}
                </span>
                {entry.snoovatarUrl !== null ? (
                  <img
                    src={entry.snoovatarUrl}
                    alt=""
                    className="h-7 w-7 rounded-full bg-parchment"
                  />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-parchment text-sm">
                    🌱
                  </span>
                )}
                <span className="flex-1 truncate text-bark">
                  u/{entry.username}
                  {entry.isYou && ' (you)'}
                </span>
                <span className="font-black text-leaf-dark">
                  {entry.score}
                </span>
              </li>
            ))}
          </ul>
          {leaderboard.playerRank !== null &&
            !leaderboard.entries.some((e) => e.isYou) && (
              <p className="text-sm font-semibold text-bark/70">
                You are #{leaderboard.playerRank} of{' '}
                {leaderboard.playersToday} today.
              </p>
            )}
        </>
      )}
      <button
        type="button"
        onClick={backToResult}
        className="rounded-xl bg-leaf-dark px-4 py-2 text-sm font-bold text-white shadow hover:bg-leaf"
      >
        ← Back to my garden
      </button>
    </div>
  );
};

const App = () => {
  const game = useGame();
  const {
    init,
    loadError,
    view,
    puzzle,
    placements,
    selectedIndex,
    liveScore,
    cellScores,
    usedIndices,
    submitting,
    result,
  } = game;

  if (loadError !== null) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-4 text-center">
        <p className="text-4xl">🥀</p>
        <p className="font-bold text-bark">{loadError}</p>
        <p className="text-sm text-bark/60">
          Check your connection and reopen the post.
        </p>
      </main>
    );
  }

  if (init === null || puzzle === null || view === 'loading') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-4">
        <p className="animate-floaty text-5xl">🌱</p>
        <p className="font-bold text-bark">Watering today’s garden…</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center gap-4 p-4">
      <Header
        date={init.date}
        streak={init.streak}
        playersToday={init.playersToday}
      />

      {view === 'leaderboard' && <LeaderboardView game={game} />}

      {view === 'result' && result !== null && (
        <>
          <GardenGrid
            puzzle={puzzle}
            placements={placements}
            cellScores={cellScores}
            hasSelection={false}
            disabled
            onCellClick={() => {}}
          />
          <ResultCard
            score={result.score}
            rank={result.rank}
            playersToday={result.playersToday}
            streak={result.streak}
            isNewBest={result.isNewBest}
            onShare={game.share}
            onDiscuss={game.discuss}
            onShowLeaderboard={game.showLeaderboard}
            onTryAgain={game.tryAgain}
          />
          <p className="text-center text-xs text-bark/60">
            A new puzzle grows every day at midnight UTC. Come back tomorrow!
          </p>
        </>
      )}

      {view === 'play' && (
        <>
          <div className="flex w-full max-w-[420px] items-center justify-between rounded-2xl bg-white px-4 py-2 shadow-sm">
            <span className="text-sm font-bold text-bark">
              Score:{' '}
              <span className="text-lg font-black text-leaf-dark">
                {liveScore?.total ?? 0}
              </span>
              {(liveScore?.bloomBonus ?? 0) > 0 && (
                <span className="ml-1 text-xs font-bold text-pink-600">
                  (+{liveScore?.bloomBonus} bloom)
                </span>
              )}
            </span>
            <span className="text-xs font-semibold text-bark/60">
              {placements.length} / 8 planted
            </span>
          </div>

          <GardenGrid
            puzzle={puzzle}
            placements={placements}
            cellScores={cellScores}
            hasSelection={selectedIndex !== null}
            disabled={false}
            onCellClick={game.cellClick}
          />

          <SeedHand
            hand={puzzle.hand}
            usedIndices={usedIndices}
            selectedIndex={selectedIndex}
            disabled={false}
            onSelect={game.selectSeed}
          />

          <div className="flex w-full max-w-[420px] gap-2">
            <button
              type="button"
              onClick={() => void game.submit()}
              disabled={submitting || placements.length === 0}
              className="flex-1 rounded-xl bg-leaf-dark px-4 py-3 text-base font-black text-white shadow-lg transition-all hover:bg-leaf disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? 'Growing…' : '🌻 Grow my garden'}
            </button>
            <button
              type="button"
              onClick={game.clearGarden}
              disabled={placements.length === 0}
              className="rounded-xl border-2 border-soil-dark bg-white px-4 py-3 text-sm font-bold text-bark hover:bg-parchment disabled:opacity-40"
            >
              Clear
            </button>
          </div>
          <button
            type="button"
            onClick={() => void game.showLeaderboard()}
            className="text-sm font-bold text-leaf-dark underline"
          >
            🏆 See today’s leaderboard
          </button>
          <HowToPlay />
        </>
      )}
    </main>
  );
};

const rootElement = document.getElementById('root');
if (rootElement === null) {
  throw new Error('Seedvault: #root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
