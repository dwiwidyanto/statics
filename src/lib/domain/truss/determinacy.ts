import type { TrussModel } from './types';
import { getReactionsForSupport } from '../supports/support';

/**
 * Counts the members (m), support reaction components (r), and joints (j) of a truss.
 */
export function countTrussUnknowns(truss: TrussModel): { m: number; r: number; j: number } {
  const m = truss.members.length;
  const j = truss.joints.length;
  let r = 0;
  for (const s of truss.supports) {
    const rawReactions = getReactionsForSupport(s);
    const filtered = rawReactions.filter(rx => rx.type !== 'moment');
    r += filtered.length;
  }
  return { m, r, j };
}

/**
 * Classifies the truss determinacy mathematically using the count relation m + r vs 2j.
 */
export function classifyTrussByCount(
  truss: TrussModel
): 'statically_determinate' | 'statically_indeterminate' | 'unstable' {
  const { m, r, j } = countTrussUnknowns(truss);
  const equations = 2 * j;
  const unknowns = m + r;

  if (unknowns < equations) {
    return 'unstable';
  } else if (unknowns > equations) {
    return 'statically_indeterminate';
  } else {
    return 'statically_determinate';
  }
}
