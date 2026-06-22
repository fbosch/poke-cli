import { expect, test } from "bun:test";
import { findExactSpecies, searchSpecies } from "../src/search";

test.each([
  { query: "pikachu", slug: "pikachu" },
  { query: "pika", slug: "pikachu" },
  { query: "001", slug: "bulbasaur" },
  { query: "nidoran female", slug: "nidoran-f" },
  { query: "mr mime", slug: "mr-mime" },
])("ranks $slug for $query", ({ query, slug }) => {
  expect(searchSpecies(query)[0]?.slug).toBe(slug);
});

test("exact species matching excludes fuzzy aliases", () => {
  expect(findExactSpecies("pikachu")?.slug).toBe("pikachu");
  expect(findExactSpecies("025")?.slug).toBe("pikachu");
  expect(findExactSpecies("pika")).toBeUndefined();
});
