## ADDED Requirements

### Requirement: PokeAPI-backed Detail model
The system SHALL build Detail from validated PokeAPI resources and expose the result as a `PokemonDetail` model.

#### Scenario: Detail includes core fields
- **WHEN** Detail loads for a Pokémon Species or Pokémon Form
- **THEN** the `PokemonDetail` includes display name, National Dex number, types, abilities, height, weight, stats, deterministic flavor text, Damage Taken, and Sprite reference information

#### Scenario: Renderer does not consume raw PokeAPI responses
- **WHEN** the Detail UI renders
- **THEN** it consumes `PokemonDetail` rather than raw PokeAPI resource objects

### Requirement: Runtime validation
The system SHALL validate external PokeAPI responses with Zod before building internal models.

#### Scenario: Invalid response fails at boundary
- **WHEN** a PokeAPI response is missing a required consumed field
- **THEN** the app treats the resource as invalid and returns a recoverable Detail loading error

### Requirement: Detail cache
The system SHALL cache raw PokeAPI resources by canonical URL in the user cache directory with a 30-day TTL.

#### Scenario: Cached Detail works offline
- **WHEN** required Detail resources are cached and network access is unavailable
- **THEN** the app can load Detail from cached resources

#### Scenario: Not-cached Detail fails recoverably offline
- **WHEN** required Detail resources are not cached and network access is unavailable
- **THEN** the app shows a recoverable not-cached error rather than exiting

#### Scenario: Expired cache refreshes
- **WHEN** a cached PokeAPI resource is older than 30 days and network access is available
- **THEN** the app refreshes the resource before building Detail

### Requirement: Damage Taken
The system SHALL show non-neutral Damage Taken multipliers for the selected Pokémon types.

#### Scenario: Resistances and weaknesses are shown
- **WHEN** Detail renders Damage Taken
- **THEN** the panel includes both weakness multipliers and resistance multipliers while excluding neutral `1x` entries

### Requirement: Deterministic flavor text
The system SHALL choose flavor text deterministically for a Pokémon Species.

#### Scenario: Flavor text remains stable
- **WHEN** the same Pokémon Species Detail is loaded repeatedly from the same data
- **THEN** the displayed flavor text remains the same
