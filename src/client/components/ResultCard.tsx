import type { ScoreResult } from '../../shared/game';
import { PLANTS } from '../../shared/game';

type ResultCardProps = {
  score: ScoreResult;
  rank: number;
  playersToday: number;
  streak: number;
  isNewBest: boolean;
  onShare: () => void;
  onDiscuss: () => void;
  onShowLeaderboard: () => void;
  onTryAgain: () => void;
};

const ordinal = (n: number): string => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n}st`;
  if (mod10 === 2 && mod100 !== 12) return `${n}nd`;
  if (mod10 === 3 && mod100 !== 13) return `${n}rd`;
  return `${n}th`;
};

/** The post-submit celebration card: score, rank, streak, and next steps. */
export const ResultCard = ({
  score,
  rank,
  playersToday,
  streak,
  isNewBest,
  onShare,
  onDiscuss,
  onShowLeaderboard,
  onTryAgain,
}: ResultCardProps) => (
  <div className="w-full max-w-[420px] rounded-2xl border-2 border-leaf-dark bg-white p-4 text-center shadow-lg">
    <p className="text-4xl">🌻</p>
    <h2 className="mt-1 text-2xl font-extrabold text-leaf-dark">
      Your garden is growing!
    </h2>
    {isNewBest && (
      <p className="mt-1 inline-block rounded-full bg-sunbeam px-3 py-0.5 text-xs font-bold text-bark">
        ✨ New personal best
      </p>
    )}
    <p className="mt-3 text-5xl font-black text-bark">{score.total}</p>
    <p className="text-sm font-semibold text-bark/60">points</p>
    <p className="mt-2 text-base font-bold text-bark">
      {rank > 0
        ? `${ordinal(rank)} of ${playersToday} gardeners today`
        : `${playersToday} gardeners today`}
      {streak > 1 && ` · 🔥 ${streak}-day streak`}
    </p>

    <div className="mt-3 space-y-1 text-left">
      {score.plants.map((p) => (
        <div
          key={`${p.row},${p.col}`}
          className="flex items-center justify-between rounded-lg bg-parchment px-2 py-1 text-xs"
        >
          <span className="font-semibold text-bark">
            {PLANTS[p.plant].emoji} {PLANTS[p.plant].name}
            <span className="ml-1 font-normal text-bark/50">{p.detail}</span>
          </span>
          <span className="font-bold text-leaf-dark">+{p.points}</span>
        </div>
      ))}
      {score.bloomGroups > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-leaf-pale px-2 py-1 text-xs">
          <span className="font-semibold text-leaf-dark">
            🌸 Bloom bonus ×{score.bloomGroups}
          </span>
          <span className="font-bold text-leaf-dark">+{score.bloomBonus}</span>
        </div>
      )}
    </div>

    <div className="mt-4 grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={onShare}
        className="rounded-xl bg-leaf-dark px-3 py-2.5 text-sm font-bold text-white shadow hover:bg-leaf"
      >
        📋 Share garden
      </button>
      <button
        type="button"
        onClick={onDiscuss}
        className="rounded-xl bg-[#ff4500] px-3 py-2.5 text-sm font-bold text-white shadow hover:bg-[#e03d00]"
      >
        💬 Discuss
      </button>
      <button
        type="button"
        onClick={onShowLeaderboard}
        className="rounded-xl border-2 border-soil-dark bg-white px-3 py-2 text-sm font-bold text-bark hover:bg-parchment"
      >
        🏆 Leaderboard
      </button>
      <button
        type="button"
        onClick={onTryAgain}
        className="rounded-xl border-2 border-soil-dark bg-white px-3 py-2 text-sm font-bold text-bark hover:bg-parchment"
      >
        🌱 Beat my score
      </button>
    </div>
  </div>
);
