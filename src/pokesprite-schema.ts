import { z } from "zod";

const formMetadataInputSchema = z.object({
  has_female: z.boolean().optional(),
  has_right: z.boolean().optional(),
  has_unofficial_female_icon: z.boolean().optional(),
  is_alias_of: z.string().optional(),
});

const pokemonMetadataEntryInputSchema = z.object({
  idx: z.string(),
  name: z.object({ eng: z.string() }),
  slug: z.object({ eng: z.string() }),
  "gen-8": z
    .object({
      forms: z.record(z.string(), formMetadataInputSchema).optional(),
    })
    .optional(),
});

const formMetadataSchema = formMetadataInputSchema.transform((form) => ({
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

export const pokespriteMetadataSchema = z.record(
  z.string(),
  pokemonMetadataEntrySchema,
);

export const pokespriteQueryCacheSchemas = {
  metadata: z.toJSONSchema(
    z.record(z.string(), pokemonMetadataEntryInputSchema),
  ),
} as const;

export type PokeSpriteMetadata = z.infer<typeof pokespriteMetadataSchema>;
export type PokeSpritePokemonMetadata = PokeSpriteMetadata[string];
