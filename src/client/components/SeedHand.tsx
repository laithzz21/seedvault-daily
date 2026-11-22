import { PLANTS, type PlantId } from '../../shared/game';
import { PlantArt } from './PlantArt';

type SeedHandProps = {
  /** Today's hand: 8 plants (one species appears twice). */
  hand: PlantId[];
  /** Hand indices already planted on the bed. */
  usedIndices: Set<number>;
  /** Currently selected hand index, if any. */
  selectedIndex: number | null;
  disabled: boolean;
  onSelect: (handIndex: number) => void;
};

/**
 * The seed packets. Tap a packet to pick it up, then tap a bed cell to
 * plant it. The doubled species shows two packets.
 */
export const SeedHand = ({
  hand,
  usedIndices,
  selectedIndex,
  disabled,
  onSelect,
}: SeedHandProps) => {
  // Count how many packets of each species exist, to label the pair.
  const speciesCount = new Map<PlantId, number>();
  for (const id of hand) speciesCount.set(id, (speciesCount.get(id) ?? 0) + 1);

  return (
    <div className="w-full max-w-[420px]">
      <p className="mb-2 text-center text-sm font-semibold text-bark/70">
        Your seed packets — tap one, then tap a bed cell
      </p>
      <div className="grid grid-cols-4 gap-2">
        {hand.map((plant, index) => {
          const info = PLANTS[plant];
          const used = usedIndices.has(index);
          const selected = selectedIndex === index;
          const isPair = (speciesCount.get(plant) ?? 0) > 1;
          return (
            <button
              key={index}
              type="button"
              disabled={disabled || used}
              onClick={() => onSelect(index)}
              aria-label={`${info.name} seed packet. ${info.rule}`}
              aria-pressed={selected}
              className={[
                'relative flex flex-col items-center rounded-xl border-2 bg-white px-1 py-2 shadow-sm transition-all',
                selected
                  ? '-translate-y-1 border-leaf-dark bg-leaf-pale shadow-md ring-2 ring-leaf-dark'
                  : 'border-soil-light hover:border-leaf',
                used ? 'opacity-30 saturate-0' : 'cursor-pointer',
              ].join(' ')}
            >
              <PlantArt plant={plant} size={36} />
              <span className="mt-1 text-[11px] font-bold leading-tight text-bark">
                {info.name}
              </span>
              <span className="mt-0.5 px-0.5 text-center text-[9px] leading-tight text-bark/60">
                {info.rule}
              </span>
              {isPair && (
                <span className="absolute right-1 top-1 rounded-full bg-sunbeam px-1 text-[9px] font-bold text-bark">
                  ×2
                </span>
              )}
              {used && (
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-leaf-dark">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
