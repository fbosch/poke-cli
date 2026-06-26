import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createFileStorage } from "../../src/query-cache";
import { benchmarkResult } from "../support/benchmark";

const iterations = Number(Bun.env.PKDX_CACHE_BENCH_ITERATIONS ?? 1_000);
const cacheDirectory = await mkdtemp(join(tmpdir(), "pkdx-cache-bench-"));
const storage = createFileStorage(cacheDirectory);
const smallValue = JSON.stringify({
  queries: [{ state: { data: "pikachu" } }],
});
const largeValue = JSON.stringify({
  queries: Array.from({ length: 1_000 }, (_, index) => ({
    queryHash: `query-${index.toString()}`,
    state: { data: "x".repeat(256) },
  })),
});

try {
  await storage.setItem("small.json", smallValue);
  await storage.setItem("large.json", largeValue);

  const benchmarks = [
    {
      name: "file-storage-read-small",
      run: async () => (await storage.getItem("small.json"))?.length ?? 0,
    },
    {
      name: "file-storage-read-large",
      run: async () => (await storage.getItem("large.json"))?.length ?? 0,
    },
    {
      name: "file-storage-write-small",
      run: async () => {
        await storage.setItem("write-small.json", smallValue);
        return smallValue.length;
      },
    },
    {
      name: "file-storage-write-large",
      run: async () => {
        await storage.setItem("write-large.json", largeValue);
        return largeValue.length;
      },
    },
  ] as const;

  for (const benchmark of benchmarks) {
    for (let index = 0; index < 10; index += 1) {
      await benchmark.run();
    }
  }

  const results = [];
  for (const benchmark of benchmarks) {
    let checksum = 0;
    const start = Bun.nanoseconds();

    for (let index = 0; index < iterations; index += 1) {
      checksum += await benchmark.run();
    }

    results.push(benchmarkResult(benchmark.name, iterations, start, checksum));
  }

  console.table(results);
} finally {
  await rm(cacheDirectory, { force: true, recursive: true });
}
