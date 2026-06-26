export function benchmarkResult(
  name: string,
  iterations: number,
  startNanoseconds: number,
  checksum: number,
) {
  const durationNanoseconds = Bun.nanoseconds() - startNanoseconds;
  const durationMs = durationNanoseconds / 1_000_000;

  return {
    checksum,
    durationMs: Number(durationMs.toFixed(2)),
    iterations,
    name,
    opsPerSecond: Math.round(iterations / (durationMs / 1000)),
  };
}
