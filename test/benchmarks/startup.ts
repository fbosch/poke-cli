import { benchmarkResult } from "../support/benchmark";

const iterations = Number(Bun.env.PKDX_STARTUP_BENCH_ITERATIONS ?? 25);

const benchmarks = [
  {
    name: "import-search-module",
    script: 'await import("./src/search/index.ts")',
  },
  {
    name: "import-ui-root",
    script: 'await import("./src/ui/root.tsx")',
  },
  {
    name: "create-initial-search-state",
    script:
      'const { createInitialAppState } = await import("./src/app-state.ts"); createInitialAppState("pika")',
  },
  {
    name: "create-initial-detail-state",
    script:
      'const { createInitialAppState } = await import("./src/app-state.ts"); createInitialAppState("pikachu")',
  },
] as const;

const results = benchmarks.map((benchmark) => {
  let checksum = 0;
  const start = Bun.nanoseconds();

  for (let index = 0; index < iterations; index += 1) {
    const child = Bun.spawnSync(["bun", "-e", benchmark.script], {
      env: {
        ...Bun.env,
        PKDX_DISABLE_QUERY_CACHE: "1",
      },
      stderr: "pipe",
      stdout: "pipe",
    });

    if (child.exitCode !== 0) {
      throw new Error(
        `Startup benchmark ${benchmark.name} failed: ${child.stderr.toString()}`,
      );
    }

    checksum += child.exitCode + child.stdout.byteLength;
  }

  return benchmarkResult(benchmark.name, iterations, start, checksum);
});

console.table(results);
