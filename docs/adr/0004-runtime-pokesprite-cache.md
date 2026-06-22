# Fetch and cache PokeSprite sprites at runtime

The Terminal Pokédex App will use PokeSprite resources for Sprites, fetching sprite metadata and PNG assets on demand. Metadata will use the app's persisted TanStack Query cache with a PokeSprite-specific cache policy; PNG assets will be stored as files in the user cache directory. This preserves the sprite style wanted from the original app without bundling all sprite assets into the binary or depending on PokeAPI artwork for the visual presentation.
