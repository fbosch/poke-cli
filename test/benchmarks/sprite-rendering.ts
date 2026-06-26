import { deflateSync } from "node:zlib";
import { renderPngSprite, xtermColorIndex } from "../../src/sprite-rendering";
import { benchmarkResult } from "../support/benchmark";

const iterations = Number(Bun.env.PKDX_SPRITE_BENCH_ITERATIONS ?? 500);
const transparent = [0, 0, 0, 0] satisfies Rgba;
const red = [255, 0, 0, 255] satisfies Rgba;
const blue = [0, 0, 255, 255] satisfies Rgba;
const green = [0, 255, 0, 255] satisfies Rgba;
const yellow = [255, 255, 0, 255] satisfies Rgba;

const smallSprite = createPatternPng(16, 16);
const mediumSprite = createPatternPng(64, 64);

const benchmarks = [
  {
    name: "xterm-color-index",
    run: () => xtermColorIndex(128, 64, 192),
  },
  {
    name: "render-png-small-16x16",
    run: () => renderPngSprite(smallSprite).rows.length,
  },
  {
    name: "render-png-medium-64x64",
    run: () => renderPngSprite(mediumSprite).rows.length,
  },
] as const;

for (const benchmark of benchmarks) {
  for (let index = 0; index < 100; index += 1) {
    benchmark.run();
  }
}

const results = benchmarks.map((benchmark) => {
  let checksum = 0;
  const start = Bun.nanoseconds();

  for (let index = 0; index < iterations; index += 1) {
    checksum += benchmark.run();
  }

  return benchmarkResult(benchmark.name, iterations, start, checksum);
});

console.table(results);

type Rgba = readonly [red: number, green: number, blue: number, alpha: number];

function createPatternPng(width: number, height: number): ArrayBuffer {
  const palette = [red, blue, green, yellow] as const;
  const pixels = Array.from({ length: width * height }, (_, index) => {
    const x = index % width;
    const y = Math.floor(index / width);
    return palette[(x + y) % palette.length] ?? transparent;
  });

  return createRgbaPng(width, height, pixels);
}

function createRgbaPng(
  width: number,
  height: number,
  pixels: readonly Rgba[],
): ArrayBuffer {
  const scanlines = new Uint8Array(height * (1 + width * 4));

  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * (1 + width * 4);
    scanlines[rowOffset] = 0;

    for (let x = 0; x < width; x += 1) {
      const pixel = pixels[y * width + x] ?? transparent;
      scanlines.set(pixel, rowOffset + 1 + x * 4);
    }
  }

  const png = concatChunks([
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ihdrData(width, height)),
    pngChunk("IDAT", deflateSync(scanlines)),
    pngChunk("IEND", new Uint8Array()),
  ]);

  const result = new ArrayBuffer(png.byteLength);
  new Uint8Array(result).set(png);
  return result;
}

function ihdrData(width: number, height: number): Uint8Array {
  const data = new Uint8Array(13);
  const view = new DataView(data.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  data[8] = 8;
  data[9] = 6;
  data[10] = 0;
  data[11] = 0;
  data[12] = 0;
  return data;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const chunk = new Uint8Array(12 + data.length);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, data.length);
  chunk.set(
    [...type].map((character) => character.charCodeAt(0)),
    4,
  );
  chunk.set(data, 8);
  return chunk;
}

function concatChunks(chunks: readonly Uint8Array[]): Uint8Array {
  const size = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const result = new Uint8Array(size);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}
