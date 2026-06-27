import { QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import {
  createAppQueryClient,
  createQueryPersister,
  persistedQueryMaxAge,
  queryCacheBuster,
} from "#src/query-cache.ts";
import type { CliImageMode } from "#src/cli.tsx";
import { App } from "./app";

const persistQueryCache = Bun.env.NODE_ENV !== "development";
const queryClient = createAppQueryClient();

type RootProps = {
  debug?: boolean;
  imageMode?: CliImageMode;
  initialQuery?: string;
  onExit: () => void;
};

export function Root({
  debug = false,
  imageMode = "builtin",
  initialQuery = "",
  onExit,
}: RootProps) {
  if (!persistQueryCache) {
    return (
      <QueryClientProvider client={queryClient}>
        <App
          debug={debug}
          imageMode={imageMode}
          initialQuery={initialQuery}
          onExit={onExit}
        />
      </QueryClientProvider>
    );
  }

  const persister = createQueryPersister();

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        buster: queryCacheBuster,
        maxAge: persistedQueryMaxAge,
        persister,
      }}
    >
      <App
        debug={debug}
        imageMode={imageMode}
        initialQuery={initialQuery}
        onExit={onExit}
      />
    </PersistQueryClientProvider>
  );
}
