import type { PlanItem } from '@/lib/constants';

/** Keep sandbox / test tiers at the end of the grid. */
export function sortPlansForDisplay(plans: PlanItem[]): PlanItem[] {
  return [...plans].sort((a, b) => {
    const ta = a.testOnly ? 1 : 0;
    const tb = b.testOnly ? 1 : 0;
    if (ta !== tb) return ta - tb;
    return a.priceAUD - b.priceAUD;
  });
}
