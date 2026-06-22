import aliases from "../src/search/alias-overrides.json";
import source from "../src/search/species-source.json";

export function buildSpeciesIndex() {
  return source.map((entry) => ({
    ...entry,
    aliases: aliases[entry.slug as keyof typeof aliases] ?? [],
    dexNumbers: [
      ...new Set([
        String(entry.dexNumber),
        String(entry.dexNumber).padStart(3, "0"),
      ]),
    ],
  }));
}
