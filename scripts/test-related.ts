export {};

const proc = Bun.spawn(["bun", "test"], {
  stderr: "inherit",
  stdout: "inherit",
});

const exitCode = await proc.exited;

if (exitCode !== 0) {
  process.exit(exitCode);
}
