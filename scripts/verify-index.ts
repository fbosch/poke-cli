import { buildSpeciesIndex } from "./build-species-index";

const index = buildSpeciesIndex();

const expected = JSON.stringify(index);
const actual = JSON.stringify(
  await Bun.file("src/search/species-index.json").json(),
);

if (actual !== expected) {
  process.stderr.write(
    "src/search/species-index.json is stale. Run bun run generate:index.\n",
  );
  process.exit(1);
}
