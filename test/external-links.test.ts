import { expect, test } from "bun:test";
import { pokemonDbPokedexUrl } from "../src/external-links";

test("builds PokemonDB Pokedex URLs from species slugs", () => {
  expect(pokemonDbPokedexUrl({ slug: "vulpix" })).toBe(
    "https://pokemondb.net/pokedex/vulpix",
  );
  expect(pokemonDbPokedexUrl({ slug: "mr-mime" })).toBe(
    "https://pokemondb.net/pokedex/mr-mime",
  );
});
