import type { KeyEvent } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  applyAppKey,
  createInitialAppState,
  detailLoadFailed,
  detailLoadSucceeded,
  type DetailState,
} from "../app-state";
import type { PokemonDetail } from "../pokemon-detail";
import { pokemonDetailQueryOptions } from "../pokemon-detail";
import { minimumSearchQueryLength, searchResults } from "../search";
import { colors, textStyles } from "./design-tokens";

const detailCardWidth = 100;
const detailTitleWidth = 86;
const statBarWidth = 22;

type AppProps = {
  initialQuery?: string;
  onExit: () => void;
};

export function App({ initialQuery = "", onExit }: AppProps) {
  const [state, setState] = useState(() => createInitialAppState(initialQuery));
  const queryClient = useQueryClient();

  useKeyboard((key: KeyEvent) => {
    setState((current) => {
      return applyAppKey(current, key);
    });
  });

  useEffect(() => {
    if (state.shouldExit) {
      onExit();
    }
  }, [onExit, state.shouldExit]);

  if (state.screen === "detail") {
    return (
      <DetailView
        onLoadFailed={(species, error) => {
          setState((current) =>
            current.screen === "detail"
              ? detailLoadFailed(current, species, error)
              : current,
          );
        }}
        onLoadSucceeded={(species, detail) => {
          setState((current) =>
            current.screen === "detail"
              ? detailLoadSucceeded(current, species, detail)
              : current,
          );
        }}
        queryClient={queryClient}
        state={state}
      />
    );
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

      <InstructionFooter>
        Type to filter | Shift-J/K move | Enter opens | Esc exits
      </InstructionFooter>
    </box>
  );
}

type DetailViewProps = {
  onLoadFailed: (species: DetailState["species"], error: unknown) => void;
  onLoadSucceeded: (
    species: DetailState["species"],
    detail: PokemonDetail,
  ) => void;
  queryClient: ReturnType<typeof useQueryClient>;
  state: DetailState;
};

function DetailView({
  onLoadFailed,
  onLoadSucceeded,
  queryClient,
  state,
}: DetailViewProps) {
  const retryErrorUpdatedAt = useRef<number | undefined>(undefined);
  const detail = useQuery({
    ...pokemonDetailQueryOptions(state.species, queryClient),
    enabled: state.status !== "error",
  });

  useEffect(() => {
    if (detail.data !== undefined && state.status !== "ready") {
      retryErrorUpdatedAt.current = undefined;
      onLoadSucceeded(state.species, detail.data);
    }
  }, [detail.data, onLoadSucceeded, state.species, state.status]);

  useEffect(() => {
    if (state.retryToken > 0 && state.status === "loading") {
      retryErrorUpdatedAt.current = detail.errorUpdatedAt;
      void detail.refetch();
    }
  }, [detail.errorUpdatedAt, detail.refetch, state.retryToken, state.status]);

  useEffect(() => {
    if (
      detail.isError &&
      !detail.isFetching &&
      state.status !== "error" &&
      retryErrorUpdatedAt.current !== detail.errorUpdatedAt
    ) {
      retryErrorUpdatedAt.current = undefined;
      onLoadFailed(state.species, detail.error);
    }
  }, [
    detail.error,
    detail.errorUpdatedAt,
    detail.isError,
    detail.isFetching,
    onLoadFailed,
    state.species,
    state.status,
  ]);

  if (state.detail !== undefined) {
    return (
      <LoadedDetailView
        detail={state.detail.detail}
        errorMessage={state.status === "error" ? state.errorMessage : undefined}
        loadingSpecies={state.status === "loading" ? state.species : undefined}
      />
    );
  }

  if (state.status === "loading") {
    return (
      <DetailScreen>
        <PokedexCard>
          <DetailCardTitle
            left={`Loading #${state.species.dexNumbers[1] ?? state.species.dexNumbers[0]} ${state.species.name}...`}
            right="Detail"
          />
          <box
            style={{
              alignItems: "center",
              height: 10,
              justifyContent: "center",
            }}
          >
            <text fg={colors.muted} attributes={textStyles.muted}>
              Preparing Detail data...
            </text>
          </box>
        </PokedexCard>
        <InstructionFooter>
          Press / to return to Search | q/Esc exits
        </InstructionFooter>
      </DetailScreen>
    );
  }

  return (
    <DetailScreen>
      <PokedexCard>
        <DetailCardTitle
          left={`Could not load #${state.species.dexNumbers[1] ?? state.species.dexNumbers[0]} ${state.species.name}`}
          right="Recoverable"
        />
        <box style={{ flexDirection: "column", gap: 1, padding: 1 }}>
          <text fg={colors.muted} attributes={textStyles.muted}>
            {state.errorMessage ??
              "Detail data is unavailable. If offline, this species is not cached yet."}
          </text>
        </box>
      </PokedexCard>
      <InstructionFooter>r retry | / Search | q/Esc exits</InstructionFooter>
    </DetailScreen>
  );
}

