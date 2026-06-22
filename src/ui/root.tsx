import type { CliRenderer } from "@opentui/core";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import {
  createAppQueryClient,
  createQueryPersister,
  persistedQueryMaxAge,
  queryCacheBuster,
} from "../query-cache";
import { App } from "./app";

const queryClient = createAppQueryClient();
const persister = createQueryPersister();

type RootProps = {
  initialQuery?: string;
  renderer: CliRenderer;
};

export function Root({ initialQuery = "", renderer }: RootProps) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        buster: queryCacheBuster,
        maxAge: persistedQueryMaxAge,
        persister,
      }}
    >
      <App initialQuery={initialQuery} renderer={renderer} />
    </PersistQueryClientProvider>
  );
}
