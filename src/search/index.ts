import Fuse from "fuse.js";
import speciesIndex from "./species-index.json";

export type SpeciesIndexEntry = {
  dexNumber: number;
  dexNumbers: string[];
  name: string;
  slug: string;
  aliases: string[];
};

export type SearchResult = SpeciesIndexEntry & {
  selected: boolean;
};

const fuse = new Fuse(speciesIndex, {
  includeScore: true,
  keys: [
    { name: "name", weight: 0.45 },
    { name: "slug", weight: 0.3 },
    { name: "dexNumbers", weight: 0.2 },
    { name: "aliases", weight: 0.25 },
  ],
  threshold: 0.35,
});

export const minimumSearchQueryLength = 3;

export function searchSpecies(query: string, limit = 10): SpeciesIndexEntry[] {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < minimumSearchQueryLength) {
    return [];
  }

  return fuse.search(normalizedQuery, { limit }).map((result) => result.item);
}

export function searchResults(
  query: string,
  selectedIndex: number,
  limit = 10,
): SearchResult[] {
  return searchSpecies(query, limit).map((entry, index) => ({
    ...entry,
    selected: index === selectedIndex,
  }));
}

export function findExactSpecies(query: string): SpeciesIndexEntry | undefined {
  const normalizedQuery = normalize(query);
  if (normalizedQuery.length === 0) {
    return undefined;
  }

  return speciesIndex.find((entry) => {
    return [entry.name, entry.slug, ...entry.dexNumbers].some(
      (value) => normalize(value) === normalizedQuery,
    );
  });
}

export function getSpeciesBySelection(
  query: string,
  selectedIndex: number,
): SpeciesIndexEntry | undefined {
  return searchSpecies(query)[selectedIndex];
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replaceAll(".", "")
    .replaceAll("♀", " female")
    .replaceAll("♂", " male")
    .trim();
}
