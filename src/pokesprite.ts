import { queryOptions } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import type { PokemonForm } from "./pokemon-detail";
import { queryCachePolicies } from "./query-cache";
import type { SpeciesIndexEntry } from "./search";
import {
  renderPngSpriteFile,
  type RenderedSprite,
  type RenderPngSpriteOptions,
} from "./sprite-rendering";

const pokespriteBaseUrl =
  "https://raw.githubusercontent.com/msikma/pokesprite/master/";
const pokespriteMetadataUrl = `${pokespriteBaseUrl}data/pokemon.json`;
const scarletVioletSpriteBaseUrl =
  "https://raw.githubusercontent.com/fbosch/pokemon-sprites/main/";
const scarletVioletFirstDexNumber = 906;
const scarletVioletDefaultSpriteSlugs: Record<string, string> = {
  ogerpon: "ogerpon-teal-mask",
  squawkabilly: "squawkabilly-green-plumage",
};

type PokeSpriteSource = "gen-8" | "scarlet-violet";

export type PokeSpriteMetadataQueryKey = readonly [
  "pokesprite-metadata",
  url: string,
];

type FetchResource = (input: string, init?: RequestInit) => Promise<Response>;
type ResourceQueryClient = Pick<QueryClient, "fetchQuery">;

type PokeSpriteRenderedSpriteQueryKey = readonly [
  "pokesprite-rendered-sprite",
  source: PokeSpriteSource,
  dexNumber: number,
  formKey: string,
  shiny: boolean,
  maxWidth: number | undefined,
  maxHeight: number | undefined,
];

type PokeSpriteCachedAssetQueryKey = readonly [
  "pokesprite-cached-asset",
  source: PokeSpriteSource,
  dexNumber: number,
  formKey: string,
  shiny: boolean,
];

const formMetadataSchema = z
  .object({
    has_female: z.boolean().optional(),
    has_right: z.boolean().optional(),
    has_unofficial_female_icon: z.boolean().optional(),
    is_alias_of: z.string().optional(),
  })
  .transform((form) => ({
    hasFemale: form.has_female ?? false,
    hasRight: form.has_right ?? false,
    hasUnofficialFemaleIcon: form.has_unofficial_female_icon ?? false,
    isAliasOf: form.is_alias_of,
  }));

const pokemonMetadataEntrySchema = z
  .object({
    idx: z.string(),
    name: z.object({ eng: z.string() }),
    slug: z.object({ eng: z.string() }),
    "gen-8": z
      .object({
        forms: z.record(z.string(), formMetadataSchema).optional(),
      })
      .optional(),
  })
  .transform((entry) => ({
    dexNumber: Number.parseInt(entry.idx, 10),
    forms: entry["gen-8"]?.forms ?? {},
    name: entry.name.eng,
    slug: entry.slug.eng,
  }));

const pokespriteMetadataSchema = z.record(
  z.string(),
  pokemonMetadataEntrySchema,
);

export type PokeSpriteMetadata = z.infer<typeof pokespriteMetadataSchema>;
export type PokeSpritePokemonMetadata = PokeSpriteMetadata[string];

export type PokeSpriteAssetReference = {
  formKey: string;
  metadata: PokeSpritePokemonMetadata;
  shiny: boolean;
  slug: string;
  source: PokeSpriteSource;
  url: string;
};

export type CachedPokeSpriteAsset = PokeSpriteAssetReference & {
  filePath: string;
};

export class PokeSpriteResourceError extends Error {
  readonly status: number;
  readonly url: string;

  constructor(url: string, status: number) {
    super(`PokeSprite request failed for ${url}: ${status}`);
    this.name = "PokeSpriteResourceError";
    this.status = status;
    this.url = url;
  }
}

export function pokespriteMetadataQueryKey(): PokeSpriteMetadataQueryKey {
  return ["pokesprite-metadata", pokespriteMetadataUrl];
}

export function pokespriteMetadataQueryOptions(
  fetch: FetchResource = globalThis.fetch,
) {
  return queryOptions({
    queryKey: pokespriteMetadataQueryKey(),
    queryFn: async ({ signal }) => {
      const resource = await fetchPokeSpriteResource(
        pokespriteMetadataUrl,
        fetch,
        signal,
      );
      return parsePokeSpriteMetadata(resource);
    },
    ...queryCachePolicies.pokespriteMetadata,
  });
}

