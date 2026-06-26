import { buildEvolutionFlowchartLines } from "../../src/ui/detail/EvolutionViewer";
import { benchmarkResult } from "../support/benchmark";
import {
  eeveePokemonEvolutionChain,
  pikachuPokemonEvolutionChain,
} from "../support/pokeapi-fixtures";

const iterations = Number(Bun.env.PKDX_BENCH_ITERATIONS ?? 500_000);

const benchmarks = [
  {
    chain: pikachuPokemonEvolutionChain,
    name: "linear-pikachu-chain",
  },
  {
    chain: eeveePokemonEvolutionChain,
    name: "branching-eevee-chain",
  },
] as const;

for (const benchmark of benchmarks) {
  for (let index = 0; index < 1_000; index += 1) {
    buildEvolutionFlowchartLines(benchmark.chain);
  }
}

const results = benchmarks.map((benchmark) => {
  let checksum = 0;
  const start = Bun.nanoseconds();

  for (let index = 0; index < iterations; index += 1) {
    checksum += buildEvolutionFlowchartLines(benchmark.chain).join("\n").length;
  }

  return benchmarkResult(benchmark.name, iterations, start, checksum);
});

console.table(results);
