import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { findExactSpecies } from "./search";
import { Root } from "./ui/root";

export const searchScreenTitle = "Search";

export type CliOptions = {
  debug: boolean;
  initialQuery: string;
};

export function getInitialSearchQuery(args: readonly string[]): string {
  return parseCliOptions(args).initialQuery;
}

export function parseCliOptions(args: readonly string[]): CliOptions {
  const queryArgs: string[] = [];
  let debug = false;

  for (const arg of args) {
    if (arg === "--debug") {
      debug = true;
      continue;
    }

    queryArgs.push(arg);
  }

  return {
    debug,
    initialQuery: queryArgs.join(" ").trim(),
  };
}

export async function main(args = Bun.argv.slice(2)): Promise<void> {
  const { debug, initialQuery } = parseCliOptions(args);

  if (process.env.PKDX_SMOKE_EXIT === "1") {
    process.stdout.write(
      `${findExactSpecies(initialQuery) === undefined ? searchScreenTitle : "Detail"}\n`,
    );
    return;
  }

  const renderer = await createCliRenderer({
    exitOnCtrlC: false,
    openConsoleOnError: debug,
  });
  if (debug) {
    renderer.toggleDebugOverlay();
  }

  const root = createRoot(renderer);
  let hasExited = false;

  root.render(
    <Root
      initialQuery={initialQuery}
      onExit={() => {
        if (hasExited) {
          return;
        }

        hasExited = true;
        root.unmount();
        renderer.destroy();
        setTimeout(() => process.exit(0), 0);
      }}
    />,
  );
}

if (import.meta.main) {
  await main();
}
