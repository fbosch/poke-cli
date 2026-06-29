import { QueryClientProvider } from "@tanstack/react-query";
import { createAppQueryClient } from "#src/query-cache.ts";
import type { CliImageMode } from "#src/cli.tsx";
import { App } from "./app";

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
