# Use a static species index

The Terminal Pokédex App will ship a generated static index of Pokémon Species for Fuzzy Search instead of fetching the search catalog from PokeAPI at startup. This keeps the no-argument app launch fast and offline-friendly, at the cost of requiring an app release when new species need to be added.
