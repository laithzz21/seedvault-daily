import type { PlantId } from '../shared/game';

/**
 * A seed placed on the bed, tracked by its hand index so the two packets of
 * a doubled species stay distinct. The `handIndex` is client-only and is
 * stripped before submitting to the server.
 */
export type PlacedSeed = {
  handIndex: number;
  plant: PlantId;
  row: number;
  col: number;
};

export const cellKey = (row: number, col: number): string => `${row},${col}`;
