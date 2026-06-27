import { RGBA, type BoxRenderable } from "@opentui/core";
import { useRenderer } from "@opentui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import type { PokemonForm } from "../../pokemon-detail";
import {
  pokespriteCachedAssetQueryOptions,
  pokespriteRenderedSpriteQueryOptions,
} from "../../pokesprite";
import type { SpeciesIndexEntry } from "../../search";
import type { RenderedSprite, SpriteCell } from "../../sprite-rendering";
import {
  deleteTerminalImageSequence,
  prepareTerminalSpriteImage,
  type PreparedTerminalImage,
  terminalImagePlacementSequence,
  type TerminalImageSupport,
} from "../../terminal-images";
import { colors, textStyles } from "../design-tokens";
import { useTerminalImageSupport } from "../useTerminalImageSupport";

export const detailSpriteCanvasHeight = 20;
export const detailSpriteCanvasWidth = 40;
const detailSpriteImageId = 4242;
const detailSpritePlacementId = 1;

type PokemonSpritePanelProps = {
  form: PokemonForm | undefined;
  shiny: boolean;
  species: SpeciesIndexEntry;
  terminalImagesEnabled?: boolean;
};

export function PokemonSpritePanel({
  form,
  shiny,
  species,
  terminalImagesEnabled = true,
}: PokemonSpritePanelProps) {
  const queryClient = useQueryClient();
  const detectedTerminalImageSupport = useTerminalImageSupport();
  const terminalImageSupport = terminalImagesEnabled
    ? detectedTerminalImageSupport
    : undefined;
  const image = useQuery({
    ...pokespriteCachedAssetQueryOptions(species, queryClient, shiny, form),
    enabled: terminalImageSupport !== undefined,
  });
  const sprite = useQuery({
    ...pokespriteRenderedSpriteQueryOptions(species, queryClient, shiny, form, {
      maxHeight: detailSpriteCanvasHeight,
      maxWidth: detailSpriteCanvasWidth,
    }),
    enabled: terminalImageSupport === undefined,
  });

  if (terminalImageSupport !== undefined) {
    if (image.data !== undefined) {
      return (
        <PokemonSpriteInlineImage
          filePath={image.data.filePath}
          support={terminalImageSupport}
        />
      );
    }

    if (image.isError) {
      return <PokemonSpriteFallback error={image.error} />;
    }

    return <PokemonSpriteLoading />;
  }

  if (sprite.data !== undefined) {
    return <PokemonSpriteArtwork sprite={sprite.data} />;
  }

  if (sprite.isError) {
    return <PokemonSpriteFallback error={sprite.error} />;
  }

  return <PokemonSpriteLoading />;
}

export function PokemonSpriteInlineImage({
  filePath,
  support,
}: {
  filePath: string;
  support: TerminalImageSupport;
}) {
  const boxRef = useRef<BoxRenderable>(null);
  const [image, setImage] = useState<PreparedTerminalImage>();

  useEffect(() => {
    let cancelled = false;
    setImage(undefined);

    void prepareTerminalSpriteImage(filePath, {
      height: detailSpriteCanvasHeight,
      width: detailSpriteCanvasWidth,
    })
      .then((preparedImage) => {
        if (cancelled) {
          return;
        }

        setImage(preparedImage);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setImage(undefined);
      });

    return () => {
      cancelled = true;
    };
  }, [filePath]);

  useTerminalImagePlacement(boxRef, image, support);

  return (
    <box
      ref={boxRef}
      style={{
        height: detailSpriteCanvasHeight,
        position: "relative",
        width: detailSpriteCanvasWidth,
      }}
    />
  );
}

function useTerminalImagePlacement(
  boxRef: React.RefObject<BoxRenderable | null>,
  image: PreparedTerminalImage | undefined,
  support: TerminalImageSupport,
) {
  const renderer = useRenderer();
  const placementRef = useRef<
    { column: number; filePath: string; row: number } | undefined
  >(undefined);

  useEffect(() => {
    const deletePlacement = () => {
      if (placementRef.current === undefined) {
        return;
      }

      process.stdout.write(
        deleteTerminalImageSequence(
          support,
          detailSpriteImageId,
          detailSpritePlacementId,
        ),
      );
      placementRef.current = undefined;
    };
    const renderPlacement = () => {
      const box = boxRef.current;
      if (box === null || image === undefined) {
        return;
      }

      const left = Math.max(
        0,
        Math.floor((detailSpriteCanvasWidth - image.width) / 2),
      );
      const top = Math.max(
        0,
        Math.floor((detailSpriteCanvasHeight - image.height) / 2),
      );
      const nextPlacement = {
        column: box.screenX + left + 1,
        filePath: image.filePath,
        row: box.screenY + top + 1,
      };
      if (
        placementRef.current?.column === nextPlacement.column &&
        placementRef.current.row === nextPlacement.row &&
        placementRef.current.filePath === nextPlacement.filePath
      ) {
        return;
      }

      deletePlacement();
      process.stdout.write(
        terminalImagePlacementSequence({
          column: nextPlacement.column,
          filePath: image.filePath,
          height: image.height,
          imageId: detailSpriteImageId,
          placementId: detailSpritePlacementId,
          row: nextPlacement.row,
          support,
          width: image.width,
        }),
      );
      placementRef.current = nextPlacement;
    };

    renderer.on("frame", renderPlacement);
    return () => {
      renderer.off("frame", renderPlacement);
      deletePlacement();
    };
  }, [boxRef, image, renderer, support]);
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
  const top = Math.max(
    0,
    Math.floor((detailSpriteCanvasHeight - sprite.height) / 2),
  );
  const left = Math.max(
    0,
    Math.floor((detailSpriteCanvasWidth - sprite.width) / 2),
  );

  return (
    <box
      style={{
        alignItems: "center",
        flexDirection: "column",
        height: detailSpriteCanvasHeight,
        justifyContent: "center",
        position: "relative",
        width: detailSpriteCanvasWidth,
      }}
    >
      {sprite.rows.flatMap((row, rowIndex) =>
        visibleSpriteCellGroups(row).map((group, groupIndex) => (
          <text
            key={`${rowIndex.toString()}-${groupIndex.toString()}`}
            style={{
              left: left + group.x,
              position: "absolute",
              top: top + rowIndex,
            }}
          >
            {spriteCellGroupSpans(group.cells)}
          </text>
        )),
      )}
    </box>
  );
}

function spriteCellGroupSpans(row: readonly SpriteCell[]) {
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

function visibleSpriteCellGroups(row: readonly SpriteCell[]) {
  const groups: { cells: SpriteCell[]; x: number }[] = [];
  let current: { cells: SpriteCell[]; x: number } | undefined;

  row.forEach((cell, x) => {
    if (isTransparentSpriteCell(cell)) {
      current = undefined;
      return;
    }

    if (current === undefined) {
      current = { cells: [], x };
      groups.push(current);
    }

    current.cells.push(cell);
  });

  return groups;
}

function isTransparentSpriteCell(cell: SpriteCell): boolean {
  return cell.char === " " && cell.fg === undefined && cell.bg === undefined;
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
