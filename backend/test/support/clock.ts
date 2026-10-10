import type { Clock } from '../../src/infra/clock.js';

/** A clock the test moves by hand. */
export interface ManualClock {
  readonly clock: Clock;
  readonly advance: (ms: number) => void;
}

export const manualClock = (startIso = '2026-10-09T18:00:00Z'): ManualClock => {
  let now = Date.parse(startIso);
  return {
    clock: () => now,
    advance: (ms) => {
      now += ms;
    },
  };
};
