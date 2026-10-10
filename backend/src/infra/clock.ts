/** Returns the current time in epoch milliseconds. Injected so that time-based logic is testable. */
export type Clock = () => number;

export const systemClock: Clock = () => Date.now();
