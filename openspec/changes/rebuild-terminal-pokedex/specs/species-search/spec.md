## ADDED Requirements

### Requirement: Static species index
The system SHALL use a generated static Pokémon Species index for runtime Search.

#### Scenario: Search starts without network
- **WHEN** the app opens Search without network access
- **THEN** the app can still display and filter Pokémon Species from the static index

#### Scenario: Generated index is verified
- **WHEN** CI runs the generated index verification command
- **THEN** the command fails if the committed index does not match generator output

### Requirement: Fuzzy Search ranking
The system SHALL use Fuse.js to rank Pokémon Species by weighted English name, slug, National Dex number variants, and practical aliases.

#### Scenario: Name query ranks matching species
- **WHEN** the user enters `pika` in Search
- **THEN** Pikachu appears in the ranked Search results

#### Scenario: Dex query ranks matching species
- **WHEN** the user enters `001` in Search
- **THEN** Bulbasaur appears as the matching National Dex result

#### Scenario: Alias query handles special names
- **WHEN** the user enters an alias such as `nidoran female` or `mr mime`
- **THEN** the corresponding Pokémon Species appears in the ranked Search results

### Requirement: Species-only Search results
The system SHALL return Pokémon Species from Search rather than individual Pokémon Forms.

#### Scenario: Form variants do not appear as top-level Search identities
- **WHEN** the user searches for a species that has forms
- **THEN** the result list presents the Pokémon Species as the selectable identity