type LoadedDetailViewProps = {
  detail: PokemonDetail;
  errorMessage: string | undefined;
  loadingSpecies: DetailState["species"] | undefined;
};

function LoadedDetailView({
  detail,
  errorMessage,
  loadingSpecies,
}: LoadedDetailViewProps) {
  const abilityLabel = detail.abilities
    .map((ability) => `${ability.name}${ability.isHidden ? " (Hidden)" : ""}`)
    .join(", ");

  return (
    <DetailScreen>
      <PokedexCard>
        <DetailCardTitle
          left={`#${detail.dexNumber.toString().padStart(3, "0")} ${detail.name}`}
          right={<TypeLabels types={detail.types} />}
          rightWidth={detail.types.join(" / ").length}
        />
        {loadingSpecies !== undefined ? (
          <text fg={colors.muted} attributes={textStyles.muted}>
            Loading next: #
            {loadingSpecies.dexNumbers[1] ?? loadingSpecies.dexNumbers[0]}{" "}
            {loadingSpecies.name}...
          </text>
        ) : null}
        {errorMessage !== undefined ? (
          <text fg={colors.muted} attributes={textStyles.muted}>
            Could not load next Detail: {errorMessage}. Press r to retry or / to
            search.
          </text>
        ) : null}
        <box style={{ flexDirection: "row", gap: 1 }}>
          <box
            border
            borderColor={colors.accent}
            style={{
              flexDirection: "column",
              minHeight: 10,
              paddingX: 1,
              width: 30,
            }}
          >
            <text attributes={textStyles.active}>Sprite</text>
            <box
              style={{
                alignItems: "center",
                flexGrow: 1,
                justifyContent: "center",
              }}
            >
              <text fg={colors.muted} attributes={textStyles.muted}>
                {detail.sprite.label}
              </text>
            </box>
          </box>
          <box
            border
            borderColor={colors.accent}
            style={{
              flexDirection: "column",
              gap: 1,
              minHeight: 10,
              paddingX: 1,
              width: 61,
            }}
          >
            <text attributes={textStyles.active}>Overview</text>
            <text>{detail.flavorText}</text>
            <text>
              Height {detail.heightMeters.toFixed(1)} m | Weight{" "}
              {detail.weightKilograms.toFixed(1)} kg
            </text>
            <text>Abilities {abilityLabel}</text>
          </box>
        </box>
        <box style={{ flexDirection: "row", gap: 1 }}>
          <box
            border
            borderColor={colors.accent}
            style={{ flexDirection: "column", paddingX: 1, width: 45 }}
          >
            <text attributes={textStyles.active}>Stats</text>
            {detail.stats.map((stat) => (
              <text key={stat.name}>
                <span>{stat.name.padEnd(11)}</span>
                <span> {stat.base.toString().padStart(3)} </span>
                <StatBar name={stat.name} value={stat.base} />
              </text>
            ))}
          </box>
          <box
            border
            borderColor={colors.accent}
            style={{ flexDirection: "column", paddingX: 1, width: 46 }}
          >
            <text attributes={textStyles.active}>Damage Taken</text>
            <text fg={colors.muted} attributes={textStyles.muted}>
              Coming in the next slice.
            </text>
          </box>
        </box>
      </PokedexCard>
      <InstructionFooter>
        Press / to return to Search | q/Esc exits
      </InstructionFooter>
    </DetailScreen>
  );
}

