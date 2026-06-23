import type { CliRenderer, KeyEvent } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { applyAppKey, createInitialAppState } from "../app-state";
import { pokemonDetailQueryOptions } from "../pokemon-detail";
import { minimumSearchQueryLength, searchResults } from "../search";
import { colors, textStyles } from "./design-tokens";

type AppProps = {
  initialQuery?: string;
  renderer: CliRenderer;
};

export function App({ initialQuery = "", renderer }: AppProps) {
  const [state, setState] = useState(() => createInitialAppState(initialQuery));
  const queryClient = useQueryClient();

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
    return <DetailView state={state} queryClient={queryClient} />;
  }

  const results = searchResults(state.query, state.selectedIndex);
  const queryLabel =
    state.query.length === 0 ? "Search Pokemon species..." : state.query;
  const hasSearchableQuery =
    state.query.trim().length >= minimumSearchQueryLength;

  return (
    <box
      style={{
        alignItems: "center",
        flexDirection: "column",
        justifyContent: "center",
        padding: 1,
        height: "100%",
        position: "relative",
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
        {hasSearchableQuery ? (
          <box
            style={{
              flexDirection: "column",
              left: 0,
              position: "absolute",
              top: 3,
              width: 56,
              zIndex: 100,
            }}
          >
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
          </box>
        ) : null}
      </box>

      <text
        fg={colors.muted}
        attributes={textStyles.muted}
        style={{ bottom: 1, position: "absolute" }}
      >
        Type to filter | Shift-J/K move | Enter opens | Esc exits
      </text>
    </box>
  );
}

type DetailViewProps = {
  queryClient: ReturnType<typeof useQueryClient>;
  state: Extract<
    ReturnType<typeof createInitialAppState>,
    { screen: "detail" }
  >;
};

function DetailView({ state, queryClient }: DetailViewProps) {
  const detail = useQuery(
    pokemonDetailQueryOptions(state.species, queryClient),
  );

  if (detail.isPending) {
    return (
      <box style={{ flexDirection: "column", padding: 1 }}>
        <text>Terminal Pokedex</text>
        <text>Detail</text>
        <text>
          Loading #{state.species.dexNumbers[1] ?? state.species.dexNumbers[0]}{" "}
          {state.species.name}...
        </text>
        <text>
          Press / to return to Search. Press q, Escape, or Ctrl-C to exit.
        </text>
      </box>
    );
  }

  if (detail.isError) {
    return (
      <box style={{ flexDirection: "column", padding: 1 }}>
        <text>Terminal Pokedex</text>
        <text>Detail</text>
        <text>Could not load Detail for {state.species.name}.</text>
        <text>
          Press / to return to Search. Press q, Escape, or Ctrl-C to exit.
        </text>
      </box>
    );
  }

  return (
    <box style={{ flexDirection: "column", padding: 1 }}>
      <text>Terminal Pokedex</text>
      <text>Detail</text>
      <text>
        #{detail.data.dexNumber.toString().padStart(3, "0")} {detail.data.name}
      </text>
      <text>Types: {detail.data.types.join(" / ")}</text>
      <text>
        Abilities:{" "}
        {detail.data.abilities.map((ability) => ability.name).join(", ")}
      </text>
      <text>
        Height: {detail.data.heightMeters.toFixed(1)} m | Weight:{" "}
        {detail.data.weightKilograms.toFixed(1)} kg
      </text>
      <text>
        Stats:{" "}
        {detail.data.stats
          .map((stat) => `${stat.name} ${stat.base}`)
          .join(" | ")}
      </text>
      <text>{detail.data.flavorText}</text>
      <text>Sprite: {detail.data.sprite.label}</text>
      <text>
        Press / to return to Search. Press q, Escape, or Ctrl-C to exit.
      </text>
    </box>
  );
}
