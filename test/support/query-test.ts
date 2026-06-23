import { afterAll, afterEach, beforeAll } from "bun:test";
import { setupServer } from "msw/node";

export function createMockServer() {
  const server = setupServer();

  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  return server;
}

export function executeQuery<T>(options: { queryFn?: unknown }): Promise<T> {
  const queryFn = options.queryFn as (context: {
    signal: AbortSignal;
  }) => Promise<T>;

  return queryFn({ signal: new AbortController().signal });
}