export function pokespriteRenderedSpriteQueryKey(
  species: SpeciesIndexEntry,
  shiny = false,
  form?: PokemonForm,
  renderOptions: RenderPngSpriteOptions = {},
): PokeSpriteRenderedSpriteQueryKey {
  return [
    "pokesprite-rendered-sprite",
    pokeSpriteSourceForSpecies(species),
    species.dexNumber,
    form?.spriteFormKey ?? "$",
    shiny,
    renderOptions.maxWidth,
    renderOptions.maxHeight,
  ];
}

export function pokespriteRenderedSpriteQueryOptions(
  species: SpeciesIndexEntry,
  queryClient: ResourceQueryClient,
  shiny = false,
  form?: PokemonForm,
  renderOptions: RenderPngSpriteOptions = {},
) {
  return queryOptions({
    queryKey: pokespriteRenderedSpriteQueryKey(
      species,
      shiny,
      form,
      renderOptions,
    ),
    queryFn: async (): Promise<RenderedSprite> => {
      const metadata = await queryClient.fetchQuery(
        pokespriteMetadataQueryOptions(),
      );
      const asset = await cachePokeSpriteAsset(
        resolvePokemonFormPokeSpriteAsset(metadata, species, form, shiny),
      );

      return renderPngSpriteFile(asset.filePath, renderOptions);
    },
    placeholderData: (previousData, previousQuery) =>
      pokespriteRenderedSpritePlaceholderData(
        previousData,
        previousQuery?.queryKey,
        species,
        form,
        renderOptions,
      ),
    ...queryCachePolicies.pokespriteMetadata,
  });
}

export function pokespriteCachedAssetQueryKey(
  species: SpeciesIndexEntry,
  shiny = false,
  form?: PokemonForm,
): PokeSpriteCachedAssetQueryKey {
  return [
    "pokesprite-cached-asset",
    pokeSpriteSourceForSpecies(species),
    species.dexNumber,
    form?.spriteFormKey ?? "$",
    shiny,
  ];
}

export function pokespriteCachedAssetQueryOptions(
  species: SpeciesIndexEntry,
  queryClient: ResourceQueryClient,
  shiny = false,
  form?: PokemonForm,
) {
  return queryOptions({
    queryKey: pokespriteCachedAssetQueryKey(species, shiny, form),
    queryFn: async (): Promise<CachedPokeSpriteAsset> => {
      const metadata = await queryClient.fetchQuery(
        pokespriteMetadataQueryOptions(),
      );
      return cachePokeSpriteAsset(
        resolvePokemonFormPokeSpriteAsset(metadata, species, form, shiny),
      );
    },
    ...queryCachePolicies.pokespriteMetadata,
  });
}

export function pokespriteRenderedSpritePlaceholderData(
  previousData: RenderedSprite | undefined,
  previousQueryKey: readonly unknown[] | undefined,
  species: SpeciesIndexEntry,
  form?: PokemonForm,
  renderOptions: RenderPngSpriteOptions = {},
): RenderedSprite | undefined {
  if (
    previousQueryKey?.[0] !== "pokesprite-rendered-sprite" ||
    previousQueryKey[1] !== pokeSpriteSourceForSpecies(species) ||
    previousQueryKey[2] !== species.dexNumber ||
    previousQueryKey[3] !== (form?.spriteFormKey ?? "$") ||
    previousQueryKey[5] !== renderOptions.maxWidth ||
    previousQueryKey[6] !== renderOptions.maxHeight
  ) {
    return undefined;
  }

  return previousData;
}

export function parsePokeSpriteMetadata(resource: unknown): PokeSpriteMetadata {
  return pokespriteMetadataSchema.parse(resource);
}

export function resolveDefaultPokeSpriteAsset(
  metadata: PokeSpriteMetadata,
  species: SpeciesIndexEntry,
  shiny = false,
): PokeSpriteAssetReference {
  return resolvePokeSpriteAsset(metadata, species, "$", shiny);
}

export function resolvePokemonFormPokeSpriteAsset(
  metadata: PokeSpriteMetadata,
  species: SpeciesIndexEntry,
  form?: PokemonForm,
  shiny = false,
): PokeSpriteAssetReference {
  return resolvePokeSpriteAsset(
    metadata,
    species,
    form?.spriteFormKey ?? "$",
    shiny,
  );
}

