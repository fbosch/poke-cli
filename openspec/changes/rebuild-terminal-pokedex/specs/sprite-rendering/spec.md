## ADDED Requirements

### Requirement: PokeSprite resource loading
The system SHALL fetch PokeSprite metadata and Sprite assets on demand, persist metadata through TanStack Query, and cache Sprite asset files in the user cache directory.

#### Scenario: Sprite asset is cached after load
- **WHEN** Detail loads a Sprite from PokeSprite for the first time
- **THEN** the app stores the metadata and asset needed to render that Sprite in the user cache directory

#### Scenario: Cached Sprite works offline
- **WHEN** a Sprite asset is cached and network access is unavailable
- **THEN** Detail can render the cached Sprite

### Requirement: Terminal-rendered Sprite
The system SHALL render Sprites as terminal-safe visual artwork using PokeSprite-style source assets.

#### Scenario: Detail includes Sprite area
- **WHEN** Detail renders for a Pokémon
- **THEN** the UI includes a Sprite area using the selected Pokémon Form and shiny state

### Requirement: Shiny Sprite toggle
The system SHALL allow Detail to toggle between regular and Shiny Sprite presentation without changing Pokémon identity.

#### Scenario: Toggle shiny in Detail
- **WHEN** the user presses `s` in Detail
- **THEN** the app toggles the Sprite between regular and shiny presentation for the current Pokémon Form

#### Scenario: Shiny toggle does not change Search identity
- **WHEN** the user toggles Shiny Sprite presentation
- **THEN** the selected Pokémon Species and Pokémon Form identity remain unchanged
