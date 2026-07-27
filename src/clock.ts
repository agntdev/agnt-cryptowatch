let source = () => Date.now();
export const now = () => source();
export const setClockForTest = (fn: (() => number) | undefined) => { source = fn ?? (() => Date.now()); };
