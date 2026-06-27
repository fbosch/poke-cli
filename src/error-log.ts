import { appendFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { inspect } from "node:util";

export type ErrorLogContext = Record<
  string,
  boolean | number | string | undefined
>;

type ErrorLogOptions = {
  filePath?: string;
  now?: Date;
};

export function getDefaultErrorLogFilePath(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const stateHome = env.XDG_STATE_HOME ?? join(env.HOME ?? ".", ".local/state");
  return join(stateHome, "pkdx", "pkdx.log");
}

export function formatErrorLogEntry(
  error: unknown,
  context: ErrorLogContext,
  now = new Date(),
): string {
  const contextLines = Object.entries(context)
    .filter(([key]) => key !== "event")
    .filter((entry): entry is [string, boolean | number | string] => {
      return entry[1] !== undefined;
    })
    .map(([key, value]) => `${key}: ${value.toString()}`);

  return [
    `[${now.toISOString()}] ${context.event ?? "error"}`,
    ...contextLines,
    serializeError(error),
    "",
  ].join("\n");
}

export async function appendDebugErrorLog(
  error: unknown,
  context: ErrorLogContext,
  options: ErrorLogOptions = {},
): Promise<void> {
  const filePath = options.filePath ?? getDefaultErrorLogFilePath();

  try {
    await mkdir(dirname(filePath), { recursive: true });
    await appendFile(
      filePath,
      formatErrorLogEntry(error, context, options.now),
      "utf8",
    );
  } catch {
    // Debug logging must never become another user-visible app failure.
  }
}

function serializeError(error: unknown): string {
  if (error instanceof Error) {
    const parts = [error.stack ?? `${error.name}: ${error.message}`];
    const cause = (error as Error & { cause?: unknown }).cause;
    if (cause !== undefined) {
      parts.push("Caused by:", serializeError(cause));
    }

    return parts.join("\n");
  }

  return inspect(error, { depth: 6 });
}
