import { Buffer } from "node:buffer";
import type { TerminalCapabilities } from "@opentui/core";
import {
  cropPngSpriteToOpaqueBounds,
  fitPngSpriteToTerminalCanvas,
} from "./sprite-rendering";

export type TerminalImageSupport = {
  protocol: "kitty";
};

export type TerminalImageOptions = {
  height: number;
  width: number;
};

export type PreparedTerminalImage = TerminalImageOptions & {
  filePath: string;
};

type TerminalEnvironment = Record<string, string | undefined>;
type TerminalImageCapabilities = Pick<
  TerminalCapabilities,
  "kitty_graphics" | "multiplexer" | "remote"
>;

const kittyTerminalImageSupport: TerminalImageSupport = { protocol: "kitty" };

export function detectTerminalImageSupport(
  env: TerminalEnvironment = Bun.env,
  capabilities?: TerminalImageCapabilities | null,
): TerminalImageSupport | undefined {
  if (capabilities !== undefined && capabilities !== null) {
    return capabilities.kitty_graphics &&
      capabilities.remote === false &&
      capabilities.multiplexer === "none"
      ? kittyTerminalImageSupport
      : undefined;
  }

  if (env.SSH_CONNECTION !== undefined || env.SSH_TTY !== undefined) {
    return undefined;
  }

  if (env.KITTY_WINDOW_ID !== undefined || env.TERM?.includes("kitty")) {
    return kittyTerminalImageSupport;
  }

  if (env.TERM_PROGRAM === "WezTerm" || env.WEZTERM_EXECUTABLE !== undefined) {
    return kittyTerminalImageSupport;
  }

  return undefined;
}

export function terminalImageEscapeSequence(
  filePath: string,
  support: TerminalImageSupport,
  options: TerminalImageOptions & { imageId: number; placementId: number },
): string {
  switch (support.protocol) {
    case "kitty": {
      const payload = Buffer.from(filePath).toString("base64");
      return `\u001b_Ga=T,t=f,f=100,C=1,q=2,i=${options.imageId.toString()},p=${options.placementId.toString()},c=${options.width.toString()},r=${options.height.toString()};${payload}\u001b\\`;
    }
  }
}

export async function prepareTerminalSpriteImage(
  filePath: string,
  canvas: TerminalImageOptions,
): Promise<PreparedTerminalImage> {
  const source = await Bun.file(filePath).arrayBuffer();
  const cropped = cropPngSpriteToOpaqueBounds(source);
  if (cropped === undefined) {
    return { ...canvas, filePath };
  }

  const croppedFilePath = `${filePath}.opaque.png`;
  if (!(await Bun.file(croppedFilePath).exists())) {
    await Bun.write(croppedFilePath, cropped.source);
  }

  return {
    ...fitPngSpriteToTerminalCanvas(cropped, {
      maxHeight: canvas.height,
      maxWidth: canvas.width,
    }),
    filePath: croppedFilePath,
  };
}

export function terminalImagePlacementSequence({
  column,
  filePath,
  imageId,
  placementId,
  row,
  support,
  ...options
}: TerminalImageOptions & {
  column: number;
  filePath: string;
  imageId: number;
  placementId: number;
  row: number;
  support: TerminalImageSupport;
}): string {
  return `\u001b[${row.toString()};${column.toString()}H${terminalImageEscapeSequence(filePath, support, { ...options, imageId, placementId })}`;
}

export function deleteTerminalImageSequence(
  support: TerminalImageSupport,
  imageId: number,
  placementId: number,
): string {
  switch (support.protocol) {
    case "kitty": {
      return `\u001b_Ga=d,d=i,q=2,i=${imageId.toString()},p=${placementId.toString()}\u001b\\`;
    }
  }
}
