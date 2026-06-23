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
  onExit: () => void;
};

export function Root({ initialQuery = "", onExit }: RootProps) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        buster: queryCacheBuster,
        maxAge: persistedQueryMaxAge,
        persister,
      }}
    >
      <App initialQuery={initialQuery} onExit={onExit} />
    </PersistQueryClientProvider>
  );
}