export function resolvePokeSpriteAsset(
  metadata: PokeSpriteMetadata,
  species: SpeciesIndexEntry,
  formKey: string,
  shiny = false,
): PokeSpriteAssetReference {
  const entry = metadata[dexKey(species.dexNumber)];
  if (pokeSpriteSourceForSpecies(species) === "scarlet-violet") {
    return resolveScarletVioletSpriteAsset(entry, species, formKey, shiny);
  }

  if (entry === undefined) {
    throw new Error(`PokeSprite metadata missing #${species.dexNumber}`);
  }

  const form = entry.forms[formKey];
  if (form === undefined) {
    throw new Error(
      `PokeSprite metadata missing ${entry.slug} form ${formKey}`,
    );
  }

  const resolvedFormKey = form.isAliasOf ?? formKey;
  const slug = spriteSlug(entry.slug, resolvedFormKey);

  return {
    formKey: resolvedFormKey,
    metadata: entry,
    shiny,
    slug,
    source: "gen-8",
    url: `${pokespriteBaseUrl}pokemon-gen8/${shiny ? "shiny" : "regular"}/${slug}.png`,
  };
}

function resolveScarletVioletSpriteAsset(
  entry: PokeSpritePokemonMetadata | undefined,
  species: SpeciesIndexEntry,
  formKey: string,
  shiny: boolean,
): PokeSpriteAssetReference {
  const metadata =
    entry ??
    ({
      dexNumber: species.dexNumber,
      forms: {},
      name: species.name,
      slug: species.slug,
    } satisfies PokeSpritePokemonMetadata);
  const slug = scarletVioletSpriteSlug(metadata.slug, formKey);

  return {
    formKey,
    metadata,
    shiny,
    slug,
    source: "scarlet-violet",
    url: `${scarletVioletSpriteBaseUrl}pokemon/${shiny ? "shiny" : "regular"}/${slug}.png`,
  };
}

export async function cachePokeSpriteAsset(
  asset: PokeSpriteAssetReference,
  options: {
    cacheDirectory?: string;
    fetch?: FetchResource;
  } = {},
): Promise<CachedPokeSpriteAsset> {
  const cacheDirectory =
    options.cacheDirectory ?? getDefaultPokeSpriteAssetCacheDirectory();
  const filePath = pokeSpriteAssetCachePath(cacheDirectory, asset.url);
  const cachedFile = Bun.file(filePath);

  if (await cachedFile.exists()) {
    return { ...asset, filePath };
  }

  const response = await (options.fetch ?? globalThis.fetch)(asset.url);
  if (!response.ok) {
    throw new PokeSpriteResourceError(asset.url, response.status);
  }

  await mkdir(cacheDirectory, { recursive: true });
  await Bun.write(filePath, await response.arrayBuffer());

  return { ...asset, filePath };
}

export function pokeSpriteAssetCachePath(
  cacheDirectory: string,
  url: string,
): string {
  return join(cacheDirectory, encodeURIComponent(url));
}

async function fetchPokeSpriteResource(
  url: string,
  fetchResource: FetchResource,
  signal: AbortSignal,
): Promise<unknown> {
  const response = await fetchResource(url, { signal });

  if (!response.ok) {
    throw new PokeSpriteResourceError(url, response.status);
  }

  return await response.json();
}

function dexKey(dexNumber: number): string {
  return dexNumber.toString().padStart(3, "0");
}

function getDefaultPokeSpriteAssetCacheDirectory(): string {
  const baseDirectory =
    process.env.XDG_CACHE_HOME ?? join(Bun.env.HOME ?? ".", ".cache");
  return join(baseDirectory, "pkdx", "pokesprite-assets");
}

function pokeSpriteSourceForSpecies(
  species: SpeciesIndexEntry,
): PokeSpriteSource {
  return species.dexNumber >= scarletVioletFirstDexNumber
    ? "scarlet-violet"
    : "gen-8";
}

function spriteSlug(speciesSlug: string, formKey: string): string {
  if (formKey === "$") {
    return speciesSlug;
  }

  return `${speciesSlug}-${formKey}`;
}

function scarletVioletSpriteSlug(speciesSlug: string, formKey: string): string {
  if (formKey !== "$") {
    return spriteSlug(speciesSlug, formKey);
  }

  return scarletVioletDefaultSpriteSlugs[speciesSlug] ?? speciesSlug;
}
