## ADDED Requirements

### Requirement: Form-aware Detail
The system SHALL support Pokémon Forms inside Detail while keeping Search species-oriented.

#### Scenario: Species opens Default Representative
- **WHEN** the user opens Detail from a Pokémon Species Search result
- **THEN** the app initially displays that species' Default Representative

#### Scenario: Form selector opens from Detail
- **WHEN** the user presses `f` in Detail for a species with multiple forms
- **THEN** the app opens a form selector for that Pokémon Species

#### Scenario: Form selection updates Detail
- **WHEN** the user selects a Pokémon Form from the form selector
- **THEN** Detail loads form-specific data and Sprite for the selected Pokémon Form

### Requirement: Form source mapping
The system SHALL use PokeAPI species varieties for Pokémon Form identity and PokeSprite metadata for Sprite mapping.

#### Scenario: PokeAPI owns form identity
- **WHEN** the app lists available forms for a Pokémon Species
- **THEN** the list is based on PokeAPI species varieties

#### Scenario: PokeSprite owns form artwork mapping
- **WHEN** the app renders a Pokémon Form Sprite
- **THEN** the Sprite asset is resolved through PokeSprite metadata for that form when available

### Requirement: Form Carryover
The system SHALL preserve regional or form-family variants across National Dex navigation only when the target species is a direct evolution with the same form family.

#### Scenario: Regional evolution carries form
- **WHEN** the user is viewing a regional form and navigates by National Dex order to a direct evolution with the same regional form family
- **THEN** the target species opens with the matching regional form selected

#### Scenario: Non-matching navigation resets form
- **WHEN** the user is viewing a non-default form and navigates to a species that is not a direct evolution with the same form family
- **THEN** the target species opens with its Default Representative selected

#### Scenario: Cosmetic forms do not carry
- **WHEN** the user is viewing a cosmetic, gender, temporary, or battle-only form and navigates by National Dex order
- **THEN** the target species opens with its Default Representative selected
