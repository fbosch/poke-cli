import { expect, test } from "bun:test";
import { HttpResponse, http } from "msw";
import {
  buildDefaultPokemonDetail,
  pokemonDetailQueryOptions,
} from "../src/pokemon-detail";
import { queryCachePolicies } from "../src/query-cache";
import type { SpeciesIndexEntry } from "../src/search";
import { pikachuPokemon, pikachuSpecies } from "./support/pokeapi-fixtures";
import { createMockServer, executeQuery } from "./support/query-test";

const server = createMockServer();

const pikachuIndexEntry: SpeciesIndexEntry = {
  aliases: ["pika", "025", "25"],
  dexNumber: 25,
  dexNumbers: ["25", "025"],
  name: "Pikachu",
  slug: "pikachu",
};

test("builds Default Representative PokemonDetail from validated PokeAPI resources", () => {
  const detail = buildDefaultPokemonDetail(
    pikachuIndexEntry,
    pikachuSpecies,
    pikachuPokemon,
  );

  expect(detail).toEqual({
    abilities: [
      { isHidden: false, name: "Static" },
      { isHidden: true, name: "Lightning Rod" },
    ],
    dexNumber: 25,
    flavorText:
      "When several of these POKéMON gather, their electricity can build and cause lightning storms.",
    heightMeters: 0.4,
    name: "Pikachu",
    sprite: {
      kind: "placeholder",
      label: "pikachu sprite pending",
    },
    stats: [
      { base: 35, name: "HP" },
      { base: 55, name: "Attack" },
      { base: 40, name: "Defense" },
      { base: 50, name: "Sp. Attack" },
      { base: 50, name: "Sp. Defense" },
      { base: 90, name: "Speed" },
    ],
    types: ["Electric"],
    weightKilograms: 6,
  });
});

test("loads Default Representative PokemonDetail through mocked PokeAPI queries", async () => {
  server.use(
    http.get("https://pokeapi.co/api/v2/pokemon-species/25/", () => {
      return HttpResponse.json(pikachuSpecies);
    }),
    http.get("https://pokeapi.co/api/v2/pokemon/25/", () => {
      return HttpResponse.json(pikachuPokemon);
    }),
  );
  const queryClient = {
    fetchQuery: <TData>(resourceOptions: { queryFn?: unknown }) => {
      return executeQuery<TData>(resourceOptions);
    },
  };
  const options = pokemonDetailQueryOptions(pikachuIndexEntry, queryClient);

  await expect(executeQuery(options)).resolves.toMatchObject({
    dexNumber: 25,
    name: "Pikachu",
    types: ["Electric"],
  });
  expect(options.staleTime).toBe(queryCachePolicies.pokemonDetail.staleTime);
  expect(options.gcTime).toBe(queryCachePolicies.pokemonDetail.gcTime);
});
