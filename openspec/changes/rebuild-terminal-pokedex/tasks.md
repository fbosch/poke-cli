## 1. Bootable App Skeleton

- [ ] 1.1 Replace the placeholder package metadata with Bun-first ESM scripts for `dev`, `build`, `test`, `test:related`, `typecheck`, `format`, `format:check`, `lint`, `check`, `generate:index`, `verify:index`, `ci`, and `openspec`.
- [ ] 1.2 Add TypeScript strict configuration with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` enabled.
- [ ] 1.3 Add devenv files that provide Bun, Zig, Fallow, and project support tools, plus `.envrc` for direnv activation.
- [ ] 1.4 Add OpenTUI React app entrypoint and `pokedex` executable wiring that launches a minimal Search screen.
- [ ] 1.5 Add app-state handling for top-level Search state and clean exit on `q`, Escape, and Ctrl-C.
- [ ] 1.6 Add first smoke tests for launch state and exit-state transitions.
- [ ] 1.7 Verify the slice with `bun run check` and a compiled binary smoke run that starts and exits cleanly.

## 2. Static Species Search

- [ ] 2.1 Add species index source fixtures, alias overrides, and a generator that writes the runtime static Pokémon Species index.
- [ ] 2.2 Add `verify:index` so CI can fail when the committed static index is stale.
- [ ] 2.3 Add Fuse.js search over English name, slug, National Dex number variants, and aliases using weighted ranking.
- [ ] 2.4 Render Search query input and ranked Pokémon Species results in the TUI with `j/k` and arrow selection.
- [ ] 2.5 Open placeholder Detail from Search on Enter while keeping Search species-only.
- [ ] 2.6 Support exact launch arguments opening placeholder Detail and ambiguous launch arguments opening prefilled Search.
- [ ] 2.7 Verify the slice with search ranking tests for `pikachu`, `pika`, `001`, `nidoran female`, and `mr mime`, plus a manual TUI smoke run.

## 3. Default Detail From PokeAPI

- [ ] 3.1 Add user cache directory resolution with injectable test path and 30-day TTL behavior.
- [ ] 3.2 Add cached PokeAPI resource fetching by canonical URL without exposing raw responses outside the PokeAPI module.
- [ ] 3.3 Add Zod schemas for consumed Pokémon, species, varieties, and evolution-chain fields.
- [ ] 3.4 Add `PokemonDetail` model construction for a species Default Representative with name, National Dex number, types, abilities, height, weight, stats, deterministic flavor text, and Sprite reference placeholder.
- [ ] 3.5 Render real Detail fields from `PokemonDetail` instead of placeholder Detail.
- [ ] 3.6 Verify the slice with mocked PokeAPI tests, Zod boundary tests, cache TTL tests, `PokemonDetail` mapping tests, and exact-argument Detail smoke.

## 4. Loading, Error, And Offline Behavior

- [ ] 4.1 Add atomic Detail loading state so the UI swaps to a new `PokemonDetail` only after required resources are ready.
- [ ] 4.2 Add inline recoverable Detail errors with retry and return-to-Search behavior.
- [ ] 4.3 Add offline behavior where Search works from the static index, cached Detail loads offline, and uncached Detail fails recoverably.
- [ ] 4.4 Add app-state tests for loading, successful load, retry, Search fallback, cached-offline Detail, and not-cached offline errors.
- [ ] 4.5 Verify the slice with `bun test` and manual smoke using mocked or disabled network paths.

## 5. Damage Taken Panel

- [ ] 5.1 Add the selected type-matchup dependency and wrap it behind a focused `type-matchups` module.
- [ ] 5.2 Compute Damage Taken as all non-neutral attacking-type multipliers for the current Pokémon types.
- [ ] 5.3 Render the Damage Taken panel in Detail with both weaknesses and resistances while excluding neutral `1x` entries.
- [ ] 5.4 Verify the slice with representative single-type and dual-type matchup tests and a Detail render smoke test.

## 6. PokeSprite Runtime Sprite

- [ ] 6.1 Add cached PokeSprite metadata fetching and parsing for sprite slug and asset resolution.
- [ ] 6.2 Add cached PokeSprite PNG asset fetching by resolved Sprite URL.
- [ ] 6.3 Add terminal-rendered Sprite rendering in Detail from cached PokeSprite-style source artwork.
- [ ] 6.4 Keep Detail recoverable when Sprite resources fail, while surfacing the Sprite-specific error in the Detail UI.
- [ ] 6.5 Verify the slice with PokeSprite metadata fixtures, sprite cache tests, known slug mapping tests, and Detail Sprite smoke.

## 7. Shiny Sprite Toggle

- [ ] 7.1 Add Detail state for regular versus Shiny Sprite presentation.
- [ ] 7.2 Add `s` key handling in Detail only to toggle Shiny Sprite presentation.
- [ ] 7.3 Resolve and cache the shiny PokeSprite asset for the current Pokémon Form without changing species or form identity.
- [ ] 7.4 Verify the slice with state transition tests, regular/shiny cache-key tests, and Detail keymap tests.

## 8. Forms-Aware Detail

- [ ] 8.1 Add PokeAPI species varieties loading and form identity normalization for Pokémon Forms.
- [ ] 8.2 Add PokeSprite metadata mapping from Pokémon Forms to available regular and shiny Sprite assets.
- [ ] 8.3 Add `f` key handling in Detail to open a form selector with `j/k`, arrows, Enter, and Escape behavior.
- [ ] 8.4 Load form-specific `PokemonDetail` data and Sprite when a form is selected.
- [ ] 8.5 Verify the slice with form list tests, Charizard and Pikachu form mapping fixtures, form selector state tests, and form-specific Detail mapping tests.

## 9. Form Carryover

- [ ] 9.1 Add cached PokeAPI evolution-chain loading for species involved in Detail navigation.
- [ ] 9.2 Compute direct evolution relationships from evolution-chain resources without using Dex adjacency as the relationship source.
- [ ] 9.3 Apply Form Carryover during National Dex `h/l` navigation only for matching regional or form-family variants across direct evolution relationships.
- [ ] 9.4 Reset to the target species Default Representative for non-matching, cosmetic, gender, temporary, or battle-only forms.
- [ ] 9.5 Verify the slice with Galarian and Alolan carryover examples, non-carry examples, and `h/l` app-state tests.

## 10. Project Tooling And Release Workflow

- [ ] 10.1 Add Biome configuration and scripts for formatting and linting.
- [ ] 10.2 Add Fallow configuration or documented zero-config invocation and include it in `check` or `ci` as the project quality gate.
- [ ] 10.3 Add Lefthook configuration for pre-commit format/lint/related-test, pre-push typecheck, and commit-msg commitlint.
- [ ] 10.4 Add commitlint conventional configuration.
- [ ] 10.5 Add grouped Dependabot configuration for package and GitHub Actions updates.
- [ ] 10.6 Add GitHub Actions CI that runs through `devenv shell`, uses frozen `bun.lock`, runs deterministic checks, verifies generated index freshness, and smoke-tests the Linux compiled binary without live PokeAPI or PokeSprite dependencies.
- [ ] 10.7 Add release-please configuration and release workflow that publishes GitHub Releases with Linux compiled binary artifacts.
- [ ] 10.8 Verify the slice with `devenv test` where feasible, `bun run ci`, hook dry-runs where supported, workflow validation, and a local release build smoke.
