import { QueryClient } from "@tanstack/react-query";
import type {
  AsyncStorage,
  PersistedQuery,
} from "@tanstack/react-query-persist-client";
import { experimental_createQueryPersister } from "@tanstack/react-query-persist-client";
import { Database } from "bun:sqlite";
import { mkdir, rm, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { match, P } from "ts-pattern";
import { pokeApiQueryCacheSchemas } from "./pokeapi/schema";
import { pokespriteQueryCacheSchemas } from "./pokesprite-schema";
import { findExactSpecies } from "./search";

const oneHour = 60 * 60 * 1000;
const oneDay = 24 * oneHour;
const maxRuntimeGcTime = 24 * oneDay;

export const queryCacheBuster = `pkdx-query-cache-${schemaFingerprint([
  pokeApiQueryCacheSchemas,
  pokespriteQueryCacheSchemas,
])}`;

export const queryCachePolicies = {
  pokeapiResource: {
    staleTime: 7 * oneDay,
    gcTime: 30 * oneDay,
  },
  pokemonDetail: {
    staleTime: oneDay,
    gcTime: 14 * oneDay,
  },
  pokespriteMetadata: {
    staleTime: 30 * oneDay,
    gcTime: 90 * oneDay,
  },
} as const;

export const persistedQueryMaxAge = Math.max(
  ...Object.values(queryCachePolicies).map((policy) => policy.gcTime),
);

export const runtimeQueryCachePolicies = {
  pokeapiResource: runtimeQueryCachePolicy(queryCachePolicies.pokeapiResource),
  pokemonDetail: runtimeQueryCachePolicy(queryCachePolicies.pokemonDetail),
  pokespriteMetadata: runtimeQueryCachePolicy(
    queryCachePolicies.pokespriteMetadata,
  ),
} as const;

export const queryPersisterPrefix = "pkdx-query";

export type QueryCacheStorageStats = {
  buster: string;
  cacheDirectory: string;
  databaseBytes: number;
  databasePath: string;
  error?: string;
  maxAgeDays: number;
  mode: "in-memory" | "sqlite";
  prefix: string;
  queryCount: number;
  shardCounts: Partial<Record<QueryCacheShard, number>>;
  shmBytes: number;
  totalBytes: number;
  walBytes: number;
};

export function createAppQueryClient(): QueryClient {
  const queryPersister =
    Bun.env.NODE_ENV === "development" ? undefined : createQueryPersister();

  return new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: maxRuntimeGcTime,
        networkMode: "offlineFirst",
        ...(queryPersister === undefined
          ? {}
          : { persister: queryPersister.persisterFn }),
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        structuralSharing: true,
        retry: false,
        staleTime: 0,
      },
    },
  });
}

function runtimeQueryCachePolicy<
  T extends { gcTime: number; staleTime: number },
>(policy: T): T {
  return {
    ...policy,
    gcTime: Math.min(policy.gcTime, maxRuntimeGcTime),
  };
}

function schemaFingerprint(schemas: readonly unknown[]): string {
  const hasher = new Bun.CryptoHasher("sha256");
  for (const schema of schemas) {
    const source = JSON.stringify(schema);
    hasher.update(source.length.toString());
    hasher.update("\0");
    hasher.update(source);
    hasher.update("\0");
  }

  return hasher.digest("hex").slice(-6);
}

export function createQueryPersister(
  cacheDirectory = getDefaultCacheDirectory(),
): ReturnType<typeof experimental_createQueryPersister> {
  return experimental_createQueryPersister({
    buster: queryCacheBuster,
    maxAge: persistedQueryMaxAge,
    prefix: queryPersisterPrefix,
    storage: createSqliteQueryStorage(cacheDirectory),
  });
}

export async function queryCacheStorageStats(
  cacheDirectory = getDefaultCacheDirectory(),
): Promise<QueryCacheStorageStats> {
  const databasePath = queryCacheDatabasePath(cacheDirectory);
  const [databaseBytes, walBytes, shmBytes] = await Promise.all([
    fileSize(databasePath),
    fileSize(`${databasePath}-wal`),
    fileSize(`${databasePath}-shm`),
  ]);
  const baseStats = {
    buster: queryCacheBuster.slice(-6),
    cacheDirectory,
    databaseBytes,
    databasePath,
    maxAgeDays: Math.round(persistedQueryMaxAge / oneDay),
    mode: Bun.env.NODE_ENV === "development" ? "in-memory" : "sqlite",
    prefix: queryPersisterPrefix,
    queryCount: 0,
    shardCounts: {},
    shmBytes,
    totalBytes: databaseBytes + walBytes + shmBytes,
    walBytes,
  } satisfies QueryCacheStorageStats;

  if (databaseBytes === 0) {
    return baseStats;
  }

  let database: Database | undefined;
  try {
    database = new Database(databasePath, { readonly: true });
    const row = database
      .query("SELECT COUNT(*) AS count FROM query_cache")
      .get() as {
      count: number;
    };
    const shardRows = database
      .query("SELECT shard, COUNT(*) AS count FROM query_cache GROUP BY shard")
      .all() as { count: number; shard: QueryCacheShard }[];

    return {
      ...baseStats,
      queryCount: row.count,
      shardCounts: Object.fromEntries(
        shardRows.map((shardRow) => [shardRow.shard, shardRow.count]),
      ),
    };
  } catch (error) {
    return {
      ...baseStats,
      error: error instanceof Error ? error.message : "Could not read cache",
    };
  } finally {
    database?.close();
  }
}

