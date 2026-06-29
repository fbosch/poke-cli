import { expect, test } from "bun:test";
import {
  buildSpeciesIndex,
  speciesFuseOptions,
} from "../scripts/build-species-index";

test("builds Search index entries with aliases and dex number strings", () => {
  const index = buildSpeciesIndex();
  const pikachu = index.find((entry) => entry.slug === "pikachu");
  const bulbasaur = index.find((entry) => entry.slug === "bulbasaur");

  expect(pikachu).toMatchObject({
    aliases: ["pika", "025", "25"],
    dexNumbers: ["25", "025"],
    name: "Pikachu",
  });
  expect(bulbasaur).toMatchObject({
    aliases: ["001", "1"],
    dexNumbers: ["1", "001"],
    name: "Bulbasaur",
  });
});

test("keeps Search Fuse weights aligned with generated index fields", () => {
  expect(speciesFuseOptions).toMatchObject({
    includeScore: true,
    threshold: 0.35,
  });
  expect(speciesFuseOptions.keys.map((key) => key.name)).toEqual([
    "name",
    "slug",
    "dexNumbers",
    "aliases",
  ]);
});
