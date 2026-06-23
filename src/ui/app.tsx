import type { CliRenderer, KeyEvent } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { useState } from "react";
import { applyAppKey, createInitialAppState } from "../app-state";
import { minimumSearchQueryLength, searchResults } from "../search";
import { colors, textStyles } from "./design-tokens";

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
  const queryLabel =
    state.query.length === 0 ? "Search Pokemon species..." : state.query;
  const hasSearchableQuery =
    state.query.trim().length >= minimumSearchQueryLength;
  const suggestionsHeight = 10;

  return (
    <box
      style={{
        alignItems: "center",
        flexDirection: "column",
        justifyContent: "center",
        padding: 1,
        height: "100%",
      }}
    >
      <box style={{ position: "relative", width: 56 }}>
        <box
          border
          borderColor={colors.accent}
          style={{ flexDirection: "column", paddingX: 1, width: 56 }}
        >
          <text
            attributes={
              state.query.length === 0 ? textStyles.muted : textStyles.active
            }
            {...(state.query.length === 0 ? { fg: colors.muted } : {})}
          >{`> ${queryLabel}`}</text>
        </box>
        <text
          attributes={textStyles.active}
          style={{ left: 2, position: "absolute", top: 0 }}
        >
          <span fg={colors.indicatorBlue}>⬤</span>
          <span> </span>
          <span fg={colors.indicatorRed}>●</span>
          <span> </span>
          <span fg={colors.indicatorYellow}>●</span>
          <span> </span>
          <span fg={colors.indicatorGreen}>●</span>
          <span> Pokedex </span>
        </text>
      </box>

      <box
        style={{
          flexDirection: "column",
          height: suggestionsHeight,
          paddingTop: 2,
          width: 56,
        }}
      >
        {hasSearchableQuery ? (
          <>
            {results.length === 0 ? (
              <text fg={colors.muted} attributes={textStyles.muted}>
                No species match this query.
              </text>
            ) : null}
            {results.map((result) => {
              const label = ` #${result.dexNumbers[1] ?? result.dexNumbers[0]} ${result.name}`;

              return (
                <text
                  key={result.slug}
                  attributes={
                    result.selected ? textStyles.selected : textStyles.normal
                  }
                  {...(result.selected
                    ? { bg: colors.selected, fg: colors.selectedText }
                    : {})}
                >
                  {result.selected ? label.padEnd(56) : label}
                </text>
              );
            })}
          </>
        ) : null}
      </box>

      <text fg={colors.muted} attributes={textStyles.muted}>
        Type to filter | Shift-J/K move | Enter opens | Esc exits
      </text>
    </box>
  );
}
