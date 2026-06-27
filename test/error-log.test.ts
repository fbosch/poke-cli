import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  appendDebugErrorLog,
  formatErrorLogEntry,
  getDefaultErrorLogFilePath,
} from "../src/error-log";

test("resolves debug error log path under XDG state home", () => {
  expect(getDefaultErrorLogFilePath({ XDG_STATE_HOME: "/tmp/state" })).toBe(
    "/tmp/state/pkdx/pkdx.log",
  );
});

test("formats debug error log entries with context and stack", () => {
  const error = new Error("offline");
  error.stack = "Error: offline\n    at test";

  expect(
    formatErrorLogEntry(
      error,
      { event: "detail.loadFailed", species: "dusknoir" },
      new Date("2026-06-27T12:00:00.000Z"),
    ),
  ).toBe(
    [
      "[2026-06-27T12:00:00.000Z] detail.loadFailed",
      "species: dusknoir",
      "Error: offline",
      "    at test",
      "",
    ].join("\n"),
  );
});

test("appends debug error logs and creates parent directories", async () => {
  const directory = await mkdtemp(join(tmpdir(), "pkdx-error-log-"));
  const filePath = join(directory, "nested", "pkdx.log");

  try {
    await appendDebugErrorLog(
      new Error("offline"),
      { event: "test" },
      {
        filePath,
        now: new Date("2026-06-27T12:00:00.000Z"),
      },
    );

    expect(await readFile(filePath, "utf8")).toContain(
      "[2026-06-27T12:00:00.000Z] test",
    );
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});
