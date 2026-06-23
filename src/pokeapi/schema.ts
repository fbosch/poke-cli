import { z } from "zod";
import type { components } from "./generated";

type GeneratedPokemon = components["schemas"]["PokemonDetail"];
type GeneratedSpecies = components["schemas"]["PokemonSpeciesDetail"];
type GeneratedEvolutionChain = components["schemas"]["EvolutionChainDetail"];
type GeneratedPokemonAbility = GeneratedPokemon["abilities"][number];
type GeneratedPokemonStat = GeneratedPokemon["stats"][number];
type GeneratedPokemonType = GeneratedPokemon["types"][number];
type GeneratedEvolutionChainSpecies =
  GeneratedEvolutionChain["chain"]["species"];

export type PokeApiPokemon = {
  abilities: Pick<GeneratedPokemonAbility, "ability" | "is_hidden" | "slot">[];
  height: number;
  name: GeneratedPokemon["name"];
  species: GeneratedPokemon["species"];
  stats: Pick<GeneratedPokemonStat, "base_stat" | "stat">[];
  types: Pick<GeneratedPokemonType, "slot" | "type">[];
  weight: number;
};

export type PokeApiPokemonSpecies = Pick<
  GeneratedSpecies,
  | "evolution_chain"
  | "flavor_text_entries"
  | "id"
  | "name"
  | "names"
  | "varieties"
>;

type PokeApiEvolutionChainNode = {
  evolves_to: PokeApiEvolutionChainNode[];
  species: GeneratedEvolutionChainSpecies;
};

export type PokeApiEvolutionChain = {
  chain: PokeApiEvolutionChainNode;
  id: GeneratedEvolutionChain["id"];
};

const namedResourceSchema = z.object({
  name: z.string(),
  url: z.string(),
});

const pokemonTypeSchema = z.object({
  slot: z.number(),
  type: namedResourceSchema,
});

const pokemonAbilitySchema = z.object({
  ability: namedResourceSchema,
  is_hidden: z.boolean(),
  slot: z.number(),
});

const pokemonStatSchema = z.object({
  base_stat: z.number(),
  stat: namedResourceSchema,
});

const pokemonResourceSchema = z.object({
  abilities: z.array(pokemonAbilitySchema),
  height: z.number(),
  name: z.string(),
  species: namedResourceSchema,
  stats: z.array(pokemonStatSchema),
  types: z.array(pokemonTypeSchema),
  weight: z.number(),
});

const pokemonSpeciesResourceSchema = z.object({
  evolution_chain: z.object({ url: z.string() }),
  flavor_text_entries: z.array(
    z.object({
      flavor_text: z.string(),
      language: namedResourceSchema,
      version: namedResourceSchema,
    }),
  ),
  id: z.number(),
  name: z.string(),
  names: z.array(
    z.object({
      language: namedResourceSchema,
      name: z.string(),
    }),
  ),
  varieties: z.array(
    z.object({
      is_default: z.boolean(),
      pokemon: namedResourceSchema,
    }),
  ),
});

type EvolutionChainNode = {
  evolves_to: EvolutionChainNode[];
  species: z.infer<typeof namedResourceSchema>;
};

const evolutionChainNodeSchema: z.ZodType<EvolutionChainNode> = z.lazy(() =>
  z.object({
    evolves_to: z.array(evolutionChainNodeSchema),
    species: namedResourceSchema,
  }),
);

const evolutionChainResourceSchema = z.object({
  chain: evolutionChainNodeSchema,
  id: z.number(),
});

export function parsePokemonResource(resource: unknown): PokeApiPokemon {
  return pokemonResourceSchema.parse(resource);
}

export function parsePokemonSpeciesResource(
  resource: unknown,
): PokeApiPokemonSpecies {
  return pokemonSpeciesResourceSchema.parse(resource);
}

export function parseEvolutionChainResource(
  resource: unknown,
): PokeApiEvolutionChain {
  return evolutionChainResourceSchema.parse(resource);
}
