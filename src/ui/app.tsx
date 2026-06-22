import type { CliRenderer, KeyEvent } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { useState } from "react";
import { applyAppKey, createInitialAppState } from "../app-state";
import { searchResults } from "../search";

type AppProps = {
  initialQuery?: string;
  renderer: CliRenderer;
};

export function App({ initialQuery = "", renderer }: AppProps) {
  const [state, setState] = useState(() => createInitialAppState(initialQuery));

  useKeyboard((key: KeyEvent) => {
    setState((current) => {
      const next = applyAppKey(current, key);
      if (next.shouldExit) {
        renderer.destroy();
      }
      return next;
    });
  });

  if (state.screen === "detail") {
    return (
      <box style={{ flexDirection: "column", padding: 1 }}>
        <text>Terminal Pokedex</text>
        <text>Detail</text>
        <text>
          #{state.species.dexNumbers[1]} {state.species.name}
        </text>
        <text>Placeholder Detail</text>
        <text>
          Press / to return to Search. Press q, Escape, or Ctrl-C to exit.
        </text>
      </box>
    );
  }

  const results = searchResults(state.query, state.selectedIndex);

  return (
    <box style={{ flexDirection: "column", padding: 1 }}>
      <text>Terminal Pokedex</text>
      <text>Search</text>
      <text>Query: {state.query}</text>
      <text>Results</text>
      {results.map((result) => (
        <text key={result.slug}>
          {result.selected ? ">" : " "} #{result.dexNumbers[1]} {result.name}
        </text>
      ))}
      <text>
        Type to search. Use j/k, arrows, and Enter. Press q, Escape, or Ctrl-C
        to exit.
      </text>
    </box>
  );
}
