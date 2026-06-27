import { readdir } from "node:fs/promises";
import { basename, join } from "node:path";

const benchmarkDirectory = join(import.meta.dir, "..", "test", "benchmarks");
const networkGuardPath = join(
  import.meta.dir,
  "..",
  "test",
  "support",
  "disable-network.ts",
);
const benchmarkFiles = (await readdir(benchmarkDirectory))
  .filter((file) => file.endsWith(".ts"))
  .toSorted();

for (const file of benchmarkFiles) {
  const benchmarkPath = join(benchmarkDirectory, file);
  console.log(`\n${basename(file, ".ts")}`);

  const child = Bun.spawn(
    ["bun", "--preload", networkGuardPath, benchmarkPath],
    {
      env: Bun.env,
      stderr: "inherit",
      stdout: "inherit",
    },
  );

  const exitCode = await child.exited;

  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}
