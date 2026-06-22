# Support forms-aware Detail

The Terminal Pokédex App will keep Search species-oriented while allowing Detail to switch between Pokémon Forms. PokeAPI species varieties define form identity and Detail data, while PokeSprite metadata maps those forms to sprite artwork; this intentionally combines two sources because neither source alone satisfies both data accuracy and the desired sprite presentation.

Species navigation remains National Dex based, but it applies Form Carryover when moving across a direct evolution relationship whose target species has the same regional or form-family variant. Direct evolution relationships come from cached PokeAPI evolution chains rather than Dex adjacency.
