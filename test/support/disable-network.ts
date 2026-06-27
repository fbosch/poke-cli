const disabledFetch = Object.assign(
  async (input: Parameters<typeof fetch>[0]) => {
    throw new Error(
      `Network access is disabled in benchmarks: ${String(input)}`,
    );
  },
  {
    preconnect: (url: string | URL) => {
      throw new Error(`Network access is disabled in benchmarks: ${url}`);
    },
  },
) satisfies typeof fetch;

globalThis.fetch = disabledFetch;
