import { RGBA } from "@opentui/core";
import { useQuery, type useQueryClient } from "@tanstack/react-query";
import type { PokemonForm } from "../../pokemon-detail";
import { pokespriteRenderedSpriteQueryOptions } from "../../pokesprite";
import type { SpeciesIndexEntry } from "../../search";
import type { RenderedSprite, SpriteCell } from "../../sprite-rendering";
import { colors, textStyles } from "../design-tokens";

const detailSpriteCanvasHeight = 15;
const detailSpriteCanvasWidth = 40;

type PokemonSpritePanelProps = {
  form: PokemonForm | undefined;
  queryClient: ReturnType<typeof useQueryClient>;
  shiny: boolean;
  species: SpeciesIndexEntry;
};

export function PokemonSpritePanel({
  form,
  queryClient,
  shiny,
  species,
}: PokemonSpritePanelProps) {
  const sprite = useQuery(
    pokespriteRenderedSpriteQueryOptions(species, queryClient, shiny, form),
  );

  if (sprite.data !== undefined) {
    return <PokemonSpriteArtwork sprite={sprite.data} />;
  }

  if (sprite.isError) {
    return <PokemonSpriteFallback error={sprite.error} />;
  }

  return <PokemonSpriteLoading />;
}

function PokemonSpriteLoading() {
  return (
    <box
      style={{
        alignItems: "center",
        flexDirection: "column",
        height: detailSpriteCanvasHeight,
        justifyContent: "center",
        width: detailSpriteCanvasWidth,
      }}
    />
  );
}

export function PokemonSpriteFallback({ error }: { error: unknown }) {
  return (
    <box
      style={{
        alignItems: "center",
        flexDirection: "column",
        height: detailSpriteCanvasHeight,
        justifyContent: "center",
        width: detailSpriteCanvasWidth,
      }}
    >
      <text fg={colors.muted} attributes={textStyles.muted}>
        Sprite unavailable
      </text>
      <text fg={colors.muted} attributes={textStyles.muted}>
        {spriteErrorMessage(error)}
      </text>
      <text fg={colors.muted} attributes={textStyles.muted}>
        Detail data is still available.
      </text>
    </box>
  );
}

function spriteErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return "Sprite resources could not be loaded or read from cache.";
}

export function PokemonSpriteArtwork({ sprite }: { sprite: RenderedSprite }) {
  return (
    <box
      style={{
        alignItems: "center",
        flexDirection: "column",
        height: detailSpriteCanvasHeight,
        justifyContent: "center",
        width: detailSpriteCanvasWidth,
      }}
    >
      {sprite.rows.map((row, rowIndex) => (
        <text key={rowIndex.toString()}>{spriteRowSpans(row)}</text>
      ))}
    </box>
  );
}

function spriteRowSpans(row: readonly SpriteCell[]) {
  return groupSpriteCells(row).map((group, index) => (
    <span
      key={index.toString()}
      {...(group.fg === undefined ? {} : { fg: RGBA.fromIndex(group.fg) })}
      {...(group.bg === undefined ? {} : { bg: RGBA.fromIndex(group.bg) })}
    >
      {group.text}
    </span>
  ));
}

function groupSpriteCells(row: readonly SpriteCell[]) {
  const groups: { bg?: number; fg?: number; text: string }[] = [];

  for (const cell of row) {
    const current = groups.at(-1);
    if (
      current !== undefined &&
      current.fg === cell.fg &&
      current.bg === cell.bg
    ) {
      current.text = `${current.text}${cell.char}`;
      continue;
    }

    groups.push({
      ...(cell.bg === undefined ? {} : { bg: cell.bg }),
      ...(cell.fg === undefined ? {} : { fg: cell.fg }),
      text: cell.char,
    });
  }

  return groups;
}

export function PokemonSpriteShinyMarker() {
  return (
    <text
      fg={colors.accent}
      style={{ position: "absolute", right: 1, top: 0, zIndex: 1 }}
    >
      ★
    </text>
  );
}
