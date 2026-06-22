import { buildSpeciesIndex } from "./build-species-index";

const index = buildSpeciesIndex();

const output = `${JSON.stringify(index, null, 2)}\n`;

await Bun.write("src/search/species-index.json", output);
