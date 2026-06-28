import {
  buildPokemonDetail,
  buildPokemonForms,
} from "../../src/pokemon-detail";
import { findExactSpecies } from "../../src/search";
import { benchmarkResult } from "../support/benchmark";
import {
  charizardMegaXPokemon,
  charizardSpecies,
  pikachuEvolutionChain,
  pikachuPokemon,
  pikachuSpecies,
} from "../support/pokeapi-fixtures";

const iterations = Number(Bun.env.PKDX_BENCH_ITERATIONS ?? 100_000);
const pikachu = findExactSpecies("pikachu") ?? throwMissingSpecies("pikachu");
const charizard =
  findExactSpecies("charizard") ?? throwMissingSpecies("charizard");
const pikachuForms = buildPokemonForms(pikachu, pikachuSpecies);
const pikachuDefault =
  pikachuForms.find((form) => form.isDefault) ?? throwMissingForm("pikachu");
const charizardForms = buildPokemonForms(charizard, charizardSpecies);
const charizardMegaX =
  charizardForms.find((form) => form.pokemonName === "charizard-mega-x") ??
  throwMissingForm("charizard-mega-x");

const benchmarks = [
  {
    name: "build-forms-pikachu",
    run: () => buildPokemonForms(pikachu, pikachuSpecies).length,
  },
  {
    name: "build-forms-charizard",
    run: () => buildPokemonForms(charizard, charizardSpecies).length,
  },
  {
    name: "build-default-detail-pikachu",
    run: () =>
      buildPokemonDetail(
        pikachu,
        pikachuSpecies,
        pikachuPokemon,
        pikachuEvolutionChain,
        pikachuForms,
        pikachuDefault,
      ).stats.length,
  },
  {
    name: "build-form-detail-charizard-mega-x",
    run: () =>
      buildPokemonDetail(
        charizard,
        charizardSpecies,
        charizardMegaXPokemon,
        pikachuEvolutionChain,
        charizardForms,
        charizardMegaX,
      ).types.length,
  },
] as const;

for (const benchmark of benchmarks) {
  for (let index = 0; index < 1_000; index += 1) {
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

function throwMissingSpecies(slug: string): never {
  throw new Error(`Missing benchmark species: ${slug}`);
}

function throwMissingForm(name: string): never {
  throw new Error(`Missing benchmark form: ${name}`);
}