function DetailScreen({ children }: { children: React.ReactNode }) {
  return (
    <box
      style={{
        alignItems: "center",
        flexDirection: "column",
        height: "100%",
        justifyContent: "center",
        padding: 1,
        position: "relative",
      }}
    >
      {children}
    </box>
  );
}

function PokedexCard({ children }: { children: React.ReactNode }) {
  return (
    <box
      style={{
        flexDirection: "column",
        gap: 1,
        position: "relative",
        width: detailCardWidth,
      }}
    >
      <box
        border
        borderColor={colors.accent}
        style={{
          flexDirection: "column",
          gap: 1,
          paddingX: 1,
          width: detailCardWidth,
        }}
      >
        {children}
      </box>
      <PokedexHeader />
    </box>
  );
}

function PokedexHeader() {
  return (
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
  );
}

function DetailCardTitle({
  left,
  right,
  rightWidth,
}: {
  left: string;
  right: React.ReactNode;
  rightWidth?: number;
}) {
  const resolvedRightWidth =
    rightWidth ?? (typeof right === "string" ? right.length : 0);
  const spacerWidth = Math.max(
    1,
    detailTitleWidth - left.length - resolvedRightWidth,
  );

  return (
    <text attributes={textStyles.active}>
      <span>{left}</span>
      <span>{" ".repeat(spacerWidth)}</span>
      {right}
    </text>
  );
}

function TypeLabels({ types }: { types: string[] }) {
  return (
    <span>
      {types.map((type, index) => (
        <span key={type}>
          {index > 0 ? <span fg={colors.muted}> / </span> : null}
          <span bg={typeColor(type)} fg={typeTextColor(type)}>
            {` ${type} `}
          </span>
        </span>
      ))}
    </span>
  );
}

function StatBar({ name, value }: { name: string; value: number }) {
  const filled = Math.max(1, Math.min(statBarWidth, Math.round(value / 8)));
  const empty = statBarWidth - filled;

  return (
    <span>
      <span fg={statColor(name)}>{"━".repeat(filled)}</span>
      <span fg={colors.statEmpty}>{"━".repeat(empty)}</span>
    </span>
  );
}

function statColor(name: string) {
  const statColors: Record<string, (typeof colors)[keyof typeof colors]> = {
    Attack: colors.statAttack,
    Defense: colors.statDefense,
    HP: colors.statHp,
    "Sp. Attack": colors.statSpecialAttack,
    "Sp. Defense": colors.statSpecialDefense,
    Speed: colors.statSpeed,
  };

  return statColors[name] ?? colors.muted;
}

function typeColor(type: string) {
  const typeColors: Record<string, (typeof colors)[keyof typeof colors]> = {
    Bug: colors.typeBug,
    Dark: colors.typeDark,
    Dragon: colors.typeDragon,
    Electric: colors.typeElectric,
    Fairy: colors.typeFairy,
    Fighting: colors.typeFighting,
    Fire: colors.typeFire,
    Flying: colors.typeFlying,
    Ghost: colors.typeGhost,
    Grass: colors.typeGrass,
    Ground: colors.typeGround,
    Ice: colors.typeIce,
    Normal: colors.typeNormal,
    Poison: colors.typePoison,
    Psychic: colors.typePsychic,
    Rock: colors.typeRock,
    Steel: colors.typeSteel,
    Water: colors.typeWater,
  };

  return typeColors[type] ?? colors.muted;
}

function typeTextColor(type: string) {
  const lightTextTypes = new Set([
    "Dark",
    "Dragon",
    "Fighting",
    "Fire",
    "Ghost",
    "Poison",
    "Psychic",
    "Water",
  ]);

  return lightTextTypes.has(type)
    ? colors.typeTagTextLight
    : colors.typeTagTextDark;
}

function InstructionFooter({ children }: { children: string }) {
  return (
    <text
      fg={colors.muted}
      attributes={textStyles.muted}
      style={{ alignSelf: "center", bottom: 1, position: "absolute" }}
    >
      {children}
    </text>
  );
}
