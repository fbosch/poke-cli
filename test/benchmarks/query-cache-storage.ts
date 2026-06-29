import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type {
  PersistedClient,
  PersistedQuery,
} from "@tanstack/react-query-persist-client";
import {
  createFileStorage,
  createSqliteQueryStorage,
  queryCacheBuster,
  queryPersisterStorageKey,
  serializePersistedQuery,
} from "../../src/query-cache";
import { benchmarkResult } from "../support/benchmark";

const iterations = Number(Bun.env.PKDX_CACHE_BENCH_ITERATIONS ?? 1_000);
const persistedClientIterations = Number(
  Bun.env.PKDX_PERSISTED_CLIENT_BENCH_ITERATIONS ?? Math.min(iterations, 100),
);
const cacheDirectory = await mkdtemp(join(tmpdir(), "pkdx-cache-bench-"));
const storage = createFileStorage(cacheDirectory);
const queryLevelStorage = createSqliteQueryStorage(cacheDirectory);
const smallValue = JSON.stringify({
  queries: [{ state: { data: "pikachu" } }],
});
const largeValue = JSON.stringify({
  queries: Array.from({ length: 1_000 }, (_, index) => ({
    queryHash: `query-${index.toString()}`,
    state: { data: "x".repeat(256) },
  })),
});
const largePersistedClient: PersistedClient = {
  buster: queryCacheBuster,
  clientState: {
    mutations: [],
    queries: Array.from({ length: 1_000 }, (_, index) => {
      const dexNumber = (index % 1_025) + 1;
      return {
        queryHash: `query-${index.toString()}`,
        queryKey: queryKeyForDexNumber(dexNumber, index),
        state: persistedQueryState({
          dexNumber,
          payload: "x".repeat(256),
        }),
      };
    }),
  },
  timestamp: 123,
};
const largePersistedQueries: PersistedQuery[] =
  largePersistedClient.clientState.queries.map((query) => ({
    buster: queryCacheBuster,
    queryHash: query.queryHash,
    queryKey: query.queryKey,
    state: query.state,
  }));

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
  const persistedClientBenchmarks = [
    {
      name: "persisted-client-save-monolithic-1000-queries",
      run: async () => persistMonolithicClient(storage, largePersistedClient),
    },
    {
      name: "persisted-client-restore-monolithic-1000-queries",
      run: async () => restoreMonolithicClient(storage),
    },
    {
      name: "persisted-query-save-sqlite-storage-1000-queries",
      run: async () => persistQueryLevelStorage(queryLevelStorage),
    },
    {
      name: "persisted-query-restore-one-sqlite-storage",
      run: async () => restoreOneQueryLevelQuery(queryLevelStorage),
    },
    {
      name: "persisted-query-restore-all-sqlite-storage-1000-queries",
      run: async () => restoreAllQueryLevelQueries(queryLevelStorage),
    },
  ] as const;

  for (const benchmark of benchmarks) {
    for (let index = 0; index < 10; index += 1) {
      await benchmark.run();
    }
  }
  await persistMonolithicClient(storage, largePersistedClient);
  await persistQueryLevelStorage(queryLevelStorage);
  for (const benchmark of persistedClientBenchmarks) {
    for (let index = 0; index < 3; index += 1) {
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

  const persistedClientResults = [];
  for (const benchmark of persistedClientBenchmarks) {
    let checksum = 0;
    const start = Bun.nanoseconds();

    for (let index = 0; index < persistedClientIterations; index += 1) {
      checksum += await benchmark.run();
    }

    persistedClientResults.push(
      benchmarkResult(
        benchmark.name,
        persistedClientIterations,
        start,
        checksum,
      ),
    );
  }

  console.table(persistedClientResults);
} finally {
  await rm(cacheDirectory, { force: true, recursive: true });
}

async function persistMonolithicClient(
  targetStorage: typeof storage,
  client: PersistedClient,
): Promise<number> {
  const value = JSON.stringify(client);
  await targetStorage.setItem("query-client.json", value);
  return value.length;
}

async function restoreMonolithicClient(
  targetStorage: typeof storage,
): Promise<number> {
  const value = await targetStorage.getItem("query-client.json");
  if (value === null || value === undefined) {
    return 0;
  }

  const client = JSON.parse(value) as PersistedClient;
  return client.clientState.queries.length;
}

async function persistQueryLevelStorage(
  targetStorage: typeof queryLevelStorage,
): Promise<number> {
  let checksum = 0;
  for (const query of largePersistedQueries) {
    const value = serializePersistedQuery(query);
    await targetStorage.setItem(
      queryPersisterStorageKey(query.queryHash),
      value,
    );
    checksum += value.length;
  }
  return checksum;
}

async function restoreOneQueryLevelQuery(
  targetStorage: typeof queryLevelStorage,
): Promise<number> {
  const value = await targetStorage.getItem(
    queryPersisterStorageKey("query-25"),
  );
  if (value === null || value === undefined) {
    return 0;
  }

  return (JSON.parse(value) as PersistedQuery).state.data === undefined ? 0 : 1;
}

async function restoreAllQueryLevelQueries(
  targetStorage: typeof queryLevelStorage,
): Promise<number> {
  let checksum = 0;
  for (const query of largePersistedQueries) {
    const value = await targetStorage.getItem(
      queryPersisterStorageKey(query.queryHash),
    );
    if (value !== null && value !== undefined) {
      checksum += 1;
    }
  }
  return checksum;
}

function queryKeyForDexNumber(dexNumber: number, index: number) {
  switch (index % 4) {
    case 0:
      return [
        "pokeapi-resource",
        `https://pokeapi.co/api/v2/pokemon/${dexNumber.toString()}/`,
      ];
    case 1:
      return [
        "pokeapi-resource",
        `https://pokeapi.co/api/v2/pokemon-species/${dexNumber.toString()}/`,
      ];
    case 2:
      return [
        "pokesprite-cached-asset",
        "pokemon-sprites",
        dexNumber,
        "$",
        false,
      ];
    default:
      return ["pokesprite-metadata", "metadata-url"];
  }
}

function persistedQueryState(data: unknown) {
  return {
    data,
    dataUpdateCount: 1,
    dataUpdatedAt: Date.now(),
    error: null,
    errorUpdateCount: 0,
    errorUpdatedAt: 0,
    fetchFailureCount: 0,
    fetchFailureReason: null,
    fetchMeta: null,
    fetchStatus: "idle" as const,
    isInvalidated: false,
    status: "success" as const,
  };
}
