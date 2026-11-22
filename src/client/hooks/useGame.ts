import { useCallback, useEffect, useMemo, useState } from 'react';
import { navigateTo, showToast } from '@devvit/web/client';
import {
  scorePlacement,
  shareText,
  tileAt,
  validatePlacements,
  type Placement,
  type Puzzle,
  type ScoreResult,
} from '../../shared/game';
import type {
  ErrorResponse,
  InitResponse,
  LeaderboardResponse,
  SubmitResponse,
} from '../../shared/api';
import { cellKey, type PlacedSeed } from '../types';

export type GameView = 'loading' | 'play' | 'result' | 'leaderboard';

export type DisplayedResult = {
  score: ScoreResult;
  rank: number;
  playersToday: number;
  streak: number;
  isNewBest: boolean;
  placements: Placement[];
};

const isErrorResponse = (value: unknown): value is ErrorResponse =>
  typeof value === 'object' &&
  value !== null &&
  'status' in value &&
  value.status === 'error';

/** Map server placements back onto hand indices (for "Beat my score"). */
const mapPlacementsToHand = (
  puzzle: Puzzle,
  placements: Placement[],
): PlacedSeed[] => {
  const used = new Set<number>();
  const out: PlacedSeed[] = [];
  for (const p of placements) {
    const idx = puzzle.hand.findIndex(
      (id, i) => id === p.plant && !used.has(i),
    );
    if (idx === -1) continue;
    used.add(idx);
    out.push({ handIndex: idx, plant: p.plant, row: p.row, col: p.col });
  }
  return out;
};

export const useGame = () => {
  const [init, setInit] = useState<InitResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [view, setView] = useState<GameView>('loading');
  const [placements, setPlacements] = useState<PlacedSeed[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<DisplayedResult | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(
    null,
  );
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  // Bootstrap: fetch today's puzzle and the player's state.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/init');
        const data: InitResponse | ErrorResponse = await res.json();
        if (cancelled) return;
        if (isErrorResponse(data)) {
          setLoadError(data.message);
          return;
        }
        setInit(data);
        if (data.played !== null) {
          // Already played today: show the result, with the breakdown
          // recomputed locally from the stored placements.
          const breakdown = scorePlacement(data.puzzle, data.played.placements);
          setResult({
            score: breakdown,
            rank: data.played.rank,
            playersToday: data.playersToday,
            streak: data.streak,
            isNewBest: false,
            placements: data.played.placements,
          });
          setPlacements(
            mapPlacementsToHand(data.puzzle, data.played.placements),
          );
          setView('result');
        } else {
          setView('play');
        }
      } catch {
        if (!cancelled) setLoadError('Could not load today’s garden.');
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const puzzle = init?.puzzle ?? null;

  const liveScore = useMemo(
    () =>
      puzzle === null
        ? null
        : scorePlacement(
            puzzle,
            placements.map(({ plant, row, col }) => ({ plant, row, col })),
          ),
    [puzzle, placements],
  );

  const cellScores = useMemo(() => {
    const map = new Map<string, number>();
    if (liveScore !== null) {
      for (const p of liveScore.plants) {
        map.set(cellKey(p.row, p.col), p.points);
      }
    }
    return map;
  }, [liveScore]);

  const usedIndices = useMemo(
    () => new Set(placements.map((p) => p.handIndex)),
    [placements],
  );

  const selectSeed = useCallback(
    (handIndex: number) => {
      if (usedIndices.has(handIndex)) return;
      setSelectedIndex((current) =>
        current === handIndex ? null : handIndex,
      );
    },
    [usedIndices],
  );

  const cellClick = useCallback(
    (row: number, col: number) => {
      if (puzzle === null || view !== 'play') return;
      const key = cellKey(row, col);
      const existing = placements.find((p) => cellKey(p.row, p.col) === key);
      if (existing !== undefined) {
        // Pick the plant back up.
        setPlacements((current) =>
          current.filter((p) => cellKey(p.row, p.col) !== key),
        );
        return;
      }
      if (selectedIndex === null) {
        showToast('Pick a seed packet first, then tap a bed cell.');
        return;
      }
      const tile = tileAt(puzzle, row, col);
      if (tile !== 'soil' && tile !== 'sun' && tile !== 'shade') {
        showToast('Nothing grows on rock or water.');
        return;
      }
      const plant = puzzle.hand[selectedIndex];
      if (plant === undefined) return;
      setPlacements((current) => [
        ...current,
        { handIndex: selectedIndex, plant, row, col },
      ]);
      // Auto-select the next unused packet for fast planting.
      const next = puzzle.hand.findIndex(
        (id, i) => i !== selectedIndex && !usedIndices.has(i) && id !== undefined,
      );
      setSelectedIndex(next === -1 ? null : next);
    },
    [puzzle, placements, selectedIndex, usedIndices, view],
  );

  const clearGarden = useCallback(() => {
    setPlacements([]);
    setSelectedIndex(null);
  }, []);

  const submit = useCallback(async () => {
    if (puzzle === null || submitting) return;
    const plain: Placement[] = placements.map(({ plant, row, col }) => ({
      plant,
      row,
      col,
    }));
    const validationError = validatePlacements(puzzle, plain);
    if (validationError !== null) {
      showToast(validationError);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placements: plain }),
      });
      const data: SubmitResponse | ErrorResponse = await res.json();
      if (isErrorResponse(data)) {
        showToast(data.message);
        return;
      }
      setResult({
        score: data.score,
        rank: data.rank,
        playersToday: data.playersToday,
        streak: data.streak,
        isNewBest: data.isNewBest,
        placements: plain,
      });
      setView('result');
    } catch {
      showToast('Something went wrong growing your garden. Try again.');
    } finally {
      setSubmitting(false);
    }
  }, [puzzle, placements, submitting]);

  const share = useCallback(async () => {
    if (puzzle === null || result === null) return;
    const text = shareText(puzzle, result.placements, result.score.total);
    try {
      await navigator.clipboard.writeText(text);
      showToast('Garden copied — paste it anywhere!');
    } catch {
      showToast('Copy failed — screenshot your garden instead.');
    }
  }, [puzzle, result]);

  const discuss = useCallback(() => {
    const postId = init?.postId ?? '';
    if (postId === '') return;
    navigateTo(`https://www.reddit.com/comments/${postId.replace('t3_', '')}`);
  }, [init]);

  const showLeaderboard = useCallback(async () => {
    setView('leaderboard');
    setLoadingLeaderboard(true);
    try {
      const res = await fetch('/api/leaderboard');
      const data: LeaderboardResponse | ErrorResponse = await res.json();
      if (!isErrorResponse(data)) setLeaderboard(data);
    } catch {
      showToast('Could not load the leaderboard.');
    } finally {
      setLoadingLeaderboard(false);
    }
  }, []);

  const tryAgain = useCallback(() => {
    if (result === null || puzzle === null) return;
    setPlacements(mapPlacementsToHand(puzzle, result.placements));
    setSelectedIndex(null);
    setView('play');
  }, [result, puzzle]);

  const backToResult = useCallback(() => {
    setView(result === null ? 'play' : 'result');
  }, [result]);

  return {
    init,
    loadError,
    view,
    setView,
    puzzle,
    placements,
    selectedIndex,
    liveScore,
    cellScores,
    usedIndices,
    submitting,
    result,
    leaderboard,
    loadingLeaderboard,
    selectSeed,
    cellClick,
    clearGarden,
    submit,
    share,
    discuss,
    showLeaderboard,
    tryAgain,
    backToResult,
  };
};
