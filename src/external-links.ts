import { spawn } from "node:child_process";
import type { SpeciesIndexEntry } from "./search";

type SpawnCommand = typeof spawn;

export function pokemonDbPokedexUrl(
  species: Pick<SpeciesIndexEntry, "slug">,
): string {
  return `https://pokemondb.net/pokedex/${species.slug}`;
}

export function openPokemonDbPokedexEntry(
  species: Pick<SpeciesIndexEntry, "slug">,
): Promise<void> {
  return openExternalUrl(pokemonDbPokedexUrl(species));
}

function openExternalUrl(
  url: string,
  options: {
    platform?: NodeJS.Platform;
    spawnCommand?: SpawnCommand;
  } = {},
): Promise<void> {
  const { args, command } = openerCommand(
    url,
    options.platform ?? process.platform,
  );

  return new Promise((resolve, reject) => {
    const child = (options.spawnCommand ?? spawn)(command, args, {
      detached: true,
      stdio: "ignore",
    });

    child.once("error", reject);
    child.once("spawn", () => {
      child.unref();
      resolve();
    });
  });
}

function openerCommand(
  url: string,
  platform: NodeJS.Platform,
): { args: string[]; command: string } {
  if (platform === "darwin") {
    return { args: [url], command: "open" };
  }

  if (platform === "win32") {
    return { args: ["/c", "start", "", url], command: "cmd" };
  }

  return { args: [url], command: "xdg-open" };
}