export function createFileStorage(cacheDirectory: string): AsyncStorage {
  return {
    async getItem(key) {
      const file = Bun.file(cacheFilePath(cacheDirectory, key));
      if (!(await file.exists())) {
        return null;
      }

      return await file.text();
    },
    async setItem(key, value) {
      const filePath = cacheFilePath(cacheDirectory, key);
      await mkdir(dirname(filePath), { recursive: true });
      await Bun.write(filePath, value);
    },
    async removeItem(key) {
      await rm(cacheFilePath(cacheDirectory, key), { force: true });
    },
  };
}

export function createSqliteQueryStorage(cacheDirectory: string): AsyncStorage {
  let databasePromise: Promise<Database> | undefined;

  const getDatabase = async (): Promise<Database> => {
    databasePromise ??= openQueryCacheDatabase(cacheDirectory);
    return databasePromise;
  };

  return {
    async entries() {
      const rows = (await getDatabase())
        .query("SELECT key, value FROM query_cache")
        .all() as QueryCacheRow[];
      return rows.map((row) => [row.key, row.value]);
    },
    async getItem(key) {
      const row = (await getDatabase())
        .query("SELECT value FROM query_cache WHERE key = $key")
        .get({ $key: key }) as Pick<QueryCacheRow, "value"> | null;
      return row?.value ?? null;
    },
    async removeItem(key) {
      (await getDatabase())
        .query("DELETE FROM query_cache WHERE key = $key")
        .run({ $key: key });
    },
    async setItem(key, value) {
      const shard = queryCacheShardForPersistedValue(value);
      (await getDatabase())
        .query(
          `INSERT INTO query_cache (key, shard, value)
           VALUES ($key, $shard, $value)
           ON CONFLICT(key) DO UPDATE SET shard = excluded.shard, value = excluded.value
           WHERE query_cache.shard != excluded.shard OR query_cache.value != excluded.value`,
        )
        .run({ $key: key, $shard: shard, $value: value });
    },
  };
}

export function queryPersisterStorageKey(queryHash: string): string {
  return `${queryPersisterPrefix}-${queryHash}`;
}

export function serializePersistedQuery(query: PersistedQuery): string {
  return JSON.stringify(query);
}

function deserializePersistedQuery(value: string): PersistedQuery {
  return JSON.parse(value) as PersistedQuery;
}

function getDefaultCacheDirectory(): string {
  const baseDirectory =
    process.env.XDG_CACHE_HOME ?? join(Bun.env.HOME ?? ".", ".cache");
  return join(baseDirectory, "pkdx", "tanstack-query");
}

function cacheFilePath(cacheDirectory: string, key: string): string {
  return join(cacheDirectory, encodeURIComponent(key));
}

async function fileSize(filePath: string): Promise<number> {
  try {
    return (await stat(filePath)).size;
  } catch {
    return 0;
  }
}

type PokemonGeneration = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type QueryCacheShard = `generation-${PokemonGeneration}` | "shared";
type QueryCacheRow = {
  key: string;
  shard: QueryCacheShard;
  value: string;
};

export function queryCacheDatabasePath(cacheDirectory: string): string {
  return join(cacheDirectory, "queries.sqlite");
}

async function openQueryCacheDatabase(
  cacheDirectory: string,
): Promise<Database> {
  await mkdir(cacheDirectory, { recursive: true });
  const database = new Database(queryCacheDatabasePath(cacheDirectory), {
    create: true,
  });
  database.run("PRAGMA journal_mode = WAL");
  database.run(
    `CREATE TABLE IF NOT EXISTS query_cache (
      key TEXT PRIMARY KEY,
      shard TEXT NOT NULL,
      value TEXT NOT NULL
    )`,
  );
  database.run(
    "CREATE INDEX IF NOT EXISTS query_cache_shard_idx ON query_cache (shard)",
  );
  return database;
}

function queryCacheShardForPersistedValue(value: string): QueryCacheShard {
  try {
    return queryCacheShard(deserializePersistedQuery(value));
  } catch {
    return "shared";
  }
}

function queryCacheShard(query: PersistedQuery): QueryCacheShard {
  const queryKey = query.queryKey;
  if (!Array.isArray(queryKey)) {
    return "shared";
  }

  const keyParts: readonly [unknown, unknown, unknown] = [
    queryKey[0],
    queryKey[1],
    queryKey[2],
  ];

  return match(keyParts)
    .returnType<QueryCacheShard>()
    .with(["pokemon-detail", P.string, P._], ([, species]) =>
      shardForDexNumber(findExactSpecies(species)?.dexNumber),
    )
    .with(
      [
        P.union("pokesprite-rendered-sprite", "pokesprite-cached-asset"),
        P._,
        P.number,
      ],
      ([, , dexNumber]) => shardForDexNumber(dexNumber),
    )
    .with(["pokeapi-resource", P.string, P._], ([, url]) =>
      shardForPokeApiUrl(url),
    )
    .otherwise(() => "shared");
}

function shardForPokeApiUrl(url: string): QueryCacheShard {
  const match = /\/api\/v2\/(?:pokemon|pokemon-species)\/(\d+)\//.exec(url);
  return shardForDexNumber(
    match?.[1] === undefined ? undefined : Number.parseInt(match[1], 10),
  );
}

export function shardForDexNumber(
  dexNumber: number | undefined,
): QueryCacheShard {
  if (dexNumber === undefined || Number.isFinite(dexNumber) === false) {
    return "shared";
  }

  if (dexNumber <= 151) return "generation-1";
  if (dexNumber <= 251) return "generation-2";
  if (dexNumber <= 386) return "generation-3";
  if (dexNumber <= 493) return "generation-4";
  if (dexNumber <= 649) return "generation-5";
  if (dexNumber <= 721) return "generation-6";
  if (dexNumber <= 809) return "generation-7";
  if (dexNumber <= 905) return "generation-8";
  if (dexNumber <= 1025) return "generation-9";
  return "shared";
}

export type { PersistedQuery };
