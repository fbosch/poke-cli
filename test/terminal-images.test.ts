import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  detectTerminalImageSupport,
  deleteTerminalImageSequence,
  prepareTerminalSpriteImage,
  terminalImageEscapeSequence,
  terminalImagePlacementSequence,
} from "../src/terminal-images";

test("detects local kitty-compatible terminal image support", () => {
  expect(detectTerminalImageSupport({ TERM: "xterm-kitty" })).toEqual({
    protocol: "kitty",
  });
  expect(detectTerminalImageSupport({ TERM_PROGRAM: "WezTerm" })).toEqual({
    protocol: "kitty",
  });
});

test("does not enable local file image protocols over ssh", () => {
  expect(
    detectTerminalImageSupport({ SSH_TTY: "/dev/pts/1", TERM: "xterm-kitty" }),
  ).toBeUndefined();
});

test("uses negotiated OpenTUI kitty graphics capabilities when available", () => {
  expect(
    detectTerminalImageSupport(
      { TERM: "xterm-256color" },
      { kitty_graphics: true, multiplexer: "none", remote: false },
    ),
  ).toEqual({ protocol: "kitty" });
  expect(
    detectTerminalImageSupport(
      { TERM: "xterm-kitty" },
      { kitty_graphics: true, multiplexer: "none", remote: true },
    ),
  ).toBeUndefined();
  expect(
    detectTerminalImageSupport(
      { TERM: "xterm-kitty" },
      { kitty_graphics: true, multiplexer: "tmux", remote: false },
    ),
  ).toBeUndefined();
});

test("formats kitty graphics escape sequence for a cached PNG path", () => {
  expect(
    terminalImageEscapeSequence(
      "/tmp/pikachu.png",
      { protocol: "kitty" },
      {
        height: 20,
        imageId: 4242,
        placementId: 1,
        width: 40,
      },
    ),
  ).toBe(
    "\u001b_Ga=T,t=f,f=100,C=1,q=2,i=4242,p=1,c=40,r=20;L3RtcC9waWthY2h1LnBuZw==\u001b\\",
  );
});

test("positions and deletes kitty graphics placements", () => {
  expect(
    terminalImagePlacementSequence({
      column: 3,
      filePath: "/tmp/pikachu.png",
      height: 20,
      imageId: 4242,
      placementId: 1,
      row: 2,
      support: { protocol: "kitty" },
      width: 40,
    }),
  ).toBe(
    "\u001b[2;3H\u001b_Ga=T,t=f,f=100,C=1,q=2,i=4242,p=1,c=40,r=20;L3RtcC9waWthY2h1LnBuZw==\u001b\\",
  );
  expect(deleteTerminalImageSequence({ protocol: "kitty" }, 4242, 1)).toBe(
    "\u001b_Ga=d,d=i,q=2,i=4242,p=1\u001b\\",
  );
});

test("rebuilds prepared terminal image metadata during development", async () => {
  const directory = await mkdtemp(join(tmpdir(), "pkdx-terminal-image-"));
  const filePath = join(directory, "sprite.png");
  const originalNodeEnv = Bun.env.NODE_ENV;

  try {
    await Bun.write(filePath, transparentPng);
    await Bun.write(`${filePath}.opaque.png`, transparentPng);
    await Bun.write(
      `${filePath}.opaque.png.json`,
      JSON.stringify({ height: 99, width: 99 }),
    );

    Bun.env.NODE_ENV = "development";
    const prepared = await prepareTerminalSpriteImage(filePath, {
      height: 20,
      width: 40,
    });

    expect(prepared).toEqual({ height: 20, width: 40, filePath });
  } finally {
    if (originalNodeEnv === undefined) {
      delete Bun.env.NODE_ENV;
    } else {
      Bun.env.NODE_ENV = originalNodeEnv;
    }
    await rm(directory, { force: true, recursive: true });
  }
});

const transparentPng = new Uint8Array([
  137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0,
  0, 0, 1, 8, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 73, 68, 65, 84, 120, 156, 99,
  96, 96, 96, 0, 0, 0, 4, 0, 1, 0, 0, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96,
  130,
]);
